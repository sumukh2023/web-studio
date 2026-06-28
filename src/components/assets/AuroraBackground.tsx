import { cn } from '@/utils/cn';

export interface AuroraBackgroundProps {
  className?: string;
  /** Show the faint grid overlay. */
  grid?: boolean;
}

/**
 * Ambient hero backdrop: floating gradient blobs, a faint grid, and a
 * film-grain noise layer. Purely decorative.
 */
export function AuroraBackground({ className, grid = true }: AuroraBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {/* Gradient blobs */}
      <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 opacity-50 blur-[120px] animate-float" />
      <div
        className="absolute -right-24 top-10 h-[26rem] w-[26rem] rounded-full bg-accent/30 opacity-50 blur-[120px] animate-float"
        style={{ animationDelay: '-2s' }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[22rem] w-[22rem] rounded-full bg-cyan-500/20 opacity-50 blur-[120px] animate-float"
        style={{ animationDelay: '-4s' }}
      />

      {/* Grid */}
      {grid && (
        <div className="absolute inset-0 bg-grid-pattern bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      )}

      {/* Noise */}
      <div className="noise absolute inset-0 opacity-[0.035] mix-blend-overlay" />

      {/* Bottom fade into page background */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
