# DNS_X

> **Network Intelligence for DNS Infrastructure**
>
> **Understand what your DNS is doing before it becomes an outage.**

DNS_X is a lightweight, self-hostable DNS infrastructure monitoring and
intelligence platform that analyzes real DNS observations, establishes
target-specific baselines, detects abnormal resolution behavior, and
turns evidence into operational signals and incidents through a focused
Network Operations Center (NOC).

------------------------------------------------------------------------

## Overview

DNS is critical infrastructure, but DNS problems are not always visible
as immediate outages. Increased latency, resolver failures, SERVFAIL
responses, timeouts, and authoritative inconsistencies can appear before
or during an incident.

DNS_X focuses on answering:

-   Is the target DNS healthy?
-   What is happening right now?
-   Where is the problem?
-   What evidence supports the observation?
-   Is the behavior different from the target's normal baseline?
-   Does the evidence justify a signal or incident?
-   What should the operator investigate next?

The platform is designed around **real DNS telemetry and evidence**,
rather than fabricated metrics or generic alert scores.

------------------------------------------------------------------------

## Core Principles

``` text
NO DATA       → NO METRIC
NO TELEMETRY  → NO CLAIM
NO EVIDENCE   → NO INCIDENT
NO VALIDATED MODEL → NO AI CONCLUSION
```

DNS_X follows:

``` text
REAL DNS OBSERVATION
        ↓
RAW MEASUREMENT
        ↓
DNS EVIDENCE + BASELINE
        ↓
SIGNAL
        ↓
PERSISTENCE / CORRELATION
        ↓
INCIDENT
        ↓
TARGET HEALTH
        ↓
NOC
```

------------------------------------------------------------------------

## Key Features

### Real DNS Observation

DNS_X collects actual DNS observations from public resolver and
authoritative DNS vantage points.

Supported measurements include:

-   DNS resolution
-   A / AAAA / NS / CNAME / MX / TXT records where applicable
-   Resolver response latency
-   RCODE
-   SERVFAIL
-   NXDOMAIN
-   REFUSED
-   Timeouts
-   Network/transport failures
-   Authoritative nameserver reachability
-   Resolver consistency
-   Historical measurements

### Target-Specific Baselines

DNS_X establishes a baseline from actual observations instead of relying
only on arbitrary global thresholds.

Baseline states include:

``` text
CALIBRATING
BASELINE ESTABLISHED
DEVIATION DETECTED
```

### Evidence-Based Signals

Signals represent observable abnormal behavior such as:

-   Latency deviation
-   SERVFAIL spikes
-   Timeout spikes
-   Resolver failure
-   Authoritative inconsistency
-   RCODE distribution changes

A signal is not automatically an incident.

### Incident Correlation

DNS_X follows:

``` text
Observation → Signal → Persistence/Correlation → Incident
```

This prevents a single transient observation or baseline calibration
event from automatically becoming a critical incident.

### Network Operations Center

The NOC provides:

-   Target health
-   DNS observation activity
-   Response latency
-   Resolution failure rate
-   Resolver status
-   Evidence and baseline assessment
-   Active signals
-   Incidents
-   Recent events

------------------------------------------------------------------------

## DNS Semantics

DNS_X intentionally separates DNS response outcomes.

  Result              Meaning
  ------------------- -------------------------------------------
  `NOERROR`           Successful DNS resolution
  `NXDOMAIN`          Requested name does not exist
  `SERVFAIL`          DNS server could not complete the query
  `REFUSED`           Query refused by the server
  `TIMEOUT`           No response within the observation window
  `NETWORK FAILURE`   Transport/connectivity failure

### NXDOMAIN Is Not Automatically an Outage

An `NXDOMAIN` response means that the queried name does not exist. DNS_X
therefore represents it as:

``` text
NOT_FOUND
NAME NOT FOUND
NXDOMAIN
```

It is not automatically treated as infrastructure failure.

### Resolution Failure Rate

The primary resolution failure rate is based on:

``` text
SERVFAIL
+ TIMEOUT
+ TRANSPORT / NETWORK FAILURES
--------------------------------
TOTAL OBSERVATIONS
```

NXDOMAIN is tracked separately.

------------------------------------------------------------------------

## Public Domain Monitoring

For public domains, DNS_X can observe public DNS behavior but cannot
directly know private infrastructure metrics.

### Available for public targets

-   DNS resolution
-   Resolver response behavior
-   Authoritative nameservers
-   DNS latency
-   RCODEs
-   Resolver consistency
-   Authoritative reachability
-   Historical observations collected by DNS_X

### Not available without a connected collector

-   Global DNS QPS
-   Private resolver CPU
-   Private resolver memory
-   Internal DNS queues
-   Private resolver cache hit ratio

Therefore, DNS_X does **not** fabricate global DNS QPS for public
domains.

``` text
DNS QPS: N/A
Global traffic unavailable for public target
```

Probe/observation frequency is never mislabeled as global DNS QPS.

------------------------------------------------------------------------

## Intelligence Layer

DNS_X uses statistical and machine-learning techniques where
appropriate, including:

-   Rolling baselines
-   Mean / median
-   Standard deviation or robust deviation
-   Percentiles
-   Isolation Forest
-   XGBoost
-   SHAP explainability

The intelligence layer is evidence-driven.

DNS_X does **not** display an outage probability or confidence score
unless a validated predictive model actually supports that conclusion.

Instead, the platform focuses on:

``` text
WHAT happened?
WHY was it detected?
WHAT evidence supports it?
WHAT should the operator investigate?
```

------------------------------------------------------------------------

## Architecture

``` text
                         DNS_X
                           │
              ┌────────────┴────────────┐
              │                         │
           Frontend                  Backend
              │                         │
        React + Vite             Node.js + Express
        Tailwind CSS                    │
        Recharts                        │
        Framer Motion                   │
              │                    Python Telemetry
              │                         │
              │                   Scapy / dnspython
              │                         │
              │                    ML / Statistics
              │                         │
              │                 Scikit-learn / XGBoost
              │                         │
              │                       SHAP
              │                         │
              └──────── WebSocket ──────┘
                           │
                     Supabase
                    PostgreSQL
```

------------------------------------------------------------------------

## Technology Stack

### Frontend

-   React
-   Vite
-   Tailwind CSS
-   Framer Motion
-   Recharts
-   Lucide

### Backend

-   Node.js
-   Express
-   WebSocket

### DNS Telemetry

-   Python
-   Scapy
-   dnspython
-   DNS-over-HTTPS fallback

### Intelligence

-   Python
-   Scikit-learn
-   XGBoost
-   SHAP

### Database

-   Supabase
-   PostgreSQL

### Deployment

-   GitHub
-   Vercel
-   Render

------------------------------------------------------------------------

## Resolver Vantage Points

DNS_X can observe public resolver behavior using:

``` text
Cloudflare     1.1.1.1
Google         8.8.8.8
Quad9          9.9.9.9
OpenDNS        208.67.222.222
```

Resolver observations include response status, RCODE, protocol, and
measured round-trip latency.

------------------------------------------------------------------------

## Target Lifecycle

``` text
NO_TARGET
    │
    ▼
ANALYZING
    │
    ├──────────────► FAILED
    │
    ▼
ACTIVE
```

The NOC becomes active only after a real target analysis succeeds.

------------------------------------------------------------------------

## Health State Model

DNS_X keeps several states independent.

### Target DNS Health

``` text
HEALTHY
DEGRADED
CRITICAL
UNKNOWN
NOT_FOUND
```

### Measurement System

``` text
ONLINE
OFFLINE
STANDBY
```

### Baseline

``` text
CALIBRATING
BASELINE ESTABLISHED
DEVIATION DETECTED
```

### Incident

``` text
NO ACTIVE INCIDENT
INCIDENT ACTIVE
```

A monitoring-system failure does not automatically mean the monitored
DNS target is critical.

------------------------------------------------------------------------

## API

Core DNS endpoints include:

``` text
POST /api/v1/dns/probe
GET  /api/v1/dns/probe?domain=<domain>
POST /api/v1/dns/target
DELETE /api/v1/dns/target
GET  /api/v1/dns/measurements?domain=<domain>
```

Realtime events include:

``` text
measurement.dns
telemetry.updated
resolver.updated
signal.detected
incident.created
```

------------------------------------------------------------------------

## Getting Started

### Requirements

-   Node.js
-   npm
-   Python 3.x
-   Supabase/PostgreSQL project

### Clone

``` bash
git clone <your-repository-url>
cd DNS_X
```

### Frontend

``` bash
npm install
npm run dev
```

### Backend

``` bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001` and the Vite development
server normally runs on `http://localhost:5173`.

------------------------------------------------------------------------

## Environment Configuration

Create the required environment files using the variables expected by
the existing project configuration.

Typical configuration includes:

``` env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
API_KEY=your_development_api_key
DNS_X_SIMULATION=false
```

Never commit secrets or private API keys to GitHub.

------------------------------------------------------------------------

## Database

DNS_X stores measurement data in PostgreSQL through Supabase.

The database supports:

-   DNS measurements
-   historical observations
-   baseline calculation
-   target state
-   operational settings
-   retention management

------------------------------------------------------------------------

## Data Integrity

DNS_X is intentionally designed to avoid fake operational data.

The production telemetry path does not rely on:

``` text
Math.random()
Synthetic DNS traffic
Fake incidents
Fake outage probabilities
Fake confidence values
Fabricated global QPS
```

When data is unavailable, DNS_X should display:

``` text
N/A
UNKNOWN
CALIBRATING
```

rather than inventing a value.

------------------------------------------------------------------------

## Testing

The validation matrix includes:

  Scenario                        Expected Result
  ------------------------------- -------------------------------------------------
  Healthy public domain           `HEALTHY`
  Multiple responsive resolvers   Healthy resolver state
  Non-existent domain             `NOT_FOUND / NXDOMAIN`
  Backend offline                 `UNKNOWN / OFFLINE`
  Persistent SERVFAIL             Evidence-backed critical state
  Timeout failure                 Evidence-backed signal/incident when persistent
  Baseline warm-up                `CALIBRATING`
  Normal observations             No false incident

Build and lint:

``` bash
npm run lint
npm run build
```

------------------------------------------------------------------------

## Design Philosophy

DNS_X is built around:

``` text
GLANCE
  ↓
UNDERSTAND
  ↓
INVESTIGATE
```

The NOC helps an operator understand:

1.  Whether DNS is healthy
2.  What is happening
3.  Where the issue appears
4.  Why the system raised a signal
5.  What evidence supports it
6.  What should be investigated next

------------------------------------------------------------------------

## What DNS_X Is Not

DNS_X is intentionally not:

-   A generic SIEM
-   A packet-capture archive
-   A vulnerability scanner
-   A chatbot
-   A generic alert generator
-   A replacement for enterprise DNS infrastructure
-   A system that invents global DNS traffic statistics
-   An LLM-based real-time DNS detector

Its focus is **DNS infrastructure observation, baseline analysis,
evidence, signals, incidents, and operator visibility.**

------------------------------------------------------------------------

## Roadmap

Potential future development areas:

-   Connected DNS collector agents
-   Private resolver telemetry
-   Resolver CPU/memory metrics
-   Cache hit-ratio monitoring
-   Additional DNS vantage points
-   Advanced anomaly models
-   Long-term trend analysis
-   Automated remediation workflows
-   Expanded infrastructure integrations

These are outside the current hackathon MVP scope.

------------------------------------------------------------------------

## Hackathon MVP Status

-   [x] Real DNS probing
-   [x] Public resolver observations
-   [x] Authoritative DNS observations
-   [x] DNS latency measurement
-   [x] RCODE analysis
-   [x] NXDOMAIN handling
-   [x] Resolution failure tracking
-   [x] Target-specific baseline
-   [x] Signal detection
-   [x] Incident correlation
-   [x] Evidence-based NOC
-   [x] WebSocket telemetry
-   [x] Supabase persistence
-   [x] Real-data-only telemetry path
-   [x] Backend offline state handling
-   [x] Production build validation
-   [x] Lint validation

------------------------------------------------------------------------

## License

Add the project's chosen license here before publishing.

------------------------------------------------------------------------

## Final

> **DNS_X turns live DNS observations into understandable operational
> intelligence --- without inventing the evidence.**

**Observe. Baseline. Detect. Investigate.**
