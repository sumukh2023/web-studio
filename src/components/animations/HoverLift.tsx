import { motion, type HTMLMotionProps } from 'framer-motion';
import { springSoft } from '@/utils/motion';

export interface HoverLiftProps extends HTMLMotionProps<'div'> {
  /** How far to lift on hover, in pixels. */
  lift?: number;
  /** Scale factor on hover. */
  scale?: number;
}

/** Lift + gently scale an element on hover with a soft spring. */
export function HoverLift({
  children,
  lift = 6,
  scale = 1.02,
  ...props
}: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -lift, scale }}
      whileTap={{ scale: 0.98 }}
      transition={springSoft}
      {...props}
    >
      {children}
    </motion.div>
  );
}
