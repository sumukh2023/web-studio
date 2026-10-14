import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/utils/motion';

/** Seconds until the tick has finished drawing. Stagger copy under it from here. */
export const TICK_SETTLED = 1.1;

/**
 * The tick that draws itself when something has worked: the ring closes, then
 * the check is struck through it a beat later. Two `motion` paths with
 * `pathLength`, no library.
 *
 * Reduced motion gets the FINISHED tick, not a faster one: the meaning is in
 * the final shape, so someone who asked for less motion simply arrives at it.
 */
export function SuccessTick({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const draw = (duration: number, delay: number) =>
    reduced
      ? { initial: { pathLength: 1 }, animate: { pathLength: 1 } }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { duration, delay, ease: EASE.out },
        };

  return (
    <svg viewBox="0 0 96 96" className={className ?? 'h-24 w-24'} aria-hidden="true">
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        fill="none"
        strokeWidth="1.5"
        className="stroke-primary"
        {...draw(0.9, 0)}
      />
      <motion.path
        d="M32 49.5 L43.5 61 L64 38"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
        {...draw(0.5, 0.8)}
      />
    </svg>
  );
}
