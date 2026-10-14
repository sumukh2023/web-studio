-- One row per feature switch. `enabled_from` null = OFF; a timestamp = ON from
-- that instant. No row = OFF. Read by api/_features.ts; never by the browser.
begin;

create table if not exists public.feature_rollout (
  feature text primary key
    constraint feature_rollout_feature_shape check (feature ~ '^[a-z][a-z0-9_]{2,49}$'),
  enabled_from timestamptz
);

comment on table public.feature_rollout is
  'One row per feature switch. enabled_from null means OFF; a timestamp means on from that instant. Absent row means OFF.';

alter table public.feature_rollout enable row level security;
revoke all on public.feature_rollout from public, anon, authenticated;
grant select, update, insert on public.feature_rollout to service_role;

-- The one place the three OFF rules (no row, null, future) are written, so
-- SQL callers (triggers, functions) cannot get them subtly wrong.
create or replace function public.feature_enabled(
  p_feature text,
  p_at timestamptz default now()
) returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (select r.enabled_from is not null and p_at >= r.enabled_from
       from public.feature_rollout r
      where r.feature = p_feature),
    false
  );
$$;
revoke all on function public.feature_enabled(text, timestamptz)
  from public, anon, authenticated;

-- An example switch, shipped OFF. Rename or delete it.
insert into public.feature_rollout (feature, enabled_from)
values ('example_launch', null)
on conflict (feature) do nothing;

commit;
