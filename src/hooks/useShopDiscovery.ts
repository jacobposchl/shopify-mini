import { useState, useEffect, useMemo } from 'react'
import { useProductSearch, useAsyncStorage } from '@shopify/shop-minis-react'
import type { Company } from '../types'

// Shop discovery priority tiers
export enum ShopPriority {
  RECOMMENDED = 'RECOMMENDED',
  FOLLOWED = 'FOLLOWED', 
  RECENT = 'RECENT',
  POPULAR = 'POPULAR',
  DISCOVERY = 'DISCOVERY'
}

export interface DiscoveredShop extends Company {
  priority: ShopPriority
  reason: string
  lastSeen?: Date
  interactionCount?: number
}

interface ShopDiscoveryState {
  shops: DiscoveredShop[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

// Helper function to get shops by priority
export function groupShopsByPriority(shops: DiscoveredShop[]) {
  const grouped = {
    [ShopPriority.RECOMMENDED]: [] as DiscoveredShop[],
    [ShopPriority.FOLLOWED]: [] as DiscoveredShop[],
    [ShopPriority.RECENT]: [] as DiscoveredShop[],
    [ShopPriority.POPULAR]: [] as DiscoveredShop[],
    [ShopPriority.DISCOVERY]: [] as DiscoveredShop[]
  }
  
  shops.forEach(shop => {
    grouped[shop.priority].push(shop)
  })
  
  return grouped
}

export function useShopDiscovery() {
  const { getItem, setItem } = useAsyncStorage()
  const [state, setState] = useState<ShopDiscoveryState>({
    shops: [],
    loading: true,
    error: null,
    lastUpdated: null
  })

  // Tier 1: Most Relevant to User
  const [userPreferences, setUserPreferences] = useState<{
    followedShops: string[]
    recentShops: string[]
    recommendedShops: string[]
  }>({
    followedShops: [],
    recentShops: [],
    recommendedShops: []
  })

  // Load user preferences from storage
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const [followed, recent, recommended] = await Promise.all([
          getItem({ key: 'followedShops' }),
          getItem({ key: 'recentShops' }),
          getItem({ key: 'recommendedShops' })
        ])

        setUserPreferences({
          followedShops: followed ? JSON.parse(String(followed)) : [],
          recentShops: recent ? JSON.parse(String(recent)) : [],
          recommendedShops: recommended ? JSON.parse(String(recommended)) : []
        })
      } catch (error) {
        console.warn('Failed to load user preferences:', error)
      }
    }

    loadUserPreferences()
  }, [getItem])

  // Tier 2: Top Brands Overall - Use popular products to discover shops
  const { products: popularProducts, loading: popularLoading } = useProductSearch({
    query: 'clothing fashion',
    sortBy: 'RELEVANCE',
    first: 100,
    includeSensitive: false
  })

  // Get additional discovery shops from more product searches
  const { products: discoveryProducts } = useProductSearch({
    query: 'streetwear urban fashion',
    sortBy: 'RELEVANCE',
    first: 50,
    includeSensitive: false
  })

  // Get luxury and designer shops
  const { products: luxuryProducts } = useProductSearch({
    query: 'luxury designer fashion',
    sortBy: 'RELEVANCE',
    first: 50,
    includeSensitive: false
  })

  // Get sustainable and eco-friendly shops
  const { products: sustainableProducts } = useProductSearch({
    query: 'sustainable eco-friendly fashion',
    sortBy: 'RELEVANCE',
    first: 50,
    includeSensitive: false
  })

  // Extract shops from popular products
  const popularShops = useMemo(() => {
    if (!popularProducts) return []
    
    const shopMap = new Map<string, { count: number; lastSeen: Date; shop: any; sampleProduct: any }>()
    
    popularProducts.forEach(product => {
      const shopId = product.shop.id
      const existing = shopMap.get(shopId)
      
      if (existing) {
        existing.count += 1
        existing.lastSeen = new Date()
      } else {
        shopMap.set(shopId, { count: 1, lastSeen: new Date(), shop: product.shop, sampleProduct: product })
      }
    })

    // Debug: Log what we're getting from Shopify
    console.log('🔍 Popular products shop data sample:', popularProducts.slice(0, 3).map(p => ({
      shopId: p.shop.id,
      shopName: p.shop.name,
      productImage: p.featuredImage?.url,
      productTitle: p.title
    })))

    return Array.from(shopMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30) // Top 30 shops by product popularity
      .map(([shopId, data]) => {
        const shopImage = data.sampleProduct.featuredImage?.url || ''
        console.log(`🏪 Shop ${data.shop.name}:`, { 
          id: shopId, 
          image: shopImage,
          productTitle: data.sampleProduct.title 
        })
        
        return {
          id: shopId,
          name: data.shop.name || 'Unknown Shop',
          logo: shopImage, // Use product image as shop representation
          description: `Popular shop with ${data.count} trending products`,
          priority: ShopPriority.POPULAR,
          reason: `Trending with ${data.count} popular products`,
          lastSeen: data.lastSeen
        }
      })
  }, [popularProducts])

  // Combine all product sources to create discovery shops
  const allProducts = useMemo(() => {
    const products = []
    if (discoveryProducts) products.push(...discoveryProducts)
    if (luxuryProducts) products.push(...luxuryProducts)
    if (sustainableProducts) products.push(...sustainableProducts)
    return products
  }, [discoveryProducts, luxuryProducts, sustainableProducts])

  const discoveryShops = useMemo(() => {
    if (allProducts.length === 0) return []
    
    const shopMap = new Map<string, { count: number; lastSeen: Date; shop: any; sampleProduct: any }>()
    
    allProducts.forEach(product => {
      const shopId = product.shop.id
      const existing = shopMap.get(shopId)
      
      if (existing) {
        existing.count += 1
        existing.lastSeen = new Date()
      } else {
        shopMap.set(shopId, { count: 1, lastSeen: new Date(), shop: product.shop, sampleProduct: product })
      }
    })

    // Debug: Log discovery shops data
    console.log('🔍 Discovery shops data sample:', allProducts.slice(0, 3).map(p => ({
      shopId: p.shop.id,
      shopName: p.shop.name,
      productImage: p.featuredImage?.url
    })))

    return Array.from(shopMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 25) // Top 25 discovery shops
      .map(([shopId, data]) => ({
        id: shopId,
        name: data.shop.name || 'Unknown Shop',
        logo: data.sampleProduct.featuredImage?.url || '', // Use product image as shop representation
        description: `Discover ${data.shop.name}`,
        priority: ShopPriority.DISCOVERY,
        reason: 'Discover new brands',
        lastSeen: data.lastSeen
      }))
  }, [allProducts])

  // Transform and merge all shop sources
  const discoveredShops = useMemo(() => {
    const allShops: DiscoveredShop[] = []
    const seenIds = new Set<string>()

    // Helper function to add shop if not seen
    const addShop = (shop: DiscoveredShop) => {
      if (!seenIds.has(shop.id)) {
        seenIds.add(shop.id)
        allShops.push(shop)
      }
    }

    // Tier 1: User-specific recommendations (these will be populated from actual shop visits)
    userPreferences.followedShops.forEach(shopId => {
      // Find the shop in our discovered shops
      const foundShop = [...popularShops, ...discoveryShops].find(s => s.id === shopId)
      if (foundShop) {
        addShop({
          ...foundShop,
          priority: ShopPriority.FOLLOWED,
          reason: 'You follow this shop'
        })
      }
    })

    userPreferences.recentShops.forEach(shopId => {
      // Find the shop in our discovered shops
      const foundShop = [...popularShops, ...discoveryShops].find(s => s.id === shopId)
      if (foundShop) {
        addShop({
          ...foundShop,
          priority: ShopPriority.RECENT,
          reason: 'Recently visited'
        })
      }
    })

    userPreferences.recommendedShops.forEach(shopId => {
      // Find the shop in our discovered shops
      const foundShop = [...popularShops, ...discoveryShops].find(s => s.id === shopId)
      if (foundShop) {
        addShop({
          ...foundShop,
          priority: ShopPriority.RECOMMENDED,
          reason: 'Recommended for you'
        })
      }
    })

    // Tier 2: Popular shops from product data
    popularShops.forEach(shop => {
      addShop(shop)
    })

    // Tier 3: Additional discovery shops
    discoveryShops.forEach(shop => {
      addShop(shop)
    })

    // Sort by priority and relevance
    return allShops.sort((a, b) => {
      const priorityOrder = {
        [ShopPriority.RECOMMENDED]: 0,
        [ShopPriority.FOLLOWED]: 1,
        [ShopPriority.RECENT]: 2,
        [ShopPriority.POPULAR]: 3,
        [ShopPriority.DISCOVERY]: 4
      }
      
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [userPreferences, popularShops, discoveryShops])

  // Update state when shops are discovered
  useEffect(() => {
    setState(prev => ({
      ...prev,
      shops: discoveredShops,
      loading: popularLoading,
      lastUpdated: new Date()
    }))
  }, [discoveredShops, popularLoading])

  // Helper functions for user interactions
  const followShop = async (shopId: string) => {
    try {
      const newFollowed = [...userPreferences.followedShops, shopId]
      await setItem({ key: 'followedShops', value: JSON.stringify(newFollowed) })
      setUserPreferences(prev => ({ ...prev, followedShops: newFollowed }))
    } catch (error) {
      console.error('Failed to follow shop:', error)
    }
  }

  const unfollowShop = async (shopId: string) => {
    try {
      const newFollowed = userPreferences.followedShops.filter(id => id !== shopId)
      await setItem({ key: 'followedShops', value: JSON.stringify(newFollowed) })
      setUserPreferences(prev => ({ ...prev, followedShops: newFollowed }))
    } catch (error) {
      console.error('Failed to unfollow shop:', error)
    }
  }

  const recordShopVisit = async (shopId: string) => {
    try {
      const newRecent = [shopId, ...userPreferences.recentShops.filter(id => id !== shopId)].slice(0, 10)
      await setItem({ key: 'recentShops', value: JSON.stringify(newRecent) })
      setUserPreferences(prev => ({ ...prev, recentShops: newRecent }))
    } catch (error) {
      console.error('Failed to record shop visit:', error)
    }
  }

  // Get grouped shops for sectioned display
  const groupedShops = useMemo(() => groupShopsByPriority(discoveredShops), [discoveredShops])

  return {
    shops: state.shops,
    groupedShops,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    followShop,
    unfollowShop,
    recordShopVisit,
    userPreferences
  }
}
