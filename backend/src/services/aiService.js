/**
 * services/aiService.js
 *
 * Bridge between Node.js and the Python ML engine.
 *
 * Communication:
 *   - Spawns ml/main.py via child_process.spawn
 *   - Sends a JSON request over stdin, reads a JSON response from stdout
 *   - Times out after ML_TIMEOUT_MS and falls back gracefully
 *
 * DB write pattern:
 *   classifyIncident() → writes to ai_assessments, ai_explanations, ai_recommendations
 *   getAssessment/getExplanation/getRecommendation() → reads those tables
 *
 * All read functions return null (not an error) when no record exists yet —
 * the API controller maps null → 404.
 */

import { spawn }     from 'child_process'
import supabase      from '../config/database.js'
import logger        from '../config/logger.js'
import { nowISO }    from '../utils/timestamps.js'
import { broadcast } from './realtimeService.js'
import { PYTHON_BIN, ML_SCRIPT_PATH, ML_TIMEOUT_MS } from '../config/env.js'
import { round }     from '../utils/metrics.js'
import * as incidentRepo from '../repositories/incidentRepository.js'

// ── Python ML bridge ──────────────────────────────────────────────────────────

/**
 * Run the Python ML script with a JSON request and return the parsed response.
 * @param {object} request
 * @returns {Promise<object>}  — { ok: true, result: { ... } } or throws
 */
async function _runML(request) {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, [ML_SCRIPT_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn ML process: ${err.message}`))
    })

    proc.on('close', (code) => {
      if (stderr) logger.warn({ stderr: stderr.slice(0, 500) }, 'ML process stderr')

      try {
        const parsed = JSON.parse(stdout.trim())
        if (!parsed.ok) {
          reject(new Error(`ML process error: ${parsed.error ?? 'unknown'}`))
        } else {
          resolve(parsed)
        }
      } catch {
        reject(new Error(`ML process returned non-JSON: ${stdout.slice(0, 200)}`))
      }
    })

    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      reject(new Error(`ML process timed out after ${ML_TIMEOUT_MS}ms`))
    }, ML_TIMEOUT_MS)

    proc.on('close', () => clearTimeout(timer))

    proc.stdin.write(JSON.stringify(request))
    proc.stdin.end()
  })
}

// ── Feature extraction from incident ─────────────────────────────────────────

/**
 * Build the ML feature vector from an incident + its signals.
 * @param {object} incident  — with nested incident_signals → signals
 * @returns {object}  feature dict
 */
function _buildFeatures(incident) {
  const signals = (incident.incident_signals ?? []).map((is) => is.signals ?? is)

  // Aggregate Z-scores by signal type
  const byType = {}
  for (const s of signals) {
    if (!byType[s.type]) byType[s.type] = []
    byType[s.type].push(s)
  }

  const maxZ = (type) => {
    const arr = byType[type] ?? []
    return arr.length ? Math.max(...arr.map((s) => Math.abs(s.deviation_score ?? 0))) : 0
  }

  const maxConf = signals.length
    ? Math.max(...signals.map((s) => s.confidence ?? 0))
    : 0

  // Use the first HIGH_LATENCY signal's observed value as latency_abs
  const latencySignal  = (byType['HIGH_LATENCY'] ?? [])[0]
  const errorSignal    = (byType['ERROR_SPIKE']   ?? [])[0]

  return {
    latency_z:       round(maxZ('HIGH_LATENCY'),  4),
    qps_z:           round(maxZ('QPS_SPIKE'),      4),
    error_rate_z:    round(maxZ('ERROR_SPIKE'),    4),
    cache_hit_z:     round(maxZ('CACHE_MISS_SPIKE'), 4),
    timeout_z:       round(maxZ('TIMEOUT_SPIKE'), 4),
    n_signals:       signals.length,
    n_resolvers:     (incident.affected_resolvers ?? []).length || 1,
    max_confidence:  round(maxConf, 4),
    latency_abs:     round(latencySignal?.observed ?? 0, 2),
    error_rate_abs:  round(errorSignal?.observed   ?? 0, 4),
  }
}

// ── Action recommendations ────────────────────────────────────────────────────

function _buildRecommendations(classificationResult) {
  const { dominant_class, outage_risk, outage_risk_level } = classificationResult

  const base = []

  if (dominant_class === 'SECURITY') {
    base.push(
      { priority: 1, action: 'Review query sources for amplification or spoofing patterns', rationale: 'Security classification with elevated QPS and timeout signals' },
      { priority: 2, action: 'Enable query rate limiting on affected resolvers', rationale: 'Prevent resource exhaustion during active threat' },
      { priority: 3, action: 'Capture packet traces for forensic analysis', rationale: 'Evidence preservation for incident post-mortem' },
    )
  } else if (dominant_class === 'NETWORK') {
    base.push(
      { priority: 1, action: 'Check upstream connectivity and routing tables', rationale: 'Network classification with timeout and latency signals' },
      { priority: 2, action: 'Verify BGP adjacencies and DNS forwarder health', rationale: 'Network path degradation is the primary hypothesis' },
      { priority: 3, action: 'Consider failover to secondary resolver cluster', rationale: 'Reduce impact while root cause is investigated' },
    )
  } else if (dominant_class === 'OPERATIONAL') {
    base.push(
      { priority: 1, action: 'Inspect resolver CPU and memory utilisation', rationale: 'Operational classification suggests resource saturation' },
      { priority: 2, action: 'Review cache configuration and TTL policies', rationale: 'Cache miss spike may be amplifying resolver load' },
      { priority: 3, action: 'Consider horizontal scaling of the resolver pool', rationale: 'QPS increase may exceed current capacity' },
    )
  } else {
    base.push(
      { priority: 1, action: 'Continue monitoring — insufficient data to classify root cause', rationale: 'Unknown classification; await additional signals' },
    )
  }

  if (outage_risk_level === 'critical' || outage_risk_level === 'high') {
    base.unshift({ priority: 0, action: 'Escalate incident to on-call team immediately', rationale: `Outage risk is ${outage_risk.toFixed(0)}% — potential service impact` })
  }

  return base
}

// ── Public API — classify ─────────────────────────────────────────────────────

/**
 * Classify an incident using the Python ML pipeline.
 * Writes results to ai_assessments, ai_explanations, ai_recommendations.
 * Broadcasts ai.assessment.updated over WebSocket.
 *
 * Falls back to rule-based classification if Python is unavailable.
 *
 * @param {string} incidentId
 */
export async function classifyIncident(incidentId) {
  // 1. Load the incident with its nested signals
  const incident = await incidentRepo.getIncidentById(incidentId)
  if (!incident) {
    logger.warn({ incidentId }, 'classifyIncident: incident not found')
    return
  }

  const features = _buildFeatures(incident)

  let classResult, explainResult

  try {
    // 2. Run classification
    const classResp = await _runML({ action: 'classify', incident_id: incidentId, features })
    classResult = classResp.result

    // 3. Run explanation
    const explainResp = await _runML({ action: 'explain', incident_id: incidentId, features })
    explainResult = explainResp.result

  } catch (err) {
    logger.warn({ err, incidentId }, 'ML process unavailable — using rule-based fallback')

    // Fallback: run Python-equivalent rule-based logic inline via JS
    classResult = _jsFallbackClassify(features)
    explainResult = _jsFallbackExplain(features, incidentId)
  }

  const ts = nowISO()

  // 4. Persist assessment
  try {
    const { data: assessment, error: ae } = await supabase
      .from('ai_assessments')
      .insert({
        incident_id:      incidentId,
        operational_prob: classResult.operational_prob,
        network_prob:     classResult.network_prob,
        security_prob:    classResult.security_prob,
        unknown_prob:     classResult.unknown_prob,
        confidence:       classResult.confidence,
        outage_risk:      classResult.outage_risk,
        outage_risk_level: classResult.outage_risk_level,
        model_version:    classResult.model_version ?? 'fallback-1.0',
        ts,
      })
      .select()
      .single()
    if (ae && ae.code !== 'PGRST205' && !ae.message?.includes('schema cache')) {
      logger.error({ ae }, 'Failed to persist AI assessment')
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) {
      logger.error({ err }, 'Failed to persist AI assessment')
    }
  }

  // 5. Persist explanation
  try {
    const { error: ee } = await supabase
      .from('ai_explanations')
      .insert({
        incident_id: incidentId,
        features:    explainResult.features ?? [],
        narrative:   explainResult.narrative ?? '',
      })
    if (ee && ee.code !== 'PGRST205' && !ee.message?.includes('schema cache')) {
      logger.error({ ee }, 'Failed to persist AI explanation')
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) {
      logger.error({ err }, 'Failed to persist AI explanation')
    }
  }

  // 6. Persist recommendations
  try {
    const actions = _buildRecommendations(classResult)
    const { error: re } = await supabase
      .from('ai_recommendations')
      .insert({ incident_id: incidentId, actions })
    if (re && re.code !== 'PGRST205' && !re.message?.includes('schema cache')) {
      logger.error({ re }, 'Failed to persist AI recommendations')
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) {
      logger.error({ err }, 'Failed to persist AI recommendations')
    }
  }

  // 7. Broadcast
  broadcast('ai.assessment.updated', {
    incident_id: incidentId,
    assessment: classResult,
    explanation: explainResult,
  })

  // 8. Update incident root_cause_class + risk_level
  await supabase
    .from('incidents')
    .update({
      root_cause_class: classResult.dominant_class,
      risk_level:       classResult.outage_risk_level,
      updated_at:       ts,
    })
    .eq('id', incidentId)

  logger.info({ incidentId, class: classResult.dominant_class, risk: classResult.outage_risk }, 'AI classification complete')
}

// ── JS fallbacks (used when Python is unavailable / no model trained) ─────────

function _jsFallbackClassify(fv) {
  const lat  = Math.abs(fv.latency_z)
  const qps  = Math.abs(fv.qps_z)
  const err  = Math.abs(fv.error_rate_z)
  const tout = Math.abs(fv.timeout_z)

  const security    = Math.min(1, (qps * 0.4 + tout * 0.4 + err * 0.2) / 3)
  const network     = Math.min(1, (tout * 0.5 + lat * 0.3 + err * 0.2) / 2)
  const operational = Math.min(1, (lat * 0.5 + err * 0.3 + qps * 0.2) / 2)
  const total       = security + network + operational + 0.05

  const probs = {
    OPERATIONAL: operational / total,
    NETWORK:     network     / total,
    SECURITY:    security    / total,
    UNKNOWN:     0.05        / total,
  }
  const dominant = Object.entries(probs).reduce((a, b) => (b[1] > a[1] ? b : a))[0]

  const anomalyScore = Math.min(1, (lat * 0.30 + err * 0.25 + tout * 0.20 + qps * 0.15 + Math.abs(fv.cache_hit_z) * 0.10) / 5)
  const outageRisk   = Math.min(100, anomalyScore * 60 + ((lat + err + tout + qps + Math.abs(fv.cache_hit_z)) / 5) * 8)
  const riskLevel    = outageRisk >= 70 ? 'critical' : outageRisk >= 45 ? 'high' : outageRisk >= 20 ? 'elevated' : 'low'

  return {
    operational_prob:  round(probs.OPERATIONAL, 4),
    network_prob:      round(probs.NETWORK,     4),
    security_prob:     round(probs.SECURITY,    4),
    unknown_prob:      round(probs.UNKNOWN,     4),
    confidence:        round(probs[dominant],   4),
    outage_risk:       round(outageRisk, 1),
    outage_risk_level: riskLevel,
    dominant_class:    dominant,
    anomaly_score:     round(anomalyScore, 4),
    model_version:     'js-rule-based-1.0',
  }
}

function _jsFallbackExplain(fv, incidentId) {
  const weights = {
    latency_z: 0.30, error_rate_z: 0.25, qps_z: 0.20,
    timeout_z: 0.15, cache_hit_z: 0.10,
  }
  const features = Object.entries(weights).map(([name, w]) => ({
    name,
    shap_value: round(Math.abs(fv[name] ?? 0) * w, 4),
    direction:  (fv[name] ?? 0) >= 0 ? 'increase' : 'decrease',
  })).sort((a, b) => b.shap_value - a.shap_value)

  const top = features.slice(0, 2).map((f) => `${f.direction === 'increase' ? 'elevated' : 'reduced'} ${f.name.replace('_z', '')}`)
  const narrative = top.length ? `Assessment driven primarily by ${top.join(' and ')}.` : 'Insufficient data for detailed explanation.'

  return { incident_id: incidentId, features, narrative }
}

// ── Public API — read ─────────────────────────────────────────────────────────

/**
 * Return the latest AI assessment for an incident.
 * @param {string} incidentId
 * @returns {Promise<object|null>}
 */
export async function getAssessment(incidentId) {
  try {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('incident_id', incidentId)
      .order('ts', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return null
      throw error
    }
    return data
  } catch (err) {
    if (err.code === 'PGRST205' || err.message?.includes('schema cache')) return null
    throw err
  }
}

/**
 * Return the SHAP-based explanation for an incident.
 * @param {string} incidentId
 * @returns {Promise<object|null>}
 */
export async function getExplanation(incidentId) {
  try {
    const { data, error } = await supabase
      .from('ai_explanations')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return null
      throw error
    }
    return data
  } catch (err) {
    if (err.code === 'PGRST205' || err.message?.includes('schema cache')) return null
    throw err
  }
}

/**
 * Return the recommended response actions for an incident.
 * @param {string} incidentId
 * @returns {Promise<object|null>}
 */
export async function getRecommendation(incidentId) {
  try {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return null
      throw error
    }
    return data
  } catch (err) {
    if (err.code === 'PGRST205' || err.message?.includes('schema cache')) return null
    throw err
  }
}

