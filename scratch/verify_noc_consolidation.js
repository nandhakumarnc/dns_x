import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import NOC from '../src/pages/NOC.jsx'
import { DNSStateProvider } from '../src/contexts/DNSStateContext.jsx'
import { getCanonicalHealth } from '../src/utils/canonicalHealth.js'

console.log('--- Testing Canonical Health logic ---')
const mockStateNormal = {
  target: { state: 'ACTIVE' },
  system: { health: 98.2 },
  errors: { rate: 1.2 },
  performance: { latency: 18 },
  ai: { outageRisk: 4 },
  incidents: [],
}
const normal = getCanonicalHealth(mockStateNormal)
console.log('Normal state:', normal.status, normal.label, normal.healthPercent)
if (normal.status !== 'HEALTHY') throw new Error('Expected HEALTHY')

const mockStateCritical = {
  target: { state: 'ACTIVE' },
  system: { health: 60 },
  errors: { rate: 65 },
  performance: { latency: 2600 },
  ai: { outageRisk: 75 },
  incidents: [{ id: 'inc-1', severity: 'CRITICAL', status: 'investigating' }],
}
const critical = getCanonicalHealth(mockStateCritical)
console.log('Critical state:', critical.status, critical.label, critical.healthPercent)
if (critical.status !== 'CRITICAL') throw new Error('Expected CRITICAL')

console.log('\n--- Testing NOC Page Render (NO_TARGET) ---')
const html = renderToStaticMarkup(
  React.createElement(DNSStateProvider, null,
    React.createElement(NOC, null)
  )
)

const hasTargetInput = html.includes('id="dns-target-input"')
const hasAnalyzeBtn = html.includes('id="dns-analyze-btn"')
const hasGatedPlaceholder = html.includes('Add a DNS target to begin monitoring.')
console.log('Target Input Box present:', hasTargetInput)
console.log('Analyze Button present:', hasAnalyzeBtn)
console.log('Gated Placeholder present:', hasGatedPlaceholder)

if (!hasTargetInput || !hasAnalyzeBtn || !hasGatedPlaceholder) {
  throw new Error('NOC NO_TARGET verification failed')
}

console.log('\nALL CONSOLIDATION CHECKS PASSED!')
