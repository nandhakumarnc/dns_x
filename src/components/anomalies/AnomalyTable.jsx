import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Network,
  ShieldAlert,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function AnomalyTable() {
  const dns = useDNSState()

  const { qps } = dns.traffic
  const { latency } = dns.performance
  const { rate, dominant, trend } = dns.errors
  const { resolvers } = dns.infrastructure
  const signals = dns.signals || []

  const primaryResolver = resolvers[1] || resolvers[0]

  // If real detected signals exist from backend / WebSocket, map them
  let anomalies = []

  if (signals.length > 0) {
    anomalies = signals.slice(0, 10).map((sig) => {
      const zScore = Math.abs(sig.z_score ?? 2.5)
      const score = Math.min(100, Math.round(zScore * 25))
      const timeStr = sig.ts ? new Date(sig.ts).toLocaleTimeString() : 'RECENT'
      const type = classifySignalType(sig.type)
      const Icon = type === 'INFRASTRUCTURE' ? Clock3 : type === 'NETWORK' ? Network : type === 'OPERATIONAL' ? ShieldAlert : Activity
      const displayId = sig.id ? (sig.id.length > 8 ? sig.id.slice(0, 8).toUpperCase() : sig.id) : 'SIG-001'

      return {
        id: displayId,
        time: timeStr,
        source: sig.resolver_id || 'RESOLVER-02',
        signal: (sig.type || 'DEVIATION').toUpperCase(),
        value: sig.value !== undefined ? formatSigValue(sig) : `z=${zScore.toFixed(2)}`,
        score,
        type,
        status: score >= 70 ? 'CRITICAL' : score >= 40 ? 'WATCH' : 'NORMAL',
        icon: Icon,
      }
    })
  }

  // Fallback to computed telemetry deviations if no discrete signals yet
  if (anomalies.length === 0) {
    anomalies = [
      {
        id: 'ANM-001',
        time: 'NOW',
        source: primaryResolver?.name || 'RESOLVER-02',
        signal: 'LATENCY',
        value: `${latency.toFixed(1)} ms`,
        score: calculateScore(latency, 20),
        type: 'INFRASTRUCTURE',
        status: latency > 50 ? 'CRITICAL' : latency > 30 ? 'WATCH' : 'NORMAL',
        icon: Clock3,
      },
      {
        id: 'ANM-002',
        time: 'NOW',
        source: 'DNS GATEWAY',
        signal: 'QUERY RATE',
        value: `${qps.toLocaleString()} QPS`,
        score: calculateScore(qps, 1000),
        type: 'NETWORK',
        status: qps > 1500 ? 'WATCH' : 'NORMAL',
        icon: Network,
      },
      {
        id: 'ANM-003',
        time: 'NOW',
        source: primaryResolver?.name || 'RESOLVER-02',
        signal: dominant,
        value: `${rate.toFixed(2)}%`,
        score: Math.min(100, Math.round(rate * 10)),
        type: classifyError(dominant),
        status: rate > 5 ? 'CRITICAL' : rate > 3 ? 'WATCH' : 'NORMAL',
        icon: ShieldAlert,
      },
      {
        id: 'ANM-004',
        time: 'NOW',
        source: 'DNS TELEMETRY',
        signal: 'ERROR TREND',
        value: trend.toUpperCase(),
        score: trend === 'rising' ? 62 : 18,
        type: 'BEHAVIOURAL',
        status: trend === 'rising' ? 'WATCH' : 'NORMAL',
        icon: Activity,
      },
    ]
  }

  return (
    <section className="relative overflow-hidden border border-[#17313b] bg-[#060b10]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#17313b] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#36545f]">
              ANM / 02
            </span>
            <span className="h-3 w-px bg-[#17313b]" />
            <h2 className="text-[12px] font-semibold tracking-[0.18em] text-[#c8d7dc]">
              DETECTED ANOMALIES & SIGNALS
            </h2>
          </div>
          <div className="mt-1 font-mono text-[9px] tracking-[0.12em] text-[#465b65]">
            Z-SCORE BEHAVIOURAL DEVIATIONS AGAINST ROLLING BASELINES
          </div>
        </div>

        <BrainCircuit
          size={14}
          strokeWidth={1}
          className="text-cyan-400"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#17313b]">
              <Header>ID / TIME</Header>
              <Header>SOURCE</Header>
              <Header>SIGNAL METRIC</Header>
              <Header>OBSERVED VALUE</Header>
              <Header>ANOMALY SCORE</Header>
              <Header>CLASSIFICATION</Header>
              <Header>STATUS</Header>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((anomaly) => (
              <AnomalyRow
                key={anomaly.id}
                anomaly={anomaly}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="divide-y divide-[#17313b] lg:hidden">
        {anomalies.map((anomaly) => (
          <MobileAnomaly
            key={anomaly.id}
            anomaly={anomaly}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#17313b] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1 w-1 animate-pulse rounded-full bg-cyan-400" />
          <span className="font-mono text-[9px] tracking-[0.12em] text-[#40545e]">
            {dns.connection?.mode === 'live' ? 'REALTIME Z-SCORE DETECTION' : 'SYNTHETIC SIGNAL SIMULATION'}
          </span>
        </div>

        <span className="font-mono text-[9px] text-[#40545e]">
          {anomalies.length} ACTIVE SIGNALS
        </span>
      </div>
    </section>
  )
}

function Header({ children }) {
  return (
    <th className="px-3 py-2 text-left font-mono text-[9px] font-normal tracking-[0.13em] text-[#40545e]">
      {children}
    </th>
  )
}

function AnomalyRow({ anomaly }) {
  const Icon = anomaly.icon
  const scoreColor =
    anomaly.score >= 70
      ? '#ef4444'
      : anomaly.score >= 40
        ? '#f59e0b'
        : '#22c55e'

  return (
    <tr className="border-b border-[#10242c] transition-colors hover:bg-[#08151b]">
      <td className="px-3 py-3 font-mono text-[9px]">
        <div className="text-cyan-400">{anomaly.id}</div>
        <div className="text-[#526873]">{anomaly.time}</div>
      </td>

      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Icon
            size={9}
            strokeWidth={1.2}
            className="text-cyan-400"
          />
          <span className="font-mono text-[10px] text-[#82959d]">
            {anomaly.source}
          </span>
        </div>
      </td>

      <td className="px-3 py-3 font-mono text-[9px] text-[#657982]">
        {anomaly.signal}
      </td>

      <td className="px-3 py-3 font-mono text-[10px] text-[#a9bbc2]">
        {anomaly.value}
      </td>

      <td className="px-3 py-3">
        <span
          className="font-mono text-[10px] font-semibold"
          style={{ color: scoreColor }}
        >
          {anomaly.score}
        </span>
      </td>

      <td className="px-3 py-3">
        <span className="border border-[#17313b] px-2 py-1 font-mono text-[9px] tracking-[0.08em] text-[#657982]">
          {anomaly.type}
        </span>
      </td>

      <td className="px-3 py-3">
        <Status status={anomaly.status} />
      </td>
    </tr>
  )
}

function MobileAnomaly({ anomaly }) {
  const Icon = anomaly.icon
  const scoreColor =
    anomaly.score >= 70
      ? '#ef4444'
      : anomaly.score >= 40
        ? '#f59e0b'
        : '#22c55e'

  return (
    <div className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center border border-[#17313b] bg-[#081218]">
            <Icon
              size={11}
              className="text-cyan-400"
              strokeWidth={1.2}
            />
          </div>

          <div>
            <div className="font-mono text-[10px] text-[#9fb2b9]">
              {anomaly.source}
            </div>
            <div className="mt-1 font-mono text-[9px] text-[#40545e]">
              {anomaly.signal}
            </div>
          </div>
        </div>

        <Status status={anomaly.status} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MobileValue label="VALUE" value={anomaly.value} />
        <MobileValue label="SCORE" value={anomaly.score} style={{ color: scoreColor }} />
        <MobileValue label="TYPE" value={anomaly.type} />
      </div>
    </div>
  )
}

function MobileValue({ label, value, style }) {
  return (
    <div className="border border-[#17313b] bg-[#080f14] p-2">
      <div className="font-mono text-[9px] text-[#40545e]">{label}</div>
      <div className="mt-1 truncate font-mono text-[9px] text-[#82959d]" style={style}>
        {value}
      </div>
    </div>
  )
}

function Status({ status }) {
  const isNormal = status === 'NORMAL'
  const isWatch = status === 'WATCH'

  const color = isNormal
    ? '#22c55e'
    : isWatch
      ? '#f59e0b'
      : '#ef4444'

  const Icon = isNormal
    ? CheckCircle2
    : isWatch
      ? AlertTriangle
      : ShieldAlert

  return (
    <div className="flex items-center gap-1.5">
      <Icon
        size={8}
        strokeWidth={1.2}
        style={{ color }}
      />
      <span className="font-mono text-[8px]" style={{ color }}>
        {status}
      </span>
    </div>
  )
}

function calculateScore(value, baseline) {
  if (!baseline) return 0
  return Math.min(
    100,
    Math.max(
      5,
      Math.round((Math.abs(value - baseline) / baseline) * 100)
    )
  )
}

function classifyError(error) {
  const value = error?.toUpperCase() || ''
  if (value.includes('NXDOMAIN') || value.includes('SERVFAIL')) return 'OPERATIONAL'
  if (value.includes('TIMEOUT') || value.includes('REFUSED')) return 'NETWORK'
  return 'UNKNOWN'
}

function classifySignalType(type = '') {
  const t = type.toLowerCase()
  if (t.includes('latency') || t.includes('timeout')) return 'INFRASTRUCTURE'
  if (t.includes('qps') || t.includes('surge') || t.includes('drop')) return 'NETWORK'
  if (t.includes('nxdomain') || t.includes('servfail') || t.includes('error')) return 'OPERATIONAL'
  return 'BEHAVIOURAL'
}

function formatSigValue(sig) {
  if (sig.value !== undefined) {
    if (sig.type?.includes('latency')) return `${Number(sig.value).toFixed(1)} ms`
    if (sig.type?.includes('qps')) return `${Math.round(sig.value).toLocaleString()} QPS`
    if (sig.type?.includes('error') || sig.type?.includes('nxdomain') || sig.type?.includes('servfail')) {
      return `${(Number(sig.value) * 100).toFixed(2)}%`
    }
  }
  return `z=${sig.z_score ? Number(sig.z_score).toFixed(2) : '2.5'}`
}

export default AnomalyTable