/**
 * Safe debug logging utility that excludes sensitive data
 * @param message The message to log
 * @param module The module name (e.g., 'API', 'Auth', etc.)
 * @param type The log type ('info' or 'error')
 */
export const debugLog = (
  message: string,
  module: string = 'App',
  type: 'info' | 'error' = 'info'
): void => {
  if (import.meta.env.DEV) {
    console[type](`[${module}] ${message}`)
  }
}
