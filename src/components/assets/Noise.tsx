import { cn } from '@/utils/cn';

/** A full-bleed film-grain overlay. Drop into any relatively positioned box. */
export function Noise({
  className,
  opacity = 0.04,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      style={{ opacity }}
      className={cn(
        'noise pointer-events-none absolute inset-0 mix-blend-overlay',
        className
      )}
    />
  );
}
