import { getCanonicalHealth } from '../src/utils/canonicalHealth.js'
import assert from 'node:assert'

console.log('--- RUNNING DNS_X CONTRADICTORY CRITICAL STATE BUG VERIFICATION ---')

// ============================================================================
// TEST 1: Healthy Domain with Stale Critical Incident in State
// ============================================================================
console.log('\n[TEST 1] Healthy Domain (licet.ac.in / cloudflare.com) with stale critical incident...')
const healthyStateWithStaleIncident = {
  connection: { isConnected: true, mode: 'live', status: 'connected' },
  target: {
    cleanDomain: 'licet.ac.in',
    state: 'ACTIVE',
    vantagePoints: [
      { id: 'google', name: 'Google Public DNS', rcode: 'NOERROR', status: 'ONLINE' },
      { id: 'cloudflare', name: 'Cloudflare Anycast', rcode: 'NOERROR', status: 'ONLINE' },
      { id: 'quad9', name: 'Quad9 DNS', rcode: 'NOERROR', status: 'ONLINE' },
      { id: 'opendns', name: 'OpenDNS', rcode: 'NOERROR', status: 'ONLINE' },
    ],
  },
  errors: {
    rate: 0,
    resolutionFailureRate: 0,
    dominant: 'NOERROR',
  },
  incidents: [
    {
      id: 'stale-inc-1',
      target_domain: 'licet.ac.in',
      title: 'Persistent Multi-Resolver Latency Escalation for licet.ac.in',
      severity: 'critical', // stale misclassified incident
      status: 'active',
      signals: ['sig-lat-1'],
    },
  ],
}

const health1 = getCanonicalHealth(healthyStateWithStaleIncident)
console.log('Result 1:', {
  targetStatus: health1.targetStatus,
  status: health1.status,
  targetLabel: health1.targetLabel,
  healthPercent: health1.healthPercent,
  activeIncidentsCount: health1.activeIncidentsCount,
})

assert.strictEqual(health1.status, 'HEALTHY', 'Target status must be HEALTHY')
assert.strictEqual(health1.targetStatus, 'HEALTHY', 'Target status must be HEALTHY')
assert.strictEqual(health1.targetLabel, 'OBSERVED HEALTHY', 'Target label must be OBSERVED HEALTHY')
assert.strictEqual(health1.healthPercent, 100, 'Health percent must be 100')
assert.strictEqual(health1.activeIncidentsCount, 0, 'Active incidents must be 0 (stale incident reconciled)')
console.log('✓ TEST 1 PASSED: Healthy domain with stale critical incident resolves to HEALTHY with 0 active incidents.')

// ============================================================================
// TEST 2: Baseline Deviation Alone (High Z-Score, 0% resolution failure)
// ============================================================================
console.log('\n[TEST 2] Baseline deviation alone (high latency Z-score, NOERROR, 0% failure)...')
const baselineDeviationState = {
  connection: { isConnected: true, mode: 'live', status: 'connected' },
  target: {
    cleanDomain: 'cloudflare.com',
    state: 'ACTIVE',
    vantagePoints: [
      { id: 'google', name: 'Google Public DNS', rcode: 'NOERROR', status: 'ONLINE' },
      { id: 'cloudflare', name: 'Cloudflare Anycast', rcode: 'NOERROR', status: 'ONLINE' },
    ],
  },
  performance: { latency: 190.5 },
  errors: { rate: 0, resolutionFailureRate: 0, dominant: 'NOERROR' },
  ai: {
    baseline: 'BASELINE ACTIVE · DEVIATION DETECTED',
    zScore: 5.2,
  },
  signals: [
    {
      id: 'sig-lat-2',
      type: 'LATENCY_DEVIATION',
      metric_key: 'latency_median',
      deviation_score: 5.2,
    },
  ],
  incidents: [],
}

const health2 = getCanonicalHealth(baselineDeviationState)
console.log('Result 2:', {
  targetStatus: health2.targetStatus,
  status: health2.status,
  activeIncidentsCount: health2.activeIncidentsCount,
})

assert.strictEqual(health2.status, 'HEALTHY', 'Target status must be HEALTHY despite baseline deviation signal')
assert.strictEqual(health2.activeIncidentsCount, 0, 'Active incidents must be 0')
console.log('✓ TEST 2 PASSED: Statistical baseline deviation alone never produces CRITICAL.')

// ============================================================================
// TEST 3: NXDOMAIN (Benign Negative Semantics RFC 1035)
// ============================================================================
console.log('\n[TEST 3] NXDOMAIN (Name Not Found)...')
const nxdomainState = {
  connection: { isConnected: true, mode: 'live', status: 'connected' },
  target: {
    cleanDomain: 'non-existent-domain-xyz-1234.com',
    state: 'ACTIVE',
    vantagePoints: [
      { id: 'google', name: 'Google Public DNS', rcode: 'NXDOMAIN', status: 'ONLINE' },
      { id: 'cloudflare', name: 'Cloudflare Anycast', rcode: 'NXDOMAIN', status: 'ONLINE' },
    ],
  },
  errors: { rate: 0, resolutionFailureRate: 0, dominant: 'NXDOMAIN' },
}

const health3 = getCanonicalHealth(nxdomainState)
console.log('Result 3:', {
  targetStatus: health3.targetStatus,
  status: health3.status,
  targetLabel: health3.targetLabel,
  healthPercent: health3.healthPercent,
})

assert.strictEqual(health3.status, 'NOT_FOUND', 'Status must be NOT_FOUND')
assert.strictEqual(health3.targetStatus, 'NOT_FOUND', 'Target status must be NOT_FOUND')
assert.strictEqual(health3.targetLabel, 'NAME NOT FOUND', 'Target label must be NAME NOT FOUND')
assert.strictEqual(health3.healthPercent, 100, 'Health percent for NXDOMAIN should be 100 (informative)')
console.log('✓ TEST 3 PASSED: NXDOMAIN produces NOT_FOUND without infrastructure criticality.')

// ============================================================================
// TEST 4: SERVFAIL (Genuine Infrastructure Breakdown)
// ============================================================================
console.log('\n[TEST 4] SERVFAIL (Genuine Infrastructure Breakdown)...')
const servfailState = {
  connection: { isConnected: true, mode: 'live', status: 'connected' },
  target: {
    cleanDomain: 'broken-auth.example.com',
    state: 'ACTIVE',
    vantagePoints: [
      { id: 'google', name: 'Google Public DNS', rcode: 'SERVFAIL', status: 'ERROR' },
      { id: 'cloudflare', name: 'Cloudflare Anycast', rcode: 'SERVFAIL', status: 'ERROR' },
    ],
  },
  errors: { rate: 100, resolutionFailureRate: 100, dominant: 'SERVFAIL' },
}

const health4 = getCanonicalHealth(servfailState)
console.log('Result 4:', {
  targetStatus: health4.targetStatus,
  status: health4.status,
  targetLabel: health4.targetLabel,
  healthPercent: health4.healthPercent,
})

assert.strictEqual(health4.status, 'CRITICAL', 'Status must be CRITICAL')
assert.strictEqual(health4.targetStatus, 'CRITICAL', 'Target status must be CRITICAL')
assert.strictEqual(health4.targetLabel, 'SERVFAIL', 'Target label must be SERVFAIL')
assert.strictEqual(health4.healthPercent, 0, 'Health percent must be 0')
console.log('✓ TEST 4 PASSED: SERVFAIL produces CRITICAL with 0% health.')

// ============================================================================
// TEST 5: Backend Offline / Telemetry Disconnected
// ============================================================================
console.log('\n[TEST 5] Backend Offline / Telemetry Disconnected...')
const offlineState = {
  connection: { isConnected: false, isBackendOffline: true, mode: 'offline', status: 'offline' },
  target: { cleanDomain: 'cloudflare.com', state: 'ACTIVE' },
}

const health5 = getCanonicalHealth(offlineState)
console.log('Result 5:', {
  targetStatus: health5.targetStatus,
  measurementSystemStatus: health5.measurementSystemStatus,
  status: health5.status,
})

assert.strictEqual(health5.targetStatus, 'UNKNOWN', 'Target status must be UNKNOWN')
assert.strictEqual(health5.measurementSystemStatus, 'OFFLINE', 'System status must be OFFLINE')
assert.strictEqual(health5.status, 'UNKNOWN', 'Status must be UNKNOWN (never CRITICAL)')
console.log('✓ TEST 5 PASSED: Offline telemetry produces UNKNOWN/OFFLINE without critical status.')

// ============================================================================
// TEST 6: Real Resolution Failure Spike (>=25% error rate)
// ============================================================================
console.log('\n[TEST 6] Confirmed Resolution Failure Spike (e.g. 50% timeout/servfail)...')
const confirmedFailureState = {
  connection: { isConnected: true, mode: 'live', status: 'connected' },
  target: {
    cleanDomain: 'flapping.example.com',
    state: 'ACTIVE',
    vantagePoints: [
      { id: 'google', name: 'Google Public DNS', rcode: 'NOERROR', status: 'ONLINE' },
      { id: 'cloudflare', name: 'Cloudflare Anycast', rcode: 'SERVFAIL', status: 'ERROR' },
      { id: 'quad9', name: 'Quad9 DNS', rcode: 'TIMEOUT', status: 'TIMEOUT' },
      { id: 'opendns', name: 'OpenDNS', rcode: 'NOERROR', status: 'ONLINE' },
    ],
  },
  errors: { rate: 50, resolutionFailureRate: 50, dominant: 'SERVFAIL' },
}

const health6 = getCanonicalHealth(confirmedFailureState)
console.log('Result 6:', {
  targetStatus: health6.targetStatus,
  status: health6.status,
  healthPercent: health6.healthPercent,
})

assert.strictEqual(health6.status, 'CRITICAL', 'Status must be CRITICAL when errorRate >= 25%')
console.log('✓ TEST 6 PASSED: Confirmed failure evidence (errorRate >= 25%) produces CRITICAL.')

console.log('\n======================================================')
console.log('ALL CANONICAL HEALTH PIPELINE INTEGRITY TESTS PASSED!')
console.log('======================================================\n')
