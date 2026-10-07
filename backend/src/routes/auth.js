/**
 * routes/auth.js
 * Google Identity & DNS MX Verification endpoint.
 * Zero user passwords are required, validated, or handled.
 * POST /api/v1/auth/verify-google
 */

import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validation.js'
import { verifyGoogleAccount } from '../utils/googleAuthVerifier.js'

const router = Router()

router.post(
  '/auth/verify-google',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Google account email or Gmail ID is required')
      .isEmail()
      .withMessage('A valid Google email address is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body
      const result = await verifyGoogleAccount(email)

      if (!result.verified) {
        return res.status(400).json({
          status: 'error',
          verified: false,
          error: result.error,
        })
      }

      return res.status(200).json({
        status: 'success',
        verified: true,
        user: {
          id: `usr_g_${Buffer.from(result.email).toString('hex').slice(0, 12)}`,
          email: result.email,
          name: result.username,
          role: result.accountType === 'workspace' ? 'Enterprise Security Engineer' : 'Lead NOC Engineer',
          provider: 'google',
          accountType: result.accountType,
          domain: result.domain,
          verifiedAt: result.verifiedAt,
        },
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router
