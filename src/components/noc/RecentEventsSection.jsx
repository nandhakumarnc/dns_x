import { useState } from 'react'
import {
  ExternalLink,
} from 'lucide-react'
import useDNSState from '../../hooks/useDNSState'
import EventsDrawer from './EventsDrawer'
import { generateRealEvents } from '../../utils/realEvents'

function RecentEventsSection() {
  const dns = useDNSState()
  const [isEventsOpen, setIsEventsOpen] = useState(false)

  // Real data-driven chronological events (strictly from actual measurements)
  const allEvents = generateRealEvents(dns)
  const events = allEvents.slice(0, 5)

  return (
    <>
      <section className="glass-panel overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] tracking-[0.2em] text-[#7891a0]">
              EVENTS / LOG
            </span>
            <span className="h-3 w-px bg-white/[0.15]" />
            <h2 className="text-[12px] font-semibold tracking-[0.16em] text-white">
              RECENT CHRONOLOGICAL EVENTS
            </h2>
          </div>

          <div className="flex items-center gap-3 font-mono text-[9px]">
            <span className="hidden text-[#7891a0] sm:inline">TOP 5 EVENTS</span>
            <button
              type="button"
              onClick={() => setIsEventsOpen(true)}
              className="glass-pill-subtle flex items-center gap-1.5 px-3 py-1 uppercase tracking-wider text-cyan-300 transition-all hover:text-white"
            >
              <span>VIEW ALL</span>
              <ExternalLink size={9} />
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="divide-y divide-white/[0.05] p-2">
          {events.map((event, idx) => {
            const Icon = event.icon
            const isWarning = event.level === 'warning'

            return (
              <div
                key={`${event.category}-${idx}`}
                className="flex items-start gap-3.5 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                    isWarning 
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' 
                      : 'border-white/[0.1] bg-white/[0.05] text-cyan-300'
                  }`}
                >
                  <Icon size={12} strokeWidth={1.5} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[9px]">
                    <span className="text-cyan-300 font-medium">{event.time}</span>
                    <span className="text-white/20">•</span>
                    <span className="text-[#8fa6b0] uppercase tracking-wider">{event.category}</span>
                  </div>

                  <div className={`mt-0.5 font-mono text-[11px] ${isWarning ? 'text-amber-300 font-medium' : 'text-white'}`}>
                    {event.title}
                  </div>

                  <div className="mt-0.5 text-[10px] text-[#7d95a2]">
                    {event.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Full Events Drawer */}
      <EventsDrawer
        isOpen={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
      />
    </>
  )
}

export default RecentEventsSection
