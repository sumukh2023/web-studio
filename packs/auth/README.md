# auth: accounts, sign-in and roles

Email + password sign-in for a small staff or members area. Built to be
boring in the ways that matter.

## Security model

- **Argon2id** (OWASP: 19 MiB, t=2, p=1, ~120ms). Parameters live in the
  stored PHC string, so raising them later re-hashes on next login.
- **Server-side sessions.** The cookie holds a random 32-byte token; the DB
  stores only its SHA-256. `HttpOnly; Secure; SameSite=Lax`. Expiry and
  revocation are checked on every request, so logout and "disable account"
  are immediate. Password change revokes every other session.
- **No enumeration.** Unknown email, wrong password, locked and disabled all
  answer the same sentence after the same ~120ms (a decoy hash is verified
  for unknown emails).
- **Lockout + rate limits.** 5 failures per email locks it for 15 min; 20 per
  IP per 15 min. Counted from a durable ledger (`login_attempts`), because a
  serverless function forgets everything between invocations.
- **Roles are a hierarchy**: `member < staff < admin`. Guards ask "at least".
- **Same-origin check** on every state-changing action, on top of SameSite.

## Files

| File | Role |
| --- | --- |
| `api/_auth.ts` | Hashing, sessions, cookie, `requireAccount`, `requireRole`, lockout. |
| `api/auth.ts` | `GET /api/auth/session`, `POST /api/auth/login`, `/logout`, `/password` (one function, rewritten by `vercel.json`). |
| `supabase/migrations/*_accounts_and_sessions.sql` | `accounts`, `account_sessions`, `login_attempts`, purge function. |
| `scripts/hash-password.mjs` | `npm run auth:hash -- email "Name" admin`: creates the first admin. |
| `src/auth/SessionProvider.tsx` | `SessionProvider`, `RequireRole`. |
| `src/auth/session-context.ts` | `useSession()` -> `{ state, signIn, signOut, refresh }`. |
| `src/auth/LoginForm.tsx` | A sign-in form built from the forms pack. |

## Wire it up

The pack wraps the app in `<SessionProvider>` for you (`src/main.tsx`). Then:

```tsx
// a protected page
<RequireRole role="staff" fallback={<LoginForm title="Staff sign-in" />}>
  <Dashboard />
</RequireRole>
```

```ts
// a protected route
import { requireRole } from './_auth';
const auth = await requireRole(req, res, 'staff');
if (!auth) return;              // 401/403 already sent
auth.account.id                 // who is asking
```

## Creating accounts

The first admin comes from `npm run auth:hash` + the SQL editor. Add more the
same way, or build an admin-only `api/accounts.ts` with `requireRole(req, res,
'admin')` that inserts `hashPassword(...)` rows. Disable (`active = false`)
rather than delete, and call `revokeAllSessions` when you do.

## Why not a hosted auth provider?

Use Supabase Auth, Clerk or Auth.js if you need social logins, magic links or
self-service sign-up. This pack is for the common small-site case: a handful
of staff accounts created by an admin, no third-party scripts, nothing in
`localStorage`.
