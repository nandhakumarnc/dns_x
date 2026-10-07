import { Activity, Wifi, WifiOff } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function SystemStatus() {
  const dns = useDNSState()
  const isLive = dns.connection?.mode === 'live' || dns.connection?.mode === 'active_probe'
  const isConnecting = dns.connection?.mode === 'connecting'
  const canonical = getCanonicalHealth(dns)

  return (
    <div className="flex items-center gap-3">
      {/* Live badge */}
      <div className="flex items-center gap-1.5 border border-[#17232d] bg-[#0a1016] px-2.5 py-1">
        {isLive ? (
          <Wifi size={11} className="text-cyan-400" />
        ) : (
          <WifiOff size={11} className="text-amber-400" />
        )}
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#7f929d]">
          {isLive ? 'LIVE TELEMETRY' : isConnecting ? 'CONNECTING...' : 'STANDBY'}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isLive ? 'animate-pulse bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.8)]' : 'bg-amber-400 shadow-[0_0_7px_rgba(251,191,36,0.6)]'
          }`}
        />
      </div>

      {/* Telemetry System status */}
      <div className="flex items-center gap-2 border border-[#17232d] bg-[#0a1016] px-3 py-1 font-mono">
        <Activity
          size={12}
          style={{ color: canonical.color }}
          strokeWidth={1.5}
        />

        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.14em]">
          <span className="text-[#556e7b]">TARGET:</span>
          <span style={{ color: canonical.color }} className="font-semibold">
            {canonical.targetLabel || canonical.status}
          </span>
          <span className="text-[#2b414d]">•</span>
          <span className="text-[#556e7b]">SYS:</span>
          <span className={`${canonical.isSystemOffline ? 'text-amber-400' : 'text-emerald-400'} font-semibold`}>
            {canonical.systemLabel || 'ONLINE'}
          </span>
        </div>

        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: canonical.color,
            boxShadow: `0 0 7px ${canonical.color}`,
          }}
        />
      </div>
    </div>
  )
}

export default SystemStatus