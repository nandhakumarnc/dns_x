import {
  Activity,
  Network,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function ThreatProbability() {
  const dns = useDNSState()
  const ai = dns.ai || {}

  const isCalibrating = ai.baseline === 'CALIBRATING' || (dns.measurementHistory && dns.measurementHistory.length < 5) || ai.confidence === null

  // Derive probabilities strictly from live model output or empirical telemetry signals
  let opVal = 0
  let netVal = 0
  let secVal = 0
  let unkVal = 0

  if (!isCalibrating) {
    if (ai.operationalProb !== undefined && ai.networkProb !== undefined && ai.securityProb !== undefined) {
      opVal = Math.round(ai.operationalProb * 100)
      netVal = Math.round(ai.networkProb * 100)
      secVal = Math.round(ai.securityProb * 100)
      unkVal = Math.max(0, 100 - (opVal + netVal + secVal))
    } else {
      const errorRate = dns.errors?.resolutionFailureRate ?? dns.errors?.rate ?? 0
      const latency = dns.performance?.latency ?? 0

      if (errorRate >= 25 || ai.severity === 'critical') {
        secVal = Math.min(85, Math.round(errorRate * 3))
        netVal = Math.min(30, Math.round(latency * 0.2))
        opVal = Math.max(5, 100 - (secVal + netVal))
      } else if (latency > 150 || errorRate > 5 || ai.severity === 'warning') {
        netVal = Math.min(60, Math.round(latency * 0.3))
        secVal = Math.min(30, Math.round(errorRate * 2))
        opVal = Math.max(20, 100 - (secVal + netVal))
      } else {
        opVal = 100
        secVal = 0
        netVal = 0
      }
    }
  }

  const probabilities = [
    {
      label: 'OPERATIONAL',
      value: opVal,
      icon: Activity,
      color: '#22c55e',
    },
    {
      label: 'NETWORK',
      value: netVal,
      icon: Network,
      color: '#38bdf8',
    },
    {
      label: 'SECURITY',
      value: secVal,
      icon: ShieldAlert,
      color: secVal > 30 ? '#ef4444' : '#f59e0b',
    },
  ]

  if (unkVal > 0) {
    probabilities.push({
      label: 'UNCORRELATED',
      value: unkVal,
      icon: HelpCircle,
      color: '#64748b',
    })
  }

  return (
    <section className="border border-[#17313b] bg-[#060b10]">
      <Header
        code="AI / 02"
        title="ROOT-CAUSE PROBABILITY"
        subtitle="CLASSIFICATION MODEL POSTERIOR PROBABILITIES"
      />

      <div className="space-y-4 p-4">
        {isCalibrating ? (
          <div className="flex flex-col items-center justify-center py-4 font-mono text-[10px] text-[#556e7b]">
            <Activity className="mb-2 animate-pulse text-cyan-400" size={16} />
            <div>CALIBRATING MODEL BASELINE...</div>
            <div className="mt-1 text-[8px] text-[#3d535f]">
              Awaiting minimum real observations
            </div>
          </div>
        ) : (
          probabilities.map((item) => {
            const Icon = item.icon

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon
                      size={10}
                      strokeWidth={1.2}
                      style={{ color: item.color }}
                    />
                    <span className="font-mono text-[10px] text-[#657982]">
                      {item.label}
                    </span>
                  </div>

                  <span className="font-mono text-[11px] text-[#a9bbc2]">
                    {item.value}%
                  </span>
                </div>

                <div className="h-1.5 bg-[#111c22]">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, item.value)}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}66`,
                    }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

function Header({ code, title, subtitle }) {
  return (
    <div className="border-b border-[#17313b] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#36545f]">
          {code}
        </span>
        <span className="h-3 w-px bg-[#17313b]" />
        <span className="font-mono text-[11px] tracking-[0.12em] text-[#c8d7dc]">
          {title}
        </span>
      </div>
      <div className="mt-1 font-mono text-[9px] text-[#465b65]">
        {subtitle}
      </div>
    </div>
  )
}

export default ThreatProbability