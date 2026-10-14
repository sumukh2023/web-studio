import { createContext, useContext } from 'react';
import type { MotionBudget } from '@/utils/motion-budget';

/**
 * The budget, and the two questions every caller actually asks of it. Kept
 * apart from the provider so this file exports no component (Fast Refresh).
 */
export type MotionBudgetValue = {
  budget: MotionBudget;
  /** Everything is affordable: parallax, blur, loops, pointer-tracking. */
  rich: boolean;
  /** Cheap motion is welcome: fades, slides, colour, a counter. */
  animated: boolean;
};

/* The default is the cautious one: a component rendered outside the provider
   (a test, a preview) gets the phone's answer, so nothing expensive mounts by
   accident. */
export const MotionBudgetContext = createContext<MotionBudgetValue>({
  budget: 'lite',
  rich: false,
  animated: true,
});

export function useMotionBudget(): MotionBudgetValue {
  return useContext(MotionBudgetContext);
}
