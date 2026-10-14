import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  isProgrammaticScroll,
  jumpToTop,
  pinToSection,
  restoreOffset,
} from '@/utils/page-scroll';

/**
 * Where the page is after every navigation. Render once, inside the router.
 *
 *   PUSH (a link)        opens at the top of the new page.
 *   POP  (Back/Forward)  returns to where that entry was left.
 *   #hash                lands on the section, clear of the fixed nav,
 *                        whichever way you arrived.
 *
 * `window.scrollTo(0, 0)` in an effect is not enough, and a trace shows why:
 * navigating from 3297px deep, the next page rendered at 3301 for two frames
 * before dropping to 0. The smooth scroller writes its own target back, and a
 * lazy route chunk mounts after the navigation and changes the document's
 * height underneath. `jumpToTop` (utils/page-scroll.ts) handles both.
 *
 * `history.scrollRestoration = 'manual'`: on `auto` the browser restores a
 * remembered offset on Back, which fights all of the above.
 */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const navigationType = useNavigationType();
  const offsets = useRef<Map<string, number>>(new Map());
  const entry = useRef(key);
  const sealed = useRef<string | null>(null);
  entry.current = key;

  useEffect(() => {
    if (!('scrollRestoration' in history)) return;
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    /* THE OFFSET IS SNAPSHOT WHEN THE READER COMMITS TO LEAVING, AND SEALED.
       When a long page swaps for a short one, the browser CLAMPS the scroll
       to what the new document can hold and fires a `scroll` event that is
       indistinguishable from the reader scrolling, while `entry` still names
       the page being left. Without the seal, Back "restores" the clamp (64px)
       instead of where the reader was. So the offset is taken at the click
       itself (capture phase, before the router moves anything) or on
       popstate, and further writes are refused until the reader scrolls. */
    const remember = () => {
      if (isProgrammaticScroll() || sealed.current === entry.current) return;
      offsets.current.set(entry.current, window.scrollY);
    };
    const snapshot = () => {
      offsets.current.set(entry.current, window.scrollY);
      sealed.current = entry.current;
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || link.target === '_blank' || link.origin !== window.location.origin) return;
      snapshot();
    };
    const release = () => {
      sealed.current = null;
    };
    const intents = ['wheel', 'touchstart', 'keydown'] as const;

    window.addEventListener('scroll', remember, { passive: true });
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', snapshot);
    window.addEventListener('pagehide', snapshot);
    for (const type of intents) window.addEventListener(type, release, { passive: true });
    return () => {
      window.removeEventListener('scroll', remember);
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', snapshot);
      window.removeEventListener('pagehide', snapshot);
      for (const type of intents) window.removeEventListener(type, release);
    };
  }, []);

  // Layout effect: the jump happens before the new route paints, not a frame in.
  useLayoutEffect(() => {
    if (navigationType === 'POP' && !hash) {
      const remembered = offsets.current.get(key);
      if (remembered !== undefined) return restoreOffset(remembered);
    }
    if (hash) return pinToSection(decodeURIComponent(hash.slice(1)));
    return jumpToTop();
  }, [pathname, hash, key, navigationType]);

  return null;
}
