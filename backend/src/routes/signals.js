/**
 * routes/signals.js
 * GET /api/v1/signals
 */

import { Router } from 'express'
import { query } from 'express-validator'
import * as signalController from '../controllers/signalController.js'
import { validate } from '../middleware/validation.js'

const router = Router()

router.get(
  '/signals',
  [
    query('resolver_id').optional().isString(),
    query('type').optional().isString(),
    query('since').optional().isISO8601().withMessage('since must be an ISO-8601 date'),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validate,
  signalController.listSignals,
)

export default router
