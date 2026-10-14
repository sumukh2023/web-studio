import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, cleanText, clientIpHash, jsonBody, sameOrigin, send } from './_http';
import { eq, rest, supabaseEnv } from './_supabase';
import { rateLimit } from './_ratelimit';
import type { Payment } from './_payments';

/**
 *   GET  /api/payments?ref=PAY-XXXXXXXX  -> { reference, amount, status, purpose }
 *   POST /api/payments { reference, utr } -> claims the UTR, status 'submitted'
 *
 * The page renders the QR from GET's `amount`, so the amount is always the
 * stored one. Verification is manual (see the migration's reconcile note):
 * a submitted UTR is a CLAIM until the money is seen in the account.
 */
const REF = /^[A-Z0-9-]{6,32}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['GET', 'POST'])) return;
  res.setHeader('Cache-Control', 'no-store, private');
  const env = supabaseEnv('payments');
  if (!env) return send(res, 503, { error: 'Payments are unavailable right now.' });

  if (req.method === 'GET') {
    const ref = typeof req.query.ref === 'string' ? req.query.ref.toUpperCase() : '';
    if (!REF.test(ref)) return send(res, 400, { error: 'Unknown payment reference.' });
    const found = await rest<Payment[]>(
      env,
      `payments?select=reference,purpose,amount_rupees,status&reference=${eq(ref)}&limit=1`
    );
    const payment = found.ok ? found.data[0] : undefined;
    if (!payment) return send(res, 404, { error: 'Unknown payment reference.' });
    return send(res, 200, {
      reference: payment.reference,
      purpose: payment.purpose,
      amount: payment.amount_rupees,
      status: payment.status,
    });
  }

  if (!sameOrigin(req)) return send(res, 403, { error: 'Forbidden.' });
  const body = jsonBody(req);
  const reference = cleanText(body?.reference, 32)?.toUpperCase() ?? '';
  const utr = (cleanText(body?.utr, 32) ?? '').replace(/\D/g, '');
  if (!REF.test(reference)) return send(res, 400, { error: 'Unknown payment reference.' });
  if (!/^\d{12}$/.test(utr))
    return send(res, 400, { error: 'A UTR is the 12-digit number your UPI app shows after paying.' });

  const limit = await rateLimit(env, {
    scope: 'payments',
    ipHash: await clientIpHash(req),
    windowMinutes: 15,
    maxPerEmail: 0,
    maxPerIp: 20,
  });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return send(res, 429, { error: 'Too many attempts. Please wait a few minutes.' });
  }

  /* Only a PENDING payment accepts a UTR, in one conditional write, so a
     second submission (or a race between two tabs) changes nothing. */
  const update = await rest<Payment[]>(
    env,
    `payments?reference=${eq(reference)}&status=eq.pending`,
    {
      method: 'PATCH',
      body: { utr, status: 'submitted', submitted_at: new Date().toISOString() },
      prefer: 'return=representation',
    }
  );
  if (!update.ok) {
    if (update.status === 409)
      return send(res, 409, { error: 'That UTR has already been used for another payment. Check the number, or contact us.' });
    return send(res, 500, { error: 'We could not record that. Please try again.' });
  }
  if (!update.data.length)
    return send(res, 409, { error: 'This payment is not waiting for a UTR (already submitted or closed).' });
  send(res, 200, { ok: true, status: 'submitted' });
}
