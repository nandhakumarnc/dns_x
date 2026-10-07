import { useState } from 'react'
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  AlertTriangle,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import IncidentDrawer from './IncidentDrawer'

function ActiveIncidentsSection() {
  const {
    incidents = [],
    signals = [],
    setSelectedIncident,
  } = useDNSState()

  const [activeTab, setActiveTab] = useState('active') // 'active' | 'signals' | 'resolved'
  const [drawerIncident, setDrawerIncident] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const activeIncidents = incidents.filter(
    (inc) => inc.status !== 'resolved' && inc.status !== 'closed'
  )
  const resolvedIncidents = incidents.filter(
    (inc) => inc.status === 'resolved' || inc.status === 'closed'
  )

  const openDetails = (incident) => {
    setSelectedIncident(incident)
    setDrawerIncident(incident)
    setIsDrawerOpen(true)
  }

  const closeDetails = () => {
    setIsDrawerOpen(false)
    setDrawerIncident(null)
  }

  return (
    <section className="glass-panel overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/[0.08] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#7891a0]">
            SIG / INC
          </span>
          <span className="h-3 w-px bg-white/[0.15]" />
          <h2 className="text-[12px] font-semibold tracking-[0.16em] text-white">
            SIGNALS & ACTIVE INCIDENTS
          </h2>
        </div>

        {/* Tab Filter: Active Incidents / Passive Signals / Resolved */}
        <div className="glass-card flex items-center gap-1 p-1 rounded-xl font-mono text-[9px]">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-1.5 px-3 py-1 uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === 'active'
                ? 'glass-pill-active text-white font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                : 'text-[#8fa6b0] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${activeIncidents.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>INCIDENTS ({activeIncidents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signals')}
            className={`flex items-center gap-1.5 px-3 py-1 uppercase tracking-wider rounded-lg transition-all duration-200 ${
              activeTab === 'signals'
                ? 'glass-pill-active text-white font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                : 'text-[#8fa6b0] hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Radio size={10} className="text-[#38bdf8]" />
            <span>SIGNALS ({signals.length})</span>
          </button>

          {resolvedIncidents.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1 uppercase tracking-wider rounded-lg transition-all duration-200 ${
                activeTab === 'resolved'
                  ? 'glass-pill-active text-white font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                  : 'text-[#8fa6b0] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span>RESOLVED ({resolvedIncidents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4">
        {/* Tab 1: Active Incidents */}
        {activeTab === 'active' && (
          <div>
            {activeIncidents.length === 0 ? (
              <div className="glass-card flex items-center justify-between border-emerald-500/25 bg-emerald-500/[0.05] px-4 py-3.5 rounded-xl">
                <div className="flex items-center gap-2.5 font-mono text-[11px] text-emerald-400">
                  <ShieldCheck size={16} />
                  <span>Zero active incidents requiring escalation.</span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#6f8b99]">
                  ALL RESOLVERS NOMINAL
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeIncidents.map((incident) => {
                  const severity = (incident.severity || 'medium').toUpperCase()
                  const displayId = incident.id?.length > 8 ? incident.id.slice(0, 8).toUpperCase() : incident.id
                  const source = incident.source || incident.resolver_id || 'RESOLVER-01'

                  const severityBadge =
                    severity === 'CRITICAL'
                      ? 'border-red-500/40 bg-red-500/15 text-red-300'
                      : severity === 'HIGH'
                        ? 'border-orange-500/40 bg-orange-500/15 text-orange-300'
                        : 'border-amber-500/40 bg-amber-500/15 text-amber-300'

                  return (
                    <div
                      key={incident.id}
                      className="glass-card glass-card-interactive flex flex-col gap-2 p-3.5 rounded-xl sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400">
                          <AlertTriangle size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 font-mono text-[9px]">
                            <span className="text-cyan-300 font-semibold">{displayId}</span>
                            <span className="text-white/20">•</span>
                            <span className={`border px-1.5 py-0.5 rounded-md text-[8px] font-medium tracking-wider ${severityBadge}`}>
                              INCIDENT / {severity}
                            </span>
                            <span className="text-white/20">•</span>
                            <span className="text-[#8fa6b0]">{source}</span>
                          </div>

                          <div className="mt-1 text-[12px] font-medium text-white">
                            {incident.title}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openDetails(incident)}
                        className="glass-pill-subtle flex items-center gap-1.5 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300 transition-all hover:text-white"
                      >
                        <span>VIEW DETAILS</span>
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Passive Observing Signals */}
        {activeTab === 'signals' && (
          <div>
            {signals.length === 0 ? (
              <div className="glass-card p-5 text-center font-mono text-[10px] text-[#8fa6b0] rounded-xl">
                No anomaly signals detected in current observation window.
              </div>
            ) : (
              <div className="space-y-2">
                {signals.slice(0, 5).map((sig, idx) => (
                  <div
                    key={sig.id || idx}
                    className="glass-card flex items-center justify-between p-3 font-mono text-[9px] rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="glass-pill-subtle border-sky-400/30 text-sky-300 px-2 py-0.5 text-[8px] font-medium">
                        SIGNAL / OBSERVING
                      </span>
                      <span className="text-white font-medium">
                        {sig.type?.toUpperCase() || 'TELEMETRY DEVIATION'} {sig.vantage_point ? `on ${sig.vantage_point}` : sig.resolver_id ? `on ${sig.resolver_id}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[#8fa6b0]">
                      <span>DEVIATION: <strong className="text-amber-300">{sig.deviation_score ? `${Number(sig.deviation_score).toFixed(1)}σ` : sig.z_score ? `${Number(sig.z_score).toFixed(1)}σ` : 'N/A'}</strong></span>
                      <span>{sig.ts ? new Date(sig.ts).toLocaleTimeString() : 'RECENT'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Resolved Incidents */}
        {activeTab === 'resolved' && (
          <div className="space-y-2">
            {resolvedIncidents.map((incident) => (
              <div
                key={incident.id}
                className="glass-card flex items-center justify-between p-3 font-mono text-[9px] rounded-xl opacity-80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="glass-pill-subtle border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[8px] font-medium">
                    RESOLVED
                  </span>
                  <span className="text-white/90 font-medium">{incident.title}</span>
                </div>

                <button
                  type="button"
                  onClick={() => openDetails(incident)}
                  className="glass-pill-subtle text-cyan-300 px-2.5 py-1 rounded-lg transition-all hover:text-white"
                >
                  VIEW
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail Drawer */}
      <IncidentDrawer
        isOpen={isDrawerOpen}
        onClose={closeDetails}
        incident={drawerIncident}
      />
    </section>
  )
}

export default ActiveIncidentsSection
