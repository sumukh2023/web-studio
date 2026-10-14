/**
 * Rate limiting for public endpoints, on a ledger table.
 *
 * WHY A TABLE. A serverless function keeps no memory between invocations, and
 * not every route writes a row it could count (a lookup writes nothing). So
 * each request is recorded in `api_rate_events`, keyed by a SHA-256 of the
 * email and of the IP. No plaintext address of either kind is ever stored.
 * See supabase/migrations/*_rate_limit_ledger.sql.
 *
 * FAILS OPEN, deliberately: a limiter that cannot read its own ledger must not
 * become a door nobody can open. It logs when that happens, so a limiter
 * silently doing nothing is visible rather than assumed. (Contrast feature
 * switches, which fail CLOSED: see the feature-flags pack.)
 */
import { sha256Hex } from './_crypto';
import type { SupabaseEnv } from './_supabase';

export type RateOptions = {
  /** Which endpoint. Free text, 1 to 40 characters; no migration to add one. */
  scope: string;
  /** The identity being limited, if the request carries one. Hashed here. */
  email?: string | null;
  /** From `clientIpHash(req)` in _http.ts. */
  ipHash?: string | null;
  windowMinutes: number;
  maxPerEmail: number;
  maxPerIp: number;
};

type Outcome = 'accepted' | 'blocked' | 'failed';

async function record(
  env: SupabaseEnv,
  scope: string,
  outcome: Outcome,
  emailHash: string | null,
  ipHash: string | null
) {
  const rows = [
    emailHash ? { scope, key_kind: 'email', key_hash: emailHash, outcome } : null,
    ipHash ? { scope, key_kind: 'ip', key_hash: ipHash, outcome } : null,
  ].filter(Boolean);
  if (!rows.length) return;
  try {
    const response = await fetch(`${env.url}/rest/v1/api_rate_events`, {
      method: 'POST',
      headers: { ...env.headers, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
    if (!response.ok)
      console.error(`[ratelimit] scope=${scope} stage=record status=${response.status}`);
  } catch {
    console.error(`[ratelimit] scope=${scope} stage=record unreachable`);
  }
}

/** Count what these keys did lately; record this request's outcome. */
export async function rateLimit(
  env: SupabaseEnv,
  options: RateOptions
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const { scope, windowMinutes, maxPerEmail, maxPerIp } = options;
  const retryAfterSeconds = windowMinutes * 60;
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const emailHash = options.email ? await sha256Hex(options.email.toLowerCase()) : null;
  const ipHash = options.ipHash ?? null;

  const count = async (kind: 'email' | 'ip', hash: string) => {
    const url =
      `${env.url}/rest/v1/api_rate_events?select=id` +
      `&scope=eq.${encodeURIComponent(scope)}&key_kind=eq.${kind}` +
      `&key_hash=eq.${hash}&created_at=gte.${since}` +
      `&limit=${Math.max(maxPerEmail, maxPerIp) + 1}`;
    try {
      const response = await fetch(url, { headers: env.headers });
      if (!response.ok) {
        console.error(`[ratelimit] scope=${scope} stage=count status=${response.status}`);
        return null;
      }
      const rows = (await response.json()) as unknown[];
      return Array.isArray(rows) ? rows.length : null;
    } catch {
      console.error(`[ratelimit] scope=${scope} stage=count unreachable`);
      return null;
    }
  };

  const [byEmail, byIp] = await Promise.all([
    emailHash ? count('email', emailHash) : Promise.resolve(null),
    ipHash ? count('ip', ipHash) : Promise.resolve(null),
  ]);
  const blocked =
    (byEmail !== null && byEmail >= maxPerEmail) || (byIp !== null && byIp >= maxPerIp);

  if (blocked) {
    console.warn(
      `[ratelimit] scope=${scope} outcome=blocked by_email=${byEmail ?? '-'} by_ip=${byIp ?? '-'}`
    );
    await record(env, scope, 'blocked', emailHash, ipHash);
    return { allowed: false, retryAfterSeconds };
  }
  await record(env, scope, 'accepted', emailHash, ipHash);
  return { allowed: true, retryAfterSeconds };
}

/**
 * A failed attempt (wrong code, unknown booking), recorded against the same
 * keys. Not worth detail to the caller; a hundred from one source is worth
 * being able to see.
 */
export async function recordFailure(
  env: SupabaseEnv,
  scope: string,
  email: string | null,
  ipHash: string | null
): Promise<void> {
  const emailHash = email ? await sha256Hex(email.toLowerCase()) : null;
  await record(env, scope, 'failed', emailHash, ipHash);
}
