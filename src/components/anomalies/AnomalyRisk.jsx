import {
  Activity,
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'

function AnomalyRisk() {
  const dns = useDNSState()

  const { health } = dns.system
  const { latency } = dns.performance
  const { rate, trend } = dns.errors

  const score = Math.min(
    100,
    Math.round(
      (100 - health) * 0.45 +
      Math.max(0, latency - 20) * 1.2 +
      rate * 5 +
      (trend === 'rising' ? 10 : 0)
    )
  )

  const level =
    score >= 70
      ? 'CRITICAL'
      : score >= 40
        ? 'ELEVATED'
        : 'NORMAL'

  const color =
    score >= 70
      ? '#ef4444'
      : score >= 40
        ? '#f59e0b'
        : '#22c55e'

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(31,82,96,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,82,96,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative flex items-center justify-between border-b border-[#17313b] px-4 py-3">

        <div>
          <div className="flex items-center gap-2">

            <span className="font-mono text-[10px] tracking-[0.2em] text-[#36545f]">
              ANM / 01
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[12px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              ANOMALY RISK
            </h2>

          </div>

          <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-[#465b65]">
            BEHAVIOURAL DEVIATION ANALYSIS
          </div>
        </div>

        <BrainCircuit
          size={15}
          strokeWidth={1}
          className="text-cyan-400"
        />

      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-[1fr_1.5fr]">

        {/* Score */}
        <div className="border-b border-[#17313b] p-5 md:border-b-0 md:border-r">

          <div className="flex items-center gap-2">

            <ShieldAlert
              size={11}
              style={{ color }}
              strokeWidth={1.2}
            />

            <span className="font-mono text-[9px] tracking-[0.14em] text-[#526873]">
              CURRENT ANOMALY SCORE
            </span>

          </div>

          <div className="mt-4 flex items-end gap-2">

            <span
              className="font-mono text-[34px] leading-none"
              style={{ color }}
            >
              {score}
            </span>

            <span className="mb-1 font-mono text-[10px] text-[#40545e]">
              / 100
            </span>

          </div>

          <div className="mt-4 h-1 bg-[#111c22]">

            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${score}%`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}`,
              }}
            />

          </div>

          <div className="mt-2 flex justify-between font-mono text-[9px] text-[#40545e]">
            <span>NORMAL</span>
            <span>ELEVATED</span>
            <span>CRITICAL</span>
          </div>

        </div>

        {/* Indicators */}
        <div className="grid grid-cols-2">

          <Indicator
            icon={Activity}
            label="LATENCY DEVIATION"
            value={`${Math.max(0, latency - 20).toFixed(1)} ms`}
          />

          <Indicator
            icon={TrendingUp}
            label="ERROR TREND"
            value={trend.toUpperCase()}
            warning={trend === 'rising'}
          />

          <Indicator
            icon={ShieldAlert}
            label="DETECTION STATE"
            value={level}
            warning={score >= 40}
          />

          <Indicator
            icon={BrainCircuit}
            label="MODEL STATE"
            value="ANALYZING"
          />

        </div>

      </div>

    </section>
  )
}

function Indicator({
  icon: Icon,
  label,
  value,
  warning = false,
}) {
  return (
    <div className="border-b border-r border-[#17313b] px-4 py-4">

      <Icon
        size={10}
        strokeWidth={1.2}
        className={
          warning
            ? 'text-amber-400'
            : 'text-cyan-400'
        }
      />

      <div className="mt-2 font-mono text-[9px] tracking-[0.12em] text-[#465b65]">
        {label}
      </div>

      <div
        className={`mt-1 font-mono text-[12px] ${
          warning
            ? 'text-amber-400'
            : 'text-[#9fb2b9]'
        }`}
      >
        {value}
      </div>

    </div>
  )
}

export default AnomalyRisk