import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { springSoft } from '@/utils/motion';

export interface AnimatedButtonProps extends Omit<ButtonProps, 'asChild'> {
  /** Add a sweeping shine highlight on hover. */
  shine?: boolean;
}

/**
 * A motion-enhanced button built on the same `buttonVariants` as `<Button>`,
 * with a tactile press, hover lift, and optional shine sweep.
 */
export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ className, variant, size, shine = true, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={springSoft}
      className={cn(
        buttonVariants({ variant, size }),
        'relative overflow-hidden',
        className
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {shine && (
        <span
          aria-hidden
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out hover:translate-x-full group-hover:translate-x-full"
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
});
AnimatedButton.displayName = 'AnimatedButton';
