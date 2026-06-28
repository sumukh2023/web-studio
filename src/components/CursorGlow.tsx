import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

export interface CursorGlowProps {
  /** Diameter of the glow in pixels. */
  size?: number;
  /** Any valid CSS color (defaults to the brand primary). */
  color?: string;
}

/**
 * A soft radial glow that trails the cursor across the page — a subtle
 * premium touch. Automatically disabled for touch / reduced-motion users.
 */
export function CursorGlow({
  size = 520,
  color = 'hsl(var(--primary) / 0.18)',
}: CursorGlowProps) {
  const reduced = usePrefersReducedMotion();
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const springX = useSpring(x, { stiffness: 120, damping: 25, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 120, damping: 25, mass: 0.6 });

  useEffect(() => {
    if (reduced) return;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) return;

    const move = (e: MouseEvent) => {
      x.set(e.clientX - size / 2);
      y.set(e.clientY - size / 2);
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [reduced, size, x, y]);

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 rounded-full blur-3xl"
      style={{
        x: springX,
        y: springY,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}, transparent 60%)`,
      }}
    />
  );
}
