// src/hooks/useShopDiscovery.ts (Enhanced Version)
import { useRecommendedShops, useFollowedShops, useRecentShops, useAsyncStorage } from '@shopify/shop-minis-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import type { DiscoveredShop } from '../types'
import { ShopPriority } from '../types'
import { useFashionShopValidator } from './useFashionShopValidator'

export function useShopDiscovery() {
  // Direct shop discovery using proper Shopify SDK hooks
  const { 
    shops: recommendedShops, 
    loading: recommendedLoading, 
    error: recommendedError,
    fetchMore: fetchMoreRecommended,
    hasNextPage: hasMoreRecommended
  } = useRecommendedShops({ first: 20 })

  const { 
    shops: followedShops, 
    loading: followedLoading, 
    error: followedError,
    fetchMore: fetchMoreFollowed,
    hasNextPage: hasMoreFollowed
  } = useFollowedShops({ first: 5 })

  const { 
    shops: recentShops, 
    loading: recentLoading, 
    error: recentError,
    fetchMore: fetchMoreRecent,
    hasNextPage: hasMoreRecent
  } = useRecentShops({ first: 3 })

  const { getItem, setItem } = useAsyncStorage()
  
  // Fashion validation hook
  const { quickFilterShops, validateShops, isValidating } = useFashionShopValidator()
  
  // Local state for user preferences
  const [localFollowedShops, setLocalFollowedShops] = useState<string[]>([])
  const [localRecentShops, setLocalRecentShops] = useState<string[]>([])
  const [filteredShops, setFilteredShops] = useState<DiscoveredShop[]>([])

  // Load user preferences on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const [followedRaw, recentRaw] = await Promise.all([
          getItem({ key: 'followedShops' }),
          getItem({ key: 'recentShops' })
        ])
        
        let followed: string[] = []
        let recent: string[] = []
        
        try { followed = followedRaw ? JSON.parse(String(followedRaw)) : [] } catch { followed = [] }
        try { recent = recentRaw ? JSON.parse(String(recentRaw)) : [] } catch { recent = [] }
        
        setLocalFollowedShops(followed)
        setLocalRecentShops(recent)
      } catch (error) {
        console.error('Error loading user preferences:', error)
      }
    }
    
    loadUserPreferences()
  }, [getItem])

  // Transform Shopify shop objects to our DiscoveredShop format
  const transformShop = useCallback((shop: any, priority: ShopPriority, reason: string): DiscoveredShop => {
    return {
      id: shop.id,
      name: shop.name,
      logo: shop.logo?.url || shop.logo || '', // Use official shop logo
      description: shop.description || reason,
      priority,
      reason,
      lastSeen: new Date(),
      interactionCount: 0
    }
  }, [])

  // Combine all shop sources with proper priority ranking (BEFORE filtering)
  const allShopsBeforeFilter = useMemo(() => {
    const shops: DiscoveredShop[] = []

    // Priority 1: Followed shops (highest priority)
    if (followedShops) {
      followedShops.forEach(shop => {
        shops.push(transformShop(shop, ShopPriority.FOLLOWED, 'You follow this shop'))
      })
    }

    // Priority 2: Recent shops (second highest)
    if (recentShops) {
      recentShops.forEach(shop => {
        // Avoid duplicates with followed shops
        if (!shops.find(s => s.id === shop.id)) {
          shops.push(transformShop(shop, ShopPriority.RECENT, 'Recently visited'))
        }
      })
    }

    // Priority 3: Recommended shops (third highest)
    if (recommendedShops) {
      recommendedShops.forEach(shop => {
        // Avoid duplicates with higher priority shops
        if (!shops.find(s => s.id === shop.id)) {
          shops.push(transformShop(shop, ShopPriority.RECOMMENDED, 'Recommended for you'))
        }
      })
    }

    return shops
  }, [followedShops, recentShops, recommendedShops, transformShop])

  // Apply fashion filtering when shops change
  useEffect(() => {
    if (allShopsBeforeFilter.length > 0) {
      // Use product-based validation (async)
      const validateAndFilterShops = async () => {
        try {
          const fashionShops = await quickFilterShops(allShopsBeforeFilter)
          
          setFilteredShops(fashionShops)
        } catch (error) {
          console.error('Error during product-based shop validation:', error)
          // Fallback: show all shops if validation fails
          setFilteredShops(allShopsBeforeFilter)
        }
      }
      
      validateAndFilterShops()
    } else {
      setFilteredShops([])
    }
  }, [allShopsBeforeFilter, quickFilterShops])

  // Group filtered shops by priority for UI display
  const groupedShops = useMemo(() => {
    const grouped = {
      [ShopPriority.RECENT]: [] as DiscoveredShop[],
      [ShopPriority.FOLLOWED]: [] as DiscoveredShop[],
      [ShopPriority.RECOMMENDED]: [] as DiscoveredShop[],
      [ShopPriority.POPULAR]: [] as DiscoveredShop[],
      [ShopPriority.DISCOVERY]: [] as DiscoveredShop[]
    }

    filteredShops.forEach(shop => {
      if (grouped[shop.priority]) {
        grouped[shop.priority].push(shop)
      }
    })

    return grouped
  }, [filteredShops])

  // Loading state - true if any source is loading or validating
  const loading = recommendedLoading || followedLoading || recentLoading || isValidating

  // Error state - true if any source has an error
  const hasError = recommendedError || followedError || recentError

  // Follow/unfollow shop functionality
  const followShop = useCallback(async (shopId: string) => {
    try {
      const newFollowed = [...localFollowedShops, shopId]
      await setItem({ key: 'followedShops', value: JSON.stringify(newFollowed) })
      setLocalFollowedShops(newFollowed)
    } catch (error) {
      console.error('Error following shop:', error)
    }
  }, [localFollowedShops, setItem])

  const unfollowShop = useCallback(async (shopId: string) => {
    try {
      const newFollowed = localFollowedShops.filter(id => id !== shopId)
      await setItem({ key: 'followedShops', value: JSON.stringify(newFollowed) })
      setLocalFollowedShops(newFollowed)
    } catch (error) {
      console.error('Error unfollowing shop:', error)
    }
  }, [localFollowedShops, setItem])

  const recordShopVisit = useCallback(async (shopId: string) => {
    try {
      // Add to recent shops (keep last 10)
      const newRecent = [shopId, ...localRecentShops.filter(id => id !== shopId)].slice(0, 10)
      await setItem({ key: 'recentShops', value: JSON.stringify(newRecent) })
      setLocalRecentShops(newRecent)
    } catch (error) {
      console.error('Error recording shop visit:', error)
    }
  }, [localRecentShops, setItem])

  // User preferences summary
  const userPreferences = useMemo(() => ({
    followedShops: localFollowedShops,
    recentShops: localRecentShops,
    recommendedShops: recommendedShops?.map(shop => shop.id) || []
  }), [localFollowedShops, localRecentShops, recommendedShops])

  return {
    // Filtered shops (fashion-only)
    shops: filteredShops,
    groupedShops,
    
    // Original shops (before filtering) - for debugging
    allShopsBeforeFilter,
    
    // State
    loading,
    hasError: hasError || false,
    
    // Actions
    followShop,
    unfollowShop,
    recordShopVisit,
    
    // Pagination
    fetchMoreRecommended,
    recommendedLoading,
    hasMoreRecommended,
    
    // User data
    userPreferences,
    
    // Filtering info
    isValidating,
    totalShopsFound: allShopsBeforeFilter.length,
    fashionShopsFound: filteredShops.length
  }
}