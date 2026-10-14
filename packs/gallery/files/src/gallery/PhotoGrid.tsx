import { useState } from 'react';
import { motion } from 'framer-motion';
import { Picture } from '@/components/Picture';
import { cn } from '@/utils/cn';
import { EASE, REVEAL_VIEWPORT } from '@/utils/motion';
import { Lightbox } from './Lightbox';
import type { Photo } from './types';

/**
 * A masonry wall (CSS columns, so every photo keeps its own aspect ratio)
 * where each photo is a real <button> that opens the lightbox. Keyboard and
 * screen-reader users get the same gallery as everyone else.
 *
 * The first `eager` photos load immediately; the rest lazily.
 */
export function PhotoGrid({
  photos,
  className,
  eager = 2,
}: {
  photos: Photo[];
  className?: string;
  eager?: number;
}) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <ul className={cn('columns-1 gap-4 sm:columns-2 lg:columns-3', className)}>
        {photos.map((photo, i) => (
          <motion.li
            key={photo.id}
            className="mb-4 break-inside-avoid"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={REVEAL_VIEWPORT}
            transition={{ duration: 0.6, delay: (i % 3) * 0.06, ease: EASE.out }}
          >
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Open photo: ${photo.caption ?? photo.alt}`}
              className="group block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Picture
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                loading={i < eager ? 'eager' : 'lazy'}
                decoding="async"
                className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
              />
            </button>
          </motion.li>
        ))}
      </ul>
      <Lightbox photos={photos} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}
