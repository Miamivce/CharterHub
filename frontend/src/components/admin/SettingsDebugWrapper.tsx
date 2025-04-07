import React, { useEffect } from 'react'
import { Settings } from '@/pages/admin/Settings'

export function SettingsDebugWrapper() {
  console.log('[SettingsDebugWrapper] Component rendering at:', new Date().toISOString())

  useEffect(() => {
    console.log('[SettingsDebugWrapper] Component mounted')

    return () => {
      console.log('[SettingsDebugWrapper] Component unmounting')
    }
  }, [])

  try {
    console.log('[SettingsDebugWrapper] Attempting to render Settings component')

    return (
      <div className="settings-debug-wrapper">
        <Settings />
      </div>
    )
  } catch (error) {
    console.error('[SettingsDebugWrapper] Error rendering Settings component:', error)

    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Error Rendering Settings</h2>
        <p>An error occurred while trying to render the Settings component.</p>
        <div className="mt-4 p-4 bg-red-50 rounded overflow-auto">
          <pre>{error instanceof Error ? error.message : String(error)}</pre>
          {error instanceof Error && error.stack && (
            <pre className="mt-2 text-sm">{error.stack}</pre>
          )}
        </div>
      </div>
    )
  }
}
