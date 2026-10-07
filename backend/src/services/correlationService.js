/**
 * services/correlationService.js
 *
 * Signal correlation engine.
 *
 * Responsibility:
 *   Groups related uncorrelated signals that arrive within a time window
 *   into a single Incident to prevent alert fatigue. An incident is opened
 *   when CORRELATION_MIN_SIGNALS or more uncorrelated signals exist that
 *   share a resolver_id OR fall within CORRELATION_WINDOW_MS of each other.
 *
 * Grouping algorithm:
 *   1. Fetch all signals that are unassigned to an incident and created
 *      within the last CORRELATION_WINDOW_MS milliseconds.
 *   2. Build groups: seed with the first unvisited signal, absorb any
 *      other signal that shares the same resolver_id OR whose ts is within
 *      CORRELATION_WINDOW_MS of a signal already in the group.
 *   3. Groups with count >= CORRELATION_MIN_SIGNALS → create an Incident.
 *   4. Link all group signals to the incident via incident_signals.
 *   5. Trigger ML classification of the new incident (async, non-blocking).
 *
 * Severity of the incident = max severity of its constituent signals.
 */

import { CORRELATION_WINDOW_MS, CORRELATION_MIN_SIGNALS } from '../config/env.js'
import * as signalRepo from '../repositories/signalRepository.js'
import * as incidentRepo from '../repositories/incidentRepository.js'
import { broadcast } from './realtimeService.js'
import { nowISO, windowStart } from '../utils/timestamps.js'
import logger from '../config/logger.js'

// Severity ranking for max-severity calculation.
const SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 }
const RANK_SEVERITY = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' }

// ── Title generation ──────────────────────────────────────────────────────────

const TYPE_LABELS = {
  HIGH_LATENCY:     'High latency',
  QPS_SPIKE:        'Query rate spike',
  ERROR_SPIKE:      'Error rate spike',
  CACHE_MISS_SPIKE: 'Cache miss spike',
  TIMEOUT_SPIKE:    'Timeout spike',
  RESOLVER_DOWN:    'Resolver down',
}

function _buildTitle(signals) {
  const types   = [...new Set(signals.map((s) => s.type))]
  const resolvers = [...new Set(signals.map((s) => s.resolver_id).filter(Boolean))]

  if (types.length === 1) {
    const label = TYPE_LABELS[types[0]] ?? types[0]
    return resolvers.length === 1
      ? `${label} on ${resolvers[0]}`
      : `${label} across ${resolvers.length} resolvers`
  }

  return resolvers.length === 1
    ? `Multiple anomalies on ${resolvers[0]}`
    : `Correlated anomalies across ${resolvers.length} resolvers`
}

function _maxSeverity(signals) {
  const maxRank = signals.reduce((max, s) => {
    const rank = SEVERITY_RANK[s.severity] ?? 1
    return rank > max ? rank : max
  }, 1)
  return RANK_SEVERITY[maxRank] ?? 'low'
}

// ── Grouping ──────────────────────────────────────────────────────────────────

function _groupSignals(signals) {
  const used = new Set()
  const groups = []

  for (let i = 0; i < signals.length; i++) {
    if (used.has(i)) continue

    const group = [signals[i]]
    used.add(i)

    for (let j = i + 1; j < signals.length; j++) {
      if (used.has(j)) continue

      const candidate = signals[j]

      // Accept if same resolver as ANY signal already in the group
      const sameResolver = group.some((s) => s.resolver_id && s.resolver_id === candidate.resolver_id)

      // Accept if within time window of ANY signal already in the group
      const withinWindow = group.some((s) => {
        const delta = Math.abs(new Date(s.ts).getTime() - new Date(candidate.ts).getTime())
        return delta <= CORRELATION_WINDOW_MS
      })

      if (sameResolver || withinWindow) {
        group.push(candidate)
        used.add(j)
      }
    }

    groups.push(group)
  }

  return groups
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run the correlation pass.
 * Called by signalService after each signal emission batch.
 * @returns {Promise<object[]>} — newly created incident records
 */
export async function runCorrelation() {
  const since = windowStart('1m', Math.ceil(CORRELATION_WINDOW_MS / 60_000))
  const uncorrelated = await signalRepo.getUncorrelatedSignals(since.toISOString())

  if (uncorrelated.length < CORRELATION_MIN_SIGNALS) return []

  const groups = _groupSignals(uncorrelated)
  const created = []

  for (const group of groups) {
    if (group.length < CORRELATION_MIN_SIGNALS) continue

    const affectedResolvers = [...new Set(group.map((s) => s.resolver_id).filter(Boolean))]
    const severity  = _maxSeverity(group)
    const title     = _buildTitle(group)
    const signalIds = group.map((s) => s.id)

    let incident = {
      id: crypto.randomUUID(),
      title,
      severity,
      status:             'investigating',
      affected_resolvers: affectedResolvers,
      started_at:         nowISO(),
    }

    try {
      const inserted = await incidentRepo.insertIncident({
        title,
        severity,
        status:             'investigating',
        affected_resolvers: affectedResolvers,
        started_at:         nowISO(),
      })
      if (inserted) incident = inserted

      // Link signals → incident (join table + update signal.incident_id)
      await Promise.allSettled([
        incidentRepo.linkSignalsToIncident(incident.id, signalIds),
        signalRepo.assignSignalsToIncident(signalIds, incident.id),
      ])
    } catch (err) {
      if (err.code !== 'PGRST205') {
        logger.warn({ err: err.message }, 'Failed to persist incident to DB')
      }
    }

    broadcast('incident.created', incident)
    logger.info({ id: incident.id, title, severity, signals: signalIds.length }, 'Incident created')

    created.push(incident)

    // Trigger async ML classification — non-blocking
    const { classifyIncident } = await import('./aiService.js')
    classifyIncident(incident.id).catch((err) =>
      logger.error({ err, incidentId: incident.id }, 'ML classification failed'),
    )
  }

  return created
}
