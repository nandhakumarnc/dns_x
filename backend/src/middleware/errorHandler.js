/**
 * middleware/errorHandler.js
 * Central Express error-handling middleware.
 * Must be registered last (after all routes) in app.js.
 */

import logger from '../config/logger.js'
import { failure } from '../utils/response.js'

/**
 * Catch-all error handler.
 * Normalises thrown errors into the standard { ok: false, error: { … } } shape.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Express requires the 4-argument signature to recognise this as an error handler.

  const status  = err.status ?? err.statusCode ?? 500
  const code    = err.code   ?? 'INTERNAL_ERROR'
  const message = err.message ?? 'An unexpected error occurred'

  if (status >= 500) {
    logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled server error')
  } else {
    logger.warn({ code, message, url: req.url }, 'Request error')
  }

  // Avoid double-response if headers already sent (e.g. streaming).
  if (res.headersSent) return

  return failure(res, code, message, status, err.details)
}

/**
 * 404 handler — register just before errorHandler.
 * @type {import('express').RequestHandler}
 */
export function notFoundHandler(req, res) {
  return failure(res, 'NOT_FOUND', `Route not found: ${req.method} ${req.path}`, 404)
}
