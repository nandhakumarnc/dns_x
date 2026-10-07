import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ShieldAlert,
  Check,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function IncidentTable() {
  const {
    incidents = [],
    selectedIncident,
    setSelectedIncident,
    acknowledgeIncident,
    resolveIncident,
  } = useDNSState()

  return (
    <section className="border border-[#17313b] bg-[#060b10]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#17313b] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#36545f]">
              INC / 01
            </span>
            <span className="h-3 w-px bg-[#17313b]" />
            <h2 className="text-[12px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              ACTIVE INCIDENTS
            </h2>
          </div>
          <div className="mt-1 font-mono text-[9px] text-[#465b65]">
            CORRELATED MULTI-SIGNAL ANOMALY EVENTS ({incidents.length} TOTAL)
          </div>
        </div>

        <span className="font-mono text-[9px] text-cyan-400">
          CORRELATION ACTIVE
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#17313b]">
              <Header>ID</Header>
              <Header>INCIDENT</Header>
              <Header>SOURCE / ROOT CAUSE</Header>
              <Header>SEVERITY</Header>
              <Header>CONFIDENCE</Header>
              <Header>SIGNALS</Header>
              <Header>STATUS</Header>
              <Header>ACTIONS</Header>
              <Header />
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center font-mono text-[11px] text-[#465b65]">
                  No active incidents detected. All resolvers operational.
                </td>
              </tr>
            ) : (
              incidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id
                return (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    isSelected={isSelected}
                    onSelect={() => setSelectedIncident(incident)}
                    onAcknowledge={() => acknowledgeIncident(incident.id)}
                    onResolve={() => resolveIncident(incident.id)}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="divide-y divide-[#17313b] lg:hidden">
        {incidents.length === 0 ? (
          <div className="p-4 text-center font-mono text-[10px] text-[#465b65]">
            No active incidents detected.
          </div>
        ) : (
          incidents.map((incident) => (
            <MobileIncident
              key={incident.id}
              incident={incident}
              onSelect={() => setSelectedIncident(incident)}
              onAcknowledge={() => acknowledgeIncident(incident.id)}
              onResolve={() => resolveIncident(incident.id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function Header({ children }) {
  return (
    <th className="px-3 py-2 text-left font-mono text-[9px] font-normal tracking-[0.12em] text-[#40545e]">
      {children}
    </th>
  )
}

function IncidentRow({
  incident,
  isSelected,
  onSelect,
  onAcknowledge,
  onResolve,
}) {
  const severity = (incident.severity || 'medium').toUpperCase()
  const status = (incident.status || 'investigating').toUpperCase()
  const signalsCount = incident.signals_count ?? incident.signals ?? 1
  const confidence = incident.confidence ?? (severity === 'CRITICAL' ? 94 : severity === 'HIGH' ? 86 : 75)
  const displayId = incident.id.length > 8 ? incident.id.slice(0, 8).toUpperCase() : incident.id
  const source = incident.source || incident.resolver_id || incident.source_type || 'RESOLVER-02'
  const cause = incident.cause || incident.root_cause_class || 'Correlated DNS deviation'

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-[#10242c] transition-colors ${
        isSelected ? 'bg-[#0b1c24]' : 'hover:bg-[#08151b]'
      }`}
    >
      <td className="px-3 py-3 font-mono text-[9px] text-cyan-400">
        {displayId}
      </td>

      <td className="px-3 py-3">
        <div className="font-mono text-[10px] text-[#9fb2b9]">
          {incident.title}
        </div>
        <div className="mt-0.5 font-mono text-[9px] text-[#40545e]">
          {cause}
        </div>
      </td>

      <td className="px-3 py-3 font-mono text-[9px] text-[#657982]">
        {source}
      </td>

      <td className="px-3 py-3">
        <Severity severity={severity} />
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1 w-12 bg-[#111c22]">
            <div
              className="h-full bg-cyan-400"
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
          <span className="font-mono text-[9px] text-[#82959d]">
            {Math.round(confidence)}%
          </span>
        </div>
      </td>

      <td className="px-3 py-3">
        <span className="font-mono text-[10px] text-[#82959d]">
          {signalsCount}
        </span>
      </td>

      <td className="px-3 py-3">
        <IncidentStatus status={status} />
      </td>

      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          {status !== 'RESOLVED' && (
            <>
              {status !== 'ACKNOWLEDGED' && (
                <button
                  type="button"
                  onClick={onAcknowledge}
                  title="Acknowledge incident"
                  className="flex items-center gap-1 border border-[#17313b] bg-[#071218] px-2 py-0.5 font-mono text-[8px] text-amber-400 hover:border-amber-400/50 hover:bg-[#0c1f28]"
                >
                  <Check size={8} />
                  ACK
                </button>
              )}
              <button
                type="button"
                onClick={onResolve}
                title="Resolve incident"
                className="flex items-center gap-1 border border-[#17313b] bg-[#071218] px-2 py-0.5 font-mono text-[8px] text-emerald-400 hover:border-emerald-400/50 hover:bg-[#0c1f28]"
              >
                <CheckCircle2 size={8} />
                RESOLVE
              </button>
            </>
          )}
          {status === 'RESOLVED' && (
            <span className="font-mono text-[8px] text-emerald-400">
              CLOSED
            </span>
          )}
        </div>
      </td>

      <td className="px-3">
        <ChevronRight
          size={10}
          className={isSelected ? 'text-cyan-400' : 'text-[#36545f]'}
        />
      </td>
    </tr>
  )
}

function MobileIncident({
  incident,
  onSelect,
  onAcknowledge,
  onResolve,
}) {
  const severity = (incident.severity || 'medium').toUpperCase()
  const status = (incident.status || 'investigating').toUpperCase()
  const signalsCount = incident.signals_count ?? (Array.isArray(incident.signals) ? incident.signals.length : 0)
  const confidence = incident.confidence !== null && incident.confidence !== undefined ? `${incident.confidence}%` : 'N/A'
  const displayId = incident.id.length > 8 ? incident.id.slice(0, 8).toUpperCase() : incident.id

  return (
    <div className="cursor-pointer p-3" onClick={onSelect}>
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[9px] text-cyan-400">
            {displayId}
          </div>
          <div className="mt-1 font-mono text-[11px] text-[#9fb2b9]">
            {incident.title}
          </div>
          <div className="mt-1 font-mono text-[9px] text-[#40545e]">
            {incident.source || incident.target_domain || 'RESOLVER FLEET'} · {incident.cause || incident.root_cause_class || 'Operational'}
          </div>
        </div>
        <Severity severity={severity} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniValue label="CONFIDENCE" value={`${Math.round(confidence)}%`} />
        <MiniValue label="SIGNALS" value={signalsCount} />
        <MiniValue label="STATUS" value={status} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {status !== 'ACKNOWLEDGED' && status !== 'RESOLVED' && (
          <button
            type="button"
            onClick={onAcknowledge}
            className="border border-[#17313b] bg-[#071218] px-2.5 py-1 font-mono text-[9px] text-amber-400"
          >
            Acknowledge
          </button>
        )}
        {status !== 'RESOLVED' && (
          <button
            type="button"
            onClick={onResolve}
            className="border border-[#17313b] bg-[#071218] px-2.5 py-1 font-mono text-[9px] text-emerald-400"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  )
}

function MiniValue({ label, value }) {
  return (
    <div className="border border-[#17313b] bg-[#080f14] p-2">
      <div className="font-mono text-[9px] text-[#40545e]">{label}</div>
      <div className="mt-1 truncate font-mono text-[9px] text-[#82959d]">{value}</div>
    </div>
  )
}

function Severity({ severity }) {
  const config = {
    CRITICAL: {
      color: 'text-red-400',
      icon: ShieldAlert,
    },
    HIGH: {
      color: 'text-orange-400',
      icon: ShieldAlert,
    },
    MEDIUM: {
      color: 'text-amber-400',
      icon: AlertTriangle,
    },
    LOW: {
      color: 'text-emerald-400',
      icon: CircleDot,
    },
  }

  const current = config[severity] || config.MEDIUM
  const Icon = current.icon

  return (
    <div className={`flex items-center gap-1.5 ${current.color}`}>
      <Icon size={8} strokeWidth={1.2} />
      <span className="font-mono text-[9px]">{severity}</span>
    </div>
  )
}

function IncidentStatus({ status }) {
  const isAck = status === 'ACKNOWLEDGED'
  const isResolved = status === 'RESOLVED' || status === 'CLOSED'
  const isContained = status === 'CONTAINED' || status === 'OBSERVING'

  const color = isResolved
    ? 'text-emerald-400'
    : isAck
      ? 'text-purple-400'
      : isContained
        ? 'text-cyan-400'
        : 'text-amber-400'

  const Icon = isResolved
    ? CheckCircle2
    : isAck
      ? Check
      : isContained
        ? CircleDot
        : AlertTriangle

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Icon size={8} strokeWidth={1.2} />
      <span className="font-mono text-[9px]">{status}</span>
    </div>
  )
}

export default IncidentTable