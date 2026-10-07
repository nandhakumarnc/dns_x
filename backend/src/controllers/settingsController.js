/**
 * controllers/settingsController.js
 */

import { success } from '../utils/response.js'
import * as settingsService from '../services/settingsService.js'

/** GET /api/v1/settings */
export async function getSettings(_req, res, next) {
  try {
    const settings = await settingsService.getAllSettings()
    return success(res, settings)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/v1/settings */
export async function updateSettings(req, res, next) {
  try {
    const updated = await settingsService.updateSettings(req.body)
    return success(res, updated)
  } catch (err) {
    next(err)
  }
}
