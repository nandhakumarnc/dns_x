import { useState } from 'react'
import { Server, Globe2, Network, ExternalLink } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import InfrastructureDrawer from './InfrastructureDrawer'

function InfrastructureStatusSection() {
  const dns = useDNSState()
  const { target = {} } = dns
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const nsCount = target.authoritative?.length || target.nameservers?.length || 0
  const observersCount = target.vantagePoints?.length || 4

  return (
    <>
      <section className="glass-panel p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Header Tag */}
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#7891a0]">
              INFRA / SUMMARY
            </span>
            <span className="h-3 w-px bg-white/[0.15]" />
            <h2 className="text-[12px] font-semibold tracking-[0.16em] text-white">
              RESOLVER TOPOLOGY & VANTAGE POINTS
            </h2>
          </div>

          {/* 3 Compact Metric Badges */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
            {/* 1. External Observers (Public Vantage Points) */}
            <div className="glass-card flex items-center justify-between gap-3 px-3 py-2 font-mono text-[9px] rounded-xl">
              <div className="flex items-center gap-2 text-cyan-300">
                <Globe2 size={13} />
                <span>EXTERNAL VANTAGE POINTS:</span>
              </div>
              <div>
                <strong className="text-white">{observersCount}/{observersCount}</strong>
                <span className="ml-1.5 font-medium text-emerald-400">PROBED</span>
              </div>
            </div>

            {/* 2. Authoritative Nameservers */}
            <div className="glass-card flex items-center justify-between gap-3 px-3 py-2 font-mono text-[9px] rounded-xl">
              <div className="flex items-center gap-2 text-[#b0c8d4]">
                <Network size={13} className="text-[#38bdf8]" />
                <span>AUTHORITATIVE NAMESERVERS:</span>
              </div>
              <div>
                <strong className="text-white">{nsCount > 0 ? `${nsCount}/${nsCount}` : 'DISCOVERING'}</strong>
                <span className="ml-1.5 text-[#738d9c]">VERIFIED</span>
              </div>
            </div>

            {/* 3. Private Resolver Agent Status */}
            <div className="glass-card flex items-center justify-between gap-3 px-3 py-2 font-mono text-[9px] rounded-xl">
              <div className="flex items-center gap-2 text-[#8ba2ad]">
                <Server size={13} />
                <span>PRIVATE FLEET AGENT:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[7.5px] text-[#8fa6b0]">
                  UNCONNECTED (PUBLIC TARGET)
                </span>
              </div>
            </div>

            {/* [ VIEW INFRASTRUCTURE ] Action Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="glass-pill-subtle flex items-center justify-center gap-1.5 px-3 py-2 font-mono text-[9px] font-medium tracking-wider text-cyan-300 transition-all hover:text-white"
            >
              <span>VIEW TOPOLOGY</span>
              <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </section>

      {/* Slide-over breakdown drawer */}
      <InfrastructureDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  )
}

export default InfrastructureStatusSection
