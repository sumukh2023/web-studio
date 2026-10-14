import { cn } from '@/utils/cn';
import {
  motion,
  SpringOptions,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useEffect } from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
  as?: React.ElementType;
  /**
   * How to group the digits. Left undefined the number follows the reader's
   * own browser, which is the upstream behaviour and right for a count that
   * is only ever a few digits.
   *
   * IT IS NOT RIGHT FOR A PUBLISHED FIGURE. `6000000` is `6,000,000` under
   * `en-US` and `60,00,000` under `en-IN`, and an amount the site states must
   * not group itself differently depending on where the reader's laptop was
   * set up, least of all when the same page carries the true figure in a
   * fixed-locale `sr-only` line beside it (what a screen reader and a crawler
   * read). Pass a locale wherever the two must agree.
   */
  locale?: string;
};

export function AnimatedNumber({
  value,
  className,
  springOptions,
  as = 'span',
  locale,
}: AnimatedNumberProps) {
  const MotionComponent = motion.create(as as keyof JSX.IntrinsicElements);

  /* A COUNT IS MOTION, AND SOMEBODY MAY HAVE ASKED FOR LESS OF IT.
     A figure travelling from one value to another is exactly the kind of
     movement `prefers-reduced-motion` is about, and it is worse than most:
     the reader cannot look away from it, because the number is the thing
     they came to read. Stiffening the spring to the point of being
     instantaneous, rather than branching to a plain span, keeps one render
     path and one set of styles — the value simply arrives. */
  const reduced = useReducedMotion();
  const spring = useSpring(
    value,
    reduced ? { duration: 0, bounce: 0 } : springOptions
  );
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString(locale)
  );

  useEffect(() => {
    if (reduced) spring.jump(value);
    else spring.set(value);
  }, [reduced, spring, value]);

  return (
    <MotionComponent className={cn('tabular-nums', className)}>
      {display}
    </MotionComponent>
  );
}
