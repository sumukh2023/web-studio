import { useEffect, useRef, type RefObject } from 'react';
import { lockPageScroll } from '@/utils/page-scroll';

/**
 * The five things an overlay owes a keyboard.
 *
 * Escape closes it. Focus moves into it when it opens and back to whatever
 * opened it when it closes. Tab cycles inside it rather than walking out into
 * the page behind. The page behind is inert, so a screen reader cannot reach
 * it either. And the page behind does not scroll.
 *
 * WHY THIS EXISTS. Hand-written overlays almost always miss some of the
 * five: a mobile menu that lets Tab walk straight out of the sheet into
 * content nobody can see, ignores Escape and leaves the page scrolling
 * underneath, or a panel that announces `aria-modal="true"` while doing the
 * same. Measured on a real site at 390px with the menu open: Tab reached the
 * nav links and then continued into the hero's buttons behind the sheet,
 * Escape did nothing, and a wheel gesture moved the page from 1170 to 588.
 * Written once here so every overlay (menu, lightbox, modal) behaves alike.
 *
 * `inert` is applied to every sibling of the overlay's nearest positioned
 * ancestor rather than to a hard-coded selector, so it works whatever layout
 * the overlay sits in without that layout knowing about it.
 */
export function useDialog({
  open,
  onClose,
  panel,
  /**
   * What to focus when it opens. Defaults to the first focusable thing in the
   * panel; pass a ref to override (the menu focuses its close button, so the
   * first Tab lands on the first link rather than skipping it).
   */
  initialFocus,
  /**
   * The element whose siblings become inert. Defaults to the panel's parent.
   * The mobile menu passes its `<header>`, because the panel is inside the
   * header and the header must stay reachable.
   */
  inertAround,
}: {
  open: boolean;
  onClose: () => void;
  panel: RefObject<HTMLElement | null>;
  initialFocus?: RefObject<HTMLElement | null>;
  inertAround?: RefObject<HTMLElement | null>;
}) {
  /** Whatever had focus before the overlay opened, to give it back. */
  const restoreTo = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;

    /* SCROLL LOCK, from the one place that owns it. This used to pin the body
       with `position: fixed; top: -Npx`, which sets `window.scrollY` to 0 and
       then has to put it back; every scroll-restoration bug in an overlay
       comes from that put-back.
       `lockPageScroll` uses hidden overflow instead, so the page never moves,
       and it stops the smooth scroller, which was the thing animating the
       page back to the wrong place. See utils/page-scroll.ts. */
    const unlock = lockPageScroll();

    /* THE PAGE BEHIND IS INERT. Without this, everything Tab is prevented
       from reaching is still reachable by a screen reader's own cursor, which
       is the half of the problem a focus trap alone does not solve. */
    const anchor = inertAround?.current ?? panel.current?.parentElement;
    const inerted: HTMLElement[] = [];
    if (anchor?.parentElement) {
      for (const sibling of Array.from(anchor.parentElement.children)) {
        if (sibling === anchor || !(sibling instanceof HTMLElement)) continue;
        if (sibling.inert) continue; // already inert; leave it that way
        sibling.inert = true;
        inerted.push(sibling);
      }
    }

    /* Focus in. `requestAnimationFrame` because the panel is usually being
       animated in and is not laid out yet on the tick it mounts. */
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocus?.current ??
        panel.current?.querySelector<HTMLElement>(FOCUSABLE) ??
        panel.current;
      target?.focus?.();
    });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Wrap at both ends, and also catch the case where focus has somehow
      // left the panel entirely: put it back rather than letting it drift.
      if (event.shiftKey && (active === first || !panel.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panel.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      for (const el of inerted) el.inert = false;
      unlock();
      // `preventScroll`, because the element being restored to may be below
      // the fold and focusing it would otherwise scroll the page: the exact
      // jump this overlay was just fixed for.
      (restoreTo.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, panel, initialFocus, inertAround]);
}

/** Everything a browser will put focus on, minus the things it should not. */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
