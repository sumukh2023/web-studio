import { useEffect, useState, type ReactNode } from 'react';
import { OPENS_AT, remaining, spoken, UNITS } from './countdown';

/**
 * A live countdown to the event start (src/event/event.json).
 *
 * - Ticks once a second, aligned to the wall clock's second boundary, and
 *   stops itself when the moment arrives (renders `arrived` instead).
 * - Screen readers get ONE sentence that changes at most once a minute
 *   (`spoken`), not five numbers announced every second.
 * - Months are hidden while zero, so it never reads "0 months".
 * - Before mount (prerender, SSR) it renders nothing time-dependent, so the
 *   build machine's clock is never baked into HTML.
 */
export function Countdown({
  target = OPENS_AT,
  arrived = <p className="font-heading text-xl font-semibold">It has begun.</p>,
  className,
}: {
  target?: number;
  arrived?: ReactNode;
  className?: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t < target) timer = window.setTimeout(tick, 1000 - (t % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [target]);

  if (now === null) return <div className={className} aria-hidden="true" />;
  const left = remaining(now, target);
  if (!left) return <>{arrived}</>;
  const minuteKey = Math.floor(now / 60_000);

  return (
    <div className={className}>
      <p className="sr-only" aria-live="polite" key={minuteKey}>
        {spoken(left)} to go
      </p>
      <dl aria-hidden="true" className="flex flex-wrap gap-x-6 gap-y-3">
        {UNITS.filter(({ key }) => key !== 'months' || left.months > 0).map(({ key, one, many }) => (
          <div key={key} className="flex flex-col-reverse items-start">
            <dt className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {left[key] === 1 ? one : many}
            </dt>
            <dd className="font-heading text-4xl font-semibold tabular-nums text-foreground sm:text-5xl">
              {String(left[key]).padStart(2, '0')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
