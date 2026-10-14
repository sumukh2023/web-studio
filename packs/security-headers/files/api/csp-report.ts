import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/csp-report: the Content-Security-Policy report sink.
 *
 * NOTHING IS STORED. A report goes to the platform log and no further. Report
 * bodies are attacker-shapeable strings on an unauthenticated endpoint, so a
 * table would mean accepting anonymous writes into the database; a log line
 * cannot be queried back out of the site.
 *
 * ALWAYS 204, whatever arrives: the browser is not listening, and a sink that
 * argues with malformed input can be probed. Capped per instance per minute,
 * so a script cannot turn one visit into an unbounded column in the log.
 */
const LOG_LIMIT = 50;
const WINDOW_MS = 60_000;
let windowStart = 0;
let logged = 0;
let dropped = 0;

/** Referer path with identifier-length segments masked (tokens stay out of logs). */
function refererPath(req: VercelRequest): string {
  const referer = req.headers.referer;
  if (typeof referer !== 'string' || !referer) return 'unknown';
  try {
    return new URL(referer).pathname
      .split('/')
      .map((s) => (/^[A-Za-z0-9_-]{16,}$/.test(s) ? ':id' : s))
      .join('/');
  } catch {
    return 'unknown';
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(204).end();
    return;
  }
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    if (dropped > 0) console.warn(`[csp] ${dropped} more report(s) dropped this window`);
    windowStart = now;
    logged = 0;
    dropped = 0;
  }
  if (logged >= LOG_LIMIT) {
    dropped += 1;
    res.status(204).end();
    return;
  }
  logged += 1;
  // A native `application/csp-report` body is unreadable here (see
  // src/utils/csp-reporter.ts); log which page sent it instead.
  const body: unknown = req.body;
  const raw =
    typeof body === 'string'
      ? body
      : Buffer.isBuffer(body)
        ? body.toString('utf8')
        : body == null
          ? `native report, body unreadable, page=${refererPath(req)}`
          : JSON.stringify(body);
  console.warn(`[csp] ${raw.slice(0, 2048)}`);
  res.status(204).end();
}
