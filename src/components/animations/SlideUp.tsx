import { motion, type HTMLMotionProps } from 'framer-motion';
import { reveal } from '@/utils/motion';

export interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  once?: boolean;
  amount?: number;
}

/** Slide + fade content in from a given direction on scroll. */
export function SlideUp({
  children,
  delay = 0,
  distance = 28,
  direction = 'up',
  once = true,
  amount = 0.3,
  ...props
}: SlideUpProps) {
  return (
    <motion.div
      variants={reveal(direction, distance)}
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
