#!/usr/bin/env python3
"""
ml/main.py
Entry point for the DNS_X Python ML engine.

Called by the Node.js aiService.js bridge via child_process.spawn.

Protocol:
  stdin  → JSON: { "action": "classify", "incident_id": "...", "features": { ... } }
  stdout → JSON: { "ok": true, "result": { ... } }
  stderr → plain-text error messages (logged by the Node.js bridge)

Actions:
  classify     → XGBoost incident classification + Isolation Forest anomaly score
  explain      → SHAP feature explanation for a given feature vector
  predict_risk → Outage risk prediction (0–100)
"""

import sys
import json
import traceback


def main():
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            _error("Empty stdin")
            return

        request = json.loads(raw)
        action  = request.get("action", "classify")

        if action == "classify":
            result = classify(request)
        elif action == "explain":
            result = explain(request)
        elif action == "predict_risk":
            result = predict_risk(request)
        else:
            _error(f"Unknown action: {action}")
            return

        print(json.dumps({"ok": True, "result": result}))

    except Exception as e:
        _error(str(e))
        sys.stderr.write(traceback.format_exc())


def _error(msg: str):
    print(json.dumps({"ok": False, "error": msg}))


# ── Classification ────────────────────────────────────────────────────────────

def classify(request: dict) -> dict:
    """
    Classify an incident into OPERATIONAL / NETWORK / SECURITY / UNKNOWN.
    Uses XGBoost when a trained model is available; falls back to rule-based
    heuristics when no model file exists (safe for fresh deployments).
    """
    features = request.get("features", {})
    incident_id = request.get("incident_id", "")

    # Extract feature vector
    fv = _extract_features(features)

    # Attempt XGBoost classification
    probs = _xgboost_classify(fv)

    # Isolation Forest anomaly score
    anomaly_score = _isolation_forest_score(fv)

    # Outage risk (0–100) derived from anomaly score + feature magnitudes
    outage_risk = _compute_outage_risk(fv, anomaly_score)

    dominant_class = max(probs, key=lambda k: probs[k])
    confidence = probs[dominant_class]

    return {
        "incident_id":       incident_id,
        "operational_prob":  round(probs["OPERATIONAL"], 4),
        "network_prob":      round(probs["NETWORK"],     4),
        "security_prob":     round(probs["SECURITY"],    4),
        "unknown_prob":      round(probs["UNKNOWN"],     4),
        "confidence":        round(confidence, 4),
        "outage_risk":       round(outage_risk, 1),
        "outage_risk_level": _risk_level(outage_risk),
        "dominant_class":    dominant_class,
        "anomaly_score":     round(anomaly_score, 4),
        "model_version":     _model_version(),
    }


def explain(request: dict) -> dict:
    """
    Produce SHAP feature impact values for the given feature vector.
    Falls back to magnitude-based approximate impact when SHAP is unavailable.
    """
    features = request.get("features", {})
    incident_id = request.get("incident_id", "")
    fv = _extract_features(features)

    shap_values = _compute_shap(fv)

    # Build narrative
    top = sorted(shap_values, key=lambda x: abs(x["shap_value"]), reverse=True)[:3]
    narrative = _build_narrative(top, features)

    return {
        "incident_id": incident_id,
        "features":    shap_values,
        "narrative":   narrative,
    }


def predict_risk(request: dict) -> dict:
    """
    Predict outage risk level (0–100) and time horizon.
    """
    features    = request.get("features", {})
    incident_id = request.get("incident_id", "")
    fv = _extract_features(features)

    anomaly_score = _isolation_forest_score(fv)
    risk = _compute_outage_risk(fv, anomaly_score)

    return {
        "incident_id":  incident_id,
        "outage_risk":  round(risk, 1),
        "risk_level":   _risk_level(risk),
        "horizon_mins": _risk_horizon(risk),
    }


# ── Feature engineering ───────────────────────────────────────────────────────

FEATURE_NAMES = [
    "latency_z",
    "qps_z",
    "error_rate_z",
    "cache_hit_z",
    "timeout_z",
    "n_signals",
    "n_resolvers",
    "max_confidence",
    "latency_abs",
    "error_rate_abs",
]


def _extract_features(raw: dict) -> dict:
    """Normalise raw feature dict into a clean vector."""
    return {
        "latency_z":       float(raw.get("latency_z",       0)),
        "qps_z":           float(raw.get("qps_z",           0)),
        "error_rate_z":    float(raw.get("error_rate_z",    0)),
        "cache_hit_z":     float(raw.get("cache_hit_z",     0)),
        "timeout_z":       float(raw.get("timeout_z",       0)),
        "n_signals":       float(raw.get("n_signals",       1)),
        "n_resolvers":     float(raw.get("n_resolvers",     1)),
        "max_confidence":  float(raw.get("max_confidence",  0.5)),
        "latency_abs":     float(raw.get("latency_abs",     0)),
        "error_rate_abs":  float(raw.get("error_rate_abs",  0)),
    }


# ── XGBoost classification ────────────────────────────────────────────────────

def _xgboost_classify(fv: dict) -> dict:
    """
    Classify using XGBoost if a trained model exists on disk.
    Falls back to deterministic rule-based heuristics otherwise.

    The model is trained separately (ml/train.py) and saved to ml/model.json.
    In simulation/dev mode the file won't exist — fallback handles that case
    cleanly without raising an exception.
    """
    import os
    model_path = os.path.join(os.path.dirname(__file__), "model.json")

    if os.path.exists(model_path):
        try:
            import xgboost as xgb  # type: ignore
            import numpy as np     # type: ignore
            model = xgb.XGBClassifier()
            model.load_model(model_path)
            arr = np.array([[fv[k] for k in FEATURE_NAMES]])
            proba = model.predict_proba(arr)[0]
            # XGBoost label order: OPERATIONAL=0, NETWORK=1, SECURITY=2, UNKNOWN=3
            return {
                "OPERATIONAL": float(proba[0]),
                "NETWORK":     float(proba[1]),
                "SECURITY":    float(proba[2]),
                "UNKNOWN":     float(proba[3]),
            }
        except Exception as e:
            sys.stderr.write(f"XGBoost inference error (using fallback): {e}\n")

    return _rule_based_classify(fv)


def _rule_based_classify(fv: dict) -> dict:
    """
    Deterministic rule-based classification as a fallback.
    Produces calibrated probability estimates without requiring training data.
    """
    latency_z = abs(fv["latency_z"])
    qps_z     = abs(fv["qps_z"])
    error_z   = abs(fv["error_rate_z"])
    timeout_z = abs(fv["timeout_z"])

    # Security indicators: high QPS + high timeout (possible DDoS / amplification)
    security_score = min(1.0, (qps_z * 0.4 + timeout_z * 0.4 + error_z * 0.2) / 3.0)

    # Network indicators: high timeout + moderate latency + moderate error
    network_score = min(1.0, (timeout_z * 0.5 + latency_z * 0.3 + error_z * 0.2) / 2.0)

    # Operational: high latency + error (resolver overload pattern)
    operational_score = min(1.0, (latency_z * 0.5 + error_z * 0.3 + qps_z * 0.2) / 2.0)

    total = security_score + network_score + operational_score + 0.05
    return {
        "OPERATIONAL": operational_score / total,
        "NETWORK":     network_score     / total,
        "SECURITY":    security_score    / total,
        "UNKNOWN":     0.05              / total,
    }


# ── Isolation Forest ──────────────────────────────────────────────────────────

def _isolation_forest_score(fv: dict) -> float:
    """
    Returns an anomaly score in [0, 1] using Isolation Forest.
    Falls back to a simple magnitude-based score if scikit-learn is unavailable.
    """
    import os
    model_path = os.path.join(os.path.dirname(__file__), "isolation_forest.pkl")

    if os.path.exists(model_path):
        try:
            import pickle
            import numpy as np  # type: ignore
            with open(model_path, "rb") as f:
                iso = pickle.load(f)
            arr = np.array([[fv[k] for k in FEATURE_NAMES]])
            # decision_function: more negative → more anomalous
            raw_score = iso.decision_function(arr)[0]
            # Map to [0,1]: score of -0.5 → 1.0, score of 0.5 → 0.0
            return float(min(1.0, max(0.0, 0.5 - raw_score)))
        except Exception as e:
            sys.stderr.write(f"Isolation Forest inference error (using fallback): {e}\n")

    # Fallback: normalised sum of absolute Z-scores
    z_sum = (
        abs(fv["latency_z"])    * 0.30 +
        abs(fv["qps_z"])        * 0.20 +
        abs(fv["error_rate_z"]) * 0.25 +
        abs(fv["timeout_z"])    * 0.15 +
        abs(fv["cache_hit_z"])  * 0.10
    )
    return min(1.0, z_sum / 5.0)


# ── SHAP explainability ───────────────────────────────────────────────────────

def _compute_shap(fv: dict) -> list:
    """
    Compute SHAP feature impact values.
    Uses the shap library when available; approximates with normalised Z-scores
    otherwise.
    """
    import os
    model_path = os.path.join(os.path.dirname(__file__), "model.json")

    if os.path.exists(model_path):
        try:
            import shap           # type: ignore
            import xgboost as xgb # type: ignore
            import numpy as np    # type: ignore
            model = xgb.XGBClassifier()
            model.load_model(model_path)
            arr = np.array([[fv[k] for k in FEATURE_NAMES]])
            explainer = shap.TreeExplainer(model)
            shap_vals = explainer.shap_values(arr)[0]  # first row, dominant class
            return [
                {
                    "name":       FEATURE_NAMES[i],
                    "shap_value": float(shap_vals[i]),
                    "direction":  "increase" if shap_vals[i] > 0 else "decrease",
                }
                for i in range(len(FEATURE_NAMES))
            ]
        except Exception as e:
            sys.stderr.write(f"SHAP error (using fallback): {e}\n")

    # Fallback: approximate impact = |z| * feature weight
    weights = {
        "latency_z": 0.30, "qps_z": 0.20, "error_rate_z": 0.25,
        "cache_hit_z": 0.10, "timeout_z": 0.15, "n_signals": 0.05,
        "n_resolvers": 0.03, "max_confidence": 0.04,
        "latency_abs": 0.04, "error_rate_abs": 0.04,
    }
    results = []
    for name in FEATURE_NAMES:
        val = fv[name]
        impact = abs(val) * weights.get(name, 0.01)
        results.append({
            "name":       name,
            "shap_value": round(impact, 4),
            "direction":  "increase" if val > 0 else "decrease",
        })
    return sorted(results, key=lambda x: abs(x["shap_value"]), reverse=True)


# ── Outage risk ───────────────────────────────────────────────────────────────

def _compute_outage_risk(fv: dict, anomaly_score: float) -> float:
    """
    Outage risk score in [0, 100].
    Weighted combination of anomaly score and raw feature magnitudes.
    """
    signal_intensity = (
        abs(fv["latency_z"])    * 0.25 +
        abs(fv["error_rate_z"]) * 0.30 +
        abs(fv["timeout_z"])    * 0.20 +
        abs(fv["qps_z"])        * 0.15 +
        abs(fv["cache_hit_z"])  * 0.10
    )
    base = anomaly_score * 60 + (signal_intensity / 5) * 40
    return min(100.0, max(0.0, base))


def _risk_level(risk: float) -> str:
    if risk >= 70: return "critical"
    if risk >= 45: return "high"
    if risk >= 20: return "elevated"
    return "low"


def _risk_horizon(risk: float) -> int:
    """Estimated minutes to potential outage based on risk level."""
    if risk >= 70: return 5
    if risk >= 45: return 15
    if risk >= 20: return 60
    return 0


# ── Narrative builder ─────────────────────────────────────────────────────────

_FEATURE_HUMAN = {
    "latency_z":      "resolver latency",
    "qps_z":          "query volume",
    "error_rate_z":   "DNS error rate",
    "cache_hit_z":    "cache hit ratio",
    "timeout_z":      "timeout rate",
    "n_signals":      "signal count",
    "n_resolvers":    "affected resolvers",
    "max_confidence": "detection confidence",
    "latency_abs":    "absolute latency",
    "error_rate_abs": "absolute error rate",
}


def _build_narrative(top_features: list, raw: dict) -> str:
    if not top_features:
        return "Insufficient data for detailed explanation."

    parts = []
    for f in top_features[:2]:
        label = _FEATURE_HUMAN.get(f["name"], f["name"])
        direction = "elevated" if f["direction"] == "increase" else "reduced"
        parts.append(f"{direction} {label}")

    return f"Assessment driven primarily by {' and '.join(parts)}."


def _model_version() -> str:
    import os
    model_path = os.path.join(os.path.dirname(__file__), "model.json")
    return "xgboost-1.0" if os.path.exists(model_path) else "rule-based-fallback-1.0"


if __name__ == "__main__":
    main()
