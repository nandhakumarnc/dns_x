import fs from 'fs';

let html = fs.readFileSync('public/landing.html', 'utf8');

// The enhancement script replaces the text of preview window, core capabilities, the problem, use cases, and footer
const enhancementScript = `
<script>
(function() {
  function applyDnsXContent() {
    // 1. Title
    if (document.title !== "DNS_X — DNS Infrastructure Intelligence, Built From Real Evidence") {
      document.title = "DNS_X — DNS Infrastructure Intelligence, Built From Real Evidence";
    }

    // 2. NOC Preview Window Labels
    const h2s = document.querySelectorAll('h2');
    h2s.forEach(h2 => {
      if (h2.textContent.includes('Security Overview')) {
        h2.textContent = 'DNS_X Operations Center — Live Preview';
      }
    });

    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (p.textContent.includes('Last 24 hours · Global')) {
        p.textContent = 'Target: example.com · Baseline-Aware Vantage (Preview)';
      }
      if (p.textContent.includes('Sentinel collapses your entire security stack')) {
        p.textContent = 'DNS_X establishes empirical domain baselines, isolates genuine signals, and provides operators with immediate evidence to investigate and resolve DNS issues.';
      }
      if (p.textContent.includes('Every alert, log, and identity event flows into one correlated graph')) {
        p.textContent = 'Measure actual resolver and authoritative DNS behavior with precision active probes and passive packet captures.';
      }
      if (p.textContent.includes('Automated playbooks isolate compromised hosts')) {
        p.textContent = 'Learn target-specific normal behavior before identifying meaningful deviations, eliminating arbitrary static thresholds.';
      }
      if (p.textContent.includes('Every control maps to evidence in real time')) {
        p.textContent = 'Separate observations, signals, and incidents instead of generating noisy alerts. Incidents require multi-sample correlation.';
      }
      if (p.textContent.includes('Spotify replaced six disconnected tools with Sentinel')) {
        p.textContent = 'DNS Operations teams monitor availability; Infrastructure teams diagnose resolver bottlenecks; Security teams detect abnormal NXDOMAIN surges; and Self-Hosted operators keep full telemetry custody within their perimeter.';
      }
      if (p.textContent.includes('Disconnected tools flood your team with noise')) {
        p.textContent = 'Latency creep, intermittent resolver timeouts, and localized SERVFAIL bursts accumulate quietly long before catastrophic downtime.';
      }
      if (p.textContent.includes('Every new vendor adds another blind spot')) {
        p.textContent = 'Generic threshold monitoring fires endless false alarms during routine network blips while operators actually need domain-specific baseline context.';
      }
    });

    // 3. Preview Metric Cards
    const previewCards = document.querySelectorAll('span');
    previewCards.forEach(s => {
      // Metric titles
      if (s.textContent === 'Threats Blocked') s.textContent = 'Target Health';
      if (s.textContent === 'Active Endpoints') s.textContent = 'Response Latency';
      if (s.textContent === 'Compliance Score') s.textContent = 'Resolution Failure Rate';
      if (s.textContent === 'Avg. Response') s.textContent = 'DNS QPS';
      
      // Metric values
      if (s.textContent === '12,847') s.textContent = 'HEALTHY';
      if (s.textContent === '3,204') s.textContent = '18.4ms';
      if (s.textContent === '98.6%') s.textContent = '0.00%';
      if (s.textContent === '1.2s') s.textContent = 'N/A';

      // Metric secondary indicators
      if (s.textContent.includes('14.2%')) s.textContent = 'Baseline OK';
      if (s.textContent.includes('2.1%')) s.textContent = 'Auth: 14ms';
      if (s.textContent.includes('0.8%')) s.textContent = '0 SERVFAIL';
      if (s.textContent.includes('0.3s')) s.textContent = 'Public Target';

      // Preview status
      if (s.textContent === 'All systems secure') s.textContent = 'Target Health: NORMAL';
      if (s.textContent === 'Updated just now') s.textContent = 'Real Probe Telemetry';
      if (s.textContent === 'Protecting industry leaders') s.textContent = 'DNS Telemetry Sources & Resolvers';
      if (s.textContent === 'And 10,000+ more') s.textContent = 'Live Multi-Vantage Probing';
      if (s.textContent === 'Detection · Sentinel Core') s.textContent = 'Pillar 01 · Authentic Wire Probing';
      if (s.textContent === 'Response · Automated Playbooks') s.textContent = 'Pillar 02 · Target-Specific Models';
      if (s.textContent === 'Governance · Audit Ready') s.textContent = 'Pillar 03 · Multi-Signal Correlation';
      if (s.textContent === 'The challenge') s.textContent = 'THE OPERATIONAL REALITY';
    });

    // 4. Sidebar links in preview window
    const previewNavLinks = document.querySelectorAll('span');
    previewNavLinks.forEach(s => {
      if (s.textContent === 'Overview') s.textContent = 'Target Health';
      if (s.textContent === 'Threats') s.textContent = 'Response Latency';
      if (s.textContent === 'Endpoints') s.textContent = 'DNS Probe Activity';
      if (s.textContent === 'Cloud') s.textContent = 'Resolver Status';
      if (s.textContent === 'Compliance') s.textContent = 'Active Signals';
      if (s.textContent === 'Reports') s.textContent = 'Incidents';
    });

    // 5. Chart and recent alerts
    const textNodes = document.querySelectorAll('h3, span, div');
    textNodes.forEach(n => {
      if (n.textContent === 'Threat Activity') n.textContent = 'DNS Probe Activity & Latency Baseline';
      if (n.textContent === 'Detections vs. automated responses') n.textContent = 'Continuous round-trip latency across 1.1.1.1, 8.8.8.8, 9.9.9.9';
      if (n.textContent === 'Recent Alerts') n.textContent = 'Evidence & Baseline Assessment';
      if (n.textContent === 'Anomalous login from new re...') n.textContent = 'Active Signals: 0 Anomalies';
      if (n.textContent === 'Privilege escalation attempt') n.textContent = 'Incidents: 0 Active Incidents';
      if (n.textContent === 'Expiring TLS certificate') n.textContent = 'Telemetry Rule: No Data → No Metric';
      if (n.textContent.includes('unified every security signal across cloud, endpoint, and identity')) {
        n.textContent = 'Engineered for mission-critical DNS operations across edge networks, resolver clusters, and authoritative zones.';
      }
      if (n.textContent === 'Unified signal, zero noise') n.textContent = 'REAL DNS OBSERVATION';
      if (n.textContent === 'Response in milliseconds') n.textContent = 'BASELINE INTELLIGENCE';
      if (n.textContent === 'Continuous compliance') n.textContent = 'EVIDENCE-BACKED INCIDENTS';
      if (n.textContent === 'Alert Fatigue') n.textContent = 'Degradation Precedes Failure';
      if (n.textContent === 'The Coverage Gap') n.textContent = 'Noisy Alerts vs. Context';
    });

    // 6. Section 6 heading (Core Capabilities)
    const allH2 = document.querySelectorAll('h2');
    allH2.forEach(h2 => {
      if (h2.textContent.includes('One platform that') && h2.textContent.includes('sees')) {
        h2.innerHTML = 'Core Capabilities: <span class="font-sans font-semibold tracking-tight">Evidence-Backed</span>, <span class="font-sans font-semibold tracking-tight">Baseline-Aware</span>, and <span class="font-sans font-semibold tracking-tight">Deterministic</span>';
      }
      if (h2.textContent.includes('A unified platform gives your team an edge')) {
        h2.innerHTML = 'DNS failures rarely begin <span class="font-sans font-semibold tracking-tight">with an obvious</span> complete <span class="font-sans font-semibold tracking-tight">outage</span>';
      }
    });

    // 7. Case study CTA
    const caseLinks = document.querySelectorAll('a[href="#case-study"]');
    caseLinks.forEach(a => {
      a.textContent = 'Explore NOC Capabilities';
      a.href = '/auth';
    });

    // 8. Footer Links
    const footerLinks = document.querySelectorAll('footer a');
    footerLinks.forEach(a => {
      if (a.textContent === 'Platform') a.textContent = 'Network Operations Center';
      if (a.textContent === 'Pricing') a.textContent = 'DNS Monitoring';
      if (a.textContent === 'Customers') a.textContent = 'Evidence & Baselines';
      if (a.textContent === 'Integrations') a.textContent = 'Incidents';
      if (a.textContent === 'Developers') a.textContent = 'Architecture';
      if (a.textContent === 'Changelog') a.textContent = 'GitHub';
      if (a.textContent === 'System Status') a.textContent = 'Live Probing Status';
    });
  }

  // Run immediately and after hydration
  applyDnsXContent();
  window.addEventListener('DOMContentLoaded', applyDnsXContent);
  window.addEventListener('load', applyDnsXContent);
  setInterval(applyDnsXContent, 500);
})();
</script>
`;

if (!html.includes('applyDnsXContent')) {
  html = html.replace('</body>', `${enhancementScript}\n</body>`);
}

fs.writeFileSync('public/landing.html', html, 'utf8');
if (fs.existsSync('landing page/index.html')) {
  fs.writeFileSync('landing page/index.html', html, 'utf8');
}

console.log('Successfully injected content enhancement script into landing pages!');
