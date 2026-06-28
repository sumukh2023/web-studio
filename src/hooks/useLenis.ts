import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export interface UseLenisOptions {
  /** Disable smooth scrolling (e.g. for users who prefer reduced motion). */
  enabled?: boolean;
  lerp?: number;
  duration?: number;
}

/**
 * Mount a single Lenis smooth-scroll instance for the page and drive it with
 * a RAF loop. Returns a ref to the instance for programmatic `scrollTo`.
 */
export function useLenis({ enabled = true, lerp = 0.1, duration = 1.1 }: UseLenisOptions = {}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      lerp,
      duration,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled, lerp, duration]);

  return lenisRef;
}
