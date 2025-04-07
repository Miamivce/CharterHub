import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, ImageWithFallback } from '@/components/shared'
import { Spinner } from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import { destinationService } from '@/services/destinationService'
import { Destination } from '@/types/destination'

// Add HTML entity decoder function
const decodeHtmlEntities = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

export function Destinations() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setIsLoading(true)
        const data = await destinationService.getDestinations()
        setDestinations(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load destinations'))
        console.error('Error fetching destinations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDestinations()
  }, [])

  // Create a seeded random order that changes daily
  const randomizedDestinations = useMemo(() => {
    if (!destinations.length) return []
    const today = new Date().toISOString().split('T')[0] // Use date as seed
    let seedValue = Array.from(today).reduce((acc, char) => acc + char.charCodeAt(0), 0)

    return [...destinations].sort(() => {
      const x = Math.sin(seedValue++) * 10000
      return x - Math.floor(x)
    })
  }, [destinations])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="p-4 text-red-700">Error: {error.message}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center items-center">
        <h1 className="text-2xl font-bold">Destinations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {randomizedDestinations?.map((destination) => (
          <Card
            key={destination.id}
            className="overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] border-primary/10"
            onClick={() => navigate(`/destinations/${destination.id}`)}
          >
            <div className="aspect-w-16 aspect-h-9">
              <ImageWithFallback
                src={
                  destination.featuredImage ||
                  `https://source.unsplash.com/featured/800x450?${destination.name.toLowerCase()}&${destination.id}`
                }
                alt={destination.name}
                className="w-full h-full object-cover rounded-t-lg"
                type="destination"
              />
            </div>
            <CardContent className="p-4 pb-1.5">
              <h3 className="text-xl font-semibold text-gray-900 mt-1 text-center">
                {decodeHtmlEntities(destination.name)}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
