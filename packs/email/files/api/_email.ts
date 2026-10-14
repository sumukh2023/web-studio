/**
 * Transactional email through Resend's HTTP API (no SDK).
 *
 * THE RULE EVERY CALLER FOLLOWS: store first, mail second. A route writes its
 * row, THEN sends, and a failed send never fails the request. Mail is a
 * courtesy on top of a record, and a visitor whose booking is saved must not
 * see an error because a mail provider hiccuped.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * The house style for mail. HEX, NOT TOKENS: mail clients strip stylesheets
 * and cannot read CSS variables, so copy these from the palette in
 * src/styles/globals.css / .design/brief.md when you theme the site.
 */
export const BRAND = {
  name: process.env.SITE_NAME?.trim() || 'Your Site',
  ground: '#f4f4f5',
  card: '#ffffff',
  border: '#e4e4e7',
  ink: '#18181b',
  muted: '#52525b',
  faint: '#a1a1aa',
  accent: '#4f46e5',
};

export type Attachment = {
  filename: string;
  /** Base64 content. */
  content: string;
  /** Set to reference it inline as <img src="cid:...">. */
  contentId?: string;
};

export type Mail = {
  to: string;
  subject: string;
  html: string;
  /** Always send a plain-text part: spam filters and screen readers use it. */
  text: string;
  replyTo?: string;
  attachments?: Attachment[];
  /** Pass a stable key (e.g. `booking-<id>-confirmation`) to dedupe across retries of the ROUTE. */
  idempotencyKey?: string;
};

export type MailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'unconfigured' | 'rejected' | 'unreachable' };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

/** Where a visitor's reply should land. */
export function supportReplyTo(): string | undefined {
  return process.env.SUPPORT_REPLY_TO?.trim() || undefined;
}

/** Where internal copies go. */
export function adminInbox(): string | null {
  return process.env.ADMIN_RECIPIENT?.trim() || process.env.SUPPORT_REPLY_TO?.trim() || null;
}

/** Absolute origin for links in mail (a mail has no page to be relative to). */
export function siteOrigin(): string {
  const explicit = process.env.SITE_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : 'http://localhost:5173';
}

/* ------------------------------------------------------------------ */
/*  Sending, with retry                                                 */
/* ------------------------------------------------------------------ */

/*
 * Resend's default ceiling is 10 requests/second per team; a launch-day burst
 * answers 429. Treating that like a bad address drops confirmations for an
 * unknown fraction of visitors, so 429, 5xx and transport failures are
 * retried. Every other 4xx means the request itself is wrong and is final.
 *
 * The budget is small because the route awaits the send before answering (a
 * serverless function is frozen the moment it responds): every millisecond
 * here is a millisecond the visitor watches a spinner after their record is
 * already safely written.
 */
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 400;
const RETRY_BUDGET_MS = 3000;
const MAX_WAIT_MS = 2000;
const ATTEMPT_TIMEOUT_MS = 10_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const transient = (status: number) => status === 429 || (status >= 500 && status < 600);

function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get('retry-after');
  if (!raw) return null;
  const seconds = Number(raw.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const at = Date.parse(raw);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

export async function sendMail(mail: Mail): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) return { sent: false, reason: 'unconfigured' };

  // Built once and sent unchanged, so the idempotency key is meaningful.
  const body = JSON.stringify({
    from,
    to: [mail.to],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    ...(mail.replyTo?.trim() || supportReplyTo()
      ? { reply_to: mail.replyTo?.trim() || supportReplyTo() }
      : {}),
    ...(mail.attachments?.length
      ? {
          attachments: mail.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
            ...(a.contentId ? { content_id: a.contentId } : {}),
          })),
        }
      : {}),
  });

  /* ONE KEY FOR THE WHOLE CALL. The dangerous retry is the one after a
     request Resend ACCEPTED whose response we never saw; without a key that
     is a second copy in somebody's inbox. Resend answers a repeat key with the
     original result for 24 hours. */
  const idempotencyKey = mail.idempotencyKey ?? crypto.randomUUID();

  let slept = 0;
  let failure: MailResult = { sent: false, reason: 'unreachable' };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let response: Response | null = null;
    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
    } catch {
      console.error('[email] stage=send unreachable');
      failure = { sent: false, reason: 'unreachable' };
    }

    if (response) {
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as { id?: string } | null;
        return { sent: true, id: data?.id ?? null };
      }
      // Status only: Resend can echo the payload, which is somebody's message.
      console.error(`[email] stage=send status=${response.status}`);
      failure = { sent: false, reason: 'rejected' };
      if (!transient(response.status)) return failure;
    }

    if (attempt === MAX_ATTEMPTS) break;
    const remaining = RETRY_BUDGET_MS - slept;
    if (remaining <= 0) break;
    const hinted = response ? retryAfterMs(response) : null;
    const wait = Math.max(
      0,
      Math.min(hinted ?? BACKOFF_BASE_MS * 2 ** (attempt - 1), MAX_WAIT_MS, remaining)
    );
    console.warn(`[email] stage=retry attempt=${attempt} wait_ms=${wait}`);
    slept += wait;
    await sleep(wait);
  }
  return failure;
}

/* ------------------------------------------------------------------ */
/*  Rendering                                                           */
/* ------------------------------------------------------------------ */

/**
 * HTML-escape. Apply it to EVERY interpolated value without exception: mail
 * content is text a stranger typed into a public form, and the internal copy
 * is opened by you.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Escaped, with newlines kept as line breaks. */
export function escapeParagraph(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

/** One label/value row for a details table inside `emailShell`'s body. */
export function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 16px 6px 0;font:400 13px/1.5 Helvetica,Arial,sans-serif;color:${BRAND.faint};vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td><td style="padding:6px 0;font:400 14px/1.5 Helvetica,Arial,sans-serif;color:${BRAND.ink};">${escapeParagraph(value)}</td></tr>`;
}

/** A details table from label/value pairs (empty values skipped). */
export function detailTable(rows: [string, string | null | undefined][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0">${rows
    .filter(([, v]) => v)
    .map(([l, v]) => detailRow(l, v as string))
    .join('')}</table>`;
}

/** A button-styled link (a table cell, because Outlook ignores most CSS). */
export function buttonRow(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="background:${BRAND.accent};border-radius:6px;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;font:600 14px/1 Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
}

/**
 * The shell every message sits in. Deliberately old-fashioned: a centred
 * table, inline styles, system font stacks, no external assets. Clients strip
 * stylesheets and block remote images, so the site's real typography cannot
 * survive the trip; the brand travels as colour and a wordmark instead.
 */
export function emailShell({
  heading,
  intro,
  body,
  footnote,
}: {
  heading: string;
  intro: string;
  /** Pre-escaped HTML (use detailTable/buttonRow/escapeParagraph). */
  body: string;
  footnote?: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${BRAND.ground};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.ground};padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:8px;">
          <tr><td style="padding:32px 32px 0 32px;">
            <p style="margin:0;font:600 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.accent};">${escapeHtml(BRAND.name)}</p>
            <h1 style="margin:20px 0 0 0;font:600 24px/1.3 Helvetica,Arial,sans-serif;color:${BRAND.ink};">${escapeHtml(heading)}</h1>
            <p style="margin:14px 0 0 0;font:400 15px/1.6 Helvetica,Arial,sans-serif;color:${BRAND.muted};">${escapeParagraph(intro)}</p>
          </td></tr>
          <tr><td style="padding:24px 32px 32px 32px;">${body}</td></tr>
          <tr><td style="padding:0 32px 28px 32px;">
            <div style="height:1px;background:${BRAND.border};"></div>
            <p style="margin:14px 0 0 0;font:400 12px/1.6 Helvetica,Arial,sans-serif;color:${BRAND.faint};">${escapeHtml(footnote ?? BRAND.name)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
