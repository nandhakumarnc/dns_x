/**
 * services/aggregationService.js
 *
 * Time-window metric aggregation engine.
 *
 * Responsibility:
 *   Each telemetry tick delivers a per-resolver snapshot (latency, qps, errors,
 *   cache_hit). This service accumulates those observations in memory and rolls
 *   them up into the three configured DB windows:
 *
 *     1m  — flushed every minute  (60 s)
 *     5m  — flushed every 5 mins  (300 s)
 *     1h  — flushed every hour    (3600 s)
 *
 * Flush is driven by wall-clock boundary crossing, not by tick count, so the
 * aggregates align to real calendar minutes/hours regardless of tick interval.
 *
 * DB writes use batch upsert (one round-trip per window per flush) so the
 * number of DB calls is bounded even under high-frequency simulation mode.
 *
 * Window data shape persisted to resolver_metrics:
 *   { resolver_id, window, ts, qps, latency_p50, latency_p95, latency_avg,
 *     error_rate, nxdomain_rate, servfail_rate, timeout_rate, cache_hit,
 *     sample_count }
 */

import {
  mean,
  stddev,
  percentile,
  round,
} from '../utils/metrics.js'
import { floorToWindow, windowStart } from '../utils/timestamps.js'
import { METRIC_WINDOWS } from '../config/env.js'
import * as telemetryRepo from '../repositories/telemetryRepository.js'
import logger from '../config/logger.js'

// ── In-memory accumulator ─────────────────────────────────────────────────────
// Structure:
//   accumulators[window][resolverId] = {
//     windowTs: Date,        — floored timestamp of the current window bucket
//     samples: {
//       latency:    number[],
//       qps:        number[],
//       error_rate: number[],
//       nxdomain:   number[],
//       servfail:   number[],
//       timeout:    number[],
//       cache_hit:  number[],
//     }
//   }
const accumulators = {}

for (const w of METRIC_WINDOWS) {
  accumulators[w] = {}
}

// Track when each window was last flushed (wall-clock).
const lastFlush = {}
for (const w of METRIC_WINDOWS) {
  lastFlush[w] = floorToWindow(Date.now(), w)
}

// ── Window durations in milliseconds ─────────────────────────────────────────
const WINDOW_MS = { '1m': 60_000, '5m': 300_000, '1h': 3_600_000 }

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Record a resolver metric observation into the in-memory accumulators.
 * Call once per resolver per telemetry tick.
 *
 * @param {string} resolverId
 * @param {object} obs   — observation object
 * @param {number} obs.latency     — response latency in ms
 * @param {number} obs.qps         — queries per second at this tick
 * @param {number} obs.error_rate  — total error fraction (0–1)
 * @param {number} obs.nxdomain    — NXDOMAIN fraction
 * @param {number} obs.servfail    — SERVFAIL fraction
 * @param {number} obs.timeout     — timeout fraction
 * @param {number} obs.cache_hit   — cache hit fraction (0–1)
 */
export function recordObservation(resolverId, obs) {
  for (const w of METRIC_WINDOWS) {
    const windowTs = floorToWindow(Date.now(), w)

    if (!accumulators[w][resolverId]) {
      accumulators[w][resolverId] = _emptyBucket(windowTs)
    }

    const bucket = accumulators[w][resolverId]

    // If the wall-clock has advanced to a new window boundary, start fresh.
    // (The flush below will pick up the completed bucket before it was reset.)
    if (windowTs.getTime() > bucket.windowTs.getTime()) {
      bucket.samples = _emptySamples()
      bucket.windowTs = windowTs
    }

    bucket.samples.latency.push(obs.latency)
    bucket.samples.qps.push(obs.qps)
    bucket.samples.error_rate.push(obs.error_rate)
    bucket.samples.nxdomain.push(obs.nxdomain)
    bucket.samples.servfail.push(obs.servfail)
    bucket.samples.timeout.push(obs.timeout)
    bucket.samples.cache_hit.push(obs.cache_hit)
  }
}

/**
 * Check whether any window boundaries have been crossed and flush completed
 * windows to the DB. Call on every telemetry tick.
 *
 * @returns {Promise<void>}
 */
export async function flushIfDue() {
  const now = Date.now()
  const flushPromises = []

  for (const w of METRIC_WINDOWS) {
    const dueAt = lastFlush[w].getTime() + WINDOW_MS[w]
    if (now >= dueAt) {
      flushPromises.push(_flushWindow(w, now))
    }
  }

  if (flushPromises.length) {
    await Promise.all(flushPromises)
  }
}

/**
 * Force an immediate flush of all windows regardless of boundary timing.
 * Used on graceful shutdown so the final partial window is not lost.
 * @returns {Promise<void>}
 */
export async function flushAll() {
  await Promise.all(METRIC_WINDOWS.map((w) => _flushWindow(w, Date.now())))
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _emptySamples() {
  return {
    latency:    [],
    qps:        [],
    error_rate: [],
    nxdomain:   [],
    servfail:   [],
    timeout:    [],
    cache_hit:  [],
  }
}

function _emptyBucket(windowTs) {
  return { windowTs, samples: _emptySamples() }
}

/**
 * Aggregate all resolver buckets for the given window and persist to DB.
 * @param {'1m'|'5m'|'1h'} w
 * @param {number} nowMs
 */
async function _flushWindow(w, nowMs) {
  const flushTs   = lastFlush[w]           // the window that just completed
  const nextFlush = new Date(flushTs.getTime() + WINDOW_MS[w])
  lastFlush[w]    = nextFlush              // advance BEFORE any await

  const rows = []

  for (const [resolverId, bucket] of Object.entries(accumulators[w])) {
    const s = bucket.samples

    if (s.latency.length === 0) continue   // no observations in this window

    const latencySorted = [...s.latency].sort((a, b) => a - b)

    rows.push({
      resolver_id:   resolverId,
      window:        w,
      ts:            flushTs.toISOString(),
      qps:           round(mean(s.qps)),
      latency_avg:   round(mean(s.latency)),
      latency_p50:   round(percentile(latencySorted, 50)),
      latency_p95:   round(percentile(latencySorted, 95)),
      error_rate:    round(mean(s.error_rate), 4),
      nxdomain_rate: round(mean(s.nxdomain),   4),
      servfail_rate: round(mean(s.servfail),   4),
      timeout_rate:  round(mean(s.timeout),    4),
      cache_hit:     round(mean(s.cache_hit),  4),
      sample_count:  s.latency.length,
    })

    // Reset bucket for the next window period.
    accumulators[w][resolverId] = _emptyBucket(nextFlush)
  }

  if (!rows.length) return

  try {
    await telemetryRepo.batchUpsertResolverMetrics(rows)
    logger.debug(
      { window: w, resolvers: rows.length, ts: flushTs.toISOString() },
      'Metrics flushed to DB',
    )
  } catch (err) {
    if (err.code !== 'PGRST205') {
      logger.error({ err, window: w }, 'Failed to flush metrics to DB')
    }
    // Non-fatal: in-memory snapshot is still live for the frontend.
  }
}

// ── Upstream (gateway) aggregate ──────────────────────────────────────────────

/**
 * Persist a gateway-level 1m aggregate derived from the current snapshot.
 * Called by telemetryService on each tick; rounds to the 1m bucket.
 *
 * @param {object} snapshot  — full telemetry payload from the ingest pipeline
 * @returns {Promise<void>}
 */
export async function persistUpstreamMetric(snapshot) {
  const ts = floorToWindow(snapshot.timestamp, '1m').toISOString()

  const row = {
    ts,
    total_qps:     round(snapshot.traffic?.qps      ?? 0),
    nxdomain_rate: round(snapshot.errors?.nxdomain  ?? 0, 4),
    servfail_rate: round(snapshot.errors?.servfail  ?? 0, 4),
    timeout_rate:  round(snapshot.errors?.timeout   ?? 0, 4),
    error_rate:    round(snapshot.errors?.rate       ?? 0, 4),
    latency_avg:   round(snapshot.performance?.latency ?? 0),
    cache_hit:     round((snapshot.performance?.cacheHit ?? 0) / 100, 4),
    health_score:  round(snapshot.system?.health ?? 0, 1),
  }

  try {
    await telemetryRepo.upsertUpstreamMetric(row)
  } catch (err) {
    if (err.code !== 'PGRST205') {
      logger.error({ err }, 'Failed to persist upstream metric')
    }
  }
}

// ── Retention pruning ─────────────────────────────────────────────────────────

/**
 * Schedule a daily pruning job to remove old metric rows.
 * Retention period comes from the system_settings table (metric_retention_days).
 * @param {number} retentionDays
 */
export function schedulePruning(retentionDays = 30) {
  const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000   // once per day

  async function prune() {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const cutoffIso = cutoff.toISOString()

    try {
      await Promise.all([
        telemetryRepo.pruneMetrics(cutoffIso, '1m'),
        telemetryRepo.pruneMetrics(cutoffIso, '5m'),
        telemetryRepo.pruneMetrics(cutoffIso, '1h'),
        telemetryRepo.pruneUpstreamMetrics(cutoffIso),
      ])
      logger.info({ cutoff: cutoffIso, retentionDays }, 'Metric retention pruning completed')
    } catch (err) {
      logger.error({ err }, 'Metric retention pruning failed')
    }
  }

  // Run immediately on startup then every 24 hours.
  prune()
  setInterval(prune, PRUNE_INTERVAL_MS).unref()
}
