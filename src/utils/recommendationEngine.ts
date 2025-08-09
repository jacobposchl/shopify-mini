import { ClothingItem, Measurements, Recommendation } from '../types'

export function calculateRecommendedSize(
  item: ClothingItem,
  measurements: Measurements
): { size: string; confidence: number } {
  // Simple size recommendation logic based on chest/waist measurements
  // In a real app, this would be much more sophisticated
  
  let recommendedSize = 'M'
  let confidence = 0.8

  if (item.styleId === 'shirts') {
    // Shirt sizing based on chest measurement
    if (measurements.chest <= 36) {
      recommendedSize = 'S'
      confidence = 0.9
    } else if (measurements.chest <= 40) {
      recommendedSize = 'M'
      confidence = 0.85
    } else if (measurements.chest <= 44) {
      recommendedSize = 'L'
      confidence = 0.85
    } else {
      recommendedSize = 'XL'
      confidence = 0.8
    }
  } else if (item.styleId === 'pants') {
    // Pants sizing based on waist measurement
    if (measurements.waist <= 30) {
      recommendedSize = 'S'
      confidence = 0.9
    } else if (measurements.waist <= 34) {
      recommendedSize = 'M'
      confidence = 0.85
    } else if (measurements.waist <= 38) {
      recommendedSize = 'L'
      confidence = 0.85
    } else {
      recommendedSize = 'XL'
      confidence = 0.8
    }
  } else if (item.styleId === 'shorts') {
    // Shorts sizing based on waist measurement
    if (measurements.waist <= 30) {
      recommendedSize = 'S'
      confidence = 0.9
    } else if (measurements.waist <= 34) {
      recommendedSize = 'M'
      confidence = 0.85
    } else if (measurements.waist <= 38) {
      recommendedSize = 'L'
      confidence = 0.85
    } else {
      recommendedSize = 'XL'
      confidence = 0.8
    }
  }

  // Check if recommended size is available in the item
  if (!item.sizes.includes(recommendedSize)) {
    // Find the closest available size
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    const currentIndex = sizeOrder.indexOf(recommendedSize)
    
    // Try next size up
    if (currentIndex < sizeOrder.length - 1 && item.sizes.includes(sizeOrder[currentIndex + 1])) {
      recommendedSize = sizeOrder[currentIndex + 1]
      confidence *= 0.9
    }
    // Try next size down
    else if (currentIndex > 0 && item.sizes.includes(sizeOrder[currentIndex - 1])) {
      recommendedSize = sizeOrder[currentIndex - 1]
      confidence *= 0.9
    }
    // Fall back to first available size
    else {
      recommendedSize = item.sizes[0]
      confidence *= 0.7
    }
  }

  return { size: recommendedSize, confidence }
}

export function generateRecommendation(
  item: ClothingItem,
  measurements: Measurements
): Recommendation {
  const { size, confidence } = calculateRecommendedSize(item, measurements)
  
  return {
    item,
    recommendedSize: size,
    confidence,
    measurements
  }
}
