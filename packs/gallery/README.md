# gallery: a photo wall and a lightbox that behave

```tsx
import { PhotoGrid } from '@/gallery/PhotoGrid';

<PhotoGrid photos={[
  { id: 'stage', src: '/photos/stage.jpg', alt: 'The main stage at dusk, crowd lit in amber', width: 1600, height: 1067 },
  // ...
]} />
```

Use `<Lightbox photos index onClose onNavigate />` directly for your own
layout (a carousel, a bento).

Everything here was a bug report once:

- **Opening a photo must not move the page.** The old body-pin technique set
  `scrollY` to 0, the smooth scroller kept running against it, and on close
  the page glided through 27 positions to the wrong place.
  `lockPageScroll` hides overflow and stops Lenis instead.
- **Closing returns focus to the thumbnail without scrolling to it.**
- **It is a portal.** Any transformed ancestor (every reveal animation) makes
  itself the containing block for `position: fixed`.
- **It opens from cache.** Same `src` as the thumbnail, no spinner on black.
- **It grows out of the thumbnail** with transform + opacity only, and
  crossfades on arrow keys. Reduced motion gets a short fade.
- **Thumbnails are buttons** with names, so the gallery works by keyboard and
  screen reader. Write `alt` as what the photo shows.
- **Always give width and height**, so the wall never shifts as photos load.
