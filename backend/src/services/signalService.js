/**
 * services/signalService.js
 *
 * Signal detection engine.
 *
 * Per tick, evaluates every resolver's live metrics against its learned
 * baseline using Z-score arithmetic. When the deviation exceeds the
 * configured threshold and the confidence is sufficient, a signal record
 * is persisted and broadcast.
 *
 * Signal types:
 *   HIGH_LATENCY      — resolver avg latency Z-score exceeds threshold
 *   QPS_SPIKE         — query rate Z-score exceeds threshold
 *   ERROR_SPIKE       — total error rate Z-score exceeds threshold
 *   CACHE_MISS_SPIKE  — cache hit rate drops (inverted Z-score)
 *   TIMEOUT_SPIKE     — timeout fraction Z-score exceeds threshold
 *   RESOLVER_DOWN     — resolver status is 'critical'
 *
 * Severity mapping (by Z-score magnitude):
 *   |z| < threshold            → no signal
 *   threshold ≤ |z| < 3.5     → low
 *   3.5 ≤ |z| < 5             → medium
 *   5 ≤ |z| < 7               → high
 *   |z| ≥ 7                   → critical
 */

import * as signalRepo from '../repositories/signalRepository.js'
import { getBaseline } from './baselineService.js'
import { zscore, zscoreToConfidence, round, clamp } from '../utils/metrics.js'
import { SIGNAL_ZSCORE_THRESHOLD, SIGNAL_MIN_CONFIDENCE } from '../config/env.js'
import { nowISO } from '../utils/timestamps.js'
import { broadcast } from './realtimeService.js'
import logger from '../config/logger.js'

// ── Dedup window: suppress re-firing the same signal type on the same resolver
// within this many ms to prevent alert floods on every tick.
const DEDUP_WINDOW_MS = 60_000   // 1 minute
const _lastFired = new Map()     // key: `${resolverId}:${type}` → timestamp ms

function _isDuplicate(resolverId, type) {
  const key = `${resolverId}:${type}`
  const last = _lastFired.get(key)
  if (last && Date.now() - last < DEDUP_WINDOW_MS) return true
  _lastFired.set(key, Date.now())
  return false
}

function _severityFromZ(absZ) {
  if (absZ >= 7)   return 'critical'
  if (absZ >= 5)   return 'high'
  if (absZ >= 3.5) return 'medium'
  return 'low'
}

// ── Check candidates ──────────────────────────────────────────────────────────

function _checkMetric(resolverId, metricKey, observed, invertDirection = false) {
  const bl = getBaseline(resolverId, metricKey)
  if (!bl || bl.count < 5) return null

  const z = zscore(observed, bl.mean, bl.stddev)
  const absZ = Math.abs(z)

  // For inverted metrics (cache_hit) a negative Z is the anomaly.
  const triggered = invertDirection ? z < -SIGNAL_ZSCORE_THRESHOLD : absZ > SIGNAL_ZSCORE_THRESHOLD
  if (!triggered) return null

  const confidence = zscoreToConfidence(absZ)
  if (confidence < SIGNAL_MIN_CONFIDENCE) return null

  return {
    deviation_score: round(z, 4),
    confidence: round(confidence, 4),
    severity: _severityFromZ(absZ),
    baseline_mean: round(bl.mean, 4),
    baseline_stddev: round(bl.stddev, 4),
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evaluate the current telemetry snapshot for signals across all resolvers.
 * Called from telemetryService.ingestMetrics on each tick.
 *
 * @param {object} snapshot
 * @returns {Promise<object[]>} — persisted signal records
 */
export async function detectSignals(snapshot) {
  const resolvers   = snapshot.infrastructure?.resolvers ?? []
  const errorRate   = (snapshot.errors?.rate     ?? 0) / 100
  const cacheHit    = (snapshot.performance?.cacheHit ?? 0) / 100
  const timeoutFrac = (snapshot.errors?.timeout  ?? 0) / 100

  const emitted = []

  for (const r of resolvers) {
    const rid = r.id

    // ── RESOLVER_DOWN ────────────────────────────────────────────────────
    if (r.status === 'critical' && !_isDuplicate(rid, 'RESOLVER_DOWN')) {
      emitted.push(await emitSignal({
        resolver_id:     rid,
        type:            'RESOLVER_DOWN',
        observed:        0,
        baseline_mean:   null,
        baseline_stddev: null,
        deviation_score: 10,
        confidence:      1,
        severity:        'critical',
        metric_key:      'status',
      }))
      continue   // no point checking sub-metrics on a down resolver
    }

    // ── HIGH_LATENCY ─────────────────────────────────────────────────────
    const latencyResult = _checkMetric(rid, 'latency', r.latency)
    if (latencyResult && !_isDuplicate(rid, 'HIGH_LATENCY')) {
      emitted.push(await emitSignal({
        resolver_id:  rid,
        type:         'HIGH_LATENCY',
        observed:     round(r.latency, 2),
        metric_key:   'latency',
        ...latencyResult,
      }))
    }

    // ── QPS_SPIKE ────────────────────────────────────────────────────────
    const qpsResult = _checkMetric(rid, 'qps', r.qps)
    if (qpsResult && !_isDuplicate(rid, 'QPS_SPIKE')) {
      emitted.push(await emitSignal({
        resolver_id:  rid,
        type:         'QPS_SPIKE',
        observed:     round(r.qps, 2),
        metric_key:   'qps',
        ...qpsResult,
      }))
    }

    // ── ERROR_SPIKE ──────────────────────────────────────────────────────
    const errorResult = _checkMetric(rid, 'error_rate', errorRate)
    if (errorResult && !_isDuplicate(rid, 'ERROR_SPIKE')) {
      emitted.push(await emitSignal({
        resolver_id:  rid,
        type:         'ERROR_SPIKE',
        observed:     round(errorRate, 4),
        metric_key:   'error_rate',
        ...errorResult,
      }))
    }

    // ── CACHE_MISS_SPIKE (inverted — a drop in cache_hit is the anomaly) ─
    const cacheResult = _checkMetric(rid, 'cache_hit', cacheHit, true)
    if (cacheResult && !_isDuplicate(rid, 'CACHE_MISS_SPIKE')) {
      emitted.push(await emitSignal({
        resolver_id:  rid,
        type:         'CACHE_MISS_SPIKE',
        observed:     round(cacheHit, 4),
        metric_key:   'cache_hit',
        ...cacheResult,
      }))
    }

    // ── TIMEOUT_SPIKE ────────────────────────────────────────────────────
    // Reuse error_rate baseline as a proxy; timeouts are a subset of errors.
    const timeoutBl = getBaseline(rid, 'error_rate')
    if (timeoutBl && timeoutBl.count >= 5) {
      const z = zscore(timeoutFrac, timeoutBl.mean * 0.04, timeoutBl.stddev * 0.04 || 0.001)
      const absZ = Math.abs(z)
      if (absZ > SIGNAL_ZSCORE_THRESHOLD) {
        const confidence = zscoreToConfidence(absZ)
        if (confidence >= SIGNAL_MIN_CONFIDENCE && !_isDuplicate(rid, 'TIMEOUT_SPIKE')) {
          emitted.push(await emitSignal({
            resolver_id:     rid,
            type:            'TIMEOUT_SPIKE',
            observed:        round(timeoutFrac, 4),
            baseline_mean:   round(timeoutBl.mean * 0.04, 4),
            baseline_stddev: round(timeoutBl.stddev * 0.04, 4),
            deviation_score: round(z, 4),
            confidence:      round(confidence, 4),
            severity:        _severityFromZ(absZ),
            metric_key:      'timeout',
          }))
        }
      }
    }
  }

  // After emitting signals, run correlation on any new uncorrelated signals.
  if (emitted.length > 0) {
    const { runCorrelation } = await import('./correlationService.js')
    runCorrelation().catch((err) => logger.error({ err }, 'Correlation error after signal emit'))
  }

  return emitted.filter(Boolean)
}

/**
 * Fetch recent signals (used by controller + overview assembly).
 * @param {object} filters
 * @returns {Promise<object[]>}
 */
export async function getRecentSignals(filters = {}) {
  return signalRepo.querySignals(filters)
}

/**
 * Persist a new signal record and broadcast it over WebSocket.
 * @param {object} signal
 * @returns {Promise<object>}
 */
export async function emitSignal(signal) {
  let record = {
    id: signal.id ?? crypto.randomUUID(),
    ...signal,
    ts: signal.ts ?? nowISO(),
  }

  try {
    const inserted = await signalRepo.insertSignal({
      ...signal,
      ts: signal.ts ?? nowISO(),
    })
    if (inserted) record = inserted
  } catch (err) {
    if (err.code !== 'PGRST205') {
      logger.warn({ err: err.message }, 'Failed to persist signal to DB')
    }
  }

  broadcast('signal.detected', record)
  logger.info(
    { type: record.type, resolver: record.resolver_id, z: record.deviation_score, severity: record.severity },
    'Signal detected',
  )
  return record
}
