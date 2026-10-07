import {
  Activity,
  Radio,
  Clock3,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo } from 'react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

function DNSActivityChart() {
  const dns = useDNSState()
  const canonical = getCanonicalHealth(dns)
  const rawHistory = dns.measurementHistory
  const probeRate = dns.traffic?.probeRate ?? 4
  const isPublicTarget = dns.traffic?.isPublicDomain !== false || dns.traffic?.qps === null

  // Build chartData strictly from real accumulated samples
  const chartData = useMemo(() => {
    if (!rawHistory || rawHistory.length === 0) return []

    return rawHistory.map((item) => ({
      time: item.timeStr || '--:--',
      probes: item.vantagePoints?.length || probeRate,
      latency: item.latency || 0,
    }))
  }, [rawHistory, probeRate])

  const latestLatency = dns.performance?.latency ?? 0
  const sampleCount = rawHistory?.length || 0

  const trafficStatus =
    canonical.status === 'CRITICAL'
      ? 'CRITICAL'
      : canonical.status === 'DEGRADED' || canonical.status === 'WARNING'
        ? 'DEGRADED'
        : 'NORMAL'

  const statusColor =
    trafficStatus === 'CRITICAL'
      ? '#ef4444'
      : trafficStatus === 'DEGRADED'
        ? '#f59e0b'
        : '#22c55e'

  return (
    <section className="relative overflow-hidden glass-card rounded-2xl">
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(31,82,96,0.22) 1px, transparent 1px),
            linear-gradient(90deg, rgba(31,82,96,0.22) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
              NET / 01
            </span>

            <span className="h-3 w-px bg-white/[0.12]" />

            <h2 className="text-[12px] font-semibold tracking-[0.18em] text-[#d5e4ea]">
              DNS PROBE ACTIVITY
            </h2>
          </div>

          <div className="mt-1 flex items-center gap-2 font-mono text-[9px]">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 0 7px ${statusColor}`,
              }}
            />

            <span
              className="font-semibold tracking-[0.12em]"
              style={{ color: statusColor }}
            >
              {trafficStatus}
            </span>

            <span className="text-[#4b606c]">
              · {isPublicTarget ? 'REAL-TIME PROBE SAMPLING' : 'LIVE STREAM'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Radio
            size={10}
            className="animate-pulse text-cyan-400"
          />

          <span className="font-mono text-[9px] tracking-[0.12em] text-[#526873]">
            {isPublicTarget ? 'SOURCE: PUBLIC VANTAGE PROBES' : 'REAL-TIME'}
          </span>
        </div>
      </div>

      {/* Main chart */}
      <div className="relative h-[220px] px-2 pb-2 pt-4">
        {chartData.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center font-mono text-[11px] text-[#556e7b]">
            <Activity className="mb-2 animate-pulse text-cyan-400" size={20} />
            <div>COLLECTING BASELINE TELEMETRY...</div>
            <div className="mt-1 text-[9px] text-[#3d535f]">
              Sample {sampleCount} of 5 required for statistical baseline
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 8,
                right: 8,
                left: -20,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="dnsActivityFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22d3ee"
                    stopOpacity={0.22}
                  />

                  <stop
                    offset="100%"
                    stopColor="#22d3ee"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
                tick={{
                  fill: '#425862',
                  fontSize: 7,
                  fontFamily: 'monospace',
                }}
                axisLine={{
                  stroke: '#17313b',
                }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: '#425862',
                  fontSize: 7,
                  fontFamily: 'monospace',
                }}
                axisLine={false}
                tickLine={false}
                width={35}
              />

              <Tooltip
                contentStyle={{
                  background: 'rgba(7, 13, 20, 0.90)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                }}
                labelStyle={{
                  color: '#7e9aa8',
                }}
                itemStyle={{
                  color: '#22d3ee',
                }}
                formatter={(value) => [
                  `${value} ${isPublicTarget ? 'Probes' : 'QPS'}`,
                  isPublicTarget ? 'Probe Count' : 'Traffic',
                ]}
              />

              <Area
                type="monotone"
                dataKey="probes"
                stroke="#22d3ee"
                strokeWidth={1.5}
                fill="url(#dnsActivityFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Current value overlay */}
        <div className="pointer-events-none absolute right-5 top-4">
          <div className="text-right">
            <div className="font-mono text-[9px] tracking-[0.15em] text-[#6b8592]">
              {isPublicTarget ? 'OBSERVATION RATE' : 'CURRENT QPS'}
            </div>

            <div className="mt-0.5 font-mono text-[18px] font-medium text-[#d5e4ea]">
              {isPublicTarget ? `${probeRate} PROBES/CYCLE` : (dns.traffic?.qps ? `${dns.traffic.qps} QPS` : 'N/A')}
            </div>

            <div className="font-mono text-[8px] text-[#556d7a]">
              {isPublicTarget ? 'PROBE ACTIVITY' : 'QUERIES / SEC'}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Footer */}
      <div className="grid grid-cols-3 border-t border-white/[0.08] bg-white/[0.015]">
        <Telemetry
          icon={Activity}
          label="ACTIVE PROBES"
          value={`${probeRate} NODES`}
        />

        <Telemetry
          icon={Clock3}
          label="ROUND-TRIP"
          value={latestLatency ? `${latestLatency.toFixed(1)} ms` : 'CALIBRATING'}
        />

        <Telemetry
          icon={Radio}
          label={isPublicTarget ? 'DNS QPS' : 'GLOBAL QPS'}
          value={isPublicTarget ? 'N/A (PUBLIC TARGET)' : `${dns.traffic?.qps || 0} QPS`}
        />
      </div>
    </section>
  )
}

function Telemetry({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center gap-2 border-r border-white/[0.08] px-3.5 py-2.5 last:border-r-0">
      <Icon
        size={10}
        className="text-cyan-400"
        strokeWidth={1.3}
      />

      <div>
        <div className="font-mono text-[9px] tracking-[0.14em] text-[#657f8d]">
          {label}
        </div>

        <div className="mt-0.5 font-mono text-[11px] text-[#b8cbd4]">
          {value}
        </div>
      </div>
    </div>
  )
}

export default DNSActivityChart