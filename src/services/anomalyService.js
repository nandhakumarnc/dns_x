/**
 * src/services/anomalyService.js
 * Helpers and signal transformation utilities for DNS anomaly detection.
 */

import { getSignals } from './dnsService'

/**
 * Fetch anomalies and format for UI consumption.
 */
export async function getFormattedAnomalies(limit = 50) {
  try {
    const rawSignals = await getSignals({ limit })
    if (!Array.isArray(rawSignals)) return []

    return rawSignals.map((signal) => {
      const zScore = Math.abs(signal.z_score ?? 0)
      const score = Math.min(100, Math.round(zScore * 25))

      return {
        id: signal.id,
        time: signal.ts ? new Date(signal.ts).toLocaleTimeString() : 'RECENT',
        source: signal.resolver_id || signal.resolver_name || 'DNS-GATEWAY',
        signal: signal.type ? signal.type.toUpperCase() : 'DEVIATION',
        value: formatSignalValue(signal),
        score,
        zScore: signal.z_score,
        type: classifySignalType(signal.type),
        status: score >= 70 ? 'CRITICAL' : score >= 40 ? 'WATCH' : 'NORMAL',
        metadata: signal.metadata,
      }
    })
  } catch (err) {
    console.warn('[anomalyService] Failed to load formatted anomalies:', err)
    return []
  }
}

function formatSignalValue(signal) {
  if (signal.value !== undefined && signal.value !== null) {
    if (signal.type?.includes('latency')) return `${Number(signal.value).toFixed(1)} ms`
    if (signal.type?.includes('qps')) return `${Math.round(signal.value).toLocaleString()} QPS`
    if (signal.type?.includes('error') || signal.type?.includes('nxdomain') || signal.type?.includes('servfail')) {
      return `${(Number(signal.value) * 100).toFixed(2)}%`
    }
    return String(signal.value)
  }
  return `z=${signal.z_score ? Number(signal.z_score).toFixed(2) : '0'}`
}

function classifySignalType(type = '') {
  const t = type.toLowerCase()
  if (t.includes('latency') || t.includes('timeout')) return 'INFRASTRUCTURE'
  if (t.includes('qps') || t.includes('surge') || t.includes('drop')) return 'NETWORK'
  if (t.includes('nxdomain') || t.includes('servfail') || t.includes('error')) return 'OPERATIONAL'
  return 'BEHAVIOURAL'
}

export default {
  getFormattedAnomalies,
}
