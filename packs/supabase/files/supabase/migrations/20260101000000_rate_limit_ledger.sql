-- Rate-limit and abuse ledger for the public API (api/_ratelimit.ts).
-- Keys are SHA-256 hashes; no plaintext email or IP is ever stored here.
begin;

create table if not exists public.api_rate_events (
  id bigint generated always as identity primary key,
  scope text not null check (length(scope) between 1 and 40),
  key_kind text not null check (key_kind in ('email', 'ip')),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  outcome text not null default 'accepted'
    check (outcome in ('accepted', 'blocked', 'failed')),
  created_at timestamptz not null default now()
);

comment on table public.api_rate_events is
  'Rate-limit and abuse ledger for the public API. Keys are hashed.';

create index if not exists api_rate_events_lookup_idx
  on public.api_rate_events (scope, key_kind, key_hash, created_at desc);
create index if not exists api_rate_events_outcome_idx
  on public.api_rate_events (outcome, created_at desc)
  where outcome <> 'accepted';

-- Locked to the browser roles. Only the service role (api/) touches it.
alter table public.api_rate_events enable row level security;
revoke all on public.api_rate_events from anon, authenticated;

-- Keep a week. Schedule with pg_cron (Database -> Extensions -> pg_cron):
--   select cron.schedule('purge-rate-events', '17 3 * * *',
--     'select public.purge_expired_api_rate_events()');
create or replace function public.purge_expired_api_rate_events()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.api_rate_events where created_at < now() - interval '7 days';
$$;
revoke all on function public.purge_expired_api_rate_events()
  from public, anon, authenticated;

commit;
