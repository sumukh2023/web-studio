# Starter packs

Opt-in production features for Web Studio. Each folder is one pack:
`pack.json` (manifest), `README.md` (what it is, how to wire it, the lessons
behind it) and `files/` (mirrors the project root).

```bash
npm run pack:list
npm run pack:add -- <name> [<name>...]
```

Claude Code picks packs with `.claude/skills/starter-packs/SKILL.md`.

| Pack | What it adds | Requires |
| --- | --- | --- |
| [`analytics`](analytics/README.md) | Cookieless page views and Core Web Vitals from real visitors, with token-bearing URLs scrubbed before they leave the page. | - |
| [`api`](api/README.md) | A typed api/ folder of Vercel functions with JSON, origin, crypto and IP-hash helpers. | - |
| [`auth`](auth/README.md) | Email + password sign-in with Argon2id, server-side sessions in an HttpOnly cookie, lockout, roles, and a React session provider. | api, supabase, forms |
| [`email`](email/README.md) | Send confirmations and internal notifications through Resend, with retries, idempotency and a safe HTML shell. | api |
| [`event-kit`](event-kit/README.md) | A timezone-correct live countdown, a per-device Add to Calendar button, and a generated RFC 5545 .ics file, all from one event.json. | - |
| [`feature-flags`](feature-flags/README.md) | Database-backed switches that turn a feature on or off on the next request, with no deploy. Off by default. | supabase |
| [`fonts`](fonts/README.md) | Replace the Google Fonts link with @fontsource packages: same-origin, no third-party request, only the subsets and weights you use. | - |
| [`forms`](forms/README.md) | Floating-label fields, honeypot, submit hook and a working contact form wired to a rate-limited, stored, emailed API route. | api, supabase, email |
| [`gallery`](gallery/README.md) | A masonry photo wall of real buttons and a fullscreen lightbox that grows out of the clicked photo, with keyboard, focus and scroll handled. | images |
| [`human-attribution`](human-attribution/README.md) | Commits carry the responsible human's identity only: hooks and CI reject AI-tool/bot authors, co-author trailers and session links, and Claude Code's auto-attribution is switched off. | - |
| [`images`](images/README.md) | Automatic AVIF/WebP variants of every photo in public/, a `Picture` drop-in for `img`, and a full favicon/app-icon set from one source. | - |
| [`india`](india/README.md) | One shared module for Indian mobile normalisation, rupee formatting (lakh/crore), and PAN/GSTIN/IFSC/PIN/UPI validation, usable from the browser and api/. | - |
| [`live-updates`](live-updates/README.md) | Post an announcement in Supabase and every open browser shows it within a second, with an unread badge and a polling fallback. | api, supabase |
| [`motion-budget`](motion-budget/README.md) | Decides once how much motion a device can afford, exposes it to JS (useMotionBudget) and CSS (rich:/lite:/still: variants). | - |
| [`payments-upi`](payments-upi/README.md) | Server-priced payment records, a scannable UPI QR with per-app deep links on phones, UTR submission with one-use enforcement, and manual reconciliation. | api, supabase, forms, india |
| [`qa`](qa/README.md) | One command that opens every route of the built site in Chromium at 390px and 1440px and fails on overflow, errors, broken requests, heading/landmark/alt/name problems, with screenshots. | - |
| [`router`](router/README.md) | React Router with lazy pages, correct scroll on every navigation (top, #hash, Back restores), a 404 page and the Vercel SPA rewrite. | - |
| [`security-headers`](security-headers/README.md) | A Content-Security-Policy, HSTS, nosniff, frame and permission headers, long-lived asset caching, and a CSP violation reporter. | api |
| [`seo`](seo/README.md) | Per-route title/description/canonical/Open Graph/JSON-LD from one config, build-time prerender of every public route, sitemap.xml, robots.txt and a 404.html. | router |
| [`splash`](splash/README.md) | A branded loading screen that paints before JavaScript, never flashes on a cached visit, and can never block clicks. | - |
| [`supabase`](supabase/README.md) | Postgres via Supabase's REST API from api/, a rate-limit ledger, and migration guard rails. | api |
| [`surfaces`](surfaces/README.md) | depth-card, depth-inset and depth-band: static, token-driven elevation that survives focus rings and prints flat. Plus an opt-in, budget-aware .glass. | - |

## Writing a pack

1. `packs/<name>/pack.json` with at least `name`, `title`, `summary`, `when`.
   Every other field (`requires`, `dependencies`, `devDependencies`,
   `scripts`, `chainScripts`, `vercel`, `env`, `gitignore`, `inject`,
   `appendCss`, `next`) is documented at the top of `scripts/pack.mjs`.
2. `files/` holds new files at their final paths. Never ship a file that
   replaces a core file; use `inject` at a marker or `chainScripts` instead.
3. UI uses design tokens only (no hard-coded colours) and passes the
   impeccable detector; server code validates, never trusts the browser.
4. `README.md`: what it is, how to wire it, and the rules learned the hard way.
5. Prove it: `npm run pack:doctor`, `npm run pack:test -- <name>` and
   `npm run pack:test` (all together). CI runs the last two.
6. Add it to the table in `.claude/skills/starter-packs/SKILL.md`.
