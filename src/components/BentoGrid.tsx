import * as React from 'react';
import { cn } from '@/utils/cn';
import { GlassCard } from '@/components/GlassCard';

export type BentoGridProps = React.HTMLAttributes<HTMLDivElement>;

/** A responsive 3-column bento grid. Children control their own span. */
export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  /** Column span on large screens. */
  colSpan?: 1 | 2 | 3;
  /** Row span on large screens. */
  rowSpan?: 1 | 2;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const colSpanMap: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
};
const rowSpanMap: Record<number, string> = {
  1: 'lg:row-span-1',
  2: 'lg:row-span-2',
};

export function BentoCard({
  className,
  colSpan = 1,
  rowSpan = 1,
  eyebrow,
  title,
  description,
  children,
  ...props
}: BentoCardProps) {
  return (
    <GlassCard
      className={cn(
        'flex min-h-[200px] flex-col justify-between',
        colSpanMap[colSpan],
        rowSpanMap[rowSpan],
        className
      )}
      {...props}
    >
      {(eyebrow || title || description) && (
        <div>
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {eyebrow}
            </span>
          )}
          {title && (
            <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </GlassCard>
  );
}
