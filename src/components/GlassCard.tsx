import * as React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface GlassCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
  > {
  /** Show a spotlight that follows the cursor across the card. */
  spotlight?: boolean;
}

/**
 * A frosted-glass surface with an optional cursor-tracking spotlight —
 * the kind of detail you see on Linear / Vercel marketing pages.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, spotlight = true, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };

    const background = useMotionTemplate`radial-gradient(240px circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.15), transparent 80%)`;

    return (
      <div
        ref={ref}
        onMouseMove={spotlight ? handleMouseMove : undefined}
        className={cn(
          'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl',
          className
        )}
        {...props}
      >
        {spotlight && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background }}
          />
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';
