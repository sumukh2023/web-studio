# api: serverless functions on Vercel

Adds an `api/` folder of Vercel functions with strict TypeScript and the
helpers every route ends up needing. Every backend pack (`supabase`, `email`,
`forms`, `auth`, `payments-upi`, `live-updates`, `security-headers`) builds on it.

## What you get

| File | What it is |
| --- | --- |
| `api/tsconfig.json` | Strict compiler settings for the functions. Without it Vercel compiles them with `strict` off, and code that typechecks locally fails only on deploy. |
| `api/_http.ts` | `send`, `allowMethods` (405 + `Allow`), `jsonBody`, `cleanText`, `cleanMultiline`, `cleanEmail`, `sameOrigin` (CSRF guard), `clientIpHash`, `requireEnv`. |
| `api/_crypto.ts` | `randomToken`, `sha256Hex`, `hmacHex`, `hmacBase64Url`, `timingSafeEqual` on Web Crypto, no dependencies. |
| `api/health.ts` | `GET /api/health`, a one-line proof the runtime is up. |

It also adds `@vercel/node` (types), extends `npm run typecheck` to the api
project, and adds `npm run dev:api`.

## Running it locally

`vite` serves the front end only; it does not execute `api/`. Run both:

```bash
npm run dev:api   # Vercel CLI on :3000 runs the functions (first run asks you to link a project)
npm run dev       # Vite on :5173 proxies /api/* to :3000 (see vite.config.ts)
```

Point the proxy somewhere else with `VITE_API_PROXY=https://your-preview.vercel.app npm run dev`.

## Writing a route

```ts
// api/subscribe.ts  ->  POST /api/subscribe
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { allowMethods, cleanEmail, jsonBody, sameOrigin, send } from './_http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!allowMethods(req, res, ['POST'])) return;
  if (!sameOrigin(req)) return send(res, 403, { error: 'Forbidden.' });
  const email = cleanEmail(jsonBody(req)?.email);
  if (!email) return send(res, 400, { error: 'Enter a valid email address.' });
  // ...store it (supabase pack), mail it (email pack)...
  send(res, 200, { ok: true });
}
```

## Rules worth keeping

- **Underscore files are libraries.** `api/_http.ts` is never a route. Keep
  helpers flat in `api/` with a leading underscore.
- **Validate on the server, always.** The browser's copy of a rule is a
  convenience; the route is the authority. Normalise first, then validate,
  then store the normalised value.
- **Log names, never values.** `requireEnv` logs which variable is missing so
  the platform log tells you what to set, and never prints a secret.
- **Fail closed on money and access, open on rate limiting.** A feature
  switch that cannot be read is OFF; a rate limiter that cannot read its
  ledger lets the request through and logs it.
- **The Hobby plan caps a deployment at 12 functions.** Group related actions
  behind one file with `?action=` and a `vercel.json` rewrite if you get close.
