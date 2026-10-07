import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Loader2, ArrowRight, RotateCcw } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import SpecularButton from '../ui/SpecularButton'

const QUICK_CHIPS = ['cloudflare.com', 'google.com', 'github.com', 'quad9.net']

function TargetBar({ className = '' }) {
  const { target, analyzeTarget, changeTarget } = useDNSState()
  const [inputVal, setInputVal] = useState('')

  const isAnalyzing = target?.state === 'ANALYZING'
  const isActive = target?.state === 'ACTIVE'

  const handleChangeTarget = () => {
    setInputVal('')
    changeTarget()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputVal.trim() || isAnalyzing) return
    analyzeTarget(inputVal)
  }

  return (
    <div className={`glass-panel p-4 ${className}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand / Scope Tag (links to landing page) */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="glass-card flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-[#a5c3d2] hover:text-white hover:border-white/20 transition-all cursor-pointer"
            title="Return to Landing Page"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_4px_rgba(34,211,238,0.3)]" />
            DNS_X
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#8fa6b0]">
            TARGET ENGINE
          </span>
        </div>

        {/* Dynamic Form / Active Target Context */}
        {!isActive ? (
          <div className="flex flex-1 max-w-2xl flex-col gap-2">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  id="dns-target-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={isAnalyzing}
                  placeholder="Enter domain or website URL..."
                  className="w-full rounded-xl border border-white/[0.12] bg-white/[0.04] py-2 pl-9 pr-3 font-mono text-[11px] text-white placeholder:text-white/40 backdrop-blur-md focus:border-cyan-400/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-cyan-400/20 disabled:opacity-50 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]"
                />
              </div>

              <SpecularButton
                id="dns-analyze-btn"
                type="submit"
                disabled={!inputVal.trim() || isAnalyzing}
                radius={12}
                tint="#6366f1"
                tintOpacity={0.12}
                blur={12}
                textColor="#ffffff"
                lineColor="#38bdf8"
                baseColor="#4f46e5"
                intensity={0.75}
                shineSize={14}
                shineFade={35}
                thickness={1.5}
                speed={0.4}
                followMouse
                proximity={220}
                autoAnimate={isAnalyzing}
                className="font-mono text-[10px] font-semibold uppercase tracking-wider !py-2 !px-4 text-white shadow-[0_4px_16px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-white" />
                    <span>ANALYZING...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>ANALYZE</span>
                    <ArrowRight size={11} />
                  </span>
                )}
              </SpecularButton>
            </form>

            {/* Subtext and Quick-start Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[9px]">
              <span className="text-[#8ba2ad]">
                Add a DNS target to begin monitoring.
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[#6d8490]">QUICK:</span>
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => {
                      setInputVal(chip)
                      analyzeTarget(chip)
                    }}
                    className="glass-pill-subtle px-2.5 py-0.5 text-[9px] text-[#c2d7e0] transition-all hover:text-white disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Target Context */
          <div className="flex flex-wrap items-center gap-3">
            <div className="glass-card flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] text-cyan-300">
              <span className="text-[#8ba2ad]">TARGET:</span>
              <strong className="text-white">{target.cleanDomain}</strong>
            </div>

            <div className="glass-card flex items-center gap-2 border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1.5 font-mono text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#22c55e]" />
              <span>MONITORING</span>
              {target.latency > 0 && (
                <span className="text-emerald-300/90 font-medium">({target.latency}ms)</span>
              )}
            </div>

            {target.ips?.length > 0 && (
              <div className="hidden font-mono text-[9px] text-[#8ba2ad] lg:block">
                A: <span className="text-white/80">{target.ips.slice(0, 2).join(', ')}</span>
              </div>
            )}

            <button
              id="dns-change-target-btn"
              type="button"
              onClick={handleChangeTarget}
              className="glass-pill-subtle flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#c0d5df] transition-all hover:text-white"
            >
              <RotateCcw size={10} />
              <span>CHANGE TARGET</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TargetBar
