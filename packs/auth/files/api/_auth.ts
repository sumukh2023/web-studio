/**
 * Accounts, sessions, roles. Everything security-relevant about sign-in lives
 * here; routes call `requireAccount`/`requireRole` and never reason about it.
 *
 * - SESSIONS ARE SERVER-SIDE. The cookie carries an opaque 32-byte token; the
 *   database stores only its SHA-256, so a leaked dump cannot be replayed.
 *   Expiry and revocation are re-checked on every request, which is what
 *   makes logout and "disable this account" take effect immediately.
 * - NOTHING ABOUT AUTH IS WHERE A SCRIPT CAN READ IT. No localStorage, no
 *   readable cookie, no token in a response body.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hash as argonHash, verify as argonVerify, Algorithm } from '@node-rs/argon2';
import { send } from './_http';
import { randomToken, sha256Hex } from './_crypto';
import { supabaseEnv, type SupabaseEnv } from './_supabase';

/** WIDEST LAST, and the order IS the hierarchy. Mirror the SQL CHECK. */
export const ROLES = ['member', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/** An unknown role ranks below everything: it must lose every comparison. */
export const roleRank = (role: string) => (ROLES as readonly string[]).indexOf(role);
export const roleAtLeast = (role: string, floor: Role) => roleRank(role) >= roleRank(floor);

export type Account = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  active: boolean;
  must_change_password: boolean;
};

/**
 * NOT `__Host-` prefixed, on purpose: when a prefixed cookie fails its rules
 * the browser drops it SILENTLY, the login response looks successful, and the
 * next request arrives anonymous, which reads as "my correct password was
 * refused". HttpOnly + Secure + SameSite=Lax + an Origin check is the guard.
 */
export const SESSION_COOKIE = 'session';
const SESSION_HOURS = 12;
export const MIN_PASSWORD_LENGTH = 12;

/** Argon2id at OWASP's second option (19 MiB, t=2, p=1): ~120ms per login. */
const ARGON = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export const hashPassword = (password: string) => argonHash(password, ARGON);

/** A malformed or missing hash returns false, never throws: a damaged row is not a bypass. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argonVerify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Verify against a decoy when the email does not exist, so a missing account
 * costs the same ~120ms as a wrong password. Otherwise response timing tells
 * an attacker which addresses are real, which the single error sentence
 * exists to hide.
 */
let decoyHash: string | null = null;
export async function burnTiming(password: string): Promise<void> {
  decoyHash ??= await hashPassword(randomToken(16));
  await verifyPassword(decoyHash, password);
}

/** Length beats composition rules (OWASP). Returns a message, or null. */
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > 200) return 'Password is too long.';
  if (/^(.)\1+$/.test(password)) return 'Choose a less predictable password.';
  return null;
}

export function normaliseEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

/* ------------------------------------------------------------------ */
/*  Cookies                                                             */
/* ------------------------------------------------------------------ */

/**
 * SameSite=Lax, not Strict: Lax already withholds the cookie from cross-site
 * POSTs (the CSRF case), and Strict would make anyone opening the site from a
 * link in a message arrive looking signed out.
 */
function cookie(value: string, maxAgeSeconds: number): string {
  return [
    `${SESSION_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}
export const setSessionCookie = (res: VercelResponse, token: string) =>
  res.setHeader('Set-Cookie', cookie(token, SESSION_HOURS * 3600));
export const clearSessionCookie = (res: VercelResponse) =>
  res.setHeader('Set-Cookie', cookie('', 0));

function readCookie(req: VercelRequest, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq !== -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  PostgREST                                                           */
/* ------------------------------------------------------------------ */

/**
 * A write without `Prefer: return=representation` comes back with NO BODY
 * (204 / empty 201). Calling .json() on that throws, which once took down
 * every login AFTER the attempt row was written: the database said sign-in
 * succeeded while the browser got a 500. So read text and decide from it.
 */
async function query<T>(env: SupabaseEnv, path: string, init?: RequestInit): Promise<T | null> {
  const response = await fetch(`${env.url}/rest/v1/${path}`, {
    ...init,
    headers: { ...env.headers, ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    console.error(`[auth] status=${response.status} path=${path.split('?')[0]}`);
    return null;
  }
  const text = await response.text();
  if (!text.trim()) return [] as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return [] as unknown as T;
  }
}

const ACCOUNT_SELECT = 'select=id,full_name,email,role,active,must_change_password';

/* ------------------------------------------------------------------ */
/*  Sessions                                                            */
/* ------------------------------------------------------------------ */

/** Mint a session; returns the raw token exactly once (for the cookie). */
export async function createSession(
  env: SupabaseEnv,
  accountId: string,
  clientLabel: string | null
): Promise<string | null> {
  const token = randomToken(32);
  const rows = await query<{ id: string }[]>(env, 'account_sessions', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      account_id: accountId,
      token_hash: await sha256Hex(token),
      expires_at: new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString(),
      client_label: clientLabel,
    }),
  });
  return rows && rows.length ? token : null;
}

export async function revokeSession(env: SupabaseEnv, token: string): Promise<void> {
  await query(env, `account_sessions?token_hash=eq.${await sha256Hex(token)}&revoked_at=is.null`, {
    method: 'PATCH',
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
}

/** Revoke every live session for an account (disable, demote, password change). */
export async function revokeAllSessions(env: SupabaseEnv, accountId: string): Promise<void> {
  await query(env, `account_sessions?account_id=eq.${accountId}&revoked_at=is.null`, {
    method: 'PATCH',
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
}

export async function findAccountById(env: SupabaseEnv, id: string): Promise<Account | null> {
  const rows = await query<Account[]>(
    env,
    `accounts?${ACCOUNT_SELECT}&id=eq.${encodeURIComponent(id)}&limit=1`
  );
  return rows?.[0] ?? null;
}

/**
 * Cookie -> live account, or null. TWO PLAIN QUERIES rather than one
 * PostgREST embed: an embed's shape (object vs one-element array, which
 * relationship it picks) depends on the server, and guessing wrong returns
 * null for a perfectly valid session, a login that silently bounces.
 */
export async function sessionFromRequest(
  req: VercelRequest,
  env: SupabaseEnv
): Promise<{ account: Account; token: string } | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{20,128}$/.test(token)) return null;
  const rows = await query<
    { id: string; expires_at: string; revoked_at: string | null; account_id: string }[]
  >(
    env,
    `account_sessions?select=id,expires_at,revoked_at,account_id&token_hash=eq.${await sha256Hex(token)}&limit=1`
  );
  const row = rows?.[0];
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
  const account = await findAccountById(env, row.account_id);
  if (!account || !account.active) return null;
  // Liveness stamp; a failure here must never fail the request.
  void query(env, `account_sessions?id=eq.${row.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ last_seen_at: new Date().toISOString() }),
  }).catch(() => {});
  return { account, token };
}

/* ------------------------------------------------------------------ */
/*  Route guards                                                        */
/* ------------------------------------------------------------------ */

export type AuthContext = { env: SupabaseEnv; account: Account; token: string };

/**
 * Gate a route on a valid session. Responds and returns null when it fails:
 *     const auth = await requireAccount(req, res); if (!auth) return;
 * 401 never says whether the session was missing, expired or revoked.
 */
export async function requireAccount(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthContext | null> {
  res.setHeader('Cache-Control', 'no-store, private');
  const env = supabaseEnv('auth');
  if (!env) {
    send(res, 503, { error: 'Sign-in is unavailable right now.' });
    return null;
  }
  const session = await sessionFromRequest(req, env);
  if (!session) {
    send(res, 401, { error: 'Sign in to continue.' });
    return null;
  }
  return { env, ...session };
}

/** As above and at least `floor`. 403 (known caller, not enough rights), not 404. */
export async function requireRole(
  req: VercelRequest,
  res: VercelResponse,
  floor: Role
): Promise<AuthContext | null> {
  const auth = await requireAccount(req, res);
  if (!auth) return null;
  if (!roleAtLeast(auth.account.role, floor)) {
    send(res, 403, { error: 'You do not have access to this.' });
    return null;
  }
  return auth;
}

/* ------------------------------------------------------------------ */
/*  Lockout and the attempt ledger                                      */
/* ------------------------------------------------------------------ */

const MAX_FAILURES_PER_EMAIL = 5;
const MAX_FAILURES_PER_IP = 20;
const WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;

export async function recordLoginAttempt(
  env: SupabaseEnv,
  entry: { email: string; ipHash: string | null; successful: boolean; accountId?: string | null; reason?: string }
): Promise<void> {
  await query(env, 'login_attempts', {
    method: 'POST',
    body: JSON.stringify({
      email: entry.email,
      ip_hash: entry.ipHash,
      successful: entry.successful,
      account_id: entry.accountId ?? null,
      reason: entry.reason ?? null,
    }),
  });
}

/** Counted from the durable ledger: an in-memory limiter resets on every cold start. */
export async function loginRateLimited(
  env: SupabaseEnv,
  email: string,
  ipHash: string | null
): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const base = `login_attempts?select=id&successful=is.false&created_at=gte.${since}`;
  const byEmail = await query<{ id: number }[]>(
    env,
    `${base}&email=eq.${encodeURIComponent(email)}&limit=${MAX_FAILURES_PER_EMAIL}`
  );
  if (byEmail && byEmail.length >= MAX_FAILURES_PER_EMAIL) return true;
  if (ipHash) {
    const byIp = await query<{ id: number }[]>(
      env,
      `${base}&ip_hash=eq.${ipHash}&limit=${MAX_FAILURES_PER_IP}`
    );
    if (byIp && byIp.length >= MAX_FAILURES_PER_IP) return true;
  }
  return false;
}

export type AccountRow = Account & {
  password_hash: string;
  failed_attempts: number;
  locked_until: string | null;
};

export async function findAccountByEmail(env: SupabaseEnv, email: string): Promise<AccountRow | null> {
  const rows = await query<AccountRow[]>(
    env,
    `accounts?${ACCOUNT_SELECT},password_hash,failed_attempts,locked_until&email=eq.${encodeURIComponent(email)}&limit=1`
  );
  return rows?.[0] ?? null;
}

export const accountLocked = (a: AccountRow) =>
  a.locked_until !== null && new Date(a.locked_until).getTime() > Date.now();

export async function noteFailure(env: SupabaseEnv, account: AccountRow): Promise<void> {
  const failed = account.failed_attempts + 1;
  await query(env, `accounts?id=eq.${account.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      failed_attempts: failed,
      locked_until:
        failed >= MAX_FAILURES_PER_EMAIL
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          : account.locked_until,
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function noteSuccess(env: SupabaseEnv, accountId: string): Promise<void> {
  const now = new Date().toISOString();
  await query(env, `accounts?id=eq.${accountId}`, {
    method: 'PATCH',
    body: JSON.stringify({ failed_attempts: 0, locked_until: null, last_login: now, updated_at: now }),
  });
}

/** What the browser may know about an account. Never the hash, never lockout state. */
export function publicProfile(account: Account) {
  return {
    id: account.id,
    full_name: account.full_name,
    email: account.email,
    role: account.role,
    must_change_password: account.must_change_password,
  };
}
