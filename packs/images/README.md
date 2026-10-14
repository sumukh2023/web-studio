# images: modern formats and proper icons, automatically

## Photos

Put JPEG/PNG files in `public/`. Before every `npm run dev` and `npm run
build`, `scripts/encode-images.mjs` writes AVIF (q60) and WebP (q82) siblings
to `public/_optimized/` and a manifest to `src/generated/image-variants.json`
(both git-ignored, both reproducible). Then:

```tsx
import { Picture } from '@/components/Picture';

<Picture src="/team/ada.jpg" alt="Ada at the workshop" width={800} height={1000} loading="lazy" />
```

`Picture` renders `<picture>` with AVIF/WebP `<source>`s and your `<img>` as
the fallback. Same props, refs and styles as `<img>`. Typical savings: 40-55%
of photo bytes with AVIF.

Rules it follows:

- Originals are never modified. A variant that is larger than its original
  is not offered.
- A failed variant retries the original, so a photo never renders broken.
- Only paths under `public/` are optimised. An `import photo from
  '@/assets/x.jpg'` goes through Vite instead and keeps its format.
- The encoder **fails the build** if sharp cannot load (so a deploy never
  silently ships without its pipeline); `Picture` tolerates a missing manifest
  (a fresh checkout has none).
- Always pass `width` and `height` (layout shift) and `loading="lazy"` below
  the fold. For the hero/LCP image use `loading="eager"` and
  `{...fetchPriority('high')}` from `@/utils/fetch-priority` (React 18 drops
  the camelCase prop silently).

## Icons

```bash
npm run favicons -- src/assets/logo.svg --background "#0b0b0f" --name "Acme"
```

Writes `favicon.ico` (16/32/48), `favicon-96.png`, `apple-touch-icon.png`
(opaque, padded), `icon-192/512.png`, `maskable-512.png` (padded for
Android's crop) and `site.webmanifest`, and prints the `<link>` tags for
`index.html`. Commit the outputs; this is an authoring step, not a build step.
