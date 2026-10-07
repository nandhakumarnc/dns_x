import {
  AlertOctagon,
  CheckCircle2,
  Clock3,
  ShieldAlert,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function IncidentOverview() {
  const { incidents = [], ai = {} } = useDNSState()

  const activeCount = incidents.filter((inc) => {
    const s = (inc.status || '').toLowerCase()
    return s === 'investigating' || s === 'active' || s === 'open'
  }).length

  const observationCount = incidents.filter((inc) => {
    const s = (inc.status || '').toLowerCase()
    return s === 'contained' || s === 'observing' || s === 'acknowledged'
  }).length

  const resolvedCount = incidents.filter((inc) => {
    const s = (inc.status || '').toLowerCase()
    return s === 'resolved' || s === 'closed'
  }).length

  const hasCritical = incidents.some((inc) => (inc.severity || '').toLowerCase() === 'critical')
  const hasHigh = incidents.some((inc) => (inc.severity || '').toLowerCase() === 'high')

  const threatLevel = hasCritical || ai.severity === 'critical'
    ? 'CRITICAL'
    : hasHigh || ai.severity === 'warning'
      ? 'ELEVATED'
      : 'LOW'

  const stats = [
    {
      label: 'ACTIVE INCIDENTS',
      value: String(activeCount).padStart(2, '0'),
      detail: activeCount > 0 ? 'requiring immediate triage' : 'no unhandled incidents',
      icon: AlertOctagon,
      state: activeCount > 0 ? 'critical' : 'normal',
    },
    {
      label: 'UNDER OBSERVATION',
      value: String(observationCount).padStart(2, '0'),
      detail: 'correlated anomaly signals',
      icon: Clock3,
      state: observationCount > 0 ? 'warning' : 'normal',
    },
    {
      label: 'RESOLVED INCIDENTS',
      value: String(resolvedCount).padStart(2, '0'),
      detail: 'mitigated and closed',
      icon: CheckCircle2,
      state: 'normal',
    },
    {
      label: 'THREAT LEVEL',
      value: threatLevel,
      detail: threatLevel === 'LOW' ? 'no active attack confirmed' : 'anomaly patterns detected',
      icon: ShieldAlert,
      state: threatLevel === 'CRITICAL' ? 'critical' : threatLevel === 'ELEVATED' ? 'warning' : 'normal',
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-px border border-[#17313b] bg-[#17313b] lg:grid-cols-4">
      {stats.map((stat) => (
        <IncidentStat
          key={stat.label}
          {...stat}
        />
      ))}
    </section>
  )
}

function IncidentStat({
  label,
  value,
  detail,
  icon: Icon,
  state,
}) {
  const stateColor =
    state === 'critical'
      ? 'text-red-400'
      : state === 'warning'
        ? 'text-amber-400'
        : 'text-emerald-400'

  return (
    <div className="bg-[#060b10] p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.12em] text-[#40545e]">
          {label}
        </span>

        <Icon
          size={10}
          strokeWidth={1.2}
          className={stateColor}
        />
      </div>

      <div className={`mt-3 font-mono text-[18px] leading-none ${stateColor}`}>
        {value}
      </div>

      <div className="mt-2 text-[9px] text-[#465b65]">
        {detail}
      </div>
    </div>
  )
}

export default IncidentOverview