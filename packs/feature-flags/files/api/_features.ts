/**
 * Is a feature switch on? Asked of `public.feature_rollout` on EVERY request.
 *
 * OFF IS THE ANSWER TO EVERY QUESTION THIS CANNOT ANSWER. No row, a null
 * timestamp, a future timestamp, an unreadable body, a 500, a socket that
 * never opened: all false. That is the point, not defensive habit. A switch
 * that gates whether you are SELLING something must fail closed, or an outage
 * reopens a shop you closed on purpose.
 *
 * NO CACHE, also on purpose: flipping the row must take effect on the next
 * request without a redeploy, and even a short cache is a promise it might not.
 */
import type { SupabaseEnv } from './_supabase';

export async function featureEnabled(
  env: SupabaseEnv,
  feature: string,
  scope = 'api'
): Promise<boolean> {
  try {
    const response = await fetch(
      `${env.url}/rest/v1/feature_rollout?select=enabled_from` +
        `&feature=eq.${encodeURIComponent(feature)}&limit=1`,
      { headers: env.headers }
    );
    if (!response.ok) {
      console.error(
        `[${scope}] stage=feature feature=${feature} status=${response.status} treating as off`
      );
      return false;
    }
    const rows = (await response.json()) as { enabled_from: string | null }[];
    const enabledFrom = rows[0]?.enabled_from ?? null;
    if (!enabledFrom) return false;
    const at = Date.parse(enabledFrom);
    return Number.isFinite(at) && at <= Date.now();
  } catch {
    console.error(`[${scope}] stage=feature feature=${feature} unreachable, treating as off`);
    return false;
  }
}
