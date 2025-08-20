import { useState, useEffect } from 'react'
import { 
  getPlaceholderImage, 
  optimizeImageUrl, 
  isValidImageUrl,
  preloadImage 
} from '../utils/imageManager'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  fallbackText?: string
  styleId?: string
  subStyleId?: string
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
}

export function ProductImage({ 
  src, 
  alt, 
  className = '', 
  fallbackText,
  styleId,
  subStyleId,
  width = 96,
  height = 96,
  quality = 80,
  format = 'webp'
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [optimizedSrc, setOptimizedSrc] = useState<string>('')

  useEffect(() => {
    if (src && isValidImageUrl(src)) {
      // Preload and optimize the image
      const optimized = optimizeImageUrl(src, { width, height, quality, format })
      setOptimizedSrc(optimized)
      
      preloadImage(optimized)
        .then(() => {
          setImageLoading(false)
        })
        .catch(() => {
          setImageError(true)
          setImageLoading(false)
        })
    } else {
      setImageError(true)
      setImageLoading(false)
    }
  }, [src, width, height, quality, format])

  // Show loading state
  if (imageLoading) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </div>
    )
  }

  // If no image source or image failed to load, show placeholder
  if (!src || imageError) {
    const placeholderSrc = styleId && subStyleId 
      ? getPlaceholderImage(styleId, subStyleId)
      : generateGenericPlaceholder(fallbackText || alt, width, height)
    
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <img 
          src={placeholderSrc} 
          alt={`${alt} placeholder`}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={`${className} object-cover`}
      onError={() => setImageError(true)}
      loading="lazy"
    />
  )
}

// Generate a generic SVG placeholder
function generateGenericPlaceholder(text: string, width: number, height: number): string {
  const encodedText = encodeURIComponent(text)
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f4f6'/%3E%3Ctext x='${width/2}' y='${height/2}' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10' font-family='system-ui, sans-serif'%3E${encodedText}%3C/text%3E%3C/svg%3E`
}
