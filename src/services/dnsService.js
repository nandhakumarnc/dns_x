/**
 * src/services/dnsService.js
 * REST API client for DNS telemetry, infrastructure, incidents, and signals.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api/v1'
const API_KEY  = import.meta.env.VITE_API_KEY      ?? ''

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
    ...options.headers,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? 8000)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      let errMsg = `API error ${res.status}`
      let details = null
      let status = null
      let reason = null
      try {
        const errJson = await res.json()
        errMsg = errJson.error?.message ?? errMsg
        details = errJson.error?.details ?? null
        status = errJson.error?.status ?? null
        reason = errJson.error?.reason ?? null
      } catch {
        // ignore parse failure
      }
      const err = new Error(errMsg)
      if (details) err.details = details
      if (status) err.status = status
      if (reason) err.reason = reason
      throw err
    }

    const json = await res.json()
    if (!json.ok) {
      throw new Error(json.error?.message ?? 'API returned failure status')
    }
    return json.data
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error(`API request timed out: ${path}`)
    }
    throw err
  }
}

// ── Overview ──────────────────────────────────────────────────────────────────

/** GET /api/v1/overview — unified DNS operational state snapshot */
export async function getOverview() {
  return apiFetch('/overview')
}

// ── Infrastructure ────────────────────────────────────────────────────────────

/** GET /api/v1/infrastructure */
export async function getInfrastructure() {
  return apiFetch('/infrastructure')
}

/**
 * GET /api/v1/infrastructure/resolvers/:id/metrics
 * @param {string} id
 * @param {'1m'|'5m'|'1h'} window
 * @param {number} limit
 */
export async function getResolverMetrics(id, window = '5m', limit = 60) {
  return apiFetch(`/infrastructure/resolvers/${encodeURIComponent(id)}/metrics?window=${window}&limit=${limit}`)
}

// ── Incidents ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/incidents
 * @param {object} filters — { status, severity, limit, offset }
 */
export async function getIncidents(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status)   params.set('status',   filters.status)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.limit)    params.set('limit',    String(filters.limit))
  if (filters.offset)   params.set('offset',   String(filters.offset))
  const qs = params.toString()
  return apiFetch(`/incidents${qs ? `?${qs}` : ''}`)
}

/** GET /api/v1/incidents/:id */
export async function getIncident(id) {
  return apiFetch(`/incidents/${encodeURIComponent(id)}`)
}

/** POST /api/v1/incidents/:id/acknowledge */
export async function acknowledgeIncident(id) {
  return apiFetch(`/incidents/${encodeURIComponent(id)}/acknowledge`, { method: 'POST' })
}

/** POST /api/v1/incidents/:id/resolve */
export async function resolveIncident(id) {
  return apiFetch(`/incidents/${encodeURIComponent(id)}/resolve`, { method: 'POST' })
}

// ── Signals ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/signals
 * @param {object} filters — { resolver_id, type, since, limit }
 */
export async function getSignals(filters = {}) {
  const params = new URLSearchParams()
  if (filters.resolver_id) params.set('resolver_id', filters.resolver_id)
  if (filters.type)        params.set('type',        filters.type)
  if (filters.since)       params.set('since',       filters.since)
  if (filters.limit)       params.set('limit',       String(filters.limit))
  const qs = params.toString()
  return apiFetch(`/signals${qs ? `?${qs}` : ''}`)
}

// ── Settings ──────────────────────────────────────────────────────────────────

/** GET /api/v1/settings */
export async function getSettings() {
  return apiFetch('/settings')
}

/** PATCH /api/v1/settings */
export async function updateSettings(patch) {
  return apiFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

// ── Real DNS Measurement Probing ─────────────────────────────────────────────

/**
 * POST /api/v1/dns/validate — perform real target validation (syntax, DNS, HTTP reachability)
 * @param {string} target
 */
export async function validateDomainTarget(target) {
  return apiFetch('/dns/validate', {
    method: 'POST',
    body: JSON.stringify({ target }),
    timeout: 15000,
  })
}

/**
 * POST /api/v1/dns/probe — execute live probe on target domain
 * @param {string} target
 */
export async function probeDomain(target) {
  return apiFetch('/dns/probe', {
    method: 'POST',
    body: JSON.stringify({ target }),
    timeout: 15000,
  })
}

/**
 * POST /api/v1/dns/target — register active target for periodic probing
 * @param {string} target
 */
export async function setActiveTarget(target) {
  return apiFetch('/dns/target', {
    method: 'POST',
    body: JSON.stringify({ target }),
  })
}

/**
 * DELETE /api/v1/dns/target — stop active target probing
 */
export function clearActiveTarget() {
  return apiFetch('/dns/target', {
    method: 'DELETE',
  })
}

// ── Health ────────────────────────────────────────────────────────────────────

/** GET /api/v1/health */
export async function checkHealth() {
  return apiFetch('/health')
}

export default {
  getOverview,
  getInfrastructure,
  getResolverMetrics,
  getIncidents,
  getIncident,
  acknowledgeIncident,
  resolveIncident,
  getSignals,
  getSettings,
  updateSettings,
  checkHealth,
  validateDomainTarget,
  probeDomain,
  setActiveTarget,
  clearActiveTarget,
}
