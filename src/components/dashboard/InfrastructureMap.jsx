import {
  Activity,
  Database,
  Globe2,
  Server,
  Zap,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

const statusStyles = {
  healthy: {
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.45)',
    label: 'ONLINE',
  },
  warning: {
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.45)',
    label: 'WARNING',
  },
  critical: {
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.45)',
    label: 'CRITICAL',
  },
}

function Node({ icon: Icon, title, subtitle, value, status = 'healthy' }) {
  const style = statusStyles[status] || statusStyles.healthy

  return (
    <div
      className="relative border border-[#17313b] bg-[#081016]/95 px-3 py-3 backdrop-blur-sm"
      style={{
        boxShadow: `inset 0 0 25px ${style.glow.replace('0.45', '0.04')}`,
      }}
    >
      {/* Corner markers */}
      <span
        className="absolute left-0 top-0 h-2 w-2 border-l border-t"
        style={{ borderColor: style.color }}
      />
      <span
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r"
        style={{ borderColor: style.color }}
      />

      <div className="flex items-start justify-between">
        <div
          className="flex h-7 w-7 items-center justify-center border"
          style={{
            borderColor: `${style.color}40`,
            backgroundColor: `${style.color}08`,
          }}
        >
          <Icon
            size={13}
            strokeWidth={1.3}
            style={{ color: style.color }}
          />
        </div>

        <div className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{
              backgroundColor: style.color,
              boxShadow: `0 0 7px ${style.color}`,
            }}
          />

          <span
            className="font-mono text-[6px] tracking-[0.16em]"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div className="mt-3 text-[8px] font-medium tracking-[0.12em] text-[#a9bbc2]">
        {title}
      </div>

      <div className="mt-0.5 text-[6px] uppercase tracking-[0.12em] text-[#4d626c]">
        {subtitle}
      </div>

      <div className="mt-2 font-mono text-[13px] text-[#d4e1e5]">
        {value}
      </div>
    </div>
  )
}

function Connection({ label }) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1b5664] to-transparent" />

      <span className="absolute h-1 w-1 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />

      {label && (
        <span className="absolute -top-3 whitespace-nowrap font-mono text-[5px] tracking-[0.15em] text-[#36545f]">
          {label}
        </span>
      )}
    </div>
  )
}

function InfrastructureMap() {
  const dns = useDNSState()

  const { gateway, resolvers, cache } =
    dns.infrastructure

  const attentionCount = resolvers.filter(
    (resolver) => resolver.status !== 'healthy'
  ).length

  const overallStatus =
    dns.system.status === 'critical'
      ? 'critical'
      : dns.system.status === 'degraded'
        ? 'warning'
        : 'healthy'

  const overallStyle = statusStyles[overallStatus]

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">
      {/* Futuristic grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(31,82,96,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,82,96,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.025] blur-3xl" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-[#17313b] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[7px] tracking-[0.2em] text-[#36545f]">
              SYS / 02
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[9px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              DNS INFRASTRUCTURE
            </h2>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-1 w-1 animate-pulse rounded-full"
              style={{
                backgroundColor: overallStyle.color,
                boxShadow: `0 0 6px ${overallStyle.color}`,
              }}
            />

            <span
              className="font-mono text-[6px] tracking-[0.15em]"
              style={{ color: overallStyle.color }}
            >
              {overallStyle.label}
            </span>

            <span className="text-[6px] text-[#3e555f]">
              • LIVE TELEMETRY
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[7px] text-[#526873]">
            HEALTH
          </div>

          <div
            className="font-mono text-[13px]"
            style={{ color: overallStyle.color }}
          >
            {dns.system.health.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main topology */}
      <div className="relative p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[135px_28px_minmax(0,1fr)_28px_135px] lg:items-center">
          {/* Gateway */}
          <Node
            icon={Globe2}
            title="DNS GATEWAY"
            subtitle="EDGE / INBOUND"
            value={dns.traffic?.qps !== null && dns.traffic?.qps !== undefined ? `${dns.traffic.qps.toLocaleString()} QPS` : 'N/A'}
            status={gateway.status}
          />

          <Connection label="FLOW" />

          {/* Resolver cluster */}
          <div className="relative">
            <div className="absolute left-1/2 top-[-12px] -translate-x-1/2 font-mono text-[5px] tracking-[0.2em] text-[#36545f]">
              RESOLVER CLUSTER
            </div>

            <div className="grid grid-cols-3 gap-2">
              {resolvers.map((resolver) => (
                <Node
                  key={resolver.id}
                  icon={Server}
                  title={resolver.name.replace(
                    'Resolver-',
                    'R'
                  )}
                  subtitle={resolver.qps !== null && resolver.qps !== undefined ? `${resolver.qps.toLocaleString()} QPS` : 'PROBE NODE'}
                  value={resolver.latency ? `${resolver.latency.toFixed(1)}ms` : 'N/A'}
                  status={resolver.status}
                />
              ))}
            </div>
          </div>

          <Connection label="CACHE" />

          {/* Cache */}
          <Node
            icon={Database}
            title="DNS CACHE"
            subtitle="MEMORY / EDGE"
            value={cache.hitRate !== null && cache.hitRate !== undefined ? `${cache.hitRate.toFixed(1)}%` : 'N/A'}
            status={cache.status}
          />
        </div>

        {/* Telemetry bar */}
        <div className="mt-4 grid grid-cols-2 border border-[#17313b] bg-[#080f14]/80 sm:grid-cols-4">
          <Telemetry
            label="QUERY RATE"
            value={dns.traffic?.qps !== null && dns.traffic?.qps !== undefined ? `${dns.traffic.qps.toLocaleString()} QPS` : 'N/A (PUBLIC TARGET)'}
          />

          <Telemetry
            label="AVG LATENCY"
            value={dns.performance?.latency ? `${dns.performance.latency.toFixed(1)} ms` : 'N/A'}
          />

          <Telemetry
            label="CACHE HIT"
            value={cache.hitRate !== null && cache.hitRate !== undefined ? `${cache.hitRate.toFixed(1)}%` : 'N/A (PUBLIC TARGET)'}
          />

          <Telemetry
            label="ATTENTION"
            value={`${attentionCount} NODE${attentionCount !== 1 ? 'S' : ''}`}
            warning={attentionCount > 0}
          />
        </div>

        {/* Bottom status */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={9} className="text-cyan-400" />

            <span className="font-mono text-[6px] tracking-[0.12em] text-[#526873]">
              TELEMETRY STREAM ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Zap size={8} className="text-cyan-400" />

            <span className="font-mono text-[6px] text-[#526873]">
              UPDATED 2s
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Telemetry({ label, value, warning = false }) {
  return (
    <div className="border-r border-[#17313b] px-3 py-2.5 last:border-r-0">
      <div className="font-mono text-[6px] tracking-[0.15em] text-[#465b65]">
        {label}
      </div>

      <div
        className={`mt-1 font-mono text-[10px] ${
          warning ? 'text-amber-400' : 'text-[#9fb2b9]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default InfrastructureMap