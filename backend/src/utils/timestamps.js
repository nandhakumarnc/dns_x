/**
 * utils/timestamps.js
 * Timestamp helpers used across telemetry, signals, and incidents.
 */

/**
 * Return the current UTC timestamp as an ISO-8601 string.
 * @returns {string}
 */
export function nowISO() {
  return new Date().toISOString()
}

/**
 * Return the current UTC time as a Unix epoch milliseconds integer.
 * @returns {number}
 */
export function nowMs() {
  return Date.now()
}

/**
 * Floor a Date (or ms timestamp) to the start of a metric window.
 * Supported windows: '1m', '5m', '1h'.
 *
 * @param {Date|number} ts
 * @param {'1m'|'5m'|'1h'} window
 * @returns {Date}
 */
export function floorToWindow(ts, window) {
  const d = ts instanceof Date ? new Date(ts) : new Date(ts)

  switch (window) {
    case '1m':
      d.setUTCSeconds(0, 0)
      break
    case '5m':
      d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0)
      break
    case '1h':
      d.setUTCMinutes(0, 0, 0)
      break
    default:
      throw new Error(`Unknown metric window: "${window}"`)
  }

  return d
}

/**
 * Return the start of the window N intervals ago from now.
 *
 * @param {'1m'|'5m'|'1h'} window
 * @param {number} count — how many intervals back
 * @returns {Date}
 */
export function windowStart(window, count) {
  const msMap = { '1m': 60_000, '5m': 300_000, '1h': 3_600_000 }
  const ms = msMap[window]
  if (!ms) throw new Error(`Unknown metric window: "${window}"`)
  return new Date(Date.now() - ms * count)
}

/**
 * Format a millisecond duration into a human-readable string.
 * e.g. 125000 → "2m 5s"
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1_000)  return `${ms}ms`
  if (ms < 60_000) return `${Math.round(ms / 1_000)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = Math.round((ms % 60_000) / 1_000)
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}
