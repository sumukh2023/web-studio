import * as React from 'react';
import { cn } from '@/utils/cn';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Render with the centered max-width container. */
  container?: boolean;
  /** Vertical padding scale. */
  spacing?: 'sm' | 'md' | 'lg';
  as?: 'section' | 'div' | 'footer' | 'header' | 'main';
}

const spacingMap = {
  sm: 'py-12 sm:py-16',
  md: 'py-20 sm:py-28',
  lg: 'py-28 sm:py-36',
};

/** A consistent vertical rhythm wrapper for page sections. */
export const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    { className, container = true, spacing = 'md', as = 'section', children, ...props },
    ref
  ) => {
    const Comp = as as React.ElementType;
    return (
      <Comp ref={ref} className={cn('relative', spacingMap[spacing], className)} {...props}>
        {container ? <div className="container">{children}</div> : children}
      </Comp>
    );
  }
);
Section.displayName = 'Section';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

/** A reusable eyebrow / title / description heading block. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-primary">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tightest text-gradient sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
