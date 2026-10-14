-- UPI QR payments, settled by hand against the bank statement.
-- A row is created by YOUR route (an order, a ticket, a donation) through
-- api/_payments.ts; the payer then submits the UTR their app shows.
begin;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  -- Short, unambiguous, printed on the QR (`tr`) and in the bank statement.
  reference text not null unique check (reference ~ '^[A-Z0-9-]{6,32}$'),
  purpose text not null check (length(purpose) between 1 and 60),
  -- WHOLE RUPEES. The QR's amount is read from here, never from the browser.
  amount_rupees integer not null check (amount_rupees > 0),
  payer_email text,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'verified', 'rejected', 'cancelled')),
  -- 12-digit UPI transaction reference. UNIQUE: one transaction can settle
  -- one payment, however many times somebody pastes it.
  utr text unique check (utr is null or utr ~ '^[0-9]{12}$'),
  submitted_at timestamptz,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now()
);

create index if not exists payments_status_idx on public.payments (status, created_at desc);

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;

commit;

-- Reconcile (Supabase SQL editor), once the money is in the account:
--   update public.payments set status = 'verified', verified_at = now(), verified_by = 'you'
--    where utr = '412345678901' and status = 'submitted';
