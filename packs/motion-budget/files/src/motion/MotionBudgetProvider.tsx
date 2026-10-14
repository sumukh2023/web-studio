import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MotionBudgetContext, type MotionBudgetValue } from './context';
import { initialBudget, overrideFromLocation, type MotionBudget } from '@/utils/motion-budget';

/**
 * THE ONE PLACE THAT DECIDES HOW MUCH MOTION RUNS. See utils/motion-budget.ts
 * for the three levels.
 *
 * Two ways to read it, because two kinds of effect need it:
 *   `useMotionBudget()` in JS: whether to MOUNT a spotlight, subscribe to the
 *     scroll, run a loop. An unaffordable effect should not be mounted at all.
 *   `data-motion` on <html> for CSS, via the `rich:`, `lite:` and `still:`
 *     Tailwind variants (tailwind.config.ts). A blur or shadow costs nothing
 *     to declare and everything to paint, so it is gated in the stylesheet.
 *
 * `?motion=still|lite|full` pins a level, to look at each one on purpose.
 */
export function MotionBudgetProvider({
  children,
  allowFull = false,
}: {
  children: ReactNode;
  /** Promote clearly capable desktops to `full` automatically. */
  allowFull?: boolean;
}) {
  const [budget, setBudget] = useState<MotionBudget>(() =>
    typeof window === 'undefined' ? 'lite' : initialBudget(window, undefined, { allowFull })
  );

  useEffect(() => {
    const pinned = overrideFromLocation(window.location.search);
    if (pinned) {
      setBudget(pinned);
      return;
    }
    const settle = () => setBudget(initialBudget(window, undefined, { allowFull }));
    settle();
    // The reader can turn motion off mid-visit; a rotated phone changes the answer.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', settle);
    window.addEventListener('resize', settle, { passive: true });
    return () => {
      query.removeEventListener('change', settle);
      window.removeEventListener('resize', settle);
    };
  }, [allowFull]);

  useEffect(() => {
    document.documentElement.dataset.motion = budget;
  }, [budget]);

  const value = useMemo<MotionBudgetValue>(
    () => ({ budget, rich: budget === 'full', animated: budget !== 'still' }),
    [budget]
  );
  return <MotionBudgetContext.Provider value={value}>{children}</MotionBudgetContext.Provider>;
}
