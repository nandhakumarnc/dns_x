/**
 * controllers/infrastructureController.js
 */

import { success } from '../utils/response.js'
import { errors } from '../utils/response.js'
import * as infraService from '../services/infrastructureService.js'

/** GET /api/v1/infrastructure */
export async function getInfrastructure(_req, res, next) {
  try {
    const data = await infraService.getInfrastructureState()
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/infrastructure/resolvers/:id/metrics */
export async function getResolverMetrics(req, res, next) {
  try {
    const { id } = req.params
    const window = req.query.window ?? '5m'
    const limit  = parseInt(req.query.limit ?? '60', 10)

    const metrics = await infraService.getResolverMetrics(id, window, limit)
    if (!metrics) return errors.notFound(res, `Resolver not found: ${id}`)

    return success(res, metrics)
  } catch (err) {
    next(err)
  }
}
