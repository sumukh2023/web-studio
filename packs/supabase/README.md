# supabase: a Postgres database for your API

Server-side database access for `api/` routes, over Supabase's REST API
(PostgREST) with plain `fetch`. The browser never talks to the database
directly and never holds a privileged key.

## What you get

| File | What it is |
| --- | --- |
| `api/_supabase.ts` | `supabaseEnv()`, `rest(env, path, init)` (never throws; returns `{ ok, status, data \| error }`), `eq()`, `isUniqueViolation()`. |
| `api/_ratelimit.ts` | `rateLimit(env, { scope, email, ipHash, windowMinutes, maxPerEmail, maxPerIp })` and `recordFailure`. Hashed keys, fails open, logs. |
| `supabase/migrations/20260101000000_rate_limit_ledger.sql` | The `api_rate_events` table the limiter uses, RLS on, purge function. |
| `scripts/db-check-migrations.mjs` | `npm run db:check`: timestamped names, unique order, warns on edited history. |

## Setup

1. Create a project at supabase.com. Copy the **Project URL** and the
   **service_role** key (Settings, API).
2. Put them in `.env` for local `vercel dev`, and in the Vercel project's
   Environment Variables for deploys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Apply the migrations in filename order: `supabase db push` with the
   Supabase CLI, or paste each file into the SQL editor.

## Using it in a route

```ts
import { supabaseEnv, rest } from './_supabase';
import { rateLimit } from './_ratelimit';
import { clientIpHash, send } from './_http';

const env = supabaseEnv('subscribe');
if (!env) return send(res, 503, { error: 'Temporarily unavailable.' });

const limit = await rateLimit(env, {
  scope: 'subscribe', email, ipHash: await clientIpHash(req),
  windowMinutes: 60, maxPerEmail: 3, maxPerIp: 20,
});
if (!limit.allowed) {
  res.setHeader('Retry-After', String(limit.retryAfterSeconds));
  return send(res, 429, { error: 'Too many requests. Try again later.' });
}

const saved = await rest(env, 'subscribers', { method: 'POST', body: { email }, prefer: 'return=minimal' });
if (!saved.ok) return send(res, 500, { error: 'Could not save. Please try again.' });
```

## Every new table

```sql
alter table public.my_table enable row level security;
revoke all on public.my_table from anon, authenticated;
```

Lock it to the browser roles and let `api/` (service role) be the only door.
Open a narrow `select` policy for `anon` only when the browser genuinely reads
it live (the `live-updates` pack does this for published rows only).

## The standing rule

**Never reconstruct or replace a production database function from an older
migration file without first checking the live production definition and the
applied migration history. Production changes must be based on the current
live state and represented by a new forward migration.**

A file existing in `supabase/migrations/` does not mean it was ever applied.
Before touching a production function or table:

1. Read the LIVE definition: `select prosrc from pg_proc where proname = '…'`,
   `pg_get_constraintdef(oid)`, `pg_get_function_identity_arguments(oid)`.
2. Read what was actually applied:
   `select version, name from supabase_migrations.schema_migrations order by version desc`.
3. Compare the two. On a real project they diverge.
4. Only then write a NEW forward migration, built from the live state.

Why this is not hypothetical: a migration once
sat unapplied for eight days while being the newest on-disk definition of a
booking function. Rebuilding the function from it added a call to a helper
that did not exist in production, and because **plpgsql does not resolve a
function body until it runs**, `create or replace` reported success and every
booking then failed with error 42883. Date-only migration names made it worse:
same-day files sort alphabetically, not in the order they were written.
`npm run db:check` enforces full timestamps for that reason.

## Testing without a real database

For SQL you need a real Postgres. `@electric-sql/pglite` runs Postgres
compiled to WebAssembly inside Node with nothing installed, which is enough
to replay every migration on a fresh database in CI and assert the result.
It is not evidence of concurrent-session behaviour (row locks, races); test
those against a real cluster.
