import { RotateCcw, Search, ShieldX } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function TargetFailedView() {
  const { target, retryTarget, changeTarget } = useDNSState()

  const isBackendOffline =
    target?.error?.toLowerCase().includes('backend and fallback') ||
    target?.error?.toLowerCase().includes('networkerror') ||
    target?.error?.toLowerCase().includes('offline')

  return (
    <div className={`glass-panel rounded-2xl p-8 text-center sm:p-12 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)] ${
      isBackendOffline
        ? 'border-amber-500/30'
        : 'border-red-500/30'
    }`}>
      {/* Failure Icon */}
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-md shadow-lg ${
        isBackendOffline
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]'
          : 'border-red-500/40 bg-red-500/15 text-red-400 shadow-[0_0_24px_rgba(239,68,68,0.25)]'
      }`}>
        <ShieldX size={26} strokeWidth={1.5} />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${isBackendOffline ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${isBackendOffline ? 'text-amber-400' : 'text-red-400'}`}>
          {isBackendOffline ? 'MEASUREMENT SYSTEM OFFLINE · TARGET STATE UNKNOWN' : (target?.status || 'TARGET UNAVAILABLE / VALIDATION FAILED')}
        </span>
      </div>

      <h2 className="mt-2 text-[20px] font-semibold text-[#f5edee]">
        {isBackendOffline ? 'Telemetry System Offline' : 'Website Unavailable'}
      </h2>

      <div className={`glass-card mx-auto mt-4 max-w-lg rounded-xl p-4 text-left ${isBackendOffline ? 'border-amber-500/25 bg-amber-950/20' : 'border-red-500/25 bg-red-950/20'}`}>
        <div className={`font-mono text-[9px] uppercase tracking-wider ${isBackendOffline ? 'text-amber-400' : 'text-red-400'}`}>
          {isBackendOffline ? 'SYSTEM STATUS:' : 'ERROR REASON:'}
        </div>
        <p className={`mt-1 font-mono text-[11px] leading-5 ${isBackendOffline ? 'text-[#e2d5b5]' : 'text-[#e5b5b5]'}`}>
          {target?.error || 'Website unavailable — DNS_X cannot analyze this target.'}
        </p>
        {target?.details && (
          <p className="mt-2 text-[10px] text-[#e5b5b5]/70 border-t border-red-500/10 pt-2 font-mono break-words">
            {target.details}
          </p>
        )}
      </div>

      <p className="mx-auto mt-4 max-w-md font-mono text-[10px] text-[#8c6d75]">
        {isBackendOffline
          ? 'DNS_X backend server is unreachable. Target DNS health cannot be verified and remains UNKNOWN until telemetry is restored.'
          : 'DNS_X enforces real website reachability with backend validation. No metrics or signals are generated for unavailable targets.'}
      </p>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={retryTarget}
          className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-600/30 to-red-500/20 px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/30 shadow-[0_0_16px_rgba(239,68,68,0.25)]"
        >
          <RotateCcw size={12} />
          <span>TRY AGAIN</span>
        </button>

        <button
          type="button"
          onClick={changeTarget}
          className="glass-card-interactive flex items-center gap-1.5 rounded-xl px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#b8cbd4] transition hover:text-white"
        >
          <Search size={12} />
          <span>CHANGE TARGET</span>
        </button>
      </div>
    </div>
  )
}

export default TargetFailedView
