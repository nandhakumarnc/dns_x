/**
 * src/services/aiService.js
 * REST client for AI assessment, explanation, and recommendation endpoints.
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
      if (res.status === 404) return null
      return null
    }

    const json = await res.json()
    if (!json.ok) return null
    return json.data
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn(`[aiService] Failed to fetch ${path}:`, err.message)
    return null
  }
}

/** GET /api/v1/incidents/:id/ai */
export async function getAssessment(incidentId) {
  if (!incidentId) return null
  return apiFetch(`/incidents/${encodeURIComponent(incidentId)}/ai`)
}

/** GET /api/v1/incidents/:id/explanation */
export async function getExplanation(incidentId) {
  if (!incidentId) return null
  return apiFetch(`/incidents/${encodeURIComponent(incidentId)}/explanation`)
}

/** GET /api/v1/incidents/:id/recommendation */
export async function getRecommendation(incidentId) {
  if (!incidentId) return null
  return apiFetch(`/incidents/${encodeURIComponent(incidentId)}/recommendation`)
}

export default {
  getAssessment,
  getExplanation,
  getRecommendation,
}
