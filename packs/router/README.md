# router: more than one page

React Router 7 (data-less "declarative" mode) with the details that make a
multi-page SPA feel like real pages.

## What you get

| File | What it is |
| --- | --- |
| `src/router/ScrollManager.tsx` | Top of page on every link, the right place on Back/Forward, and `#hash` landing clear of the fixed nav, all through Lenis rather than fighting it. |
| `src/router/RouteFallback.tsx` | Quiet full-height Suspense fallback (no flash, no footer jump). |
| `src/pages/NotFoundPage.tsx` | The catch-all page (one h1, a way home). |
| `vercel.json` rewrite | Every non-`/api` path serves `index.html`, so a refresh on `/about` works. |

## Wire it up (src/App.tsx)

```tsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { ScrollManager } from '@/router/ScrollManager';
import { RouteFallback } from '@/router/RouteFallback';
import HomePage from '@/pages/HomePage';          // eager: it is the landing page

// Secondary pages load on demand and never weigh down the landing page.
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

export default function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <RootLayout chrome={false}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RootLayout>
    </BrowserRouter>
  );
}
```

Each page renders its own `<main id="main" tabIndex={-1}>` so the skip link
works and the nav/footer stay outside the main landmark.

## Links

- Internal: `<Link to="/about">`, never `<a href="/about">` (that reloads the app).
- Same page: `<a href="#pricing" onClick={(e) => followSectionLink('pricing', e)}>`
  from `@/utils/page-scroll`. It glides through Lenis, lands clear of the nav,
  respects Cmd/Ctrl-click, and falls back to the browser if the id is gone.
- Cross page to a section: `<Link to="/pricing#plans">`; `ScrollManager` pins
  to `#plans` once the lazy page has rendered it.

## With the seo pack

`seo` prerenders the public routes into real HTML files. The catch-all rewrite
here means an unknown path still gets `index.html` (HTTP 200) and the SPA
shows `NotFoundPage` with `noindex`. If you want unknown URLs to be a real 404,
replace the catch-all in `vercel.json` with explicit rewrites for your
non-prerendered routes only; the prerendered `dist/404.html` then answers the rest.
