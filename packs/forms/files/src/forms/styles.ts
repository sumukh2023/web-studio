/**
 * Button shapes shared by every form. Kept apart from the components because
 * a module that exports both components and plain values breaks React Fast
 * Refresh (the whole page reloads on every edit instead of hot-swapping).
 */
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

export const ghostButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-[border-color,color,transform] duration-200 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]';
