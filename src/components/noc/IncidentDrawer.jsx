import { useEffect } from 'react'
import {
  X,
  CheckCircle2,
  Check,
  Clock,
  Server,
} from 'lucide-react'
import IncidentTimeline from '../incidents/IncidentTimeline'
import RootCauseCard from '../incidents/RootCauseCard'
import useDNSState from '../../hooks/useDNSState'

function IncidentDrawer({ isOpen, onClose, incident }) {
  const { acknowledgeIncident, resolveIncident } = useDNSState()

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !incident) return null

  const severity = (incident.severity || 'medium').toUpperCase()
  const status = (incident.status || 'investigating').toUpperCase()
  const displayId = incident.id?.length > 8 ? incident.id.slice(0, 8).toUpperCase() : incident.id
  const isResolved = status === 'RESOLVED' || status === 'CLOSED'
  const isAck = status === 'ACKNOWLEDGED'

  const severityColor =
    severity === 'CRITICAL'
      ? 'text-red-400 border-red-500/40 bg-red-500/10'
      : severity === 'HIGH'
        ? 'text-orange-400 border-orange-500/40 bg-orange-500/10'
        : severity === 'MEDIUM'
          ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
          : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'

  const createdFormatted = incident.created_at
    ? new Date(incident.created_at).toLocaleString()
    : 'Recently detected'

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.12] bg-[#070d14]/92 backdrop-blur-2xl text-[#c8d7dc] shadow-[-20px_0_60px_rgba(0,0,0,0.8),inset_1px_0_0_rgba(255,255,255,0.08)]">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
                INCIDENT TRIAGE
              </span>
              <span className="h-3 w-px bg-white/[0.12]" />
              <span className="font-mono text-[11px] font-semibold text-cyan-400">
                {displayId}
              </span>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[8px] font-medium tracking-wider ${severityColor}`}>
                {severity}
              </span>
            </div>

            <h2 className="mt-1 text-[17px] font-semibold tracking-wide text-[#f0f6f8]">
              {incident.title}
            </h2>

            <div className="mt-1 flex items-center gap-3 font-mono text-[9px] text-[#6b8592]">
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {createdFormatted}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Server size={10} />
                {incident.source || (Array.isArray(incident.affected_resolvers) ? incident.affected_resolvers.slice(0, 2).join(', ') : incident.resolver_id) || 'VANTAGE POINT FLEET'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-[#728792] transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-cyan-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Quick Metrics Bar */}
          <div className="glass-card grid grid-cols-3 gap-2 rounded-2xl p-4 font-mono text-[9px] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[#657f8d]">ROOT CAUSE CLASS</div>
              <div className="mt-1 text-[13px] font-medium text-cyan-400">
                {incident.root_cause_class || 'OPERATIONAL'}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[#657f8d]">CONFIDENCE</div>
              <div className="mt-1 text-[13px] font-medium text-[#d5e4ea]">
                {incident.confidence !== undefined && incident.confidence !== null ? `${Math.round(incident.confidence)}%` : 'CALIBRATING'}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[#657f8d]">STATUS</div>
              <div className="mt-1 text-[13px] font-medium text-amber-400">
                {status}
              </div>
            </div>
          </div>

          {/* Root Cause Assessment Card */}
          <RootCauseCard />

          {/* Full Incident Timeline */}
          <IncidentTimeline />
        </div>

        {/* Drawer Footer with Operational Actions */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-4">
          <div className="font-mono text-[9px] text-[#657f8d]">
            ACTION PROTOCOL · IMMEDIATE REMEDIATION
          </div>

          <div className="flex items-center gap-2">
            {!isResolved && !isAck && (
              <button
                type="button"
                onClick={() => acknowledgeIncident(incident.id)}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-mono text-[10px] font-medium tracking-wider text-amber-300 transition hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              >
                <Check size={12} />
                ACKNOWLEDGE
              </button>
            )}

            {!isResolved && (
              <button
                type="button"
                onClick={() => {
                  resolveIncident(incident.id)
                }}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 font-mono text-[10px] font-medium tracking-wider text-emerald-300 transition hover:bg-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 size={12} />
                RESOLVE INCIDENT
              </button>
            )}

            {isResolved && (
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                <CheckCircle2 size={13} />
                INCIDENT RESOLVED
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 font-mono text-[10px] text-[#8ea4af] transition hover:border-white/[0.2] hover:text-[#d5e4ea]"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IncidentDrawer
