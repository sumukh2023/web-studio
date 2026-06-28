import { motion, type HTMLMotionProps } from 'framer-motion';
import { scaleVariants } from '@/utils/motion';

export interface ScaleInProps extends HTMLMotionProps<'div'> {
  delay?: number;
  once?: boolean;
  amount?: number;
}

/** Scale + fade content in on scroll. */
export function ScaleIn({
  children,
  delay = 0,
  once = true,
  amount = 0.3,
  ...props
}: ScaleInProps) {
  return (
    <motion.div
      variants={scaleVariants}
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
