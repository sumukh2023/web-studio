import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { containerVariants, childVariants } from '@/utils/motion';

export interface GalleryItem {
  /** Image URL. If omitted, a themed gradient placeholder is shown. */
  src?: string;
  alt?: string;
  caption?: string;
  /** Make this tile span two rows for a masonry feel. */
  tall?: boolean;
}

export interface GalleryProps {
  items: GalleryItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const colMap = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const PLACEHOLDER_GRADIENTS = [
  'from-indigo-500/40 to-fuchsia-500/40',
  'from-cyan-500/40 to-blue-500/40',
  'from-amber-500/40 to-rose-500/40',
  'from-emerald-500/40 to-teal-500/40',
  'from-violet-500/40 to-purple-500/40',
];

/**
 * A responsive image gallery with hover zoom and caption reveal. Works with real
 * images (`src`) or renders themed gradient placeholders when none are provided —
 * so it's useful on competition day even before assets exist.
 */
export function Gallery({ items, className, columns = 3 }: GalleryProps) {
  return (
    <motion.div
      variants={containerVariants(0.06)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      className={cn(
        'grid auto-rows-[180px] grid-cols-1 gap-4',
        colMap[columns],
        className
      )}
    >
      {items.map((item, i) => (
        <motion.figure
          key={item.caption ?? item.src ?? i}
          variants={childVariants}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-border',
            item.tall && 'row-span-2'
          )}
        >
          {item.src ? (
            <img
              src={item.src}
              alt={item.alt ?? ''}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden
              className={cn(
                'h-full w-full bg-gradient-to-br transition-transform duration-500 group-hover:scale-105',
                PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]
              )}
            />
          )}

          {item.caption && (
            <figcaption className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              {item.caption}
            </figcaption>
          )}
        </motion.figure>
      ))}
    </motion.div>
  );
}
