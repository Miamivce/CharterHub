/**
 * Cache control utility functions
 */

// Generate a cache-busting query parameter
export const generateCacheBuster = () => {
  return `?v=${new Date().getTime()}`
}

// Add cache buster to image URL
export const addCacheBusterToUrl = (url: string) => {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${new Date().getTime()}`
}

// Generate content hash from string
export const generateContentHash = (content: string) => {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

// Check if browser supports service workers
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator
}

// Clear all application cache
export const clearApplicationCache = async () => {
  if ('caches' in window) {
    try {
      const cacheKeys = await window.caches.keys()
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)))
      return true
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return false
    }
  }
  return false
}

// Force reload page without cache
export const forceReload = () => {
  window.location.reload()
}

// Clear local storage and session storage
export const clearStorages = () => {
  try {
    localStorage.clear()
    sessionStorage.clear()
    return true
  } catch (error) {
    console.error('Failed to clear storages:', error)
    return false
  }
}

// Perform complete cache reset
export const performCompleteReset = async () => {
  await clearApplicationCache()
  clearStorages()
  forceReload()
}
