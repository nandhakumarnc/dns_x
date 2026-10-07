/**
 * repositories/dnsMeasurementRepository.js
 * Persistent observation storage for dns_measurements and resolver_measurements.
 * Includes in-memory ring buffer fallback for resilient offline operation.
 */

import supabase from '../config/database.js'
import logger from '../config/logger.js'

// In-memory buffer fallback for fast querying and offline/un-migrated DB support
const inMemoryMeasurements = []
const inMemoryResolverProbes = []
const MAX_BUFFER = 200

import crypto from 'node:crypto'

/**
 * Record a full DNS measurement event.
 * @param {object} measurement
 */
export async function recordDnsMeasurement(measurement) {
  const row = {
    id: measurement.id || `meas-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    domain: measurement.domain,
    timestamp: new Date(measurement.timestamp).toISOString(),
    avg_latency: measurement.summary?.avg_latency ?? 0,
    p95_latency: measurement.summary?.p95_latency ?? 0,
    error_rate: measurement.summary?.error_rate ?? 0,
    dominant_rcode: measurement.summary?.dominant_rcode ?? 'NOERROR',
    records: measurement.records ?? {},
    raw_results: measurement,
    created_at: new Date().toISOString(),
  }

  // Store in memory
  inMemoryMeasurements.unshift(row)
  if (inMemoryMeasurements.length > MAX_BUFFER) {
    inMemoryMeasurements.pop()
  }

  // Record resolver probes in memory
  const vpProbes = measurement.vantage_points || []
  for (const vp of vpProbes) {
    inMemoryResolverProbes.unshift({
      measurement_id: row.id,
      resolver_name: vp.name,
      resolver_ip: vp.ip,
      rcode: vp.rcode,
      latency_ms: vp.latency_ms,
      status: vp.status,
      source: vp.source,
      created_at: row.created_at,
    })
  }
  if (inMemoryResolverProbes.length > MAX_BUFFER * 4) {
    inMemoryResolverProbes.splice(MAX_BUFFER * 4)
  }

  // Attempt database write to Supabase
  try {
    const { error } = await supabase.from('dns_measurements').insert({
      id: row.id,
      domain: row.domain,
      avg_latency: row.avg_latency,
      p95_latency: row.p95_latency,
      error_rate: row.error_rate,
      dominant_rcode: row.dominant_rcode,
      records: row.records,
      created_at: row.created_at,
    })

    if (error && error.code !== 'PGRST205' && !error.message?.includes('schema cache')) {
      logger.warn({ err: error.message }, 'Failed writing to dns_measurements table')
    }
  } catch (err) {
    // Non-fatal: in-memory store keeps running
    logger.debug({ err: err.message }, 'dns_measurements DB write skipped/fallback')
  }

  return row
}

/**
 * Get recent measurements for a domain.
 * @param {string} domain
 * @param {number} limit
 */
export async function getRecentMeasurements(domain, limit = 30) {
  // Check memory store first
  const filtered = domain
    ? inMemoryMeasurements.filter((m) => m.domain === domain)
    : inMemoryMeasurements

  if (filtered.length >= limit || !supabase) {
    return filtered.slice(0, limit)
  }

  try {
    let query = supabase
      .from('dns_measurements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (domain) {
      query = query.eq('domain', domain)
    }

    const { data, error } = await query
    if (error || !data) return filtered.slice(0, limit)

    return data
  } catch {
    return filtered.slice(0, limit)
  }
}
