/**
 * services/baselineService.js
 *
 * Rolling per-resolver baseline statistics.
 *
 * Maintains an in-memory circular buffer of the last BASELINE_WINDOW_COUNT
 * 1-minute metric observations per resolver. On each telemetry tick the buffer
 * is updated (updateBaseline). signalService queries it (getBaseline) to compute
 * Z-scores without a DB round-trip.
 *
 * On startup, seedBaselinesFromDB() pre-populates the buffers from historical
 * DB data so signal detection is accurate from the first tick rather than
 * needing to warm up organically.
 */

import { mean, stddev } from '../utils/metrics.js'
import { BASELINE_WINDOW_COUNT } from '../config/env.js'
import { getAllResolverBaselines } from '../repositories/telemetryRepository.js'
import logger from '../config/logger.js'

// ── In-memory baseline store ──────────────────────────────────────────────────
// Map<resolverId, { latency: number[], qps: number[], error_rate: number[], cache_hit: number[] }>
const _baselines = new Map()

// ── Metric keys stored in the buffer ─────────────────────────────────────────
const METRIC_KEYS = ['latency', 'qps', 'error_rate', 'cache_hit']

// ── Mapping from DB column names → buffer keys ────────────────────────────────
const DB_COL_MAP = {
  latency_avg: 'latency',
  qps:         'qps',
  error_rate:  'error_rate',
  cache_hit:   'cache_hit',
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Update the in-memory baseline buffer for one resolver with a new observation.
 * Called on every telemetry tick by telemetryService.
 *
 * @param {string} resolverId
 * @param {object} obs  — { latency, qps, error_rate, cache_hit }
 */
export function updateBaseline(resolverId, obs) {
  if (!_baselines.has(resolverId)) {
    _baselines.set(resolverId, { latency: [], qps: [], error_rate: [], cache_hit: [] })
  }

  const b = _baselines.get(resolverId)

  for (const key of METRIC_KEYS) {
    const val = obs[key]
    if (val !== undefined && Number.isFinite(val)) {
      b[key].push(val)
      // Keep only the most recent BASELINE_WINDOW_COUNT observations.
      if (b[key].length > BASELINE_WINDOW_COUNT) b[key].shift()
    }
  }
}

/**
 * Return the baseline statistics for a single resolver metric.
 * Returns null if fewer than 5 observations are available (not yet warm).
 *
 * @param {string} resolverId
 * @param {'latency'|'qps'|'error_rate'|'cache_hit'} metricKey
 * @returns {{ mean: number, stddev: number, count: number } | null}
 */
export function getBaseline(resolverId, metricKey) {
  const b = _baselines.get(resolverId)
  if (!b || !b[metricKey] || b[metricKey].length < 5) return null

  const values = b[metricKey]
  const mu     = mean(values)
  const sigma  = stddev(values, mu)

  return { mean: mu, stddev: sigma, count: values.length }
}

/**
 * Return a summary of all baselines (used for debugging / admin endpoints).
 * @returns {object}
 */
export function getAllBaselines() {
  const out = {}
  for (const [id, b] of _baselines.entries()) {
    out[id] = {}
    for (const key of METRIC_KEYS) {
      const bl = getBaseline(id, key)
      out[id][key] = bl ?? { mean: null, stddev: null, count: b[key].length }
    }
  }
  return out
}

/**
 * Seed in-memory baselines from historical 1-minute DB rows.
 * Runs once on server startup so signal detection is warm from tick 1.
 *
 * Strategy:
 *   1. Fetch up to (BASELINE_WINDOW_COUNT × 20) recent 1m rows across all resolvers.
 *   2. Group by resolver_id, cap each resolver to the most recent BASELINE_WINDOW_COUNT.
 *   3. Push into the in-memory buffer in chronological order.
 */
export async function seedBaselinesFromDB() {
  let rows
  try {
    rows = await getAllResolverBaselines(BASELINE_WINDOW_COUNT)
  } catch (err) {
    logger.warn({ err }, 'Baseline seeding failed — proceeding with empty baselines')
    return
  }

  if (!rows || rows.length === 0) {
    logger.info('No historical metrics found — baselines will warm up organically')
    return
  }

  // Group rows by resolver_id, keep only the most recent BASELINE_WINDOW_COUNT per resolver.
  const grouped = new Map()
  for (const row of rows) {
    if (!grouped.has(row.resolver_id)) grouped.set(row.resolver_id, [])
    grouped.get(row.resolver_id).push(row)
  }

  let seededCount = 0

  for (const [resolverId, resolverRows] of grouped.entries()) {
    // Rows come back newest-first from the DB query; reverse to get chronological.
    const chronological = resolverRows
      .slice(0, BASELINE_WINDOW_COUNT)
      .reverse()

    for (const row of chronological) {
      updateBaseline(resolverId, {
        latency:    row.latency_avg  ?? 0,
        qps:        row.qps          ?? 0,
        error_rate: row.error_rate   ?? 0,
        cache_hit:  row.cache_hit    ?? 0,
      })
    }

    seededCount++
  }

  logger.info(
    { resolvers: seededCount, samplesPerResolver: BASELINE_WINDOW_COUNT },
    'Baselines seeded from DB',
  )
}
