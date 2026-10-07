import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Radio,
  Server,
  ShieldAlert,
  Zap,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'

function LiveEvents() {
  const dns = useDNSState()

  const {
    qps,
  } = dns.traffic
  const {
    latency,
  } = dns.performance
  const {
    rate,
    dominant,
  } = dns.errors
  const {
    resolvers,
    cache,
  } = dns.infrastructure

  const signals = dns.signals || []

  // Base telemetry events
  const events = [
    ...signals.slice(0, 3).map((sig) => ({
      time: sig.ts ? new Date(sig.ts).toLocaleTimeString() : 'NOW',
      type: 'ANOMALY SIGNAL',
      title: `${sig.type?.toUpperCase() || 'SIGNAL'} anomaly detected on ${sig.resolver_id || 'RESOLVER'}`,
      detail: `Z-score deviation ${sig.z_score ? Number(sig.z_score).toFixed(2) : '2.5'}σ from learned baseline`,
      icon: ShieldAlert,
      level: 'warning',
    })),
    {
      time: 'NOW',
      type: 'TRAFFIC',
      title: 'DNS traffic telemetry updated',
      detail: `${qps.toLocaleString()} queries/sec currently observed`,
      icon: Activity,
      level: 'normal',
    },
    {
      time: 'NOW',
      type: 'RESOLVER',
      title: 'Resolver performance nominal',
      detail: `Average response latency ${latency.toFixed(1)} ms`,
      icon: Server,
      level: 'normal',
    },
    {
      time: 'NOW',
      type: 'CACHE',
      title: 'DNS cache telemetry received',
      detail: `${cache.hitRate.toFixed(1)}% cache hit rate`,
      icon: Database,
      level: 'normal',
    },
    {
      time: 'NOW',
      type: 'ERROR',
      title: `${dominant} response activity monitored`,
      detail: `Current DNS error rate ${rate.toFixed(2)}%`,
      icon: rate > 5 ? AlertTriangle : ShieldAlert,
      level: rate > 5 ? 'warning' : 'normal',
    },
    {
      time: 'NOW',
      type: 'SYSTEM',
      title: 'Resolver fleet synchronized',
      detail: `${resolvers.length} DNS resolver nodes reporting`,
      icon: Radio,
      level: 'normal',
    },
  ]

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(31,82,96,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,82,96,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-[#17313b] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] tracking-[0.2em] text-[#36545f]">
              MON / 03
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[14px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              LIVE EVENTS
            </h2>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_7px_rgba(34,211,238,0.8)]" />

            <span className="font-mono text-[11px] tracking-[0.14em] text-cyan-400">
              TELEMETRY & SIGNAL STREAM
            </span>
          </div>
        </div>

        <Clock3
          size={14}
          strokeWidth={1}
          className="text-cyan-400"
        />
      </div>

      {/* Event stream */}
      <div className="relative">
        {events.map((event, index) => (
          <EventRow
            key={`${event.type}-${index}`}
            event={event}
            first={index === 0}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#17313b] px-4 py-2">
        <div className="flex items-center gap-2">
          <Zap
            size={8}
            className="text-cyan-400"
          />

          <span className="font-mono text-[10px] tracking-[0.12em] text-[#40545e]">
            EVENT STREAM ACTIVE
          </span>
        </div>

        <span className="font-mono text-[10px] tracking-[0.1em] text-[#40545e]">
          {events.length} EVENTS
        </span>
      </div>
    </section>
  )
}

function EventRow({
  event,
  first,
}) {
  const Icon = event.icon
  const warning = event.level === 'warning'

  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[#0a141a] ${
        first ? 'bg-[#08151b]' : ''
      }`}
    >
      {/* Timeline */}
      <div className="relative flex flex-col items-center">
        <div
          className={`mt-1 flex h-6 w-6 items-center justify-center border ${
            warning
              ? 'border-amber-500/30'
              : 'border-cyan-400/20'
          } bg-[#09131a]`}
        >
          <Icon
            size={10}
            strokeWidth={1.3}
            className={
              warning
                ? 'text-amber-400'
                : 'text-cyan-400'
            }
          />
        </div>

        {!first && (
          <div className="absolute -top-4 h-4 w-px bg-[#17313b]" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] text-[#40545e]">
            {event.time}
          </span>

          <span className="font-mono text-[10px] tracking-[0.12em] text-[#36545f]">
            {event.type}
          </span>

          {first && (
            <span className="font-mono text-[10px] text-cyan-400">
              LATEST
            </span>
          )}
        </div>

        <div
          className={`mt-1 font-mono text-[12px] ${
            warning
              ? 'text-amber-300'
              : 'text-[#9fb2b9]'
          }`}
        >
          {event.title}
        </div>

        <div className="mt-1 text-[11px] leading-4 text-[#657982]">
          {event.detail}
        </div>
      </div>

      {/* Status */}
      <div className="pt-1">
        {warning ? (
          <AlertTriangle
            size={9}
            className="text-amber-400"
          />
        ) : (
          <CheckCircle2
            size={9}
            className="text-emerald-400"
          />
        )}
      </div>
    </div>
  )
}

export default LiveEvents