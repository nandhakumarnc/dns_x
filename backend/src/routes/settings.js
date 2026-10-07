/**
 * routes/settings.js
 * GET   /api/v1/settings
 * PATCH /api/v1/settings
 */

import { Router } from 'express'
import { body } from 'express-validator'
import * as settingsController from '../controllers/settingsController.js'
import { validate } from '../middleware/validation.js'
import { writeLimiter } from '../middleware/rateLimit.js'

const router = Router()

router.get('/settings', settingsController.getSettings)

router.patch(
  '/settings',
  writeLimiter,
  [
    body().isObject().withMessage('Request body must be a JSON object'),
  ],
  validate,
  settingsController.updateSettings,
)

export default router
