# forms: accessible fields and a working contact pipeline

A form that looks finished but goes nowhere is the most common vibe-coded
bug. This pack is the whole round trip.

## Browser (`src/forms/`)

| File | What it is |
| --- | --- |
| `fields.tsx` | `FloatingInput`, `FloatingTextarea`, `FloatingSelect`, `Consent`, `RequiredNote`, `Honeypot`. Native controls, CSS-only floating labels, errors announced with `role="alert"`, `aria-invalid`/`aria-describedby` wired. |
| `useSubmit.ts` | `const { state, submit, reset } = useSubmit('/api/x')`. One request at a time, server error copy shown verbatim, field errors returned and focused, 429 turned into "try again in N minutes", offline handled. |
| `SuccessTick.tsx` | The self-drawing tick for a success state (finished instantly under reduced motion). |
| `styles.ts` | `primaryButton`, `ghostButton` class strings (tokens only). |
| `ContactForm.tsx` | All of the above composed into a working contact form. |

## Server

`api/contact.ts` runs: method + same-origin check, honeypot (looks
successful, stores nothing), validation with per-field errors, rate limit
(3/hour per email, 10/hour per IP), insert into `contact_messages`, then a
confirmation to the visitor and a copy to `ADMIN_RECIPIENT` with Reply-To set
to the visitor. Mail failures never fail the request, and the response says
`mailed: true|false` so the page never promises an email that was not sent.

## Building another form

Copy the shape of `ContactForm.tsx` and `api/contact.ts`:

1. Client: validate for instant feedback, but treat the route as the authority.
2. Route: refuse cheap (method, origin, honeypot) -> validate -> rate limit ->
   store -> mail. Return `{ error, fields }` on 400.
3. Table: RLS on, `revoke all ... from anon, authenticated`.

Lessons baked in from production:

- `noValidate` on the form and our own messages, because native bubbles are
  inconsistent, unstyled and partly unannounced.
- The status line is a **stable** live region (rendered empty before it has
  anything to say). A region that appears at the same moment as its text is
  frequently not announced.
- Focus moves to the first `aria-invalid` field after the errors paint
  (`requestAnimationFrame`), not before.
- Names: never restrict to a script; people's names are not ASCII.
