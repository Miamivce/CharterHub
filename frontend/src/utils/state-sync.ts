/**
 * state-sync.ts
 * Utilities for ensuring state changes have propagated through React components
 */

/**
 * Helper utility to ensure state changes have propagated
 * Use this when you need to guarantee state updates have been applied
 *
 * @param timeout - Additional time in ms to wait (default: 50ms)
 * @returns Promise that resolves when state should be synchronized
 */
export const ensureStateSync = async (timeout = 50): Promise<void> => {
  // Force event loop to flush by returning to it
  await new Promise((resolve) => setTimeout(resolve, 0))

  // Then wait for microtasks to process
  await new Promise((resolve) => {
    // Use requestAnimationFrame for browser paint cycle
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
      window.requestAnimationFrame(() => {
        // Add a small delay to ensure React has processed state changes
        setTimeout(resolve, timeout)
      })
    } else {
      // Fallback for non-browser environments
      setTimeout(resolve, timeout)
    }
  })
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait = 100
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Creates a function that only executes once
 *
 * @param func - The function to execute only once
 * @returns A function that will only execute once
 */
export const once = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let called = false
  let result: ReturnType<T> | undefined

  return function (...args: Parameters<T>) {
    if (!called) {
      called = true
      result = func(...args)
    }
    return result
  }
}
