/**
 * The page's scroll, as one thing that other code can address.
 *
 * WHY THIS EXISTS. The site runs a Lenis smooth-scroll instance for the whole
 * document, driven by its own rAF loop, and until now nothing could talk to
 * it. Lenis keeps an INTERNAL target and writes the document scroll from it
 * every frame, so any code that moved the page behind Lenis's back was
 * immediately overruled. That produced two separate bugs which looked
 * unrelated and were the same bug:
 *
 *   THE OVERLAY. Opening a lightbox photograph locked the body with
 *   `position: fixed; top: -900px`, which is a sound technique on its own but
 *   sets `window.scrollY` to 0. Lenis kept running against that. Traced with
 *   a per-frame recorder: 900 on open, 0 while open, then on close a glide
 *   through 27 intermediate positions ending at 1114. Both complaints in one
 *   line: the visible scroll-up-and-back was Lenis animating, and it did not
 *   even return to the right place because Lenis's own target had drifted.
 *
 *   CROSS-PAGE NAVIGATION. `ScrollToTop` set `window.scrollTo(0, 0)` on a
 *   route change and Lenis wrote the old offset back on the next frames.
 *   Traced from /about at 3297 to /work: 3301, 3301, then 0. Two frames
 *   of the destination page rendered at the previous page's scroll position,
 *   which is exactly the reported "opens at approximately the same scroll
 *   position".
 *
 * So: one registry the smooth scroller reports itself to, one lock every
 * overlay shares, and one jump-to-top the router calls.
 */

type SmoothScroller = {
  stop: () => void;
  start: () => void;
  scrollTo: (target: number, options?: { immediate?: boolean }) => void;
  /**
   * Re-measure the document. Lenis caches the scrollable limit and clamps
   * every target to it, so after a route change the cache describes the page
   * that has just been left. See `pinToOffset`.
   */
  resize?: () => void;
};

/**
 * How much of the top of the screen the fixed navigation covers. The bar is
 * 4rem and the extra is breathing room, so a section heading lands clear of
 * it rather than tucked under its bottom edge.
 */
const NAV_OFFSET = 96;

let scroller: SmoothScroller | null = null;

/** Called by `useLenis`. Returns the teardown. */
export function registerSmoothScroll(instance: SmoothScroller): () => void {
  scroller = instance;
  return () => {
    if (scroller === instance) scroller = null;
  };
}

/* -------------------------------------------------------------------- */
/*  The lock                                                             */
/* -------------------------------------------------------------------- */

let locks = 0;
let restore: (() => void) | null = null;

/**
 * Hold the page still while an overlay is open, WITHOUT moving it.
 *
 * `overflow: hidden` rather than the `position: fixed` pin the lightbox used.
 * The pin works, but it takes the document out of flow, which sets
 * `window.scrollY` to 0 and obliges you to put it back afterwards; every
 * scroll-restoration bug in an overlay comes from that put-back. Hidden
 * overflow leaves the scroll position exactly where it was, so there is
 * nothing to restore and nothing to get wrong.
 *
 * The scrollbar's width is added as padding so the page does not shift
 * sideways by 15px the moment the bar disappears.
 *
 * Counted, so two overlays open at once (a dialog that opens another) do not
 * have the first one to close undo the lock for both.
 *
 * IOS CAVEAT, stated rather than hidden: `overflow: hidden` on the document
 * holds reliably on iOS 16 and later. On older iOS the body can still
 * rubber-band behind a full-screen overlay. `overscroll-behavior: contain` on
 * the overlay itself is what limits that, and it is set at the call sites.
 */
export function lockPageScroll(): () => void {
  locks += 1;
  if (locks === 1) {
    const root = document.documentElement;
    const { body } = document;
    const gap = window.innerWidth - root.clientWidth;
    const previous = {
      rootOverflow: root.style.overflow,
      bodyOverflow: body.style.overflow,
      padding: body.style.paddingRight,
      overscroll: root.style.overscrollBehavior,
    };
    root.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    root.style.overscrollBehavior = 'none';
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    // Lenis must stop, or it keeps writing the document scroll from its own
    // target for as long as the overlay is open and then glides somewhere
    // else when it is closed.
    scroller?.stop();

    restore = () => {
      root.style.overflow = previous.rootOverflow;
      body.style.overflow = previous.bodyOverflow;
      root.style.overscrollBehavior = previous.overscroll;
      body.style.paddingRight = previous.padding;
      /* Resync BEFORE restarting. Lenis's internal target is wherever it was
         when it stopped; telling it the truth first is what stops it gliding
         to a stale position the instant it wakes up. */
      scroller?.scrollTo(window.scrollY, { immediate: true });
      scroller?.start();
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0 && restore) {
      restore();
      restore = null;
    }
  };
}

/* -------------------------------------------------------------------- */
/*  The jump                                                             */
/* -------------------------------------------------------------------- */

/**
 * Put the page at a given offset, now, and make it stay there.
 *
 * Two things beyond `window.scrollTo(0, y)`, both of them needed:
 *
 *   Lenis is told as well, immediately, or it writes the previous offset back
 *   on the next frame.
 *
 *   The position is re-asserted for a few frames. A lazy route chunk mounts
 *   after the navigation, and the document's height changes underneath as it
 *   does; browsers reconcile that with scroll anchoring and can push the page
 *   back down. Re-asserting until the next page has settled is cheaper and
 *   more reliable than guessing a single delay, and it stops the moment
 *   anyone touches the wheel or the screen.
 *
 * `hold` is how long to keep re-asserting. 400ms is right for the top, which
 * every route can reach the instant it mounts. RESTORING A DEEP OFFSET NEEDS
 * LONGER, and that is the whole difficulty of it: the page cannot be at 3297
 * until enough of it exists to be 3297 tall, so the early frames clamp to
 * whatever the document currently is and the offset has to be re-asserted as
 * images and sections land. Hence the longer default at the call site.
 */
/**
 * How many programmatic scrolls are in flight.
 *
 * The page's own scroll-position memory has to be able to tell the reader's
 * scrolling from the site's. When a route changes, this module moves the page
 * — and every one of those moves fires `scroll` events that look exactly like
 * a reader scrolling. Anything recording "where this entry was left" has to
 * ignore them, or it records the journey away from the page as the place the
 * reader was.
 */
let programmatic = 0;

/** True while this module is moving the page itself. See `pinToOffset`. */
export function isProgrammaticScroll(): boolean {
  return programmatic > 0;
}

export function pinToOffset(offset: number, hold = 400): () => void {
  const stopAt = performance.now() + hold;
  let cancelled = false;
  let frame = 0;
  programmatic += 1;
  let counted = true;
  const release = () => {
    if (!counted) return;
    counted = false;
    programmatic = Math.max(0, programmatic - 1);
  };

  const abort = () => {
    cancelled = true;
  };
  // A deliberate scroll wins immediately. Nobody should be fought for the
  // scrollbar by a page they are already reading.
  const listeners: [keyof WindowEventMap, EventListener][] = [
    ['wheel', abort],
    ['touchstart', abort],
    ['keydown', abort],
  ];
  for (const [type, fn] of listeners) {
    window.addEventListener(type, fn, { passive: true, once: true });
  }

  const pin = () => {
    if (cancelled) return cleanup();
    /* `behavior: 'instant'` IS LOAD-BEARING and is not the same as omitting
       it. `window.scrollTo(0, 0)` means `auto`, and `auto` is whatever the
       document's computed `scroll-behavior` says — which was `smooth`, which
       is why this function ANIMATED the page to the top instead of putting it
       there. The declaration is gone from globals.css; naming the behaviour
       here as well means re-adding it could never quietly turn every route
       change back into a visible upward scroll. */
    /* RE-MEASURE FIRST, OR THE SMOOTH SCROLLER FIGHTS THIS EVERY FRAME.
       Lenis caches how far the document can scroll and clamps every target
       to it. After a route change that cache belongs to the page just left,
       and restoring a deep offset into a page taller than that one produces
       a tug of war: this function writes the real offset, Lenis writes its
       clamped one back on its own rAF, and the page alternates between them.
       Traced returning to a long page from its bottom CTA: 1414, 7954, 1414,
       7954 on consecutive frames, which is the reported severe flicker.
       1414 is exactly `2314 - 900`: the maximum scroll of the short page
       being returned from. Telling Lenis to re-measure before each
       write is what makes the target reachable rather than clamped away. */
    scroller?.resize?.();
    window.scrollTo({ top: offset, left: 0, behavior: 'instant' });
    scroller?.scrollTo(offset, { immediate: true });
    if (performance.now() < stopAt) {
      frame = requestAnimationFrame(pin);
    } else {
      cleanup();
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(frame);
    for (const [type, fn] of listeners) window.removeEventListener(type, fn);
    /* Released a frame late, on purpose. A `scroll` event is dispatched
       asynchronously after the offset is written, so the last one this pin
       causes arrives after the final `scrollTo`. Dropping the flag
       synchronously would let that straggler be recorded as the reader's
       own position. */
    requestAnimationFrame(release);
  };

  pin();
  return cleanup;
}

/** Arriving somewhere new: be at the top of it. */
export function jumpToTop(): () => void {
  return pinToOffset(0);
}

/**
 * GOING BACK IS NOT ARRIVING, and this is the difference.
 *
 * Every forward navigation on this site opens at the top of the new page,
 * which is right: arriving somewhere is being there, not travelling to it.
 * Back and Forward are the opposite case. The reader has already read that
 * page and is returning to the place they left, so putting them at the top of
 * it throws away the one thing they pressed the button for.
 *
 * The longer hold is not padding. A page restored to 3300px cannot be there
 * until the document is that tall, and on a lazy route with images below the
 * fold that takes appreciably longer than the 400ms a jump to the top needs.
 */
export function restoreOffset(offset: number): () => void {
  return offset > 0 ? pinToOffset(offset, 1200) : jumpToTop();
}

/* -------------------------------------------------------------------- */
/*  The in-page jump                                                     */
/* -------------------------------------------------------------------- */

/**
 * Move to a section of the CURRENT page, through the same owner as everything
 * else.
 *
 * A bare `<a href="#section">` is a native jump, and a native jump is the one
 * thing on this site that Lenis is guaranteed to argue with: the browser
 * moves the document, Lenis writes its own target back on the next frame, and
 * where you end up depends on which of them wrote last. That is the same
 * class of bug as the lightbox and the route change, and it deserves the same
 * answer rather than a third one.
 *
 * Two things a native jump also gets wrong here even when it wins:
 *
 *   THE FIXED BAR. `scrollIntoView` puts the element's top at the viewport's
 *   top, which is underneath the navigation. The offset is subtracted so the
 *   heading is actually visible, which is what a reader means by "it scrolled
 *   to the section".
 *
 *   REDUCED MOTION. A long smooth glide down a page is motion, and someone
 *   who asked for less of it should simply arrive.
 *
 * Returns true if the section was found, so a caller can fall back to default
 * anchor behaviour rather than silently doing nothing.
 */
export function scrollToSection(
  id: string,
  { immediate = false }: { immediate?: boolean } = {}
): number | null {
  const target = document.getElementById(id);
  if (!target) return null;

  const top = Math.max(
    0,
    target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
  );
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* `immediate` is for ARRIVING at an address that already names a section:
     opening /pricing#plans should simply be at the plans, the way any
     other page is simply at its top. Gliding there would be an animation the
     reader never asked for on a page they have not seen yet. A click on a
     link within the page is the opposite case and glides. */
  const jump = immediate || reduced;

  if (scroller) {
    scroller.scrollTo(top, { immediate: jump });
  } else {
    // 'instant', never 'auto'. See the note in `jumpToTop`: `auto` defers to
    // the document's `scroll-behavior`, so an ARRIVAL at /pricing#plans
    // would have glided down the page the reader had not seen yet.
    window.scrollTo({ top, behavior: jump ? 'instant' : 'smooth' });
  }
  return top;
}

/**
 * The click every in-page "read more" CTA on this site shares.
 *
 * These are written as real `<a href="#section">` elements and they must stay
 * that way: the address is what gives them a middle-click, a "copy link", a
 * status bar on hover and a meaning without JavaScript. But a plain click on
 * one is a NATIVE jump, and a native jump is precisely what Lenis argues with
 * — the browser moves the document, the smooth scroller writes its own target
 * back a frame later, and the reader gets the teleport this function exists to
 * remove.
 *
 * So: intercept, glide through the scroll owner, and `preventDefault` ONLY if
 * the section was actually found. A CTA whose target has been renamed away
 * then still does the browser's default thing rather than silently doing
 * nothing, which is how a renamed `#section` CTA sits dead without anyone
 * noticing.
 *
 * A HELD MODIFIER IS NOT A CLICK ON THIS PAGE. Cmd, Ctrl or Shift means open
 * it somewhere else, and intercepting that would break the one behaviour the
 * real `href` was kept for. One page once had this handler written out
 * by hand; it is here so every CTA gets it rather
 * than the one that remembered.
 *
 * Typed structurally rather than as a `React.MouseEvent` so this module stays
 * free of React, which is the reason it can be imported from anywhere.
 */
export function followSectionLink(
  id: string,
  event: {
    preventDefault: () => void;
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
  }
): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if (scrollToSection(id) !== null) event.preventDefault();
}

/**
 * Glide to the top of the page the reader is already on.
 *
 * The one deliberate journey upwards on this site: pressing the mark in the
 * navigation. It is NOT what a route change does, and the difference is
 * the whole of the navigation bug — arriving somewhere new is not a journey,
 * it is being there.
 *
 * Through the scroll owner for the usual reason: a native `window.scrollTo`
 * races Lenis, which writes the document scroll from its own target on the
 * next frame, and whichever writes last decides where you end up.
 */
export function glideToTop(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (scroller) {
    scroller.scrollTo(0, { immediate: reduced });
  } else {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  }
}

/**
 * ARRIVE at a section of a page that has not finished existing yet.
 *
 * `scrollToSection` can only scroll to an element that is in the document,
 * and on a first load of `/pricing#plans` it is not: the route's chunk is
 * lazy, so at the moment the router commits, the page is a Suspense fallback
 * and `getElementById('plans')` is null. A single attempt on a timer is a
 * guess about how long a chunk takes to arrive, and it was the wrong guess:
 * measured on a cold load, the section did not exist at 120ms and the address
 * simply opened at the top of the page.
 *
 * So this keeps asking, frame by frame, until the section is there. Then it
 * keeps asking a little longer, because the section EXISTING and the section
 * having stopped MOVING are different moments: images and the rest of the
 * page above it are still resolving, and each one that lands pushes the
 * target further down. Three consecutive frames at the same offset is the
 * page having settled.
 *
 * "SETTLED" MEANS THE PAGE IS AT THE TARGET, not that three frames read the
 * same number, and the difference is a bug this had for one revision. Lenis
 * applies a scroll on ITS OWN rAF callback, which may run after this one, so
 * the first few frames after asking can still report `window.scrollY` at 0.
 * Counting those as "steady" ended the loop while the page had not moved,
 * which showed up as an intermittent landing at the top of the page: one run
 * in three, depending on the order the two rAF callbacks happened to be
 * registered in. Comparing against the target instead makes it deterministic.
 *
 * Gives up after three seconds rather than fighting a page that is genuinely
 * still loading, and stops the instant the reader touches the wheel or the
 * screen, because at that point they have chosen where to be.
 */
export function pinToSection(id: string): () => void {
  const stopAt = performance.now() + 3000;
  let cancelled = false;
  let frame = 0;
  let steady = 0;
  let previous = -1;

  const abort = () => {
    cancelled = true;
  };
  const listeners: [keyof WindowEventMap, EventListener][] = [
    ['wheel', abort],
    ['touchstart', abort],
    ['keydown', abort],
  ];
  for (const [type, fn] of listeners) {
    window.addEventListener(type, fn, { passive: true, once: true });
  }

  const cleanup = () => {
    cancelAnimationFrame(frame);
    for (const [type, fn] of listeners) window.removeEventListener(type, fn);
  };

  const tick = () => {
    if (cancelled) return cleanup();
    const target = scrollToSection(id, { immediate: true });
    if (target !== null) {
      const at = Math.round(window.scrollY);
      // Both conditions, and the first one is the one that matters: the page
      // has to actually BE there before "unchanged" means anything.
      const arrived = Math.abs(at - Math.round(target)) <= 2;
      steady = arrived && at === previous ? steady + 1 : 0;
      previous = at;
      if (steady >= 3) return cleanup();
    }
    if (performance.now() >= stopAt) return cleanup();
    frame = requestAnimationFrame(tick);
  };

  tick();
  return cleanup;
}
