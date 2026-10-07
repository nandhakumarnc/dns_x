import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Network,
  Server,
  Zap,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function MetricStrip() {
  const dns = useDNSState()

  const metrics = [
    {
      label: 'DNS HEALTH',
      value: dns.system.health.toFixed(1),
      unit: '%',
      change: '+0.8%',
      direction: 'up',
      icon: Activity,
      status:
        dns.system.health >= 95
          ? 'healthy'
          : dns.system.health >= 85
            ? 'warning'
            : 'critical',
    },
    {
      label: 'QUERY RATE',
      value: dns.traffic.qps.toLocaleString(),
      unit: 'QPS',
      change: `${dns.traffic.qps >= dns.traffic.averageQps ? '+' : '-'} current`,
      direction:
        dns.traffic.qps >= dns.traffic.averageQps
          ? 'up'
          : 'down',
      icon: Network,
      status: 'healthy',
    },
    {
      label: 'AVG LATENCY',
      value: dns.performance.latency.toFixed(1),
      unit: 'ms',
      change:
        dns.performance.latency <= 20
          ? 'NORMAL'
          : 'ELEVATED',
      direction:
        dns.performance.latency <= 20
          ? 'down'
          : 'up',
      icon: Gauge,
      status:
        dns.performance.latency <= 25
          ? 'healthy'
          : dns.performance.latency <= 50
            ? 'warning'
            : 'critical',
    },
    {
      label: 'NXDOMAIN',
      value: dns.errors.nxdomain.toFixed(2),
      unit: '%',
      change:
        dns.errors.nxdomain <= 2
          ? 'NORMAL'
          : 'ELEVATED',
      direction:
        dns.errors.nxdomain <= 2
          ? 'down'
          : 'up',
      icon: Server,
      status:
        dns.errors.nxdomain <= 2
          ? 'healthy'
          : dns.errors.nxdomain <= 4
            ? 'warning'
            : 'critical',
    },
    {
      label: 'CACHE HIT',
      value: dns.performance.cacheHit.toFixed(1),
      unit: '%',
      change:
        dns.performance.cacheHit >= 90
          ? 'OPTIMAL'
          : 'DEGRADED',
      direction:
        dns.performance.cacheHit >= 90
          ? 'up'
          : 'down',
      icon: Zap,
      status:
        dns.performance.cacheHit >= 90
          ? 'healthy'
          : dns.performance.cacheHit >= 80
            ? 'warning'
            : 'critical',
    },
  ]

  const statusColors = {
    healthy: '#00ff5e',
    warning: '#f59e0b',
    critical: '#ff0000',
  }

  return (
    <section className="grid grid-cols-2 border border-[#17313b] bg-[#080d12] sm:grid-cols-3 lg:grid-cols-5">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        const statusColor =
          statusColors[metric.status]

        return (
          <div
            key={metric.label}
            className={`group relative min-h-[94px] p-4 transition-colors hover:bg-[#0b131a] ${
              index !== metrics.length - 1
                ? 'border-r border-[#17313b]'
                : ''
            } ${
              index >= 2
                ? 'border-t border-[#17313b] sm:border-t-0'
                : ''
            }`}
          >
            {/* Status indicator */}
            <div
              className="absolute left-0 top-0 h-px w-8 transition-all group-hover:w-14"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="text-[8px] font-medium uppercase tracking-[0.16em] text-[#536873]">
                {metric.label}
              </div>

              <Icon
                size={12}
                strokeWidth={1.4}
                style={{
                  color: statusColor,
                  opacity: 0.7,
                }}
              />
            </div>

            {/* Value */}
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-mono text-[19px] font-medium tracking-[-0.03em] text-[#d5e3e8]">
                {metric.value}
              </span>

              <span className="font-mono text-[8px] text-[#536873]">
                {metric.unit}
              </span>
            </div>

            {/* State */}
            <div className="mt-1.5 flex items-center gap-1">
              {metric.direction === 'up' ? (
                <ArrowUpRight
                  size={9}
                  className={
                    metric.status === 'warning'
                      ? 'text-[#f59e0b]'
                      : metric.status === 'critical'
                        ? 'text-[#ef4444]'
                        : 'text-[#22c55e]'
                  }
                />
              ) : (
                <ArrowDownRight
                  size={9}
                  className="text-[#22c55e]"
                />
              )}

              <span
                className="font-mono text-[7px]"
                style={{
                  color:
                    metric.status === 'warning'
                      ? '#f59e0b'
                      : metric.status === 'critical'
                        ? '#ef4444'
                        : '#22c55e',
                }}
              >
                {metric.change}
              </span>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default MetricStrip