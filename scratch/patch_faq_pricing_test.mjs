import fs from 'fs';

function patchRemaining(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  let originalLen = code.length;

  // 1. Testimonials array h
  const oldTestStart = 'let h=[{quote:"The flexibility is really what made the difference.';
  const oldTestEndTarget = 'image:"/testimonials/person-3.jpg"}];function d()';
  if (code.includes(oldTestStart) && code.includes(oldTestEndTarget)) {
    const startIdx = code.indexOf(oldTestStart);
    const endIdx = code.indexOf(';function d()', startIdx);
    const newH = `let h=[
      {quote:"No Data → No Metric. Every metric, baseline, and indicator in DNS_X is calculated exclusively from authentic wire captures and verified recursive query measurements — zero synthetic filler.",name:"Principle 01",role:"REAL MEASUREMENTS",image:"/testimonials/person-1.jpg"},
      {quote:"No Telemetry → No Claim. When an internal metric cannot be directly observed from a public vantage point, it is explicitly reported as N/A rather than simulated.",name:"Principle 02",role:"TRUTH IN STATE",image:"/testimonials/person-2.jpg"},
      {quote:"No Evidence → No Incident. DNS anomalies are isolated as signals and require multi-sample, multi-resolver correlation before promoting to actionable incidents.",name:"Principle 03",role:"SIGNAL CLARITY",image:"/testimonials/person-3.jpg"},
      {quote:"No Validated Model → No AI Conclusion. Baseline deviations and machine learning explanations are backed by empirical feature attributions and transparent SHAP reasoning.",name:"Principle 04",role:"EXPLAINABLE INTELLIGENCE",image:"/testimonials/person-4.jpg"}
    ]`;
    code = code.substring(0, startIdx) + newH + code.substring(endIdx);
    console.log('Patched Testimonials (Product Principles) in', filePath);
  }

  // 2. Pricing array u
  const oldPriceStart = 'let u=[{name:"Starter",blurb:"For small teams locking down the basics."';
  const oldPriceEndTarget = 'cta:"Start free trial"}],c=[.22,1,.36,1];';
  if (code.includes(oldPriceStart) && code.includes(oldPriceEndTarget)) {
    const startIdx = code.indexOf(oldPriceStart);
    const endIdx = code.indexOf('}],c=[.22,1,.36,1];', startIdx);
    const newU = `let u=[
      {name:"Community Self-Hosted",blurb:"100% open-source single-node deployment for internal labs and engineering teams.",monthly:0,yearly:0,icon:"bolt",features:["Full NOC Console (React + Vite)","Local Scapy & dnspython Probing","Real-time WebSocket Telemetry","Target-Specific Baseline Engine","SQLite / Supabase Local Storage","Zero Telemetry Fabrication"],cta:"Deploy Self-Hosted"},
      {name:"Distributed Cluster",blurb:"Multi-vantage point monitoring for production DNS infrastructure and authoritative zones.",monthly:0,yearly:0,icon:"plus",features:["Everything in Self-Hosted","Multi-Resolver Probing (1.1.1.1, 8.8.8.8, 9.9.9.9)","Authoritative vs Recursive Separation","XGBoost & SHAP Anomaly Detection","Evidence-Backed Incident Correlation","PostgreSQL / Supabase Time-Series"],cta:"Launch DNS_X NOC",highlighted:!0},
      {name:"Enterprise Dedicated",blurb:"Air-gapped and hardened deployments for telecommunication and service provider networks.",monthly:0,yearly:0,icon:"bars",features:["Everything in Distributed Cluster","High-Volume eBPF Query Taps","Custom Compliance & SLA Reporting","Hardware Security Module (HSM) Support","Air-gapped On-Premises Telemetry","Direct Operational Guidance"],cta:"Contact Ops Team"}
    ]`;
    code = code.substring(0, startIdx) + newU + code.substring(endIdx + 1);
    console.log('Patched Pricing (Deployment Options) in', filePath);
  }

  // 3. Pricing section header
  const oldPricingTitle = 'One platform, priced to scale with your team';
  const newPricingTitle = 'Deployment Models Engineered for Any Infrastructure';
  if (code.includes(oldPricingTitle)) {
    code = code.replaceAll(oldPricingTitle, newPricingTitle);
    console.log('Patched Pricing Title in', filePath);
  }

  const oldPricingSub = 'Every plan runs the full Sentinel detection engine. Add retention, automation, and governance as your program grows — cancel anytime.';
  const newPricingSub = 'Deploy DNS_X as a lightweight self-hosted node within your secure perimeter, or scale across distributed multi-resolver cluster environments.';
  if (code.includes(oldPricingSub)) {
    code = code.replaceAll(oldPricingSub, newPricingSub);
    console.log('Patched Pricing Subtitle in', filePath);
  }

  // 4. FAQ array l
  const oldFaqEndTarget = 'private cloud. You keep full ownership of the data plane while still receiving managed updates to the detection engine."}],u=[.22,1,.36,1];function c';
  if (code.includes(oldFaqEndTarget)) {
    const endFaqIdx = code.indexOf('}],u=[.22,1,.36,1];function c');
    const startFaqIdx = code.lastIndexOf('let l=[{question:', endFaqIdx);
    if (startFaqIdx !== -1) {
      const newL = `let l=[
        {question:"What can DNS_X monitor?",answer:"DNS_X observes authoritative nameservers, recursive resolvers, enterprise DNS forwarders, and public domain resolution behavior. It tracks latency distributions, NXDOMAIN/SERVFAIL error bursts, record drift, TTL anomalies, and protocol compliance (UDP/TCP/EDNS0)."},
        {question:"How does it establish baselines?",answer:"DNS_X builds target-specific operational baselines using historical distributions of response latencies, query frequency, and status codes. Instead of rigid global thresholds, it evaluates deviations relative to that specific domain's verified normal behavior."},
        {question:"Does it fabricate traffic?",answer:"Never. DNS_X strictly upholds the core principles: 'No Data → No Metric' and 'No Telemetry → No Claim'. Probing is measured against live networks and passive query taps without simulated or synthetic filler."},
        {question:"Public vs. private infrastructure monitoring?",answer:"DNS_X clearly delineates public target vantage points (external resolution paths and authoritative health) from private internal infrastructure telemetry (where query volumes, internal forwarders, and packet captures are available)."},
        {question:"Signals vs. incidents?",answer:"Signals are individual statistical anomalies or health deviations (e.g., transient latency spikes or single-resolver timeouts). Incidents are created only when correlated multi-signal evidence proves a sustained, actionable operational failure."},
        {question:"Can DNS_X be self-hosted?",answer:"Yes. DNS_X is fully self-hostable via Docker or Kubernetes. The entire telemetry pipeline—including Scapy/dnspython probes, the Node.js API, PostgreSQL database, and React console—runs completely within your secure perimeter."}
      ]`;
      code = code.substring(0, startFaqIdx) + newL + code.substring(endFaqIdx + 1);
      console.log('Patched FAQ array in', filePath);
    }
  }

  // FAQ subtitle
  const oldFaqSub = "Everything you need to know about deploying Sentinel. Can't find an answer? Our security team is one message away.";
  const newFaqSub = "Everything you need to know about operating DNS_X. Have questions about probe vantage points or self-hosted deployment? Reach out to our team.";
  if (code.includes(oldFaqSub)) {
    code = code.replaceAll(oldFaqSub, newFaqSub);
    console.log('Patched FAQ subtitle in', filePath);
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Finished patching', filePath, 'size delta:', code.length - originalLen);
}

patchRemaining('public/_next/static/chunks/15ac4acf6b48e0d3.js');
patchRemaining('landing page/_next/static/chunks/15ac4acf6b48e0d3.js');
