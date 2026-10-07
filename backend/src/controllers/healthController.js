/**
 * controllers/healthController.js
 */

import { success } from '../utils/response.js'
import { nowISO } from '../utils/timestamps.js'
import supabase from '../config/database.js'

/** GET /api/v1/health — always 200 if the process is running */
export async function liveness(_req, res) {
  return success(res, { status: 'ok', timestamp: nowISO() })
}

/** GET /api/v1/ready — 200 only if DB is reachable */
export async function readiness(_req, res) {
  const { error } = await supabase.from('system_settings').select('key').limit(1)
  if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
    return res.status(503).json({
      ok: false,
      error: { code: 'DB_UNAVAILABLE', message: 'Database is not reachable' },
    })
  }
  return success(res, { status: 'ready', timestamp: nowISO() })
}
