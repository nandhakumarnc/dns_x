/**
 * controllers/signalController.js
 */

import { success } from '../utils/response.js'
import * as signalService from '../services/signalService.js'

/** GET /api/v1/signals */
export async function listSignals(req, res, next) {
  try {
    const filters = {
      resolver_id: req.query.resolver_id,
      type:        req.query.type,
      since:       req.query.since,
      limit:       parseInt(req.query.limit ?? '100', 10),
    }
    const signals = await signalService.getRecentSignals(filters)
    return success(res, signals)
  } catch (err) {
    next(err)
  }
}
