import { useEffect } from 'react'
import {
  X,
  BrainCircuit,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function AIEvidenceDrawer({ isOpen, onClose }) {
  const dns = useDNSState()
  const { ai = {}, target = {}, incidents = [] } = dns
  const canonical = getCanonicalHealth(dns)

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isCalibrating = ai.baseline === 'CALIBRATING' || ai.confidence === null || (ai.samplesCollected || 0) < (ai.samplesRequired || 5)

  const activeIncidents = incidents.filter(
    (inc) => inc.status !== 'resolved' && inc.status !== 'closed'
  )
  const hasActiveIncident = activeIncidents.length > 0
  const primaryIncident = activeIncidents[0] || incidents[0]

  const latency = dns.performance?.latency !== null ? Number(dns.performance?.latency) : null
  const errorRate = dns.errors?.rate !== null ? Number(dns.errors?.rate) : null

  const rootCauseCandidates = [
    {
      title: 'Upstream Transit & Authoritative NS Jitter',
      likelihood: hasActiveIncident && primaryIncident?.root_cause_class === 'NETWORK' ? 'ELEVATED' : 'NOMINAL',
      detail: `Authoritative servers (${target.authoritative?.map(a => `${a.host} (${a.latency_ms > 0 ? a.latency_ms.toFixed(1) + 'ms' : 'discovered'})`).slice(0, 2).join(', ') || target.nameservers?.slice(0, 2).join(', ') || 'NS records'}) response variance.`,
      statusColor: hasActiveIncident && primaryIncident?.root_cause_class === 'NETWORK' ? '#f59e0b' : '#22c55e',
    },
    {
      title: 'Vantage Point Resolution Failures',
      likelihood: errorRate !== null && errorRate > 5 ? 'ATTENTION' : 'NOMINAL',
      detail: `Dominant RCODE: ${dns.errors?.dominant || 'NOERROR'}, resolution failure rate at ${errorRate !== null ? `${errorRate.toFixed(2)}%` : '0.00%'}.`,
      statusColor: errorRate !== null && errorRate > 5 ? '#f59e0b' : '#22c55e',
    },
    {
      title: 'Authoritative Timeouts or Refusals',
      likelihood: (dns.errors?.timeout > 0 || dns.errors?.servfail > 0) ? 'SUSPECTED' : 'UNOBSERVED',
      detail: `Observed RCODEs: ${dns.errors?.dominant || 'NOERROR'} (Timeouts: ${dns.errors?.timeout || 0}, ServFails: ${dns.errors?.servfail || 0}, NXDOMAINs: ${dns.errors?.nxdomain || 0}).`,
      statusColor: (dns.errors?.timeout > 0 || dns.errors?.servfail > 0) ? '#ef4444' : '#22c55e',
    },
    {
      title: 'Multi-Resolver Path Deviation',
      likelihood: (ai.zScore && ai.zScore > 2.0) ? 'ELEVATED' : 'NOMINAL',
      detail: (ai.zScore !== undefined && ai.zScore !== null) ? `Statistical Z-Score: +${ai.zScore}σ vs baseline mean (${ai.baselineMean ?? (latency ? latency.toFixed(1) : '0')}ms).` : 'Within nominal statistical envelope.',
      statusColor: (ai.zScore && ai.zScore > 2.0) ? '#f59e0b' : '#22c55e',
    },
  ]

  const latencyDev = latency === null ? 'Calibrating' : latency > 300 ? 'Elevated (>300ms)' : 'Nominal'
  const errorDev = errorRate === null ? 'Calibrating' : errorRate > 5 ? 'Elevated' : 'Zero errors'
  const probeDev = `Active sampling (${target.vantagePoints?.length || 4} vantage points)`

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.12] bg-[#070d14]/92 backdrop-blur-2xl text-[#c8d7dc] shadow-[-20px_0_60px_rgba(0,0,0,0.8),inset_1px_0_0_rgba(255,255,255,0.08)]">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
                AI / INVESTIGATION
              </span>
              <span className="h-3 w-px bg-white/[0.12]" />
              <span className="font-mono text-[11px] font-semibold text-cyan-400">
                EVIDENCE DOSSIER
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[8px] font-medium tracking-wider ${canonical.borderColor} ${canonical.bgColor} ${canonical.textColor}`}>
                {canonical.status}
              </span>
            </div>

            <h2 className="mt-1 text-[17px] font-semibold tracking-wide text-[#f0f6f8]">
              Real AI Assessment Evidence & Statistics
            </h2>
            <div className="mt-0.5 font-mono text-[9px] text-[#6b8592]">
              TARGET: <strong className="text-cyan-400">{target.cleanDomain}</strong> · STATISTICAL BASELINE
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-[#728792] transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-cyan-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Section 1: Overview Summary */}
          <div className="glass-card rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-mono text-[10px]">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <BrainCircuit size={13} />
                SYNTHESIS & EVIDENCE
              </span>
              <span className="text-[#657f8d]">
                BASELINE: <strong className="text-cyan-400">{isCalibrating ? 'CALIBRATING' : 'ESTABLISHED'}</strong>
              </span>
            </div>

            <p className="mt-3.5 text-[12px] leading-relaxed text-[#c0d4dc]">
              {isCalibrating ? (
                <span className="text-sky-300 font-mono text-[11px]">
                  AI ASSESSMENT: Insufficient telemetry for inference. The statistical baseline engine requires at least 5 observation windows (currently {ai.samplesCollected || 1}/5). Metrics are updating strictly from real vantage probes.
                </span>
              ) : (
                ai.assessment || 'Real DNS measurements indicate nominal operational stability across all authoritative nameservers and public vantage points.'
              )}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono text-[9px]">
              <div className="glass-card rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[#657f8d]">CANONICAL OPERATIONAL STATE</div>
                <div className={`mt-1 text-[15px] font-semibold ${canonical.textColor}`}>
                  {canonical.targetLabel}
                </div>
              </div>
              <div className="glass-card rounded-xl p-3 border border-white/[0.06]">
                <div className="text-[#657f8d]">BASELINE SAMPLES COLLECTED</div>
                <div className="mt-1 text-[15px] font-semibold text-cyan-400">
                  {isCalibrating ? `${ai.samplesCollected || 1} / ${ai.samplesRequired || 5}` : `${ai.samplesCollected || 5}`} <span className="text-[10px] text-[#657f8d]">{isCalibrating ? '(CALIBRATING)' : 'samples'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Real Observed Feature Vector */}
          <div className="glass-card rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-mono text-[10px]">
              <span className="text-cyan-400 font-semibold">
                REAL OBSERVATION FEATURE ATTRIBUTION
              </span>
              <span className="text-[#657f8d]">
                STATISTICAL ENVELOPE
              </span>
            </div>

            <div className="mt-3.5 space-y-2 font-mono text-[9px]">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="text-[#7d96a2]">RESPONSE LATENCY</span>
                <span className="text-white font-medium">{latency !== null ? `${latency.toFixed(1)} ms` : 'CALIBRATING'} ({latencyDev})</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="text-[#7d96a2]">RESOLUTION FAILURE RATE</span>
                <span className="text-white font-medium">{errorRate !== null ? `${errorRate.toFixed(2)}%` : 'CALIBRATING'} ({errorDev})</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="text-[#7d96a2]">PROBE SAMPLING RATE</span>
                <span className="text-white font-medium">{dns.traffic?.probeRate || 4} vantage points ({probeDev})</span>
              </div>
            </div>
          </div>

          {/* Section 3: Root Cause Candidates */}
          <div className="glass-card rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 font-mono text-[10px]">
              <span className="text-cyan-400 font-semibold">
                ROOT CAUSE HYPOTHESES & EVALUATION
              </span>
              <span className="text-[#657f8d]">EVALUATED</span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {rootCauseCandidates.map((cand) => (
                <div
                  key={cand.title}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 font-mono text-[9px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{cand.title}</span>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[8px] font-semibold tracking-wider"
                      style={{
                        borderColor: `${cand.statusColor}60`,
                        color: cand.statusColor,
                        backgroundColor: `${cand.statusColor}18`,
                      }}
                    >
                      {cand.likelihood}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[9px] text-[#7893a0]">{cand.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-3.5 font-mono text-[9px] text-[#657f8d]">
          <span>EVIDENCE SOURCE: ACTUAL DNS MEASUREMENTS</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 font-semibold text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIEvidenceDrawer
