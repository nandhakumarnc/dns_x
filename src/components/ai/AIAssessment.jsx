import {
  BrainCircuit,
  CircleCheck,
  Cpu,
  Sparkles,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function AIAssessment() {
  const dns = useDNSState()

  const canonical = getCanonicalHealth(dns)
  const ai = dns.ai || {}
  const assessment = ai.assessment || 'DNS infrastructure behaviour remains within expected baseline.'
  const severity = ai.severity || 'low'
  const isLive = dns.connection?.isConnected || dns.connection?.mode === 'live'

  const severityColor =
    severity === 'critical'
      ? 'text-red-400'
      : severity === 'warning'
        ? 'text-amber-400'
        : 'text-cyan-400'

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">
      {/* Neural background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(34,211,238,.25) 0 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, rgba(34,211,238,.18) 0 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative border-b border-[#17313b] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] tracking-[0.2em] text-[#36545f]">
              AI / 01
            </span>
            <span className="h-3 w-px bg-[#17313b]" />
            <h2 className="text-[15px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              CURRENT AI ASSESSMENT
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                isLive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,.8)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,.8)]'
              }`}
            />
            <span className={`font-mono text-[11px] ${isLive ? 'text-cyan-400' : 'text-amber-400'}`}>
              {isLive ? 'LIVE ML STREAM' : 'SIMULATION MODEL'}
            </span>
          </div>
        </div>

        <div className="mt-1 font-mono text-[12px] text-[#465b65]">
          REAL-TIME DNS BEHAVIOURAL ASSESSMENT · {severity.toUpperCase()} SEVERITY
        </div>
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Main assessment */}
        <div className="border-b border-[#17313b] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/20 bg-[#08131a] shadow-[0_0_20px_rgba(34,211,238,.05)]">
              <BrainCircuit
                size={18}
                strokeWidth={1}
                className="text-cyan-400"
              />
            </div>

            <div>
              <div className="font-mono text-[12px] tracking-[0.15em] text-[#40545e]">
                AI CONCLUSION
              </div>

              <div className="mt-2 font-mono text-[16px] text-[#c8d7dc]">
                Infrastructure state:
                <span className={severityColor}>
                  {' '}{severity === 'critical' ? 'CRITICAL DEVIATION' : severity === 'warning' ? 'ELEVATED ANOMALY' : 'WITHIN OPERATIONAL RANGE'}
                </span>
              </div>

              <p className="mt-3 max-w-xl text-[13px] leading-5 text-[#8fa4ad]">
                {assessment}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric
              label="BASELINE"
              value={ai.baseline === 'CALIBRATING' ? 'CALIBRATING' : 'ESTABLISHED'}
            />
            <Metric
              label="EVIDENCE STATE"
              value={canonical.targetLabel}
            />
            <Metric
              label="OPERATIONAL"
              value={canonical.status}
            />
            <Metric
              label="ANOMALY SCORE"
              value={ai.anomalyScore !== null && ai.anomalyScore !== undefined ? ai.anomalyScore.toFixed(2) : '0.00'}
            />
          </div>
        </div>

        {/* Model status */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Cpu
              size={11}
              strokeWidth={1.2}
              className="text-cyan-400"
            />
            <span className="font-mono text-[12px] tracking-[0.12em] text-[#657982]">
              PIPELINE SUBSYSTEMS
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <StatusRow
              label="Telemetry ingestion"
              value={isLive ? 'LIVE' : 'SIMULATED'}
            />
            <StatusRow
              label="Z-score baseline detection"
              value="ACTIVE"
            />
            <StatusRow
              label="Correlation engine"
              value="ONLINE"
            />
            <StatusRow
              label="Random Forest / SHAP explain"
              value="READY"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 border-l border-cyan-400/30 pl-3">
            <Sparkles
              size={9}
              className="text-cyan-400"
            />
            <span className="font-mono text-[11px] text-[#526873]">
              CONTINUOUS ML INFERENCE ENABLED
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="border border-[#17313b] bg-[#080f14] p-2">
      <div className="font-mono text-[11px] text-[#40545e]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[15px] text-[#9fb2b9]">
        {value}
      </div>
    </div>
  )
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[#10242c] pb-2">
      <span className="text-[12px] text-[#526873]">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <CircleCheck
          size={8}
          className="text-emerald-400"
        />
        <span className="font-mono text-[11px] text-emerald-400">
          {value}
        </span>
      </div>
    </div>
  )
}

export default AIAssessment
