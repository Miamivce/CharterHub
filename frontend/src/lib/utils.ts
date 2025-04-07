import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines multiple class values using clsx and tailwind-merge
 * Useful for combining Tailwind CSS classes, especially with conditional logic
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
