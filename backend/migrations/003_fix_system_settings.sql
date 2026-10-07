-- =============================================================================
-- DNS_X — Fix system_settings Schema & Permissions
-- Migration: 003_fix_system_settings.sql
-- Target: Supabase PostgreSQL (SQL Editor)
-- =============================================================================

-- Ensure schema usage
grant usage on schema public to anon, authenticated, service_role;

-- 1. Create table
create table if not exists public.system_settings (
  key        text        primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

comment on table public.system_settings is 'Runtime configuration key/value store. Values are stored as JSONB.';

-- 2. Seed default system settings
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

-- 3. Row Level Security & Policies
alter table public.system_settings enable row level security;

drop policy if exists "Allow all on system_settings" on public.system_settings;
create policy "Allow all on system_settings"
  on public.system_settings
  for all
  to anon, authenticated, service_role
  using (true)
  with check (true);

-- 4. Grant table privileges
grant all on table public.system_settings to anon, authenticated, service_role;

-- 5. Force PostgREST schema cache reload
notify pgrst, 'reload schema';
