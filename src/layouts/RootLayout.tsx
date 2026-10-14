import { useMemo, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { useLenis, useMediaQuery } from '@/hooks';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';
import { CursorGlow } from '@/components/CursorGlow';
import { SkipLink } from '@/components/SkipLink';

export interface RootLayoutProps {
  children: ReactNode;
  /** Toggle the global chrome (nav, footer, progress bar, cursor glow). */
  chrome?: boolean;
}

/**
 * App shell: smooth scrolling + global chrome. Drop your page content as
 * children. Designed to be the single wrapper for any build.
 *
 * `MotionConfig reducedMotion="user"` stills every Framer Motion animation for
 * a reader who has asked the OS for less motion, so no component has to
 * remember to check.
 */
export function RootLayout({ children, chrome = true }: RootLayoutProps) {
  // Safari (macOS): Lenis's JS-driven wheel smoothing forces every scroll
  // frame through the main thread, which is why desktop Safari lags while
  // touch scrolling stays native and smooth. Safari keeps its fast native
  // scroll path; Chromium/Gecko get the Lenis glide.
  // ("Version/… Safari" appears only in true Safari UAs, never Chrome/Edge.)
  const isSafari = useMemo(
    () =>
      typeof navigator !== 'undefined' &&
      /Version\/[\d.]+.*Safari/.test(navigator.userAgent),
    []
  );

  /* SMOOTH WHEEL IS FOR DEVICES WITH A WHEEL. On a touchscreen Lenis smooths
     an input that does not exist (finger scroll stays native either way) but
     still owns the document scroll and holds a requestAnimationFrame loop
     open for the life of the page: main-thread work sixty times a second, in
     service of nothing, competing with the compositor on a mid-range phone.
     `(pointer: fine)` asks the question that matters, is honest about
     hybrids, and re-evaluates when a tablet's keyboard is attached. */
  const hasPointer = useMediaQuery('(pointer: fine)');
  useLenis({ enabled: hasPointer && !isSafari });

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen">
        <SkipLink />
        {chrome && (
          <>
            <ScrollProgress />
            <CursorGlow />
            <Navbar />
          </>
        )}
        {/* ONE `<main>` PER PAGE. With the starter chrome on, this wrapper is
            the main landmark. With `chrome={false}` the page owns its own
            `<main id="main" tabIndex={-1}>`, so the header, footer and any
            floating widgets stay OUTSIDE the landmark that screen-reader
            users jump to, and a route never ends up with two. */}
        {chrome ? (
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
        ) : (
          children
        )}
        {chrome && <Footer />}
      </div>
    </MotionConfig>
  );
}
