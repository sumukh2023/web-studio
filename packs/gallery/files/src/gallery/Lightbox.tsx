import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EASE } from '@/utils/motion';
import { lockPageScroll } from '@/utils/page-scroll';
import { Picture } from '@/components/Picture';
import type { Photo } from './types';

const MotionPicture = motion.create(Picture);

/**
 * A photograph, fullscreen.
 *
 * - OPENS INSTANTLY: it shows the SAME src the grid already loaded, so the
 *   first frame comes from cache. A bigger file here is a spinner on black.
 * - GROWS OUT OF THE THUMBNAIL it was opened from (transform + opacity only,
 *   so it is cheap on a phone); arrow keys/buttons then crossfade in place.
 * - A PORTAL into document.body: any transformed ancestor (every reveal
 *   animation) would otherwise become the containing block of `fixed`.
 * - Escape closes, arrows step (wrapping), Tab is trapped, focus returns to
 *   the thumbnail WITHOUT scrolling the page, and the page behind neither
 *   scrolls nor moves (lockPageScroll stops Lenis rather than fighting it).
 */
export function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  /** Null when closed. */
  index: number | null;
  onClose: () => void;
  onNavigate: (next: number) => void;
}) {
  const open = index !== null;
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const from = useRef<{ x: number; y: number; scale: number } | null>(null);
  const restoreTo = useRef<Element | null>(null);

  const go = useCallback(
    (step: number) => {
      if (index === null || photos.length === 0) return;
      from.current = null; // stepping on crossfades in place
      onNavigate((index + step + photos.length) % photos.length);
    },
    [index, onNavigate, photos.length]
  );

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    // The transform that puts the centred image back over the thumbnail.
    const plate = (restoreTo.current as HTMLElement | null)?.getBoundingClientRect?.();
    from.current =
      plate && plate.width > 0
        ? {
            x: plate.left + plate.width / 2 - window.innerWidth / 2,
            y: plate.top + plate.height / 2 - window.innerHeight / 2,
            scale: Math.max(0.15, plate.width / window.innerWidth),
          }
        : null;
    panel.current?.focus();
    const unlock = lockPageScroll();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      } else if (event.key === 'Tab') {
        const focusable = panel.current?.querySelectorAll<HTMLElement>('button');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      unlock();
      (restoreTo.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open, onClose, go]);

  const at = index ?? -1;
  const photo = index === null ? null : photos[index];

  return createPortal(
    <AnimatePresence>
      {photo && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label={photo.caption ?? photo.alt}
          tabIndex={-1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: EASE.out }}
          /* A photo viewer's ground is near-black in every theme, like a
             darkroom. The blur behind a 96%-opaque ground is the most
             expensive layer a phone composites for 4% of the effect, so it
             only paints where the motion budget is rich. */
          className="fixed inset-0 z-[120] flex flex-col bg-black/95 focus:outline-none rich:backdrop-blur-xl"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div className="flex flex-none items-center justify-between px-5 pt-5 md:px-8 md:pt-7">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">
              <span className="tabular-nums text-white/90">{String(at + 1).padStart(2, '0')}</span>
              <span aria-hidden="true"> / </span>
              <span className="tabular-nums">{String(photos.length).padStart(2, '0')}</span>
            </p>
            <Control label="Close" onClick={onClose}>
              <X className="h-5 w-5" />
            </Control>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8 pt-4 md:px-20 md:pb-10"
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
          >
            {photos.length > 1 && (
              <div className="pointer-events-none absolute inset-x-3 top-1/2 z-10 flex -translate-y-1/2 justify-between md:inset-x-6">
                <Control label="Previous photo" onClick={() => go(-1)}>
                  <ChevronLeft className="h-5 w-5" />
                </Control>
                <Control label="Next photo" onClick={() => go(1)}>
                  <ChevronRight className="h-5 w-5" />
                </Control>
              </div>
            )}
            <AnimatePresence mode="wait">
              <MotionPicture
                key={photo.id}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                initial={
                  !reduced && from.current
                    ? { opacity: 0, x: from.current.x, y: from.current.y, scale: from.current.scale }
                    : { opacity: 0, scale: 0.985 }
                }
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: reduced ? 0.15 : 0.42, ease: EASE.out }}
                onAnimationComplete={() => {
                  from.current = null;
                }}
                // max-h-full + object-contain keeps a portrait photo inside a phone's viewport.
                className="max-h-full max-w-full rounded-sm object-contain"
              />
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function Control({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white/80 transition-colors duration-300 hover:border-white/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {children}
    </button>
  );
}
