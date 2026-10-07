/**
 * routes/alerts.js
 * GET    /api/v1/alerts/integrations
 * POST   /api/v1/alerts/integrations
 * PATCH  /api/v1/alerts/integrations/:id
 * DELETE /api/v1/alerts/integrations/:id
 */

import { Router } from 'express'
import { param, body } from 'express-validator'
import * as alertController from '../controllers/alertController.js'
import { validate } from '../middleware/validation.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const router = Router()

const idParam = [param('id').isUUID().withMessage('Integration id must be a valid UUID')]

router.get('/alerts/integrations', alertController.listIntegrations)

router.post(
  '/alerts/integrations',
  writeLimiter,
  [
    body('type').isIn(['webhook', 'email', 'pagerduty']).withMessage('type must be webhook, email, or pagerduty'),
    body('config').isObject().withMessage('config must be an object'),
  ],
  validate,
  alertController.createIntegration,
)

router.patch(
  '/alerts/integrations/:id',
  writeLimiter,
  idParam,
  validate,
  alertController.updateIntegration,
)

router.delete(
  '/alerts/integrations/:id',
  writeLimiter,
  idParam,
  validate,
  alertController.deleteIntegration,
)

export default router
