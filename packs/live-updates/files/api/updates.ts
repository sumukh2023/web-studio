import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, send } from './_http';
import { rest, supabaseEnv } from './_supabase';

/**
 * GET /api/updates -> { updates: [...] }, the latest published updates.
 * The polling fallback for browsers without the realtime path, cached at the
 * edge for 30s so a crowd refreshing at once is one database read.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET'])) return;
  const env = supabaseEnv('updates');
  if (!env) return send(res, 200, { updates: [] });
  const result = await rest<unknown[]>(
    env,
    'updates?select=id,title,message,priority,cta_label,cta_url,published_at,created_at' +
      '&published=eq.true&order=published_at.desc.nullslast&limit=50'
  );
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  send(res, 200, { updates: result.ok ? result.data : [] });
}
