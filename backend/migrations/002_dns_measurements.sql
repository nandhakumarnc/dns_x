-- =============================================================================
-- DNS_X — Real DNS Measurements Schema
-- Migration: 002_dns_measurements.sql
-- Target: Supabase PostgreSQL
-- =============================================================================

create table if not exists dns_measurements (
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

create index if not exists idx_dns_measurements_domain_created
  on dns_measurements (domain, created_at desc);

comment on table dns_measurements is 'Persistent historical observations for monitored DNS targets.';

create table if not exists resolver_measurements (
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

create index if not exists idx_resolver_measurements_meas_id
  on resolver_measurements (measurement_id);

alter table dns_measurements enable row level security;
alter table resolver_measurements enable row level security;
