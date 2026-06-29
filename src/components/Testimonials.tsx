import { Quote } from 'lucide-react';
import { cn } from '@/utils/cn';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/assets/Avatar';

export interface Testimonial {
  quote: string;
  name: string;
  role?: string;
  /** Optional rating out of 5; renders nothing if omitted. */
  rating?: number;
}

export interface TestimonialsProps {
  items: Testimonial[];
  className?: string;
  /** Columns at the large breakpoint. */
  columns?: 2 | 3;
}

const colMap = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
};

/** A responsive grid of quote cards with gradient placeholder avatars. */
export function Testimonials({
  items,
  className,
  columns = 3,
}: TestimonialsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2',
        colMap[columns],
        className
      )}
    >
      {items.map((t) => (
        <GlassCard
          key={t.name}
          className="flex h-full flex-col"
          spotlight={false}
        >
          <Quote className="h-6 w-6 text-primary/70" aria-hidden />
          <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
            “{t.quote}”
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Avatar name={t.name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{t.name}</p>
              {t.role && (
                <p className="truncate text-xs text-muted-foreground">
                  {t.role}
                </p>
              )}
            </div>
            {typeof t.rating === 'number' && (
              <span className="ml-auto text-xs font-medium text-amber-400">
                {'★'.repeat(Math.max(0, Math.min(5, Math.round(t.rating))))}
              </span>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
