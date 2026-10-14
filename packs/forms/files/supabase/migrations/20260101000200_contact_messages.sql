-- Messages from the contact form (api/contact.ts). Service-role only.
begin;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  message text not null check (length(message) between 1 and 4000),
  mailed boolean not null default false,
  ip_hash text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;

commit;
