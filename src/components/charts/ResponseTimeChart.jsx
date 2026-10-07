import { Clock3, TrendingUp, Gauge } from 'lucide-react'
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

function ResponseTimeChart() {
  const dns = useDNSState()
  const canonical = getCanonicalHealth(dns)
  const history = dns.measurementHistory

  // Derive chart points exclusively from real accumulated measurements
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []

    return history.map((item) => ({
      time: item.timeStr || '--:--',
      latency: Number(item.latency?.toFixed(1) || 0),
    }))
  }, [history])

  const latency = Number(dns.performance?.latency ?? 0)
  const p95 = Number(dns.performance?.p95 ?? latency)
  const sampleCount = history.length

  const hasHighLatencySignal = (dns.signals || []).some(s => s.type === 'HIGH_LATENCY')
  const latencyStatus =
    canonical.status === 'CRITICAL'
      ? 'CRITICAL'
      : (canonical.status === 'DEGRADED' || hasHighLatencySignal)
        ? 'ELEVATED'
        : 'NORMAL'

  const statusColor =
    latencyStatus === 'CRITICAL'
      ? '#ef4444'
      : latencyStatus === 'ELEVATED'
        ? '#f59e0b'
        : '#22c55e'

  return (
    <section className="relative overflow-hidden glass-card rounded-2xl">
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

      <div className="relative flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
              LAT / 01
            </span>
            <span className="h-3 w-px bg-white/[0.12]" />
            <h2 className="text-[12px] font-semibold tracking-[0.18em] text-[#d5e4ea]">
              RESPONSE LATENCY
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
            <span className="font-semibold tracking-[0.12em]" style={{ color: statusColor }}>
              {latencyStatus}
            </span>
            <span className="text-[#4b606c]">· REAL MEASUREMENTS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock3 size={10} className="text-cyan-400" />
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#6b8592]">
            VANTAGE PROBES
          </span>
        </div>
      </div>

      <div className="relative h-[220px] px-2 pb-2 pt-4">
        {chartData.length < 2 ? (
          <div className="flex h-full flex-col items-center justify-center font-mono text-[11px] text-[#6b8592]">
            <Gauge className="mb-2 animate-pulse text-cyan-400" size={20} />
            <div>COLLECTING BASELINE TELEMETRY...</div>
            <div className="mt-1 text-[9px] text-[#4a6370]">
              Accumulating sample {sampleCount} of 5 for rolling statistics
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient id="responseTimeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="time"
                tick={{ fill: '#425862', fontSize: 7, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
                tickLine={false}
              />

              <YAxis
                tick={{ fill: '#425862', fontSize: 7, fontFamily: 'monospace' }}
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
                labelStyle={{ color: '#7e9aa8' }}
                itemStyle={{ color: '#67e8f9' }}
                formatter={(value) => [`${Number(value).toFixed(1)} ms`, 'LATENCY']}
              />

              <Area
                type="monotone"
                dataKey="latency"
                stroke="#67e8f9"
                strokeWidth={2}
                fill="url(#responseTimeFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="relative flex items-center justify-between border-t border-white/[0.08] bg-white/[0.015] px-4 py-3 font-mono text-[9px] text-[#657f8d]">
        <div className="flex items-center gap-2">
          <TrendingUp size={10} className="text-emerald-400" />
          <span>REAL AVG: <strong className="text-[#d5e4ea]">{latency ? `${latency.toFixed(1)} ms` : 'CALIBRATING'}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>P95: <strong className="text-[#d5e4ea]">{p95 ? `${p95.toFixed(1)} ms` : 'CALIBRATING'}</strong></span>
          <span className="hidden sm:inline text-[#4a6370]">· SOURCE: RECURSIVE PROBES (1.1.1.1, 8.8.8.8, 9.9.9.9, 208.67.222.222)</span>
        </div>
      </div>
    </section>
  )
}

export default ResponseTimeChart
