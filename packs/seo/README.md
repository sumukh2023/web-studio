# seo: search results, link previews and prerendering

One config file drives the head of every page, the prerendered HTML, the
sitemap and robots.txt, so the three can never disagree.

## Why prerender a client-rendered app?

Google runs JavaScript; the scrapers behind link previews on WhatsApp, Slack,
X and LinkedIn mostly do not. Without this, every URL you share previews with
the same title and no image. After `vite build`, `scripts/prerender.mjs` runs
the real app in jsdom for each public route and writes its `<head>` (plus a
`<noscript>` h1, description and nav links) to `dist/<route>/index.html`.
Only the head ships: the app does not hydrate, so prerendered body markup
would flash and be rebuilt.

## Files

| File | What it does |
| --- | --- |
| `src/seo/seo.config.json` | origin, siteName, social image, private prefixes, and every public route's title + description (+ optional `jsonLd`, `sitemap: false`, `sources`). |
| `src/seo/Seo.tsx` | Writes title, description, canonical, robots, Open Graph, Twitter and JSON-LD per route. Unknown routes become "Page not found" + `noindex`. |
| `vite.prerender.config.mjs` | A throwaway classic-script build jsdom can execute. |
| `scripts/prerender.mjs` | Renders each route's head; also writes `dist/404.html`. Never fails the build. |
| `scripts/build-sitemap.mjs` | `dist/sitemap.xml` (lastmod from git) and `dist/robots.txt`. |
| `scripts/seo-check.mjs` | `npm run seo:check` after a build: every route has a unique title, description, canonical, og:image; files present. |

All three build steps run automatically as `postbuild`.

## Wire it up

```tsx
<BrowserRouter>
  <ScrollManager />
  <Seo />
  ...
</BrowserRouter>
```

Then edit `seo.config.json`:

```json
{
  "path": "/pricing",
  "title": "Pricing",
  "description": "Three plans, no seat fees. Start free and upgrade when your team grows.",
  "sources": ["src/pages/PricingPage.tsx"],
  "jsonLd": [{ "@context": "https://schema.org", "@type": "Product", "name": "…" }]
}
```

**Every routed public page must be listed**, or it is titled "Page not found"
and marked `noindex`. That is deliberate: a page you forgot to describe
should be loud, not silently ship the previous page's head.

## Rules from production

- **Descriptions are written for a results page**, not lifted from the page:
  what it is, for whom, under ~155 characters. One per route; duplicates
  compete with each other.
- **Structured data is a claim about the page carrying it.** Put an `Event`
  on the event's page, not on the privacy policy. Do not publish prices or
  availability in JSON-LD if they can change without a deploy; a stale "in
  stock" is worse than none.
- **Canonical is the path without query or hash**, and a path that carries a
  token (`/ticket/<token>`) is never canonical. List those prefixes in
  `privatePrefixes`; they also become `Disallow` lines and `noindex`.
- **Declare the social image's size** (done for you). Scrapers lay the card
  out before fetching the image; without it the first share often has no card.
- **`sitemap: false`** for public pages that are steps in a flow (a lookup
  form, step two of an application): still prerendered, `noindex, follow`.
