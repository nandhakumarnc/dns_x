/**
 * routes/health.js
 * GET /api/v1/health  — liveness probe
 * GET /api/v1/ready   — readiness probe (checks DB)
 */

import { Router } from 'express'
import * as healthController from '../controllers/healthController.js'

const router = Router()

router.get('/health', healthController.liveness)
router.get('/ready',  healthController.readiness)

export default router
