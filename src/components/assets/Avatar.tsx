import { cn } from '@/utils/cn';

// On-brand solid fills (single accent + neutrals), no AI-palette gradients.
const FILLS = [
  'bg-primary text-primary-foreground',
  'bg-foreground text-background',
  'bg-secondary text-secondary-foreground',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** A deterministic solid-fill avatar generated from a name. */
export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const fill = FILLS[name.length % FILLS.length];
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-background',
        fill,
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
