/**
 * services/infrastructureService.js
 * Assembles infrastructure state and resolver metrics from DB + in-memory snapshot.
 */

import * as infraRepo from '../repositories/infrastructureRepository.js'
import * as telemetryRepo from '../repositories/telemetryRepository.js'
import { getCurrentTelemetrySnapshot } from './telemetryService.js'

/**
 * Return the current unified DNS operational snapshot.
 * Used by overviewController and the WS broadcast.
 *
 * Falls back to the in-memory simulation snapshot when available,
 * so the overview works even before DB metrics are written.
 *
 * @returns {Promise<object>}
 */
export async function getCurrentSnapshot() {
  const live = getCurrentTelemetrySnapshot()
  if (live) return live

  // Fallback: synthesise from DB if in-memory snapshot is absent.
  const resolvers = await infraRepo.getAllResolvers()
  return {
    timestamp: Date.now(),
    system:        { status: 'unknown', health: 0 },
    traffic:       { qps: 0, peakQps: 0, averageQps: 0 },
    performance:   { latency: 0, cacheHit: 0 },
    errors:        { nxdomain: 0, servfail: 0, timeout: 0, rate: 0, dominant: 'NXDOMAIN', trend: 'stable' },
    infrastructure: {
      gateway:   { status: 'unknown', qps: 0 },
      resolvers: resolvers.map((r) => ({ id: r.id, name: r.name, status: r.status, latency: 0, qps: 0 })),
      cache:     { status: 'unknown', hitRate: 0 },
    },
    ai: {
      anomalyScore: 0, outageRisk: 0, confidence: 0,
      baseline: 'normal', severity: 'low',
      assessment: 'Awaiting telemetry.', signal: '', recommendation: '',
    },
  }
}

/**
 * Return the full infrastructure topology (nodes + connections).
 * @returns {Promise<object>}
 */
export async function getInfrastructureState() {
  const resolvers = await infraRepo.getAllResolvers()
  const snapshot  = getCurrentTelemetrySnapshot()
  const liveResolvers = snapshot?.infrastructure?.resolvers ?? []

  // Merge DB resolver records with live latency/qps/status.
  const nodes = resolvers.map((r) => {
    const live = liveResolvers.find((lr) => lr.id === r.id)
    return {
      id:      r.id,
      name:    r.name,
      ip:      r.ip,
      port:    r.port,
      status:  live?.status  ?? r.status,
      latency: live?.latency ?? 0,
      qps:     live?.qps     ?? 0,
    }
  })

  return {
    gateway:   snapshot?.infrastructure?.gateway ?? { status: 'unknown', qps: 0 },
    resolvers: nodes,
    cache:     snapshot?.infrastructure?.cache   ?? { status: 'unknown', hitRate: 0 },
  }
}

/**
 * Return time-series metrics for a single resolver.
 * @param {string} id
 * @param {string} window
 * @param {number} limit
 * @returns {Promise<object[]|null>}
 */
export async function getResolverMetrics(id, window, limit) {
  const resolver = await infraRepo.getResolverById(id)
  if (!resolver) return null
  const metrics = await telemetryRepo.getResolverMetrics(id, window, limit)
  return { resolver, metrics }
}
