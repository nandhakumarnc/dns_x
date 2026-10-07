/**
 * server.js
 * HTTP server + WebSocket server entry point (Real DNS Pipeline).
 *
 * Startup order:
 *   1. Load & validate environment variables
 *   2. Verify Supabase connection
 *   3. Create Express app
 *   4. Attach WebSocket server to the same HTTP server
 *   5. Start listening
 *   6. Start background services (telemetry, realtime broadcast)
 */

// Step 1 — env must be imported first so all other modules see validated values.
import './config/env.js'

import http from 'http'
import { WebSocketServer } from 'ws'

import { PORT } from './config/env.js'
import { verifyDatabaseConnection } from './config/database.js'
import logger from './config/logger.js'
import { createApp } from './app.js'
import { initRealtimeService } from './services/realtimeService.js'
import { startTelemetryService } from './services/telemetryService.js'
import { seedBaselinesFromDB } from './services/baselineService.js'

async function start() {
  try {
    // Step 2 — verify DB
    await verifyDatabaseConnection()

    // Step 3 — Seed per-resolver baselines from historical DB metrics.
    //           Non-fatal: empty baselines warm up organically if DB has no data.
    await seedBaselinesFromDB()

    // Step 4 — Express app
    const app = createApp()

    // Step 5 — HTTP + WebSocket server on the same port
    const httpServer = http.createServer(app)
    const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

    // Step 6 — attach realtime service (handles WS client lifecycle + broadcasts)
    initRealtimeService(wss)

    // Step 7 — start HTTP server
    await new Promise((resolve, reject) => {
      httpServer.listen(PORT, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })

    logger.info(`DNS_X backend listening on port ${PORT}`)

    // Step 8 — start background telemetry loop (simulation or live capture)
    await startTelemetryService()

    // Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`${signal} received — shutting down`)
      httpServer.close(() => {
        logger.info('HTTP server closed')
        process.exit(0)
      })
      // Force-kill after 10 s if connections hang.
      setTimeout(() => process.exit(1), 10_000).unref()
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))

  } catch (err) {
    logger.fatal({ err }, 'Failed to start server')
    process.exit(1)
  }
}

// Entrypoint
start()
