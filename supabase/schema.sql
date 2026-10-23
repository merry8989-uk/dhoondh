-- Dhoondh diagnostics -> Supabase
-- Run this ONCE in the Supabase SQL editor (Dashboard -> SQL Editor -> New query -> Run).

create table if not exists public.diagnostics_events (
  id              bigint generated always as identity primary key,
  inserted_at     timestamptz not null default now(),
  -- log envelope: timestamp, severity, category, message, app_id, environment, request_id
  ts              timestamptz,                     -- event timestamp (ISO 8601 UTC)
  severity        text,                            -- trace | debug | info | warn | error | fatal
  category        text,                            -- application | error | security | performance | user_activity | api_network | audit | analytics | background_job | ...
  message         text,                            -- short human-readable line
  app_id          text,                            -- dhoondh
  environment     text,                            -- production | staging | development
  request_id      text,                            -- correlates one user action / request
  event_name      text        not null,
  schema_version  text,
  session_id      text,
  attempt_id      text,
  user_code       text,
  user_id         text,                            -- salted hash only, never a raw identifier
  platform        text,
  app_version     text,
  os              text,
  device_model    text,
  network_type    text,
  screen_or_route text,
  release_channel text,
  props           jsonb default '{}'::jsonb         -- sanitized metadata
);

create index if not exists diagnostics_events_ts_idx       on public.diagnostics_events (ts desc);
create index if not exists diagnostics_events_user_idx     on public.diagnostics_events (user_code);
create index if not exists diagnostics_events_sev_idx      on public.diagnostics_events (severity);
create index if not exists diagnostics_events_cat_idx      on public.diagnostics_events (category);
create index if not exists diagnostics_events_name_idx     on public.diagnostics_events (event_name);

-- Row Level Security: the app (anon key) can INSERT only - it can never read the table back.
alter table public.diagnostics_events enable row level security;

drop policy if exists "anon can insert diagnostics" on public.diagnostics_events;
create policy "anon can insert diagnostics"
  on public.diagnostics_events
  for insert
  to anon
  with check (true);

-- There is deliberately NO select policy for anon, so public users cannot read anyone's logs.
-- You read them from the Supabase dashboard (Table editor / SQL), or with the service_role key
-- from a server.

-- ---------------------------------------------------------------------------
-- Already created the table with the older schema (log_level, no category)?
-- Run this once to migrate:
-- ---------------------------------------------------------------------------
-- alter table public.diagnostics_events rename column log_level to severity;
-- alter table public.diagnostics_events
--   add column if not exists category    text,
--   add column if not exists message     text,
--   add column if not exists app_id      text,
--   add column if not exists environment text,
--   add column if not exists request_id  text;
-- create index if not exists diagnostics_events_cat_idx on public.diagnostics_events (category);

-- Optional: auto-delete old rows (needs the pg_cron extension).
-- select cron.schedule('purge-diagnostics', '0 3 * * *',
--   $$delete from public.diagnostics_events where inserted_at < now() - interval '90 days'$$);

-- ---------- handy weekly-review queries ----------
-- errors + fatal, newest first:
--   select ts, severity, category, event_name, message, user_code, screen_or_route, props
--   from public.diagnostics_events where severity in ('error','fatal') order by ts desc limit 100;
-- by category (what kind of logging is actually happening):
--   select category, severity, count(*) from public.diagnostics_events group by 1,2 order by 3 desc;
-- security events:
--   select ts, event_name, message, user_code, props from public.diagnostics_events
--   where category = 'security' order by ts desc limit 100;
-- friction signals (user_activity warns):
--   select ts, event_name, message, user_code, props from public.diagnostics_events
--   where category = 'user_activity' and severity = 'warn' order by ts desc limit 100;
-- searches that found nothing (which tabs need work):
--   select screen_or_route, count(*) from public.diagnostics_events
--   where event_name = 'search_no_results' group by 1 order by 2 desc;
-- slowest endpoints:
--   select props->>'endpoint' as endpoint, count(*) as calls,
--          round(avg((props->>'latency_ms')::numeric)) as avg_ms
--   from public.diagnostics_events where event_name = 'api_call'
--   group by 1 order by avg_ms desc nulls last limit 20;
-- performance over time:
--   select date_trunc('day', ts) as day, round(avg((props->>'lcp_ms')::numeric)) as lcp,
--          round(avg((props->>'ttfb_ms')::numeric)) as ttfb
--   from public.diagnostics_events where event_name = 'web_vitals' group by 1 order by 1 desc;
-- who is using it:
--   select user_code, count(*) as events, min(ts) as first_seen, max(ts) as last_seen
--   from public.diagnostics_events group by 1 order by 2 desc;

-- ---------- crash reporting & analytics queries ----------
-- crashes (fatal) and suspected tab-kills:
--   select ts, event_name, message, user_code, os, props->>'stack_head' as stack
--   from public.diagnostics_events where severity = 'fatal' or event_name = 'session_crash_suspected'
--   order by ts desc limit 50;
-- JavaScript errors, grouped so you see the most frequent one first:
--   select props->>'error_message' as error, count(*) as hits,
--          min(ts) as first_seen, max(ts) as last_seen
--   from public.diagnostics_events where event_name = 'js_error'
--   group by 1 order by hits desc limit 30;
-- failed resources (broken thumbnails, scripts):
--   select props->>'resource' as kind, props->>'url' as url, count(*)
--   from public.diagnostics_events where event_name = 'resource_error' group by 1,2 order by 3 desc;
-- which results actually get clicked (by site):
--   select props->>'host' as site, count(*) as clicks,
--          round(avg((props->>'position')::numeric), 1) as avg_position
--   from public.diagnostics_events where event_name = 'result_clicked'
--   group by 1 order by clicks desc limit 30;
-- which engine people hand off to (we are losing them to whom):
--   select props->>'host' as engine, count(*) from public.diagnostics_events
--   where event_name = 'engine_handoff' group by 1 order by 2 desc;
-- tab usage (which verticals are worth keeping):
--   select props->>'feature' as tab, count(*) from public.diagnostics_events
--   where event_name = 'feature_used' group by 1 order by 2 desc;
-- search funnel per session (searches -> results -> clicks):
--   select session_id,
--          count(*) filter (where event_name = 'search_performed')   as searches,
--          count(*) filter (where event_name = 'search_no_results')  as empty_searches,
--          count(*) filter (where event_name = 'result_clicked')     as clicks,
--          count(*) filter (where event_name = 'form_abandon')       as abandons
--   from public.diagnostics_events group by 1 having count(*) > 3 order by searches desc limit 50;
