import {
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  Network,
  ShieldAlert,
  Server,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function RootCauseCard() {
  const { selectedIncident, ai = {}, errors = {}, performance = {}, traffic = {} } = useDNSState()

  const rootClass = selectedIncident?.root_cause_class || (ai.severity === 'critical' ? 'OPERATIONAL' : 'OPERATIONAL')
  const confidence = selectedIncident?.confidence !== undefined && selectedIncident?.confidence !== null
    ? Math.round(selectedIncident.confidence)
    : ai.confidence !== undefined && ai.confidence !== null
      ? Math.round(ai.confidence)
      : null

  const causeTitle = selectedIncident?.cause || selectedIncident?.title || (
    rootClass === 'SECURITY'
      ? `Query surge indicator on ${target.cleanDomain || 'target'}`
      : rootClass === 'NETWORK'
        ? `Transit path latency escalation for ${target.cleanDomain || 'target'}`
        : `Nominal baseline telemetry active for ${target.cleanDomain || 'target'}`
  )

  const latencyDev = performance.latency > 0 ? (performance.latency > 300 ? 'Elevated (>300ms)' : 'Nominal') : 'Calibrating'
  const errorDev = errors.rate > 0 ? `Correlated error (${errors.rate.toFixed(1)}%)` : 'Zero resolution errors'
  const trafficDev = traffic.isPublicDomain ? 'DNS QPS = N/A (PUBLIC TARGET)' : (traffic.qps > (traffic.averageQps * 1.2) ? 'Surge detected' : 'Normal volume')
  const securityDev = rootClass === 'SECURITY' ? 'High probability' : 'No confirmed attack'

  const Icon = rootClass === 'SECURITY' ? ShieldAlert : rootClass === 'NETWORK' ? Network : Server

  return (
    <section className="glass-card rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] px-4 py-3">
        <BrainCircuit
          size={12}
          className="text-cyan-400"
          strokeWidth={1.2}
        />
        <span className="font-mono text-[10px] tracking-[0.15em] text-[#7893a0]">
          ROOT CAUSE ASSESSMENT
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.2)]">
            <Icon
              size={15}
              strokeWidth={1.3}
              className="text-cyan-400"
            />
          </div>

          <div>
            <div className="font-mono text-[12px] font-medium text-[#d5e4ea]">
              {causeTitle}
            </div>

            <div className="mt-1 font-mono text-[9px] text-cyan-400">
              CONFIDENCE · {confidence !== null ? `${confidence}%` : 'CALIBRATING'} · {rootClass}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Reason
            title="Latency deviation"
            value={latencyDev}
            highlight={latencyDev !== 'Nominal'}
          />
          <Reason
            title="Error correlation"
            value={errorDev}
            highlight={errorDev !== 'Within bounds'}
          />
          <Reason
            title="Traffic anomaly"
            value={trafficDev}
            highlight={trafficDev !== 'Normal volume'}
          />
          <Reason
            title="Attack indicators"
            value={securityDev}
            highlight={securityDev === 'High probability'}
          />
        </div>

        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3.5">
          <div className="flex items-center gap-2">
            <Lightbulb
              size={11}
              className="text-amber-400"
            />
            <span className="font-mono text-[9px] font-semibold text-amber-300">
              RECOMMENDED FIRST RESPONSE
            </span>
          </div>

          <p className="mt-2 text-[10px] leading-5 text-[#b0c4cc]">
            {rootClass === 'SECURITY'
              ? 'Apply query rate limiting on upstream boundary and capture network packet trace for forensic analysis.'
              : rootClass === 'NETWORK'
                ? 'Verify external BGP transit health and evaluate failing recursive forwarder links.'
                : 'Inspect resolver capacity, CPU utilization, cache hit ratio and upstream connectivity before escalating.'}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <CheckCircle2
            size={11}
            className={rootClass === 'SECURITY' ? 'text-amber-400' : 'text-emerald-400'}
          />
          <span className={`font-mono text-[9px] ${rootClass === 'SECURITY' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {rootClass === 'SECURITY' ? 'SECURITY TRIAGE ACTIVE' : 'NO CONFIRMED ATTACK INDICATORS'}
          </span>
        </div>
      </div>
    </section>
  )
}

function Reason({ title, value, highlight }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5 transition hover:bg-white/[0.04]">
      <span className="font-mono text-[9px] text-[#7893a0]">
        {title}
      </span>
      <span className={`font-mono text-[9px] ${highlight ? 'text-amber-400 font-semibold' : 'text-[#b8cbd4]'}`}>
        {value}
      </span>
    </div>
  )
}

export default RootCauseCard