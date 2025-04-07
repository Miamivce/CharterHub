import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, Button, ImageWithFallback } from '@/components/shared'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { destinationService } from '@/services/destinationService'
import { Destination } from '@/types/destination'

declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export function DestinationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [destination, setDestination] = useState<Destination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchDestination = async () => {
      if (!id) return
      
      try {
        setIsLoading(true)
        const data = await destinationService.getDestinationById(id)
        setDestination(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load destination'))
        console.error('Error fetching destination:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDestination()
  }, [id])

  // Debug logging
  useEffect(() => {
    if (destination) {
      console.log('Destination data:', destination)
      console.log('Google Maps API Key:', GOOGLE_MAPS_API_KEY)
    }
  }, [destination])

  // Add HTML entity decoder function
  const decodeHtmlEntities = (text: string) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  useEffect(() => {
    if (!destination || !mapRef.current) return

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing. Check .env file.')
      setMapError('Google Maps API key is not configured')
      return
    }

    // Function to initialize Google Maps
    const initializeMap = () => {
      try {
        if (!mapRef.current || !destination) {
          setMapError('Invalid map data')
          return
        }

        // Get coordinates or use default
        // Since we're not using ACF anymore, this would need to be adapted to your data structure
        const mapCoordinates = {
          lat: 25.7617, // Default to Miami
          lng: -80.1918,
        }

        console.log('Using map coordinates:', mapCoordinates)

        // Initialize the map
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: mapCoordinates,
          zoom: 7,
          mapTypeId: 'hybrid',
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          },
        })

        // Add a marker
        new window.google.maps.Marker({
          position: mapCoordinates,
          map: googleMapRef.current,
          title: destination.name,
        })
      } catch (error) {
        console.error('Error initializing Google Maps:', error)
        setMapError('Failed to initialize map')
      }
    }

    // Define initMap in the window scope for the callback
    window.initMap = initializeMap

    // Function to load the Google Maps script
    const loadGoogleMapsScript = () => {
      // First remove any existing script to prevent duplicates
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.remove()
      }

      // Create a new script element using Google's recommended loading pattern
      // See: https://goo.gle/js-api-loading
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&loading=async`
      script.async = true
      script.defer = true

      // Handle script loading error
      script.onerror = (error) => {
        console.error('Failed to load Google Maps script:', error)
        setMapError('Failed to load Google Maps. Please check your internet connection.')
      }

      // Add the script to the page
      document.head.appendChild(script)
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
    } else {
      // Set a loading message
      setMapError('Loading Google Maps...')
      loadGoogleMapsScript()
    }

    // Cleanup function
    return () => {
      if (window.initMap) {
        // @ts-ignore - We know this exists because we created it
        delete window.initMap
      }
    }
  }, [destination])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !destination) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="p-4 text-red-700">Error: {error?.message || 'Destination not found'}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/destinations')}
          className="flex items-center space-x-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          <span>Back to Destinations</span>
        </Button>
      </div>

      {/* Hero Image */}
      <div className="relative h-[400px] rounded-lg overflow-hidden">
        <ImageWithFallback
          src={
            destination.featuredImage ||
            `https://source.unsplash.com/featured/1600x900?${encodeURIComponent(decodeHtmlEntities(destination.name.toLowerCase()))}`
          }
          alt={decodeHtmlEntities(destination.name)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <h1 className="text-4xl font-bold text-white">{decodeHtmlEntities(destination.name)}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Description */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              About {decodeHtmlEntities(destination.name)}
            </h2>
            <div className="prose prose-sm max-w-none">
              <p>{destination.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Location</h2>
            <div
              ref={mapRef}
              style={{ height: '400px', width: '100%' }}
              className="bg-gray-200 rounded-lg"
            >
              {mapError && (
                <div className="flex justify-center items-center h-full text-gray-500">
                  {mapError}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Best Time to Visit */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Best Time to Visit</h3>
            <p>{destination.bestTimeToVisit}</p>
          </CardContent>
        </Card>

        {/* Climate */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Climate</h3>
            <p>{destination.climate}</p>
          </CardContent>
        </Card>

        {/* Regions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Popular Regions</h3>
            <ul className="list-disc pl-5 space-y-1">
              {destination.regions?.map((region, index) => (
                <li key={index}>{region}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {destination.highlights?.map((highlight, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-100 shadow-sm"
              >
                <p>{highlight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Image viewer for selected image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
          <img
            src={selectedImage}
            alt="Destination"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}
    </div>
  )
}
