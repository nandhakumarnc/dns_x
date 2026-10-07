-- =============================================================================
-- DNS_X — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Target: Supabase PostgreSQL
--
-- Run via Supabase SQL Editor or CLI:
--   supabase db reset  (resets and runs all migrations)
--   supabase db push   (applies pending migrations)
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- =============================================================================
-- RESOLVERS
-- Known DNS resolver inventory. Seeded once; status updated by the backend.
-- =============================================================================
create table if not exists resolvers (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique,
  ip          text        not null,
  port        integer     not null default 53,
  status      text        not null default 'unknown'
                          check (status in ('healthy','warning','critical','unknown')),
  description text,
  tags        text[]      default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table  resolvers            is 'Known DNS resolver nodes monitored by DNS_X.';
comment on column resolvers.status     is 'Last known health status: healthy | warning | critical | unknown.';

-- Seed three default resolvers (matches the frontend mock topology).
-- Change IPs to match your real infrastructure.
insert into resolvers (id, name, ip, port, status, description) values
  ('00000000-0000-0000-0000-000000000001', 'Resolver-01', '127.0.0.1', 53, 'unknown', 'Primary resolver'),
  ('00000000-0000-0000-0000-000000000002', 'Resolver-02', '127.0.0.2', 53, 'unknown', 'Secondary resolver'),
  ('00000000-0000-0000-0000-000000000003', 'Resolver-03', '127.0.0.3', 53, 'unknown', 'Tertiary resolver')
on conflict (id) do nothing;


-- =============================================================================
-- RESOLVER_METRICS
-- Aggregated time-window metrics per resolver.
-- NOT raw packets. Only 1m / 5m / 1h aggregates are stored.
-- =============================================================================
create table if not exists resolver_metrics (
  id             uuid        primary key default gen_random_uuid(),
  resolver_id    uuid        not null references resolvers(id) on delete cascade,
  window         text        not null check (window in ('1m','5m','1h')),
  ts             timestamptz not null,        -- floored to window start
  qps            numeric(10,2),
  latency_p50    numeric(8,2),               -- ms
  latency_p95    numeric(8,2),               -- ms
  latency_avg    numeric(8,2),               -- ms
  error_rate     numeric(8,4),               -- fraction 0–1
  nxdomain_rate  numeric(8,4),
  servfail_rate  numeric(8,4),
  timeout_rate   numeric(8,4),
  cache_hit      numeric(8,4),               -- fraction 0–1
  sample_count   integer,                    -- raw observations in this window
  created_at     timestamptz not null default now(),

  unique (resolver_id, window, ts)
);

create index if not exists idx_resolver_metrics_resolver_window_ts
  on resolver_metrics (resolver_id, window, ts desc);

comment on table resolver_metrics is 'Aggregated DNS metrics per resolver per time window (1m/5m/1h). Raw packets are NOT stored.';


-- =============================================================================
-- UPSTREAM_METRICS
-- Gateway-level aggregate (all resolvers combined).
-- =============================================================================
create table if not exists upstream_metrics (
  id            uuid        primary key default gen_random_uuid(),
  ts            timestamptz not null unique,  -- floored to 1m
  total_qps     numeric(10,2),
  nxdomain_rate numeric(8,4),
  servfail_rate numeric(8,4),
  timeout_rate  numeric(8,4),
  error_rate    numeric(8,4),
  latency_avg   numeric(8,2),
  cache_hit     numeric(8,4),
  health_score  numeric(5,1),                -- 0–100
  created_at    timestamptz not null default now()
);

create index if not exists idx_upstream_metrics_ts
  on upstream_metrics (ts desc);

comment on table upstream_metrics is 'Gateway-level aggregate telemetry (1-minute windows).';


-- =============================================================================
-- SIGNALS
-- Discrete operational deviations detected by the signal service.
-- =============================================================================
create table if not exists signals (
  id              uuid        primary key default gen_random_uuid(),
  resolver_id     uuid        references resolvers(id) on delete set null,
  incident_id     uuid,                       -- set by correlation service (FK added below)
  type            text        not null,        -- HIGH_LATENCY | QPS_SPIKE | ERROR_SPIKE | CACHE_MISS_SPIKE | RESOLVER_DOWN
  observed        numeric(12,4) not null,      -- observed metric value
  baseline_mean   numeric(12,4),
  baseline_stddev numeric(12,4),
  deviation_score numeric(8,4),               -- Z-score (signed)
  confidence      numeric(5,4),               -- 0–1
  metric_key      text,                       -- which metric triggered this signal
  ts              timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists idx_signals_resolver_ts   on signals (resolver_id, ts desc);
create index if not exists idx_signals_incident_id   on signals (incident_id);
create index if not exists idx_signals_type_ts       on signals (type, ts desc);

comment on table signals is 'Discrete DNS operational deviation events produced by the signal detection service.';


-- =============================================================================
-- INCIDENTS
-- Correlated incident records (one per correlated group of signals).
-- =============================================================================
create table if not exists incidents (
  id                  uuid        primary key default gen_random_uuid(),
  title               text        not null,
  status              text        not null default 'investigating'
                                  check (status in ('investigating','active','contained','resolved','acknowledged')),
  severity            text        not null default 'low'
                                  check (severity in ('low','medium','high','critical')),
  affected_resolvers  text[]      default '{}',   -- resolver names / IDs
  root_cause_class    text,                        -- OPERATIONAL | NETWORK | SECURITY | UNKNOWN
  risk_level          text,                        -- elevated | low
  started_at          timestamptz not null default now(),
  resolved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_incidents_status     on incidents (status);
create index if not exists idx_incidents_started_at on incidents (started_at desc);

comment on table incidents is 'Correlated DNS incident records. One incident groups multiple related signals.';

-- Back-fill the FK on signals now that incidents exists.
alter table signals
  add constraint fk_signals_incident
  foreign key (incident_id) references incidents(id) on delete set null;


-- =============================================================================
-- INCIDENT_SIGNALS  (M:N join)
-- =============================================================================
create table if not exists incident_signals (
  incident_id uuid not null references incidents(id) on delete cascade,
  signal_id   uuid not null references signals(id)   on delete cascade,
  primary key (incident_id, signal_id)
);

comment on table incident_signals is 'Many-to-many join: which signals compose each incident.';


-- =============================================================================
-- AI_ASSESSMENTS
-- ML classification output per incident.
-- =============================================================================
create table if not exists ai_assessments (
  id                uuid        primary key default gen_random_uuid(),
  incident_id       uuid        not null references incidents(id) on delete cascade,
  operational_prob  numeric(5,4),             -- OPERATIONAL class probability 0–1
  network_prob      numeric(5,4),             -- NETWORK class probability
  security_prob     numeric(5,4),             -- SECURITY class probability
  unknown_prob      numeric(5,4),             -- UNKNOWN class probability
  confidence        numeric(5,4),             -- overall model confidence
  outage_risk       numeric(5,1),             -- 0–100
  outage_risk_level text         check (outage_risk_level in ('low','elevated','high','critical')),
  model_version     text,
  ts                timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_ai_assessments_incident_ts
  on ai_assessments (incident_id, ts desc);

comment on table ai_assessments is 'XGBoost classification output for each incident.';


-- =============================================================================
-- AI_EXPLANATIONS
-- SHAP feature-impact explanations.
-- =============================================================================
create table if not exists ai_explanations (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references incidents(id) on delete cascade,
  features    jsonb       not null default '[]',  -- [{ name, shap_value, direction }]
  narrative   text,                               -- human-readable explanation
  created_at  timestamptz not null default now()
);

comment on table ai_explanations is 'SHAP-based feature impact explanations for AI assessments.';


-- =============================================================================
-- AI_RECOMMENDATIONS
-- Actionable response guidance.
-- =============================================================================
create table if not exists ai_recommendations (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references incidents(id) on delete cascade,
  actions     jsonb       not null default '[]',  -- [{ priority, action, rationale }]
  created_at  timestamptz not null default now()
);

comment on table ai_recommendations is 'Evidence-based operational response recommendations per incident.';


-- =============================================================================
-- ALERT_INTEGRATIONS
-- Outbound alert channel configuration (webhook, email, PagerDuty).
-- =============================================================================
create table if not exists alert_integrations (
  id         uuid        primary key default gen_random_uuid(),
  type       text        not null check (type in ('webhook','email','pagerduty')),
  config     jsonb       not null default '{}',   -- channel-specific config (masked on read)
  enabled    boolean     not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table alert_integrations is 'Outbound alert channel configuration. config field holds channel-specific secrets (masked on read).';


-- =============================================================================
-- ALERT_EVENTS
-- Alert delivery audit log.
-- =============================================================================
create table if not exists alert_events (
  id             uuid        primary key default gen_random_uuid(),
  integration_id uuid        references alert_integrations(id) on delete set null,
  incident_id    uuid        references incidents(id)           on delete set null,
  status         text        not null check (status in ('pending','delivered','failed')),
  payload        jsonb,
  error          text,
  ts             timestamptz not null default now()
);

create index if not exists idx_alert_events_ts on alert_events (ts desc);

comment on table alert_events is 'Delivery audit log for every outbound alert attempt.';


-- =============================================================================
-- SYSTEM_SETTINGS
-- Key/value store for runtime configuration.
-- =============================================================================
create table if not exists system_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

comment on table system_settings is 'Runtime configuration key/value store. Values are stored as JSONB.';

-- Seed default settings.
insert into system_settings (key, value) values
  ('signal_zscore_threshold',  '2.5'),
  ('signal_min_confidence',    '0.6'),
  ('correlation_window_ms',    '120000'),
  ('correlation_min_signals',  '2'),
  ('baseline_window_count',    '60'),
  ('metric_retention_days',    '30'),
  ('realtime_enabled',         'true'),
  ('simulation_mode',          'true')
on conflict (key) do nothing;


-- =============================================================================
-- Row Level Security (Supabase)
-- The backend uses the service-role key and bypasses RLS.
-- Enable RLS on all tables so anonymous / anon-key access is blocked.
-- =============================================================================
alter table resolvers           enable row level security;
alter table resolver_metrics    enable row level security;
alter table upstream_metrics    enable row level security;
alter table signals             enable row level security;
alter table incidents           enable row level security;
alter table incident_signals    enable row level security;
alter table ai_assessments      enable row level security;
alter table ai_explanations     enable row level security;
alter table ai_recommendations  enable row level security;
alter table alert_integrations  enable row level security;
alter table alert_events        enable row level security;
alter table system_settings     enable row level security;

-- No public SELECT policies are created.
-- All access goes through the backend using the service-role key.
