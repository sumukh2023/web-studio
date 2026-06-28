import { motion, useScroll, useSpring } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface ScrollProgressProps {
  className?: string;
  /** Height of the bar in pixels. */
  height?: number;
}

/** A gradient progress bar pinned to the top of the viewport. */
export function ScrollProgress({ className, height = 3 }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, height }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 origin-left bg-gradient-to-r from-primary via-accent to-primary',
        className
      )}
    />
  );
}
