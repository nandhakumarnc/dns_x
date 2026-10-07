import {
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  TrendingDown,
  Zap,
} from 'lucide-react'

function AIOverview() {
  const anomalyScore = 0.00
  const evidenceState = 'OBSERVED HEALTHY'

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#080d12]">
      {/* Ambient AI glow */}
      <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[220px] w-[220px] rounded-full bg-[#00d9ff]/[0.025] blur-[80px]" />

      {/* Header */}
      <div className="relative flex h-11 items-center justify-between border-b border-[#17313b] px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-[#00d9ff]/30 bg-[#00d9ff]/[0.04]">
            <BrainCircuit
              size={13}
              className="text-[#00d9ff]"
              strokeWidth={1.4}
            />
          </div>

          <div>
            <div className="text-[9px] font-medium uppercase tracking-[0.17em] text-[#b6c9d0]">
              AI Intelligence
            </div>

            <div className="mt-0.5 text-[6px] uppercase tracking-[0.18em] text-[#40545e]">
              Predictive Infrastructure Analysis
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />

          <span className="text-[7px] uppercase tracking-[0.16em] text-[#22c55e]">
            Model Active
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.15fr]">
        {/* Left — AI metrics */}
        <div className="border-b border-[#17313b] p-5 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-3 gap-3">
            {/* Anomaly */}
            <div>
              <div className="text-[7px] uppercase tracking-[0.14em] text-[#40545e]">
                Anomaly
              </div>

              <div className="mt-2 font-mono text-[18px] text-[#d4e2e7]">
                {anomalyScore}
              </div>

              <div className="mt-1 text-[7px] text-[#22c55e]">
                LOW
              </div>
            </div>

            {/* Operational State */}
            <div>
              <div className="text-[7px] uppercase tracking-[0.14em] text-[#40545e]">
                Operational State
              </div>

              <div className="mt-2 font-mono text-[14px] text-[#22c55e]">
                {evidenceState}
              </div>

              <div className="mt-1 text-[7px] text-[#22c55e]">
                NOMINAL
              </div>
            </div>

            {/* Confidence */}
            <div>
              <div className="text-[7px] uppercase tracking-[0.14em] text-[#40545e]">
                Confidence
              </div>

              <div className="mt-2 font-mono text-[18px] text-[#d4e2e7]">
                {confidence}%
              </div>

              <div className="mt-1 text-[7px] text-[#00d9ff]">
                HIGH
              </div>
            </div>
          </div>

          {/* Anomaly score meter */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[7px] uppercase tracking-[0.15em] text-[#40545e]">
                Behavioural Deviation
              </span>

              <span className="font-mono text-[7px] text-[#536873]">
                18 / 100
              </span>
            </div>

            <div className="h-[3px] w-full bg-[#142129]">
              <div
                className="h-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.35)]"
                style={{
                  width: `${anomalyScore * 100}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-[6px] uppercase tracking-[0.1em] text-[#354850]">
              <span>Normal</span>
              <span>Elevated</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Baseline */}
          <div className="mt-7 flex items-center justify-between border border-[#17313b] bg-[#0a1117] px-3 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={13}
                className="text-[#22c55e]"
                strokeWidth={1.4}
              />

              <div>
                <div className="text-[7px] uppercase tracking-[0.14em] text-[#40545e]">
                  Current Baseline
                </div>

                <div className="mt-0.5 text-[9px] text-[#9db1b9]">
                  Normal operating pattern
                </div>
              </div>
            </div>

            <span className="text-[7px] uppercase tracking-[0.12em] text-[#22c55e]">
              Stable
            </span>
          </div>
        </div>

        {/* Right — AI assessment */}
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Zap
              size={11}
              className="text-[#00d9ff]"
              strokeWidth={1.5}
            />

            <span className="text-[7px] uppercase tracking-[0.17em] text-[#40545e]">
              AI Assessment
            </span>
          </div>

          <div className="mt-3 border-l border-[#00d9ff]/30 pl-3">
            <p className="text-[11px] leading-[1.7] text-[#9fb3bb]">
              DNS behaviour remains within expected operating
              patterns. No significant infrastructure anomaly has
              been detected.
            </p>
          </div>

          {/* Detected signal */}
          <div className="mt-5 flex items-start gap-3 border border-[#17313b] bg-[#0a1117] p-3">
            <CircleAlert
              size={13}
              className="mt-0.5 shrink-0 text-[#f59e0b]"
              strokeWidth={1.4}
            />

            <div>
              <div className="text-[7px] uppercase tracking-[0.14em] text-[#536873]">
                Detected Signal
              </div>

              <div className="mt-1 text-[9px] leading-[1.5] text-[#879ba4]">
                Resolver-02 is showing slightly elevated
                response latency compared with its baseline.
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-3 flex items-start gap-3 border border-[#17313b] bg-[#0a1117] p-3">
            <TrendingDown
              size={13}
              className="mt-0.5 shrink-0 text-[#22c55e]"
              strokeWidth={1.4}
            />

            <div>
              <div className="text-[7px] uppercase tracking-[0.14em] text-[#536873]">
                Recommended Action
              </div>

              <div className="mt-1 text-[9px] leading-[1.5] text-[#879ba4]">
                Continue monitoring Resolver-02. No immediate
                intervention is required.
              </div>
            </div>
          </div>

          {/* Explainability */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={10}
                className="text-[#22c55e]"
                strokeWidth={1.5}
              />

              <span className="text-[7px] uppercase tracking-[0.13em] text-[#40545e]">
                Explainable prediction
              </span>
            </div>

            <span className="font-mono text-[7px] text-[#354850]">
              SHAP / XAI
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AIOverview