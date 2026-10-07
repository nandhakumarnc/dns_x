import fs from 'fs';

function updateChunk(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }
  let code = fs.readFileSync(filePath, 'utf8');
  let originalLen = code.length;

  // 1. Hero text and badge
  const oldHeroTitle = 'children:["Secure your Enterprise Stack"," ",(0,t.jsx)("span",{className:"font-sans font-medium tracking-tight",children:"at AI Speed"})]';
  const newHeroTitle = 'children:["DNS Infrastructure Intelligence,"," ",(0,t.jsx)("span",{className:"font-sans font-medium tracking-tight",children:"Built From Real Evidence."})]';
  if (code.includes(oldHeroTitle)) {
    code = code.replace(oldHeroTitle, newHeroTitle);
    console.log('Updated Hero title in', filePath);
  }

  const oldHeroSubtext = 'Sentinel gives security teams the building blocks for a unified platform that meets complex compliance needs and adapts as fast as threats evolve.';
  const newHeroSubtext = 'Monitor DNS behavior, establish live baselines, detect abnormal resolution patterns, and investigate incidents from one focused operations console.';
  if (code.includes(oldHeroSubtext)) {
    code = code.replace(oldHeroSubtext, newHeroSubtext);
    console.log('Updated Hero subtext in', filePath);
  }

  const oldHeroCTAs = '(0,t.jsx)(n.CutButton,{variant:"solid",href:"#get-started",children:"Get Started"}),(0,t.jsx)(n.CutButton,{variant:"outline",href:"#talk-to-us",children:"Talk to Us"})';
  const newHeroCTAs = '(0,t.jsx)(n.CutButton,{variant:"solid",href:"/auth",children:"Analyze a Domain"}),(0,t.jsx)(n.CutButton,{variant:"outline",href:"/auth",children:"Open NOC"})';
  if (code.includes(oldHeroCTAs)) {
    code = code.replace(oldHeroCTAs, newHeroCTAs);
    console.log('Updated Hero CTAs in', filePath);
  }

  // Hero status badge insertion:
  const heroBadgeTarget = 'className:"relative mx-auto flex max-w-2xl flex-col items-center pb-12 pt-32 text-center sm:pt-40",children:[(0,t.jsx)("div",{"aria-hidden":"true",className:"pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-[150%] w-[160%] -translate-x-1/2 -translate-y-1/2",style:{background:"radial-gradient(ellipse at center, var(--background) 0%, color-mix(in srgb, var(--background) 78%, transparent) 45%, transparent 72%)"}}),';
  const heroBadgeRepl = heroBadgeTarget + '(0,t.jsx)(r.motion.div,{variants:s,transition:o,className:"mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground backdrop-blur-md",children:"REAL DNS TELEMETRY · BASELINE AWARE · SELF-HOSTABLE"}),';
  if (code.includes(heroBadgeTarget) && !code.includes('REAL DNS TELEMETRY · BASELINE AWARE')) {
    code = code.replace(heroBadgeTarget, heroBadgeRepl);
    console.log('Inserted Hero status badge in', filePath);
  }

  // 2. FinalCta
  const oldFinalTitle = 'children:"Take control of every threat across your org"';
  const newFinalTitle = 'children:"See the evidence behind your DNS."';
  if (code.includes(oldFinalTitle)) {
    code = code.replace(oldFinalTitle, newFinalTitle);
    console.log('Updated FinalCta title in', filePath);
  }

  const oldFinalSubtext = 'children:"Unify detection, response, and governance on one platform — and give your team a single line of sight from day one."';
  const newFinalSubtext = 'children:"Analyze a domain and move from raw DNS observations to operational intelligence."';
  if (code.includes(oldFinalSubtext)) {
    code = code.replace(oldFinalSubtext, newFinalSubtext);
    console.log('Updated FinalCta subtext in', filePath);
  }

  const oldFinalButtons = '(0,t.jsx)(i.CutButton,{variant:"solid",href:"#get-started",children:"Get started"}),(0,t.jsx)(i.CutButton,{variant:"outline",href:"#demo",children:"Book a demo"})';
  const newFinalButtons = '(0,t.jsx)(i.CutButton,{variant:"solid",href:"/auth",children:"Launch DNS_X NOC"})';
  if (code.includes(oldFinalButtons)) {
    code = code.replace(oldFinalButtons, newFinalButtons);
    console.log('Updated FinalCta button in', filePath);
  }

  // 3. Nav brand
  const oldNavBrand = 'className:"text-[17px] font-semibold tracking-tight",children:"Sentinel"';
  const newNavBrand = 'className:"text-[17px] font-semibold tracking-tight",children:"DNS_X"';
  if (code.includes(oldNavBrand)) {
    code = code.replaceAll(oldNavBrand, newNavBrand);
    console.log('Updated Nav brand to DNS_X in', filePath);
  }

  // 4. Testimonials -> Product Principles
  const oldTestKicker = 'children:"Real reviews from real customers"';
  const newTestKicker = 'children:"WHY DNS_X · PRODUCT PRINCIPLES"';
  if (code.includes(oldTestKicker)) {
    code = code.replace(oldTestKicker, newTestKicker);
    console.log('Updated Testimonials kicker in', filePath);
  }

  // Replace testimonial quotes with DNS_X product principles
  const oldQuotesTarget = 'let h=[{quote:"The flexibility is really what made the difference.';
  if (code.includes(oldQuotesTarget)) {
    const endQuotesIdx = code.indexOf('];var l=', code.indexOf(oldQuotesTarget));
    if (endQuotesIdx !== -1) {
      const newQuotesCode = `let h=[
        {quote:"No Data → No Metric. Every graph, signal, and baseline in DNS_X is derived strictly from verified authoritative and recursive DNS wire observations — zero synthetic filler.",name:"Principle 01",role:"REAL MEASUREMENTS",image:"/testimonials/person-1.jpg"},
        {quote:"No Telemetry → No Claim. When an internal metric cannot be directly observed from a public target, it is explicitly reported as N/A rather than simulated.",name:"Principle 02",role:"TRUTH IN STATE",image:"/testimonials/person-2.jpg"},
        {quote:"No Evidence → No Incident. DNS anomalies are isolated as signals and require multi-sample, multi-resolver correlation before promoting to actionable incidents.",name:"Principle 03",role:"SIGNAL CLARITY",image:"/testimonials/person-3.jpg"},
        {quote:"No Validated Model → No AI Conclusion. Baseline deviations and machine learning explanations are backed by empirical feature attributions and transparent SHAP reasoning.",name:"Principle 04",role:"EXPLAINABLE INTELLIGENCE",image:"/testimonials/person-4.jpg"}
      ]`;
      code = code.substring(0, code.indexOf(oldQuotesTarget)) + newQuotesCode + code.substring(endQuotesIdx + 1);
      console.log('Replaced Testimonials quotes with Product Principles in', filePath);
    }
  }

  // 5. Stats -> Architecture Highlights
  const oldStatsTitle = 'children:["Real outcomes from teams running"," ",(0,t.jsx)("span",{className:"font-sans font-semibold tracking-tight",children:"Sentinel"})]';
  const newStatsTitle = 'children:["Deterministic Architecture for"," ",(0,t.jsx)("span",{className:"font-sans font-semibold tracking-tight",children:"DNS Operations"})]';
  if (code.includes(oldStatsTitle)) {
    code = code.replace(oldStatsTitle, newStatsTitle);
    console.log('Updated Stats title in', filePath);
  }

  const oldStatsSub = 'children:"From faster detection to a leaner stack, security leaders cut the noise and consolidate tooling the moment Sentinel goes live — with full governance from day one."';
  const newStatsSub = 'children:"From raw packet probing to multi-resolver telemetry correlation, DNS_X is engineered for deterministic DNS visibility and zero alert fatigue."';
  if (code.includes(oldStatsSub)) {
    code = code.replace(oldStatsSub, newStatsSub);
    console.log('Updated Stats subtitle in', filePath);
  }

  // Replace stats array W and function q
  const oldStatsWTarget = 'W=[{value:97,suffix:"%",label:"Reduction in alert noise",brand:{slug:"stripe_wordmark"';
  if (code.includes(oldStatsWTarget)) {
    const endWIdx = code.indexOf('}],X=', code.indexOf(oldStatsWTarget));
    if (endWIdx !== -1) {
      const newWCode = `W=[
        {value:100,suffix:"%",label:"Evidence-backed incidents with zero synthetic traffic",brand:{name:"Authentic Wire"}},
        {value:4,suffix:" Tiers",label:"Multi-resolver correlation (Authoritative, Recursive, Public, Forwarders)",brand:{name:"Multi-Vantage"}},
        {value:0,suffix:" Noise",label:"Static thresholds eliminated by target-specific baselines",brand:{name:"Baseline Aware"}}
      ]`;
      code = code.substring(0, code.indexOf(oldStatsWTarget)) + newWCode + code.substring(endWIdx + 2);
      console.log('Replaced Stats array W in', filePath);
    }
  }

  // Replace function q (brand logo renderer) with clean badge
  const oldQTarget = 'function q({brand:e}){let n=`url(/logos/${e.slug}.svg) center / contain no-repeat`;return(0,t.jsx)("span",{role:"img","aria-label":e.name,style:{width:e.width,height:e.height,mask:n,WebkitMask:n},className:"block shrink-0 bg-foreground opacity-50"})}';
  const newQRepl = 'function q({brand:e}){return(0,t.jsx)("span",{className:"inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground",children:e.name})}';
  if (code.includes(oldQTarget)) {
    code = code.replace(oldQTarget, newQRepl);
    console.log('Replaced brand logo function q with architecture badge in', filePath);
  }

  // 6. FAQ items
  const oldFaqTarget = 'question:"Is our data secure and compliant?"';
  if (code.includes(oldFaqTarget)) {
    // Find enclosing array l
    const startLIdx = code.lastIndexOf('let l=[{question:', code.indexOf(oldFaqTarget));
    const endLIdx = code.indexOf('}],u=', startLIdx);
    if (startLIdx !== -1 && endLIdx !== -1) {
      const newFaqArray = `let l=[
        {question:"What can DNS_X monitor?",answer:"DNS_X observes authoritative nameservers, recursive resolvers, enterprise DNS forwarders, and public domain resolution behavior. It tracks latency distributions, NXDOMAIN/SERVFAIL error bursts, record drift, TTL anomalies, and protocol compliance (UDP/TCP/EDNS0)."},
        {question:"How does it establish baselines?",answer:"DNS_X builds target-specific operational baselines using historical distributions of response latencies, query frequency, and status codes. Instead of rigid global thresholds, it evaluates deviations relative to that specific domain's verified normal behavior."},
        {question:"Does it fabricate traffic?",answer:"Never. DNS_X strictly upholds the core principles: 'No Data → No Metric' and 'No Telemetry → No Claim'. Probing is measured against live networks and passive query taps without simulated or synthetic filler."},
        {question:"Public vs. private infrastructure monitoring?",answer:"DNS_X clearly delineates public target vantage points (external resolution paths and authoritative health) from private internal infrastructure telemetry (where query volumes, internal forwarders, and packet captures are available)."},
        {question:"Signals vs. incidents?",answer:"Signals are individual statistical anomalies or health deviations (e.g., transient latency spikes or single-resolver timeouts). Incidents are created only when correlated multi-signal evidence proves a sustained, actionable operational failure."},
        {question:"Can DNS_X be self-hosted?",answer:"Yes. DNS_X is fully self-hostable via Docker or Kubernetes. The entire telemetry pipeline—including Scapy/dnspython probes, the Node.js API, PostgreSQL database, and React console—runs completely within your secure perimeter."}
      ]`;
      code = code.substring(0, startLIdx) + newFaqArray + code.substring(endLIdx + 2);
      console.log('Replaced FAQ array in', filePath);
    }
  }

  // 7. Pricing -> Deployment Tiers
  const oldPricingCards = 'let u=[{name:"Starter",blurb:"For small teams locking down the basics."';
  if (code.includes(oldPricingCards)) {
    const endPricingIdx = code.indexOf('}],p=e=>', code.indexOf(oldPricingCards));
    if (endPricingIdx !== -1) {
      const newPricingArray = `let u=[
        {name:"Community Self-Hosted",blurb:"100% open-source single-node deployment for internal labs and engineering teams.",monthly:0,yearly:0,icon:"bolt",features:["Full NOC Console (React + Vite)","Local Scapy & dnspython Probing","Real-time WebSocket Telemetry","Target-Specific Baseline Engine","SQLite / Supabase Local Storage","Zero Telemetry Fabrication"],cta:"Deploy Self-Hosted"},
        {name:"Distributed Cluster",blurb:"Multi-vantage point monitoring for production DNS infrastructure and authoritative zones.",monthly:0,yearly:0,icon:"plus",features:["Everything in Self-Hosted","Multi-Resolver Probing (1.1.1.1, 8.8.8.8, 9.9.9.9)","Authoritative vs Recursive Separation","XGBoost & SHAP Anomaly Detection","Evidence-Backed Incident Correlation","PostgreSQL / Supabase Time-Series"],cta:"Launch DNS_X NOC",highlighted:!0},
        {name:"Enterprise Dedicated",blurb:"Air-gapped and hardened deployments for telecommunication and service provider networks.",monthly:0,yearly:0,icon:"bars",features:["Everything in Distributed Cluster","High-Volume eBPF Query Taps","Custom Compliance & SLA Reporting","Hardware Security Module (HSM) Support","Air-gapped On-Premises Telemetry","Direct Operational Guidance"],cta:"Contact Ops Team"}
      ]`;
      code = code.substring(0, code.indexOf(oldPricingCards)) + newPricingArray + code.substring(endPricingIdx + 2);
      console.log('Replaced Pricing cards with Deployment Tiers in', filePath);
    }
  }

  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Finished updating', filePath, 'size delta:', code.length - originalLen);
}

updateChunk('public/_next/static/chunks/15ac4acf6b48e0d3.js');
updateChunk('landing page/_next/static/chunks/15ac4acf6b48e0d3.js');
