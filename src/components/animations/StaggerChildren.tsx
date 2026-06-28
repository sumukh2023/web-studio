import { motion, type HTMLMotionProps } from 'framer-motion';
import { containerVariants, childVariants } from '@/utils/motion';

export interface StaggerChildrenProps extends HTMLMotionProps<'div'> {
  stagger?: number;
  delayChildren?: number;
  once?: boolean;
  amount?: number;
}

/**
 * Parent wrapper that staggers the entrance of its children.
 * Wrap each child in `<StaggerItem>` (or any motion element using
 * the `childVariants`).
 */
export function StaggerChildren({
  children,
  stagger = 0.08,
  delayChildren = 0,
  once = true,
  amount = 0.2,
  ...props
}: StaggerChildrenProps) {
  return (
    <motion.div
      variants={containerVariants(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div variants={childVariants} {...props}>
      {children}
    </motion.div>
  );
}
