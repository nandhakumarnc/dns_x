import {
  Globe2,
  Server,
  Database,
  Activity,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'

function InfrastructureMap() {
  const dns = useDNSState()

  const {
    gateway,
    resolvers,
    cache,
  } = dns.infrastructure

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
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
              MON / 01
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[14px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              DNS INFRASTRUCTURE MAP
            </h2>

          </div>

          <div className="mt-1 font-mono text-[11px] tracking-[0.12em] text-[#465b65]">
            REAL-TIME RESOLUTION PATH
          </div>

        </div>

        <Activity
          size={14}
          strokeWidth={1}
          className="text-cyan-400"
        />

      </div>

      {/* Network */}
      <div className="relative px-5 py-7">

        {/* Client */}
        <div className="flex justify-center">

          <Node
            icon={Globe2}
            label="DNS GATEWAY"
            status={gateway.status}
            detail={`${gateway.qps.toLocaleString()} QPS`}
          />

        </div>

        {/* Connection */}
        <div className="mx-auto h-8 w-px bg-cyan-400/30" />

        {/* Resolver line */}
        <div className="relative mx-auto max-w-3xl">

          <div className="absolute left-[16.66%] right-[16.66%] top-0 h-px bg-cyan-400/20" />

          <div className="grid grid-cols-3 gap-3">

            {resolvers.map((resolver) => (
              <div key={resolver.id} className="relative">

                <div className="mx-auto h-5 w-px bg-cyan-400/20" />

                <Node
                  icon={Server}
                  label={resolver.name}
                  status={resolver.status}
                  detail={`${resolver.qps.toLocaleString()} QPS`}
                />

              </div>
            ))}

          </div>

        </div>

        {/* Cache */}
        <div className="mx-auto mt-5 flex max-w-xs items-center justify-center">

          <div className="mr-3 h-px w-10 bg-cyan-400/20" />

          <Node
            icon={Database}
            label="DNS CACHE"
            status={cache.status}
            detail={`${cache.hitRate.toFixed(1)}% HIT`}
          />

          <div className="ml-3 h-px w-10 bg-cyan-400/20" />

        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#17313b] px-4 py-2">

        <span className="font-mono text-[11px] tracking-[0.12em] text-[#40545e]">
          TOPOLOGY: INTERNAL DNS
        </span>

        <span className="font-mono text-[11px] tracking-[0.12em] text-emerald-400">
          ● MONITORING ACTIVE
        </span>

      </div>

    </section>
  )
}

function Node({
  icon: Icon,
  label,
  status,
  detail,
}) {
  const statusColor =
    status === 'healthy'
      ? '#22c55e'
      : status === 'warning'
        ? '#f59e0b'
        : '#ef4444'

  return (
    <div className="relative min-w-[120px] border border-[#17313b] bg-[#080f14] px-3 py-3">

      <div
        className="absolute left-0 top-0 h-full w-px"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 8px ${statusColor}`,
        }}
      />

      <div className="flex items-center justify-between">

        <Icon
          size={11}
          strokeWidth={1.2}
          className="text-cyan-400"
        />

        <span
          className="font-mono text-[10px]"
          style={{ color: statusColor }}
        >
          {status.toUpperCase()}
        </span>

      </div>

      <div className="mt-2 font-mono text-[12px] tracking-[0.08em] text-[#82959d]">
        {label}
      </div>

      <div className="mt-1 font-mono text-[11px] text-[#465b65]">
        {detail}
      </div>

    </div>
  )
}

export default InfrastructureMap