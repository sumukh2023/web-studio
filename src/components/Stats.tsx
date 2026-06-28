import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export interface StatsProps {
  stats: Stat[];
  className?: string;
}

function useCountUp(target: number, active: boolean, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Number((target * eased).toFixed(decimals)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration, decimals]);

  return value;
}

function StatItem({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const value = useCountUp(stat.value, inView, 1400, stat.decimals ?? 0);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-4xl font-extrabold tracking-tight text-gradient-brand sm:text-5xl">
        {stat.prefix}
        {value.toLocaleString(undefined, {
          minimumFractionDigits: stat.decimals ?? 0,
          maximumFractionDigits: stat.decimals ?? 0,
        })}
        {stat.suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
}

/** Animated count-up stat band. */
export function Stats({ stats, className }: StatsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-8 sm:grid-cols-4',
        className
      )}
    >
      {stats.map((stat) => (
        <StatItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
