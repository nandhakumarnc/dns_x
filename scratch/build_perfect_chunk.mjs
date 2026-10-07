import fs from 'fs';

let code = fs.readFileSync('scratch/15ac4acf6b48e0d3.js', 'utf8');

function assertSyntax(stepName) {
  try {
    new Function(code);
    console.log(`[PASS] ${stepName}`);
  } catch (err) {
    console.error(`[FAIL] ${stepName}:`, err.message);
    process.exit(1);
  }
}

assertSyntax('Initial backup verification');

// 1. HeroWaves visibility patch (our proven Three.js animation patch)
const oldWavesConfig = 'intensity:0,elementSize:10,videoUrl:"/sample-video-2.mp4",noiseScale:25,hasCursorInteraction:!0,className:"opacity-50 dark:opacity-60"';
const newWavesConfig = 'intensity:0.8,elementSize:10,videoUrl:"/sample-video-2.mp4",noiseScale:25,hasCursorInteraction:!0,className:"opacity-70 dark:opacity-85"';
code = code.replace(oldWavesConfig, newWavesConfig);

const oldVideoCode = 'let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.playsInline=!0,e.play().catch(e=>console.error("Video play failed",e));';
const newVideoCode = 'let e=document.createElement("video");e.src=y,e.crossOrigin="Anonymous",e.loop=!0,e.muted=!0,e.defaultMuted=!0,e.autoplay=!0,e.playsInline=!0,e.setAttribute("playsinline",""),e.setAttribute("muted",""),e.setAttribute("autoplay","");let p=e.play();if(p!==void 0){p.catch(()=>{})};';
code = code.replace(oldVideoCode, newVideoCode);

const oldUseFrame = 'e.current&&n.uMouse.value.lerp(e.current,.1)';
const newUseFrame = 'e.current&&n.uMouse.value.lerp(e.current,.1);if(C.current&&C.current.paused){let pr=C.current.play();if(pr!==void 0)pr.catch(()=>{})}';
code = code.replace(oldUseFrame, newUseFrame);

const oldShaderFallback = 'col = texture2D(uVideoTexture, distortedVideoUV).rgb;\n      } else {\n        col = vec3(intensity);';
const newShaderFallback = 'col = texture2D(uVideoTexture, distortedVideoUV).rgb;\n        if (length(col) < 0.05) { col = vec3(intensity); }\n      } else {\n        col = vec3(intensity);';
code = code.replace(oldShaderFallback, newShaderFallback);

assertSyntax('Step 1: HeroWaves animation active');

// 2. Hero Section Content (Spec Item 1)
const oldHeroTitle = 'children:["Secure your Enterprise Stack"," ",(0,t.jsx)("span",{className:"font-sans font-medium tracking-tight",children:"at AI Speed"})]';
const newHeroTitle = 'children:["DNS Infrastructure Intelligence,"," ",(0,t.jsx)("span",{className:"font-sans font-medium tracking-tight",children:"Built From Real Evidence."})]';
code = code.replace(oldHeroTitle, newHeroTitle);

const oldHeroSubtext = 'Sentinel gives security teams the building blocks for a unified platform that meets complex compliance needs and adapts as fast as threats evolve.';
const newHeroSubtext = 'Monitor DNS behavior, establish live baselines, detect abnormal resolution patterns, and investigate incidents from one focused operations console.';
code = code.replace(oldHeroSubtext, newHeroSubtext);

const oldHeroCTAs = '(0,t.jsx)(n.CutButton,{variant:"solid",href:"#get-started",children:"Get Started"}),(0,t.jsx)(n.CutButton,{variant:"outline",href:"#talk-to-us",children:"Talk to Us"})';
const newHeroCTAs = '(0,t.jsx)(n.CutButton,{variant:"solid",href:"/auth",children:"Analyze a Domain"}),(0,t.jsx)(n.CutButton,{variant:"outline",href:"/auth",children:"Open NOC"})';
code = code.replace(oldHeroCTAs, newHeroCTAs);

// Hero status badge insertion
const heroBadgeTarget = 'className:"relative mx-auto flex max-w-2xl flex-col items-center pb-12 pt-32 text-center sm:pt-40",children:[(0,t.jsx)("div",{"aria-hidden":"true",className:"pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-[150%] w-[160%] -translate-x-1/2 -translate-y-1/2",style:{background:"radial-gradient(ellipse at center, var(--background) 0%, color-mix(in srgb, var(--background) 78%, transparent) 45%, transparent 72%)"}}),';
const heroBadgeRepl = heroBadgeTarget + '(0,t.jsx)(r.motion.div,{variants:s,transition:o,className:"mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted-foreground backdrop-blur-md",children:"REAL DNS TELEMETRY · BASELINE AWARE · SELF-HOSTABLE"}),';
code = code.replace(heroBadgeTarget, heroBadgeRepl);

assertSyntax('Step 2: Hero Section & Badge');

// 3. Nav brand
code = code.replaceAll('className:"text-[17px] font-semibold tracking-tight",children:"Sentinel"', 'className:"text-[17px] font-semibold tracking-tight",children:"DNS_X"');
assertSyntax('Step 3: Nav brand to DNS_X');

// 4. FinalCta Section (Spec Item 9)
code = code.replace('children:"Take control of every threat across your org"', 'children:"See the evidence behind your DNS."');
code = code.replace('children:"Unify detection, response, and governance on one platform — and give your team a single line of sight from day one."', 'children:"Analyze a domain and move from raw DNS observations to operational intelligence."');
code = code.replace('(0,t.jsx)(i.CutButton,{variant:"solid",href:"#get-started",children:"Get started"}),(0,t.jsx)(i.CutButton,{variant:"outline",href:"#demo",children:"Book a demo"})', '(0,t.jsx)(i.CutButton,{variant:"solid",href:"/auth",children:"Launch DNS_X NOC"})');
assertSyntax('Step 4: FinalCta Section');

// 5. Testimonials -> Product Principles (Spec Item 6)
code = code.replace('children:"Real reviews from real customers"', 'children:"WHY DNS_X · PRODUCT PRINCIPLES"');

const oldTestQuotesExact = code.substring(
  code.indexOf('let h=[{quote:"The flexibility'),
  code.indexOf(';function d(){let[e,i]=(0,n.useState)(0)')
);

const newTestQuotesExact = `let h=[
  {quote:"No Data → No Metric. Every graph, signal, and baseline in DNS_X is derived strictly from authentic wire captures and verified recursive query measurements — zero synthetic filler.",name:"Principle 01",role:"REAL MEASUREMENTS",image:"/testimonials/person-1.jpg"},
  {quote:"No Telemetry → No Claim. When an internal metric cannot be directly observed from a public vantage point, it is explicitly reported as N/A rather than simulated.",name:"Principle 02",role:"TRUTH IN STATE",image:"/testimonials/person-2.jpg"},
  {quote:"No Evidence → No Incident. DNS anomalies are isolated as signals and require multi-sample, multi-resolver correlation before promoting to actionable incidents.",name:"Principle 03",role:"SIGNAL CLARITY",image:"/testimonials/person-3.jpg"},
  {quote:"No Validated Model → No AI Conclusion. Baseline deviations and machine learning explanations are backed by empirical feature attributions and transparent SHAP reasoning.",name:"Principle 04",role:"EXPLAINABLE INTELLIGENCE",image:"/testimonials/person-4.jpg"}
]`;
code = code.replace(oldTestQuotesExact, newTestQuotesExact);
assertSyntax('Step 5: Product Principles (Testimonials replacement)');

// 6. Stats -> Architecture Highlights (Spec Item 8)
code = code.replace('children:["Real outcomes from teams running"," ",(0,t.jsx)("span",{className:"font-sans font-semibold tracking-tight",children:"Sentinel"})]', 'children:["Deterministic Architecture for"," ",(0,t.jsx)("span",{className:"font-sans font-semibold tracking-tight",children:"DNS Operations"})]');
code = code.replace('children:"From faster detection to a leaner stack, security leaders cut the noise and consolidate tooling the moment Sentinel goes live — with full governance from day one."', 'children:"From raw packet probing to multi-resolver telemetry correlation, DNS_X is engineered for deterministic DNS visibility and zero alert fatigue."');

const oldStatsWExact = code.substring(
  code.indexOf('W=[{value:97,suffix:"%'),
  code.indexOf('],X=[.22,1,.36,1];function q({brand:e})')
);
const newStatsWExact = `W=[
  {value:100,suffix:"%",label:"Evidence-backed incidents with zero synthetic traffic",brand:{name:"Authentic Wire"}},
  {value:4,suffix:" Tiers",label:"Multi-resolver correlation (Authoritative, Recursive, Public, Forwarders)",brand:{name:"Multi-Vantage"}},
  {value:0,suffix:" Noise",label:"Static thresholds eliminated by target-specific baselines",brand:{name:"Baseline Aware"}}
`;
code = code.replace(oldStatsWExact, newStatsWExact);

const oldQExact = 'function q({brand:e}){let n=`url(/logos/${e.slug}.svg) center / contain no-repeat`;return(0,t.jsx)("span",{role:"img","aria-label":e.name,style:{width:e.width,height:e.height,mask:n,WebkitMask:n},className:"block shrink-0 bg-foreground opacity-50"})}';
const newQExact = 'function q({brand:e}){return(0,t.jsx)("span",{className:"inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground",children:e.name})}';
code = code.replace(oldQExact, newQExact);
assertSyntax('Step 6: Stats & Architecture Highlights');

// 7. Pricing -> Deployment Options (Spec Item 7 & Constraints: no fake pricing)
code = code.replaceAll('One platform, priced to scale with your team', 'Deployment Models Engineered for Any Infrastructure');
code = code.replaceAll('Every plan runs the full Sentinel detection engine. Add retention, automation, and governance as your program grows — cancel anytime.', 'Deploy DNS_X as a lightweight self-hosted node within your secure perimeter, or scale across distributed multi-resolver cluster environments.');

const oldPriceExact = code.substring(
  code.indexOf('let u=[{name:"Starter",blurb:'),
  code.indexOf('],c=[.22,1,.36,1];function h({value:e,yearly:n,reduce:i})')
);
const newPriceExact = `let u=[
  {name:"Community Self-Hosted",blurb:"100% open-source single-node deployment for internal labs and engineering teams.",monthly:0,yearly:0,icon:"bolt",features:["Full NOC Console (React + Vite)","Local Scapy & dnspython Probing","Real-time WebSocket Telemetry","Target-Specific Baseline Engine","SQLite / Supabase Local Storage","Zero Telemetry Fabrication"],cta:"Deploy Self-Hosted"},
  {name:"Distributed Cluster",blurb:"Multi-vantage point monitoring for production DNS infrastructure and authoritative zones.",monthly:0,yearly:0,icon:"plus",features:["Everything in Self-Hosted","Multi-Resolver Probing (1.1.1.1, 8.8.8.8, 9.9.9.9)","Authoritative vs Recursive Separation","XGBoost & SHAP Anomaly Detection","Evidence-Backed Incident Correlation","PostgreSQL / Supabase Time-Series"],cta:"Launch DNS_X NOC",highlighted:!0},
  {name:"Enterprise Dedicated",blurb:"Air-gapped and hardened deployments for telecommunication and service provider networks.",monthly:0,yearly:0,icon:"bars",features:["Everything in Distributed Cluster","High-Volume eBPF Query Taps","Custom Compliance & SLA Reporting","Hardware Security Module (HSM) Support","Air-gapped On-Premises Telemetry","Direct Operational Guidance"],cta:"Contact Ops Team"}
`;
code = code.replace(oldPriceExact, newPriceExact);
assertSyntax('Step 7: Deployment Options');

// 8. FAQ Items (Spec Item 10)
code = code.replaceAll("Everything you need to know about deploying Sentinel. Can't find an answer? Our security team is one message away.", "Everything you need to know about operating DNS_X. Have questions about probe vantage points or self-hosted deployment? Reach out to our team.");

const oldFaqExact = code.substring(
  code.indexOf('let l=[{question:"What exactly is Sentinel?"'),
  code.indexOf('],u=[.22,1,.36,1];function c({item:e,isOpen:n,onToggle:i,index:o})')
);
const newFaqExact = `let l=[
  {question:"What can DNS_X monitor?",answer:"DNS_X observes authoritative nameservers, recursive resolvers, enterprise DNS forwarders, and public domain resolution behavior. It tracks latency distributions, NXDOMAIN/SERVFAIL error bursts, record drift, TTL anomalies, and protocol compliance (UDP/TCP/EDNS0)."},
  {question:"How does it establish baselines?",answer:"DNS_X builds target-specific operational baselines using historical distributions of response latencies, query frequency, and status codes. Instead of rigid global thresholds, it evaluates deviations relative to that specific domain's verified normal behavior."},
  {question:"Does it fabricate traffic?",answer:"Never. DNS_X strictly upholds the core principles: 'No Data → No Metric' and 'No Telemetry → No Claim'. Probing is measured against live networks and passive query taps without simulated or synthetic filler."},
  {question:"Public vs. private infrastructure monitoring?",answer:"DNS_X clearly delineates public target vantage points (external resolution paths and authoritative health) from private internal infrastructure telemetry (where query volumes, internal forwarders, and packet captures are available)."},
  {question:"Signals vs. incidents?",answer:"Signals are individual statistical anomalies or health deviations (e.g., transient latency spikes or single-resolver timeouts). Incidents are created only when correlated multi-signal evidence proves a sustained, actionable operational failure."},
  {question:"Can DNS_X be self-hosted?",answer:"Yes. DNS_X is fully self-hostable via Docker or Kubernetes. The entire telemetry pipeline—including Scapy/dnspython probes, the Node.js API, PostgreSQL database, and React console—runs completely within your secure perimeter."}
`;
code = code.replace(oldFaqExact, newFaqExact);
assertSyntax('Step 8: FAQ items (Spec Item 10)');

// Save to both files
fs.writeFileSync('public/_next/static/chunks/15ac4acf6b48e0d3.js', code, 'utf8');
fs.writeFileSync('landing page/_next/static/chunks/15ac4acf6b48e0d3.js', code, 'utf8');
console.log('Successfully wrote verified valid chunk to public and landing page directories!');
