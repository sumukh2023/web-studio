import { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { calendarHref, calendarTarget, type CalendarTarget } from './calendar';

/**
 * One button that does the right thing per device (see calendar.ts). The
 * target is decided after mount, so a prerendered page never bakes in the
 * build machine's answer.
 */
export function AddToCalendar({ className, label = 'Add to calendar' }: { className?: string; label?: string }) {
  const [target, setTarget] = useState<CalendarTarget>('google');
  useEffect(() => setTarget(calendarTarget()), []);
  const external = target === 'google';
  return (
    <a
      href={calendarHref(target)}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <CalendarPlus aria-hidden="true" className="size-4" />
      {label}
      {external && <span className="sr-only"> (opens Google Calendar in a new tab)</span>}
    </a>
  );
}
