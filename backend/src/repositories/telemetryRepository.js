/**
 * repositories/telemetryRepository.js
 * Low-level Supabase queries for resolver_metrics and upstream_metrics tables.
 */

import supabase from '../config/database.js'

// In-memory buffer fallback for fast querying and offline/simulation mode
const inMemoryResolverMetrics = []
const inMemoryUpstreamMetrics = []
const MAX_METRICS = 300

function isSimulationOrTest() {
  return (
    process.env.DNS_X_SIMULATION === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('placeholder')
  )
}

// ── resolver_metrics ──────────────────────────────────────────────────────────

/**
 * Upsert a single aggregated metric row for a resolver + window.
 * @param {object} row
 */
export async function upsertResolverMetric(row) {
  inMemoryResolverMetrics.unshift(row)
  if (inMemoryResolverMetrics.length > MAX_METRICS) inMemoryResolverMetrics.pop()

  if (isSimulationOrTest()) return

  try {
    const { error } = await supabase
      .from('resolver_metrics')
      .upsert(row, { onConflict: 'resolver_id,window,ts' })
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      // non-fatal
    }
  } catch (_err) {
    // non-fatal fallback to in-memory
  }
}

/**
 * Batch upsert multiple resolver metric rows in one round-trip.
 * All rows must be for the same window type (enforced by caller).
 * @param {object[]} rows
 */
export async function batchUpsertResolverMetrics(rows) {
  if (!rows.length) return
  for (const r of rows) {
    inMemoryResolverMetrics.unshift(r)
  }
  if (inMemoryResolverMetrics.length > MAX_METRICS) {
    inMemoryResolverMetrics.splice(MAX_METRICS)
  }

  if (isSimulationOrTest()) return

  try {
    const { error } = await supabase
      .from('resolver_metrics')
      .upsert(rows, { onConflict: 'resolver_id,window,ts' })
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      // non-fatal
    }
  } catch (_err) {
    // non-fatal
  }
}

/**
 * Fetch the last N metric rows for a given resolver and window,
 * ordered oldest-first (useful for chart rendering and baseline seeding).
 * @param {string} resolverId
 * @param {'1m'|'5m'|'1h'} window
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export async function getResolverMetrics(resolverId, window, limit = 60) {
  const queryMemory = () => {
    return inMemoryResolverMetrics
      .filter((r) => r.resolver_id === resolverId && (!window || r.window === window))
      .slice(0, limit)
      .reverse()
  }

  if (isSimulationOrTest()) return queryMemory()

  try {
    const { data, error } = await supabase
      .from('resolver_metrics')
      .select('*')
      .eq('resolver_id', resolverId)
      .eq('window', window)
      .order('ts', { ascending: false })
      .limit(limit)
    if (error) {
      return queryMemory()
    }
    return (data ?? []).reverse()
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Fetch the last N 1-minute rows for every resolver in one query.
 * Returns a flat array; callers group by resolver_id.
 * Used by baseline seeding on startup.
 * @param {number} limit  — per-resolver row count (default = BASELINE_WINDOW_COUNT)
 * @returns {Promise<object[]>}
 */
export async function getAllResolverBaselines(limit = 60) {
  const queryMemory = () => {
    return inMemoryResolverMetrics
      .filter((r) => r.window === '1m')
      .slice(0, limit * 20)
  }

  if (isSimulationOrTest()) return queryMemory()

  try {
    const { data, error } = await supabase
      .from('resolver_metrics')
      .select('resolver_id, ts, latency_avg, qps, error_rate, cache_hit')
      .eq('window', '1m')
      .order('resolver_id', { ascending: true })
      .order('ts', { ascending: false })
      .limit(limit * 20)
    if (error) {
      return queryMemory()
    }
    return data ?? queryMemory()
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Fetch a single resolver's most recent 1m metric row.
 * @param {string} resolverId
 * @returns {Promise<object|null>}
 */
export async function getLatestResolverMetric(resolverId) {
  try {
    const { data, error } = await supabase
      .from('resolver_metrics')
      .select('*')
      .eq('resolver_id', resolverId)
      .eq('window', '1m')
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

// ── upstream_metrics ──────────────────────────────────────────────────────────

/**
 * Upsert the upstream (gateway-level) aggregate for a given 1m timestamp.
 * @param {object} row
 */
export async function upsertUpstreamMetric(row) {
  try {
    const { error } = await supabase
      .from('upstream_metrics')
      .upsert(row, { onConflict: 'ts' })
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      throw error
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) throw err
  }
}

/**
 * Fetch recent upstream metric rows (chronological, oldest first).
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export async function getRecentUpstreamMetrics(limit = 60) {
  try {
    const { data, error } = await supabase
      .from('upstream_metrics')
      .select('*')
      .order('ts', { ascending: false })
      .limit(limit)
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) return []
      throw error
    }
    return (data ?? []).reverse()
  } catch (err) {
    if (err.code === 'PGRST205' || err.message?.includes('schema cache')) return []
    throw err
  }
}

// ── maintenance ───────────────────────────────────────────────────────────────

/**
 * Delete resolver_metrics rows older than the given ISO timestamp for a window.
 * Called by the nightly pruning job.
 * @param {string} beforeIso
 * @param {'1m'|'5m'|'1h'} window
 */
export async function pruneMetrics(beforeIso, window) {
  try {
    const { error } = await supabase
      .from('resolver_metrics')
      .delete()
      .eq('window', window)
      .lt('ts', beforeIso)
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      throw error
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) throw err
  }
}

/**
 * Delete upstream_metrics rows older than the given ISO timestamp.
 * @param {string} beforeIso
 */
export async function pruneUpstreamMetrics(beforeIso) {
  try {
    const { error } = await supabase
      .from('upstream_metrics')
      .delete()
      .lt('ts', beforeIso)
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      throw error
    }
  } catch (err) {
    if (err.code !== 'PGRST205' && !err.message?.includes('schema cache')) throw err
  }
}

