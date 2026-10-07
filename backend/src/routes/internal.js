/**
 * routes/internal.js
 *
 * Internal-only routes — NOT exposed via the public API_BASE_PATH.
 * Bound to /internal in app.js.
 *
 * POST /internal/telemetry
 *   Receives a pre-aggregated telemetry payload from the Python collector.
 *   Protected by the same API key as the public API.
 *   Rate-limited separately (collector sends at most once per FLUSH_INTERVAL).
 */

import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validation.js'
import { ingestMetrics } from '../services/telemetryService.js'
import { success } from '../utils/response.js'
import { nowISO } from '../utils/timestamps.js'
import logger from '../config/logger.js'

const router = Router()

/**
 * POST /internal/telemetry
 *
 * Body: full telemetry snapshot object (matches the liveState.js contract).
 * The Python collector is responsible for producing this shape.
 *
 * Minimal validation — we only verify the top-level required fields are
 * present. Deep field validation happens inside the ingest pipeline.
 */
router.post(
  '/telemetry',
  [
    body('timestamp').isNumeric().withMessage('timestamp must be a Unix ms integer'),
    body('system').isObject().withMessage('system is required'),
    body('traffic').isObject().withMessage('traffic is required'),
    body('performance').isObject().withMessage('performance is required'),
    body('errors').isObject().withMessage('errors is required'),
    body('infrastructure').isObject().withMessage('infrastructure is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      await ingestMetrics(req.body)
      logger.debug({ ts: nowISO() }, 'Collector push ingested')
      return success(res, { ingested: true, ts: nowISO() })
    } catch (err) {
      next(err)
    }
  },
)

export default router
