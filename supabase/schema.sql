-- Dhoondh diagnostics → Supabase
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor → New query → Run).

create table if not exists public.diagnostics_events (
  id              bigint generated always as identity primary key,
  inserted_at     timestamptz not null default now(),
  event_name      text        not null,
  schema_version  text,
  ts              timestamptz,
  session_id      text,
  attempt_id      text,
  user_code       text,
  user_id         text,
  platform        text,
  app_version     text,
  os              text,
  device_model    text,
  network_type    text,
  screen_or_route text,
  log_level       text,
  release_channel text,
  props           jsonb default '{}'::jsonb
);

create index if not exists diagnostics_events_ts_idx    on public.diagnostics_events (ts desc);
create index if not exists diagnostics_events_user_idx  on public.diagnostics_events (user_code);
create index if not exists diagnostics_events_level_idx on public.diagnostics_events (log_level);
create index if not exists diagnostics_events_name_idx  on public.diagnostics_events (event_name);

-- Row Level Security: the app (anon key) can INSERT only — it can never read the table back.
alter table public.diagnostics_events enable row level security;

drop policy if exists "anon can insert diagnostics" on public.diagnostics_events;
create policy "anon can insert diagnostics"
  on public.diagnostics_events
  for insert
  to anon
  with check (true);

-- There is deliberately NO select policy for anon, so public users cannot read anyone's logs.
-- You read them from the Supabase dashboard (Table editor / SQL), or with the service_role
-- key from a server.

-- Optional: auto-delete old rows (needs the pg_cron extension).
-- select cron.schedule('purge-diagnostics', '0 3 * * *',
--   $$delete from public.diagnostics_events where inserted_at < now() - interval '90 days'$$);

-- ---------- handy weekly-review queries ----------
-- errors:
--   select ts, event_name, user_code, screen_or_route, props
--   from public.diagnostics_events where log_level = 'error' order by ts desc limit 100;
-- friction signals:
--   select ts, event_name, user_code, props from public.diagnostics_events
--   where event_name in ('rage_click','dead_click','back_button_spam','error_state_shown','search_no_results')
--   order by ts desc limit 100;
-- searches that found nothing (which tabs need work):
--   select screen_or_route, count(*) from public.diagnostics_events
--   where event_name = 'search_no_results' group by 1 order by 2 desc;
-- slowest endpoints:
--   select props->>'endpoint' as endpoint, count(*) as calls,
--          round(avg((props->>'latency_ms')::numeric)) as avg_ms
--   from public.diagnostics_events where event_name = 'api_call'
--   group by 1 order by avg_ms desc nulls last limit 20;
-- who is using it:
--   select user_code, count(*) as events, min(ts) as first_seen, max(ts) as last_seen
--   from public.diagnostics_events group by 1 order by 2 desc;
