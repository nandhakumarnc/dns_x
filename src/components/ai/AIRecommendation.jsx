import { useEffect, useState } from 'react'
import {
  Lightbulb,
  ArrowRight,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { getRecommendation } from '../../services/aiService'

function AIRecommendation() {
  const { ai, selectedIncident } = useDNSState()
  const [recommendations, setRecommendations] = useState([])

  useEffect(() => {
    let isCancelled = false

    async function fetchIncidentRecommendations() {
      if (selectedIncident?.id) {
        try {
          const recData = await getRecommendation(selectedIncident.id)
          if (!isCancelled && recData?.actions && Array.isArray(recData.actions)) {
            setRecommendations(recData.actions)
            setLoading(false)
            return
          }
        } catch {
          // fall through to dynamic fallback
        }
      }

      // Dynamic fallback recommendations based on current AI telemetry
      const dominant = ai?.dominantClass || (ai?.severity === 'critical' ? 'SECURITY' : ai?.severity === 'warning' ? 'OPERATIONAL' : 'NORMAL')
      const recs = []

      if (dominant === 'SECURITY') {
        recs.push(
          { priority: 0, action: 'Escalate to SecOps on-call response team', rationale: 'Critical outage risk with elevated query burst and timeout patterns' },
          { priority: 1, action: 'Enable rate limiting & query ACLs on resolver pool', rationale: 'Mitigates potential amplification or denial-of-service traffic' },
          { priority: 2, action: 'Capture PCAP telemetry traces for DNS query forensics', rationale: 'Required for forensic attribution and post-mortem analysis' },
        )
      } else if (dominant === 'NETWORK') {
        recs.push(
          { priority: 1, action: 'Verify BGP route announcements and upstream DNS transit', rationale: 'Network latency deviations detected across external links' },
          { priority: 2, action: 'Route traffic to secondary anycast failover POP', rationale: 'Isolates degraded transit path from active user queries' },
          { priority: 3, action: 'Inspect recursive query timeouts on forwarders', rationale: 'Elevated SERVFAIL/timeout metrics observed' },
        )
      } else {
        recs.push(
          { priority: 1, action: 'Review resolver cache hit ratio & memory saturation', rationale: 'Cache miss rate directly correlates with latency degradation' },
          { priority: 2, action: 'Inspect resolver node CPU utilization across cluster', rationale: 'Prevents thread starvation under peak QPS surges' },
          { priority: 3, action: 'Maintain continuous baseline telemetry observation', rationale: 'System operates within acceptable statistical bounds' },
        )
      }

      if (!isCancelled) {
        setRecommendations(recs)
        setLoading(false)
      }
    }

    fetchIncidentRecommendations()

    return () => {
      isCancelled = true
    }
  }, [selectedIncident?.id, ai?.dominantClass, ai?.severity])

  return (
    <section className="border border-[#17313b] bg-[#060b10]">
      <div className="flex items-center justify-between border-b border-[#17313b] px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb
            size={12}
            className="text-amber-400"
            strokeWidth={1.5}
          />
          <span className="font-mono text-[10px] tracking-[0.15em] text-[#c8d7dc]">
            AUTOMATED MITIGATION & RECOMMENDATIONS
          </span>
        </div>

        <span className="font-mono text-[9px] text-[#40545e]">
          {selectedIncident ? `TARGET: ${selectedIncident.id.slice(0, 8).toUpperCase()}` : 'TARGET: SYSTEM OVERVIEW'}
        </span>
      </div>

      <div className="space-y-2.5 p-4">
        {recommendations.map((rec, idx) => {
          const isCritical = rec.priority === 0
          const isHigh = rec.priority === 1

          return (
            <div
              key={idx}
              className={`border p-3 transition-colors ${
                isCritical
                  ? 'border-red-500/30 bg-[#160b0e]'
                  : isHigh
                    ? 'border-amber-500/20 bg-[#141008]'
                    : 'border-[#17313b] bg-[#080f14]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 inline-block px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-wider ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400'
                        : isHigh
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                    }`}
                  >
                    P{rec.priority}
                  </span>

                  <div>
                    <div className="font-mono text-[11px] font-medium text-[#c8d7dc]">
                      {rec.action}
                    </div>
                    <div className="mt-1 text-[9px] leading-4 text-[#657982]">
                      {rec.rationale}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Apply recommendation"
                    className="flex items-center gap-1 border border-[#1e3a47] bg-[#07131b] px-2 py-1 font-mono text-[9px] text-cyan-400 hover:border-cyan-400/60 hover:bg-[#0c2230]"
                  >
                    <span>APPLY</span>
                    <ArrowRight size={9} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default AIRecommendation