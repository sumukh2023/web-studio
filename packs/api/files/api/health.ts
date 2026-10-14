import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, send } from './_http';

/**
 * GET /api/health: proves the function runtime is up. Safe to leave
 * deployed; it reveals nothing but the time. Delete it if you prefer.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  res.setHeader('Cache-Control', 'no-store');
  send(res, 200, { ok: true, time: new Date().toISOString() });
}
