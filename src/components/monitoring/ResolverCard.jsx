import {
  Activity,
  Clock3,
  Database,
  Server,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

function ResolverCard({ resolver }) {
  const {
    name,
    status,
    qps,
    latency,
  } = resolver

  const statusColor =
    status === 'healthy'
      ? '#22c55e'
      : status === 'warning'
        ? '#f59e0b'
        : '#ef4444'

  const statusLabel =
    status === 'healthy'
      ? 'HEALTHY'
      : status === 'warning'
        ? 'WARNING'
        : 'CRITICAL'

  const loadLevel =
    qps > 500
      ? 'HIGH'
      : qps > 350
        ? 'MODERATE'
        : 'NORMAL'

  return (
    <article className="relative overflow-hidden border border-[#17313b] bg-[#080f14]">

      {/* Status indicator */}
      <div
        className="absolute left-0 top-0 h-full w-[2px]"
        style={{
          backgroundColor: statusColor,
          boxShadow: `0 0 12px ${statusColor}`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#17313b] px-3 py-3">

        <div className="flex items-center gap-2">

          <div className="flex h-7 w-7 items-center justify-center border border-[#17313b] bg-[#0b151b]">
            <Server
              size={12}
              strokeWidth={1.2}
              className="text-cyan-400"
            />
          </div>

          <div>
            <div className="font-mono text-[10px] tracking-[0.1em] text-[#a9bbc2]">
              {name}
            </div>

            <div className="mt-0.5 font-mono text-[8px] tracking-[0.12em] text-[#40545e]">
              DNS RECURSIVE RESOLVER
            </div>
          </div>

        </div>

        <div className="flex items-center gap-1.5">

          <span
            className="h-1 w-1 rounded-full"
            style={{
              backgroundColor: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
            }}
          />

          <span
            className="font-mono text-[8px] tracking-[0.1em]"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </span>

        </div>

      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2">

        <Metric
          icon={Activity}
          label="QUERY RATE"
          value={`${qps.toLocaleString()} QPS`}
        />

        <Metric
          icon={Clock3}
          label="LATENCY"
          value={`${latency.toFixed(1)} ms`}
        />

        <Metric
          icon={TrendingUp}
          label="LOAD"
          value={loadLevel}
        />

        <Metric
          icon={ShieldCheck}
          label="AVAILABILITY"
          value={
            status === 'healthy'
              ? '99.99%'
              : status === 'warning'
                ? '99.2%'
                : '97.4%'
          }
        />

      </div>

      {/* Activity indicator */}
      <div className="border-t border-[#17313b] px-3 py-3">

        <div className="mb-2 flex items-center justify-between">

          <span className="font-mono text-[8px] tracking-[0.12em] text-[#465b65]">
            RESOLVER LOAD
          </span>

          <span className="font-mono text-[8px] text-[#40545e]">
            {loadLevel}
          </span>

        </div>

        <div className="flex h-6 items-end gap-[2px]">
          {Array.isArray(resolver.history) && resolver.history.length > 0 ? (
            resolver.history.slice(-32).map((sample, index) => {
              const maxVal = Math.max(...resolver.history, 1)
              const height = Math.min(100, Math.max(15, (sample / maxVal) * 100))
              return (
                <div
                  key={index}
                  className="flex-1 transition-all duration-300"
                  style={{
                    height: `${height}%`,
                    backgroundColor: statusColor,
                    opacity: 0.35 + (index / 32) * 0.65,
                  }}
                  title={`${sample} ms`}
                />
              )
            })
          ) : (
            <div className="flex h-full w-full items-center justify-center font-mono text-[8px] text-[#40545e]">
              HISTORICAL TELEMETRY RECORDING
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#17313b] px-3 py-2">

        <div className="flex items-center gap-1.5">

          <Database
            size={8}
            className="text-[#465b65]"
          />

          <span className="font-mono text-[8px] tracking-[0.1em] text-[#40545e]">
            RESOLUTION ENGINE
          </span>

        </div>

        <span className="font-mono text-[8px] text-[#40545e]">
          LIVE
        </span>

      </div>

    </article>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="border-r border-b border-[#17313b] px-3 py-3 last:border-r-0">

      <div className="flex items-center gap-1.5">

        <Icon
          size={8}
          strokeWidth={1.2}
          className="text-cyan-400"
        />

        <span className="font-mono text-[8px] tracking-[0.12em] text-[#465b65]">
          {label}
        </span>

      </div>

      <div className="mt-1 font-mono text-[11px] text-[#9fb2b9]">
        {value}
      </div>

    </div>
  )
}

export default ResolverCard