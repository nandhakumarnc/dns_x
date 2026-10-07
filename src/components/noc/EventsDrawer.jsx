import { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import { generateRealEvents } from '../../utils/realEvents'

function EventsDrawer({ isOpen, onClose }) {
  const dns = useDNSState()
  const { target = {} } = dns
  const [filter, setFilter] = useState('ALL')

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Real data-driven chronological events (strictly from actual measurements)
  const allEvents = generateRealEvents(dns)

  const filteredEvents =
    filter === 'ALL'
      ? allEvents
      : allEvents.filter((ev) => ev.category === filter)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-white/[0.12] bg-[#070d14]/92 backdrop-blur-2xl text-[#c8d7dc] shadow-[-20px_0_60px_rgba(0,0,0,0.8),inset_1px_0_0_rgba(255,255,255,0.08)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
                EVENTS / HISTORY
              </span>
              <span className="h-3 w-px bg-white/[0.12]" />
              <span className="font-mono text-[11px] font-semibold text-cyan-400">
                CHRONOLOGICAL AUDIT
              </span>
            </div>

            <h2 className="mt-1 text-[17px] font-semibold tracking-wide text-[#f0f6f8]">
              Full Operational Event Stream
            </h2>
            <div className="mt-0.5 font-mono text-[9px] text-[#6b8592]">
              TARGET: <strong className="text-cyan-400">{target.cleanDomain}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-2 text-[#728792] transition hover:border-cyan-400/40 hover:bg-white/[0.08] hover:text-cyan-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 border-b border-white/[0.08] bg-white/[0.015] px-6 py-3 font-mono text-[9px] overflow-x-auto">
          {['ALL', 'TELEMETRY', 'TARGET', 'AUTHORITY', 'CALIBRATION', 'SIGNAL', 'INCIDENT'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1 uppercase tracking-wider transition ${
                filter === cat
                  ? 'glass-pill-active font-semibold text-white'
                  : 'glass-pill-subtle text-[#7893a0] hover:text-[#d5e4ea]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="flex-1 divide-y divide-white/[0.06] overflow-y-auto p-6">
          {filteredEvents.map((event, idx) => {
            const Icon = event.icon
            const isWarning = event.level === 'warning'

            return (
              <div
                key={`${event.id}-${idx}`}
                className="flex items-start gap-3.5 py-3.5 transition hover:bg-white/[0.02]"
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border backdrop-blur-xs ${
                    isWarning
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'border-white/[0.08] bg-white/[0.03] text-cyan-400'
                  }`}
                >
                  <Icon size={12} strokeWidth={1.3} />
                </div>

                <div className="min-w-0 flex-1 font-mono">
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-cyan-400">{event.time}</span>
                    <span className="text-[#455c68]">•</span>
                    <span className="text-[#7893a0] uppercase">{event.category}</span>
                  </div>

                  <div className={`mt-0.5 text-[11px] ${isWarning ? 'text-amber-300 font-medium' : 'text-[#d5e4ea]'}`}>
                    {event.title}
                  </div>

                  <div className="mt-0.5 text-[10px] text-[#6b8592]">
                    {event.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 py-3.5 font-mono text-[9px] text-[#657f8d]">
          <span className="flex items-center gap-1.5">
            <Clock size={11} />
            <span>RECORD BUFFER SYNCHRONIZED</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-1.5 font-semibold text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventsDrawer
