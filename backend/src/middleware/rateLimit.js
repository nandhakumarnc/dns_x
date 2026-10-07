/**
 * middleware/rateLimit.js
 * Thin wrappers around express-rate-limit for reuse across routes.
 */

import rateLimit from 'express-rate-limit'
import { errors } from '../utils/response.js'

/** Handler so rate-limit errors use the standard error envelope. */
function rateLimitHandler(req, res) {
  return errors.tooManyReqs(res, 'Rate limit exceeded. Please slow down.')
}

/**
 * General API rate limiter — 300 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})

/**
 * Strict limiter for write endpoints (POST actions on incidents, settings PATCH).
 * 30 requests per minute per IP.
 */
export const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})
