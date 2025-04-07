import { useYachts, useDestinations } from '@/hooks/useWordPress'

export const WordPressTest = () => {
  const { data: yachts, isLoading: yachtsLoading, error: yachtsError } = useYachts()
  const {
    data: destinations,
    isLoading: destinationsLoading,
    error: destinationsError,
  } = useDestinations()

  if (yachtsLoading || destinationsLoading) {
    return <div>Loading...</div>
  }

  if (yachtsError || destinationsError) {
    return <div>Error: {(yachtsError || destinationsError)?.message}</div>
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">WordPress Data Test</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Yachts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {yachts?.map((yacht) => (
            <div key={yacht.id} className="border rounded-lg p-4 shadow">
              {yacht.featuredImage && (
                <img
                  src={yacht.featuredImage}
                  alt={yacht.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
              )}
              <h4 className="font-bold">{yacht.name}</h4>
              <div className="text-sm">
                <p>Builder: {yacht.specifications.builder}</p>
                <p>Year: {yacht.specifications.year}</p>
                <p>Length: {yacht.specifications.length}m</p>
                <p>Beam: {yacht.specifications.beam}m</p>
                <p>Cabins: {yacht.specifications.cabins}</p>
                <p>Guests: {yacht.specifications.guests}</p>
                <p>Crew: {yacht.specifications.crew}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Destinations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations?.map((destination) => (
            <div key={destination.id} className="border rounded-lg p-4 shadow">
              {destination.featuredImage && (
                <img
                  src={destination.featuredImage}
                  alt={destination.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
              )}
              <h4 className="font-bold">{destination.name}</h4>
              <div
                className="text-sm mt-2"
                dangerouslySetInnerHTML={{ __html: destination.description }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
