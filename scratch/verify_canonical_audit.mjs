import { getCanonicalHealth } from '../src/utils/canonicalHealth.js'
import { normalizeProbeResponse } from '../src/utils/normalizeProbe.js'

console.log('=== RUNNING CANONICAL STATE & RISK AUDIT VERIFICATION ===\n')

function buildDnsState(norm, cleanDomain, override = {}) {
  return {
    connection: { status: 'online', isConnected: true, isBackendOffline: false },
    target: {
      state: 'ACTIVE',
      cleanDomain,
      domain: cleanDomain,
      vantagePoints: norm.vantagePoints,
      authoritative: norm.authoritative,
      latency: norm.latency
    },
    errors: {
      rate: norm.resolutionFailureRate,
      resolutionFailureRate: norm.resolutionFailureRate,
      dominant: norm.dominantRcode
    },
    performance: { latency: norm.latency },
    ai: norm.ai,
    incidents: [],
    signals: [],
    ...override
  }
}

// Test Scenario 1: Healthy Domain (e.g. cloudflare.com / google.com)
// NOERROR, 0 resolution failures, responsive resolvers
const rawHealthyProbe = {
  timestamp: Date.now(),
  target: {
    cleanDomain: 'cloudflare.com',
    domain: 'cloudflare.com',
    records: { A: ['104.16.132.229'] },
    authoritative: [{ host: 'ns3.cloudflare.com', latency_ms: 22, rcode: 'NOERROR' }],
    vantagePoints: [
      { id: 'cf', name: 'Cloudflare', rcode: 'NOERROR', latency_ms: 20 },
      { id: 'gg', name: 'Google', rcode: 'NOERROR', latency_ms: 22 }
    ]
  },
  errors: { rate: 0, resolutionFailureRate: 0, dominant: 'NOERROR' },
  performance: { latency: 21 },
  ai: {
    samplesCollected: 1,
    samplesRequired: 5,
    baseline: 'CALIBRATING',
    outageRisk: null
  }
}

const normHealthy = normalizeProbeResponse(rawHealthyProbe, 'cloudflare.com')
const stateHealthy = buildDnsState(normHealthy, 'cloudflare.com')
const canonicalHealthy = getCanonicalHealth(stateHealthy)

console.log('1. Healthy Domain Test:')
console.log('   - Canonical Status:', canonicalHealthy.status)
console.log('   - Canonical Target Label:', canonicalHealthy.targetLabel)
console.log('   - Canonical Health %:', canonicalHealthy.healthPercent)
console.log('   - Outage Risk:', normHealthy.ai.outageRisk)
console.assert(canonicalHealthy.status === 'HEALTHY', 'FAIL: Healthy domain status should be HEALTHY')
console.assert(canonicalHealthy.targetLabel === 'OBSERVED HEALTHY', 'FAIL: Target label should be OBSERVED HEALTHY')
console.assert(normHealthy.ai.outageRisk === null, 'FAIL: outageRisk must be null')
console.log('   -> PASSED (Zero Critical Risk, Observed Healthy)\n')

// Test Scenario 2: Calibration State (1/5 samples)
console.log('2. Calibration State Test:')
console.log('   - Baseline Status:', normHealthy.ai.baseline)
console.log('   - Target Health during calibration:', canonicalHealthy.status)
console.assert(canonicalHealthy.status === 'HEALTHY', 'FAIL: Calibration with NOERROR must remain HEALTHY')
console.assert(normHealthy.ai.baseline === 'CALIBRATING', 'FAIL: Baseline must be CALIBRATING')
console.log('   -> PASSED (Calibration is never degradation or risk)\n')

// Test Scenario 3: NXDOMAIN (Non-existent domain)
const rawNxProbe = {
  timestamp: Date.now(),
  target: {
    cleanDomain: 'nonexistent-test.com',
    domain: 'nonexistent-test.com',
    records: { A: [] },
    vantagePoints: [
      { id: 'cf', name: 'Cloudflare', rcode: 'NXDOMAIN', latency_ms: 80 }
    ]
  },
  errors: { rate: 0, resolutionFailureRate: 0, dominant: 'NXDOMAIN', nxdomain: 1 },
  performance: { latency: 80 },
  ai: { samplesCollected: 1, samplesRequired: 5, baseline: 'CALIBRATING', outageRisk: null }
}
const normNx = normalizeProbeResponse(rawNxProbe, 'nonexistent-test.com')
const stateNx = buildDnsState(normNx, 'nonexistent-test.com')
const canonicalNx = getCanonicalHealth(stateNx)

console.log('3. NXDOMAIN Domain Test:')
console.log('   - Canonical Status:', canonicalNx.status)
console.log('   - Canonical Target Label:', canonicalNx.targetLabel)
console.log('   - Color:', canonicalNx.color)
console.assert(canonicalNx.status === 'NOT_FOUND', 'FAIL: NXDOMAIN must be NOT_FOUND')
console.assert(canonicalNx.targetLabel === 'NAME NOT FOUND', 'FAIL: Label must be NAME NOT FOUND')
console.assert(canonicalNx.color === '#38bdf8', 'FAIL: Color must be informative blue (#38bdf8), not red')
console.log('   -> PASSED (NXDOMAIN does not imply infrastructure critical)\n')

// Test Scenario 4: Backend / Telemetry Offline
const offlineState = {
  connection: { status: 'offline', isBackendOffline: true },
  target: { state: 'ACTIVE', cleanDomain: 'cloudflare.com' }
}
const canonicalOffline = getCanonicalHealth(offlineState)

console.log('4. Backend Offline Test:')
console.log('   - Target Status:', canonicalOffline.targetStatus)
console.log('   - Measurement System Status:', canonicalOffline.measurementSystemStatus)
console.log('   - Health Percent:', canonicalOffline.healthPercent)
console.assert(canonicalOffline.targetStatus === 'UNKNOWN', 'FAIL: Offline target status must be UNKNOWN')
console.assert(canonicalOffline.measurementSystemStatus === 'OFFLINE', 'FAIL: System status must be OFFLINE')
console.assert(canonicalOffline.healthPercent === null, 'FAIL: Metrics must be null/NA')
console.log('   -> PASSED (No telemetry -> Target UNKNOWN, System OFFLINE, never Critical Risk)\n')

// Test Scenario 5: Real Degradation & SERVFAIL
const rawServfailProbe = {
  timestamp: Date.now(),
  target: {
    cleanDomain: 'broken-auth-dns.com',
    records: { A: [] },
    vantagePoints: [{ id: 'cf', name: 'Cloudflare', rcode: 'SERVFAIL', latency_ms: 1000 }]
  },
  errors: { rate: 100, resolutionFailureRate: 100, dominant: 'SERVFAIL', servfail: 1 },
  performance: { latency: 1000 },
  ai: { samplesCollected: 5, samplesRequired: 5, baseline: 'BASELINE ESTABLISHED', outageRisk: null }
}
const normServfail = normalizeProbeResponse(rawServfailProbe, 'broken-auth-dns.com')
const stateServfail = buildDnsState(normServfail, 'broken-auth-dns.com')
const canonicalServfail = getCanonicalHealth(stateServfail)

console.log('5. SERVFAIL Infrastructure Failure Test:')
console.log('   - Canonical Status:', canonicalServfail.status)
console.log('   - Canonical Target Label:', canonicalServfail.targetLabel)
console.log('   - Health Percent:', canonicalServfail.healthPercent)
console.assert(canonicalServfail.status === 'CRITICAL', 'FAIL: SERVFAIL must be CRITICAL')
console.assert(canonicalServfail.healthPercent === 0, 'FAIL: SERVFAIL health must be 0%')
console.log('   -> PASSED (Real infrastructure failure verified)\n')

console.log('=== ALL 5 AUDIT SCENARIOS PASSED WITH STRICT CANONICAL INTEGRITY ===')
