import { cn } from '@/utils/cn';

const GRADIENTS = [
  'from-indigo-500 to-fuchsia-500',
  'from-cyan-500 to-blue-500',
  'from-amber-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** A deterministic gradient placeholder avatar generated from a name. */
export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const gradient = GRADIENTS[name.length % GRADIENTS.length];
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-background',
        gradient,
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
