import { AlertTriangle, Clock3, ServerCrash, XCircle } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getCanonicalHealth } from '../../utils/canonicalHealth'

const errorConfig = {
  NXDOMAIN: {
    icon: XCircle,
    color: '#f59e0b',
  },
  SERVFAIL: {
    icon: ServerCrash,
    color: '#ef4444',
  },
  TIMEOUT: {
    icon: Clock3,
    color: '#a78bfa',
  },
}

function ErrorRateChart() {
  const dns = useDNSState()
  const canonical = getCanonicalHealth(dns)
  const errors = dns?.errors ?? {}

  const resolutionFailureRate =
    errors.resolutionFailureRate !== null && errors.resolutionFailureRate !== undefined
      ? Number(errors.resolutionFailureRate)
      : canonical.status === 'NOT_FOUND'
        ? 0.0
        : errors.rate !== null && errors.rate !== undefined
          ? Number(errors.rate)
          : null

  const nxDomainRate =
    errors.nxDomainRate !== null && errors.nxDomainRate !== undefined
      ? Number(errors.nxDomainRate)
      : canonical.status === 'NOT_FOUND'
        ? 100.0
        : 0.0

  const servfailRate =
    errors.servfailRate !== null && errors.servfailRate !== undefined
      ? Number(errors.servfailRate)
      : 0.0

  const timeoutRate =
    errors.timeoutRate !== null && errors.timeoutRate !== undefined
      ? Number(errors.timeoutRate)
      : 0.0

  const dominant = errors.dominant ?? 'NONE'
  const isNotFound = canonical.status === 'NOT_FOUND' || dominant === 'NXDOMAIN'

  const totalErrors =
    (errors.nxdomain ?? 0) +
    (errors.servfail ?? 0) +
    (errors.timeout ?? 0)

  const severity =
    resolutionFailureRate === null
      ? 'CALIBRATING'
      : isNotFound
        ? 'NOT FOUND'
        : canonical.status === 'CRITICAL' || resolutionFailureRate >= 25 || dominant === 'SERVFAIL'
          ? 'CRITICAL'
          : canonical.status === 'DEGRADED' || resolutionFailureRate > 5
            ? 'ELEVATED'
            : 'NORMAL'

  const severityColor =
    severity === 'CALIBRATING'
      ? '#71717a'
      : severity === 'NOT FOUND'
        ? '#38bdf8'
        : severity === 'CRITICAL'
          ? '#ef4444'
          : severity === 'ELEVATED'
            ? '#f59e0b'
            : '#22c55e'

  const errorTypes = [
    {
      key: 'NXDOMAIN',
      rate: nxDomainRate,
      value: Number(errors.nxdomain ?? 0),
      note: 'NAME NOT FOUND',
      color: '#38bdf8',
    },
    {
      key: 'SERVFAIL',
      rate: servfailRate,
      value: Number(errors.servfail ?? 0),
      note: 'SERVER FAILURE',
      color: '#ef4444',
    },
    {
      key: 'TIMEOUT',
      rate: timeoutRate,
      value: Number(errors.timeout ?? 0),
      note: 'NO RESPONSE',
      color: '#a78bfa',
    },
  ]

  return (
    <section className="relative overflow-hidden glass-card rounded-2xl">
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
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
              ERR / 01
            </span>

            <span className="h-3 w-px bg-white/[0.12]" />

            <h2 className="text-[10px] font-semibold tracking-[0.18em] text-[#d5e4ea]">
              DNS ERROR & RESOLUTION SEMANTICS
            </h2>
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span
              className="h-1 w-1 animate-pulse rounded-full"
              style={{
                backgroundColor: severityColor,
                boxShadow: `0 0 7px ${severityColor}`,
              }}
            />

            <span
              className="font-mono text-[9px] font-semibold tracking-[0.12em]"
              style={{ color: severityColor }}
            >
              {severity}
            </span>

            <span className="font-mono text-[9px] text-[#4b606c]">
              · {isNotFound ? 'EXPECTED NON-EXISTENT DOMAIN (RFC 1035)' : 'LIVE RESOLVER OBSERVATION'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[9px] tracking-[0.15em] text-[#526873]">
            RESOLUTION FAILURE RATE
          </div>

          <div
            className="font-mono text-[15px]"
            style={{ color: severityColor }}
          >
            {resolutionFailureRate !== null ? `${resolutionFailureRate.toFixed(2)}%` : 'CALIBRATING'}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="relative p-4">
        {/* Error rate indicator */}
        <div className="mb-4 border border-[#17313b] bg-[#080f14] p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={12}
                style={{ color: severityColor }}
                strokeWidth={1.4}
              />

              <span className="font-mono text-[10px] tracking-[0.12em] text-[#82959d]">
                INFRASTRUCTURE FAILURE INDEX (EXCLUDES BENIGN NXDOMAIN)
              </span>
            </div>

            <span className="font-mono text-[10px] text-[#526873]">
              {totalErrors.toLocaleString()} TOTAL RCODE EVENTS
            </span>
          </div>

          {/* Progress */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-white/[0.08] bg-black/40 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min((resolutionFailureRate ?? 0) * 8, 100)}%`,
                backgroundColor: severityColor,
                boxShadow: `0 0 10px ${severityColor}`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-between font-mono text-[9px] text-[#4f6874]">
            <span>0% (NOMINAL)</span>
            <span>5% (DEGRADED)</span>
            <span>25%+ (CRITICAL)</span>
          </div>
        </div>

        {/* Error types */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {errorTypes.map(({ key, rate, value, note, color }) => {
            const config = errorConfig[key] || {}
            const Icon = config.icon || AlertTriangle

            return (
              <div
                key={key}
                className="glass-card relative rounded-xl border border-white/[0.06] p-3.5 transition hover:bg-white/[0.04]"
              >
                <div
                  className="absolute left-0 top-3 h-6 w-1 rounded-r-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}`,
                  }}
                />

                <div className="flex items-center justify-between">
                  <Icon
                    size={12}
                    style={{ color }}
                    strokeWidth={1.3}
                  />

                  <span className="font-mono text-[9px] text-[#556d7a]">
                    {note}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-mono text-[10px] tracking-[0.15em] text-[#7893a0]">
                    {key}
                  </span>
                  <span className="font-mono text-[11px] font-semibold" style={{ color }}>
                    {rate.toFixed(1)}%
                  </span>
                </div>

                <div
                  className="mt-1 font-mono text-[18px]"
                  style={{ color }}
                >
                  {value.toLocaleString()}
                </div>

                <div className="mt-1 text-[9px] uppercase tracking-wider text-[#4f6773]">
                  observed responses
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom telemetry */}
        <div className="mt-3.5 grid grid-cols-2 rounded-xl border border-white/[0.08] bg-white/[0.015] sm:grid-cols-4">
          <Telemetry
            label="RES. FAILURE RATE"
            value={resolutionFailureRate !== null ? `${resolutionFailureRate.toFixed(2)}%` : 'CALIBRATING'}
            warning={resolutionFailureRate > 5}
          />

          <Telemetry
            label="NXDOMAIN RATE"
            value={`${nxDomainRate.toFixed(2)}%`}
          />

          <Telemetry
            label="SERVFAIL RATE"
            value={`${servfailRate.toFixed(2)}%`}
            warning={servfailRate > 0}
          />

          <Telemetry
            label="TIMEOUT RATE"
            value={`${timeoutRate.toFixed(2)}%`}
            warning={timeoutRate > 0}
          />
        </div>
      </div>
    </section>
  )
}

function Telemetry({
  label,
  value,
  warning = false,
}) {
  return (
    <div className="border-r border-white/[0.08] px-3.5 py-2.5 last:border-r-0">
      <div className="font-mono text-[9px] tracking-[0.14em] text-[#657f8d]">
        {label}
      </div>

      <div
        className={`mt-1 font-mono text-[12px] font-medium ${
          warning ? 'text-amber-400' : 'text-[#b8cbd4]'
        }`}
      >
        {value}
      </div>
    </div>
  )
}

export default ErrorRateChart