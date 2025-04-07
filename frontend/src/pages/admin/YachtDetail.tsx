import { useParams, useNavigate } from 'react-router-dom'
import { useLocalYacht } from '@/hooks/useLocalData'
import { Card, CardContent, Button, ImageWithFallback } from '@/components/shared'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export function YachtDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Use only local database data
  const { 
    data: yacht, 
    isLoading, 
    error
  } = useLocalYacht(id || '')

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !yacht) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="p-4 text-red-700">Error: {error?.message || 'Yacht not found'}</div>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/yachts')}
          className="flex items-center space-x-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
          <span>Back to Yachts</span>
        </Button>
        <h1 className="text-2xl font-bold">{yacht.name}</h1>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {/* Featured Image */}
        <div className="col-span-1">
          <ImageWithFallback
            src={yacht.featuredImage || '/images/Sasta-YachtShot-H022.jpg'}
            alt={yacht.name}
            className="w-full h-64 object-cover rounded-lg"
            type="yacht"
          />
        </div>

        {/* Additional Images */}
        {yacht.additionalImages && yacht.additionalImages.length > 0
          ? // Filter out any images that match the featured image URL
            yacht.additionalImages
              .filter((img) => img !== yacht.featuredImage)
              .slice(0, 2)
              .map((image, index) => (
                <div key={index} className="col-span-1">
                  <ImageWithFallback
                    src={image}
                    alt={`${yacht.name} - Additional View ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                    type="yacht"
                  />
                </div>
              ))
          : null}

        {/* Placeholder blocks for missing images */}
        {(!yacht.additionalImages || yacht.additionalImages.length === 0) && (
          <>
            <div className="col-span-1 bg-gray-100 rounded-lg flex items-center justify-center h-64">
              <span className="text-gray-400">No additional image</span>
            </div>
            <div className="col-span-1 bg-gray-100 rounded-lg flex items-center justify-center h-64">
              <span className="text-gray-400">No additional image</span>
            </div>
          </>
        )}
        {yacht.additionalImages && yacht.additionalImages.length === 1 && (
          <div className="col-span-1 bg-gray-100 rounded-lg flex items-center justify-center h-64">
            <span className="text-gray-400">No additional image</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {yacht.specifications.builder && (
                  <div className="flex justify-between">
                    <span className="font-medium">Builder</span>
                    <span>{yacht.specifications.builder}</span>
                  </div>
                )}
                {yacht.specifications.year && (
                  <div className="flex justify-between">
                    <span className="font-medium">Year</span>
                    <span>{yacht.specifications.year}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Length</span>
                  <span>{yacht.specifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Beam</span>
                  <span>{yacht.specifications.beam}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guests</span>
                  <span>{yacht.specifications.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cabins</span>
                  <span>{yacht.specifications.cabins || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Crew</span>
                  <span>{yacht.specifications.crew}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cruising Speed</span>
                  <span>{yacht.specifications.cruisingSpeed || 'Unknown'} knots</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Max Speed</span>
                  <span>{yacht.specifications.maxSpeed || 'Unknown'} knots</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: yacht.description }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pricing Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Pricing</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Base Price</span>
                  <span className="text-2xl font-bold text-orange-600">
                    ${yacht.pricing?.basePrice?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Contact us for seasonal rates and availability.</p>
                </div>
                <div className="pt-4">
                  <Button className="w-full">Request Booking</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Features</h2>
              <div className="space-y-4">
                {yacht.features?.amenities && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Amenities</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      {yacht.features.amenities.map((amenity, index) => (
                        <li key={index}>{amenity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {yacht.features?.waterToys && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Water Toys</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                      {yacht.features.waterToys.map((toy, index) => (
                        <li key={index}>{toy}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Entertainment section removed as it's not in our data model */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
