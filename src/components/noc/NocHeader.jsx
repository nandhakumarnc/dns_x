import { Clock } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function NocHeader() {
  const dns = useDNSState()
  const { target } = dns
  const canonical = getCanonicalHealth(dns)

  const lastUpdated = dns.timestamp
    ? new Date(dns.timestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString()

  return (
    <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] pb-3.5 text-white/90">
      {/* Compact Context: NOC / domain ● MONITORING */}
      <div className="flex items-center gap-2.5 font-mono text-[11px]">
        <span className="text-[#8fa6b0] tracking-wider font-semibold">NOC</span>
        <span className="text-white/20">/</span>
        <span className="font-semibold text-white tracking-wide">{target?.cleanDomain || 'TARGET'}</span>
        <span className="text-white/20">•</span>
        <div className="glass-card flex items-center gap-1.5 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[9px] text-emerald-400 rounded-lg">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#22c55e]" />
          <span className="font-medium">MONITORING</span>
        </div>
      </div>

      {/* Right: Telemetry Timestamp & Canonical Status */}
      <div className="flex items-center gap-3 font-mono text-[9px]">
        <div className="flex items-center gap-1.5 text-[#8fa6b0]">
          <Clock size={11} className="text-[#38bdf8]" />
          <span>LAST TELEMETRY:</span>
          <span className="text-white/90">{lastUpdated}</span>
        </div>

        <div className="h-3 w-px bg-white/[0.15]" />

        {/* Target Health & System Measurement Health Badges */}
        <div className="flex items-center gap-2">
          <div className="glass-card flex items-center gap-2 px-3 py-1 rounded-xl">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: canonical.color,
                boxShadow: `0 0 6px ${canonical.color}`,
              }}
            />
            <span className="text-[#7d95a2]">TARGET:</span>
            <span className="font-semibold uppercase" style={{ color: canonical.color }}>
              {canonical.targetLabel || canonical.status}
            </span>
          </div>

          <div className="glass-card flex items-center gap-2 px-3 py-1 rounded-xl">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                canonical.isSystemOffline
                  ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                  : 'bg-emerald-400 shadow-[0_0_6px_#22c55e]'
              }`}
            />
            <span className="text-[#7d95a2]">SYSTEM:</span>
            <span
              className={`font-semibold uppercase ${
                canonical.isSystemOffline ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {canonical.systemLabel || 'ONLINE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NocHeader
