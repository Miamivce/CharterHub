import React, { useState, useEffect } from 'react'
import { Card } from '@/components/shared'

interface YachtTrackerProps {
  bookingId: string
  yachtId?: string
}

interface YachtPosition {
  latitude: number
  longitude: number
  speed: number
  heading: number
  lastUpdated: string
}

export function YachtTracker({ bookingId, yachtId }: YachtTrackerProps) {
  const [position, setPosition] = useState<YachtPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Mock API call to get yacht position
    const fetchYachtPosition = async () => {
      try {
        // In a real implementation, this would make an API call to an AIS tracking service
        // For the mockup, we'll simulate a delay and return mock data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generate a position somewhere in the Mediterranean Sea
        const mockPosition: YachtPosition = {
          latitude: 37.5 + Math.random() * 3, // Somewhere in the Med
          longitude: 13.5 + Math.random() * 10, // Somewhere in the Med
          speed: Math.floor(Math.random() * 15), // 0-15 knots
          heading: Math.floor(Math.random() * 360), // 0-359 degrees
          lastUpdated: new Date().toISOString(),
        }

        setPosition(mockPosition)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching yacht position:', err)
        setError('Unable to retrieve yacht location data')
        setLoading(false)
      }
    }

    fetchYachtPosition()

    // In a real implementation, you might set up a polling interval
    // to periodically update the yacht's position
    // const interval = setInterval(fetchYachtPosition, 60000);
    // return () => clearInterval(interval);
  }, [bookingId, yachtId])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No location data available</p>
      </div>
    )
  }

  // Helper to format coordinates
  const formatCoordinate = (coord: number, isLatitude: boolean) => {
    const direction = isLatitude ? (coord >= 0 ? 'N' : 'S') : coord >= 0 ? 'E' : 'W'

    const absCoord = Math.abs(coord)
    const degrees = Math.floor(absCoord)
    const minutes = ((absCoord - degrees) * 60).toFixed(2)

    return `${degrees}° ${minutes}' ${direction}`
  }

  // Format the last updated time
  const formatLastUpdated = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {/* Mock map display */}
      <div className="relative h-64 bg-blue-100 rounded overflow-hidden">
        {/* This would be replaced with an actual map in a real implementation */}
        <div className="absolute inset-0 bg-blue-200 bg-opacity-70">
          <div className="h-full w-full relative">
            {/* Simulated coastlines */}
            <div className="absolute top-1/4 left-0 right-0 h-1 bg-amber-300"></div>
            <div className="absolute bottom-1/4 left-1/4 right-0 h-1 bg-amber-300"></div>

            {/* Yacht position marker */}
            <div
              className="absolute w-4 h-4 bg-red-500 rounded-full transform -translate-x-2 -translate-y-2"
              style={{
                top: `${(1 - (position.latitude - 35) / 6) * 100}%`,
                left: `${((position.longitude - 10) / 15) * 100}%`,
              }}
            >
              <div
                className="absolute h-2.5 w-0.5 bg-red-500"
                style={{
                  transform: `rotate(${position.heading}deg)`,
                  transformOrigin: 'bottom center',
                  top: '-10px',
                  left: '7.5px',
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Map overlay with labels */}
        <div className="absolute top-2 left-2 right-2 p-2 bg-white bg-opacity-75 rounded">
          <p className="text-xs font-medium">Mediterranean Sea (Mockup)</p>
        </div>
      </div>

      {/* Position details */}
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium block">Position</span>
            <span>
              {formatCoordinate(position.latitude, true)},{' '}
              {formatCoordinate(position.longitude, false)}
            </span>
          </div>
          <div>
            <span className="font-medium block">Speed</span>
            <span>{position.speed} knots</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium block">Heading</span>
            <span>{position.heading}°</span>
          </div>
          <div>
            <span className="font-medium block">Last Update</span>
            <span>{formatLastUpdated(position.lastUpdated)}</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic mt-2">
          Note: This is a mockup of the AIS tracking feature. Real-time tracking will be available
          in the future.
        </p>
      </div>
    </div>
  )
}

export default YachtTracker
