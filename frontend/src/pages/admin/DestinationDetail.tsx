import { useParams, useNavigate } from 'react-router-dom'
import { useLocalDestination } from '@/hooks/useLocalData'
import { Card, CardContent, Button, ImageWithFallback } from '@/components/shared'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'

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
  
  // Get destination from local database
  const { 
    data: destination, 
    isLoading, 
    error 
  } = useLocalDestination(id || '')
  
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const [mapError, setMapError] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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

        // Get coordinates from destination or use default
        const mapCoordinates = destination.acf?.destination_detail__image_map
          ? {
              lat: Number(destination.acf.destination_detail__image_map.lat),
              lng: Number(destination.acf.destination_detail__image_map.lng),
            }
          : {
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

  console.log('Rendering destination:', {
    description: destination.description,
    acfDescription: destination.acf?.description,
    content: destination.content,
    imageGallery: destination.acf?.image_gallery,
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/admin/destinations')}
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
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html:
                  destination.acf?.description ||
                  destination.content ||
                  destination.description ||
                  '',
              }}
            />
          </CardContent>
        </Card>

        {/* Image Gallery */}
        {destination.acf?.image_gallery && destination.acf.image_gallery.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Gallery</h2>
              <div className="grid grid-cols-3 gap-4">
                {destination.acf?.image_gallery?.slice(0, 6).map((image: any, index: number) => {
                  const imageUrl = typeof image === 'string' ? image : image.url || image.source_url
                  return (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <ImageWithFallback
                        src={imageUrl}
                        alt={`${decodeHtmlEntities(destination.name)} - Image ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )
                })}
                {/* Add placeholder blocks if there are fewer than 6 images */}
                {destination.acf?.image_gallery &&
                  Array.from({ length: Math.max(0, 6 - destination.acf.image_gallery.length) }).map(
                    (_, index) => (
                      <div
                        key={`placeholder-${index}`}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
                      >
                        <span className="text-gray-400">No image</span>
                      </div>
                    )
                  )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Width Map */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Location</h2>
          {mapError ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 mb-4">
              {mapError}
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-[400px] rounded-lg overflow-hidden" />
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <Button
              variant="secondary"
              className="absolute top-4 right-4 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <XMarkIcon className="h-6 w-6" />
            </Button>
            <ImageWithFallback
              src={selectedImage}
              alt="Selected destination image"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
