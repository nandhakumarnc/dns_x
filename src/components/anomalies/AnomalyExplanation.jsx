import {
  BrainCircuit,
  CircleAlert,
  Lightbulb,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'

function AnomalyExplanation() {
  const dns = useDNSState()

  const {
    qps,
  } = dns.traffic

  const {
    latency,
  } = dns.performance

  const {
    rate,
    dominant,
    trend,
  } = dns.errors

  const reasons = [
    {
      label: 'TRAFFIC',
      value: `${qps.toLocaleString()} QPS`,
      description:
        'Current query volume is being compared against the learned baseline.',
    },
    {
      label: 'LATENCY',
      value: `${latency.toFixed(1)} ms`,
      description:
        'Resolver response time is evaluated for abnormal deviation.',
    },
    {
      label: 'ERRORS',
      value: `${rate.toFixed(2)}%`,
      description:
        `Dominant response pattern: ${dominant}.`,
    },
  ]

  return (
    <section className="border border-[#17313b] bg-[#060b10]">

      <div className="flex items-center gap-2 border-b border-[#17313b] px-4 py-3">

        <BrainCircuit
          size={11}
          className="text-cyan-400"
          strokeWidth={1.2}
        />

        <span className="font-mono text-[12px] tracking-[0.15em] text-[#657982]">
          ANOMALY EXPLANATION
        </span>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr]">

        {/* Reasoning */}
        <div className="p-4">

          <div className="flex items-start gap-3">

            <CircleAlert
              size={12}
              className="mt-0.5 text-cyan-400"
              strokeWidth={1.2}
            />

            <div>

              <div className="font-mono text-[12px] text-[#a9bbc2]">
                Behavioural analysis
              </div>

              <p className="mt-2 text-[11px] leading-5 text-[#526873]">
                DNS_X is evaluating current resolver
                behaviour against expected DNS
                infrastructure patterns. The current
                error trend is{' '}
                <span className="text-cyan-400">
                  {trend}
                </span>
                , while the dominant response pattern
                is{' '}
                <span className="text-[#a9bbc2]">
                  {dominant}
                </span>
                .
              </p>

            </div>

          </div>

          <div className="mt-4 space-y-2">

            {reasons.map((reason) => (
              <div
                key={reason.label}
                className="border border-[#17313b] bg-[#080f14] px-3 py-2"
              >

                <div className="flex items-center justify-between">

                  <span className="font-mono text-[9px] tracking-[0.12em] text-[#40545e]">
                    {reason.label}
                  </span>

                  <span className="font-mono text-[11px] text-[#9fb2b9]">
                    {reason.value}
                  </span>

                </div>

                <p className="mt-1 text-[10px] leading-4 text-[#465b65]">
                  {reason.description}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* Recommendation */}
        <div className="border-t border-[#17313b] p-4 lg:border-l lg:border-t-0">

          <div className="flex items-center gap-2">

            <Lightbulb
              size={11}
              className="text-amber-400"
              strokeWidth={1.2}
            />

            <span className="font-mono text-[11px] tracking-[0.14em] text-[#657982]">
              INITIAL RECOMMENDATION
            </span>

          </div>

          <p className="mt-4 text-[11px] leading-5 text-[#71858d]">
            Continue monitoring resolver behaviour and
            compare the current telemetry against the
            historical baseline before escalating the
            event.
          </p>

          <div className="mt-4 border-l border-cyan-400/40 pl-3">

            <div className="font-mono text-[10px] text-cyan-400">
              AI ACTION
            </div>

            <div className="mt-1 font-mono text-[11px] text-[#9fb2b9]">
              CONTINUE OBSERVATION
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}

export default AnomalyExplanation