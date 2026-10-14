import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clientIpHash, jsonBody, sameOrigin, send } from './_http';
import { supabaseEnv } from './_supabase';
import {
  accountLocked,
  burnTiming,
  clearSessionCookie,
  createSession,
  findAccountByEmail,
  hashPassword,
  loginRateLimited,
  normaliseEmail,
  noteFailure,
  noteSuccess,
  passwordProblem,
  publicProfile,
  recordLoginAttempt,
  requireAccount,
  revokeAllSessions,
  revokeSession,
  sessionFromRequest,
  setSessionCookie,
  verifyPassword,
} from './_auth';

/**
 *   GET  /api/auth/session    -> { account | null }
 *   POST /api/auth/login      { email, password }
 *   POST /api/auth/logout
 *   POST /api/auth/password   { current_password, new_password }
 *
 * One function for all four (vercel.json rewrites /api/auth/:action here):
 * the Hobby plan allows twelve functions per deployment.
 */

/** Wrong address, wrong password, locked, disabled: one sentence, one timing. */
const INVALID = 'Invalid email or password.';

const clientLabel = (req: VercelRequest) => {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 160) : null;
};

async function handleSession(req: VercelRequest, res: VercelResponse) {
  // Never cached anywhere: serving one person's identity to the next user of
  // a shared device is the failure this prevents.
  res.setHeader('Cache-Control', 'no-store, private');
  const env = supabaseEnv('auth');
  if (!env) return send(res, 200, { account: null });
  const session = await sessionFromRequest(req, env);
  send(res, 200, { account: session ? publicProfile(session.account) : null });
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, private');
  const body = jsonBody(req);
  if (!body) return send(res, 400, { error: 'Request body must be JSON.' });
  const email = normaliseEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  const env = supabaseEnv('auth');
  if (!env) return send(res, 503, { error: 'Sign-in is unavailable right now.' });
  const ipHash = await clientIpHash(req);

  // Malformed input still costs a hash and still counts, so junk probing is neither faster nor free.
  if (!email || !password) {
    await burnTiming(password);
    await recordLoginAttempt(env, { email: email ?? '(malformed)', ipHash, successful: false, reason: 'malformed' });
    return send(res, 401, { error: INVALID });
  }

  if (await loginRateLimited(env, email, ipHash)) {
    await recordLoginAttempt(env, { email, ipHash, successful: false, reason: 'rate_limited' });
    return send(res, 429, { error: 'Too many sign-in attempts. Wait a few minutes and try again.' });
  }

  const account = await findAccountByEmail(env, email);
  if (!account) {
    await burnTiming(password);
    await recordLoginAttempt(env, { email, ipHash, successful: false, reason: 'unknown_email' });
    return send(res, 401, { error: INVALID });
  }

  // Verify BEFORE answering locked/disabled, for the same timing reason.
  const passwordOk = await verifyPassword(account.password_hash, password);
  const refuse = async (reason: string) => {
    await recordLoginAttempt(env, { email, ipHash, successful: false, accountId: account.id, reason });
    send(res, 401, { error: INVALID });
  };
  if (accountLocked(account)) return refuse('locked');
  if (!account.active) return refuse('disabled');
  if (!passwordOk) {
    await noteFailure(env, account);
    return refuse('bad_password');
  }

  const token = await createSession(env, account.id, clientLabel(req));
  if (!token) return send(res, 503, { error: 'Sign-in is unavailable right now.' });
  await noteSuccess(env, account.id);
  await recordLoginAttempt(env, { email, ipHash, successful: true, accountId: account.id });
  setSessionCookie(res, token);
  send(res, 200, { ok: true, account: publicProfile(account) });
}

/** Revoke server-side FIRST, then clear the cookie. Always 200. */
async function handleLogout(req: VercelRequest, res: VercelResponse) {
  const env = supabaseEnv('auth');
  if (env) {
    const session = await sessionFromRequest(req, env);
    if (session) await revokeSession(env, session.token);
  }
  clearSessionCookie(res);
  send(res, 200, { ok: true });
}

/** Change your own password. Re-proves the current one (the unattended-device threat). */
async function handlePassword(req: VercelRequest, res: VercelResponse) {
  const auth = await requireAccount(req, res);
  if (!auth) return;
  const body = jsonBody(req);
  if (!body) return send(res, 400, { error: 'Request body must be JSON.' });
  const current = typeof body.current_password === 'string' ? body.current_password : '';
  const next = typeof body.new_password === 'string' ? body.new_password : '';
  const problem = passwordProblem(next);
  if (problem) return send(res, 422, { error: problem });
  if (next === current) return send(res, 422, { error: 'Choose a new password.' });

  const account = await findAccountByEmail(auth.env, auth.account.email);
  if (!account || !(await verifyPassword(account.password_hash, current)))
    return send(res, 401, { error: 'Current password is incorrect.' });

  const update = await fetch(`${auth.env.url}/rest/v1/accounts?id=eq.${auth.account.id}`, {
    method: 'PATCH',
    headers: auth.env.headers,
    body: JSON.stringify({
      password_hash: await hashPassword(next),
      must_change_password: false,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!update.ok) return send(res, 503, { error: 'The password could not be changed.' });

  // Everything signed in under the old password stops working; this device gets a fresh session.
  await revokeAllSessions(auth.env, auth.account.id);
  const token = await createSession(auth.env, auth.account.id, clientLabel(req));
  if (token) setSessionCookie(res, token);
  send(res, 200, { ok: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.action;
  const action = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  if (req.method === 'GET') {
    if (action && action !== 'session') return send(res, 405, { error: 'Method not allowed.' });
    return handleSession(req, res);
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!sameOrigin(req)) return send(res, 403, { error: 'Request blocked.' });
  switch (action) {
    case 'login':
      return handleLogin(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'password':
      return handlePassword(req, res);
    default:
      return send(res, 400, { error: 'Unknown action.' });
  }
}
