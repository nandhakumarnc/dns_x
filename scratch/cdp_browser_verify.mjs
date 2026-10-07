import { spawn } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const userDataDir = join(tmpdir(), 'chrome_cdp_profile_' + Date.now())
mkdirSync(userDataDir, { recursive: true })

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

console.log('1. Launching Google Chrome (Headless) with http://localhost:5173/ ...')
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  'http://localhost:5173/'
], {
  detached: false,
  stdio: 'ignore'
})

// Wait 2s for Chrome to bind and load
await new Promise(r => setTimeout(r, 2000))

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl)
    this.id = 1
    this.callbacks = new Map()
    this.eventListeners = new Map()

    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve
      this.ws.onerror = reject
    })

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data)
      if (data.id && this.callbacks.has(data.id)) {
        const { resolve, reject } = this.callbacks.get(data.id)
        this.callbacks.delete(data.id)
        if (data.error) reject(data.error)
        else resolve(data.result)
      } else if (data.method && this.eventListeners.has(data.method)) {
        for (const listener of this.eventListeners.get(data.method)) {
          listener(data.params)
        }
      }
    }
  }

  send(method, params = {}) {
    const id = this.id++
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(handler)
  }

  close() {
    this.ws.close()
  }
}

async function run() {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json/list')
    const listData = await listRes.json()
    const pageTarget = listData.find(t => t.type === 'page' && t.url.includes('5173')) || listData.find(t => t.type === 'page')

    if (!pageTarget) {
      throw new Error('No page target found: ' + JSON.stringify(listData))
    }

    console.log('2. Connected to tab:', pageTarget.url, pageTarget.title)

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl)
    await cdp.ready
    console.log('3. CDP Session Ready.')

    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    // Wait 2.5s for initial render of NO_TARGET
    await new Promise(r => setTimeout(r, 2500))

    const evaluate = async (fn, ...args) => {
      const expr = args.length > 0
        ? `(${fn.toString()})(${args.map(a => JSON.stringify(a)).join(',')})`
        : `(${fn.toString()})()`
      const res = await cdp.send('Runtime.evaluate', {
        expression: expr,
        returnByValue: true,
        awaitPromise: true
      })
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails))
      }
      return res.result?.value
    }

    console.log('\n========================================')
    console.log('INITIAL STATE (NO_TARGET) VERIFICATION')
    console.log('========================================')
    const initialInfo = await evaluate(() => {
      const input = document.querySelector('#dns-target-input')
      const btn = document.querySelector('#dns-analyze-btn')
      return {
        inputFound: !!input,
        placeholder: input?.placeholder || null,
        btnFound: !!btn,
        btnText: btn?.innerText?.replace(/\s+/g, ' ').trim() || null,
        chips: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t.includes('.'))
      }
    })
    console.log('Target Input:', initialInfo.inputFound ? 'RENDERED' : 'MISSING', `(Placeholder: "${initialInfo.placeholder}")`)
    console.log('Analyze Button:', initialInfo.btnFound ? 'RENDERED' : 'MISSING', `(Text: "${initialInfo.btnText}")`)
    console.log('Quick-start chips:', initialInfo.chips)

    // Helper to test a domain
    async function testDomain(domainName, scenarioLabel, testDrawer = false) {
      console.log(`\n========================================`)
      console.log(`SCENARIO ${scenarioLabel}: Testing ${domainName}`)
      console.log(`========================================`)

      // Fill input and click analyze
      await evaluate((targetDomain) => {
        const changeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CHANGE TARGET'))
        if (changeBtn) changeBtn.click()

        const input = document.querySelector('#dns-target-input')
        if (input) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
          nativeInputValueSetter.call(input, targetDomain)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
        const btn = document.querySelector('#dns-analyze-btn')
        if (btn) btn.click()
      }, domainName)

      // Poll until probe completes (state transitions to ACTIVE, wait up to 20s)
      let active = false
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 500))
        const status = await evaluate(() => {
          const bodyText = document.body.innerText
          const isAnalyzing = bodyText.includes('ANALYZING...') || bodyText.includes('ANALYZING REAL-TIME DNS')
          const hasNocHeader = bodyText.includes('NOC /') || bodyText.includes('EVIDENCE & BASELINE ASSESSMENT')
          return { isAnalyzing, hasNocHeader }
        })
        if (status.hasNocHeader && !status.isAnalyzing) {
          active = true
          break
        }
      }

      await new Promise(r => setTimeout(r, 1000))

      // Check drawer if requested
      let drawerInfo = null
      if (testDrawer) {
        // Click VIEW EVIDENCE
        await evaluate(() => {
          const viewEvidenceBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('VIEW EVIDENCE'))
          if (viewEvidenceBtn) viewEvidenceBtn.click()
        })
        await new Promise(r => setTimeout(r, 800))

        drawerInfo = await evaluate(() => {
          const bodyText = document.body.innerText
          const hasDrawer = bodyText.includes('EVIDENCE DOSSIER') || bodyText.includes('Real AI Assessment Evidence')
          const prohibitedInDrawer = [
            'CRITICAL RISK', 'HIGH RISK', 'MEDIUM RISK', 'LOW RISK', 'ESTIMATED OUTAGE RISK'
          ].filter(p => bodyText.includes(p))

          const drawerMetrics = Array.from(document.querySelectorAll('*'))
            .filter(d => d.innerText && (d.innerText.includes('CANONICAL OPERATIONAL STATE') || d.innerText.includes('BASELINE SAMPLES COLLECTED')))
            .map(d => d.innerText.replace(/\n+/g, ' | '))

          // Close drawer
          const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'CLOSE')
          if (closeBtn) closeBtn.click()

          return { hasDrawer, prohibitedInDrawer, drawerMetrics: drawerMetrics.slice(0, 4) }
        })

        await new Promise(r => setTimeout(r, 500))
      }

      // Extract comprehensive UI telemetry inspection
      const pageInspection = await evaluate(() => {
        const bodyText = document.body.innerText

        // 1. Prohibited strings check
        const prohibitedPatterns = [
          'CRITICAL RISK',
          'HIGH RISK',
          'MEDIUM RISK',
          'LOW RISK',
          'ESTIMATED OUTAGE RISK',
          'HEALTHY RISK',
          'DEGRADED RISK'
        ]
        const prohibitedFound = prohibitedPatterns.filter(pattern => bodyText.includes(pattern))

        // 2. Extract Top KPI Cards
        const kpiCards = []
        const metricLabels = ['TARGET HEALTH', 'DNS QPS', 'RESPONSE LATENCY', 'RESOLUTION FAILURE RATE']
        for (const label of metricLabels) {
          const allEls = Array.from(document.querySelectorAll('*'))
          const el = allEls.find(d => d.children.length === 0 && d.innerText?.trim() === label)
          if (el && el.parentElement) {
            kpiCards.push({
              label,
              renderedText: el.parentElement.innerText.replace(/\n+/g, ' | ')
            })
          }
        }

        // 3. Extract NOC Header Target Badge
        const headerEls = Array.from(document.querySelectorAll('*'))
          .filter(el => el.innerText && el.innerText.includes('TARGET:') && el.innerText.includes('SYSTEM:'))
          .map(el => el.innerText.replace(/\n+/g, ' | '))

        // 4. Extract AI Assessment Section texts
        const aiSection = Array.from(document.querySelectorAll('section')).find(
          s => s.innerText && s.innerText.includes('EVIDENCE & BASELINE ASSESSMENT')
        )

        // 5. Signals and Incidents
        const incidentSection = Array.from(document.querySelectorAll('section')).find(
          s => s.innerText && s.innerText.includes('SIGNALS & ACTIVE INCIDENTS')
        )

        return {
          prohibitedFound,
          kpiCards,
          headerBadge: headerEls[headerEls.length - 1] || null,
          aiSectionText: aiSection ? aiSection.innerText.replace(/\n+/g, ' | ') : null,
          incidentSectionText: incidentSection ? incidentSection.innerText.replace(/\n+/g, ' | ') : null
        }
      })

      console.log(`Results for ${domainName}:`)
      console.log(`- Prohibited Risk Strings Found:`, pageInspection.prohibitedFound.length === 0 ? '0 (COMPLETELY ELIMINATED)' : pageInspection.prohibitedFound)
      console.log(`- Header Status Badges:`, pageInspection.headerBadge)
      console.log(`- Top KPI Cards:`)
      for (const card of pageInspection.kpiCards) {
        console.log(`    [${card.label}]: ${card.renderedText}`)
      }
      console.log(`- AI Assessment Section:\n    ${pageInspection.aiSectionText}`)
      console.log(`- Incidents & Signals:\n    ${pageInspection.incidentSectionText}`)
      if (drawerInfo) {
        console.log(`- Evidence Drawer Check:`)
        console.log(`    Drawer Mounted: ${drawerInfo.hasDrawer}`)
        console.log(`    Prohibited Strings in Drawer: ${drawerInfo.prohibitedInDrawer.length === 0 ? '0 (CLEAN)' : drawerInfo.prohibitedInDrawer}`)
        console.log(`    Drawer Operational State: ${JSON.stringify(drawerInfo.drawerMetrics)}`)
      }

      return { pageInspection, drawerInfo }
    }

    // Scenario A: cloudflare.com (with Drawer inspection)
    await testDomain('cloudflare.com', 'A', true)

    // Scenario B: google.com
    await testDomain('google.com', 'B', false)

    // Scenario C: Non-existent domain
    await testDomain('nonexistent-dnsx-audit-test-999.com', 'C', false)

    // Scenario D: Backend Offline Simulation
    console.log(`\n========================================`)
    console.log(`SCENARIO D: Backend Offline Verification`)
    console.log(`========================================`)
    await cdp.send('Network.enable')
    await cdp.send('Network.setBlockedURLs', { urls: ['*://localhost:3001/*', '*://127.0.0.1:3001/*'] })

    await evaluate(() => {
      const changeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CHANGE TARGET'))
      if (changeBtn) changeBtn.click()

      const input = document.querySelector('#dns-target-input')
      if (input) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        nativeInputValueSetter.call(input, 'offline-test.com')
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }
      const btn = document.querySelector('#dns-analyze-btn')
      if (btn) btn.click()
    })

    // Wait 3.5s for probe timeout / offline fallback
    await new Promise(r => setTimeout(r, 3500))

    const offlineInspection = await evaluate(() => {
      const bodyText = document.body.innerText
      const prohibitedPatterns = ['CRITICAL RISK', 'HIGH RISK', 'ESTIMATED OUTAGE RISK']
      const prohibitedFound = prohibitedPatterns.filter(pattern => bodyText.includes(pattern))

      return {
        prohibitedFound,
        isFailedView: bodyText.includes('TARGET OBSERVATION FAILED') || bodyText.includes('TELEMETRY UNAVAILABLE'),
        bodySnippet: bodyText.slice(0, 500).replace(/\n+/g, ' | ')
      }
    })

    console.log(`Offline Simulation Result:`)
    console.log(`- Prohibited Strings in Offline State:`, offlineInspection.prohibitedFound.length === 0 ? '0 (CLEAN)' : offlineInspection.prohibitedFound)
    console.log(`- Target Failed/Offline View Active:`, offlineInspection.isFailedView)
    console.log(`- Visible Offline Text:`, offlineInspection.bodySnippet)

    cdp.close()
  } catch (err) {
    console.error('Error during CDP execution:', err)
  } finally {
    chromeProc.kill()
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {}
  }
}

await run()
console.log('\n=== LIVE BROWSER VERIFICATION COMPLETED ===')
