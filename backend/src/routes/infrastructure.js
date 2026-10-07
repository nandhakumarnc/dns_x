/**
 * routes/infrastructure.js
 * GET /api/v1/infrastructure
 * GET /api/v1/infrastructure/resolvers/:id/metrics
 */

import { Router } from 'express'
import { param, query } from 'express-validator'
import * as infrastructureController from '../controllers/infrastructureController.js'
import { validate } from '../middleware/validation.js'

const router = Router()

router.get('/infrastructure', infrastructureController.getInfrastructure)

router.get(
  '/infrastructure/resolvers/:id/metrics',
  [
    param('id').isString().notEmpty().withMessage('Resolver id is required'),
    query('window').optional().isIn(['1m', '5m', '1h']).withMessage('window must be 1m, 5m, or 1h'),
    query('limit').optional().isInt({ min: 1, max: 1440 }).withMessage('limit must be 1–1440'),
  ],
  validate,
  infrastructureController.getResolverMetrics,
)

export default router
