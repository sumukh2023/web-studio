# analytics: who visits, and how fast it really is

Vercel Web Analytics (cookieless page views, no consent banner needed for
the analytics itself in most jurisdictions; check yours) and Speed Insights
(LCP, INP, CLS from real visitors' devices, not your laptop).

Both send the page URL, so every event passes through `scrubEvent`
(`src/telemetry/scrub.ts`): query strings and hashes are dropped, and any
route listed in `TOKEN_ROUTES` is collapsed to `/prefix/[token]`. If a URL on
your site ever carries a secret (a magic link, a ticket, a reset code), list
its prefix there the day you add it.

The `security-headers` CSP already allows `vitals.vercel-insights.com`; the
analytics script itself is served from your own origin (`/_vercel/insights`).

Gotcha kept from production: never pass `route` to `<Analytics>`. It flips
the component into manual mode and then silently reports nothing.
