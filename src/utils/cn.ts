import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional class names and resolve Tailwind conflicts.
 *
 * @example cn('px-2', condition && 'px-4', 'text-sm') // -> 'px-4 text-sm'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
