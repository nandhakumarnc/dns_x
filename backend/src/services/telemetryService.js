/**
 * services/telemetryService.js
 *
 * Telemetry ingestion pipeline.
 *
 * Startup modes:
 *   SIMULATION  — synthetic scenario generator drives ingestMetrics() each tick
 *   LIVE        — Python collector pushes payloads via POST /internal/telemetry
 *
 * Per-tick pipeline (ingestMetrics):
 *   1. Update in-memory snapshot (instant frontend read)
 *   2. Record per-resolver observations into the aggregation buckets
 *   3. Persist gateway-level upstream_metrics (1m floor)
 *   4. Flush any completed window aggregates to DB (1m / 5m / 1h)
 *   5. Update per-resolver in-memory baselines
 *   6. Broadcast telemetry.updated + resolver.updated over WebSocket
 *
 * The pipeline is intentionally non-blocking: DB writes run in the background
 * and never delay the in-memory snapshot update or the WebSocket broadcast.
 */

import { DNS_X_SIMULATION } from '../config/env.js'
import logger from '../config/logger.js'
import { broadcast } from './realtimeService.js'
import { recordObservation, flushIfDue, persistUpstreamMetric, schedulePruning } from './aggregationService.js'
import { updateBaseline } from './baselineService.js'
import { detectSignals } from './signalService.js'

// ── In-memory snapshot ────────────────────────────────────────────────────────
// Updated synchronously on every tick. Read by infrastructureService and the
// overview controller with no DB round-trip.
let _currentSnapshot = null

export function getCurrentTelemetrySnapshot() {
  return _currentSnapshot
}

export function setCurrentTelemetrySnapshot(snapshot) {
  _currentSnapshot = snapshot
}

// ── Startup ───────────────────────────────────────────────────────────────────

/**
 * Start the telemetry service. Called once on server startup after DB verify.
 */
export async function startTelemetryService() {
  // Schedule nightly metric retention pruning (default: 30 days).
  schedulePruning(30)

  if (DNS_X_SIMULATION) {
    logger.info('Telemetry service starting in SIMULATION mode')
    const { startSimulation } = await import('./simulationService.js')
    startSimulation()
  } else {
    logger.info('Telemetry service starting in LIVE mode — awaiting collector push')
    // Live mode: the Python collector calls POST /internal/telemetry.
    // No interval is started here; ingestMetrics() is invoked by the route handler.
  }
}

// ── Ingest pipeline ───────────────────────────────────────────────────────────

/**
 * Main entry point for a single telemetry tick.
 * Accepts the full snapshot produced by the simulation service or the Python
 * collector and runs it through the entire pipeline.
 *
 * Payload shape (must match the liveState.js contract):
 * {
 *   timestamp: number,
 *   system:        { status, health },
 *   traffic:       { qps, peakQps, averageQps },
 *   performance:   { latency, cacheHit },
 *   errors:        { nxdomain, servfail, timeout, rate, dominant, trend },
 *   infrastructure: {
 *     gateway:   { status, qps },
 *     resolvers: [{ id, name, status, latency, qps }],
 *     cache:     { status, hitRate },
 *   },
 *   ai: { anomalyScore, outageRisk, confidence, baseline, severity,
 *         assessment, signal, recommendation },
 * }
 *
 * @param {object} payload
 */
export async function ingestMetrics(payload) {
  // ── 1. Update in-memory snapshot immediately ───────────────────────────────
  _currentSnapshot = payload

  // ── 2 & 5. Record observations + update baselines (synchronous, in-memory) ─
  const resolvers = payload.infrastructure?.resolvers ?? []
  const errorRate = (payload.errors?.rate ?? 0) / 100   // fraction 0-1
  const cacheHit  = (payload.performance?.cacheHit ?? 0) / 100

  for (const r of resolvers) {
    const obs = {
      latency:    r.latency    ?? 0,
      qps:        r.qps        ?? 0,
      error_rate: errorRate,
      nxdomain:   (payload.errors?.nxdomain ?? 0) / 100,
      servfail:   (payload.errors?.servfail  ?? 0) / 100,
      timeout:    (payload.errors?.timeout   ?? 0) / 100,
      cache_hit:  cacheHit,
    }

    recordObservation(r.id, obs)
    updateBaseline(r.id, obs)
  }

  // ── 3, 4. Persist to DB (async, non-blocking) ──────────────────────────────
  // Run DB writes in the background — failures are logged but never surface
  // to the caller, keeping the tick fast.
  _persistAsync(payload).catch((err) => {
    logger.error({ err }, 'Background metric persistence error')
  })

  // ── 6. Broadcast over WebSocket ────────────────────────────────────────────
  broadcast('telemetry.updated', payload)

  // Broadcast individual resolver state changes.
  for (const r of resolvers) {
    broadcast('resolver.updated', {
      id:      r.id,
      name:    r.name,
      status:  r.status,
      latency: r.latency,
      qps:     r.qps,
      ts:      payload.timestamp,
    })
  }
}

/**
 * Background persistence tasks. Called from ingestMetrics via _persistAsync.
 * Errors here are caught by the caller and logged; they do not affect the tick.
 * @param {object} payload
 */
async function _persistAsync(payload) {
  await Promise.all([
    persistUpstreamMetric(payload),   // gateway-level 1m row
    flushIfDue(),                     // flush completed 1m/5m/1h window aggregates
    detectSignals(payload),           // Z-score signal detection → signals + correlation
  ])
}
