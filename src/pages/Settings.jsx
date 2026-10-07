import {
  BellRing,
  BrainCircuit,
  Database,
  Gauge,
  Globe2,
  Radio,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'

function Settings() {
  return (
    <main className="space-y-3">

      {/* Header */}
      <header className="flex items-end justify-between border-b border-white/[0.08] pb-3.5">

        <div>
          <div className="flex items-center gap-2">

            <span className="font-mono text-[10px] tracking-[0.2em] text-[#556d7a]">
              DNS_X / SYS
            </span>

            <span className="h-3 w-px bg-white/[0.12]" />

            <h1 className="text-[18px] font-semibold tracking-[0.18em] text-[#f0f6f8] sm:text-[16px]">
              SYSTEM SETTINGS
            </h1>

          </div>

          <p className="mt-1 font-mono text-[9px] tracking-[0.1em] text-[#6b8592]">
            MONITORING · DETECTION · ALERTS · SYSTEM
          </p>
        </div>

        <div className="flex items-center gap-2">

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />

          <span className="font-mono text-[9px] text-emerald-400">
            SYSTEM READY
          </span>

        </div>

      </header>

      {/* Monitoring */}
      <SettingsSection
        code="SYS / 01"
        title="MONITORING CONFIGURATION"
        subtitle="DNS TELEMETRY COLLECTION"
        icon={Radio}
      >

        <SettingRow
          title="DNS monitoring"
          description="Continuously collect DNS infrastructure telemetry."
          type="toggle"
          enabled
        />

        <SettingRow
          title="Live data refresh"
          description="Interval used for dashboard state updates."
          type="select"
          value="5 seconds"
          options={[
            '1 second',
            '5 seconds',
            '10 seconds',
            '30 seconds',
          ]}
        />

        <SettingRow
          title="Query collection"
          description="Capture DNS query behaviour for anomaly analysis."
          type="toggle"
          enabled
        />

      </SettingsSection>

      {/* Detection */}
      <SettingsSection
        code="SYS / 02"
        title="ANOMALY DETECTION"
        subtitle="BEHAVIOURAL DETECTION PARAMETERS"
        icon={SlidersHorizontal}
      >

        <SettingRow
          title="Detection sensitivity"
          description="Controls how aggressively DNS_X identifies deviations."
          type="select"
          value="Balanced"
          options={[
            'Low',
            'Balanced',
            'High',
            'Very High',
          ]}
        />

        <SettingRow
          title="Latency threshold"
          description="Trigger investigation when resolver latency exceeds baseline."
          type="value"
          value="150 ms"
        />

        <SettingRow
          title="Error threshold"
          description="DNS error rate threshold for anomaly generation."
          type="value"
          value="5%"
        />

      </SettingsSection>

      {/* Alerts */}
      <SettingsSection
        code="SYS / 03"
        title="ALERT MANAGEMENT"
        subtitle="INCIDENT NOTIFICATION POLICY"
        icon={BellRing}
      >

        <SettingRow
          title="Critical alerts"
          description="Immediately surface critical infrastructure events."
          type="toggle"
          enabled
        />

        <SettingRow
          title="High severity alerts"
          description="Notify when significant DNS anomalies are detected."
          type="toggle"
          enabled
        />

        <SettingRow
          title="Incident correlation"
          description="Group related anomalies into a single incident."
          type="toggle"
          enabled
        />

      </SettingsSection>

      {/* Infrastructure */}
      <SettingsSection
        code="SYS / 04"
        title="INFRASTRUCTURE"
        subtitle="DNS RESOLVER ENVIRONMENT"
        icon={Server}
      >

        <SettingRow
          title="Primary resolver"
          description="Main DNS resolver currently monitored."
          type="value"
          value="resolver-01"
        />

        <SettingRow
          title="Secondary resolver"
          description="Backup resolver monitored by DNS_X."
          type="value"
          value="resolver-02"
        />

        <SettingRow
          title="Monitoring mode"
          description="Current infrastructure observation mode."
          type="status"
          value="ACTIVE"
        />

      </SettingsSection>

      {/* System status */}
      <SettingsSection
        code="SYS / 05"
        title="SYSTEM STATUS"
        subtitle="SERVICE CONNECTIVITY"
        icon={Settings2}
      >

        <SystemStatus
          icon={Database}
          title="Supabase"
          detail="Database connection"
          status="CONNECTED"
        />

        <SystemStatus
          icon={BrainCircuit}
          title="AI Engine"
          detail="Prediction service"
          status="STANDBY"
        />

        <SystemStatus
          icon={Globe2}
          title="DNS Monitor"
          detail="Telemetry service"
          status="ACTIVE"
        />

        <SystemStatus
          icon={ShieldCheck}
          title="Backend API"
          detail="Node.js service"
          status="STANDBY"
        />

      </SettingsSection>

      {/* Footer */}
      <div className="flex items-center justify-between border border-[#17313b] bg-[#060b10] px-4 py-3">

        <div className="flex items-center gap-2">

          <Gauge
            size={10}
            className="text-cyan-400"
            strokeWidth={1.2}
          />

          <span className="font-mono text-[9px] text-[#526873]">
            DNS_X CONFIGURATION
          </span>

        </div>

        <span className="font-mono text-[9px] tracking-[0.1em] text-[#36545f]">
          SYSTEM VERSION · 0.1.0
        </span>

      </div>

    </main>
  )
}

function SettingsSection({
  code,
  title,
  subtitle,
  icon: Icon,
  children,
}) {
  return (
    <section className="glass-panel rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.3)]">

      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.015] px-4 py-3">

        <div className="flex items-center gap-2.5">

          <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.15)]">
            <Icon
              size={12}
              strokeWidth={1.3}
              className="text-cyan-400"
            />
          </div>

          <div>

            <div className="flex items-center gap-2">

              <span className="font-mono text-[9px] text-[#556d7a]">
                {code}
              </span>

              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#d5e4ea]">
                {title}
              </span>

            </div>

            <div className="mt-0.5 font-mono text-[9px] text-[#6b8592]">
              {subtitle}
            </div>

          </div>

        </div>

      </div>

      <div className="divide-y divide-white/[0.06]">
        {children}
      </div>

    </section>
  )
}

function SettingRow({
  title,
  description,
  type,
  enabled,
  value,
  options,
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3.5 transition hover:bg-white/[0.02]">

      <div className="min-w-0">

        <div className="text-[11px] font-medium text-[#c8d7dc]">
          {title}
        </div>

        <div className="mt-0.5 text-[9px] leading-4 text-[#657f8d]">
          {description}
        </div>

      </div>

      <div className="shrink-0">

        {type === 'toggle' && (
          <button
            className={`relative h-5 w-9 rounded-full border transition ${
              enabled
                ? 'border-cyan-400/40 bg-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'border-white/[0.1] bg-black/40'
            }`}
          >
            <span
              className={`absolute top-[3px] h-3 w-3 rounded-full transition-all ${
                enabled
                  ? 'right-[3px] bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                  : 'left-[3px] bg-[#556d7a]'
              }`}
            />
          </button>
        )}

        {type === 'select' && (
          <select
            defaultValue={value}
            className="rounded-xl border border-white/[0.1] bg-[#070d14]/80 px-2.5 py-1 font-mono text-[9px] text-[#b8cbd4] outline-none backdrop-blur-md"
          >
            {options.map((option) => (
              <option key={option} value={option} className="bg-[#070d14] text-[#c8d7dc]">
                {option}
              </option>
            ))}
          </select>
        )}

        {type === 'value' && (
          <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-cyan-400">
            {value}
          </div>
        )}

        {type === 'status' && (
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />

            <span className="font-mono text-[9px] text-emerald-300">
              {value}
            </span>

          </div>
        )}

      </div>

    </div>
  )
}

function SystemStatus({
  icon: Icon,
  title,
  detail,
  status,
}) {
  const active = status === 'ACTIVE' || status === 'CONNECTED'

  return (
    <div className="flex items-center justify-between px-4 py-3.5 transition hover:bg-white/[0.02]">

      <div className="flex items-center gap-3">

        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">

          <Icon
            size={12}
            strokeWidth={1.3}
            className="text-cyan-400"
          />

        </div>

        <div>

          <div className="text-[11px] font-medium text-[#c8d7dc]">
            {title}
          </div>

          <div className="mt-0.5 text-[9px] text-[#657f8d]">
            {detail}
          </div>

        </div>

      </div>

      <div className="flex items-center gap-2">

        <span
          className={`h-1.5 w-1.5 rounded-full ${
            active
              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,.8)]'
              : 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,.8)]'
          }`}
        />

        <span
          className={`font-mono text-[9px] ${
            active
              ? 'text-emerald-400'
              : 'text-amber-400'
          }`}
        >
          {status}
        </span>

      </div>

    </div>
  )
}

export default Settings