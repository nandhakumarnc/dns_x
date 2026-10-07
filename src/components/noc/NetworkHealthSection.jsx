import {
  Activity,
  Gauge,
  Network,
  Zap,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function NetworkHealthSection() {
  const dns = useDNSState()
  const canonical = getCanonicalHealth(dns)

  const isPublicTarget = dns.traffic?.isPublicDomain !== false || dns.traffic?.qps === null
  const latency = dns.performance?.latency !== null && dns.performance?.latency !== undefined ? Number(dns.performance.latency) : null
  const errorRate = dns.errors?.rate !== null && dns.errors?.rate !== undefined ? Number(dns.errors.rate) : null

  const metrics = [
    {
      label: 'TARGET HEALTH',
      value: canonical.status === 'NOT_FOUND'
        ? 'NOT FOUND'
        : canonical.healthPercent !== null && canonical.healthPercent !== undefined
          ? `${canonical.healthPercent.toFixed(1)}%`
          : 'UNKNOWN',
      unit: '',
      change: canonical.targetLabel ? `TARGET: ${canonical.targetLabel}` : canonical.label,
      direction: canonical.status === 'HEALTHY' || canonical.status === 'NOT_FOUND' ? 'up' : 'down',
      icon: Activity,
      status: canonical.status === 'HEALTHY' ? 'healthy' : canonical.status === 'NOT_FOUND' ? 'info' : canonical.status === 'DEGRADED' ? 'warning' : 'critical',
    },
    {
      label: 'DNS QPS',
      value: isPublicTarget ? 'N/A' : (dns.traffic?.qps ? Number(dns.traffic.qps).toLocaleString() : 'N/A'),
      unit: isPublicTarget ? '' : 'QPS',
      change: isPublicTarget ? 'PUBLIC TARGET' : 'COLLECTOR AGENT',
      direction: 'down',
      icon: Network,
      status: 'healthy',
      subnote: isPublicTarget ? 'DNS QPS = N/A (PUBLIC TARGET)' : null,
    },
    {
      label: 'RESPONSE LATENCY',
      value: latency !== null ? latency.toFixed(1) : 'CALIBRATING',
      unit: latency !== null ? 'ms' : '',
      change: latency === null ? 'MEASURING...' : 'MEDIAN RTT',
      direction: latency !== null && latency <= 150 ? 'down' : 'up',
      icon: Gauge,
      status: latency === null ? 'healthy' : latency <= 200 ? 'healthy' : 'warning',
    },
    {
      label: 'RESOLUTION FAILURE RATE',
      value: errorRate !== null ? `${errorRate.toFixed(2)}%` : 'CALIBRATING',
      unit: '',
      change: errorRate === null ? 'MEASURING...' : errorRate === 0 ? '0 FAILURES' : `${dns.errors?.dominant || 'ERROR'} FAILURES`,
      direction: errorRate !== null && errorRate <= 2.5 ? 'down' : 'up',
      icon: Zap,
      status: errorRate === null || errorRate <= 3 ? 'healthy' : errorRate <= 6 ? 'warning' : 'critical',
      subnote: 'Excludes expected NXDOMAIN',
    },
  ]

  const statusColors = {
    healthy: '#22c55e',
    info: '#38bdf8',
    warning: '#f59e0b',
    critical: '#ef4444',
  }

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const statusColor = statusColors[metric.status]

        return (
          <div
            key={metric.label}
            className="glass-card glass-card-interactive relative flex flex-col justify-between p-4 rounded-2xl min-h-[110px]"
          >
            {/* Top specular glow line */}
            <div
              className="absolute left-4 top-0 h-[2px] w-12 rounded-full transition-all duration-300"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 12px ${statusColor}`,
              }}
            />

            {/* Header: Icon badge & status */}
            <div className="flex items-center justify-between">
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
              >
                <Icon
                  size={15}
                  strokeWidth={1.8}
                  style={{ color: statusColor }}
                />
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[8px] text-[#8fa6b0]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                <span>{metric.change}</span>
              </div>
            </div>

            {/* Metric Value & Label */}
            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[22px] font-semibold tracking-tight text-white">
                  {metric.value}
                </span>
                {metric.unit && (
                  <span className="font-mono text-[10px] text-[#8fa6b0]">
                    {metric.unit}
                  </span>
                )}
              </div>

              <div className="mt-0.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-[#8fa6b0]">
                <span>{metric.label}</span>
                {metric.subnote && (
                  <span className="text-[7.5px] text-[#5e7784] normal-case hidden sm:inline">{metric.subnote}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}

export default NetworkHealthSection
