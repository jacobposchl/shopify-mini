// src/components/CompanySelection.tsx
import React, { useState, useMemo, useEffect } from 'react'
import { useAsyncStorage, useProductSearch } from '@shopify/shop-minis-react'
import type { Company } from '../types'
import { useShopDiscovery, type DiscoveredShop, ShopPriority } from '../hooks/useShopDiscovery'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect }: CompanySelectionProps) {
  const { getItem, setItem } = useAsyncStorage()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [hasError, setHasError] = useState(false)
  
  const {
    shops: discoveredShops,
    groupedShops,
    loading,
    followShop,
    unfollowShop,
    recordShopVisit,
    userPreferences
  } = useShopDiscovery()

  // Error boundary - if anything crashes, show fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-[#550cff] flex flex-col items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">The shop selection encountered an error</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  // Debounce user input for better performance
  useEffect(() => {
    try {
      const timer = setTimeout(() => {
        setDebouncedQuery(searchQuery)
      }, 300)
      
      return () => clearTimeout(timer)
    } catch (error) {
      console.error('Error in debounce effect:', error)
      setHasError(true)
    }
  }, [searchQuery])

  // Real-time shop search using SDK
  const { products: searchProducts, loading: searchLoading, error: searchError } = useProductSearch({
    query: debouncedQuery ? `${debouncedQuery} fashion clothing apparel` : 'fashion clothing',
    first: 100,
    includeSensitive: false
  })

  // Extract and filter fashion shops from search results
  const searchShops = useMemo(() => {
    try {
      if (!searchProducts || !debouncedQuery.trim()) return []
      
      const shopMap = new Map<string, DiscoveredShop>()
      
      searchProducts.forEach(product => {
        try {
          const shopId = product.shop?.id
          const shopName = product.shop?.name
          
          if (!shopId || !shopName) return
          
          // Only include fashion-related shops
          const isFashionShop = isFashionRelated(product, shopName.toLowerCase())
          if (!isFashionShop) return
          
          if (!shopMap.has(shopId)) {
            shopMap.set(shopId, {
              id: shopId,
              name: shopName,
              logo: product.featuredImage?.url || '',
              description: `Found via search: ${debouncedQuery}`,
              priority: ShopPriority.DISCOVERY,
              reason: 'Search result'
            })
          }
        } catch (productError) {
          console.error('Error processing product:', productError)
        }
      })
      
      // Return shops sorted by name for consistency
      return Array.from(shopMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Error in searchShops:', error)
      return []
    }
  }, [searchProducts, debouncedQuery])

  // Helper function to filter fashion-only shops
  const isFashionRelated = (product: any, shopName: string) => {
    const fashionKeywords = [
      'clothing', 'fashion', 'apparel', 'wear', 'style', 'outfit',
      'dress', 'shirt', 'pants', 'shoes', 'accessories', 'jewelry',
      'bag', 'purse', 'hat', 'scarf', 'belt', 'watch'
    ]
    
    const productTitle = product.title?.toLowerCase() || ''
    const productTags = product.tags?.map((tag: string) => tag.toLowerCase()) || []
    
    // Check if shop name contains fashion keywords
    const shopIsFashion = fashionKeywords.some(keyword => shopName.includes(keyword))
    
    // Check if product title contains fashion keywords
    const productIsFashion = fashionKeywords.some(keyword => 
      productTitle.includes(keyword) || productTags.includes(keyword)
    )
    
    return shopIsFashion || productIsFashion
  }

  // Group filtered shops by priority for display
  const filteredGroupedShops = useMemo(() => {
    try {
      const grouped = {
        [ShopPriority.RECOMMENDED]: [] as DiscoveredShop[],
        [ShopPriority.FOLLOWED]: [] as DiscoveredShop[],
        [ShopPriority.RECENT]: [] as DiscoveredShop[],
        [ShopPriority.POPULAR]: [] as DiscoveredShop[],
        [ShopPriority.DISCOVERY]: [] as DiscoveredShop[]
      }
      
      // Combine discoveredShops and searchShops
      const allShops = [...discoveredShops, ...searchShops]
      
      console.log('Grouping shops:', {
        discoveredShopsCount: discoveredShops.length,
        searchShopsCount: searchShops.length,
        allShopsCount: allShops.length
      })

      allShops.forEach(shop => {
        try {
          if (shop && shop.priority) {
            grouped[shop.priority].push(shop)
          }
        } catch (shopError) {
          console.error('Error processing shop:', shopError, shop)
        }
      })
      
      console.log('Grouped shops result:', grouped)
      
      return grouped
    } catch (error) {
      console.error('Error in filteredGroupedShops:', error)
      // Return empty grouped structure on error
      return {
        [ShopPriority.RECOMMENDED]: [],
        [ShopPriority.FOLLOWED]: [],
        [ShopPriority.RECENT]: [],
        [ShopPriority.POPULAR]: [],
        [ShopPriority.DISCOVERY]: []
      }
    }
  }, [discoveredShops, searchShops])

  const handleSelect = async (shop: DiscoveredShop) => {
    // Record the shop visit
    await recordShopVisit(shop.id)
    
    // Record click for trending algorithm
    const raw = await getItem({ key: 'brandClicks' })
    let clicks: Record<string, number> = {}
    try { clicks = raw ? JSON.parse(String(raw)) : {} } catch { clicks = {} }
    clicks[shop.id] = (clicks[shop.id] ?? 0) + 1
    await setItem({ key: 'brandClicks', value: JSON.stringify(clicks) })
    
    // Call the original selection handler
    onCompanySelect(shop)
  }

  const handleFollowToggle = async (shop: DiscoveredShop, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent shop selection when clicking follow button
    
    if (userPreferences.followedShops.includes(shop.id)) {
      await unfollowShop(shop.id)
    } else {
      await followShop(shop.id)
    }
  }

  const getSectionTitle = (priority: ShopPriority) => {
    const titles = {
      [ShopPriority.RECOMMENDED]: 'Recommended for You',
      [ShopPriority.FOLLOWED]: 'Shops You Follow',
      [ShopPriority.RECENT]: 'Recently Visited',
      [ShopPriority.POPULAR]: 'Trending Shops',
      [ShopPriority.DISCOVERY]: 'Discover New Brands'
    }
    return titles[priority]
  }

  const renderCard = (shop: DiscoveredShop) => {
    const isFollowed = userPreferences.followedShops.includes(shop.id)
    
    return (
      <div key={shop.id} className="relative">
        <div className="relative w-full">
          <div onClick={() => handleSelect(shop)} className="cursor-pointer w-full hover:scale-105 active:scale-95 transition-all duration-300 ease-out">
            {/* Custom Shop Card - Guaranteed to show images */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0 max-w-sm">
              {/* Shop Image */}
              <div className="relative w-full aspect-[2/1] bg-gradient-to-br from-gray-50 to-gray-100">
                {shop.logo ? (
                  <img
                    src={shop.logo}
                    alt={`${shop.name} logo`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg text-white font-bold">{shop.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <p className="text-gray-600 text-xs font-medium">{shop.name}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Shop Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-base mb-1">{shop.name}</h3>
                <p className="text-gray-600 text-xs">{shop.reason}</p>
              </div>
            </div>
          </div>
          
          {/* Follow Button */}
          <div className="absolute top-3 left-3 z-20">
            <button
              onClick={(e) => handleFollowToggle(shop, e)}
              className={`flex items-center justify-center w-8 h-8 rounded-full shadow-lg ring-2 ring-white/80 transition-all duration-300 ${
                isFollowed 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                  : 'bg-white/90 hover:bg-white backdrop-blur-sm'
              }`}
              aria-label={isFollowed ? `Unfollow ${shop.name}` : `Follow ${shop.name}`}
            >
              <span className="text-sm">
                {isFollowed ? '❤️' : '🤍'}
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSection = (priority: ShopPriority, shops: DiscoveredShop[]) => {
    if (shops.length === 0) {
      console.log(`Section ${priority} is empty, not rendering`)
      return null
    }
    
    console.log(`Rendering section ${priority} with ${shops.length} shops`)
    return (
      <section key={priority} className="mb-8">
        <div className="px-4 mb-4">
          <h2 className="text-xl font-bold text-white">{getSectionTitle(priority)}</h2>
          <p className="text-sm text-white/70">{shops.length} shop{shops.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="px-4">
          <div className="space-y-4">
            {shops.map(renderCard)}
          </div>
        </div>
      </section>
    )
  }

  // Loading state
  if (loading && discoveredShops.length === 0) {
    return (
      <div className="min-h-screen bg-[#550cff] flex flex-col">
        <header className="relative bg-transparent">
          <div className="px-4 pt-12 pb-4 text-center">
            <div className="mb-1">
              <span className="text-sm font-medium text-white">Step 1 of 6</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Choose Your Brand</h1>
            <p className="text-sm text-white/80">Discovering shops from Shopify...</p>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading shops from Shopify...</p>
            <p className="text-sm opacity-80 mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!loading && discoveredShops.length === 0) {
    return (
      <div className="min-h-screen bg-[#550cff] flex flex-col">
        <header className="relative bg-transparent">
          <div className="px-4 pt-12 pb-4 text-center">
            <div className="mb-1">
              <span className="text-sm font-medium text-white">Step 1 of 6</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Choose Your Brand</h1>
            <p className="text-sm text-white/80">No shops found</p>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center px-4">
            <p className="text-lg mb-2">No shops available</p>
            <p className="text-sm opacity-80">Unable to discover shops from Shopify at the moment</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#550cff] flex flex-col">
      {/* Debug Info - Remove this later */}
      <div className="bg-red-500 text-white p-2 text-xs">
        <div>Search Query: "{searchQuery}"</div>
        <div>Debounced Query: "{debouncedQuery}"</div>
        <div>Search Loading: {searchLoading ? 'Yes' : 'No'}</div>
        <div>Search Error: {searchError ? 'Yes' : 'No'}</div>
        <div>Search Products Count: {searchProducts?.length || 0}</div>
        <div>Search Shops Count: {searchShops.length}</div>
        <div>Discovered Shops Count: {discoveredShops.length}</div>
        <div>All Shops Count: {discoveredShops.length + searchShops.length}</div>
      </div>

      {/* Header matches Step 2 style (centered) */}
      <header className="relative bg-transparent">
        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-base font-medium text-white">Step 1 of 6</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Select Shop</h1>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for specific brands..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/20 transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Search Results Indicator */}
          {searchQuery.trim() && (
            <div className="text-center mt-2">
              {searchLoading ? (
                <span className="text-white/80 text-sm">
                  🔍 Searching for fashion shops...
                </span>
              ) : (
                <span className="text-white/80 text-sm">
                  {searchShops.length > 0 
                    ? `${searchShops.length} fashion shop${searchShops.length !== 1 ? 's' : ''} found for "${searchQuery}"`
                    : `No fashion shops found for "${searchQuery}"`
                  }
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Scrollable content with sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4">
          {/* Show search results if searching */}
          {searchQuery.trim() && searchShops.length > 0 && (
            <section className="mb-8">
              <div className="px-4 mb-4">
                <h2 className="text-xl font-bold text-white">Search Results for "{searchQuery}"</h2>
                <p className="text-sm text-white/70">{searchShops.length} shop{searchShops.length !== 1 ? 's' : ''} found</p>
              </div>
              <div className="px-4">
                <div className="space-y-4">
                  {searchShops.map(renderCard)}
                </div>
              </div>
            </section>
          )}

          {/* Show "no results" message if searching but no results */}
          {searchQuery.trim() && searchShops.length === 0 && !searchLoading && (
            <div className="text-center py-8">
              <p className="text-white text-lg mb-2">No fashion shops found for "{searchQuery}"</p>
              <p className="text-white/70 text-sm">Try searching for: Nike, Adidas, Zara, luxury fashion, etc.</p>
            </div>
          )}

          {/* Render each section in priority order */}
          {renderSection(ShopPriority.RECOMMENDED, filteredGroupedShops[ShopPriority.RECOMMENDED])}
          {renderSection(ShopPriority.FOLLOWED, filteredGroupedShops[ShopPriority.FOLLOWED])}
          {renderSection(ShopPriority.RECENT, filteredGroupedShops[ShopPriority.RECENT])}
          {renderSection(ShopPriority.POPULAR, filteredGroupedShops[ShopPriority.POPULAR])}
          {renderSection(ShopPriority.DISCOVERY, filteredGroupedShops[ShopPriority.DISCOVERY])}
        </div>
      </div>
    </div>
  )
}
