import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, send } from './_http';
import { supabaseEnv } from './_supabase';
import { featureEnabled } from './_features';

/**
 * GET /api/features?name=<switch>  ->  { name, enabled }
 *
 * ADVISORY ONLY. It lets a page say "registrations are closed" instead of
 * drawing a form that will be refused, but the route that does the work must
 * ask `featureEnabled` itself and enforce it. Only switches listed here can be
 * asked about, so the endpoint cannot be used to map every internal flag.
 */
const PUBLIC_SWITCHES = new Set(['example_launch']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  const name = typeof req.query.name === 'string' ? req.query.name : '';
  if (!PUBLIC_SWITCHES.has(name)) return send(res, 404, { error: 'Unknown switch.' });
  res.setHeader('Cache-Control', 'no-store');
  const env = supabaseEnv('features');
  const enabled = env ? await featureEnabled(env, name, 'features') : false;
  send(res, 200, { name, enabled });
}
