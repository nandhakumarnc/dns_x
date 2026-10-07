import { Lock, ArrowRight, Globe2 } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import DotField from '../ui/DotField'

const SUGGESTED_TARGETS = [
  'cloudflare.com',
  'google.com',
  'github.com',
  'quad9.net',
  'apple.com',
]

function TargetGatedPlaceholder() {
  const { analyzeTarget } = useDNSState()

  return (
    <div className="glass-panel relative overflow-hidden p-8 text-center sm:p-12">
      {/* Background DotField accent inside the gated panel */}
      <div className="pointer-events-none absolute inset-0 opacity-45">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom="rgba(168, 85, 247, 0.22)"
          gradientTo="rgba(180, 151, 207, 0.14)"
          glowColor="#09101d"
        />
      </div>

      <div className="relative z-10">
        {/* Central Lock Graphic */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] text-[#a4bcc8] shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]">
        <Lock size={26} strokeWidth={1.8} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70 shadow-[0_0_4px_rgba(251,191,36,0.3)]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-200/80 font-medium">
          NOC WORKSPACE GATED
        </span>
      </div>

      <h2 className="mt-2 text-[20px] font-semibold tracking-wide text-white sm:text-[22px]">
        Add a DNS target to begin monitoring.
      </h2>

      <p className="mx-auto mt-2 max-w-xl font-mono text-[11px] leading-5 text-[#8fa6b0]">
        DNS_X operates as an active, target-driven intelligence center. Strict backend network validation verifies DNS resolution (A/AAAA/NS) and HTTP/HTTPS reachability before NOC telemetry, baseline calibration, and ML analysis unlock. Unverified or fake targets are halted immediately.
      </p>

      {/* Quick Launch Targets */}
      <div className="mx-auto mt-6 max-w-md">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#718a96]">
          QUICK START WITH A MONITORED DOMAIN:
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {SUGGESTED_TARGETS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => analyzeTarget(domain)}
              className="glass-pill-subtle flex items-center gap-2 px-3.5 py-1.5 font-mono text-[10px] text-white/90 transition-all hover:text-white hover:border-white/25"
            >
              <Globe2 size={12} className="text-[#8baec2]" />
              <span>{domain}</span>
              <ArrowRight size={10} className="text-white/60" />
            </button>
          ))}
        </div>
      </div>

      {/* Locked Telemetry Schematic Preview */}
      <div className="glass-card mx-auto mt-10 max-w-3xl p-5 rounded-2xl opacity-80">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 font-mono text-[9px] text-[#7d95a2]">
          <span>TARGET-DRIVEN TELEMETRY PIPELINE PREVIEW</span>
          <span className="flex items-center gap-1 text-amber-300/80">
            <Lock size={10} />
            LOCKED
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-left sm:grid-cols-4 font-mono text-[9px]">
          <div className="glass-card p-3 rounded-xl">
            <div className="text-[#6d8896]">1. AUTHORITY</div>
            <div className="mt-1 text-white/90">A / AAAA Root Path</div>
          </div>
          <div className="glass-card p-3 rounded-xl">
            <div className="text-[#6d8896]">2. RESOLVERS</div>
            <div className="mt-1 text-white/90">Fleet & Public Observers</div>
          </div>
          <div className="glass-card p-3 rounded-xl">
            <div className="text-[#6d8896]">3. ML ANOMALY</div>
            <div className="mt-1 text-white/90">Z-Score Baselines</div>
          </div>
          <div className="glass-card p-3 rounded-xl">
            <div className="text-[#6d8896]">4. TRIAGE</div>
            <div className="mt-1 text-white/90">Slide-over Incident Drawer</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}

export default TargetGatedPlaceholder
