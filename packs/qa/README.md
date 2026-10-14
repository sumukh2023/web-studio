# qa: see the site the way visitors will

```bash
npm run build && npm run qa                       # every route (seo.config.json) or /
npm run qa -- / /about --url http://localhost:5173  # specific routes against dev
```

Each route at **390px** (phone, touch) and **1440px**, with reduced motion so
screenshots show finished states. It FAILS on:

- horizontal overflow (and names the first offending elements)
- uncaught exceptions and console errors
- same-origin requests answering 4xx/5xx (missing images, fonts, chunks);
  `/api/*` and `/_vercel/*` are skipped (they need `vercel dev` or a deploy)
- not exactly one `<h1>`, not exactly one `<main>`
- `<img>` without `alt`; buttons/links with no accessible name

and WARNS on phone tap targets under 44x44. Full-page screenshots go to
`.cache/qa/`. **Open them.** The checks catch the mechanical bugs; only
looking catches "this is ugly at 390px".

This is a fast smoke test, not an accessibility audit: also tab through the
page with a keyboard, and run the `impeccable` audit and `review-animations`
skills.
