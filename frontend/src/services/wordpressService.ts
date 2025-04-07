import axios, { AxiosInstance } from 'axios'
import { getApi } from './wpApi'
import { sampleDataService } from './sampleData'
import { localYachtsService } from './local/localYachtsService'
import { localDestinationsService } from './local/localDestinationsService'

/**
 * IMPORTANT: This service has been modified to use local database data instead of 
 * direct WordPress API calls. All methods now proxy to the local data services.
 * 
 * Direct WordPress API references have been removed for security and reliability.
 * The data structure remains compatible with previous usage.
 */

// Types
export interface PaginationParams {
  page?: number
  pageSize?: number
  per_page?: number
}

interface WordPressMedia {
  source_url: string
  media_details?: {
    sizes?: {
      full?: { source_url: string }
      large?: { source_url: string }
    }
  }
}

export interface WordPressYacht {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  slug: string
  excerpt: { rendered: string }
  modified: string
  link: string
  class_list?: string[]
  yoast_head_json?: { description: string }
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string
      media_details?: {
        sizes?: {
          full?: { source_url: string }
          large?: { source_url: string }
          medium_large?: { source_url: string }
        }
      }
    }>
    'wp:term'?: Array<
      Array<{
        id: number
        name: string
        taxonomy: string
      }>
    >
  }
  'charter-type'?: number[]
  destinations?: number[]
  acf: {
    specifications: any
    description: string
    name: string
    charter_detail__specs?: {
      specs__builder?: string
      specs__year?: string
      specs__lenght_ft?: string
      specs__length_m?: string
      specs__beam_ft?: string
      specs__beam_m?: string
      specs__cabin?: string
      specs__guests?: string
      specs__crew?: string
      specs__speed?: string
    }
    charter_detail__image_gallery?: Array<{ url: string }>
    charter_detail__toys_tenders?: {
      toys_tenders__toys?: Array<{ toy__name: string }>
      toys_tenders__tenders?: Array<{ tender__name: string }>
    }
    charter_detail__rate?: string
    charter_detail__rate_currency?: string
    charter_detail__description?: string
    charter_detail__banner_image?: {
      url: string
    }
  }
}

export interface WordPressDestination {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  slug: string
  excerpt: { rendered: string }
  modified: string
  _embedded?: {
    'wp:featuredmedia'?: WordPressMedia[]
  }
  acf: {
    description: string
    name: string
    destination_detail__description?: string
    destination_detail__highlights?: string[]
    destination_detail__best_time?: string
    destination_detail__climate?: string
    destination_detail__image_map?: {
      lat: number
      lng: number
    }
    destination_detail__banner_image?: {
      url: string
    }
    destination_detail__gallery?: Array<{
      url?: string
      source_url?: string
      sizes?: {
        full?: string
      }
      guid?: string
    }>
  }
}

export interface CharterhubYacht {
  id: string
  name: string
  description: string
  specifications: {
    length: string
    capacity: number
    crew: number
    builder?: string
    year?: number
    beam?: string
    cabins?: number
    cruisingSpeed?: number
    maxSpeed?: number
  }
  pricing?: {
    basePrice: number
    currency: string
  }
  featuredImage?: string
  additionalImages?: string[]
  toys?: string[]
  tenders?: string[]
  charterTypes?: number[]
  destinations?: number[]
  features?: {
    amenities: string[]
    waterToys: string[]
  }
  metadata?: {
    charterTypeNames: string[]
    destinationNames: string[]
    link: string
    modified: string
  }
}

export interface CharterhubDestination {
  id: string
  name: string
  description: string
  featuredImage?: string
  additionalImages?: string[]
  content?: string
  acf?: {
    description?: string
    highlights: string[]
    best_time?: string
    climate?: string
    latitude?: string
    longitude?: string
    image_gallery?: Array<{ url: string }>
    destination_detail__image_map?: {
      lat: number
      lng: number
    }
  }
}

export class WordPressService {
  private cache: Map<string, { data: any; timestamp: number }>
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly API_LIMIT = 100
  private callCount = 0
  private backgroundSync: boolean = false

  constructor() {
    // Initialize cache
    this.cache = new Map()

    // Bind methods to ensure correct 'this' context
    this.transformYacht = this.transformYacht.bind(this)
    this.transformDestination = this.transformDestination.bind(this)
    this.decodeHtmlEntities = this.decodeHtmlEntities.bind(this)
    this.setCache = this.setCache.bind(this)
    this.getCache = this.getCache.bind(this)

    // Initialize service
    this.loadCacheFromStorage()
    this.startCallCountReset()
    this.startBackgroundSync()
    
    console.log('WordPressService initialized (USING LOCAL DATABASE, NOT WORDPRESS API)')
  }

  private shouldInvalidateCache(timestamp: number): boolean {
    const now = Date.now()
    const age = now - timestamp
    return age > this.CACHE_DURATION
  }

  private clearExpiredCache() {
    const now = Date.now()

    // Clear expired items from memory cache
    for (const [key, value] of this.cache.entries()) {
      if (this.shouldInvalidateCache(value.timestamp)) {
        this.cache.delete(key)
      }
    }

    // Clear expired items from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('wp_')) {
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '')
          if (this.shouldInvalidateCache(stored.timestamp)) {
            localStorage.removeItem(key)
            console.log(`Cleared expired cache for ${key}`)
          }
        } catch (error) {
          // If we can't parse the cache entry, remove it
          localStorage.removeItem(key)
        }
      }
    })
  }

  private loadCacheFromStorage() {
    try {
      this.clearExpiredCache() // Only clear expired items

      // Load yachts with validation
      const storedYachts = localStorage.getItem('wp_yachts_cache')
      if (storedYachts) {
        try {
          const parsed = JSON.parse(storedYachts)
          if (!this.shouldInvalidateCache(parsed.timestamp)) {
            const data = Array.isArray(parsed.data) ? parsed.data : []
            this.cache.set('yachts', { data, timestamp: parsed.timestamp })
            console.log('Loaded valid yachts cache:', data.length, 'items')
          } else {
            console.log('Yachts cache expired, will fetch fresh data')
          }
        } catch (error) {
          console.error('Error parsing yachts cache:', error)
        }
      }

      // Load destinations with validation
      const storedDestinations = localStorage.getItem('wp_destinations_cache')
      if (storedDestinations) {
        try {
          const parsed = JSON.parse(storedDestinations)
          if (!this.shouldInvalidateCache(parsed.timestamp)) {
            const data = Array.isArray(parsed.data) ? parsed.data : []
            this.cache.set('destinations', { data, timestamp: parsed.timestamp })
            console.log('Loaded valid destinations cache:', data.length, 'items')
          } else {
            console.log('Destinations cache expired, will fetch fresh data')
          }
        } catch (error) {
          console.error('Error parsing destinations cache:', error)
        }
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error)
    }
  }

  private saveToStorage(key: string, value: any) {
    try {
      const isArrayType = key.includes('yachts') || key.includes('destinations')
      const data = isArrayType && !Array.isArray(value.data) ? [] : value.data
      const timestamp = value.timestamp || Date.now()

      // Save to localStorage
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp,
        })
      )

      // Also update memory cache
      this.cache.set(key.replace('wp_', '').replace('_cache', ''), { data, timestamp })

      console.log(`Saved ${key} to storage:`, data.length, 'items')
    } catch (error) {
      console.error('Error saving to storage:', error)
    }
  }

  private async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      page?: number
      pageSize?: number
      transform?: (data: T) => any
    } = {}
  ): Promise<T> {
    const { page = 1, pageSize = this.API_LIMIT, transform } = options
    const cacheKey = `${key}_${page}_${pageSize}`

    try {
      // Check memory cache first
      const cached = this.cache.get(cacheKey)
      if (cached && !this.shouldInvalidateCache(cached.timestamp)) {
        console.log(`Using memory cache for ${cacheKey}`)
        return cached.data
      }

      // Check localStorage cache
      const stored = localStorage.getItem(`wp_${cacheKey}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (!this.shouldInvalidateCache(parsed.timestamp)) {
          console.log(`Using localStorage cache for ${cacheKey}`)
          this.cache.set(cacheKey, parsed)
          return parsed.data
        }
      }

      // Implement rate limiting
      if (this.callCount >= this.API_LIMIT) {
        throw new Error('API rate limit reached')
      }
      this.callCount++

      // Fetch fresh data
      console.log(`Fetching fresh data for ${cacheKey}`)
      const data = await fetchFn()
      const transformedData = transform ? transform(data) : data

      // Save to cache with timestamp
      const cacheData = {
        data: transformedData,
        timestamp: Date.now(),
      }

      this.cache.set(cacheKey, cacheData)
      localStorage.setItem(`wp_${cacheKey}`, JSON.stringify(cacheData))

      return transformedData
    } catch (error) {
      console.error(`Error fetching ${key}:`, error)

      // Try to return cached data even if expired in case of error
      const cached = this.cache.get(cacheKey)
      if (cached) {
        console.log(`Using expired memory cache for ${cacheKey} due to error`)
        return cached.data
      }

      const stored = localStorage.getItem(`wp_${cacheKey}`)
      if (stored) {
        console.log(`Using expired localStorage cache for ${cacheKey} due to error`)
        const parsed = JSON.parse(stored)
        return parsed.data
      }

      throw error
    }
  }

  private decodeHtmlEntities = (text: string): string => {
    if (!text) return ''
    try {
      const textarea = document.createElement('textarea')
      textarea.innerHTML = text
      return textarea.value
    } catch (error) {
      console.error('Error decoding HTML entities:', error)
      return text
    }
  }

  private extractSpecifications(content: string): any {
    const specs: any = {}

    // Define patterns for Bricks Builder HTML structure
    const bricksPatterns = {
      builder: {
        label:
          /<strong>Builder:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value:
          /<div[^>]*class="brxe-text">[^<]*<p>([^<]+)<\/p>[^<]*<\/div>[^<]*(?:<div[^>]*class="brxe-block"|$)/i,
      },
      length: {
        label:
          /<strong>Length:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d+(?:\.\d+)?)\s*m/i,
      },
      beam: {
        label:
          /<strong>Beam:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d+(?:\.\d+)?)\s*m/i,
      },
      guests: {
        label:
          /<strong>Guests:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d+)/i,
      },
      crew: {
        label:
          /<strong>Crew:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d+)/i,
      },
      cabins: {
        label:
          /<strong>Cabins:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d+)/i,
      },
      year: {
        label:
          /<strong>Year:<\/strong>[^<]*<\/p>[^<]*<\/div>[^<]*<div[^>]*class="brxe-text">[^<]*<p>([^<]+)/i,
        value: /<div[^>]*class="brxe-text">[^<]*<p>(\d{4})/i,
      },
    }

    // Extract specifications from Bricks Builder HTML
    Object.entries(bricksPatterns).forEach(([key, patterns]) => {
      const labelMatch = content.match(patterns.label)
      const valueMatch = content.match(patterns.value)

      if (labelMatch && valueMatch) {
        const value = valueMatch[1].trim()
        switch (key) {
          case 'builder':
            specs[key] = value
            break
          case 'length':
          case 'beam':
            specs[key] = value.includes('m') ? value : `${value}m`
            break
          case 'guests':
          case 'crew':
          case 'cabins':
          case 'year':
            const numValue = parseInt(value)
            if (!isNaN(numValue)) {
              specs[key] = numValue
            }
            break
        }
      }
    })

    // Log extracted specifications for debugging
    console.log('Extracted specifications from Bricks Builder:', specs)

    return specs
  }

  private transformYacht(wpYacht: WordPressYacht): CharterhubYacht {
    try {
      // Get featured image with enhanced fallback handling
      const featuredMedia = wpYacht._embedded?.['wp:featuredmedia']?.[0]
      const featuredImage =
        featuredMedia?.media_details?.sizes?.full?.source_url ||
        featuredMedia?.media_details?.sizes?.large?.source_url ||
        featuredMedia?.media_details?.sizes?.medium_large?.source_url ||
        featuredMedia?.source_url ||
        wpYacht.acf?.charter_detail__banner_image?.url ||
        undefined

      // Get additional images with enhanced error handling
      const additionalImages: string[] = []

      // Add gallery images
      if (Array.isArray(wpYacht.acf?.charter_detail__image_gallery)) {
        wpYacht.acf.charter_detail__image_gallery.forEach((img: any) => {
          const imgUrl = img?.url || img?.source_url || img?.guid?.rendered
          if (imgUrl && typeof imgUrl === 'string') {
            additionalImages.push(imgUrl)
          }
        })
      }

      // Add banner image if not used as featured
      if (
        wpYacht.acf?.charter_detail__banner_image?.url &&
        wpYacht.acf.charter_detail__banner_image.url !== featuredImage
      ) {
        additionalImages.push(wpYacht.acf.charter_detail__banner_image.url)
      }

      // Get toys and tenders with proper type checking
      const toysAndTenders = wpYacht.acf?.charter_detail__toys_tenders || {}
      const toysList: string[] = []
      const tendersList: string[] = []

      if (Array.isArray(toysAndTenders.toys_tenders__toys)) {
        toysAndTenders.toys_tenders__toys.forEach((toy: { toy__name?: string }) => {
          if (toy?.toy__name) {
            toysList.push(toy.toy__name)
          }
        })
      }

      if (Array.isArray(toysAndTenders.toys_tenders__tenders)) {
        toysAndTenders.toys_tenders__tenders.forEach((tender: { tender__name?: string }) => {
          if (tender?.tender__name) {
            tendersList.push(tender.tender__name)
          }
        })
      }

      // Get specifications with proper type conversion and fallbacks
      const specs = wpYacht.acf?.charter_detail__specs || {}
      const specifications = {
        length: specs.specs__lenght_ft || specs.specs__length_m || 'N/A',
        capacity: parseInt(specs.specs__guests || '0', 10) || 0,
        crew: parseInt(specs.specs__crew || '0', 10) || 0,
        builder: specs.specs__builder || undefined,
        year: parseInt(specs.specs__year || '', 10) || undefined,
        beam: specs.specs__beam_ft || specs.specs__beam_m || undefined,
        cabins: parseInt(specs.specs__cabin || '', 10) || undefined,
        cruisingSpeed: specs.specs__speed ? parseFloat(specs.specs__speed) : undefined,
        maxSpeed: specs.specs__speed ? parseFloat(specs.specs__speed) : undefined,
      }

      // Get charter types and destinations with proper error handling
      const charterTypes = Array.isArray(wpYacht['charter-type']) ? wpYacht['charter-type'] : []
      const destinations = Array.isArray(wpYacht.destinations) ? wpYacht.destinations : []

      // Get names from embedded terms with HTML entity decoding
      const terms = wpYacht._embedded?.['wp:term'] || []
      const charterTypeNames = terms[0]?.map((term) => this.decodeHtmlEntities(term.name)) || []
      const destinationNames = terms[1]?.map((term) => this.decodeHtmlEntities(term.name)) || []

      // Return transformed yacht with all necessary fields
      return {
        id: wpYacht.id.toString(),
        name: this.decodeHtmlEntities(wpYacht.title?.rendered || wpYacht.acf?.name || ''),
        description: wpYacht.acf?.charter_detail__description || wpYacht.content?.rendered || '',
        specifications,
        pricing: {
          basePrice: parseFloat(wpYacht.acf?.charter_detail__rate || '0') || 0,
          currency: wpYacht.acf?.charter_detail__rate_currency || 'USD',
        },
        featuredImage,
        additionalImages,
        toys: toysList,
        tenders: tendersList,
        charterTypes,
        destinations,
        features: {
          amenities: [],
          waterToys: [],
        },
        metadata: {
          charterTypeNames,
          destinationNames,
          link: wpYacht.link || '',
          modified: wpYacht.modified || new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error('Error transforming yacht data:', error)
      // Return a minimal valid yacht object instead of throwing
      return {
        id: wpYacht.id?.toString() || '0',
        name: wpYacht.title?.rendered || 'Unknown Yacht',
        description: '',
        specifications: {
          length: 'N/A',
          capacity: 0,
          crew: 0,
        },
        pricing: {
          basePrice: 0,
          currency: 'USD',
        },
      }
    }
  }

  private transformDestination(wpDestination: WordPressDestination): CharterhubDestination {
    // Debug log for raw data
    console.log('Raw destination data:', wpDestination)

    // Get featured image from _embedded or ACF banner image
    const featuredImage =
      wpDestination._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
      wpDestination.acf?.destination_detail__banner_image?.url ||
      undefined

    // Get additional images from ACF gallery
    const additionalImages: string[] = []
    if (wpDestination.acf?.destination_detail__gallery) {
      wpDestination.acf.destination_detail__gallery.forEach((img: { url?: string | null }) => {
        if (img.url) {
          additionalImages.push(img.url)
        }
      })
    }

    // Debug log for images
    console.log('Destination images:', {
      featuredImage,
      additionalImages,
      rawGallery: wpDestination.acf?.destination_detail__gallery,
    })

    // Get coordinates from ACF map or use default coordinates based on location name
    let coordinates: { lat: number; lng: number } = wpDestination.acf
      ?.destination_detail__image_map || { lat: 0, lng: 0 }

    // If no coordinates are provided, use defaults based on location name
    if (!coordinates.lat || !coordinates.lng) {
      const locationName = wpDestination.title.rendered.toLowerCase()
      const defaultCoordinates: Record<string, { lat: number; lng: number }> = {
        caribbean: { lat: 18.2208, lng: -66.5901 }, // Puerto Rico center
        mediterranean: { lat: 41.202, lng: 6.6466 },
        bahamas: { lat: 24.7136, lng: -78.0 },
        greece: { lat: 37.9838, lng: 23.7275 },
        croatia: { lat: 43.5081, lng: 16.4402 },
        italy: { lat: 41.9028, lng: 12.4964 },
        france: { lat: 43.2965, lng: 5.3698 }, // Marseille
        spain: { lat: 39.5696, lng: 2.6502 }, // Mallorca
        turkey: { lat: 36.8969, lng: 30.7133 }, // Antalya
        maldives: { lat: 3.2028, lng: 73.2207 },
      }

      coordinates = defaultCoordinates[locationName] || { lat: 25.7617, lng: -80.1918 } // Miami as last resort
    }

    // Debug log for coordinates
    console.log('Destination coordinates:', {
      rawLatitude: coordinates?.lat,
      rawLongitude: coordinates?.lng,
      locationName: wpDestination.title.rendered,
    })

    // Format ID to match the expected format (destination-XXX)
    const formattedId = wpDestination.id.toString().padStart(3, '0')
    const destinationId = `destination-${formattedId}`

    return {
      id: destinationId,
      name: wpDestination.title.rendered,
      description:
        wpDestination.acf?.destination_detail__description || wpDestination.content?.rendered || '',
      featuredImage,
      additionalImages,
      acf: {
        description: wpDestination.acf?.destination_detail__description || '',
        highlights: wpDestination.acf?.destination_detail__highlights || [],
        best_time: wpDestination.acf?.destination_detail__best_time || '',
        climate: wpDestination.acf?.destination_detail__climate || '',
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString(),
        image_gallery: additionalImages.map((url) => ({ url })),
        destination_detail__image_map: coordinates,
      },
    }
  }

  private async fetchBricksTemplate(templateId: number): Promise<string> {
    try {
      // Try the bricks_posts endpoint first
      const api = getApi('/bricks/v1/render_template')
      const response = await api.get(`/bricks/v1/render_template`, {
        params: {
          id: templateId,
        },
      })
      return response.data?.rendered || ''
    } catch (error) {
      console.error(`Error fetching Bricks template ${templateId}:`, error)
      return ''
    }
  }

  private async fetchYachtDetails(yachtId: number): Promise<any> {
    try {
      // Try to fetch ACF fields directly
      const api = getApi(`/acf/v3/yacht/${yachtId}`)
      const response = await api.get(`/acf/v3/yacht/${yachtId}`)
      console.log(`ACF fields for yacht ${yachtId}:`, response.data)
      return response.data?.acf || {}
    } catch (error) {
      console.error(`Error fetching ACF fields for yacht ${yachtId}:`, error)
      return {}
    }
  }

  private async optimisticUpdate<T>(
    key: string,
    page: number,
    pageSize: number,
    fetchFn: () => Promise<T>,
    transform: (data: T) => any
  ) {
    const cacheKey = pageSize === 1 ? `${key}_${page}` : `${key}_${page}_${pageSize}`

    // Return cached data immediately
    const cached = this.cache.get(cacheKey)
    if (cached && !this.shouldInvalidateCache(cached.timestamp)) {
      console.log(`Using memory cache for ${cacheKey}`)
      return cached.data
    }

    // Try localStorage
    const stored = localStorage.getItem(`wp_${cacheKey}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (!this.shouldInvalidateCache(parsed.timestamp)) {
          console.log(`Using localStorage cache for ${cacheKey}`)
          this.cache.set(cacheKey, parsed)
          return parsed.data
        }
      } catch (error) {
        console.error(`Error parsing cache for ${cacheKey}:`, error)
      }
    }

    // Fetch in background
    try {
      const data = await fetchFn()
      const transformedData = transform(data)

      const cacheData = {
        data: transformedData,
        timestamp: Date.now(),
      }

      this.cache.set(cacheKey, cacheData)
      localStorage.setItem(`wp_${cacheKey}`, JSON.stringify(cacheData))

      return transformedData
    } catch (error) {
      console.error(`Background fetch failed for ${key}:`, error)

      // Return empty array/null for failed fetches
      return pageSize === 1 ? null : []
    }
  }

  // Modified to use local data services
  async getYachts(
    page: number = 1,
    pageSize: number = this.API_LIMIT
  ): Promise<CharterhubYacht[]> {
    console.log('getYachts called - Using local database data')
    
    try {
      // Get data from local yacht service
      const yachts = await localYachtsService.getYachts()
      
      // Apply pagination if needed
      if (page && pageSize) {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return yachts.slice(start, end)
      }
      
      return yachts
    } catch (error) {
      console.warn('Error fetching yachts from local database:', error)
      
      // Try to get from cache first
      const cached = this.getCache<CharterhubYacht[]>('yachts')
      if (cached && cached.length > 0) {
        return cached
      }
      
      // If no cache, fall back to sample data
      console.log('Falling back to sample yacht data')
      return sampleDataService.getYachts()
    }
  }

  async getYacht(id: string): Promise<CharterhubYacht> {
    console.log(`getYacht called for ID: ${id} - Using local database data`)
    
    try {
      // Get data from local yacht service
      const yacht = await localYachtsService.getYachtById(id)
      
      if (!yacht) {
        throw new Error(`Yacht with ID ${id} not found in local database`)
      }
      
      return yacht
    } catch (error) {
      console.warn('Error fetching yacht from local database:', error)
      
      // Try to get from cache first
      const cached = this.getCache<CharterhubYacht>(`yacht_${id}`)
      if (cached) {
        return cached
      }
      
      // If no cache, fall back to sample data
      console.log('Falling back to sample yacht data')
      const sampleYacht = await sampleDataService.getYachtById(id)
      if (!sampleYacht) {
        throw new Error(`Yacht with ID ${id} not found`)
      }
      return sampleYacht
    }
  }

  async getDestinations(
    page: number = 1,
    pageSize: number = this.API_LIMIT
  ): Promise<CharterhubDestination[]> {
    console.log('getDestinations called - Using local database data')
    
    try {
      // Get data from local destination service
      const destinations = await localDestinationsService.getDestinations()
      
      // Apply pagination if needed
      if (page && pageSize) {
        const start = (page - 1) * pageSize
        const end = start + pageSize
        return destinations.slice(start, end)
      }
      
      return destinations
    } catch (error) {
      console.warn('Error fetching destinations from local database:', error)
      
      // Try to get from cache first
      const cached = this.getCache<CharterhubDestination[]>('destinations')
      if (cached && cached.length > 0) {
        return cached
      }
      
      // If no cache, return empty array
      console.warn('No destinations available from local database or cache')
      return []
    }
  }

  async getDestination(id: string): Promise<CharterhubDestination> {
    console.log(`getDestination called for ID: ${id} - Using local database data`)
    
    try {
      // Get data from local destination service
      const destination = await localDestinationsService.getDestinationById(id)
      
      if (!destination) {
        throw new Error(`Destination with ID ${id} not found in local database`)
      }
      
      return destination
    } catch (error) {
      console.warn('Error fetching destination from local database:', error)
      
      // Try to get from cache first
      const cached = this.getCache<CharterhubDestination>(`destination_${id}`)
      if (cached) {
        return cached
      }
      
      // If no cache, fall back to sample data
      console.log('Falling back to sample destination data')
      const sampleDestination = await sampleDataService.getDestinationById(id)
      if (!sampleDestination) {
        throw new Error(`Destination with ID ${id} not found`)
      }
      return sampleDestination
    }
  }

  async getYachtACFFields(yachtId: number): Promise<any> {
    console.log(`getYachtACFFields called for ID: ${yachtId} - Local database does not support ACF fields`)
    return {}
  }

  async getDestinationACFFields(destinationId: number): Promise<any> {
    console.log(`getDestinationACFFields called for ID: ${destinationId} - Local database does not support ACF fields`)
    return {}
  }

  async renderBricksTemplate(templateId: number, contentId: number): Promise<string> {
    console.log(`renderBricksTemplate called - Local database does not support Bricks templates`)
    return ''
  }

  // Reset API call counter periodically
  private resetCallCount() {
    this.callCount = 0
  }

  // Call this method when component mounts
  startCallCountReset() {
    // Reset call count every hour
    setInterval(() => this.resetCallCount(), 60 * 60 * 1000)
  }

  private startBackgroundSync() {
    // Disabled as we're now using local database
    this.backgroundSync = false
  }

  private setCache = <T>(key: string, value: T): void => {
    try {
      this.cache.set(key, {
        data: value,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  private getCache = <T>(key: string): T | null => {
    try {
      const cached = this.cache.get(key)
      if (!cached) return null

      const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION
      if (isExpired) {
        this.cache.delete(key)
        return null
      }

      return cached.data as T
    } catch (error) {
      console.error('Error getting cache:', error)
      return null
    }
  }
}

// Export singleton instance
export const wordpressService = new WordPressService()
