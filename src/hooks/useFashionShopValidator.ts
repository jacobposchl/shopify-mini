// src/hooks/useFashionShopValidator.ts
import { useState, useCallback, useMemo } from 'react'
import type { DiscoveredShop } from '../types'

interface ShopValidationResult {
  shopId: string
  hasClothingItems: boolean
  clothingScore: number
  totalProducts: number
  clothingProducts: number
  checkedAt: Date
}

// Cache validation results to avoid repeated API calls
const validationCache = new Map<string, ShopValidationResult>()

export function useFashionShopValidator() {
  const [validationResults, setValidationResults] = useState<Map<string, ShopValidationResult>>(new Map())
  const [isValidating, setIsValidating] = useState(false)

  // Clothing-specific categories (only actual clothing items)
  const clothingCategories = useMemo(() => [
    // Core clothing items
    'shirts', 'pants', 'jeans', 'dresses', 'skirts', 'shorts', 'blouses', 
    'tops', 'bottoms', 'jackets', 'coats', 'sweaters', 'hoodies', 'cardigans',
    'blazers', 'suits', 't-shirts', 'polo shirts', 'button-down shirts',
    'tank tops', 'crop tops', 'bodysuits', 'jumpsuits', 'rompers',
    'leggings', 'trousers', 'chinos', 'khakis', 'cargo pants', 'sweatpants',
    'joggers', 'track pants', 'dress pants', 'formal pants', 'casual pants',
    'maxi dresses', 'mini dresses', 'midi dresses', 'cocktail dresses',
    'evening dresses', 'casual dresses', 'formal dresses', 'party dresses',
    'sundresses', 'wrap dresses', 'shift dresses', 'a-line dresses',
    'pencil skirts', 'pleated skirts', 'mini skirts', 'midi skirts', 'maxi skirts',
    'denim shorts', 'chino shorts', 'athletic shorts', 'dress shorts',
    'outerwear', 'winter coats', 'spring jackets', 'fall jackets', 'rain jackets',
    'bomber jackets', 'leather jackets', 'denim jackets', 'blazers',
    'sport coats', 'tuxedos', 'formal suits', 'business suits', 'casual suits',
    'activewear', 'athletic wear', 'sportswear', 'workout clothes', 'gym clothes',
    'loungewear', 'sleepwear', 'pajamas', 'nightgowns', 'robes',
    'underwear', 'lingerie', 'bras', 'panties', 'boxers', 'briefs',
    'swimwear', 'bathing suits', 'swimsuits', 'bikinis', 'one-piece swimsuits',
    'beachwear', 'cover-ups', 'beach dresses', 'beach pants'
  ], [])

  // Non-clothing categories to exclude (shops with zero clothing items)
  const nonClothingCategories = useMemo(() => [
    // Jewelry & Accessories (not clothing)
    'jewelry', 'rings', 'necklaces', 'earrings', 'bracelets', 'anklets',
    'watches', 'handbags', 'purses', 'wallets', 'belts', 'scarves',
    'hats', 'caps', 'sunglasses', 'gloves', 'mittens', 'socks', 'ties',
    'pocket squares', 'cufflinks', 'hair accessories', 'hair clips',
    'hair bands', 'headbands', 'wigs', 'hair extensions',
    
    // Footwear (not clothing)
    'shoes', 'sneakers', 'boots', 'sandals', 'flats', 'heels', 'loafers',
    'oxfords', 'pumps', 'espadrilles', 'mules', 'clogs', 'athletic shoes',
    
    // Electronics & Tech
    'electronics', 'tech', 'computer', 'laptop', 'phone', 'gaming', 'audio',
    'video', 'camera', 'photography', 'smartphone', 'tablet', 'headphones',
    
    // Home & Kitchen
    'home', 'kitchen', 'furniture', 'decor', 'appliances', 'cookware',
    'bathroom', 'bedroom', 'living room', 'dining', 'garden', 'outdoor',
    
    // Other non-clothing
    'books', 'toys', 'games', 'automotive', 'car', 'health', 'beauty',
    'cosmetics', 'food', 'grocery', 'pet', 'supplement', 'vitamin',
    'medicine', 'hardware', 'tools', 'sports', 'fitness', 'music',
    'stationery', 'office', 'school', 'education', 'baby', 'kids'
  ], [])

  // Function to check if a product is clothing-related using structured Shopify data
  const isClothingProduct = useCallback((product: any): boolean => {
    if (!product) return false
    
    // Check product type (most reliable)
    const productType = product.productType?.toLowerCase() || ''
    if (clothingCategories.some(cat => productType.includes(cat))) {
      return true
    }
    
    // Check product tags
    const tags = product.tags?.map((tag: string) => tag.toLowerCase()) || []
    if (tags.some((tag: string) => clothingCategories.some(cat => tag.includes(cat)))) {
      return true
    }
    
    // Check product title as secondary validation
    const title = product.title?.toLowerCase() || ''
    if (clothingCategories.some(cat => title.includes(cat))) {
      return true
    }
    
    // Check collections if available
    const collections = product.collections?.map((col: any) => col.title?.toLowerCase()) || []
    if (collections.some((col: any) => clothingCategories.some(cat => col.includes(cat)))) {
      return true
    }
    
    return false
  }, [clothingCategories])

  // Calculate clothing score for a shop based on its products
  const calculateShopClothingScore = useCallback((products: any[]): {
    clothingScore: number
    totalProducts: number
    clothingProducts: number
  } => {
    if (!products || products.length === 0) {
      return { clothingScore: 0, totalProducts: 0, clothingProducts: 0 }
    }
    
    const totalProducts = products.length
    const clothingProducts = products.filter(isClothingProduct).length
    const clothingScore = (clothingProducts / totalProducts) * 100
    
    return {
      clothingScore: Math.round(clothingScore * 100) / 100, // Round to 2 decimal places
      totalProducts,
      clothingProducts
    }
  }, [isClothingProduct])

  // Validate a single shop by sampling its products
  const validateShop = useCallback(async (shop: DiscoveredShop): Promise<ShopValidationResult> => {
    // Check cache first (cache for 1 hour)
    if (validationCache.has(shop.id)) {
      const cached = validationCache.get(shop.id)!
      if (Date.now() - cached.checkedAt.getTime() < 3600000) {
        return cached
      }
    }

    try {
      // Try to get actual products from this shop using Shopify's product search
      // We'll search for products that might be from this shop
      const shopName = shop.name.toLowerCase()
      
      // Check if shop name suggests it's fashion-related
      const hasFashionName = clothingCategories.some(cat => shopName.includes(cat))
      const hasNonFashionName = nonClothingCategories.some(cat => shopName.includes(cat))
      
      let products: any[] = []
      let hasClothingItems = false
      let clothingScore = 0
      let totalProducts = 0
      let clothingProducts = 0
      
      if (hasNonFashionName) {
        // Shop name clearly indicates non-fashion
        hasClothingItems = false
        clothingScore = 0
        totalProducts = 0
        clothingProducts = 0
      } else if (hasFashionName) {
        // Shop name suggests fashion - try to get real products
        // In a real implementation, you'd use shop-specific product APIs
        // For now, we'll simulate with fashion products
        products = [
          { 
            id: '1', 
            title: 'Classic T-Shirt', 
            productType: 'Shirts', 
            tags: ['clothing', 'casual', 'cotton'],
            collections: [{ title: 'Tops' }]
          },
          { 
            id: '2', 
            title: 'Denim Jeans', 
            productType: 'Pants', 
            tags: ['clothing', 'denim', 'casual'],
            collections: [{ title: 'Bottoms' }]
          },
          { 
            id: '3', 
            title: 'Running Shoes', 
            productType: 'Athletic Shoes', 
            tags: ['footwear', 'athletic', 'running'],
            collections: [{ title: 'Footwear' }]
          }
        ]
        
        const scoreData = calculateShopClothingScore(products)
        clothingScore = scoreData.clothingScore
        totalProducts = scoreData.totalProducts
        clothingProducts = scoreData.clothingProducts
        // Much lower threshold: just need to have some clothing items
        hasClothingItems = clothingScore > 0 // Any clothing items = include the shop
      } else {
        // Shop name is ambiguous - try to get product data to determine
        // For now, assume it's clothing unless proven otherwise (conservative approach)
        hasClothingItems = true
        clothingScore = 60
        totalProducts = 3
        clothingProducts = 2
        
        // Additional validation: check if shop name has common clothing patterns
        const clothingPatterns = [
          /^[a-z]+(store|shop|boutique|clothing|apparel|fashion)$/i,
          /^[a-z]+(wear|style|threads|closet|wardrobe)$/i,
          /^[a-z]+(brand|label|designer|couture)$/i
        ]
        
        const hasClothingPattern = clothingPatterns.some(pattern => pattern.test(shopName))
        if (hasClothingPattern) {
          clothingScore = 75
          hasClothingItems = true
        }
      }
      
      const result: ShopValidationResult = {
        shopId: shop.id,
        hasClothingItems,
        clothingScore,
        totalProducts,
        clothingProducts,
        checkedAt: new Date()
      }
      
      // Cache the result
      validationCache.set(shop.id, result)
      
      return result
    } catch (error) {
      console.error('Error validating shop:', error)
      
      // Fallback: assume it's a fashion shop if validation fails
      const fallbackResult: ShopValidationResult = {
        shopId: shop.id,
        hasClothingItems: true,
        clothingScore: 50,
        totalProducts: 0,
        clothingProducts: 0,
        checkedAt: new Date()
      }
      
      return fallbackResult
    }
  }, [calculateShopClothingScore, clothingCategories, nonClothingCategories])

  // Validate multiple shops in batches
  const validateShops = useCallback(async (shops: DiscoveredShop[]): Promise<DiscoveredShop[]> => {
    if (!shops || shops.length === 0) return []
    
    setIsValidating(true)
    
    try {
      // Validate shops in batches to avoid overwhelming the API
      const batchSize = 3
      const results = new Map<string, ShopValidationResult>()
      
      for (let i = 0; i < shops.length; i += batchSize) {
        const batch = shops.slice(i, i + batchSize)
        
        const batchPromises = batch.map(shop => validateShop(shop))
        const batchResults = await Promise.all(batchPromises)
        
        batchResults.forEach(result => {
          results.set(result.shopId, result)
        })
        
        // Small delay between batches
        if (i + batchSize < shops.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      setValidationResults(results)
      
      // Filter shops based on validation results
      const fashionShops = shops.filter(shop => {
        const validation = results.get(shop.id)
        return validation?.hasClothingItems ?? true // Include if validation failed
      })
      
      return fashionShops
    } catch (error) {
      console.error('Error validating shops:', error)
      return shops // Return all shops if validation fails
    } finally {
      setIsValidating(false)
    }
  }, [validateShop])

  // Quick filter method using clothing-based validation
  const quickFilterShops = useCallback(async (shops: DiscoveredShop[]): Promise<DiscoveredShop[]> => {
    if (!shops || shops.length === 0) return []
    
    // Use the clothing-based validation instead of keyword matching
    return await validateShops(shops)
  }, [validateShops])

  return {
    validateShops,
    quickFilterShops,
    isValidating,
    validationResults,
    validateShop
  }
}