import { Link } from 'react-router-dom'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function Navbar() {
  const dns = useDNSState()
  const { target } = dns
  const isActive = target?.state === 'ACTIVE'
  const canonical = getCanonicalHealth(dns)

  return (
    <header className="fixed left-[218px] right-0 top-0 z-30 flex h-[56px] items-center justify-between border-b border-white/[0.08] bg-[#0a111d]/50 px-6 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* Left: Brand Identity (links to landing page) */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="font-mono text-[11px] font-semibold tracking-[0.2em] text-white hover:text-[#9bc2d4] transition-colors flex items-center gap-2 cursor-pointer"
          aria-label="Go to landing page"
          title="Return to Landing Page"
        >
          <img src="/logo.png" alt="DNS_X" className="h-4 w-4 object-contain drop-shadow-[0_0_4px_rgba(34,211,238,0.25)]" />
          DNS_X
        </Link>
        <span className="h-3 w-px bg-white/[0.15]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8fa6b0]">
          INVESTIGATION CONSOLE
        </span>
      </div>

      {/* Right: Only Global Target Status, Canonical System State & Authenticated User */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Global Target indicator */}
        <div className="glass-pill-subtle flex items-center gap-2 px-3 py-1 font-mono">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isActive
                ? 'bg-cyan-400/80 shadow-[0_0_4px_rgba(34,211,238,0.4)]'
                : 'bg-amber-400/80'
            }`}
          />
          <span className={`text-[10px] uppercase tracking-[0.14em] ${isActive ? 'text-[#9bc2d4] font-medium' : 'text-[#7d929d]'}`}>
            {isActive ? 'TARGET ACTIVE' : 'STANDBY'}
          </span>
        </div>

        {/* Target & Telemetry Status */}
        <div className="glass-pill-subtle flex items-center gap-2 px-3 py-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: canonical.color,
              boxShadow: `0 0 8px ${canonical.color}`,
            }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#9cb1bc]">
            {canonical.isSystemOffline
              ? 'SYSTEM OFFLINE · TARGET UNKNOWN'
              : isActive
                ? `TARGET: ${canonical.targetLabel || canonical.status}`
                : canonical.label}
          </span>
        </div>
      </div>
    </header>
  )
}

export default Navbar