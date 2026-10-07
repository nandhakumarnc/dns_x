/**
 * controllers/aiController.js
 */

import { success } from '../utils/response.js'
import { errors } from '../utils/response.js'
import * as aiService from '../services/aiService.js'

/** GET /api/v1/incidents/:id/ai */
export async function getAssessment(req, res, next) {
  try {
    const assessment = await aiService.getAssessment(req.params.id)
    if (!assessment) return errors.notFound(res, `No AI assessment found for incident: ${req.params.id}`)
    return success(res, assessment)
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/incidents/:id/explanation */
export async function getExplanation(req, res, next) {
  try {
    const explanation = await aiService.getExplanation(req.params.id)
    if (!explanation) return errors.notFound(res, `No explanation found for incident: ${req.params.id}`)
    return success(res, explanation)
  } catch (err) {
    next(err)
  }
}

/** GET /api/v1/incidents/:id/recommendation */
export async function getRecommendation(req, res, next) {
  try {
    const recommendation = await aiService.getRecommendation(req.params.id)
    if (!recommendation) return errors.notFound(res, `No recommendation found for incident: ${req.params.id}`)
    return success(res, recommendation)
  } catch (err) {
    next(err)
  }
}
