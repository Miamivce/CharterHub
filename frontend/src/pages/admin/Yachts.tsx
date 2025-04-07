import { useLocalYachts } from '@/hooks/useLocalData'
import { Card, CardContent, Button, ImageWithFallback } from '@/components/shared'
import { Spinner } from '@/components/ui/Spinner'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export function Yachts() {
  const navigate = useNavigate()
  
  // Get data from local database
  const { 
    data: yachts, 
    isLoading, 
    error 
  } = useLocalYachts()

  // Create a seeded random order that changes daily
  const randomizedYachts = useMemo(() => {
    if (!yachts || yachts.length === 0) return []
    const today = new Date().toISOString().split('T')[0] // Use date as seed
    let seedValue = Array.from(today).reduce((acc, char) => acc + char.charCodeAt(0), 0)

    return [...yachts].sort(() => {
      const x = Math.sin(seedValue++) * 10000
      return x - Math.floor(x)
    })
  }, [yachts])

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Yachts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {randomizedYachts?.map((yacht) => (
          <Card
            key={yacht.id}
            className="overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] border-orange-100/50"
            onClick={() => navigate(`${yacht.id}`)}
          >
            <div className="flex flex-row h-64">
              <div className="w-1/2">
                {yacht.featuredImage && (
                  <ImageWithFallback
                    src={yacht.featuredImage}
                    alt={yacht.name}
                    className="w-full h-full object-cover rounded-l-lg"
                    type="yacht"
                  />
                )}
              </div>
              <CardContent className="w-1/2 pt-2 px-6 pb-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 text-center">{yacht.name}</h3>
                  <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Builder:</span>{' '}
                      {yacht.specifications.builder && yacht.specifications.builder !== yacht.name
                        ? yacht.specifications.builder
                        : 'Custom'}
                    </p>
                    {yacht.specifications.year && (
                      <p>
                        <span className="font-medium">Year:</span> {yacht.specifications.year}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Length:</span> {yacht.specifications.length}
                    </p>
                    <p>
                      <span className="font-medium">Guests:</span> {yacht.specifications.capacity}
                    </p>
                    <p>
                      <span className="font-medium">Crew:</span> {yacht.specifications.crew}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center mt-3">
                  <Button
                    variant="secondary"
                    className="w-full flex items-center justify-center space-x-2 py-1.5"
                    onClick={(e) => {
                      e.stopPropagation() // Prevent card click
                      navigate(`${yacht.id}`)
                    }}
                  >
                    <span>More information</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Add See All button */}
      <div className="mt-8 flex justify-center">
        <a
          href="https://yachtstory.com/charter/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
        >
          See All Yachts on yachtstory.com
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
