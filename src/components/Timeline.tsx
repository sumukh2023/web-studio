import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface TimelineItem {
  time: string;
  title: string;
  description: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

/** A vertical timeline with a gradient spine that draws in on scroll. */
export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative mx-auto max-w-2xl', className)}>
      {/* Spine */}
      <div className="absolute left-[7px] top-2 h-full w-px bg-border sm:left-1/2 sm:-translate-x-1/2" />
      <motion.div
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="absolute left-[7px] top-2 h-full w-px origin-top bg-gradient-to-b from-primary via-accent to-transparent sm:left-1/2 sm:-translate-x-1/2"
      />

      <ul className="space-y-10">
        {items.map((item, i) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative pl-10 sm:w-1/2 sm:pl-0',
              i % 2 === 0
                ? 'sm:ml-auto sm:pl-12 sm:text-left'
                : 'sm:mr-auto sm:pr-12 sm:text-right'
            )}
          >
            <span
              className={cn(
                'absolute left-0 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-background',
                i % 2 === 0
                  ? 'sm:-left-2'
                  : 'sm:left-auto sm:-right-2'
              )}
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {item.time}
            </span>
            <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
