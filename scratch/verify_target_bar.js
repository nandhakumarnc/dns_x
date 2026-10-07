import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TargetBar from '../src/components/noc/TargetBar.jsx'
import { DNSStateProvider } from '../src/contexts/DNSStateContext.jsx'

// Test 1: cleanDomainInput logic check
function cleanDomainInput(raw) {
  if (!raw) return ''
  let cleaned = raw.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//i, '')
  cleaned = cleaned.split('/')[0]
  cleaned = cleaned.split('?')[0]
  cleaned = cleaned.split('#')[0]
  cleaned = cleaned.split(':')[0]
  return cleaned
}

const testInputs = [
  'example.com',
  'www.example.com',
  'https://example.com',
  'https://www.example.com/path'
]

console.log('--- Testing domain cleaning ---')
testInputs.forEach(input => {
  const cleaned = cleanDomainInput(input)
  console.log(`Input: "${input}" -> Cleaned: "${cleaned}"`)
})

// Test 2: TargetBar initial render in NO_TARGET state
console.log('\n--- Testing TargetBar initial render ---')
const html = renderToStaticMarkup(
  React.createElement(DNSStateProvider, null,
    React.createElement(TargetBar, null)
  )
)

const hasInput = html.includes('id="dns-target-input"')
const hasPlaceholder = html.includes('placeholder="Enter domain or website URL..."')
const hasSubtext = html.includes('Add a DNS target to begin monitoring.')
const hasAnalyzeBtn = html.includes('id="dns-analyze-btn"')
const hasChips = html.includes('cloudflare.com') && html.includes('google.com')

console.log('Target Input Box present:', hasInput)
console.log('Correct Placeholder present:', hasPlaceholder)
console.log('Subtext present:', hasSubtext)
console.log('Analyze Button present:', hasAnalyzeBtn)
console.log('Quick chips present:', hasChips)

if (!hasInput || !hasPlaceholder || !hasSubtext || !hasAnalyzeBtn || !hasChips) {
  console.error('VERIFICATION FAILED!')
  process.exit(1)
} else {
  console.log('\nALL STATIC VERIFICATIONS PASSED!')
}
