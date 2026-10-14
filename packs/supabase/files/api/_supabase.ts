/**
 * Supabase from a serverless function, over PostgREST with plain `fetch`.
 *
 * NO SDK ON THE SERVER, deliberately: a function that inserts one row does not
 * need a client library's cold-start weight, and PostgREST's URL grammar is
 * small enough to read in the code (`?column=eq.value&select=a,b&limit=1`).
 * See https://postgrest.org/en/stable/references/api/tables_views.html
 *
 * The SERVICE-ROLE key bypasses Row Level Security, which is what lets every
 * table stay locked to `anon`. It must only ever be read here, server-side.
 */

export type SupabaseEnv = { url: string; headers: Record<string, string> };

export function supabaseEnv(scope = 'api'): SupabaseEnv | null {
  const url = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    // Names only, never values: this line exists so the platform log says
    // exactly which configuration is missing.
    if (!url) console.error(`[${scope}] Missing required environment variable: SUPABASE_URL`);
    if (!key)
      console.error(`[${scope}] Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY`);
    return null;
  }
  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
  };
}

export type RestResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

/**
 * One PostgREST call. Never throws: a network failure is `status: 0`, so a
 * route can decide what an outage means for it instead of crashing.
 *
 *   await rest<Row[]>(env, 'messages?select=id,created_at&order=created_at.desc&limit=10')
 *   await rest<Row[]>(env, 'messages', { method: 'POST', body: row, prefer: 'return=representation' })
 *   await rest(env, 'rpc/my_function', { method: 'POST', body: { arg: 1 } })
 */
export async function rest<T = unknown>(
  env: SupabaseEnv,
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<RestResult<T>> {
  try {
    const response = await fetch(`${env.url}/rest/v1/${path}`, {
      method: init.method ?? 'GET',
      headers: { ...env.headers, ...(init.prefer ? { Prefer: init.prefer } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    if (!response.ok) return { ok: false, status: response.status, error: text.slice(0, 300) };
    return { ok: true, status: response.status, data: (text ? JSON.parse(text) : null) as T };
  } catch (error) {
    return { ok: false, status: 0, error: String(error).slice(0, 300) };
  }
}

/** PostgREST filter value, encoded. `eq(id)` -> `eq.<encoded id>`. */
export const eq = (value: string | number) => `eq.${encodeURIComponent(String(value))}`;

/** True when a failed insert was a unique-constraint violation (Postgres 23505). */
export const isUniqueViolation = (result: RestResult<unknown>) =>
  !result.ok && result.status === 409;
