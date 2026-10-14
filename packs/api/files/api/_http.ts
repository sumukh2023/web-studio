/**
 * Request/response helpers shared by every function in api/.
 *
 * Files prefixed with an underscore are not exposed as routes by Vercel, so
 * this is a library, not an endpoint.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sha256Hex } from './_crypto';

export type Handler = (
  req: VercelRequest,
  res: VercelResponse
) => void | Promise<void>;

/** Send a JSON response on the classic Vercel Node (req, res) signature. */
export function send(
  res: VercelResponse,
  status: number,
  body: Record<string, unknown>
): void {
  res.status(status).json(body);
}

/**
 * Refuse any method the route does not implement, with a proper 405 and an
 * `Allow` header. Returns false when the caller should stop.
 */
export function allowMethods(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[]
): boolean {
  if (req.method && methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  send(res, 405, { error: 'Method not allowed.' });
  return false;
}

/** The parsed JSON body, or null when absent/malformed/not an object. */
export function jsonBody(req: VercelRequest): Record<string, unknown> | null {
  const body = req.body as unknown;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return null;
}

/** Trim, collapse whitespace, strip control characters, cap length. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    // eslint-disable-next-line no-control-regex -- stripping control chars is the point
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

/**
 * Like `cleanText` but keeps line breaks, for a message body. Collapses runs
 * of blank lines so a pasted wall of newlines cannot pad an email.
 */
export function cleanMultiline(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex -- stripping control chars is the point
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!cleaned) return null;
  return cleaned.slice(0, max);
}

/** A plausible email address, lower-cased, or null. Not a deliverability check. */
export function cleanEmail(value: unknown): string | null {
  const text = cleanText(value, 254);
  if (!text) return null;
  const email = text.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

/**
 * Is this request from our own page?
 *
 * A same-origin check for state-changing requests: a form posted from
 * another site carries that site's Origin and is refused. A request with no
 * Origin (curl, a health check, a server) is allowed, because the browser
 * threat this closes is cross-SITE submission and those clients were never
 * subject to it. It is a CSRF guard, never an authorisation check.
 */
export function sameOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * The client's IP, hashed. Never the address itself.
 *
 * `x-forwarded-for` is a list and Vercel puts the real client first. A
 * caller can put anything in that header, which is exactly why this is a
 * rate-limit signal and never an authorisation one.
 */
export async function clientIpHash(req: VercelRequest): Promise<string | null> {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = raw?.split(',')[0]?.trim();
  return ip ? sha256Hex(ip) : null;
}

/**
 * Read a required server-side environment variable. Logs the NAME (never the
 * value) when it is missing, so the platform logs say exactly what to set.
 */
export function requireEnv(name: string, scope = 'api'): string | null {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`[${scope}] Missing required environment variable: ${name}`);
    return null;
  }
  return value;
}
