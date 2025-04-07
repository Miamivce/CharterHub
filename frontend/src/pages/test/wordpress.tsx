import { useYachts, useDestinations } from '@/hooks/useWordPress'
import { getErrorMessage } from '@/utils/wordpressErrors'
import { Spinner } from '@/components/ui/Spinner'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'

export default function WordPressTestPage() {
  const {
    data: yachts,
    isLoading: yachtsLoading,
    error: yachtsError,
    refetch: refetchYachts,
  } = useYachts()

  const {
    data: destinations,
    isLoading: destinationsLoading,
    error: destinationsError,
    refetch: refetchDestinations,
  } = useDestinations()

  const handleRefresh = () => {
    refetchYachts()
    refetchDestinations()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="WordPress Integration Test"
          description="Test page for WordPress yacht and destination data integration"
          action={
            <Button onClick={handleRefresh} variant="outline">
              Refresh Data
            </Button>
          }
        />

        {/* Yachts Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Yachts</h2>

          {yachtsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : yachtsError ? (
            <Card className="bg-red-50 border-red-200">
              <div className="p-4 text-red-700">Error: {getErrorMessage(yachtsError)}</div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {yachts?.map((yacht) => (
                <Card key={yacht.id} className="overflow-hidden">
                  {yacht.featuredImage && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={yacht.featuredImage}
                        alt={yacht.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{yacht.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Builder:</span> {yacht.specifications.builder}
                      </p>
                      <p>
                        <span className="font-medium">Year:</span> {yacht.specifications.year}
                      </p>
                      <p>
                        <span className="font-medium">Length:</span> {yacht.specifications.length}m
                      </p>
                      <p>
                        <span className="font-medium">Beam:</span> {yacht.specifications.beam}m
                      </p>
                      <p>
                        <span className="font-medium">Cabins:</span> {yacht.specifications.cabins}
                      </p>
                      <div className="flex items-center justify-between my-1">
                        <span className="font-medium">Guests:</span> {yacht.specifications.capacity}
                      </div>
                      <p>
                        <span className="font-medium">Crew:</span> {yacht.specifications.crew}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Destinations Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Destinations</h2>

          {destinationsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : destinationsError ? (
            <Card className="bg-red-50 border-red-200">
              <div className="p-4 text-red-700">Error: {getErrorMessage(destinationsError)}</div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations?.map((destination) => (
                <Card key={destination.id} className="overflow-hidden">
                  {destination.featuredImage && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={destination.featuredImage}
                        alt={destination.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{destination.name}</h3>
                    <div
                      className="prose prose-sm max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{ __html: destination.description }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
