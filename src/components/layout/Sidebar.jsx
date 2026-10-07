import {
  Activity,
  BrainCircuit,
  Grid2X2,
  ScanSearch,
  Settings,
  ShieldAlert,
  Wifi,
} from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { NAVIGATION } from '../../lib/constants'

const iconMap = {
  grid: Grid2X2,
  activity: Activity,
  scan: ScanSearch,
  'shield-alert': ShieldAlert,
  'brain-circuit': BrainCircuit,
  settings: Settings,
}

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[218px] flex-col border-r border-white/[0.08] bg-[#0a111d]/50 backdrop-blur-2xl shadow-[4px_0_30px_rgba(0,0,0,0.45),inset_-1px_0_0_rgba(255,255,255,0.06)]">
      
      {/* Brand & Logo (links to landing page) */}
      <div className="flex h-[56px] items-center border-b border-white/[0.07] px-5">
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer transition-opacity hover:opacity-90"
          aria-label="Go to landing page"
          title="Return to Landing Page"
        >
          <img
            src="/logo.png"
            alt="DNS_X"
            className="h-8 w-8 object-contain transition-all group-hover:scale-105 drop-shadow-[0_0_5px_rgba(0,217,255,0.2)]"
          />

          <div>
            <div className="text-[14px] font-semibold tracking-[0.16em] text-white group-hover:text-[#9bc2d4] transition-colors">
              DNS_X
            </div>

            <div className="text-[8px] uppercase tracking-[0.16em] text-[#7d93a0]">
              Network Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5">
        <div className="mb-3 px-2 text-[9px] font-medium uppercase tracking-[0.2em] text-[#718794]">
          Operations
        </div>

        <div className="space-y-1.5">
          {NAVIGATION.map((item) => {
            const Icon = iconMap[item.icon]

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/noc' || item.path === '/'}
                className={({ isActive }) =>
                  `group flex h-10 items-center gap-3 px-3 text-[12px] rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'glass-pill-active text-white font-medium'
                      : 'border border-transparent text-[#8ba2ad] hover:bg-white/[0.07] hover:border-white/[0.1] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/[0.04] text-[#8fa6b0] group-hover:bg-white/[0.1] group-hover:text-white'
                    }`}>
                      <Icon
                        size={14}
                        strokeWidth={1.8}
                        className={isActive ? 'text-white' : ''}
                      />
                    </div>

                    <span className="tracking-[0.04em]">
                      {item.label}
                    </span>

                    {isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Network status */}
      <div className="p-3">
        <div className="glass-card flex items-center gap-2.5 p-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400/80">
            <Wifi size={13} strokeWidth={2} />
          </div>

          <div>
            <div className="text-[10px] text-[#9cafb7]">
              Network
            </div>

            <div className="text-[9px] uppercase tracking-[0.12em] font-medium text-emerald-400/80">
              Connected
            </div>
          </div>

          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400/80 shadow-[0_0_4px_rgba(34,197,94,0.3)]" />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar