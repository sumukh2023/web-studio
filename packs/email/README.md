# email: transactional mail through Resend

`api/_email.ts` sends mail through Resend's HTTP API with no SDK.

- **Retries the right failures.** 429, 5xx and network errors back off and
  retry inside a 3-second budget (Resend's `retry-after` respected). Any other
  4xx is final.
- **Never sends twice.** One `Idempotency-Key` per call, so a retry after a
  request Resend accepted but whose answer was lost does not duplicate.
- **Never fails the request.** `sendMail` returns `{ sent: false, reason }`
  instead of throwing; unconfigured is a normal state.
- **Escapes everything.** `escapeHtml`/`escapeParagraph`/`detailRow` for any
  value a visitor typed.

## Setup

1. Verify a domain in Resend. Use a **subdomain** (`mail.example.com`) so
   transactional sending reputation stays apart from your staff mailboxes.
2. Set `RESEND_API_KEY` and `RESEND_FROM="Name <noreply@mail.example.com>"`.
   Optional: `SUPPORT_REPLY_TO`, `ADMIN_RECIPIENT`, `SITE_ORIGIN`, `SITE_NAME`.
3. Copy your palette's hex values into `BRAND` at the top of `api/_email.ts`.

Before a domain is verified, `RESEND_FROM="Name <onboarding@resend.dev>"`
delivers ONLY to the address that owns the Resend account. Good for proving
the pipeline, useless for real visitors (everyone else gets a 403).

## Use

```ts
import { sendMail, emailShell, detailTable, adminInbox } from './_email';

// After the row is stored:
const html = emailShell({
  heading: 'We got your message',
  intro: `Thanks, ${name}. We usually reply within a day.`,
  body: detailTable([['Topic', topic], ['Message', message]]),
});
const mail = await sendMail({
  to: email,
  subject: 'We got your message',
  html,
  text: `Thanks, ${name}. We usually reply within a day.\n\n${message}`,
});
if (!mail.sent) console.warn(`[contact] confirmation not sent: ${mail.reason}`);
```

Internal copies: send to `adminInbox()` with `replyTo: visitorEmail`, so
pressing Reply writes to the visitor.

## Honest copy

If mail is unconfigured, do not tell the visitor "check your inbox". Return
`mailed: mail.sent` from the route and let the page say "we'll be in touch"
when nothing was sent. A promise of a confirmation that never arrives is the
first support ticket you will get.
