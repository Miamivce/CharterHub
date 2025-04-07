import { useState } from 'react'

// Default fallback images
const DEFAULT_YACHT_FALLBACK = '/images/Sasta-YachtShot-H022.jpg'
const DEFAULT_DESTINATION_FALLBACK =
  'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?auto=format&fit=crop&w=800&q=60'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallbackSrc?: string
  type?: 'yacht' | 'destination' | 'other'
  className?: string
}

/**
 * A component that displays an image with a fallback in case of loading errors
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  fallbackSrc,
  type = 'other',
  className,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src)
  const [hasError, setHasError] = useState<boolean>(false)

  // Determine the appropriate fallback image
  const getDefaultFallback = () => {
    if (type === 'yacht') return DEFAULT_YACHT_FALLBACK
    if (type === 'destination') return DEFAULT_DESTINATION_FALLBACK
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlZWVlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgTm90IEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4='
  }

  // Use the provided fallback, or default one if not provided
  const actualFallback = fallbackSrc || getDefaultFallback()

  const handleError = () => {
    if (!hasError) {
      console.warn(`Failed to load image: ${src}, using fallback`)
      setImageSrc(actualFallback)
      setHasError(true)
    }
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleError}
      className={className}
      loading="lazy"
      {...props}
    />
  )
}

export default ImageWithFallback
