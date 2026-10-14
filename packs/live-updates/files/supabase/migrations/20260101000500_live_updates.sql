-- Announcements shown live on the site (src/live/). The browser may READ
-- published rows with the anon key (RLS below); only the service role writes.
begin;

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 120),
  message text not null check (length(message) between 1 and 600),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  cta_label text check (cta_label is null or length(cta_label) <= 40),
  cta_url text check (cta_url is null or cta_url ~ '^(https://|/)'),
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists updates_published_idx
  on public.updates (published, published_at desc);

alter table public.updates enable row level security;
revoke all on public.updates from anon, authenticated;
grant select on public.updates to anon;

-- The anon key is PUBLIC (it ships in the bundle). This policy is the only
-- thing standing between it and every row, so it allows published rows only.
drop policy if exists "Published updates are public" on public.updates;
create policy "Published updates are public" on public.updates
  for select to anon using (published = true);

-- Realtime: stream inserts/updates to subscribed browsers (RLS still applies).
do $$ begin
  alter publication supabase_realtime add table public.updates;
exception when duplicate_object or undefined_object then null;
end $$;

commit;

-- Publish one (SQL editor or Table Editor):
--   insert into public.updates (title, message, published, published_at)
--   values ('Gates open', 'Entry from Gate 2 from 10:00.', true, now());
