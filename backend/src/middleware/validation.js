/**
 * middleware/validation.js
 * express-validator helper.
 * Collect validation errors from a route handler and return a 400 if any exist.
 */

import { validationResult } from 'express-validator'
import { errors } from '../utils/response.js'

/**
 * Middleware that checks for validation errors accumulated by express-validator
 * and short-circuits with a 400 Bad Request if any are found.
 *
 * Usage:
 *   router.post('/path', [body('field').notEmpty()], validate, controller)
 *
 * @type {import('express').RequestHandler}
 */
export function validate(req, res, next) {
  const result = validationResult(req)
  if (!result.isEmpty()) {
    return errors.badRequest(
      res,
      'Validation failed',
      result.array().map((e) => ({ field: e.path, message: e.msg })),
    )
  }
  return next()
}
