import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { realtimeClient } from '../hooks/useRealtime'
import {
  getOverview,
  getIncidents,
  getSignals,
  validateDomainTarget,
  probeDomain,
  setActiveTarget,
  clearActiveTarget,
  acknowledgeIncident as apiAcknowledge,
  resolveIncident as apiResolve,
} from '../services/dnsService'
import { normalizeProbeResponse } from '../utils/normalizeProbe'

const DNSStateContext = createContext(null)

const defaultAnalysisSteps = [
  { id: 'validate', label: 'Domain syntax & hostname format validation', status: 'pending' },
  { id: 'resolve', label: 'DNS resolution (A / AAAA authoritative records)', status: 'pending' },
  { id: 'nameservers', label: 'Authoritative nameserver discovery & vantage probes', status: 'pending' },
  { id: 'health', label: 'Real telemetry & statistical baseline calibration', status: 'pending' },
]

const initialTargetState = {
  state: 'NO_TARGET', // 'NO_TARGET' | 'ANALYZING' | 'ACTIVE' | 'FAILED'
  domain: '',
  cleanDomain: '',
  ips: [],
  nameservers: [],
  records: { A: [], AAAA: [], NS: [], CNAME: [], MX: [], TXT: [] },
  authoritative: [],
  vantagePoints: [],
  latency: null,
  resolvedAt: null,
  error: null,
  analysisSteps: defaultAnalysisSteps,
}

const initialBaseState = {
  timestamp: Date.now(),
  system: {
    status: 'idle',
    health: null,
    monitoringStatus: 'IDLE',
  },
  traffic: {
    qps: null,
    peakQps: null,
    averageQps: null,
    probeRate: null,
    isPublicDomain: true,
    displayNote: 'DNS QPS = N/A (PUBLIC TARGET)',
  },
  performance: {
    latency: null,
    p95: null,
    cacheHit: null,
    cacheHitNote: 'CACHE HIT RATIO UNAVAILABLE (PUBLIC DOMAIN)',
  },
  errors: {
    rate: null,
    resolutionFailureRate: null,
    nxDomainRate: null,
    servfailRate: null,
    timeoutRate: null,
    dominant: 'NONE',
    trend: 'stable',
    nxdomain: null,
    servfail: null,
    timeout: null,
  },
  infrastructure: {
    gateway: {
      status: 'idle',
      qps: null,
      type: 'PUBLIC VANTAGE FLEET',
    },
    resolvers: [],
    cache: {
      status: 'unavailable',
      hitRate: null,
    },
  },
  ai: {
    anomalyScore: null,
    outageRisk: null,
    confidence: null,
    baseline: 'NOT STARTED',
    severity: 'low',
    assessment: 'No active target domain selected for monitoring.',
    signal: '',
    recommendation: '',
    samplesCollected: 0,
    samplesRequired: 5,
  },
}

function cleanDomainInput(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let cleaned = raw.trim().toLowerCase()
  cleaned = cleaned.replace(/^https?:\/\//i, '')
  cleaned = cleaned.split('/')[0]
  cleaned = cleaned.split('?')[0]
  cleaned = cleaned.split('#')[0]
  cleaned = cleaned.split(':')[0]
  return cleaned
}

function isValidDomain(domain) {
  if (!domain) return false
  if (domain.length > 253) return false
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i
  return domainRegex.test(domain) || domain === 'localhost'
}

/**
 * Format timestamp into HH:MM:SS string
 */
function formatTime(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function DNSStateProvider({ children }) {
  const [state, setState] = useState(() => ({
    ...initialBaseState,
    target: initialTargetState,
    incidents: [],
    signals: [],
    measurementHistory: [], // Real time-series buffer of measurement samples
    selectedIncident: null,
    activeAiAssessment: null,
    connection: {
      isConnected: false,
      mode: 'idle',
      lastUpdated: Date.now(),
    },
  }))

  const hasReceivedLiveTelemetry = useRef(false)
  const lastLiveMessageTs = useRef(0)
  const measurementHistoryRef = useRef([])
  const activeSignalTrackerRef = useRef(new Map())
  const inFlightTargetRef = useRef(null)

  // Keep ref synchronized
  useEffect(() => {
    measurementHistoryRef.current = state.measurementHistory
  }, [state.measurementHistory])

  // ── Process Incoming Real Measurement Payload ──────────────────────────────
  const ingestMeasurementSample = useCallback((payload) => {
    if (!payload) return

    setState((prev) => {
      if (prev.target?.state !== 'ACTIVE') return prev

      // Data hygiene: reject telemetry samples from mismatched/prior targets
      const payloadDomain = payload.domain || payload.target?.cleanDomain || payload.target?.domain
      if (payloadDomain && prev.target?.cleanDomain && payloadDomain.toLowerCase() !== prev.target.cleanDomain.toLowerCase()) {
        return prev
      }

      let norm
      try {
        norm = normalizeProbeResponse(payload, prev.target.cleanDomain)
      } catch (err) {
        console.warn('[ingestMeasurementSample] Normalization failed:', err.message)
        return prev
      }

      const now = norm.timestamp
      const latency = norm.medianLatency ?? norm.latency
      const resolutionFailureRate = norm.resolutionFailureRate ?? (norm.dominantRcode === 'NXDOMAIN' ? 0.0 : norm.errorRate)
      const rcode = norm.dominantRcode

      const newSample = {
        timestamp: now,
        timeStr: formatTime(now),
        latency,
        errorRate: resolutionFailureRate,
        rcode,
        vantagePoints: norm.vantagePoints,
      }

      const updatedHistory = [...(prev.measurementHistory || []), newSample].slice(-30)

      // Calculate Real Statistical Baseline from accumulated samples
      const sampleCount = updatedHistory.length
      const isCalibrating = sampleCount < 5

      let baselineMean = 0
      let baselineStdDev = 0
      let zScore = 0

      if (!isCalibrating) {
        const lats = updatedHistory.map((s) => s.latency).filter((l) => typeof l === 'number')
        baselineMean = lats.reduce((a, b) => a + b, 0) / lats.length
        const variance =
          lats.reduce((acc, v) => acc + Math.pow(v - baselineMean, 2), 0) /
          (lats.length - 1 || 1)
        baselineStdDev = Math.sqrt(variance)
        if (baselineStdDev > 0) {
          zScore = (latency - baselineMean) / baselineStdDev
        }
      }

      // Generate Real Signals strictly from observed deviation
      const signals = []
      const incidents = []

      if (!isCalibrating) {
        // Anomaly requires significant statistical z-score AND meaningful absolute difference
        if (zScore >= 3.0 && (latency - baselineMean) >= 50 && latency > 150) {
          signals.push({
            id: `sig-lat-${now}`,
            target_domain: prev.target.cleanDomain,
            type: 'LATENCY_DEVIATION',
            metric_key: 'latency_median',
            observed: latency,
            baseline_mean: Number(baselineMean.toFixed(1)),
            baseline_stddev: Number(baselineStdDev.toFixed(1)),
            deviation_score: Number(zScore.toFixed(2)),
            vantage_point: 'Multi-Resolver Fleet (Median)',
            confidence: 0.92,
            ts: new Date(now).toISOString(),
            source: 'SOURCE: Multi-Resolver Statistical Baseline Deviation',
          })
        }

        // Error spike requires actual resolution errors (excludes expected NXDOMAIN)
        if (resolutionFailureRate >= 15 && rcode !== 'NXDOMAIN' && rcode !== 'NOERROR') {
          const failingVps = (norm.vantagePoints || [])
            .filter((v) => v.rcode === 'SERVFAIL' || v.rcode === 'TIMEOUT')
            .map((v) => v.name)
          const sigType = rcode === 'SERVFAIL' ? 'SERVFAIL_SPIKE' : 'RESOLVER_FAILURE'

          signals.push({
            id: `sig-err-${now}`,
            target_domain: prev.target.cleanDomain,
            type: sigType,
            metric_key: 'resolution_failure_rate',
            observed: resolutionFailureRate,
            baseline_mean: 0,
            baseline_stddev: 1,
            deviation_score: 3.0,
            vantage_point: failingVps.join(', ') || 'Vantage Points',
            confidence: 0.95,
            ts: new Date(now).toISOString(),
            source: `SOURCE: Vantage Point Resolution Failure (${rcode})`,
          })
        }

        // Strict persistence / correlation pipeline:
        const activeTypes = new Set(signals.map((s) => s.type))
        for (const type of activeTypes) {
          const count = (activeSignalTrackerRef.current.get(type) || 0) + 1
          activeSignalTrackerRef.current.set(type, count)
        }
        for (const trackedType of Array.from(activeSignalTrackerRef.current.keys())) {
          if (!activeTypes.has(trackedType)) {
            activeSignalTrackerRef.current.delete(trackedType)
          }
        }

        const isObservedHealthy = resolutionFailureRate === 0 && (rcode === 'NOERROR' || rcode === 'NXDOMAIN')
        const hasPersistentSignal = Array.from(activeSignalTrackerRef.current.values()).some((c) => c >= 2)
        const hasCorrelatedSignals = signals.length >= 2
        const isWidespreadOutage = resolutionFailureRate >= 50

        // Incidents require actual failure evidence or persistent multi-resolver degradation.
        // If the domain is observed healthy, no incident is opened.
        if (!isObservedHealthy && (hasPersistentSignal || hasCorrelatedSignals || isWidespreadOutage)) {
          const isErrorIncident = signals.some((s) => s.type === 'SERVFAIL_SPIKE' || s.type === 'RESOLVER_FAILURE')
          const incidentSeverity = isErrorIncident && (resolutionFailureRate >= 50 || rcode === 'SERVFAIL')
            ? 'critical'
            : 'high'

          incidents.push({
            id: `inc-${now}`,
            target_domain: prev.target.cleanDomain,
            title: isErrorIncident
              ? `Resolution Error Surge for ${prev.target.cleanDomain} (${rcode})`
              : `Persistent Multi-Resolver Latency Escalation for ${prev.target.cleanDomain}`,
            status: 'active',
            severity: incidentSeverity,
            root_cause_class: isErrorIncident ? 'OPERATIONAL' : 'NETWORK',
            risk_level: 'elevated',
            affected_resolvers: (norm.vantagePoints || []).map((vp) => vp.name),
            started_at: new Date(now).toISOString(),
            signals: signals.map((s) => s.id),
          })
        }
      } else {
        activeSignalTrackerRef.current.clear()
      }

      // If domain is observed healthy, reset signal persistence tracker
      if (resolutionFailureRate === 0 && (rcode === 'NOERROR' || rcode === 'NXDOMAIN')) {
        activeSignalTrackerRef.current.clear()
      }

      // Formulate Real AI Assessment data
      let aiUpdate
      if (isCalibrating) {
        aiUpdate = {
          anomalyScore: null,
          outageRisk: null,
          confidence: null,
          baseline: 'CALIBRATING',
          severity: 'low',
          assessment: `AI ASSESSMENT: Insufficient telemetry for inference (accumulating sample ${sampleCount}/5)`,
          signal: 'Collecting baseline telemetry samples...',
          recommendation: 'Baseline calibration in progress. Awaiting statistical observation window.',
          samplesCollected: sampleCount,
          samplesRequired: 5,
        }
      } else {
        const isElevated = (zScore >= 2.5 && (latency - baselineMean) >= 50 && latency > 150) || resolutionFailureRate > 0
        const calculatedAnomalyScore = Math.min(1.0, Math.max(0.0, Number((zScore / 4).toFixed(2))))

        aiUpdate = {
          anomalyScore: calculatedAnomalyScore,
          outageRisk: null,
          confidence: Math.min(95, Math.round(65 + sampleCount * 1.0)),
          baseline: isElevated ? 'BASELINE ACTIVE · DEVIATION DETECTED' : 'BASELINE ESTABLISHED',
          severity: rcode === 'SERVFAIL' || resolutionFailureRate >= 50 ? 'critical' : isElevated ? 'warning' : 'low',
          assessment: isElevated
            ? `Statistical deviation observed for ${prev.target.cleanDomain}: Current probe latency (${latency.toFixed(1)}ms) is +${zScore.toFixed(1)}σ above baseline mean (${baselineMean.toFixed(1)}ms).`
            : `Observed healthy. DNS resolvers returned ${rcode} with ${resolutionFailureRate.toFixed(1)}% resolution failure across all vantage points. Round-trip latency (${latency.toFixed(1)}ms) is stable within nominal baseline bounds.`,
          signal: isElevated ? 'Operational latency / error variance above statistical threshold.' : 'No anomalous DNS deviations detected.',
          recommendation: isElevated
            ? 'Inspect upstream transit paths and authoritative nameserver responses.'
            : 'Continue normal monitoring.',
          samplesCollected: sampleCount,
          samplesRequired: 5,
          baselineMean: Number(baselineMean.toFixed(1)),
          baselineStdDev: Number(baselineStdDev.toFixed(1)),
          zScore: Number(zScore.toFixed(2)),
        }
      }

      // Stale incident & signal reconciliation:
      // Healthy observations clear stale operational states and resolve old critical incidents
      const isCurrentlyHealthy = resolutionFailureRate === 0 && (rcode === 'NOERROR' || rcode === 'NXDOMAIN')

      let reconciledIncidents = []
      if (incidents.length > 0) {
        reconciledIncidents = incidents
      } else if (isCurrentlyHealthy) {
        reconciledIncidents = (prev.incidents || []).map((inc) => {
          const incTarget = (inc.target_domain || inc.domain || '').toLowerCase()
          if (incTarget === prev.target.cleanDomain.toLowerCase() && inc.status !== 'resolved' && inc.status !== 'closed') {
            return { ...inc, status: 'resolved', resolved_at: new Date(now).toISOString() }
          }
          return inc
        })
      } else {
        reconciledIncidents = prev.incidents || []
      }

      const reconciledSignals = signals.length > 0
        ? signals
        : (isCurrentlyHealthy ? [] : (prev.signals || []))

      return {
        ...prev,
        system: {
          status: norm.systemStatus,
          health: norm.healthScore,
          monitoringStatus: 'MONITORING',
        },
        traffic: {
          ...prev.traffic,
          qps: null,
          probeRate: norm.vantagePoints.length || 4,
          isPublicDomain: true,
          displayNote: 'DNS QPS = N/A (PUBLIC TARGET)',
        },
        performance: {
          latency,
          median: norm.medianLatency ?? latency,
          mean: norm.meanLatency ?? latency,
          p95: norm.p95,
          cacheHit: null,
          cacheHitNote: 'CACHE HIT RATIO UNAVAILABLE (PUBLIC DOMAIN)',
        },
        errors: {
          rate: resolutionFailureRate,
          resolutionFailureRate,
          nxDomainRate: norm.nxDomainRate ?? 0,
          servfailRate: norm.servfailRate ?? 0,
          timeoutRate: norm.timeoutRate ?? 0,
          dominant: rcode,
          trend: resolutionFailureRate === 0 ? 'stable' : 'increasing',
          nxdomain: norm.rcodeCounts.NXDOMAIN || 0,
          servfail: norm.rcodeCounts.SERVFAIL || 0,
          timeout: norm.rcodeCounts.TIMEOUT || 0,
        },
        target: {
          ...prev.target,
          vantagePoints: norm.vantagePoints,
          authoritative: norm.authoritative.length > 0 ? norm.authoritative : prev.target.authoritative,
          latency,
        },
        infrastructure: norm.infrastructure,
        ai: aiUpdate,
        signals: reconciledSignals,
        incidents: reconciledIncidents,
        measurementHistory: updatedHistory,
        timestamp: now,
        connection: {
          isConnected: true,
          mode: 'live',
          lastUpdated: now,
        },
      }
    })
  }, [])

  // ── Initial REST Hydration ──────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      const [overviewData, incidentsData, signalsData] = await Promise.allSettled([
        getOverview(),
        getIncidents({ limit: 30 }),
        getSignals({ limit: 50 }),
      ])

      setState((prev) => {
        if (prev.target?.state !== 'ACTIVE') return prev

        let next = { ...prev }
        if (overviewData.status === 'fulfilled' && overviewData.value) {
          const ov = overviewData.value
          if (ov.target?.cleanDomain === prev.target.cleanDomain) {
            next = {
              ...next,
              system: ov.system ?? prev.system,
              performance: ov.performance ?? prev.performance,
              errors: ov.errors ?? prev.errors,
              infrastructure: ov.infrastructure ?? prev.infrastructure,
            }
          }
        }
        if (incidentsData.status === 'fulfilled' && Array.isArray(incidentsData.value)) {
          const isCurrentlyHealthy =
            (prev.errors?.resolutionFailureRate === 0 || prev.errors?.rate === 0) &&
            (prev.errors?.dominant === 'NOERROR' || prev.errors?.dominant === 'NONE')

          const relevant = incidentsData.value
            .filter(
              (inc) => inc.target_domain === prev.target.cleanDomain || inc.domain === prev.target.cleanDomain
            )
            .map((inc) => {
              if (isCurrentlyHealthy && inc.status !== 'resolved' && inc.status !== 'closed') {
                return { ...inc, status: 'resolved', resolved_at: new Date().toISOString() }
              }
              return inc
            })
          next.incidents = relevant
          if (!next.selectedIncident && relevant.length > 0) {
            next.selectedIncident = relevant[0]
          }
        }
        if (signalsData.status === 'fulfilled' && Array.isArray(signalsData.value)) {
          next.signals = signalsData.value.filter(
            (sig) => sig.target_domain === prev.target.cleanDomain || sig.domain === prev.target.cleanDomain
          )
        }
        return next
      })
    } catch (err) {
      console.warn('[DNSStateProvider] REST hydration error:', err.message)
    }
  }, [])

  // ── Realtime WebSocket Subscriptions ────────────────────────────────────────
  useEffect(() => {
    queueMicrotask(() => {
      refreshData()
    })

    // 1. Telemetry tick from real backend probe engine
    const handleMeasurementUpdate = (payload) => {
      if (!payload) return
      hasReceivedLiveTelemetry.current = true
      lastLiveMessageTs.current = Date.now()
      ingestMeasurementSample(payload)
    }

    const unsubTelemetry = realtimeClient.subscribe('telemetry.updated', handleMeasurementUpdate)
    const unsubMeasurement = realtimeClient.subscribe('measurement.dns', handleMeasurementUpdate)

    // 2. Individual resolver tick
    const unsubResolver = realtimeClient.subscribe('resolver.updated', (payload) => {
      if (!payload || !payload.id) return
      setState((prev) => {
        if (prev.target?.state !== 'ACTIVE') return prev
        const resolvers = (prev.infrastructure?.resolvers || []).map((r) =>
          r.id === payload.id ? { ...r, ...payload } : r
        )
        return {
          ...prev,
          infrastructure: {
            ...prev.infrastructure,
            resolvers,
          },
        }
      })
    })

    // 3. New anomaly signal detected
    const unsubSignal = realtimeClient.subscribe('signal.detected', (payload) => {
      if (!payload) return
      setState((prev) => {
        if (prev.target?.state !== 'ACTIVE') return prev
        const exists = prev.signals.some((s) => s.id === payload.id)
        if (exists) return prev
        return { ...prev, signals: [payload, ...prev.signals].slice(0, 50) }
      })
    })

    // 4. Incident created
    const unsubIncidentCreated = realtimeClient.subscribe('incident.created', (payload) => {
      if (!payload) return
      setState((prev) => {
        if (prev.target?.state !== 'ACTIVE') return prev
        const exists = prev.incidents.some((inc) => inc.id === payload.id)
        if (exists) return prev
        return {
          ...prev,
          incidents: [payload, ...prev.incidents],
          selectedIncident: payload,
        }
      })
    })

    // 5. Status watcher
    const unsubStatus = realtimeClient.onStatusChange((status) => {
      setState((prev) => ({
        ...prev,
        connection: {
          ...prev.connection,
          isConnected: status === 'connected',
          mode: status === 'connected' ? 'live' : 'active_probe',
        },
      }))
    })

    return () => {
      unsubTelemetry()
      unsubMeasurement()
      unsubResolver()
      unsubSignal()
      unsubIncidentCreated()
      unsubStatus()
    }
  }, [refreshData, ingestMeasurementSample])

  // ── Active Target Real Periodic Probing Loop ────────────────────────────────
  // Ensures real queries continue updating even if WebSocket is disconnected
  useEffect(() => {
    if (state.target?.state !== 'ACTIVE' || !state.target?.cleanDomain) return

    const probeInterval = setInterval(async () => {
      const now = Date.now()
      const isWsRecent = hasReceivedLiveTelemetry.current && now - lastLiveMessageTs.current < 1500

      // If WebSocket already delivered a recent measurement within 1.5s, skip duplicate poll
      if (isWsRecent) return

      try {
        const probeRes = await probeDomain(state.target.cleanDomain)
        if (probeRes) {
          ingestMeasurementSample(probeRes)
        }
      } catch {
        // Backend probe failed; do not invent mock or fallback telemetry
      }
    }, 1000)

    return () => clearInterval(probeInterval)
  }, [state.target?.state, state.target?.cleanDomain, ingestMeasurementSample])

  // ── Target Lifecycle Management ─────────────────────────────────────────────
  const analyzeTarget = useCallback(async (input) => {
    const clean = cleanDomainInput(input)
    const targetKey = clean || input || ''

    if (!targetKey || inFlightTargetRef.current === targetKey) {
      return
    }
    inFlightTargetRef.current = targetKey

    // Data Hygiene: clear previous active target & internal signal tracker
    clearActiveTarget()
    activeSignalTrackerRef.current.clear()

    if (!clean || !isValidDomain(clean)) {
      inFlightTargetRef.current = null
      setState({
        ...initialBaseState,
        target: {
          ...initialTargetState,
          domain: input || '',
          cleanDomain: clean,
          state: 'FAILED',
          status: 'DOMAIN_NOT_FOUND',
          error: '"TARGET NOT AVAILABLE" — The domain could not be verified on the Internet.',
          details: `Invalid target format "${input || ''}". Please enter a valid fully qualified domain name or website URL (e.g. https://example.com or google.com).`,
          analysisSteps: [
            { id: 'validate', label: 'Domain syntax & hostname format validation', status: 'failed' },
            { id: 'resolve', label: 'DNS resolution check', status: 'pending' },
            { id: 'reachability', label: 'HTTP/HTTPS reachability check', status: 'pending' },
            { id: 'health', label: 'Real telemetry & baseline calibration', status: 'pending' },
          ],
        },
        measurementHistory: [],
        incidents: [],
        signals: [],
        selectedIncident: null,
        connection: { mode: 'idle', isConnected: false, lastUpdated: Date.now() },
      })
      return
    }

    // Step 1: Set ANALYZING state & completely clear previous target metrics
    setState((prev) => ({
      ...initialBaseState,
      target: {
        ...initialTargetState,
        domain: input,
        cleanDomain: clean,
        state: 'ANALYZING',
        error: null,
        analysisSteps: [
          { id: 'validate', label: `Validating hostname format: ${clean}`, status: 'in_progress' },
          { id: 'resolve', label: 'DNS resolution check (A/AAAA records)', status: 'pending' },
          { id: 'reachability', label: 'HTTP/HTTPS reachability check', status: 'pending' },
          { id: 'health', label: 'Real telemetry & baseline calibration', status: 'pending' },
        ],
      },
      measurementHistory: [],
      incidents: [],
      signals: [],
      selectedIncident: null,
      connection: {
        ...prev.connection,
        mode: 'active_probe',
      },
    }))

    try {
      // Step 2: Perform Backend Target Validation (Backend is Source of Truth)
      const valResult = await validateDomainTarget(input)

      if (!valResult || valResult.valid === false) {
        const valErr = new Error(valResult?.message || valResult?.error || 'Website unavailable — DNS_X cannot analyze this target.')
        if (valResult?.details) valErr.details = valResult.details
        throw valErr
      }

      // Step 3: Backend Validation Succeeded! Proceed to probe & active monitoring
      setState((prev) => ({
        ...prev,
        target: {
          ...prev.target,
          ips: valResult.ips || [],
          analysisSteps: [
            { id: 'validate', label: `Domain format verified: ${clean}`, status: 'complete' },
            { id: 'resolve', label: `DNS resolution verified (${(valResult.ips || []).slice(0, 2).join(', ') || 'A/AAAA resolved'})`, status: 'complete' },
            { id: 'reachability', label: `Reachability verified via ${valResult.protocol?.toUpperCase() || 'HTTPS'} (Status ${valResult.httpStatus || 200})`, status: 'complete' },
            { id: 'health', label: 'Calibrating target telemetry baseline...', status: 'in_progress' },
          ],
        },
      }))

      await new Promise((r) => setTimeout(r, 150))

      const probeData = await probeDomain(input)
      setActiveTarget(input)

      if (!probeData) {
        throw new Error('Website unavailable — DNS_X cannot analyze this target.')
      }

      const norm = normalizeProbeResponse(probeData, clean)

      const initialSample = {
        timestamp: norm.timestamp,
        timeStr: formatTime(norm.timestamp),
        latency: norm.latency,
        errorRate: norm.errorRate,
        rcode: norm.dominantRcode,
        vantagePoints: norm.vantagePoints,
      }

      // Step 4: Complete -> Transition to ACTIVE with verified real telemetry
      setState((prev) => ({
        ...prev,
        target: {
          ...prev.target,
          domain: input,
          cleanDomain: clean,
          state: 'ACTIVE',
          resolvedAt: norm.timestamp,
          ips: norm.ips.length > 0 ? norm.ips : (valResult.ips || []),
          nameservers: norm.nameservers,
          records: norm.records,
          authoritative: norm.authoritative,
          vantagePoints: norm.vantagePoints,
          latency: norm.latency,
          analysisSteps: [
            { id: 'validate', label: `Domain format verified: ${clean}`, status: 'complete' },
            { id: 'resolve', label: `DNS resolution verified (${norm.ips.slice(0, 2).join(', ') || 'A/AAAA resolved'})`, status: 'complete' },
            { id: 'reachability', label: `Reachability verified via ${valResult.protocol?.toUpperCase() || 'HTTPS'} (Status ${valResult.httpStatus || 200})`, status: 'complete' },
            { id: 'health', label: 'Real telemetry baseline session active', status: 'complete' },
          ],
        },
        system: {
          status: norm.systemStatus,
          health: norm.healthScore,
          monitoringStatus: 'MONITORING',
        },
        traffic: {
          qps: null,
          probeRate: norm.vantagePoints.length || 4,
          isPublicDomain: true,
          displayNote: 'GLOBAL QPS UNAVAILABLE (PUBLIC DOMAIN TARGET)',
        },
        performance: {
          latency: norm.medianLatency ?? norm.latency,
          median: norm.medianLatency ?? norm.latency,
          mean: norm.meanLatency ?? norm.latency,
          p95: norm.p95,
          cacheHit: null,
          cacheHitNote: 'CACHE HIT RATIO UNAVAILABLE (PUBLIC DOMAIN)',
        },
        errors: {
          rate: norm.resolutionFailureRate,
          resolutionFailureRate: norm.resolutionFailureRate,
          nxDomainRate: norm.nxDomainRate,
          servfailRate: norm.servfailRate,
          timeoutRate: norm.timeoutRate,
          dominant: norm.dominantRcode,
          trend: norm.resolutionFailureRate === 0 ? 'stable' : 'increasing',
          nxdomain: norm.rcodeCounts.NXDOMAIN || 0,
          servfail: norm.rcodeCounts.SERVFAIL || 0,
          timeout: norm.rcodeCounts.TIMEOUT || 0,
        },
        infrastructure: norm.infrastructure,
        ai: norm.ai,
        measurementHistory: [initialSample],
        incidents: [],
        signals: [],
        selectedIncident: null,
        connection: {
          isConnected: true,
          mode: 'active_probe',
          lastUpdated: norm.timestamp,
        },
      }))
    } catch (err) {
      console.warn('[analyzeTarget] Validation or probe failed:', err.message)
      clearActiveTarget()
      activeSignalTrackerRef.current.clear()

      const errorMsg = err.message || '"TARGET NOT AVAILABLE" — The domain could not be verified on the Internet.'
      const errorDetails = err.details || null
      const statusLabel = err.status || err.reason || 'DOMAIN_NOT_FOUND'

      // Enforce strict Failure State: Zero metrics, AI analysis, signals, incidents, or mock/fallback data
      setState({
        ...initialBaseState,
        target: {
          ...initialTargetState,
          domain: input || '',
          cleanDomain: clean,
          state: 'FAILED',
          status: statusLabel,
          error: errorMsg,
          details: errorDetails,
          analysisSteps: [
            { id: 'validate', label: `Validating hostname format: ${clean}`, status: 'complete' },
            { id: 'resolve', label: 'Backend target validation failed', status: 'failed' },
            { id: 'reachability', label: 'HTTP/HTTPS reachability check halted', status: 'pending' },
            { id: 'health', label: 'Telemetry initialization aborted', status: 'pending' },
          ],
        },
        incidents: [],
        signals: [],
        measurementHistory: [],
        selectedIncident: null,
        connection: {
          mode: 'idle',
          isConnected: false,
          lastUpdated: Date.now(),
        },
      })
    } finally {
      inFlightTargetRef.current = null
    }
  }, [])

  const changeTarget = useCallback(() => {
    clearActiveTarget().catch(() => {})
    activeSignalTrackerRef.current.clear()
    setState((prev) => ({
      ...initialBaseState,
      target: {
        ...initialTargetState,
      },
      incidents: [],
      signals: [],
      measurementHistory: [],
      selectedIncident: null,
      connection: {
        ...prev.connection,
        mode: 'idle',
      },
    }))
  }, [])

  const retryTarget = useCallback(() => {
    const domainToRetry = state.target?.cleanDomain || state.target?.domain
    if (domainToRetry) {
      analyzeTarget(domainToRetry)
    }
  }, [state.target, analyzeTarget])

  // ── Incident Actions ────────────────────────────────────────────────────────
  const acknowledgeIncident = useCallback(async (id) => {
    setState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: 'acknowledged' } : inc
      ),
      selectedIncident:
        prev.selectedIncident?.id === id
          ? { ...prev.selectedIncident, status: 'acknowledged' }
          : prev.selectedIncident,
    }))

    try {
      await apiAcknowledge(id)
    } catch (err) {
      console.warn('[acknowledgeIncident] API call failed:', err.message)
    }
  }, [])

  const resolveIncident = useCallback(async (id) => {
    setState((prev) => ({
      ...prev,
      incidents: prev.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: 'resolved' } : inc
      ),
      selectedIncident:
        prev.selectedIncident?.id === id
          ? { ...prev.selectedIncident, status: 'resolved' }
          : prev.selectedIncident,
    }))

    try {
      await apiResolve(id)
    } catch (err) {
      console.warn('[resolveIncident] API call failed:', err.message)
    }
  }, [])

  const setSelectedIncident = useCallback((incident) => {
    setState((prev) => ({ ...prev, selectedIncident: incident }))
  }, [])

  const contextValue = {
    ...state,
    target: state.target || initialTargetState,
    analyzeTarget,
    changeTarget,
    retryTarget,
    acknowledgeIncident,
    resolveIncident,
    setSelectedIncident,
    refreshData,
  }

  return (
    <DNSStateContext.Provider value={contextValue}>
      {children}
    </DNSStateContext.Provider>
  )
}

export function useDNSState() {
  const context = useContext(DNSStateContext)
  if (!context) {
    throw new Error('useDNSState must be used inside DNSStateProvider')
  }
  return context
}

export default useDNSState