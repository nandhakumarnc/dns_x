/**
 * repositories/signalRepository.js
 * Supabase queries for the signals table.
 */

import supabase from '../config/database.js'

// In-memory buffer fallback for fast querying and offline/simulation mode
const inMemorySignals = []
const MAX_BUFFER = 500

function isSimulationOrTest() {
  return (
    process.env.DNS_X_SIMULATION === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('placeholder')
  )
}

/**
 * Insert a new signal record.
 * @param {object} signal
 * @returns {Promise<object>}
 */
export async function insertSignal(signal) {
  const record = {
    id: signal.id || `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...signal,
    ts: signal.ts || new Date().toISOString(),
  }

  inMemorySignals.unshift(record)
  if (inMemorySignals.length > MAX_BUFFER) {
    inMemorySignals.pop()
  }

  if (isSimulationOrTest()) {
    return record
  }

  try {
    const { data, error } = await supabase
      .from('signals')
      .insert(signal)
      .select()
      .single()
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return record
      }
      return record
    }
    return data || record
  } catch (_err) {
    return record
  }
}

/**
 * Fetch recent signals with optional filters.
 * @param {object} filters
 * @param {string} [filters.resolver_id]
 * @param {string} [filters.type]
 * @param {string} [filters.since]   — ISO timestamp lower bound
 * @param {number} [filters.limit]
 * @returns {Promise<object[]>}
 */
export async function querySignals({ resolver_id, type, since, limit = 100 } = {}) {
  const queryMemory = () => {
    let filtered = [...inMemorySignals]
    if (resolver_id) filtered = filtered.filter((s) => s.resolver_id === resolver_id)
    if (type)        filtered = filtered.filter((s) => s.type === type)
    if (since)       filtered = filtered.filter((s) => new Date(s.ts) >= new Date(since))
    return filtered.slice(0, limit)
  }

  if (isSimulationOrTest()) {
    return queryMemory()
  }

  try {
    let q = supabase
      .from('signals')
      .select('*')
      .order('ts', { ascending: false })
      .limit(limit)

    if (resolver_id) q = q.eq('resolver_id', resolver_id)
    if (type)        q = q.eq('type', type)
    if (since)       q = q.gte('ts', since)

    const { data, error } = await q
    if (error) {
      return queryMemory()
    }
    return data ?? queryMemory()
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Fetch signals that are candidates for correlation (recent, uncorrelated).
 * @param {string} sinceIso
 * @returns {Promise<object[]>}
 */
export async function getUncorrelatedSignals(sinceIso) {
  const queryMemory = () => {
    return inMemorySignals
      .filter((s) => !s.incident_id && (!sinceIso || new Date(s.ts) >= new Date(sinceIso)))
      .sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }

  if (isSimulationOrTest()) {
    return queryMemory()
  }

  try {
    const { data, error } = await supabase
      .from('signals')
      .select('*')
      .is('incident_id', null)
      .gte('ts', sinceIso)
      .order('ts', { ascending: true })
    if (error) {
      return queryMemory()
    }
    return data ?? queryMemory()
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Mark a set of signal IDs as belonging to an incident.
 * @param {string[]} signalIds
 * @param {string} incidentId
 */
export async function assignSignalsToIncident(signalIds, incidentId) {
  const idSet = new Set(signalIds)
  for (const s of inMemorySignals) {
    if (idSet.has(s.id)) {
      s.incident_id = incidentId
    }
  }

  if (isSimulationOrTest()) {
    return
  }

  try {
    const { error } = await supabase
      .from('signals')
      .update({ incident_id: incidentId })
      .in('id', signalIds)
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      throw error
    }
  } catch (_err) {
    // Non-fatal fallback to in-memory state
  }
}


