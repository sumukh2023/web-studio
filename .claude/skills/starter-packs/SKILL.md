---
name: starter-packs
description: Add production features to a Web Studio build from the repo's packs/ folder (routing, SEO/prerender, forms that really send, Supabase backend, auth, UPI payments, image pipeline, analytics, security headers, countdown/calendar, gallery, live announcements, QA). Use whenever the brief needs anything beyond a single static page, or the user asks for a page, form, login, database, payments, SEO, analytics, deploy hardening or "make it real". Install with `npm run pack:add <name>` instead of hand-writing the feature.
---

# Starter packs

`packs/` holds features that are already built, debugged and hardened
against real traffic, real payments and real screen-reader users. **Install a pack instead of writing the feature from
scratch.** A hand-written contact form, router or SEO head will re-learn bugs
these already fixed.

Packs are **infrastructure, not design.** None of them decides how the page
looks or how its sections are structured; that still comes from the brief via
`ui-ux-pro-max` + `taste-skill` (CLAUDE.md golden rules 1 to 4). Pack UI uses
design tokens only, so it re-skins with the palette. Restyle it freely; keep
its behaviour.

## How to use

```bash
npm run pack:list                 # what exists, what is installed
npm run pack:info -- <name>       # what it adds, env vars, packages
npm run pack:add -- <name> ...    # install (requirements come along automatically)
npm run pack:doctor               # verify installed packs are intact
```

`pack:add` copies the pack's files, merges `package.json` (deps + scripts),
`vercel.json`, `.env.example` and `.gitignore`, injects lines at the marked
spots in `src/main.tsx` and `index.html`, runs `npm install`, records it in
`packs.lock.json`, and prints the remaining wire-up steps. It never silently
overwrites a file you changed (use `--force` deliberately). It is idempotent.

**After installing, ALWAYS read `packs/<name>/README.md`** and do its wire-up
steps, then run the gates (`npm run typecheck && npm run lint && npm run
build && npm run design:check && npm run slop:check`).

## Which pack, when

Read the brief, then pick. Do not install packs the brief does not need: every
pack is code the visitor downloads or the owner maintains.

| The brief says / implies | Install |
| --- | --- |
| More than one page (about, work, pricing, legal) | `router` |
| It will be shared on WhatsApp/LinkedIn, or should rank | `seo` (needs `router`) |
| Photos (hero image, team, portfolio, past events) | `images`; plus `gallery` for a photo wall + lightbox |
| Proper icons for tabs / home screens | `images` (`npm run favicons`) |
| A contact / enquiry / RSVP / waitlist form that must reach someone | `forms` (brings `api`, `supabase`, `email`) |
| Anything stored server-side, any secret key | `api` + `supabase` |
| Emails to visitors or to the owner | `email` |
| Something opens/closes at a chosen moment, or ships dark | `feature-flags` |
| Staff/admin/members-only pages | `auth` |
| An event date: countdown, add-to-calendar | `event-kit` |
| Taking money in India without a gateway (tickets, stalls, donations) | `payments-upi` (brings `india`) |
| Rupee prices, Indian phone numbers, PAN/GSTIN/IFSC | `india` |
| Event-day announcements that appear live | `live-updates` |
| Heavy effects (parallax, blur, video, cursor FX) | `motion-budget` |
| Heavy landing page, blank first paint on cold load | `splash` |
| Launching for real | `security-headers`, `analytics`, `fonts`, `seo` |
| Cards/inputs need tactile depth | `surfaces` |
| Before a PR or demo | `qa` (`npm run build && npm run qa`, then LOOK at the screenshots) |
| Team/course/client forbids AI co-author credit | `human-attribution` |

## Typical combinations

- **Hackathon landing page (2.5h):** nothing, or `router` + `seo` if there
  are pages; `qa` before presenting.
- **Event / fest site:** `router seo images gallery event-kit forms
  live-updates analytics security-headers` (+ `payments-upi` for paid passes).
- **Portfolio:** `router seo images gallery fonts analytics`.
- **Small business:** `router seo images forms analytics security-headers fonts`.
- **Members/staff area:** add `auth` (+ `feature-flags`).

## Rules

1. **The server is the authority.** Packs validate, price and authorise in
   `api/`. Browser checks are convenience only. Never move a rule client-side.
2. **Secrets stay server-side.** Only `VITE_*` variables reach the browser,
   and only public values may be `VITE_*` (UPI payee, Supabase anon key).
3. **Database changes are forward migrations built from the live state**
   (packs/supabase/README.md, "The standing rule"). Never edit an applied
   migration; never rebuild a production function from an old file.
4. **Do not hand-edit generated outputs**: `public/_optimized/`,
   `src/generated/`, `dist-prerender/`, `public/event.ics` are regenerated.
5. **Keep the markers** (`packs:imports`, `packs:boot`, `packs:wrap` in
   `src/main.tsx`; `packs:head`, `packs:body` in `index.html`;
   `packs:pre-push` in `.githooks/pre-push`). Packs install into them.
6. **Tell the user what needs their action**: env vars, applying migrations,
   verifying an email domain, enabling analytics in Vercel. `pack:add` prints
   these; relay them, do not pretend they are done.

## Maintaining packs (for contributors to this starter)

A pack is `packs/<name>/` with `pack.json` (manifest; fields documented at the
top of `scripts/pack.mjs`), `README.md`, and `files/` mirroring the project
root. Prove changes with `npm run pack:test` (every pack together in a
throwaway copy) and `npm run pack:test -- --each` (each alone), which run
typecheck, lint, build, both design gates and doctor.
