/**
 * src/services/alertService.js
 * REST client for alert integration management.
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

    const json = await res.json()
    if (!json.ok) throw new Error(json.error?.message ?? `API error ${res.status}`)
    return json.data
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

/** GET /api/v1/alerts/integrations */
export async function getIntegrations() {
  return apiFetch('/alerts/integrations')
}

/** POST /api/v1/alerts/integrations */
export async function createIntegration(payload) {
  return apiFetch('/alerts/integrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/** PATCH /api/v1/alerts/integrations/:id */
export async function updateIntegration(id, patch) {
  return apiFetch(`/alerts/integrations/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

/** DELETE /api/v1/alerts/integrations/:id */
export async function deleteIntegration(id) {
  return apiFetch(`/alerts/integrations/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export default {
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
}
