import { useState } from 'react'
import { Activity, Clock3, AlertTriangle } from 'lucide-react'
import DNSActivityChart from '../charts/DNSActivityChart'
import ResponseTimeChart from '../charts/ResponseTimeChart'
import ErrorRateChart from '../charts/ErrorRateChart'

function TrafficChartSection() {
  const [selectedMetric, setSelectedMetric] = useState('QPS')

  const metricTabs = [
    { id: 'QPS', label: 'QPS', icon: Activity, description: 'Query Traffic Velocity' },
    { id: 'LATENCY', label: 'LATENCY', icon: Clock3, description: 'Resolver Response Time' },
    { id: 'ERRORS', label: 'ERRORS', icon: AlertTriangle, description: 'NXDOMAIN, SERVFAIL & Timeouts' },
  ]

  return (
    <section className="glass-panel overflow-hidden">
      {/* Tab Switcher Header */}
      <div className="flex flex-col gap-2 border-b border-white/[0.08] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.2em] text-[#7891a0]">
            TRAFFIC / TELEMETRY
          </span>
          <span className="h-3 w-px bg-white/[0.15]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white font-medium">
            {selectedMetric === 'QPS'
              ? 'DNS Query Velocity'
              : selectedMetric === 'LATENCY'
                ? 'Resolver Response Latency'
                : 'Failure & Anomaly Error Rate'}
          </span>
        </div>

        {/* Toggle Selector: [ QPS ] [ LATENCY ] [ ERRORS ] */}
        <div className="glass-card flex items-center gap-1 p-1 rounded-xl">
          {metricTabs.map((tab) => {
            const Icon = tab.icon
            const isSelected = selectedMetric === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMetric(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'glass-pill-active text-white font-semibold shadow-[0_4px_16px_rgba(124,58,237,0.35)]'
                    : 'text-[#8fa6b0] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon size={11} strokeWidth={1.6} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Render the Active Chart Component */}
      <div className="p-0 [&_section]:border-0 [&_section]:bg-transparent">
        {selectedMetric === 'QPS' && <DNSActivityChart />}
        {selectedMetric === 'LATENCY' && <ResponseTimeChart />}
        {selectedMetric === 'ERRORS' && <ErrorRateChart />}
      </div>
    </section>
  )
}

export default TrafficChartSection
