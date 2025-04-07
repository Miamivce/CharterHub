import { useQuery } from '@tanstack/react-query'
import {
  wordpressService,
  PaginationParams,
  CharterhubYacht,
  CharterhubDestination,
} from '@/services/wordpressService'
import { sampleDataService } from '@/services/sampleData'
import { queryClient } from '@/lib/react-query'

const CACHE_KEY = 'wp_yachts_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const STALE_TIME = 12 * 60 * 60 * 1000 // 12 hours - time before refetching
const INITIAL_PAGE_SIZE = 20 // Show fewer items initially for faster loading

interface CacheData<T> {
  data: T
  timestamp: number
  lastModified?: string // Track last modified date from API
}

const getCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsedCache: CacheData<T> = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key)
      return null
    }

    return parsedCache.data
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

const setCache = <T>(key: string, data: T): void => {
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error setting cache:', error)
  }
}

export const useYachts = (params?: PaginationParams) => {
  return useQuery<CharterhubYacht[], Error>({
    queryKey: ['yachts', params],
    queryFn: async () => {
      try {
        // First try to get cached data for immediate display
        const cached = getCache<CharterhubYacht[]>(CACHE_KEY)
        if (cached) {
          // Return cached data immediately
          console.log('Using cached yacht data')

          // Then fetch fresh data in the background
          wordpressService
            .getYachts(params?.page, params?.pageSize)
            .then((freshYachts) => {
              if (JSON.stringify(freshYachts) !== JSON.stringify(cached)) {
                setCache(CACHE_KEY, freshYachts)
                // Trigger a background update through React Query
                queryClient.setQueryData(['yachts', params], freshYachts)
              }
            })
            .catch(console.error)

          return cached
        }

        // If no cache, fetch with smaller page size initially
        const initialYachts = await wordpressService.getYachts(
          1,
          params?.pageSize || INITIAL_PAGE_SIZE
        )

        setCache(CACHE_KEY, initialYachts)

        // Then fetch the rest in the background if needed
        if (params?.pageSize && params.pageSize > INITIAL_PAGE_SIZE) {
          wordpressService
            .getYachts(1, params.pageSize)
            .then((allYachts) => {
              setCache(CACHE_KEY, allYachts)
              queryClient.setQueryData(['yachts', params], allYachts)
            })
            .catch(console.error)
        }

        return initialYachts
      } catch (error) {
        console.error('Error fetching yachts:', error)

        // Try to get data from cache as fallback
        const cached = getCache<CharterhubYacht[]>(CACHE_KEY)
        if (cached) {
          return cached
        }

        // Last resort: sample data
        return sampleDataService.getYachts()
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_DURATION,
    retry: 2,
  })
}

export const useYacht = (id: string) => {
  return useQuery<CharterhubYacht, Error>({
    queryKey: ['yacht', id],
    queryFn: async () => {
      try {
        // Try to get from WordPress
        const yacht = await wordpressService.getYacht(id)

        // Update individual yacht cache
        setCache(`wp_yacht_${id}_cache`, yacht)

        return yacht
      } catch (error) {
        console.log('Error fetching yacht:', error)

        // Try to get from cache
        const cached = getCache<CharterhubYacht>(`wp_yacht_${id}_cache`)
        if (cached) {
          console.log('Using cached yacht data')
          return cached
        }

        // Fall back to sample data if WordPress fails
        console.log('Falling back to sample yacht data')
        const yacht = await sampleDataService.getYachtById(id)
        if (!yacht) throw new Error(`Yacht with ID ${id} not found`)
        return yacht as CharterhubYacht
      }
    },
    staleTime: CACHE_DURATION,
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  })
}

export const useDestinations = (params?: PaginationParams) => {
  return useQuery<CharterhubDestination[], Error>({
    queryKey: ['destinations', params],
    queryFn: async () => {
      try {
        // First try to get cached data for immediate display
        const cached = getCache<CharterhubDestination[]>('wp_destinations_cache')
        if (cached && cached.length > 0) {
          // Return cached data immediately
          console.log('Using cached destinations data')

          // Then fetch fresh data in the background
          wordpressService
            .getDestinations(params?.page, params?.pageSize)
            .then((freshDestinations) => {
              // Only update if we got valid data back
              if (
                freshDestinations &&
                freshDestinations.length > 0 &&
                JSON.stringify(freshDestinations) !== JSON.stringify(cached)
              ) {
                setCache('wp_destinations_cache', freshDestinations)
                // Trigger a background update through React Query
                queryClient.setQueryData(['destinations', params], freshDestinations)
              }
            })
            .catch((error) => {
              console.warn('Background fetch failed:', error)
            })

          return cached
        }

        // If no cache or empty cache, fetch from API
        const destinations = await wordpressService.getDestinations(params?.page, params?.pageSize)

        // Only cache if we got valid data
        if (destinations && destinations.length > 0) {
          setCache('wp_destinations_cache', destinations)
        } else {
          console.warn('API returned no destinations')
        }

        // Return whatever the API gave us, even if empty
        return destinations
      } catch (error) {
        console.warn('Error in useDestinations:', error)

        // Try to get cached data as fallback
        const cached = getCache<CharterhubDestination[]>('wp_destinations_cache')
        if (cached && cached.length > 0) {
          console.log('Using cached destinations as fallback')
          return cached
        }

        // If everything fails, return empty array instead of throwing
        console.warn('No destinations available from API or cache')
        return []
      }
    },
    staleTime: STALE_TIME,
    gcTime: CACHE_DURATION,
    retry: 2, // Increase retries since this is important data
  })
}

export const useDestination = (id: string) => {
  return useQuery<CharterhubDestination, Error>({
    queryKey: ['destination', id],
    queryFn: async () => {
      try {
        // Try to get from WordPress
        return await wordpressService.getDestination(id)
      } catch (error) {
        console.log('Falling back to sample destination data:', error)
        // Fall back to sample data if WordPress fails
        const destination = await sampleDataService.getDestinationById(id)
        if (!destination) throw new Error(`Destination with ID ${id} not found`)
        return destination as CharterhubDestination
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
