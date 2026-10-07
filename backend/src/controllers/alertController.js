/**
 * controllers/alertController.js
 */

import { success } from '../utils/response.js'
import { errors } from '../utils/response.js'
import * as alertService from '../services/alertService.js'

/** GET /api/v1/alerts/integrations */
export async function listIntegrations(_req, res, next) {
  try {
    const integrations = await alertService.listIntegrations()
    return success(res, integrations)
  } catch (err) {
    next(err)
  }
}

/** POST /api/v1/alerts/integrations */
export async function createIntegration(req, res, next) {
  try {
    const integration = await alertService.createIntegration(req.body)
    return success(res, integration, 201)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/alerts/integrations/:id */
export async function updateIntegration(req, res, next) {
  try {
    const integration = await alertService.updateIntegration(req.params.id, req.body)
    if (!integration) return errors.notFound(res, `Integration not found: ${req.params.id}`)
    return success(res, integration)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/v1/alerts/integrations/:id */
export async function deleteIntegration(req, res, next) {
  try {
    await alertService.deleteIntegration(req.params.id)
    return success(res, null, 204)
  } catch (err) {
    next(err)
  }
}
