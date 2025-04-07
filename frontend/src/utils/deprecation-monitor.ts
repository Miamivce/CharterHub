/**
 * Deprecation Monitor Utility
 *
 * This utility helps track and log usage of deprecated components and services
 * during the migration from admin auth to JWT auth.
 */

/**
 * Logs a deprecation warning with additional context information
 *
 * @param componentName The name of the deprecated component
 * @param replacementInfo Information about what to use instead
 * @param docLink Optional link to documentation
 */
export const logDeprecationWarning = (
  componentName: string,
  replacementInfo: string,
  docLink: string = 'library/14mrt_admin_auth_migration_plan.md'
): void => {
  const warning = [
    `%c[DEPRECATED] ${componentName} is deprecated and will be removed in a future release.`,
    `Please use ${replacementInfo} instead.`,
    `See migration guide in ${docLink} for details.`,
    `\nStack trace:`,
    new Error().stack,
  ].join('\n')

  console.warn(warning, 'font-weight: bold; color: #FFA500;')

  // Track this in analytics or monitoring if available
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      // Store deprecation warnings in session storage for debugging
      const warningsKey = 'deprecation_warnings'
      const existingWarnings = JSON.parse(sessionStorage.getItem(warningsKey) || '[]')
      const newWarning = {
        component: componentName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        trace: new Error().stack,
      }

      // Add new warning if it's not a duplicate from the same URL
      if (
        !existingWarnings.some(
          (w: any) => w.component === componentName && w.url === window.location.href
        )
      ) {
        existingWarnings.push(newWarning)
        sessionStorage.setItem(warningsKey, JSON.stringify(existingWarnings))
      }
    } catch (e) {
      // Ignore storage errors
    }
  }
}

/**
 * Gets a report of all deprecation warnings recorded in this session
 */
export const getDeprecationReport = (): any[] => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const warningsKey = 'deprecation_warnings'
      return JSON.parse(sessionStorage.getItem(warningsKey) || '[]')
    } catch (e) {
      return []
    }
  }
  return []
}

/**
 * Prints a formatted deprecation report to the console
 */
export const printDeprecationReport = (): void => {
  const warnings = getDeprecationReport()

  if (warnings.length === 0) {
    console.log(
      '%c[DEPRECATION REPORT] No deprecated components were used in this session!',
      'color: green; font-weight: bold;'
    )
    return
  }

  console.log(
    '%c[DEPRECATION REPORT] The following deprecated components were used:',
    'color: #FFA500; font-weight: bold;'
  )

  // Group warnings by component
  const grouped: Record<string, any[]> = {}
  warnings.forEach((warning) => {
    if (!grouped[warning.component]) {
      grouped[warning.component] = []
    }
    grouped[warning.component].push(warning)
  })

  // Print summary
  Object.entries(grouped).forEach(([component, instances]) => {
    console.log(`%c${component}: used ${instances.length} time(s)`, 'color: #FFA500;')

    // Print unique URLs
    const uniqueUrls = [...new Set(instances.map((w) => w.url))]
    console.log('  Pages:')
    uniqueUrls.forEach((url) => console.log(`  - ${url}`))
  })

  console.log(
    '%cSee migration plan for guidance on replacing these components.',
    'font-style: italic;'
  )
}

// Add a global command for easy access in browser console
if (typeof window !== 'undefined') {
  ;(window as any).checkDeprecations = printDeprecationReport
}

// Export a helper to update our deprecated components
export const wrapWithDeprecationWarning = <T extends Function>(
  originalFn: T,
  componentName: string,
  replacementInfo: string
): T => {
  const wrapped = function (this: any, ...args: any[]) {
    logDeprecationWarning(componentName, replacementInfo)
    return originalFn.apply(this, args)
  }

  return wrapped as unknown as T
}
