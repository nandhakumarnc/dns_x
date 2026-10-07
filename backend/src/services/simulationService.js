/**
 * services/simulationService.js
 * Synthetic telemetry scenario generator.
 * Active only when DNS_X_SIMULATION=true.
 *
 * Mirrors the logic in src/data/liveState.js (frontend mock) but runs
 * server-side so it feeds the identical detection pipeline used in
 * production. This ensures simulation behaviour matches real behaviour.
 *
 * Scenarios (cycle through every ~5 minutes):
 *   normal      — healthy baseline traffic
 *   latency_spike  — resolver latency climbs
 *   qps_surge      — query rate doubles
 *   error_spike    — NXDOMAIN / SERVFAIL rate spikes
 *   resolver_overload — single resolver under heavy load
 */

import { TELEMETRY_FLUSH_INTERVAL_MS } from '../config/env.js'
import logger from '../config/logger.js'
import { ingestMetrics } from './telemetryService.js'

// Scenario definitions — weights determine how long each phase lasts (ticks).
const SCENARIOS = [
  { name: 'normal',           weight: 150 },
  { name: 'latency_spike',    weight: 30  },
  { name: 'normal',           weight: 60  },
  { name: 'qps_surge',        weight: 25  },
  { name: 'normal',           weight: 60  },
  { name: 'error_spike',      weight: 20  },
  { name: 'normal',           weight: 80  },
  { name: 'resolver_overload',weight: 35  },
]

let scenarioIndex = 0
let ticksInScenario = 0
let previousState = null

function currentScenario() {
  return SCENARIOS[scenarioIndex % SCENARIOS.length]
}

function advanceScenario() {
  const s = currentScenario()
  ticksInScenario++
  if (ticksInScenario >= s.weight) {
    scenarioIndex++
    ticksInScenario = 0
    logger.debug({ scenario: currentScenario().name }, 'Simulation scenario changed')
  }
}

/**
 * Generate a synthetic DNS telemetry snapshot.
 * Signature matches the payload contract expected by ingestMetrics().
 */
function generateSnapshot(previous) {
  const scenario = currentScenario().name
  const now = Date.now()

  // Base fluctuation
  const jitter = (range) => (Math.random() - 0.5) * range

  // Scenario modifiers
  const mod = {
    normal:            { latencyBias: 0,    qpsBias: 0,    errorBias: 0    },
    latency_spike:     { latencyBias: 40,   qpsBias: 0,    errorBias: 0    },
    qps_surge:         { latencyBias: 5,    qpsBias: 600,  errorBias: 0.3  },
    error_spike:       { latencyBias: 3,    qpsBias: -50,  errorBias: 3.5  },
    resolver_overload: { latencyBias: 65,   qpsBias: 150,  errorBias: 1.2  },
  }[scenario] ?? { latencyBias: 0, qpsBias: 0, errorBias: 0 }

  const baseLatency  = previous?.performance?.latency  ?? 18
  const baseQps      = previous?.traffic?.qps           ?? 1031
  const baseNxdomain = previous?.errors?.nxdomain       ?? 1.8

  const latency  = Math.max(8,   baseLatency  + jitter(3)    + mod.latencyBias * 0.3)
  const qps      = Math.max(300, baseQps      + jitter(70)   + mod.qpsBias     * 0.4)
  const nxdomain = Math.max(0.3, baseNxdomain + jitter(0.15) + mod.errorBias   * 0.2)
  const servfail = Math.max(0.05, (previous?.errors?.servfail ?? 0.3) + jitter(0.08) + mod.errorBias * 0.05)
  const timeout  = Math.max(0.01, (previous?.errors?.timeout  ?? 0.08) + jitter(0.03))
  const errorRate = nxdomain + servfail + timeout

  const latencyPenalty = Math.max(0, (latency - 15) * 0.35)
  const errorPenalty   = nxdomain * 0.3 + servfail * 1.5 + timeout * 2
  const health = Math.min(100, Math.max(60, 100 - latencyPenalty - errorPenalty))

  const anomalyScore = Math.min(1, Math.max(0, (100 - health) / 100 + Math.abs(latency - 18) / 100))
  const outageRisk   = Math.min(100, Math.max(1, anomalyScore * 35))
  const confidence   = Math.max(85, 97 - anomalyScore * 8)

  const severity = anomalyScore >= 0.6 ? 'critical' : anomalyScore >= 0.35 ? 'warning' : 'low'
  const systemStatus = anomalyScore >= 0.6 ? 'critical' : anomalyScore >= 0.35 ? 'degraded' : 'operational'

  const resolvers = (previous?.infrastructure?.resolvers ?? [
    { id: 'resolver-01', name: 'Resolver-01', latency: 18, qps: 392 },
    { id: 'resolver-02', name: 'Resolver-02', latency: 21, qps: 341 },
    { id: 'resolver-03', name: 'Resolver-03', latency: 19, qps: 298 },
  ]).map((r) => {
    const rLatency = Math.max(8, r.latency + jitter(4) + (scenario === 'resolver_overload' && r.id === 'resolver-02' ? 50 : 0))
    return {
      ...r,
      latency: parseFloat(rLatency.toFixed(1)),
      qps: Math.max(100, Math.round(r.qps + jitter(30))),
      status: rLatency > 60 ? 'critical' : rLatency > 35 ? 'warning' : 'healthy',
    }
  })

  return {
    timestamp: now,
    scenario,
    system:      { status: systemStatus, health: parseFloat(health.toFixed(1)) },
    traffic:     { qps: Math.round(qps), peakQps: Math.max(previous?.traffic?.peakQps ?? qps, qps), averageQps: Math.round((previous?.traffic?.averageQps ?? qps) * 0.9 + qps * 0.1) },
    performance: { latency: parseFloat(latency.toFixed(1)), cacheHit: parseFloat(Math.min(99.9, Math.max(80, (previous?.performance?.cacheHit ?? 91.4) + jitter(0.5))).toFixed(1)) },
    errors:      { nxdomain: parseFloat(nxdomain.toFixed(2)), servfail: parseFloat(servfail.toFixed(2)), timeout: parseFloat(timeout.toFixed(2)), rate: parseFloat(errorRate.toFixed(2)), dominant: nxdomain >= servfail ? 'NXDOMAIN' : 'SERVFAIL', trend: errorRate > (previous?.errors?.rate ?? errorRate) ? 'rising' : 'falling' },
    infrastructure: { gateway: { status: 'healthy', qps: Math.round(qps) }, resolvers, cache: { status: health < 85 ? 'warning' : 'healthy', hitRate: parseFloat(Math.min(99.9, Math.max(80, (previous?.performance?.cacheHit ?? 91.4))).toFixed(1)) } },
    ai: { anomalyScore: parseFloat(anomalyScore.toFixed(2)), outageRisk: parseFloat(outageRisk.toFixed(1)), confidence: parseFloat(confidence.toFixed(1)), baseline: severity === 'low' ? 'normal' : severity === 'warning' ? 'elevated' : 'abnormal', severity, assessment: severity === 'critical' ? 'DNS infrastructure is showing significant abnormal behaviour.' : severity === 'warning' ? 'DNS behaviour is deviating from the learned baseline.' : 'DNS behaviour remains within the expected operating range.', signal: severity === 'critical' ? 'Multiple DNS performance indicators are outside their normal range.' : severity === 'warning' ? 'Some DNS performance indicators are above their normal baseline.' : 'No significant infrastructure anomaly detected.', recommendation: severity === 'critical' ? 'Investigate affected resolvers immediately.' : severity === 'warning' ? 'Monitor affected resolvers and inspect recent infrastructure changes.' : 'Continue normal monitoring.' },
  }
}

/**
 * Start the simulation ticker.
 */
export function startSimulation() {
  logger.info({ interval: TELEMETRY_FLUSH_INTERVAL_MS }, 'Simulation ticker started')

  setInterval(() => {
    try {
      const snapshot = generateSnapshot(previousState)
      previousState = snapshot
      advanceScenario()
      ingestMetrics(snapshot)
    } catch (err) {
      logger.error({ err }, 'Simulation tick error')
    }
  }, TELEMETRY_FLUSH_INTERVAL_MS)
}
