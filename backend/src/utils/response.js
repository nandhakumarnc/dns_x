/**
 * utils/response.js
 * Uniform JSON envelope helpers.
 *
 * All API responses follow this shape:
 *   success: { ok: true,  data: <payload>, meta?: { ... } }
 *   error:   { ok: false, error: { code, message, details? } }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*} data        — the response payload
 * @param {number} status — HTTP status code (default 200)
 * @param {object} meta   — optional pagination / timing metadata
 */
export function success(res, data, status = 200, meta = undefined) {
  const body = { ok: true, data }
  if (meta !== undefined) body.meta = meta
  return res.status(status).json(body)
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} code    — machine-readable error code (UPPER_SNAKE)
 * @param {string} message — human-readable description
 * @param {number} status  — HTTP status code (default 500)
 * @param {*} details      — optional extra debug context (omitted in production)
 */
export function failure(res, code, message, status = 500, details = undefined) {
  const body = { ok: false, error: { code, message } }
  if (details !== undefined && process.env.NODE_ENV !== 'production') {
    body.error.details = details
  }
  return res.status(status).json(body)
}

/**
 * Common pre-built error senders.
 */
export const errors = {
  notFound:      (res, msg = 'Resource not found')       => failure(res, 'NOT_FOUND',       msg, 404),
  badRequest:    (res, msg = 'Bad request', details)      => failure(res, 'BAD_REQUEST',     msg, 400, details),
  unauthorized:  (res, msg = 'Unauthorized')              => failure(res, 'UNAUTHORIZED',    msg, 401),
  forbidden:     (res, msg = 'Forbidden')                 => failure(res, 'FORBIDDEN',       msg, 403),
  conflict:      (res, msg = 'Conflict')                  => failure(res, 'CONFLICT',        msg, 409),
  tooManyReqs:   (res, msg = 'Too many requests')         => failure(res, 'RATE_LIMITED',    msg, 429),
  internal:      (res, msg = 'Internal server error')     => failure(res, 'INTERNAL_ERROR',  msg, 500),
}
