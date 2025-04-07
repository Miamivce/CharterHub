import { QueryClient } from '@tanstack/react-query'

// Create a client with optimized configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 1000 * 60 * 1, // 1 minute
      networkMode: 'offlineFirst',
      // Don't cache auth-related queries
      queryKeyHashFn: (queryKey: readonly unknown[]) => {
        const queryKeyString = JSON.stringify(queryKey)
        if (queryKeyString.includes('auth') || queryKeyString.includes('login')) {
          return Date.now().toString() // Force new cache key for auth queries
        }
        return queryKeyString
      },
    },
    mutations: {
      retry: 1,
    },
  },
})
