/**
 * routes/overview.js
 * GET /api/v1/overview
 */

import { Router } from 'express'
import * as overviewController from '../controllers/overviewController.js'

const router = Router()

router.get('/overview', overviewController.getOverview)

export default router
