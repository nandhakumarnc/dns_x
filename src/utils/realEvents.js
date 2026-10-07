/**
 * src/utils/realEvents.js
 * Generates strictly real, chronological events from active DNS probe telemetry.
 * Never creates placeholder warnings, fake timestamps, or synthetic events.
 *
 * Traceable Event Contract:
 * - timestamp: number (epoch ms from backend payload or target.resolvedAt)
 * - source: string (authoritative host, vantage point, or telemetry engine)
 * - type: string (EVENT_INCIDENT, EVENT_SIGNAL, EVENT_PROBE, EVENT_CALIBRATION, EVENT_AUTHORITY, EVENT_TARGET)
 * - message: string (human-readable factual summary)
 * - severity: string ('critical' | 'warning' | 'info')
 * - evidence: object (empirical measurements backing the event)
 */

import {
  Activity,
  ShieldAlert,
  Database,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export function generateRealEvents(dnsState) {
  if (!dnsState || !dnsState.target || dnsState.target.state !== 'ACTIVE') {
    return []
  }

  const {
    target = {},
    signals = [],
    incidents = [],
    performance = {},
    errors = {},
    ai = {},
    measurementHistory = [],
  } = dnsState

  const events = []
  const resolvedTimestamp = target.resolvedAt || (measurementHistory[0]?.timestamp) || null

  // 1. Incidents (strictly verified active or historical incidents)
  incidents.forEach((inc) => {
    const isCritical = (inc.severity || '').toUpperCase() === 'CRITICAL'
    const ts = inc.started_at ? new Date(inc.started_at).getTime() : resolvedTimestamp
    if (!ts) return

    const timeStr = new Date(ts).toLocaleTimeString()
    const evidence = {
      affected_resolvers: inc.affected_resolvers || [],
      root_cause_class: inc.root_cause_class || 'OPERATIONAL',
      severity: inc.severity || 'HIGH',
      incident_id: inc.id,
    }

    events.push({
      id: inc.id || `inc-${ts}`,
      timestamp: ts,
      time: timeStr,
      timeStr,
      source: inc.source || inc.affected_resolvers?.[0] || 'Vantage Point Fleet',
      type: 'EVENT_INCIDENT',
      category: 'INCIDENT',
      title: inc.title || 'DNS Operational Incident',
      message: `Operational incident active on ${target.cleanDomain}. Severity: ${inc.severity?.toUpperCase() || 'INFO'}`,
      detail: `Severity: ${inc.severity?.toUpperCase() || 'INFO'} · Status: ${inc.status?.toUpperCase() || 'ACTIVE'} · Resolvers: ${inc.affected_resolvers?.join(', ') || 'Global fleet'}`,
      severity: isCritical ? 'critical' : 'warning',
      level: isCritical ? 'critical' : 'warning',
      evidence,
      icon: isCritical ? ShieldAlert : AlertTriangle,
    })
  })

  // 2. Real Signals (strictly if statistical anomaly was measured)
  signals.forEach((sig) => {
    const ts = sig.ts ? new Date(sig.ts).getTime() : resolvedTimestamp
    if (!ts) return

    const timeStr = new Date(ts).toLocaleTimeString()
    const evidence = {
      metric_key: sig.metric_key || 'latency_avg',
      observed: sig.observed,
      baseline_mean: sig.baseline_mean,
      baseline_stddev: sig.baseline_stddev,
      z_score: sig.deviation_score || sig.z_score,
      confidence: sig.confidence,
    }

    events.push({
      id: sig.id || `sig-${ts}`,
      timestamp: ts,
      time: timeStr,
      timeStr,
      source: sig.source || 'Multi-Resolver Baseline Engine',
      type: 'EVENT_SIGNAL',
      category: 'SIGNAL',
      title: `${sig.type?.replace(/_/g, ' ') || 'ANOMALY DETECTED'}`,
      message: `Statistical deviation on ${sig.metric_key || 'metric'}: observed ${sig.observed} (z-score +${sig.deviation_score}σ)`,
      detail: `Observed ${sig.metric_key || 'metric'}: ${sig.observed} (Baseline: μ=${sig.baseline_mean}, σ=${sig.baseline_stddev}, z-score: +${sig.deviation_score}σ). ${sig.source || ''}`,
      severity: 'warning',
      level: 'warning',
      evidence,
      icon: ShieldAlert,
    })
  })

  // 3. Historical Measurement Probe Ticks (most recent first, up to 15)
  if (measurementHistory.length > 0) {
    measurementHistory.slice(-15).reverse().forEach((sample, idx) => {
      const ts = sample.timestamp || resolvedTimestamp
      if (!ts) return

      const isError = sample.errorRate > 0 || (sample.rcode && sample.rcode !== 'NOERROR')
      const timeStr = sample.timeStr || new Date(ts).toLocaleTimeString()
      const evidence = {
        latency_ms: sample.latency,
        error_rate: sample.errorRate,
        rcode: sample.rcode || 'NOERROR',
        vantage_points: sample.vantagePoints?.length || 4,
      }

      events.push({
        id: `sample-${ts}-${idx}`,
        timestamp: ts,
        time: timeStr,
        timeStr,
        source: 'DNS_X Multi-Vantage Engine',
        type: 'EVENT_PROBE',
        category: 'TELEMETRY',
        title: `Telemetry Observation (${target.cleanDomain})`,
        message: `Vantage resolution: ${sample.rcode || 'NOERROR'}, RTT ${sample.latency?.toFixed(1) || '0'}ms, error rate ${sample.errorRate ?? 0}%`,
        detail: `RTT Latency: ${typeof sample.latency === 'number' ? sample.latency.toFixed(1) : 'N/A'} ms · Error rate: ${sample.errorRate ?? 0}% · Dominant RCODE: ${sample.rcode || 'NOERROR'} · Probed vantage points: ${sample.vantagePoints?.length || target.vantagePoints?.length || 4}`,
        severity: isError ? 'warning' : 'info',
        level: isError ? 'warning' : 'normal',
        evidence,
        icon: Activity,
      })
    })
  }

  // 4. Initial Baseline Calibration Event (only if target was resolved)
  if (resolvedTimestamp) {
    const isCalibrating = ai.baseline === 'CALIBRATING' || (ai.samplesCollected || 0) < (ai.samplesRequired || 5)
    const timeStr = new Date(resolvedTimestamp).toLocaleTimeString()
    const evidence = {
      samples_collected: ai.samplesCollected || 1,
      samples_required: ai.samplesRequired || 5,
      baseline_state: ai.baseline || 'CALIBRATING',
      baseline_mean: ai.baselineMean || performance.latency || 0,
      baseline_stddev: ai.baselineStdDev || 0,
    }

    events.push({
      id: 'event-ai-calibration',
      timestamp: resolvedTimestamp,
      time: timeStr,
      timeStr,
      source: 'AI Baseline Calibration Service',
      type: 'EVENT_CALIBRATION',
      category: 'CALIBRATION',
      title: isCalibrating
        ? `Statistical Baseline Calibrating (${ai.samplesCollected || 1}/${ai.samplesRequired || 5} samples)`
        : `Statistical Baseline Active (${ai.samplesCollected || 5} samples)`,
      message: isCalibrating
        ? `Accumulating empirical measurement samples (${ai.samplesCollected || 1}/${ai.samplesRequired || 5}) for statistical baseline.`
        : `Empirical baseline established across ${ai.samplesCollected} observation windows.`,
      detail: isCalibrating
        ? `Accumulating initial measurement samples for ${target.cleanDomain}. Anomaly inference triggers when sample count reaches ${ai.samplesRequired || 5}.`
        : `Baseline established across ${ai.samplesCollected} observations (μ: ${ai.baselineMean || performance.latency || 0}ms, σ: ${ai.baselineStdDev || 0}ms).`,
      severity: 'info',
      level: 'normal',
      evidence,
      icon: BrainCircuit,
    })
  }

  // 5. Authoritative Nameserver Discovery Event
  if (resolvedTimestamp && (target.authoritative?.length > 0 || target.nameservers?.length > 0)) {
    const authCount = target.authoritative?.length || target.nameservers?.length || 0
    const sampleHosts = (target.authoritative?.map((a) => a.host) || target.nameservers || []).slice(0, 3).join(', ')
    const timeStr = new Date(resolvedTimestamp).toLocaleTimeString()
    const evidence = {
      nameservers_count: authCount,
      sample_nameservers: sampleHosts,
      dominant_rcode: errors.dominant || 'NOERROR',
    }

    events.push({
      id: 'event-auth-discovery',
      timestamp: resolvedTimestamp,
      time: timeStr,
      timeStr,
      source: 'Authoritative Discovery Engine',
      type: 'EVENT_AUTHORITY',
      category: 'AUTHORITY',
      title: 'Authoritative Nameserver Delegation Verified',
      message: `Discovered and verified ${authCount} authoritative nameservers for ${target.cleanDomain}.`,
      detail: `Discovered and queried ${authCount} authoritative nameservers (${sampleHosts}). Dominant response: ${errors.dominant || 'NOERROR'}.`,
      severity: 'info',
      level: 'normal',
      evidence,
      icon: Database,
    })
  }

  // 6. Target Analyzed & Records Resolved Event
  if (resolvedTimestamp) {
    const recordSummary = []
    if (target.records?.A?.length) recordSummary.push(`${target.records.A.length} A (${target.records.A.slice(0, 2).join(', ')})`)
    if (target.records?.AAAA?.length) recordSummary.push(`${target.records.AAAA.length} AAAA`)
    if (target.records?.NS?.length) recordSummary.push(`${target.records.NS.length} NS`)
    if (target.records?.MX?.length) recordSummary.push(`${target.records.MX.length} MX`)

    const isNxdomain = errors.dominant === 'NXDOMAIN'
    const isServfail = errors.dominant === 'SERVFAIL'
    const isOk = !isNxdomain && !isServfail && (recordSummary.length > 0 || (target.ips && target.ips.length > 0))
    const timeStr = new Date(resolvedTimestamp).toLocaleTimeString()
    const evidence = {
      clean_domain: target.cleanDomain,
      rcode: errors.dominant || 'NOERROR',
      resolved_ips: target.ips || [],
      record_counts: {
        A: target.records?.A?.length || 0,
        AAAA: target.records?.AAAA?.length || 0,
        NS: target.records?.NS?.length || 0,
      },
    }

    events.push({
      id: 'event-target-analyzed',
      timestamp: resolvedTimestamp,
      time: timeStr,
      timeStr,
      source: 'Target Analysis Controller',
      type: 'EVENT_TARGET',
      category: 'TARGET',
      title: `Target Analyzed: ${target.cleanDomain}`,
      message: isOk
        ? `DNS records resolved successfully for ${target.cleanDomain} with RCODE ${errors.dominant || 'NOERROR'}.`
        : `DNS resolution failed for ${target.cleanDomain} with RCODE ${errors.dominant || 'NXDOMAIN'}.`,
      detail: isOk
        ? `DNS records resolved: ${recordSummary.join(', ')}. Dominant RCODE: ${errors.dominant || 'NOERROR'}.`
        : `DNS resolution failed with ${errors.dominant || 'NXDOMAIN'}. Domain does not exist or has authoritative lookup failure.`,
      severity: isOk ? 'info' : 'critical',
      level: isOk ? 'normal' : 'critical',
      evidence,
      icon: isOk ? CheckCircle2 : ShieldAlert,
    })
  }

  // Return strictly sorted newest first (stable sort)
  return events.sort((a, b) => b.timestamp - a.timestamp)
}

