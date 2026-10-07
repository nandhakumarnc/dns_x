import fs from 'fs';

function transformHtml(content) {
  let res = content;

  // 1. Title and metadata
  res = res.replace(/<title>[^<]*<\/title>/gi, '<title>DNS_X — DNS Infrastructure Intelligence, Built From Real Evidence</title>');
  res = res.replaceAll('Sentinel', 'DNS_X');

  // 2. Navigation items
  res = res.replace('Platform', 'Operations');
  res = res.replace('Customers', 'Baselines & Evidence');
  res = res.replace('Pricing', 'Architecture');

  // 3. Hero section
  res = res.replace(
    'Secure your Enterprise Stack<!-- --> <span class="font-sans font-medium tracking-tight">at AI Speed</span>',
    'DNS Infrastructure Intelligence,<!-- --> <span class="font-sans font-medium tracking-tight">Built From Real Evidence.</span>'
  );
  res = res.replace(
    'Sentinel gives security teams the building blocks for a unified platform that meets complex compliance needs and adapts as fast as threats evolve.',
    'Monitor DNS behavior, establish live baselines, detect abnormal resolution patterns, and investigate incidents from one focused operations console.'
  );

  // Hero CTAs
  res = res.replace(
    '<a href="#get-started" style="--cut:9px" class="inline-flex items-center justify-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 focus-ring h-10 px-5 [clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))] bg-foreground text-background hover:bg-foreground/90">Get Started</a>',
    '<a href="/auth" style="--cut:9px" class="inline-flex items-center justify-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 focus-ring h-10 px-5 [clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))] bg-foreground text-background hover:bg-foreground/90">Analyze a Domain</a>'
  );
  res = res.replace(
    '<a href="#talk-to-us" style="--cut:9px" class="inline-flex items-center justify-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 focus-ring h-10 px-5 [clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))] bg-background text-foreground hover:bg-muted">Talk to Us</a>',
    '<a href="/auth" style="--cut:9px" class="inline-flex items-center justify-center gap-2 text-sm font-medium tracking-wide transition-colors duration-200 focus-ring h-10 px-5 [clip-path:polygon(var(--cut)_0,100%_0,100%_calc(100%-var(--cut)),calc(100%-var(--cut))_100%,0_100%,0_var(--cut))] bg-background text-foreground hover:bg-muted">Open NOC</a>'
  );

  // Insert Hero Badge if not present
  if (!res.includes('REAL DNS TELEMETRY · BASELINE AWARE')) {
    const badgeHtml = '<div class="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground backdrop-blur-md">REAL DNS TELEMETRY · BASELINE AWARE · SELF-HOSTABLE</div>';
    res = res.replace(
      '<h1 class="text-balance font-serif text-4xl font-normal',
      badgeHtml + '<h1 class="text-balance font-serif text-4xl font-normal'
    );
  }

  // 4. Live NOC Preview (Section 3)
  res = res.replace('Security Overview', 'DNS_X Operations Center — Live Preview');
  res = res.replace('Last 24 hours · Global', 'Target: example.com · Baseline Aware Vantage');
  res = res.replace('All systems secure', 'Target Health: NORMAL');
  res = res.replace('Updated just now', 'Real Probe Telemetry');

  // Preview metric cards
  res = res.replace('Threats Blocked', 'Target Health');
  res = res.replace('12,847', 'HEALTHY');
  res = res.replace('14.2%', 'Baseline OK');

  res = res.replace('Active Endpoints', 'Response Latency');
  res = res.replace('3,204', '18.4ms');
  res = res.replace('2.1%', 'Auth: 14ms');

  res = res.replace('Compliance Score', 'Resolution Failure Rate');
  res = res.replace('98.6%', '0.00%');
  res = res.replace('0.8%', '0 SERVFAIL');

  res = res.replace('Avg. Response', 'DNS QPS');
  res = res.replace('1.2s', 'N/A');
  res = res.replace('0.3s', 'Public Target');

  // Sidebar labels
  res = res.replace('>Overview<', '>Target Health<');
  res = res.replace('>Threats<', '>Response Latency<');
  res = res.replace('>Endpoints<', '>Probe Activity<');
  res = res.replace('>Cloud<', '>Resolver Status<');
  res = res.replace('>Compliance<', '>Active Signals<');
  res = res.replace('>Reports<', '>Incidents<');

  // Chart and Recent Alerts in preview
  res = res.replace('Threat Activity', 'DNS Probe Activity & Latency Baseline');
  res = res.replace('Detections vs. automated responses', 'Continuous round-trip latency across 1.1.1.1, 8.8.8.8, 9.9.9.9');
  res = res.replace('Recent Alerts', 'Evidence & Baseline Assessment');
  res = res.replace('Anomalous login from new re...', 'Active Signals: 0 Anomalies Detected');
  res = res.replace('Critical · identity-provider · 2m', 'Resolvers: 1.1.1.1 (OK), 8.8.8.8 (OK), 9.9.9.9 (OK)');
  res = res.replace('Privilege escalation attempt', 'Incidents: 0 Active Incidents');
  res = res.replace('High · server-04 · 14m', 'Multi-signal correlation verified against baseline');
  res = res.replace('Expiring TLS certificate', 'Telemetry Rule: No Data → No Metric');
  res = res.replace('Medium · api-gateway · 1h', 'Authoritative nameservers responding within expected bounds');

  // 5. Section 4: Telemetry Sources & Resolvers (formerly "Protecting industry leaders")
  res = res.replace('Protecting industry leaders', 'DNS Telemetry Sources & Resolvers');
  res = res.replace('And 10,000+ more', 'Multi-Vantage Observation');

  // Replace fake logos with clean technical source badges
  const fakeLogosDivRegex = /<div class="flex flex-1 flex-wrap items-center justify-evenly gap-x-8 gap-y-6 px-8 py-7">[\s\S]*?<\/div>/;
  const newSourcesHtml = `<div class="flex flex-1 flex-wrap items-center justify-evenly gap-x-8 gap-y-4 px-8 py-7 font-mono text-xs font-semibold tracking-wider text-muted-foreground">
    <span class="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Cloudflare 1.1.1.1</span>
    <span class="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Google DNS 8.8.8.8</span>
    <span class="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"><span class="h-2 w-2 rounded-full bg-emerald-500"></span>Quad9 9.9.9.9</span>
    <span class="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"><span class="h-2 w-2 rounded-full bg-blue-500"></span>Authoritative NS</span>
    <span class="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5"><span class="h-2 w-2 rounded-full bg-purple-500"></span>Local Recursive</span>
  </div>`;
  res = res.replace(fakeLogosDivRegex, newSourcesHtml);

  // 6. Section 5: CoverageGrid (Pipeline Flow)
  res = res.replace('Total visibility across your entire infrastructure', 'How DNS_X Works: From Real Observation to Operations');
  res = res.replace('Explore the platform', 'Inspect Operations Flow');

  // 7. Section 6: Core Capabilities
  res = res.replace(
    'One platform that<!-- --> <span class="font-sans font-semibold tracking-tight">sees</span>,<!-- --> <span class="font-sans font-semibold tracking-tight">stops</span>, and<!-- --> <span class="font-sans font-semibold tracking-tight">seals</span> <!-- -->every threat',
    'Core Capabilities:<!-- --> <span class="font-sans font-semibold tracking-tight">Evidence-Backed</span>,<!-- --> <span class="font-sans font-semibold tracking-tight">Baseline-Aware</span>,<!-- --> and<!-- --> <span class="font-sans font-semibold tracking-tight">Deterministic</span>'
  );
  res = res.replace(
    'Sentinel collapses your entire security stack into a single system of record — built to detect, respond, and prove control without the integration tax.',
    'DNS_X establishes empirical domain baselines, isolates genuine signals, and provides operators with immediate evidence to investigate and resolve DNS issues.'
  );

  // Core capability cards:
  res = res.replace('Unified signal, zero noise', 'REAL DNS OBSERVATION');
  res = res.replace(
    'Every alert, log, and identity event flows into one correlated graph — so your team chases real threats instead of triaging dashboards.',
    'Measure actual resolver and authoritative DNS behavior with precision active probes and passive packet captures.'
  );
  res = res.replace('Detection · Sentinel Core', 'Pillar 01 · Authentic Wire Probing');

  res = res.replace('Response in milliseconds', 'BASELINE INTELLIGENCE');
  res = res.replace(
    'Automated playbooks isolate compromised hosts and revoke access the instant a pattern matches, long before an analyst opens a ticket.',
    'Learn target-specific normal behavior before identifying meaningful deviations, eliminating arbitrary static thresholds.'
  );
  res = res.replace('Response · Automated Playbooks', 'Pillar 02 · Target-Specific Models');

  res = res.replace('Continuous compliance', 'EVIDENCE-BACKED INCIDENTS');
  res = res.replace(
    'Every control maps to evidence in real time. Generate audit-ready reports for SOC 2, ISO 27001, and HIPAA in minutes instead of weeks.',
    'Separate observations, signals, and incidents instead of generating noisy alerts. Incidents require multi-sample correlation.'
  );
  res = res.replace('Governance · Audit Ready', 'Pillar 03 · Multi-Signal Correlation');

  // 8. Section 7: The Problem
  res = res.replace('The challenge', 'THE OPERATIONAL REALITY');
  res = res.replace(
    'A unified platform gives your team an edge,<!-- --> <span class="font-sans font-semibold tracking-tight">but stitching tools</span> <!-- -->together comes with<!-- --> <span class="font-sans font-semibold tracking-tight">tradeoffs</span>',
    'DNS failures rarely begin<!-- --> <span class="font-sans font-semibold tracking-tight">with an obvious</span> <!-- -->complete<!-- --> <span class="font-sans font-semibold tracking-tight">outage</span>'
  );

  res = res.replace('Alert Fatigue', 'Degradation Precedes Failure');
  res = res.replace(
    'Disconnected tools flood your team with noise, burying the signals that actually matter.',
    'Latency creep, intermittent resolver timeouts, and localized SERVFAIL bursts accumulate quietly long before catastrophic total downtime occurs.'
  );

  res = res.replace('The Coverage Gap', 'Noisy Alerts vs. Context');
  res = res.replace(
    'Every new vendor adds another blind spot, and stitching them together is a long-term burden.',
    'Generic threshold monitoring fires endless false alarms during routine network blips while operators actually need domain-specific baseline context.'
  );

  // 9. Section 9: Use Cases (formerly Spotify)
  res = res.replace(
    'unified every security signal across cloud, endpoint, and identity — giving each team one provable source of truth.',
    'Engineered for mission-critical DNS operations across edge networks, resolver clusters, and authoritative zones.'
  );
  res = res.replace(
    'Spotify replaced six disconnected tools with Sentinel, wiring detection, response, and audit into a single governed pipeline — and cut mean time to respond by 10×.',
    'DNS Operations teams monitor availability; Infrastructure teams diagnose resolver bottlenecks; Security teams detect abnormal NXDOMAIN surges; and Self-Hosted operators keep full telemetry custody within their perimeter.'
  );
  res = res.replace('Read the case study', 'Explore NOC Capabilities');
  res = res.replace('href="#case-study"', 'href="/auth"');

  // 10. Section 10: Pricing / Deployment Models
  res = res.replace('One platform, priced to scale with your team', 'Deployment Models Engineered for Any Infrastructure');
  res = res.replace(
    'Every plan runs the full Sentinel detection engine. Add retention, automation, and governance as your program grows — cancel anytime.',
    'Deploy DNS_X as a lightweight self-hosted node within your secure perimeter, or scale across distributed multi-resolver cluster environments.'
  );

  // 11. Section 12: Final CTA
  res = res.replace('Take control of every threat across your org', 'See the evidence behind your DNS.');
  res = res.replace(
    'Unify detection, response, and governance on one platform — and give your team a single line of sight from day one.',
    'Analyze a domain and move from raw DNS observations to operational intelligence.'
  );
  res = res.replace('Book a demo', 'Open NOC');
  res = res.replaceAll('href="#demo"', 'href="/auth"');
  res = res.replaceAll('href="#get-started"', 'href="/auth"');

  // 12. Footer
  res = res.replace('aria-label="Sentinel home"', 'aria-label="DNS_X home"');
  res = res.replace('>Platform<', '>Network Operations Center<');
  res = res.replace('>Pricing<', '>DNS Monitoring<');
  res = res.replace('>Customers<', '>Evidence & Baselines<');
  res = res.replace('>Integrations<', '>Incidents<');

  res = res.replace('>Documentation<', '>Documentation<');
  res = res.replace('>Developers<', '>Architecture<');
  res = res.replace('>Changelog<', '>GitHub<');
  res = res.replace('>System Status<', '>Live Probing Status<');

  return res;
}

// Update public/landing.html
const landingHtml = fs.readFileSync('public/landing.html', 'utf8');
const updatedLandingHtml = transformHtml(landingHtml);
fs.writeFileSync('public/landing.html', updatedLandingHtml, 'utf8');
console.log('Transformed public/landing.html, len:', updatedLandingHtml.length);

// Update landing page/index.html
if (fs.existsSync('landing page/index.html')) {
  const lpHtml = fs.readFileSync('landing page/index.html', 'utf8');
  const updatedLpHtml = transformHtml(lpHtml);
  fs.writeFileSync('landing page/index.html', updatedLpHtml, 'utf8');
  console.log('Transformed landing page/index.html, len:', updatedLpHtml.length);
}

// Update inline_scripts.js
if (fs.existsSync('public/js/inline_scripts.js')) {
  let inlineJs = fs.readFileSync('public/js/inline_scripts.js', 'utf8');
  let originalInlineLen = inlineJs.length;

  inlineJs = inlineJs.replaceAll('Sentinel', 'DNS_X');
  inlineJs = inlineJs.replace(
    'Secure your Enterprise Stack',
    'DNS Infrastructure Intelligence,'
  );
  inlineJs = inlineJs.replace(
    'at AI Speed',
    'Built From Real Evidence.'
  );
  inlineJs = inlineJs.replace(
    'Sentinel gives security teams the building blocks for a unified platform that meets complex compliance needs and adapts as fast as threats evolve.',
    'Monitor DNS behavior, establish live baselines, detect abnormal resolution patterns, and investigate incidents from one focused operations console.'
  );
  inlineJs = inlineJs.replace(
    'Take control of every threat across your org',
    'See the evidence behind your DNS.'
  );
  inlineJs = inlineJs.replace(
    'Unify detection, response, and governance on one platform — and give your team a single line of sight from day one.',
    'Analyze a domain and move from raw DNS observations to operational intelligence.'
  );

  fs.writeFileSync('public/js/inline_scripts.js', inlineJs, 'utf8');
  console.log('Updated public/js/inline_scripts.js, delta:', inlineJs.length - originalInlineLen);
}
