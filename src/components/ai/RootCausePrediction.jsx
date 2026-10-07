import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Network,
  Server,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'

function RootCausePrediction() {
  const { ai, activeAiAssessment } = useDNSState()

  const assessment = activeAiAssessment?.assessment || ai || {}
  const dominant = assessment.dominant_class || ai.dominantClass || (ai.severity === 'critical' ? 'SECURITY' : ai.severity === 'warning' ? 'NETWORK' : 'OPERATIONAL')

  const opConf = assessment.operational_prob ? Math.round(assessment.operational_prob * 100) : dominant === 'OPERATIONAL' ? 68 : 24
  const netConf = assessment.network_prob ? Math.round(assessment.network_prob * 100) : dominant === 'NETWORK' ? 62 : 19
  const secConf = assessment.security_prob ? Math.round(assessment.security_prob * 100) : dominant === 'SECURITY' ? 74 : 12

  const causes = [
    {
      icon: Server,
      title: 'Resolver resource & CPU saturation',
      confidence: opConf,
      state: dominant === 'OPERATIONAL' ? 'PRIMARY' : opConf > 20 ? 'POSSIBLE' : 'LOW',
    },
    {
      icon: Network,
      title: 'Upstream BGP transit / forwarder timeout',
      confidence: netConf,
      state: dominant === 'NETWORK' ? 'PRIMARY' : netConf > 20 ? 'POSSIBLE' : 'LOW',
    },
    {
      icon: AlertTriangle,
      title: 'Suspected spoofing / amplification surge',
      confidence: secConf,
      state: dominant === 'SECURITY' ? 'PRIMARY' : secConf > 20 ? 'POSSIBLE' : 'LOW',
    },
  ].sort((a, b) => b.confidence - a.confidence)

  return (
    <section className="border border-[#17313b] bg-[#060b10]">
      <div className="border-b border-[#17313b] px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu
            size={11}
            className="text-cyan-400"
            strokeWidth={1.2}
          />
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#657982]">
            ROOT CAUSE PREDICTION (RANDOM FOREST)
          </span>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {causes.map((cause) => (
          <Cause
            key={cause.title}
            {...cause}
          />
        ))}
      </div>
    </section>
  )
}

function Cause({
  icon: Icon,
  title,
  confidence,
  state,
}) {
  const primary = state === 'PRIMARY'

  return (
    <div
      className={`border p-3 transition-colors ${
        primary
          ? 'border-cyan-400/20 bg-[#08151b]'
          : 'border-[#17313b] bg-[#080f14]'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          size={11}
          strokeWidth={1.2}
          className={
            primary
              ? 'text-cyan-400'
              : 'text-[#526873]'
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#9fb2b9]">
              {title}
            </span>

            <span className="font-mono text-[9px] text-[#657982]">
              {confidence}%
            </span>
          </div>

          <div className="mt-2 h-1 bg-[#111c22]">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{
                width: `${confidence}%`,
                opacity: primary ? 1 : 0.4,
              }}
            />
          </div>
        </div>

        {primary ? (
          <CheckCircle2
            size={9}
            className="text-cyan-400"
          />
        ) : (
          <span className="font-mono text-[9px] text-[#40545e]">
            {state}
          </span>
        )}
      </div>
    </div>
  )
}

export default RootCausePrediction