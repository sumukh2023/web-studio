import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  allowMethods,
  cleanEmail,
  cleanMultiline,
  cleanText,
  clientIpHash,
  jsonBody,
  sameOrigin,
  send,
} from './_http';
import { rest, supabaseEnv } from './_supabase';
import { rateLimit } from './_ratelimit';
import { adminInbox, detailTable, emailShell, escapeParagraph, sendMail } from './_email';

/**
 * POST /api/contact  { name, email, message, website? }
 *
 * The order is the design: refuse cheaply, validate, rate-limit, STORE, then
 * mail. A failed email never fails the request; the row is the record.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!sameOrigin(req)) return send(res, 403, { error: 'Forbidden.' });

  const body = jsonBody(req);
  if (!body) return send(res, 400, { error: 'Send the form as JSON.' });

  // Honeypot: a bot filled the field humans never see. Look successful,
  // store nothing, so the bot learns nothing.
  if (cleanText(body.website, 200)) return send(res, 200, { ok: true, mailed: false });

  const name = cleanText(body.name, 120);
  const email = cleanEmail(body.email);
  const message = cleanMultiline(body.message, 4000);
  const fields: Record<string, string> = {};
  if (!name) fields.name = 'Tell us your name.';
  if (!email) fields.email = 'Enter an email address we can reply to.';
  if (!message || message.length < 10) fields.message = 'A sentence or two, at least.';
  if (Object.keys(fields).length)
    return send(res, 400, { error: 'Check the highlighted fields.', fields });

  const env = supabaseEnv('contact');
  if (!env) return send(res, 503, { error: 'The form is not available right now.' });

  const ipHash = await clientIpHash(req);
  const limit = await rateLimit(env, {
    scope: 'contact',
    email,
    ipHash,
    windowMinutes: 60,
    maxPerEmail: 3,
    maxPerIp: 10,
  });
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    return send(res, 429, { error: 'Too many messages. Please try again later.' });
  }

  const saved = await rest<{ id: string }[]>(env, 'contact_messages', {
    method: 'POST',
    body: { name, email, message, ip_hash: ipHash },
    prefer: 'return=representation',
  });
  if (!saved.ok) {
    console.error(`[contact] stage=insert status=${saved.status}`);
    return send(res, 500, { error: 'We could not save your message. Please try again.' });
  }
  const id = saved.data[0]?.id;

  // Mail second. Both sends are best-effort; neither can fail the request.
  const confirmation = await sendMail({
    to: email!,
    subject: 'We got your message',
    html: emailShell({
      heading: 'We got your message',
      intro: `Thanks, ${name}. Here is what you sent; we will reply to this address.`,
      body: `<p style="margin:0;font:400 14px/1.6 Helvetica,Arial,sans-serif;">${escapeParagraph(message!)}</p>`,
    }),
    text: `Thanks, ${name}. Here is what you sent; we will reply to this address.\n\n${message}`,
    idempotencyKey: id ? `contact-${id}-confirmation` : undefined,
  });
  const inbox = adminInbox();
  if (inbox) {
    await sendMail({
      to: inbox,
      replyTo: email!,
      subject: `New message from ${name}`,
      html: emailShell({
        heading: `New message from ${name}`,
        intro: 'Reply to this email to answer them directly.',
        body: detailTable([
          ['Name', name],
          ['Email', email],
          ['Message', message],
        ]),
      }),
      text: `From ${name} <${email}>\n\n${message}`,
      idempotencyKey: id ? `contact-${id}-internal` : undefined,
    });
  }

  if (id && confirmation.sent)
    await rest(env, `contact_messages?id=eq.${id}`, {
      method: 'PATCH',
      body: { mailed: true },
      prefer: 'return=minimal',
    });

  send(res, 200, { ok: true, mailed: confirmation.sent });
}
