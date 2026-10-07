import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BellRing,
  Check,
  ChevronRight,
  Command,
  Cpu,
  Eye,
  Menu,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import logoImg from '../assets/logo.png'

const navigation = [
  { label: 'Method', href: '#method' },
  { label: 'Signals', href: '#signals' },
  { label: 'Playbook', href: '#playbook' },
]

const signalNodes = [
  {
    label: 'Frankfurt',
    shortLabel: 'FRA',
    signal: 'Cache drift',
    value: '+34 ms',
    confidence: '98.4%',
    detail: 'Resolver cache behavior has departed from its expected warm-path pattern.',
    accent: 'violet',
  },
  {
    label: 'Virginia',
    shortLabel: 'IAD',
    signal: 'Query burst',
    value: '3.8×',
    confidence: '96.1%',
    detail: 'An unusual recursive query pattern is isolated before it affects resolution.',
    accent: 'amber',
  },
  {
    label: 'Singapore',
    shortLabel: 'SIN',
    signal: 'Route jitter',
    value: '11 ms',
    confidence: '91.7%',
    detail: 'The network route is fluctuating, but resolver health remains inside tolerance.',
    accent: 'cyan',
  },
]

const workflow = [
  {
    number: '01',
    icon: Radar,
    title: 'Notice the shape of change',
    body: 'Baseline-aware models separate normal traffic surges from a signal that deserves attention.',
    meta: '5-second signal cadence',
  },
  {
    number: '02',
    icon: Network,
    title: 'Follow the signal to its source',
    body: 'Correlated resolver, route, and query evidence narrows a noisy event to one useful explanation.',
    meta: 'Cross-layer reasoning',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Move with context in hand',
    body: 'A focused incident brief gives the on-call team the action, blast radius, and confidence to respond.',
    meta: 'Decision-ready brief',
  },
]

const capabilities = [
  {
    icon: Eye,
    index: '01',
    title: 'A calm view of a loud system',
    body: 'One readable operational narrative replaces dozens of disconnected threshold alerts.',
    tone: 'violet',
  },
  {
    icon: Cpu,
    index: '02',
    title: 'Evidence, not black-box urgency',
    body: 'Every prediction links back to the resolver, network, and query signals behind it.',
    tone: 'cyan',
  },
  {
    icon: ShieldCheck,
    index: '03',
    title: 'Built for the moment before impact',
    body: 'Surface likely degradations early enough to keep an investigation from becoming an outage.',
    tone: 'amber',
  },
]

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSignal, setActiveSignal] = useState(0)
  const selectedSignal = signalNodes[activeSignal]

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="nexus-site">
      <div className="nexus-noise" aria-hidden="true" />

      <header className="nexus-header">
        <nav className="nexus-nav nexus-shell" aria-label="Primary navigation">
          <Link to="/" className="nexus-brand" aria-label="DNS_X home" onClick={closeMenu}>
            <img src={logoImg} alt="DNS_X" />
            <span className="nexus-brand-mark">Predictive console</span>
          </Link>

          <div className="nexus-nav-links" aria-label="Product sections">
            {navigation.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>

          <div className="nexus-nav-actions">
            <Link to="/dashboard" className="nexus-nav-console">
              Open console
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="nexus-menu-button"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        <div className={'nexus-mobile-menu ' + (menuOpen ? 'is-open' : '')}>
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={closeMenu}>
              {item.label}
              <ChevronRight size={16} aria-hidden="true" />
            </a>
          ))}
          <Link to="/dashboard" onClick={closeMenu}>
            Open live console
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        <section className="nexus-hero">
          <div className="nexus-hero-glow nexus-hero-glow-one" aria-hidden="true" />
          <div className="nexus-hero-glow nexus-hero-glow-two" aria-hidden="true" />
          <div className="nexus-shell nexus-hero-grid">
            <div className="nexus-hero-copy">
              <div className="nexus-kicker">
                <span className="nexus-kicker-dot" />
                <span>Predictive DNS intelligence</span>
                <span className="nexus-kicker-divider" />
                <span>v4.2</span>
              </div>

              <h1>
                Meet the incident
                <span> before your users do.</span>
              </h1>

              <p className="nexus-hero-description">
                DNS_X turns restless resolver data into a clear next move—so your team can intervene before
                a small deviation becomes the story of everyone&apos;s day.
              </p>

              <div className="nexus-hero-ctas">
                <Link to="/dashboard" className="nexus-button nexus-button-primary">
                  Enter the live console
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <a href="#method" className="nexus-button nexus-button-quiet">
                  See the method
                  <ChevronRight size={17} aria-hidden="true" />
                </a>
              </div>

              <div className="nexus-hero-proof" aria-label="Product highlights">
                <div>
                  <strong>5 sec</strong>
                  <span>signal cadence</span>
                </div>
                <div>
                  <strong>3 layers</strong>
                  <span>of correlated evidence</span>
                </div>
                <div>
                  <strong>1 brief</strong>
                  <span>for the on-call team</span>
                </div>
              </div>
            </div>

            <div className="nexus-visual-wrap">
              <div className="nexus-visual-label">
                <span>
                  <span className="nexus-live-dot" />
                  Resolution field
                </span>
                <span>03 monitored regions</span>
              </div>

              <div className="nexus-signal-field">
                <div className="nexus-field-grain" aria-hidden="true" />
                <div className="nexus-field-rings" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <svg className="nexus-field-lines" viewBox="0 0 640 560" fill="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="field-route-one" x1="55" y1="60" x2="560" y2="480" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#b18cff" stopOpacity=".85" />
                      <stop offset=".48" stopColor="#7b61ff" stopOpacity=".18" />
                      <stop offset="1" stopColor="#69e6ff" stopOpacity=".72" />
                    </linearGradient>
                    <linearGradient id="field-route-two" x1="500" y1="85" x2="95" y2="470" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffcd75" stopOpacity=".72" />
                      <stop offset=".5" stopColor="#6a55e6" stopOpacity=".2" />
                      <stop offset="1" stopColor="#a98aff" stopOpacity=".78" />
                    </linearGradient>
                  </defs>
                  <path d="M92 128C170 86 223 118 282 202C340 285 433 215 554 143" stroke="url(#field-route-one)" strokeWidth="1.3" />
                  <path d="M76 455C150 391 231 385 304 307C379 227 445 293 561 423" stroke="url(#field-route-two)" strokeWidth="1.3" />
                  <path d="M98 130C175 202 221 290 304 307C409 329 465 270 556 144" stroke="rgba(236, 232, 255, .18)" strokeDasharray="4 9" />
                  <path d="M77 455C173 464 219 414 304 307C381 211 486 187 561 423" stroke="rgba(236, 232, 255, .12)" strokeDasharray="3 10" />
                  <circle cx="304" cy="307" r="95" stroke="rgba(190, 172, 255, .24)" strokeWidth=".8" />
                  <circle cx="304" cy="307" r="155" stroke="rgba(190, 172, 255, .12)" strokeWidth=".8" strokeDasharray="3 9" />
                </svg>

                {signalNodes.map((signal, index) => (
                  <button
                    type="button"
                    key={signal.shortLabel}
                    className={'nexus-node nexus-node-' + index + (activeSignal === index ? ' is-active' : '')}
                    aria-pressed={activeSignal === index}
                    onClick={() => setActiveSignal(index)}
                  >
                    <span className={'nexus-node-orb nexus-node-orb-' + signal.accent}>
                      <span />
                    </span>
                    <span className="nexus-node-copy">
                      <strong>{signal.shortLabel}</strong>
                      <small>{signal.signal}</small>
                    </span>
                  </button>
                ))}

                <div className="nexus-core-node" aria-label="DNS_X correlation engine">
                  <span className="nexus-core-radar" aria-hidden="true" />
                  <div className="nexus-core-inner">
                    <Command size={19} aria-hidden="true" />
                    <span>DNS_X</span>
                  </div>
                </div>

                <div className="nexus-field-readout">
                  <div className="nexus-readout-header">
                    <div>
                      <span className={'nexus-readout-icon nexus-readout-icon-' + selectedSignal.accent}>
                        <Activity size={14} aria-hidden="true" />
                      </span>
                      <span>Signal brief</span>
                    </div>
                    <span className="nexus-readout-region">{selectedSignal.label}</span>
                  </div>
                  <strong>{selectedSignal.signal}</strong>
                  <p>{selectedSignal.detail}</p>
                  <div className="nexus-readout-footer">
                    <span>
                      <i />
                      {selectedSignal.confidence} confidence
                    </span>
                    <span>{selectedSignal.value}</span>
                  </div>
                </div>

                <div className="nexus-field-status">
                  <span>Correlation engine</span>
                  <strong>Listening</strong>
                  <span className="nexus-status-bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>

              <p className="nexus-visual-caption">
                Select a region to inspect how DNS_X turns a deviation into an operational explanation.
              </p>
            </div>
          </div>
        </section>

        <section className="nexus-signal-strip" aria-label="Platform status">
          <div className="nexus-shell nexus-signal-strip-inner">
            <div className="nexus-strip-intro">
              <span className="nexus-strip-icon"><Sparkles size={16} aria-hidden="true" /></span>
              <p>Designed for the uneasy minutes before an incident has a name.</p>
            </div>
            <div className="nexus-strip-stat">
              <span>Resolver health</span>
              <strong>99.98%</strong>
            </div>
            <div className="nexus-strip-stat">
              <span>Open signals</span>
              <strong>03 <em>triaged</em></strong>
            </div>
            <div className="nexus-strip-stat">
              <span>Current posture</span>
              <strong className="nexus-protected"><i /> Protected</strong>
            </div>
          </div>
        </section>

        <section className="nexus-workflow nexus-shell" id="method">
          <div className="nexus-section-heading">
            <span>From raw activity to the next useful move</span>
            <h2>Less alert fatigue. More operational foresight.</h2>
            <p>
              DNS_X is designed around the way real teams investigate: establish the pattern, find the cause,
              then act with enough context to trust the decision.
            </p>
          </div>

          <div className="nexus-workflow-grid">
            {workflow.map((step) => {
              const Icon = step.icon
              return (
                <article className="nexus-workflow-card" key={step.number}>
                  <div className="nexus-workflow-card-top">
                    <span>{step.number}</span>
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="nexus-workflow-meta">
                    <Check size={14} aria-hidden="true" />
                    {step.meta}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="nexus-capabilities" id="signals">
          <div className="nexus-shell">
            <div className="nexus-capabilities-head">
              <div>
                <span className="nexus-section-label">The DNS_X difference</span>
                <h2>Signal intelligence that reads like a good teammate.</h2>
              </div>
              <Link to="/dashboard" className="nexus-text-link">
                Explore live telemetry
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="nexus-capability-grid">
              {capabilities.map((capability) => {
                const Icon = capability.icon
                return (
                  <article className={'nexus-capability-card nexus-capability-card-' + capability.tone} key={capability.index}>
                    <div className="nexus-capability-index">{capability.index}</div>
                    <div className="nexus-capability-icon">
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <h3>{capability.title}</h3>
                    <p>{capability.body}</p>
                    <div className="nexus-capability-line" aria-hidden="true">
                      <span />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="nexus-playbook nexus-shell" id="playbook">
          <div className="nexus-playbook-copy">
            <div className="nexus-kicker nexus-kicker-muted">
              <BellRing size={14} aria-hidden="true" />
              <span>On-call, with context</span>
            </div>
            <h2>The alert should arrive with its own explanation.</h2>
            <p>
              Give responders a concise record of what changed, where it started, how far it can spread,
              and what to do next—not another number to decode under pressure.
            </p>
            <Link to="/incidents" className="nexus-text-link">
              View incident workflow
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="nexus-incident-card">
            <div className="nexus-incident-titlebar">
              <div>
                <span className="nexus-terminal-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>incident / brief_0084</span>
              </div>
              <span>ready for action</span>
            </div>
            <div className="nexus-incident-body">
              <div className="nexus-incident-alert">
                <span>Forecasted degradation</span>
                <strong>Cache invalidation drift</strong>
                <p>FRA recursive pool · 14% of projected traffic affected</p>
              </div>
              <div className="nexus-incident-evidence">
                <span>Evidence trail</span>
                <div>
                  <p><i className="is-done" /> Latency deviation confirmed</p>
                  <p><i className="is-done" /> Network path ruled out</p>
                  <p><i className="is-current" /> Cache purge recommended</p>
                </div>
              </div>
              <div className="nexus-incident-action">
                <span>Recommended next move</span>
                <strong>Drain resolver <code>fra-r17</code>, then refresh cache.</strong>
                <button type="button">
                  Open runbook
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="nexus-footer">
        <div className="nexus-shell nexus-footer-inner">
          <div className="nexus-footer-brand">
            <img src={logoImg} alt="DNS_X" />
            <p>Predict, pinpoint, protect.</p>
          </div>
          <div className="nexus-footer-links">
            <a href="#method">Method</a>
            <a href="#signals">Signals</a>
            <Link to="/monitoring">Monitoring</Link>
            <Link to="/ai-insights">AI insights</Link>
          </div>
          <p className="nexus-footer-copy">© {new Date().getFullYear()} DNS_X</p>
        </div>
      </footer>
    </div>
  )
}
