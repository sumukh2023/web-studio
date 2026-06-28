import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeVariants } from '@/utils/motion';

export interface FadeInProps extends HTMLMotionProps<'div'> {
  /** Seconds to wait before animating in. */
  delay?: number;
  /** Animate only once when it enters the viewport. */
  once?: boolean;
  /** Negative margin shrinks the trigger area; tweak when to fire. */
  amount?: number;
}

/** Fade a block in as it scrolls into view. */
export function FadeIn({
  children,
  delay = 0,
  once = true,
  amount = 0.3,
  ...props
}: FadeInProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
