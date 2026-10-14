/**
 * URL anonymisation for analytics. A plain module (no components) so a test
 * can import it and Fast Refresh stays happy.
 *
 * WHY. Both Vercel products report the page URL. A route that carries a
 * secret in its path (a magic link, a ticket token, a reset code) would ship
 * live credentials into a third-party pipeline AND fill the dashboard with
 * one row per token instead of one per page. List those route shapes here.
 *
 * A denylist of token-bearing shapes rather than an allowlist of pages: a new
 * ordinary page is reported without anyone remembering to register it, while
 * a new token route is a deliberate act that lands next to this comment.
 */

/** `[prefix, label]`: `/ticket/<anything>` is reported as `/ticket/[token]`. */
export const TOKEN_ROUTES: [string, string][] = [
  // ['/ticket', '[token]'],
  // ['/reset-password', '[code]'],
];

export function anonymisePath(pathname: string): string {
  for (const [prefix, label] of TOKEN_ROUTES)
    if (pathname.startsWith(`${prefix}/`) && pathname.length > prefix.length + 1)
      return `${prefix}/${label}`;
  return pathname;
}

/** Query and hash are dropped wholesale: `?token=` would be the same leak. */
export function scrubUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.pathname = anonymisePath(url.pathname);
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return raw;
  }
}

/**
 * TOTAL on purpose: whatever this returns is reported, and anything it THROWS
 * loses the event (looking exactly like an integration that was never
 * installed). So it never assumes a shape.
 */
export const scrubEvent = <T extends { url?: unknown }>(event: T): T => {
  try {
    if (!event || typeof event.url !== 'string') return event;
    return { ...event, url: scrubUrl(event.url) };
  } catch {
    return event;
  }
};
