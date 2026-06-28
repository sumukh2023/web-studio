import * as React from 'react';
import { cn } from '@/utils/cn';

export interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  /** Pause the scroll on hover. */
  pauseOnHover?: boolean;
  /** Reverse the scroll direction. */
  reverse?: boolean;
}

/**
 * An infinite horizontal marquee. Duplicates its children so the loop is
 * seamless, and fades both edges via a CSS mask.
 */
export function Marquee({
  children,
  className,
  pauseOnHover = true,
  reverse = false,
}: MarqueeProps) {
  return (
    <div className={cn('mask-fade-x group flex overflow-hidden', className)}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={cn(
            'flex shrink-0 animate-marquee items-center gap-8 pr-8',
            reverse && '[animation-direction:reverse]',
            pauseOnHover && 'group-hover:[animation-play-state:paused]'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
