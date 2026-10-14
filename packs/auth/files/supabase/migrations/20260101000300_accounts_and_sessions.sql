-- Accounts, server-side sessions and a login-attempt ledger (api/_auth.ts).
-- Every table is service-role only; the browser never reads them directly.
begin;

create extension if not exists pgcrypto;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  -- Stored lower-cased by the API; the unique index is lowered too.
  email text not null,
  -- Argon2id PHC string. Never plaintext; the API is the only writer.
  password_hash text not null,
  -- WIDEST LAST: member < staff < admin. Mirror ROLES in api/_auth.ts.
  role text not null default 'member' check (role in ('member', 'staff', 'admin')),
  -- Disable rather than delete, so audit rows still resolve to a name.
  active boolean not null default true,
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  must_change_password boolean not null default false,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists accounts_email_key on public.accounts (lower(email));
alter table public.accounts enable row level security;
revoke all on public.accounts from anon, authenticated;

create table if not exists public.account_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  -- SHA-256 of the cookie token. A leaked dump cannot be replayed as a login.
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  client_label text
);
create index if not exists account_sessions_account_idx
  on public.account_sessions (account_id, created_at desc);
create index if not exists account_sessions_expiry_idx
  on public.account_sessions (expires_at) where revoked_at is null;
alter table public.account_sessions enable row level security;
revoke all on public.account_sessions from anon, authenticated;

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  ip_hash text,
  successful boolean not null,
  account_id uuid references public.accounts (id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_email_idx
  on public.login_attempts (email, created_at desc);
create index if not exists login_attempts_ip_idx
  on public.login_attempts (ip_hash, created_at desc) where ip_hash is not null;
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

-- Housekeeping, schedule with pg_cron if you like:
--   select cron.schedule('purge-sessions', '23 3 * * *', 'select public.purge_expired_sessions()');
create or replace function public.purge_expired_sessions()
returns void language sql security definer set search_path = public as $$
  delete from public.account_sessions where expires_at < now() - interval '7 days';
  delete from public.login_attempts where created_at < now() - interval '90 days';
$$;
revoke all on function public.purge_expired_sessions() from public, anon, authenticated;

commit;
