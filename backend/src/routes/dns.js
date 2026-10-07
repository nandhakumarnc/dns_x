/**
 * routes/dns.js
 * Real DNS Target Measurement and Probing Routes.
 */

import { Router } from 'express'
import {
  measureDomain,
  setActiveTargetDomain,
  clearActiveTargetDomain,
  getActiveTargetDomain,
} from '../services/dnsMeasurementService.js'
import { validateTargetBackend } from '../services/targetValidationService.js'
import { getRecentMeasurements } from '../repositories/dnsMeasurementRepository.js'
import { success } from '../utils/response.js'
import logger from '../config/logger.js'

const router = Router()

/**
 * POST /api/v1/dns/validate
 * Perform strict backend-side target validation (syntax -> real DNS resolution -> HTTP/HTTPS reachability).
 * Body: { target: string } or { domain: string }
 */
router.post('/dns/validate', async (req, res, next) => {
  try {
    const rawTarget = req.body?.target || req.body?.domain || req.query?.target || req.query?.domain
    const result = await validateTargetBackend(rawTarget)
    if (!result.valid) {
      return res.status(422).json({
        ok: false,
        error: {
          message: result.message || result.error,
          code: 'VALIDATION_FAILED',
          status: result.status || result.reason,
          reason: result.reason,
          details: result.details,
        },
        data: result,
      })
    }
    return success(res, result)
  } catch (err) {
    logger.error({ err: err.message }, 'Failed handling /dns/validate')
    next(err)
  }
})

/**
 * GET /api/v1/dns/validate?target=...
 */
router.get('/dns/validate', async (req, res, next) => {
  try {
    const rawTarget = req.query?.target || req.query?.domain
    const result = await validateTargetBackend(rawTarget)
    if (!result.valid) {
      return res.status(422).json({
        ok: false,
        error: {
          message: result.message || result.error,
          code: 'VALIDATION_FAILED',
          status: result.status || result.reason,
          reason: result.reason,
          details: result.details,
        },
        data: result,
      })
    }
    return success(res, result)
  } catch (err) {
    logger.error({ err: err.message }, 'Failed handling GET /dns/validate')
    next(err)
  }
})

/**
 * POST /api/v1/dns/probe
 * Probe a domain in real-time after backend-side validation succeeds.
 * Body: { target: string }
 */
router.post('/dns/probe', async (req, res, next) => {
  try {
    const rawTarget = req.body?.target || req.body?.domain || req.query?.target || req.query?.domain
    const valResult = await validateTargetBackend(rawTarget)
    if (!valResult.valid) {
      return res.status(422).json({
        ok: false,
        error: {
          message: valResult.message || valResult.error,
          code: 'VALIDATION_FAILED',
          reason: valResult.reason,
          details: valResult.details,
        },
        data: valResult,
      })
    }

    const measurement = await measureDomain(valResult.domain)
    return success(res, measurement)
  } catch (err) {
    logger.error({ err: err.message }, 'Failed handling /dns/probe')
    next(err)
  }
})

/**
 * GET /api/v1/dns/probe?target=...
 */
router.get('/dns/probe', async (req, res, next) => {
  try {
    const rawTarget = req.query?.target || req.query?.domain
    const valResult = await validateTargetBackend(rawTarget)
    if (!valResult.valid) {
      return res.status(422).json({
        ok: false,
        error: {
          message: valResult.message || valResult.error,
          code: 'VALIDATION_FAILED',
          reason: valResult.reason,
          details: valResult.details,
        },
        data: valResult,
      })
    }

    const measurement = await measureDomain(valResult.domain)
    return success(res, measurement)
  } catch (err) {
    logger.error({ err: err.message }, 'Failed handling GET /dns/probe')
    next(err)
  }
})

/**
 * POST /api/v1/dns/target
 * Set active target for continuous backend probing and WebSocket broadcast after validation.
 * Body: { target: string }
 */
router.post('/dns/target', async (req, res, next) => {
  try {
    const rawTarget = req.body?.target || req.body?.domain
    const valResult = await validateTargetBackend(rawTarget)
    if (!valResult.valid) {
      clearActiveTargetDomain()
      return res.status(422).json({
        ok: false,
        error: {
          message: valResult.message || valResult.error,
          code: 'VALIDATION_FAILED',
          reason: valResult.reason,
          details: valResult.details,
        },
        data: valResult,
      })
    }

    await setActiveTargetDomain(valResult.domain)
    return success(res, { activeTarget: valResult.domain, monitoring: true })
  } catch (err) {
    next(err)
  }
})

/**
 * DELETE /api/v1/dns/target
 * Stop active target probing.
 */
router.delete('/dns/target', (_req, res) => {
  clearActiveTargetDomain()
  return success(res, { activeTarget: null, monitoring: false })
})

/**
 * GET /api/v1/dns/target
 * Get currently active target domain.
 */
router.get('/dns/target', (_req, res) => {
  return success(res, { activeTarget: getActiveTargetDomain() })
})

/**
 * GET /api/v1/dns/measurements?domain=...
 * Retrieve recent real observations.
 */
router.get('/dns/measurements', async (req, res, next) => {
  try {
    const domain = req.query?.domain
    const limit = parseInt(req.query?.limit, 10) || 30
    const records = await getRecentMeasurements(domain, limit)
    return success(res, records)
  } catch (err) {
    next(err)
  }
})

export default router
