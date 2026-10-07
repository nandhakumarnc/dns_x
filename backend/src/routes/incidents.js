/**
 * routes/incidents.js
 * GET    /api/v1/incidents
 * GET    /api/v1/incidents/:id
 * POST   /api/v1/incidents/:id/acknowledge
 * POST   /api/v1/incidents/:id/resolve
 */

import { Router } from 'express'
import { param, query } from 'express-validator'
import * as incidentController from '../controllers/incidentController.js'
import { validate } from '../middleware/validation.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const router = Router()

const idParam = [
  param('id').isUUID().withMessage('Incident id must be a valid UUID'),
]

router.get(
  '/incidents',
  [
    query('status').optional().isIn(['investigating', 'active', 'contained', 'resolved', 'acknowledged']),
    query('severity').optional().isIn(['low', 'medium', 'high', 'critical']),
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  incidentController.listIncidents,
)

router.get('/incidents/:id', idParam, validate, incidentController.getIncident)

router.post(
  '/incidents/:id/acknowledge',
  writeLimiter,
  idParam,
  validate,
  incidentController.acknowledgeIncident,
)

router.post(
  '/incidents/:id/resolve',
  writeLimiter,
  idParam,
  validate,
  incidentController.resolveIncident,
)

export default router
