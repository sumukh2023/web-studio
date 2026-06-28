import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/utils/cn';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger applied to direct children when `splitChildren` is true. */
  stagger?: number;
  /** Animate each direct child individually instead of the wrapper. */
  splitChildren?: boolean;
  delay?: number;
  y?: number;
}

/**
 * A GSAP-powered scroll reveal — demonstrates the GSAP integration alongside
 * the Framer Motion helpers. Uses IntersectionObserver so it has no plugin
 * dependency (works without ScrollTrigger).
 */
export function Reveal({
  children,
  className,
  stagger = 0.1,
  splitChildren = false,
  delay = 0,
  y = 28,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const targets = splitChildren
      ? (Array.from(el.children) as HTMLElement[])
      : [el];

    if (prefersReduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(targets, { opacity: 0, y });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(targets, {
              opacity: 1,
              y: 0,
              duration: 0.9,
              delay,
              stagger: splitChildren ? stagger : 0,
              ease: 'power3.out',
            });
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger, splitChildren, delay, y]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
