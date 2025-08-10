// Image management utilities for the Shopify Mini app

// Default placeholder images for different clothing categories
export const PLACEHOLDER_IMAGES = {
  shirts: {
    'crew-neck': '/placeholders/crew-neck.svg',
    'v-neck': '/placeholders/v-neck.svg',
    'button-down': '/placeholders/button-down.svg',
    'polo': '/placeholders/polo.svg'
  },
  pants: {
    'jeans': '/placeholders/jeans.svg',
    'joggers': '/placeholders/joggers.svg',
    'dress-pants': '/placeholders/dress-pants.svg',
    'leggings': '/placeholders/leggings.svg'
  },
  shorts: {
    'athletic-shorts': '/placeholders/athletic-shorts.svg',
    'casual-shorts': '/placeholders/casual-shorts.svg',
    'dress-shorts': '/placeholders/dress-shorts.svg'
  },
  jackets: {
    'hoodie': '/placeholders/hoodie.svg',
    'blazer': '/placeholders/blazer.svg',
    'windbreaker': '/placeholders/windbreaker.svg'
  }
}

// Generate SVG placeholder for clothing items
export const generateSVGPlaceholder = (
  category: string,
  subCategory: string,
  width: number = 96,
  height: number = 96
): string => {
  const encodedText = encodeURIComponent(`${subCategory}\n${category}`)
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23f3f4f6'/%3E%3Ctext x='${width/2}' y='${height/2}' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10' font-family='system-ui, sans-serif'%3E${encodedText}%3C/text%3E%3C/svg%3E`
}

// Get appropriate placeholder for a clothing item
export const getPlaceholderImage = (styleId: string, subStyleId: string): string => {
  const style = PLACEHOLDER_IMAGES[styleId as keyof typeof PLACEHOLDER_IMAGES]
  if (style && style[subStyleId as keyof typeof style]) {
    return style[subStyleId as keyof typeof style]
  }
  
  // Fallback to generic placeholder
  return generateSVGPlaceholder(styleId, subStyleId)
}

// Image optimization utilities
export const optimizeImageUrl = (url: string, options: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpg' | 'png'
} = {}): string => {
  if (!url) return url
  
  // For Shopify CDN images, we can add transformation parameters
  if (url.includes('cdn.shopify.com')) {
    const params = new URLSearchParams()
    
    if (options.width) params.append('width', options.width.toString())
    if (options.height) params.append('height', options.height.toString())
    if (options.quality) params.append('quality', options.quality.toString())
    if (options.format) params.append('format', options.format)
    
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${params.toString()}`
  }
  
  return url
}

// Validate image URL
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false
  
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Preload image for better performance
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve()
      return
    }
    
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

// Batch preload images
export const preloadImages = async (urls: string[]): Promise<void> => {
  const validUrls = urls.filter(isValidImageUrl)
  await Promise.allSettled(validUrls.map(preloadImage))
}
