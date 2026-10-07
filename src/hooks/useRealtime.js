/**
 * src/hooks/useRealtime.js
 * WebSocket subscription hook and connection manager for DNS_X.
 *
 * Handles live event subscriptions:
 *   - 'telemetry.updated'     : full DNS telemetry state ticks
 *   - 'resolver.updated'      : individual resolver state changes
 *   - 'signal.detected'       : anomaly signals detected by Z-score baselines
 *   - 'incident.created'      : new correlated multi-signal incidents
 *   - 'incident.updated'      : incident status/severity changes
 *   - 'ai.assessment.updated' : AI classification, root cause and SHAP explanations
 *
 * Includes automatic reconnection with exponential backoff, connection state tracking,
 * and duplicate-subscription prevention.
 */

import { useEffect, useRef, useState, useCallback } from 'react'

// Resolve WebSocket URL with proper path fallback
function getWsUrl() {
  const envUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
  if (envUrl.endsWith('/ws')) {
    return envUrl
  }
  return `${envUrl.replace(/\/+$/, '')}/ws`
}

class RealtimeClient {
  constructor() {
    this.ws = null
    this.listeners = new Map() // event -> Set of callbacks
    this.statusListeners = new Set()
    this.status = 'disconnected' // 'connecting' | 'connected' | 'disconnected'
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.baseDelay = 1000
    this.maxDelay = 15000
    this.lastMessageTime = null
    this.shouldConnect = false
  }

  connect() {
    this.shouldConnect = true

    // Check if simulation mode forces local mock only
    if (import.meta.env.VITE_SIMULATION_MODE === 'true' && !import.meta.env.VITE_WS_URL) {
      this._setStatus('disconnected')
      return
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this._setStatus('connecting')

    try {
      const url = getWsUrl()
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this._setStatus('connected')
      }

      this.ws.onmessage = (event) => {
        try {
          this.lastMessageTime = Date.now()
          const data = JSON.parse(event.data)
          const eventName = data.event
          const payload = data.payload

          // Notify exact event listeners
          if (eventName && this.listeners.has(eventName)) {
            for (const cb of this.listeners.get(eventName)) {
              try {
                cb(payload, data)
              } catch (err) {
                console.error(`[Realtime] Listener error on '${eventName}':`, err)
              }
            }
          }

          // Notify wildcard listeners
          if (this.listeners.has('*')) {
            for (const cb of this.listeners.get('*')) {
              try {
                cb(eventName, payload, data)
              } catch (err) {
                console.error(`[Realtime] Wildcard listener error:`, err)
              }
            }
          }
        } catch (err) {
          console.warn('[Realtime] Failed to parse incoming WebSocket message:', err)
        }
      }

      this.ws.onclose = (_event) => {
        this._setStatus('disconnected')
        if (this.shouldConnect) {
          this._scheduleReconnect()
        }
      }

      this.ws.onerror = (_err) => {
        // ws onclose will fire right after this to handle reconnect
        this._setStatus('disconnected')
      }
    } catch (err) {
      console.warn('[Realtime] Error initializing WebSocket:', err)
      this._setStatus('disconnected')
      this._scheduleReconnect()
    }
  }

  disconnect() {
    this.shouldConnect = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._setStatus('disconnected')
  }

  _scheduleReconnect() {
    if (this.reconnectTimer || !this.shouldConnect) return

    const delay = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(1.5, this.reconnectAttempts)
    )
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  _setStatus(status) {
    if (this.status === status) return
    this.status = status
    for (const cb of this.statusListeners) {
      try {
        cb(status)
      } catch (err) {
        console.error('[Realtime] Status listener error:', err)
      }
    }
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Ensure connection is active
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      this.connect()
    }

    return () => {
      const set = this.listeners.get(event)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          this.listeners.delete(event)
        }
      }
    }
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback)
    callback(this.status)
    return () => {
      this.statusListeners.delete(callback)
    }
  }
}

// Global client singleton across React trees
export const realtimeClient = new RealtimeClient()

/**
 * React hook to subscribe to a specific WebSocket event or set of events.
 *
 * @param {string | string[] | null} eventName
 *   Target event e.g. 'telemetry.updated', 'resolver.updated', 'signal.detected',
 *   'incident.created', 'incident.updated', 'ai.assessment.updated', or '*' for all.
 * @param {Function} callback Callback invoked when event is received.
 */
export function useRealtime(eventName, callback) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const eventKey = Array.isArray(eventName) ? eventName.join(',') : (eventName || '')

  useEffect(() => {
    if (!eventName) return

    const events = Array.isArray(eventName) ? eventName : [eventName]
    const unsubs = events.map((ev) =>
      realtimeClient.subscribe(ev, (payload, meta) => {
        if (callbackRef.current) {
          callbackRef.current(payload, meta, ev)
        }
      })
    )

    return () => {
      unsubs.forEach((unsub) => unsub())
    }
  }, [eventKey, eventName])
}

/**
 * React hook to inspect the live WebSocket connection status.
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState(realtimeClient.status)

  useEffect(() => {
    return realtimeClient.onStatusChange(setStatus)
  }, [])

  const reconnect = useCallback(() => {
    realtimeClient.disconnect()
    realtimeClient.connect()
  }, [])

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    lastMessageTime: realtimeClient.lastMessageTime,
    reconnect,
  }
}

export default useRealtime
