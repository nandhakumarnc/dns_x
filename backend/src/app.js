/**
 * app.js
 * Express application factory.
 * Configures all global middleware and mounts the API router.
 * Exported separately from server.js so it can be imported in tests.
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import { API_BASE_PATH, CORS_ORIGINS } from './config/env.js'
import logger from './config/logger.js'

import { apiLimiter } from './middleware/rateLimit.js'
import { requireApiKey } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

// ── Route modules ─────────────────────────────────────────────────────────────
import healthRouter         from './routes/health.js'
import overviewRouter       from './routes/overview.js'
import infrastructureRouter from './routes/infrastructure.js'
import incidentsRouter      from './routes/incidents.js'
import signalsRouter        from './routes/signals.js'
import aiRouter             from './routes/ai.js'
import alertsRouter         from './routes/alerts.js'
import settingsRouter       from './routes/settings.js'
import internalRouter       from './routes/internal.js'
import dnsRouter            from './routes/dns.js'
import authRouter           from './routes/auth.js'

export function createApp() {
  const app = express()

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet())

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Api-Key'],
    credentials: false,
  }))

  // ── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: false }))

  // ── Request logging ───────────────────────────────────────────────────────
  app.use((req, _res, next) => {
    logger.debug({ method: req.method, url: req.url }, 'incoming request')
    next()
  })

  // ── Rate limiting (applied to all API routes) ─────────────────────────────
  app.use(API_BASE_PATH, apiLimiter)

  // ── Health / readiness (no auth — for load balancers and orchestrators) ───
  app.use(`${API_BASE_PATH}`, healthRouter)

  // ── Internal collector endpoint (API-key guarded, not in public base path) ─
  app.use('/internal', requireApiKey, internalRouter)

  // ── Authenticated API routes ──────────────────────────────────────────────
  app.use(`${API_BASE_PATH}`, requireApiKey, overviewRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, infrastructureRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, incidentsRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, signalsRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, aiRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, alertsRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, settingsRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, dnsRouter)
  app.use(`${API_BASE_PATH}`, requireApiKey, authRouter)

  // ── 404 & error handlers (must be last) ───────────────────────────────────
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
