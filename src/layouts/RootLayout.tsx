import { type ReactNode } from 'react';
import { useLenis } from '@/hooks';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';
import { CursorGlow } from '@/components/CursorGlow';

export interface RootLayoutProps {
  children: ReactNode;
  /** Toggle the global chrome (nav, footer, progress bar, cursor glow). */
  chrome?: boolean;
}

/**
 * App shell: smooth scrolling + global chrome. Drop your page content as
 * children. Designed to be the single wrapper for any competition build.
 */
export function RootLayout({ children, chrome = true }: RootLayoutProps) {
  useLenis();

  return (
    <div className="relative min-h-screen">
      {chrome && (
        <>
          <ScrollProgress />
          <CursorGlow />
          <Navbar />
        </>
      )}
      <main>{children}</main>
      {chrome && <Footer />}
    </div>
  );
}
