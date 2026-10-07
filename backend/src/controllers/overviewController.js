/**
 * controllers/overviewController.js
 * Assembles the unified DNS operational state for the frontend Overview page.
 */

import { success } from '../utils/response.js'
import * as overviewService from '../services/infrastructureService.js'
import * as signalService from '../services/signalService.js'
import * as incidentService from '../services/incidentService.js'

/** GET /api/v1/overview */
export async function getOverview(_req, res, next) {
  try {
    const [snapshot, openSignals, activeIncidents] = await Promise.all([
      overviewService.getCurrentSnapshot(),
      signalService.getRecentSignals({ limit: 10 }),
      incidentService.getActiveIncidents(),
    ])

    return success(res, {
      ...snapshot,
      signals:   openSignals,
      incidents: activeIncidents,
    })
  } catch (err) {
    next(err)
  }
}
