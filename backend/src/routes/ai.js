/**
 * routes/ai.js
 * GET /api/v1/incidents/:id/ai
 * GET /api/v1/incidents/:id/explanation
 * GET /api/v1/incidents/:id/recommendation
 */

import { Router } from 'express'
import { param } from 'express-validator'
import * as aiController from '../controllers/aiController.js'
import { validate } from '../middleware/validation.js'

const router = Router()

const idParam = [
  param('id').isUUID().withMessage('Incident id must be a valid UUID'),
]

router.get('/incidents/:id/ai',             idParam, validate, aiController.getAssessment)
router.get('/incidents/:id/explanation',    idParam, validate, aiController.getExplanation)
router.get('/incidents/:id/recommendation', idParam, validate, aiController.getRecommendation)

export default router
