/**
 * services/incidentService.js
 * Incident lifecycle management.
 *
 * Statuses:  investigating → active → contained → resolved / acknowledged
 */

import * as incidentRepo from '../repositories/incidentRepository.js'
import { broadcast } from './realtimeService.js'
import { nowISO } from '../utils/timestamps.js'
import logger from '../config/logger.js'

/**
 * List incidents with optional filters.
 * @param {object} filters
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function listIncidents(filters) {
  return incidentRepo.queryIncidents(filters)
}

/**
 * Fetch a single incident by id (with related signals + AI data).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getIncidentById(id) {
  return incidentRepo.getIncidentById(id)
}

/**
 * Return only non-resolved/non-acknowledged incidents (for overview).
 * @returns {Promise<object[]>}
 */
export async function getActiveIncidents() {
  return incidentRepo.getActiveIncidents()
}

/**
 * Create a new incident from a correlated set of signals.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function createIncident({ title, severity, affectedResolvers, signalIds }) {
  const incident = await incidentRepo.insertIncident({
    title,
    severity,
    status: 'investigating',
    affected_resolvers: affectedResolvers,
    started_at: nowISO(),
  })

  if (signalIds?.length) {
    await incidentRepo.linkSignalsToIncident(incident.id, signalIds)
  }

  broadcast('incident.created', incident)
  logger.info({ id: incident.id, title, severity }, 'Incident created')
  return incident
}

/**
 * Acknowledge an incident (suppresses further alerts).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function acknowledgeIncident(id) {
  const incident = await incidentRepo.updateIncident(id, { status: 'acknowledged' })
  if (incident) broadcast('incident.updated', incident)
  return incident
}

/**
 * Resolve an incident (marks it closed with a resolution timestamp).
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function resolveIncident(id) {
  const incident = await incidentRepo.updateIncident(id, {
    status: 'resolved',
    resolved_at: nowISO(),
  })
  if (incident) broadcast('incident.updated', incident)
  return incident
}
