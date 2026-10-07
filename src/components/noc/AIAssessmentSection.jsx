import { useState } from 'react'
import { BrainCircuit, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'
import AIEvidenceDrawer from './AIEvidenceDrawer'

function AIAssessmentSection() {
  const dns = useDNSState()
  const { ai = {}, target = {} } = dns
  const canonical = getCanonicalHealth(dns)

  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false)

  const isCalibrating = ai.baseline === 'CALIBRATING' || ai.confidence === null || (ai.samplesCollected || 0) < (ai.samplesRequired || 5)

  const dominantRcode = dns.errors?.dominant || 'NOERROR'
  const errorRate = dns.errors?.rate !== null && dns.errors?.rate !== undefined ? Number(dns.errors.rate) : 0
  const latency = dns.performance?.latency !== null && dns.performance?.latency !== undefined ? Number(dns.performance.latency) : null
  const vpCount = target.vantagePoints?.length || 4
  const authCount = target.authoritative?.length || 0

  // Real evidence-based assessment answering: What is happening, what evidence, anomaly status, next action
  const isObservedHealthy =
    (canonical.status === 'HEALTHY' || (errorRate === 0 && dominantRcode === 'NOERROR')) &&
    dominantRcode !== 'SERVFAIL'

  let assessmentSummary
  let nextAction
  if (isCalibrating) {
    assessmentSummary = `Target ${target.cleanDomain || 'domain'} is under active multi-vantage monitoring. Evidence: DNS resolution returned ${dominantRcode}, error rate is ${errorRate}%, and average round-trip latency is ${latency !== null ? `${latency.toFixed(1)}ms` : 'nominal'}. All ${vpCount} recursive observers and ${authCount} authoritative nameservers are responsive. Zero anomalies detected.`
    nextAction = `Continue monitoring until statistical baseline reaches the required 5 observation samples.`
  } else if (canonical.status === 'NOT_FOUND') {
    assessmentSummary = `Target ${target.cleanDomain || 'domain'} does not exist (NXDOMAIN). Evidence: Recursive resolvers received RCODE 3 from the authoritative root/TLD. Authoritative infrastructure is functioning nominally with non-existent domain semantics (RFC 1035). This is not an infrastructure failure.`
    nextAction = `Verify domain spelling or register the name if intended.`
  } else if (canonical.status === 'CRITICAL' && !isObservedHealthy) {
    const criticalEvidence = dominantRcode === 'SERVFAIL'
      ? 'Upstream nameservers returned SERVFAIL (server failure)'
      : `Elevated resolution failure rate at ${errorRate}% with ${dominantRcode} responses`
    assessmentSummary = `Critical infrastructure failure confirmed for ${target.cleanDomain || 'target'}. Evidence: ${criticalEvidence}. Resolution breakdown active.`
    nextAction = `Initiate immediate incident triage: check authoritative DNS registrar delegation, zone configuration, and nameserver reachability.`
  } else if (canonical.status === 'DEGRADED' && !isObservedHealthy) {
    assessmentSummary = `Performance degradation observed for ${target.cleanDomain || 'target'}. Evidence: Error rate at ${errorRate}% or round-trip latency (${latency !== null ? `${latency.toFixed(1)}ms` : 'N/A'}) exceeded baseline bounds.`
    nextAction = `Inspect recursive vantage point transit paths and monitor authoritative nameservers for packet loss.`
  } else {
    assessmentSummary = `Observed healthy. DNS resolvers returned NOERROR with 0% resolution failure for ${target.cleanDomain || 'target'}. Round-trip latency (${latency !== null ? `${latency.toFixed(1)}ms` : 'nominal'}) is nominal across all ${vpCount} vantage points and authoritative nameservers. Zero anomalies detected.`
    nextAction = `No operator action required. Operational telemetry is within established baseline bounds.`
  }

  return (
    <>
      <section className="glass-panel flex h-full flex-col justify-between p-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#7891a0]">
              INTELLIGENCE / EVAL
            </span>
            <span className="h-3 w-px bg-white/[0.15]" />
            <h2 className="text-[12px] font-semibold tracking-[0.16em] text-white">
              DNS_X EVIDENCE & BASELINE ASSESSMENT
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <div className={`glass-pill-subtle px-2.5 py-0.5 text-[8px] uppercase tracking-wider font-medium ${
              isCalibrating
                ? 'border-sky-400/40 text-sky-300'
                : `${canonical.borderColor} ${canonical.bgColor} ${canonical.textColor}`
            }`}>
              {isCalibrating
                ? `AI BASELINE: CALIBRATING (${ai.samplesCollected || 1}/5)`
                : canonical.status === 'NOT_FOUND'
                  ? 'NAME NOT FOUND (NXDOMAIN)'
                  : canonical.status === 'HEALTHY'
                    ? 'OBSERVED HEALTHY'
                    : canonical.status === 'DEGRADED'
                      ? 'DEGRADED PERFORMANCE'
                      : canonical.status === 'CRITICAL'
                        ? 'CRITICAL INCIDENT'
                        : canonical.status}
            </div>

            <span className="text-[9px] text-[#8fa6b0]">
              BASELINE: <strong className="text-cyan-300">{isCalibrating ? 'CALIBRATING' : 'ESTABLISHED'}</strong>
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex flex-1 flex-col justify-around py-3 space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 text-violet-300 shadow-[0_0_16px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <BrainCircuit size={17} strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-mono text-[9px] uppercase tracking-wider text-[#8fa6b0]">
                STATUS ASSESSMENT
              </div>
              <p className="mt-1 text-[12px] leading-5 text-[#c8dce4]">
                {assessmentSummary}
              </p>
              <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5 font-mono text-[10px] text-cyan-300 glass-card px-3 py-1.5 rounded-xl border-white/[0.08]">
                <span className="text-[#6d8896] uppercase tracking-wider font-semibold">ACTION:</span>
                <span>{nextAction}</span>
              </div>
            </div>
          </div>

          {/* Core Metrics Strip */}
          <div className="grid grid-cols-2 gap-2.5 font-mono text-[9px]">
            <div className="glass-card p-3 rounded-xl">
              <div className="text-[#7d95a2]">OPERATIONAL EVIDENCE STATE</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-[16px] font-semibold tracking-wide ${canonical.textColor}`}>
                  {canonical.targetLabel}
                </span>
                <span className="text-[9px] text-[#7d95a2]">
                  {dominantRcode}
                </span>
              </div>
            </div>

            <div className="glass-card p-3 rounded-xl">
              <div className="text-[#7d95a2]">STATISTICAL BASELINE</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[16px] font-semibold text-cyan-300">
                  {isCalibrating ? `${ai.samplesCollected || 1} / ${ai.samplesRequired || 5}` : `${ai.samplesCollected || 5} SAMPLES`}
                </span>
                <span className="text-[9px] text-[#7d95a2]">
                  {isCalibrating ? 'CALIBRATING BASELINE' : (ai.zScore && ai.zScore >= 2.0 ? 'DEVIATION DETECTED' : 'BASELINE NOMINAL')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with [ VIEW EVIDENCE ] */}
        <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#8fa6b0]">
            {isCalibrating ? (
              <span className="text-sky-300 font-medium">BASELINE CALIBRATING (SAMPLE {ai.samplesCollected || 1}/5)</span>
            ) : canonical.status === 'NOT_FOUND' ? (
              <>
                <ShieldCheck size={12} className="text-sky-400" />
                <span className="text-sky-300">EXPECTED RESOLUTION · DOMAIN DOES NOT EXIST</span>
              </>
            ) : canonical.status === 'HEALTHY' ? (
              <>
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="text-[#8fa6b0]">BASELINE NOMINAL · WITHIN STATISTICAL BOUNDS</span>
              </>
            ) : (
              <>
                <AlertTriangle size={12} className="text-amber-400" />
                <span className="text-amber-300 font-medium">BASELINE ACTIVE · DEVIATION DETECTED</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsEvidenceOpen(true)}
            className="glass-pill-subtle flex items-center gap-1.5 px-3 py-1 font-mono text-[9px] font-medium tracking-wider text-cyan-300 transition-all hover:text-white"
          >
            <span>VIEW EVIDENCE</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </section>

      {/* Investigation Evidence Drawer */}
      <AIEvidenceDrawer
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </>
  )
}

export default AIAssessmentSection
