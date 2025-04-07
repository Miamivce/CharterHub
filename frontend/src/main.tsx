import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/react-query'
import App from '@/App'
import './styles/globals.css'
import { isServiceWorkerSupported } from './utils/cacheControl'
import performStartupStorageCleanup, {
  emergencyCleanup,
  checkForSensitiveData,
} from './utils/storageCleanup'
import { printDeprecationReport } from './utils/deprecation-monitor'

// Import axios configuration for CORS support
import './utils/axios-config'

// Clean up any sensitive or development data from storage
if (process.env.NODE_ENV === 'production') {
  // In production, be more aggressive with cleanup
  emergencyCleanup()

  // Log if we still find any sensitive data after cleanup
  const sensitiveDataCheck = checkForSensitiveData()
  if (sensitiveDataCheck.hasSensitiveData) {
    console.warn(
      '[SECURITY WARNING] Sensitive data found in storage after cleanup:',
      sensitiveDataCheck.items
    )
  }
} else {
  // In development, use normal cleanup
  performStartupStorageCleanup()
}

// Register service worker with error handling
if (isServiceWorkerSupported() && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration)

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, show refresh prompt
                if (confirm('New version available! Click OK to refresh.')) {
                  window.location.reload()
                }
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('SW registration failed:', error)
      })
  })

  // Handle service worker communication
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_UPDATED') {
      // Handle cache updates if needed
      queryClient.invalidateQueries()
    }
  })
}

// Make deprecation reports accessible in the browser console
// This will only be available in development mode
if (import.meta.env.DEV) {
  // @ts-ignore - Adding a helper to the window object
  window.checkDeprecations = printDeprecationReport
  console.info(
    '%c[Admin Auth Migration] Use window.checkDeprecations() in the console to see all deprecated components used in this session',
    'color: #4338ca; font-weight: bold;'
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
