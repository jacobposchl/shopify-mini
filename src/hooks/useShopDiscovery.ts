import { useRecommendedShops, useFollowedShops, useRecentShops, useAsyncStorage } from '@shopify/shop-minis-react'
import { useMemo, useCallback, useState, useEffect } from 'react'
import type { DiscoveredShop } from '../types'
import { ShopPriority } from '../types'

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
  
  // Local state for user preferences
  const [localFollowedShops, setLocalFollowedShops] = useState<string[]>([])
  const [localRecentShops, setLocalRecentShops] = useState<string[]>([])

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

  // Combine all shop sources with proper priority ranking
  const allShops = useMemo(() => {
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

  // Group shops by priority for UI display
  const groupedShops = useMemo(() => {
    const grouped = {
      [ShopPriority.RECENT]: [] as DiscoveredShop[],
      [ShopPriority.FOLLOWED]: [] as DiscoveredShop[],
      [ShopPriority.RECOMMENDED]: [] as DiscoveredShop[],
      [ShopPriority.POPULAR]: [] as DiscoveredShop[],
      [ShopPriority.DISCOVERY]: [] as DiscoveredShop[]
    }

    allShops.forEach(shop => {
      if (grouped[shop.priority]) {
        grouped[shop.priority].push(shop)
      }
    })

    return grouped
  }, [allShops])

  // Loading state - true if any source is loading
  const loading = recommendedLoading || followedLoading || recentLoading

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
      const updated = localFollowedShops.filter(id => id !== shopId)
      await setItem({ key: 'followedShops', value: JSON.stringify(updated) })
      setLocalFollowedShops(updated)
    } catch (error) {
      console.error('Error unfollowing shop:', error)
    }
  }, [localFollowedShops, setItem])

  const recordShopVisit = useCallback(async (shopId: string) => {
    try {
      // Remove if already exists, then add to front
      const newRecent = [shopId, ...localRecentShops.filter(id => id !== shopId)].slice(0, 20)
      await setItem({ key: 'recentShops', value: JSON.stringify(newRecent) })
      setLocalRecentShops(newRecent)
    } catch (error) {
      console.error('Error recording shop visit:', error)
    }
  }, [localRecentShops, setItem])

  // User preferences object for UI state
  const userPreferences = useMemo(() => ({
    followedShops: localFollowedShops,
    recentShops: localRecentShops
  }), [localFollowedShops, localRecentShops])

  return {
    shops: allShops,
    groupedShops,
    loading,
    hasError,
    followShop,
    unfollowShop,
    recordShopVisit,
    userPreferences,
    // Loading states for individual sections
    recommendedLoading,
    followedLoading,
    recentLoading,
    // Pagination functions for infinite scroll
    fetchMoreRecommended,
    hasMoreRecommended,
    fetchMoreFollowed,
    hasMoreFollowed,
    fetchMoreRecent,
    hasMoreRecent
  }
}
