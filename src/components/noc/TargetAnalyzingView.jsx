import { Loader2, CheckCircle2, CircleDot, AlertCircle } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function TargetAnalyzingView() {
  const { target } = useDNSState()
  const steps = target?.analysisSteps || []

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
      <div className="mx-auto max-w-xl text-center">
        {/* Animated Radar Spinner */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-400 backdrop-blur-md shadow-[0_0_25px_rgba(34,211,238,0.25)]">
          <Loader2 size={24} className="animate-spin text-cyan-400" />
        </div>

        <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
          INITIALIZING TARGET TELEMETRY
        </div>

        <h2 className="mt-1.5 text-[18px] font-semibold text-[#f0f6f8]">
          Analyzing target: <span className="font-mono text-cyan-400">{target?.cleanDomain || target?.domain}</span>
        </h2>

        <p className="mt-1.5 font-mono text-[10px] text-[#7892a0]">
          Executing real-time DNS resolution, authoritative nameserver discovery, and baseline calibration.
        </p>

        {/* Compact Progress Stream */}
        <div className="mt-6 glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] text-left">
          {steps.map((step, idx) => {
            const isDone = step.status === 'complete'
            const isInProgress = step.status === 'in_progress'
            const isFailed = step.status === 'failed'

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between p-3.5 transition-colors ${
                  isInProgress ? 'bg-cyan-400/[0.08]' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[9px] text-[#4a6575]">
                    0{idx + 1}
                  </span>

                  <div className="font-mono text-[11px] text-[#d5e4ea]">
                    {step.label}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  {isDone && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-400">
                      <CheckCircle2 size={12} />
                      <span>COMPLETE</span>
                    </span>
                  )}

                  {isInProgress && (
                    <span className="flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-cyan-400">
                      <Loader2 size={11} className="animate-spin text-cyan-400" />
                      <span>IN PROGRESS</span>
                    </span>
                  )}

                  {isFailed && (
                    <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-400">
                      <AlertCircle size={12} />
                      <span>FAILED</span>
                    </span>
                  )}

                  {!isDone && !isInProgress && !isFailed && (
                    <span className="flex items-center gap-1 text-[#4a6575]">
                      <CircleDot size={10} />
                      <span>QUEUED</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Visual Progress Line */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full border border-white/[0.06] bg-black/40 p-0.5">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
        </div>
      </div>
    </div>
  )
}

export default TargetAnalyzingView
