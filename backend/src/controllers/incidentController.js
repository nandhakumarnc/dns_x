/**
 * controllers/incidentController.js
 */

import { success } from '../utils/response.js'
import { errors } from '../utils/response.js'
import * as incidentService from '../services/incidentService.js'

/** GET /api/v1/incidents */
export async function listIncidents(req, res, next) {
  try {
    const filters = {
      status:   req.query.status,
      severity: req.query.severity,
      limit:    parseInt(req.query.limit  ?? '50', 10),
      offset:   parseInt(req.query.offset ?? '0',  10),
    }
    const { data, total } = await incidentService.listIncidents(filters)
    return success(res, data, 200, { total, limit: filters.limit, offset: filters.offset })
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/incidents/:id */
export async function getIncident(req, res, next) {
  try {
    const incident = await incidentService.getIncidentById(req.params.id)
    if (!incident) return errors.notFound(res, `Incident not found: ${req.params.id}`)
    return success(res, incident)
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/incidents/:id/acknowledge */
export async function acknowledgeIncident(req, res, next) {
  try {
    const incident = await incidentService.acknowledgeIncident(req.params.id)
    if (!incident) return errors.notFound(res, `Incident not found: ${req.params.id}`)
    return success(res, incident)
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/incidents/:id/resolve */
export async function resolveIncident(req, res, next) {
  try {
    const incident = await incidentService.resolveIncident(req.params.id)
    if (!incident) return errors.notFound(res, `Incident not found: ${req.params.id}`)
    return success(res, incident)
  } catch (err) {
    next(err)
  }
}
