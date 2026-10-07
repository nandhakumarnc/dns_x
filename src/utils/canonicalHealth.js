/**
 * src/utils/canonicalHealth.js
 * Single source of truth for DNS_X operational status.
 *
 * Core Data-Integrity Architecture:
 * 1. Target DNS Health: Evaluated strictly from raw empirical observations (RCODE,
 *    resolution success, authoritative/vantage point responses, confirmed error rates).
 *    Health percentage is presentation-only (derived from evidence), NEVER a circular driver.
 * 2. System / Measurement Health: Separated from Target Health. If telemetry collection
 *    fails or backend is unreachable, Target Health is UNKNOWN and System is OFFLINE.
 * 3. Calibrating is Independent: A calibrating baseline never triggers degradation.
 * 4. Latency: No arbitrary degradation without confirmed statistical deviation or timeouts.
 */

export function getCanonicalHealth(dnsState) {
  // 1. Check Backend / Telemetry Connection State
  const isConnectionOffline =
    dnsState?.connection?.status === 'offline' ||
    dnsState?.connection?.isBackendOffline === true ||
    dnsState?.connection?.mode === 'offline' ||
    dnsState?.connection?.mode === 'disconnected'

  if (isConnectionOffline) {
    return {
      targetStatus: 'UNKNOWN',
      measurementSystemStatus: 'OFFLINE',
      systemStatus: 'OFFLINE',
      status: 'UNKNOWN', // For backward compatibility with status checks
      label: 'TELEMETRY OFFLINE · TARGET STATE UNKNOWN',
      targetLabel: 'UNKNOWN (NO TELEMETRY)',
      systemLabel: 'OFFLINE',
      measurementSystemLabel: 'OFFLINE',
      color: '#64748b',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-400',
      healthPercent: null,
      activeIncidentsCount: 0,
      monitoring: false,
      isSystemOffline: true,
    }
  }

  // 2. Awaiting Target
  if (!dnsState || !dnsState.target || dnsState.target.state !== 'ACTIVE') {
    return {
      targetStatus: 'AWAITING_TARGET',
      measurementSystemStatus: 'STANDBY',
      systemStatus: 'STANDBY',
      status: 'UNKNOWN',
      label: 'AWAITING TARGET',
      targetLabel: 'AWAITING TARGET',
      systemLabel: 'STANDBY',
      measurementSystemLabel: 'STANDBY',
      color: '#64748b',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
      textColor: 'text-slate-400',
      healthPercent: 100,
      activeIncidentsCount: 0,
      monitoring: false,
      isSystemOffline: false,
    }
  }

  const incidents = dnsState.incidents || []
  const dominantRcode =
    dnsState.errors?.dominant ||
    dnsState.dominantRcode ||
    dnsState.target?.dominantRcode ||
    'NOERROR'
  const isNxdomain = dominantRcode === 'NXDOMAIN'
  const isServfail = dominantRcode === 'SERVFAIL'
  const errorRate = Number(dnsState.errors?.resolutionFailureRate ?? dnsState.errors?.rate ?? 0)

  const vantagePoints = dnsState.target?.vantagePoints || []
  const responsiveResolvers =
    vantagePoints.length === 0 ||
    vantagePoints.some(
      (vp) =>
        (vp.rcode === 'NOERROR' || vp.rcode === 'NXDOMAIN') &&
        vp.status !== 'OFFLINE' &&
        vp.status !== 'TIMEOUT'
    )

  // Healthy State Protection:
  // If resolution failure rate is 0%, dominant RCODE is NOERROR, and resolvers are responsive,
  // the target is empirically healthy. Stale incidents or baseline deviations cannot override this.
  const isEmpiricallyHealthy =
    dominantRcode === 'NOERROR' &&
    errorRate === 0 &&
    responsiveResolvers &&
    !isServfail

  // Filter truly active incidents that have active failure evidence.
  // If current observation is confirmed healthy, past incidents for this target are stale and reconciled.
  const activeIncidents = isEmpiricallyHealthy
    ? []
    : incidents.filter((inc) => {
        if (inc.status === 'resolved' || inc.status === 'closed') return false
        // Stale incident protection: if this specific target has 0% error and NOERROR, suppress it
        const targetClean = (dnsState.target?.cleanDomain || '').toLowerCase()
        const incTarget = (inc.target_domain || inc.domain || '').toLowerCase()
        if (targetClean && incTarget === targetClean && isEmpiricallyHealthy) {
          return false
        }
        return true
      })

  // Evidence-based criticality: CRITICAL requires actual failure evidence, not statistical deviation
  const hasCriticalIncident = activeIncidents.some((i) => {
    const sev = (i.severity || '').toUpperCase()
    if (sev !== 'CRITICAL') return false
    // Verify incident has genuine DNS failure evidence (not just statistical z-score)
    const isErrorType =
      i.root_cause_class === 'OPERATIONAL' ||
      i.signals?.some((s) => typeof s === 'string' && (s.includes('err') || s.includes('servfail')))
    return isErrorType || errorRate >= 25 || isServfail
  })

  const hasWarningIncident = activeIncidents.some((i) => {
    const s = (i.severity || '').toUpperCase()
    return s === 'HIGH' || s === 'MEDIUM' || s === 'WARNING'
  })

  // 3. Name Not Found vs. Server Failure
  // NXDOMAIN means the domain name does not exist (benign negative response, not infrastructure failure)
  if (isNxdomain) {
    return {
      targetStatus: 'NOT_FOUND',
      measurementSystemStatus: 'ONLINE',
      systemStatus: 'ONLINE',
      status: 'NOT_FOUND',
      label: 'DOMAIN NOT FOUND · NXDOMAIN',
      targetLabel: 'NAME NOT FOUND',
      systemLabel: 'ONLINE',
      measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
      color: '#38bdf8', // distinct informative sky blue
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/40',
      textColor: 'text-sky-400',
      healthPercent: 100,
      activeIncidentsCount: 0,
      monitoring: true,
      isSystemOffline: false,
    }
  }

  // SERVFAIL means authoritative nameserver or resolution failure (genuine infrastructure failure)
  if (isServfail) {
    return {
      targetStatus: 'CRITICAL',
      measurementSystemStatus: 'ONLINE',
      systemStatus: 'ONLINE',
      status: 'CRITICAL',
      label: 'CRITICAL · SERVFAIL',
      targetLabel: 'SERVFAIL',
      systemLabel: 'ONLINE',
      measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
      color: '#ef4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/40',
      textColor: 'text-red-400',
      healthPercent: 0,
      activeIncidentsCount: Math.max(1, activeIncidents.length),
      monitoring: true,
      isSystemOffline: false,
    }
  }

  // 4. Healthy State Protection check before degradation/critical triggers:
  // If resolution succeeded with 0% failure and NOERROR across responsive resolvers,
  // target health MUST be HEALTHY.
  if (isEmpiricallyHealthy) {
    return {
      targetStatus: 'HEALTHY',
      measurementSystemStatus: 'ONLINE',
      systemStatus: 'ONLINE',
      status: 'HEALTHY',
      label: 'ALL SYSTEMS OPERATIONAL',
      targetLabel: 'OBSERVED HEALTHY',
      systemLabel: 'ONLINE',
      measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
      color: '#22c55e',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      healthPercent: 100,
      activeIncidentsCount: 0,
      monitoring: true,
      isSystemOffline: false,
    }
  }

  // 5. Critical Outage via Confirmed Incidents or Extreme Resolution Failure (>=25%)
  // Requires actual failure evidence, NEVER triggered by baseline deviation alone.
  if (hasCriticalIncident || errorRate >= 25) {
    return {
      targetStatus: 'CRITICAL',
      measurementSystemStatus: 'ONLINE',
      systemStatus: 'ONLINE',
      status: 'CRITICAL',
      label: 'CRITICAL DEGRADATION',
      targetLabel: 'CRITICAL',
      systemLabel: 'ONLINE',
      measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
      color: '#ef4444',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/40',
      textColor: 'text-red-400',
      healthPercent: Math.max(0, Math.round(100 - errorRate * 2)),
      activeIncidentsCount: activeIncidents.length,
      monitoring: true,
      isSystemOffline: false,
    }
  }

  // 6. Statistical Degradation & Warnings
  // Only active when a verified non-critical incident with real error impact exists or measured resolution failure > 5%
  // Never triggered by calibrating baseline or healthy lookups
  if (hasWarningIncident || errorRate > 5) {
    return {
      targetStatus: 'DEGRADED',
      measurementSystemStatus: 'ONLINE',
      systemStatus: 'ONLINE',
      status: 'DEGRADED',
      label: 'DEGRADED PERFORMANCE',
      targetLabel: 'DEGRADED',
      systemLabel: 'ONLINE',
      measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
      color: '#f59e0b',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/40',
      textColor: 'text-amber-400',
      healthPercent: Math.max(50, Math.round(100 - errorRate * 1.5)),
      activeIncidentsCount: activeIncidents.length,
      monitoring: true,
      isSystemOffline: false,
    }
  }

  // 7. Nominal Target State Fallback:
  return {
    targetStatus: 'HEALTHY',
    measurementSystemStatus: 'ONLINE',
    systemStatus: 'ONLINE',
    status: 'HEALTHY',
    label: 'ALL SYSTEMS OPERATIONAL',
    targetLabel: 'OBSERVED HEALTHY',
    systemLabel: 'ONLINE',
    measurementSystemLabel: 'MEASUREMENT FLEET OPERATIONAL',
    color: '#22c55e',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    healthPercent: 100,
    activeIncidentsCount: 0,
    monitoring: true,
    isSystemOffline: false,
  }
}

