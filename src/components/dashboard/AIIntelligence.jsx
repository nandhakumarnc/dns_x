import {
  BrainCircuit,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function AIIntelligence() {
  const dns = useDNSState()
  const canonical = getCanonicalHealth(dns)

  const {
    latency,
  } = dns.performance

  const {
    rate,
    dominant,
    trend,
  } = dns.errors

  const anomalyScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        rate * 8 +
        Math.max(0, latency - 20) * 1.5 +
        (trend === 'rising' ? 12 : 0)
      )
    )
  )

  const statusLabel = canonical.targetLabel || 'OBSERVED HEALTHY'
  const statusColor = canonical.color || '#22c55e'
  const recommendation = canonical.status === 'CRITICAL'
    ? 'Investigate authoritative nameservers and upstream resolution failures immediately.'
    : canonical.status === 'DEGRADED'
      ? 'Monitor resolver latency and error variance against baseline.'
      : 'DNS infrastructure is operating nominally within baseline bounds.'

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(31,82,96,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,82,96,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}

      <div className="relative flex items-center justify-between border-b border-[#17313b] px-4 py-3">

        <div>

          <div className="flex items-center gap-2">

            <span className="font-mono text-[7px] tracking-[0.2em] text-[#36545f]">
              AI / 01
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[9px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              AI INTELLIGENCE
            </h2>

          </div>

          <div className="mt-1 flex items-center gap-2">

            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.8)]" />

            <span className="font-mono text-[6px] tracking-[0.15em] text-cyan-400">
              ANALYSIS ACTIVE
            </span>

          </div>

        </div>

        <BrainCircuit
          size={16}
          strokeWidth={1}
          className="text-cyan-400"
        />

      </div>

      {/* Content */}

      <div className="relative p-4">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          {/* Operational State */}

          <div className="border border-[#17313b] bg-[#080f14] p-3">

            <div className="flex items-center gap-2">

              <ShieldAlert
                size={11}
                style={{ color: statusColor }}
              />

              <span className="font-mono text-[6px] tracking-[0.14em] text-[#526873]">
                OPERATIONAL STATE
              </span>

            </div>

            <div
              className="mt-3 font-mono text-[14px]"
              style={{ color: statusColor }}
            >
              {statusLabel}
            </div>

            <div
              className="mt-1 font-mono text-[6px]"
              style={{ color: statusColor }}
            >
              {canonical.status}
            </div>

          </div>

          {/* Anomaly */}

          <div className="border border-[#17313b] bg-[#080f14] p-3">

            <div className="flex items-center gap-2">

              <Sparkles
                size={11}
                className="text-cyan-400"
              />

              <span className="font-mono text-[6px] tracking-[0.14em] text-[#526873]">
                ANOMALY SCORE
              </span>

            </div>

            <div className="mt-3 font-mono text-[24px] text-[#c8d7dc]">
              {anomalyScore}
            </div>

            <div className="mt-1 font-mono text-[6px] text-[#526873]">
              / 100
            </div>

          </div>

          {/* Confidence */}

          <div className="border border-[#17313b] bg-[#080f14] p-3">

            <div className="flex items-center gap-2">

              <CheckCircle2
                size={11}
                className="text-emerald-400"
              />

              <span className="font-mono text-[6px] tracking-[0.14em] text-[#526873]">
                CONFIDENCE
              </span>

            </div>

            <div className="mt-3 font-mono text-[24px] text-[#c8d7dc]">
              {confidence}%
            </div>

            <div className="mt-1 font-mono text-[6px] text-[#526873]">
              MODEL CONFIDENCE
            </div>

          </div>

        </div>

        {/* Reasoning */}

        <div className="mt-3 border border-[#17313b] bg-[#080f14] p-3">

          <div className="font-mono text-[6px] tracking-[0.15em] text-[#526873]">
            AI REASONING
          </div>

          <p className="mt-2 text-[8px] leading-5 text-[#71858d]">

            Current DNS telemetry shows an error rate of{' '}

            <span className="text-[#c8d7dc]">
              {rate.toFixed(2)}%
            </span>

            {' '}with{' '}

            <span className="text-cyan-400">
              {dominant}
            </span>

            {' '}as the dominant error type.

            Resolver latency is currently{' '}

            <span className="text-[#c8d7dc]">
              {latency.toFixed(1)}ms
            </span>

            .

          </p>

          <div className="mt-3 border-t border-[#17313b] pt-3">

            <span className="font-mono text-[6px] text-[#526873]">
              RECOMMENDATION
            </span>

            <p className="mt-1 text-[8px] text-[#9fb2b9]">
              {recommendation}
            </p>

          </div>

        </div>

      </div>

    </section>
  )
}

export default AIIntelligence