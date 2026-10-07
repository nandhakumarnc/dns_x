/**
 * middleware/auth.js
 * API-key authentication guard.
 *
 * Reads the API key from the X-Api-Key request header and compares it
 * against the API_KEY environment variable using a constant-time comparison
 * to prevent timing attacks.
 *
 * If API_KEY is empty (not configured), auth is bypassed with a warning —
 * suitable for local development, never for production.
 */

import { timingSafeEqual } from 'crypto'
import { API_KEY, IS_PRODUCTION } from '../config/env.js'
import logger from '../config/logger.js'
import { errors } from '../utils/response.js'

// Encode once at startup so we aren't allocating Buffers per request.
const apiKeyBuffer = API_KEY ? Buffer.from(API_KEY, 'utf8') : null

let warnedDevBypass = false

/**
 * Express middleware that enforces API-key authentication.
 * @type {import('express').RequestHandler}
 */
export function requireApiKey(req, res, next) {
  const key = process.env.API_KEY || API_KEY
  // Skip auth if no key is configured (dev convenience only).
  if (!key) {
    if (IS_PRODUCTION) {
      logger.error('API_KEY is not set in production — all requests will be rejected')
      return errors.internal(res, 'Server misconfiguration: API key not configured')
    }
    if (!warnedDevBypass) {
      logger.warn('API_KEY not configured — auth bypassed (development mode)')
      warnedDevBypass = true
    }
    return next()
  }

  const currentBuffer = Buffer.from(key, 'utf8')

  // Check X-Api-Key header or Authorization: Bearer <key>
  const authHeader = req.headers['authorization']
  let provided = req.headers['x-api-key'] ?? ''
  if (!provided && authHeader && authHeader.startsWith('Bearer ')) {
    provided = authHeader.slice(7).trim()
  }

  const providedBuffer = Buffer.from(String(provided), 'utf8')

  // Lengths must match before timingSafeEqual to avoid allocation mismatch.
  const match =
    providedBuffer.length === currentBuffer.length &&
    timingSafeEqual(providedBuffer, currentBuffer)

  if (!match) {
    return errors.unauthorized(res, 'Invalid or missing API key')
  }

  return next()
}
