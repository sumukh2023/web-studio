import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Bell, X } from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';
import { cn } from '@/utils/cn';
import { EASE } from '@/utils/motion';
import { useLiveUpdates } from './useLiveUpdates';

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '';

/**
 * A floating "Updates" button with an unread badge, opening a panel of
 * announcements. A real dialog (useDialog: Escape, focus trap and return,
 * inert background, no page scroll) that slides from the corner.
 *
 * ON A PHONE IT IS A 44px ICON, not a labelled pill: a floating control is
 * drawn over the page, and at 390px a pill covered a payment page's app
 * choices and its submit button (found in the sandbox test). The label stays
 * for screen readers. Pages with a primary action in the bottom-right corner
 * can move it with `className` (e.g. "bottom-24") or not render it there.
 */
export function LiveUpdates({ className }: { className?: string }) {
  const { updates, unread, live, markSeen } = useLiveUpdates();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const close = useCallback(() => setOpen(false), []);
  useDialog({ open, onClose: close, panel });

  return (
    <div className={cn('fixed bottom-4 right-4 z-50 sm:bottom-5 sm:right-5', className)}>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          markSeen();
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex size-11 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-auto sm:min-h-11 sm:px-4"
      >
        <Bell aria-hidden="true" className="size-4" />
        <span className="sr-only sm:not-sr-only">Updates</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground sm:static">
            {unread}
            <span className="sr-only"> unread</span>
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="live-updates-title"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE.out }}
            style={{ transformOrigin: 'bottom right' }}
            className="absolute bottom-14 right-0 flex max-h-[70dvh] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-elevated"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 id="live-updates-title" className="font-heading text-base font-semibold">
                Updates
                {live && <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">live</span>}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close updates"
                className="grid size-11 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <ol className="overflow-y-auto overscroll-contain px-5 py-2">
              {updates.length === 0 && <li className="py-6 text-sm text-muted-foreground">Nothing yet. Check back soon.</li>}
              {updates.map((u) => (
                <li key={u.id} className="border-b border-border/60 py-4 last:border-b-0">
                  <p className="text-xs tabular-nums text-muted-foreground">{when(u.published_at)}</p>
                  <h3 className="mt-1 text-sm font-semibold">
                    {u.priority === 'high' && <span className="mr-1.5 text-destructive">Important:</span>}
                    {u.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{u.message}</p>
                  {u.cta_url && u.cta_label && (
                    <a href={u.cta_url} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      {u.cta_label}
                      <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
