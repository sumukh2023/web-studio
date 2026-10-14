# security-headers: CSP, HSTS and caching on Vercel

Adds response headers to `vercel.json` (merged, not overwritten) and a
client-side CSP violation reporter.

| Header | Why |
| --- | --- |
| `Content-Security-Policy` | Only this origin's scripts run. An injected `<script>` from a form field, a compromised CDN or a browser-extension-shaped attack is refused. |
| `Strict-Transport-Security` | Browsers never try plain HTTP again for two years. |
| `X-Content-Type-Options: nosniff` | A file is only ever treated as the type it was served as. |
| `X-Frame-Options: DENY` + `frame-ancestors 'none'` | Nobody can frame the site to clickjack it. |
| `Referrer-Policy` | Other sites see your origin, never full paths (which can hold tokens). |
| `Permissions-Policy` | Camera, mic, location, payment APIs off unless you turn them on. |
| `Cache-Control` on `/assets/*` | Vite's hashed files cached for a year, `immutable`. Media gets a week + SWR. |

The default policy already allows what the starter and the packs use: Google
Fonts (core `index.html`), Supabase (`live-updates`), Vercel Speed Insights
(`analytics`), YouTube-nocookie/Vimeo embeds.

## When something is blocked

The browser console names the directive (`Refused to load ... because it
violates "connect-src ..."`). Add that origin to that directive in
`vercel.json`, and only that one. In production, violations are also logged by
`/api/csp-report` (deduplicated, tokens stripped, capped) so you see what real
visitors hit.

To trial a stricter policy without breaking anything, add a second header
named `Content-Security-Policy-Report-Only` with the candidate value; it
reports without enforcing.

## Private routes

For paths that carry credentials (`/account/*`, `/ticket/<token>`), add a
header block with `Cache-Control: no-store, private`, `Referrer-Policy:
no-referrer` and `X-Robots-Tag: noindex, nofollow`.
