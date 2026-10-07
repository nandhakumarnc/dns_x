/**
 * repositories/incidentRepository.js
 * Supabase queries for incidents, incident_signals, and related AI tables.
 */

import supabase from '../config/database.js'

// In-memory buffer fallback for fast querying and offline/simulation mode
const inMemoryIncidents = []
const MAX_BUFFER = 200

function isSimulationOrTest() {
  return (
    process.env.DNS_X_SIMULATION === 'true' ||
    process.env.NODE_ENV === 'test' ||
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL.includes('placeholder')
  )
}

/**
 * Insert a new incident.
 * @param {object} incident
 * @returns {Promise<object>}
 */
export async function insertIncident(incident) {
  const record = {
    id: incident.id || `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...incident,
    created_at: incident.started_at || new Date().toISOString(),
  }

  inMemoryIncidents.unshift(record)
  if (inMemoryIncidents.length > MAX_BUFFER) {
    inMemoryIncidents.pop()
  }

  if (isSimulationOrTest()) {
    return record
  }

  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert(incident)
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
 * Fetch incidents with optional status/severity filters.
 * @param {object} filters
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function queryIncidents({ status, severity, limit = 50, offset = 0 } = {}) {
  const queryMemory = () => {
    let filtered = [...inMemoryIncidents]
    if (status)   filtered = filtered.filter((i) => i.status === status)
    if (severity) filtered = filtered.filter((i) => i.severity === severity)
    const total = filtered.length
    return { data: filtered.slice(offset, offset + limit), total }
  }

  if (isSimulationOrTest()) {
    return queryMemory()
  }

  try {
    let q = supabase
      .from('incidents')
      .select('*, incident_signals(signal_id)', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status)   q = q.eq('status', status)
    if (severity) q = q.eq('severity', severity)

    const { data, count, error } = await q
    if (error) {
      return queryMemory()
    }
    return { data: data ?? [], total: count ?? (data?.length ?? 0) }
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Fetch a single incident with its related signals and AI assessment.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getIncidentById(id) {
  const fromMemory = inMemoryIncidents.find((i) => i.id === id) ?? null

  if (isSimulationOrTest()) {
    return fromMemory
  }

  try {
    const { data, error } = await supabase
      .from('incidents')
      .select(`
        *,
        incident_signals ( signal_id, signals(*) ),
        ai_assessments (*),
        ai_explanations (*),
        ai_recommendations (*)
      `)
      .eq('id', id)
      .maybeSingle()
    if (error) {
      return fromMemory
    }
    return data || fromMemory
  } catch (_err) {
    return fromMemory
  }
}

/**
 * Update incident fields (status, resolved_at, etc.).
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<object|null>}
 */
export async function updateIncident(id, patch) {
  const existing = inMemoryIncidents.find((i) => i.id === id)
  if (existing) {
    Object.assign(existing, patch, { updated_at: new Date().toISOString() })
  }

  if (isSimulationOrTest()) {
    return existing || { id, ...patch }
  }

  try {
    const { data, error } = await supabase
      .from('incidents')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle()
    if (error) {
      return existing || { id, ...patch, updated_at: new Date().toISOString() }
    }
    return data || existing || { id, ...patch }
  } catch (_err) {
    return existing || { id, ...patch, updated_at: new Date().toISOString() }
  }
}

/**
 * Fetch only non-resolved incidents (used for active-incident count).
 * @returns {Promise<object[]>}
 */
export async function getActiveIncidents() {
  const queryMemory = () => {
    return inMemoryIncidents.filter(
      (i) => i.status !== 'resolved' && i.status !== 'acknowledged'
    )
  }

  if (isSimulationOrTest()) {
    return queryMemory()
  }

  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('id, title, severity, status, started_at')
      .not('status', 'in', '("resolved","acknowledged")')
      .order('started_at', { ascending: false })
    if (error) {
      return queryMemory()
    }
    return data ?? queryMemory()
  } catch (_err) {
    return queryMemory()
  }
}

/**
 * Insert rows into the incident_signals join table.
 * @param {string} incidentId
 * @param {string[]} signalIds
 */
export async function linkSignalsToIncident(incidentId, signalIds) {
  const inc = inMemoryIncidents.find((i) => i.id === incidentId)
  if (inc) {
    inc.signal_ids = Array.from(new Set([...(inc.signal_ids || []), ...signalIds]))
  }

  if (isSimulationOrTest()) {
    return
  }

  try {
    const rows = signalIds.map((signal_id) => ({ incident_id: incidentId, signal_id }))
    const { error } = await supabase.from('incident_signals').insert(rows)
    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      throw error
    }
  } catch (_err) {
    // Non-fatal in-memory fallback
  }
}


