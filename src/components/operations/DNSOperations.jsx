import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Globe2,
  Radio,
  Server,
  ShieldCheck,
  Zap,
} from 'lucide-react'

import useDNSState from '../../hooks/useDNSState'

function DNSOperations() {
  const dns = useDNSState()

  const {
    health,
  } = dns.system

  const {
    qps,
  } = dns.traffic

  const {
    latency,
  } = dns.performance

  const {
    rate,
  } = dns.errors

  const {
    gateway,
    resolvers,
    cache,
  } = dns.infrastructure

  const allHealthy =
    gateway.status === 'healthy' &&
    resolvers.every(
      (resolver) => resolver.status === 'healthy'
    ) &&
    cache.status === 'healthy'

  const operationsStatus =
    allHealthy
      ? 'NOMINAL'
      : health < 70
        ? 'CRITICAL'
        : 'ATTENTION'

  const statusColor =
    operationsStatus === 'NOMINAL'
      ? '#22c55e'
      : operationsStatus === 'ATTENTION'
        ? '#f59e0b'
        : '#ef4444'

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">

      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
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

            <span className="font-mono text-[7px] tracking-[0.2em] text-[#36545f]">
              OPS / 01
            </span>

            <span className="h-3 w-px bg-[#17313b]" />

            <h2 className="text-[9px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              DNS OPERATIONS
            </h2>

          </div>

          <div className="mt-1 flex items-center gap-2">

            <span
              className="h-1 w-1 animate-pulse rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 7px ${statusColor}`,
              }}
            />

            <span
              className="font-mono text-[6px] tracking-[0.15em]"
              style={{ color: statusColor }}
            >
              {operationsStatus}
            </span>

            <span className="text-[6px] text-[#3e555f]">
              • SYSTEM OPERATIONS
            </span>

          </div>
        </div>

        <Activity
          size={15}
          strokeWidth={1}
          className="text-cyan-400"
        />

      </div>

      {/* Content */}
      <div className="relative p-4">

        {/* Top telemetry */}
        <div className="grid grid-cols-2 border border-[#17313b] md:grid-cols-4">

          <Metric
            icon={Radio}
            label="DNS TRAFFIC"
            value={`${qps.toLocaleString()} QPS`}
          />

          <Metric
            icon={Zap}
            label="LATENCY"
            value={`${latency.toFixed(1)} ms`}
          />

          <Metric
            icon={ShieldCheck}
            label="HEALTH"
            value={`${health.toFixed(1)}%`}
          />

          <Metric
            icon={Activity}
            label="ERROR RATE"
            value={`${rate.toFixed(2)}%`}
          />

        </div>

        {/* Infrastructure */}
        <div className="mt-3">

          <div className="mb-2 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Server
                size={10}
                className="text-cyan-400"
              />

              <span className="font-mono text-[7px] tracking-[0.15em] text-[#657982]">
                INFRASTRUCTURE STATUS
              </span>

            </div>

            <span className="font-mono text-[6px] text-[#40545e]">
              LIVE
            </span>

          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">

            <InfrastructureCard
              icon={Globe2}
              name="DNS GATEWAY"
              status={gateway.status}
              detail={`${gateway.qps.toLocaleString()} QPS`}
            />

            {resolvers.map((resolver) => (
              <InfrastructureCard
                key={resolver.id}
                icon={Server}
                name={resolver.name}
                status={resolver.status}
                detail={`${resolver.qps.toLocaleString()} QPS • ${resolver.latency.toFixed(1)}ms`}
              />
            ))}

            <InfrastructureCard
              icon={Database}
              name="DNS CACHE"
              status={cache.status}
              detail={`${cache.hitRate.toFixed(1)}% HIT RATE`}
            />

          </div>

        </div>

        {/* Operational event */}
        <div className="mt-3 border border-[#17313b] bg-[#080f14]">

          <div className="flex items-center justify-between border-b border-[#17313b] px-3 py-2.5">

            <div className="flex items-center gap-2">

              <Radio
                size={10}
                className="text-cyan-400"
              />

              <span className="font-mono text-[7px] tracking-[0.15em] text-[#657982]">
                CURRENT OPERATIONAL STATE
              </span>

            </div>

            <span className="font-mono text-[6px] text-[#40545e]">
              LIVE
            </span>

          </div>

          <div className="p-3">

            <div className="flex items-start gap-3">

              <div className="mt-0.5">
                {allHealthy ? (
                  <CheckCircle2
                    size={13}
                    className="text-emerald-400"
                    strokeWidth={1.3}
                  />
                ) : (
                  <ArrowUpRight
                    size={13}
                    className="text-amber-400"
                    strokeWidth={1.3}
                  />
                )}
              </div>

              <div>

                <div className="font-mono text-[8px] text-[#a9bbc2]">
                  {allHealthy
                    ? 'DNS infrastructure operating normally'
                    : 'DNS infrastructure requires attention'}
                </div>

                <p className="mt-1 max-w-2xl text-[7px] leading-4 text-[#526873]">
                  Current telemetry indicates{' '}
                  {qps.toLocaleString()} queries per
                  second with an average resolver latency
                  of {latency.toFixed(1)}ms. The current
                  infrastructure health is{' '}
                  {health.toFixed(1)}%.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border-r border-b border-[#17313b] px-3 py-3 last:border-r-0 md:border-b-0">

      <div className="flex items-center gap-2">

        <Icon
          size={9}
          className="text-cyan-400"
          strokeWidth={1.3}
        />

        <span className="font-mono text-[6px] tracking-[0.13em] text-[#465b65]">
          {label}
        </span>

      </div>

      <div className="mt-1.5 font-mono text-[10px] text-[#a9bbc2]">
        {value}
      </div>

    </div>
  )
}

function InfrastructureCard({
  icon: Icon,
  name,
  status,
  detail,
}) {
  const isHealthy = status === 'healthy'

  const statusColor = isHealthy
    ? '#22c55e'
    : status === 'warning'
      ? '#f59e0b'
      : '#ef4444'

  return (
    <div className="relative border border-[#17313b] bg-[#080f14] px-3 py-3">

      <div
        className="absolute left-0 top-0 h-full w-px"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 8px ${statusColor}`,
        }}
      />

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-2">

          <Icon
            size={11}
            className="text-[#657982]"
            strokeWidth={1.2}
          />

          <span className="font-mono text-[7px] tracking-[0.1em] text-[#82959d]">
            {name}
          </span>

        </div>

        <span
          className="font-mono text-[6px] tracking-[0.1em]"
          style={{ color: statusColor }}
        >
          {status.toUpperCase()}
        </span>

      </div>

      <div className="mt-2 font-mono text-[7px] text-[#465b65]">
        {detail}
      </div>

    </div>
  )
}

export default DNSOperations