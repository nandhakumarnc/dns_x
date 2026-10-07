import fs from 'fs';

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let text = fs.readFileSync(filePath, 'utf8');
  let originalLen = text.length;

  // 1. Navbar links
  text = text.replace('"Platform"', '"Operations"');
  text = text.replace('"Customers"', '"Baselines"');
  text = text.replace('"Pricing"', '"Architecture"');
  text = text.replace('Platform</button>', 'Operations</button>');
  text = text.replace('>Customers<', '>Baselines<');
  text = text.replace('>Pricing<', '>Architecture<');

  // 2. NOC Preview Window Header & Sidebar
  text = text.replaceAll('Security Overview', 'DNS_X NOC — Target Health Preview');
  text = text.replaceAll('Last 24 hours · Global', 'Target: example.com · Baseline Aware Vantage');
  text = text.replaceAll('All systems secure', 'Target Health: NORMAL');
  text = text.replaceAll('Updated just now', 'Real Probe Telemetry');

  // Sidebar navigation in preview
  text = text.replaceAll('"Overview"', '"Target Health"');
  text = text.replaceAll('"Threats"', '"Response Latency"');
  text = text.replaceAll('"Endpoints"', '"DNS Probe Activity"');
  text = text.replaceAll('"Cloud"', '"Resolver Status"');
  text = text.replaceAll('"Compliance"', '"Active Signals"');
  text = text.replaceAll('"Reports"', '"Incidents"');

  // 3. Top 4 metric cards
  text = text.replaceAll('"Threats Blocked"', '"Target Health"');
  text = text.replaceAll('"12,847"', '"HEALTHY"');
  text = text.replaceAll('"14.2%"', '"Normal Baseline"');

  text = text.replaceAll('"Active Endpoints"', '"Response Latency"');
  text = text.replaceAll('"3,204"', '"18.4ms"');
  text = text.replaceAll('"2.1%"', '"Auth: 14ms"');

  text = text.replaceAll('"Compliance Score"', '"Resolution Failure Rate"');
  text = text.replaceAll('"98.6%"', '"0.00%"');
  text = text.replaceAll('"0.8%"', '"0 SERVFAIL"');

  text = text.replaceAll('"Avg. Response"', '"DNS QPS"');
  text = text.replaceAll('"1.2s"', '"N/A"');
  text = text.replaceAll('"0.3s"', '"Public Target"');

  // 4. Preview Window Chart & Alerts panel
  text = text.replaceAll('Threat Activity', 'DNS Probe Activity & Latency Baseline');
  text = text.replaceAll('Detections vs. automated responses', 'Continuous round-trip latency across 1.1.1.1, 8.8.8.8, 9.9.9.9');
  text = text.replaceAll('Recent Alerts', 'Evidence & Baseline Assessment');
  text = text.replaceAll('Anomalous login from new re...', 'Active Signals: 0 Anomalies');
  text = text.replaceAll('Critical · identity-provider · 2m', 'Resolvers: 1.1.1.1 (OK), 8.8.8.8 (OK), 9.9.9.9 (OK)');
  text = text.replaceAll('Privilege escalation attempt', 'Incidents: 0 Active Incidents');
  text = text.replaceAll('High · server-04 · 14m', 'Multi-signal correlation verified against baseline');
  text = text.replaceAll('Expiring TLS certificate', 'Telemetry Rule: No Data → No Metric');
  text = text.replaceAll('Medium · api-gateway · 1h', 'Authoritative nameservers responding within expected bounds');

  fs.writeFileSync(filePath, text, 'utf8');
  console.log('Updated', filePath, 'delta:', text.length - originalLen);
}

updateFile('public/js/inline_scripts.js');
updateFile('public/landing.html');
updateFile('landing page/index.html');
