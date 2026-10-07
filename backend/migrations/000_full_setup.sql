-- =============================================================================
-- DNS_X — Full Database Schema & Settings Setup
-- File: backend/migrations/000_full_setup.sql
-- Target: Supabase PostgreSQL (SQL Editor at supabase.com/dashboard)
-- =============================================================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Grant schema usage
grant usage on schema public to anon, authenticated, service_role;

-- 1. SYSTEM_SETTINGS
create table if not exists public.system_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is 'Runtime configuration key/value store. Values are stored as JSONB.';

insert into public.system_settings (key, value) values
  ('signal_zscore_threshold',  '2.5'::jsonb),
  ('signal_min_confidence',    '0.6'::jsonb),
  ('correlation_window_ms',    '120000'::jsonb),
  ('correlation_min_signals',  '2'::jsonb),
  ('baseline_window_count',    '60'::jsonb),
  ('metric_retention_days',    '30'::jsonb),
  ('realtime_enabled',         'true'::jsonb),
  ('simulation_mode',          'false'::jsonb)
on conflict (key) do update
  set value = excluded.value, updated_at = now();

alter table public.system_settings enable row level security;
drop policy if exists "Allow all on system_settings" on public.system_settings;
create policy "Allow all on system_settings" on public.system_settings for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.system_settings to anon, authenticated, service_role;


-- 2. RESOLVERS
create table if not exists public.resolvers (
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

insert into public.resolvers (id, name, ip, port, status, description) values
  ('00000000-0000-0000-0000-000000000001', 'Resolver-01', '127.0.0.1', 53, 'unknown', 'Primary resolver'),
  ('00000000-0000-0000-0000-000000000002', 'Resolver-02', '127.0.0.2', 53, 'unknown', 'Secondary resolver'),
  ('00000000-0000-0000-0000-000000000003', 'Resolver-03', '127.0.0.3', 53, 'unknown', 'Tertiary resolver')
on conflict (id) do nothing;

alter table public.resolvers enable row level security;
drop policy if exists "Allow all on resolvers" on public.resolvers;
create policy "Allow all on resolvers" on public.resolvers for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.resolvers to anon, authenticated, service_role;


-- 3. RESOLVER_METRICS
create table if not exists public.resolver_metrics (
  id             uuid        primary key default gen_random_uuid(),
  resolver_id    uuid        not null references resolvers(id) on delete cascade,
  window         text        not null check (window in ('1m','5m','1h')),
  ts             timestamptz not null,
  qps            numeric(10,2),
  latency_p50    numeric(8,2),
  latency_p95    numeric(8,2),
  latency_avg    numeric(8,2),
  error_rate     numeric(8,4),
  nxdomain_rate  numeric(8,4),
  servfail_rate  numeric(8,4),
  refused_rate   numeric(8,4),
  cache_hit      numeric(5,2),
  traffic_in_bps bigint,
  created_at     timestamptz not null default now(),
  unique (resolver_id, window, ts)
);

create index if not exists idx_resolver_metrics_lookup on public.resolver_metrics (resolver_id, window, ts desc);
create index if not exists idx_resolver_metrics_ts on public.resolver_metrics (ts desc);

alter table public.resolver_metrics enable row level security;
drop policy if exists "Allow all on resolver_metrics" on public.resolver_metrics;
create policy "Allow all on resolver_metrics" on public.resolver_metrics for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.resolver_metrics to anon, authenticated, service_role;


-- 4. UPSTREAM_METRICS
create table if not exists public.upstream_metrics (
  id           uuid        primary key default gen_random_uuid(),
  resolver_id  uuid        not null references resolvers(id) on delete cascade,
  upstream_ip  text        not null,
  latency_ms   numeric(8,2) not null,
  success_rate numeric(5,2) not null default 100.0,
  window       text        not null check (window in ('1m','5m','1h')),
  ts           timestamptz not null,
  created_at   timestamptz not null default now(),
  unique (resolver_id, upstream_ip, window, ts)
);

create index if not exists idx_upstream_metrics_lookup on public.upstream_metrics (resolver_id, upstream_ip, window, ts desc);

alter table public.upstream_metrics enable row level security;
drop policy if exists "Allow all on upstream_metrics" on public.upstream_metrics;
create policy "Allow all on upstream_metrics" on public.upstream_metrics for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.upstream_metrics to anon, authenticated, service_role;


-- 5. SIGNALS
create table if not exists public.signals (
  id          uuid        primary key default gen_random_uuid(),
  resolver_id uuid        not null references resolvers(id) on delete cascade,
  metric      text        not null,
  severity    text        not null check (severity in ('info','warning','critical')),
  z_score     numeric(6,2),
  value       numeric(12,4),
  baseline    numeric(12,4),
  confidence  numeric(4,3) check (confidence between 0 and 1),
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_signals_resolver_detected on public.signals (resolver_id, detected_at desc);
create index if not exists idx_signals_active on public.signals (severity, detected_at desc) where resolved_at is null;

alter table public.signals enable row level security;
drop policy if exists "Allow all on signals" on public.signals;
create policy "Allow all on signals" on public.signals for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.signals to anon, authenticated, service_role;


-- 6. INCIDENTS
create table if not exists public.incidents (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  severity    text        not null check (severity in ('low','medium','high','critical')),
  status      text        not null default 'active' check (status in ('active','mitigated','resolved')),
  summary     text,
  started_at  timestamptz not null default now(),
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_incidents_status_started on public.incidents (status, started_at desc);

alter table public.incidents enable row level security;
drop policy if exists "Allow all on incidents" on public.incidents;
create policy "Allow all on incidents" on public.incidents for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.incidents to anon, authenticated, service_role;


-- 7. INCIDENT_SIGNALS
create table if not exists public.incident_signals (
  incident_id uuid not null references incidents(id) on delete cascade,
  signal_id   uuid not null references signals(id) on delete cascade,
  primary key (incident_id, signal_id)
);

alter table public.incident_signals enable row level security;
drop policy if exists "Allow all on incident_signals" on public.incident_signals;
create policy "Allow all on incident_signals" on public.incident_signals for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.incident_signals to anon, authenticated, service_role;


-- 8. AI TABLES
create table if not exists public.ai_assessments (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references incidents(id) on delete cascade,
  model       text        not null,
  assessment  text        not null,
  confidence  numeric(4,3) check (confidence between 0 and 1),
  created_at  timestamptz not null default now()
);

create table if not exists public.ai_explanations (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references incidents(id) on delete cascade,
  model       text        not null,
  explanation text        not null,
  factors     jsonb       default '[]',
  created_at  timestamptz not null default now()
);

create table if not exists public.ai_recommendations (
  id          uuid        primary key default gen_random_uuid(),
  incident_id uuid        not null references incidents(id) on delete cascade,
  action      text        not null,
  priority    text        not null check (priority in ('low','medium','high','immediate')),
  rationale   text,
  applied     boolean     not null default false,
  applied_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.ai_assessments enable row level security;
drop policy if exists "Allow all on ai_assessments" on public.ai_assessments;
create policy "Allow all on ai_assessments" on public.ai_assessments for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.ai_assessments to anon, authenticated, service_role;

alter table public.ai_explanations enable row level security;
drop policy if exists "Allow all on ai_explanations" on public.ai_explanations;
create policy "Allow all on ai_explanations" on public.ai_explanations for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.ai_explanations to anon, authenticated, service_role;

alter table public.ai_recommendations enable row level security;
drop policy if exists "Allow all on ai_recommendations" on public.ai_recommendations;
create policy "Allow all on ai_recommendations" on public.ai_recommendations for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.ai_recommendations to anon, authenticated, service_role;


-- 9. ALERT TABLES
create table if not exists public.alert_integrations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  type        text        not null check (type in ('slack','webhook','pagerduty','email')),
  config      jsonb       not null,
  enabled     boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.alert_events (
  id             uuid        primary key default gen_random_uuid(),
  integration_id uuid        not null references alert_integrations(id) on delete cascade,
  incident_id    uuid        references incidents(id) on delete set null,
  status         text        not null check (status in ('pending','delivered','failed')),
  attempt_count  integer     not null default 1,
  error          text,
  ts             timestamptz not null default now()
);

alter table public.alert_integrations enable row level security;
drop policy if exists "Allow all on alert_integrations" on public.alert_integrations;
create policy "Allow all on alert_integrations" on public.alert_integrations for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.alert_integrations to anon, authenticated, service_role;

alter table public.alert_events enable row level security;
drop policy if exists "Allow all on alert_events" on public.alert_events;
create policy "Allow all on alert_events" on public.alert_events for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.alert_events to anon, authenticated, service_role;


-- 10. DNS MEASUREMENTS & RESOLVER MEASUREMENTS
create table if not exists public.dns_measurements (
  id              text        primary key,
  domain          text        not null,
  avg_latency     numeric(8,2) not null,
  p95_latency     numeric(8,2),
  error_rate      numeric(8,4) not null default 0,
  dominant_rcode  text        not null default 'NOERROR',
  records         jsonb       not null default '{}',
  raw_results     jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_dns_measurements_domain_created on public.dns_measurements (domain, created_at desc);

create table if not exists public.resolver_measurements (
  id              uuid        primary key default gen_random_uuid(),
  measurement_id  text        references dns_measurements(id) on delete cascade,
  resolver_name   text        not null,
  resolver_ip     text        not null,
  rcode           text        not null default 'NOERROR',
  latency_ms      numeric(8,2) not null default 0,
  status          text        not null default 'ONLINE',
  source          text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_resolver_measurements_meas_id on public.resolver_measurements (measurement_id);

alter table public.dns_measurements enable row level security;
drop policy if exists "Allow all on dns_measurements" on public.dns_measurements;
create policy "Allow all on dns_measurements" on public.dns_measurements for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.dns_measurements to anon, authenticated, service_role;

alter table public.resolver_measurements enable row level security;
drop policy if exists "Allow all on resolver_measurements" on public.resolver_measurements;
create policy "Allow all on resolver_measurements" on public.resolver_measurements for all to anon, authenticated, service_role using (true) with check (true);
grant all on table public.resolver_measurements to anon, authenticated, service_role;


-- 11. Schema cache reload notification
notify pgrst, 'reload schema';
