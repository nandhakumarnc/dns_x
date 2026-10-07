/**
 * services/realtimeService.js
 * WebSocket broadcast hub.
 *
 * Manages connected clients and provides a single broadcast(event, payload)
 * function used by all other services.
 *
 * Full WebSocket event implementation in Step 7.
 * This stub is functional — it correctly broadcasts to all connected clients
 * so the simulation loop already delivers live updates from startup.
 */

import { WebSocket } from 'ws'
import logger from '../config/logger.js'

/** @type {import('ws').WebSocketServer | null} */
let _wss = null

/**
 * Attach the WebSocketServer created in server.js.
 * Called once during startup.
 * @param {import('ws').WebSocketServer} wss
 */
export function initRealtimeService(wss) {
  _wss = wss
  logger.info('Realtime service initialised (WebSocket server attached)')

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress ?? 'unknown'
    logger.info({ ip }, 'WebSocket client connected')

    // Send a welcome / current-state event on connection.
    send(ws, 'connected', { message: 'DNS_X realtime stream connected' })

    ws.on('close', () => {
      logger.info({ ip }, 'WebSocket client disconnected')
    })

    ws.on('error', (err) => {
      logger.warn({ err, ip }, 'WebSocket client error')
    })
  })
}

/**
 * Broadcast an event to all connected WebSocket clients.
 * @param {string} event   — event name (e.g. 'telemetry.updated')
 * @param {*}      payload — JSON-serialisable payload
 */
export function broadcast(event, payload) {
  if (!_wss) return

  const message = JSON.stringify({ event, payload, ts: Date.now() })
  let count = 0

  for (const client of _wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
      count++
    }
  }

  if (count > 0) {
    logger.debug({ event, clients: count }, 'Broadcast sent')
  }
}

/**
 * Send a message to a single WebSocket client.
 * @param {import('ws').WebSocket} ws
 * @param {string} event
 * @param {*} payload
 */
function send(ws, event, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload, ts: Date.now() }))
  }
}
