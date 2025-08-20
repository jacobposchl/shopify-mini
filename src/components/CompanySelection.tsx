// src/components/CompanySelection.tsx
import React from 'react'
import { useAsyncStorage, MerchantCard } from '@shopify/shop-minis-react'
import type { Company } from '../types'
import { useShopDiscovery, type DiscoveredShop, ShopPriority } from '../hooks/useShopDiscovery'

interface CompanySelectionProps {
  onCompanySelect: (company: Company) => void
  selectedCompany?: Company
}

export function CompanySelection({ onCompanySelect }: CompanySelectionProps) {
  const { getItem, setItem } = useAsyncStorage()
  const { 
    shops: discoveredShops, 
    groupedShops,
    loading, 
    followShop, 
    unfollowShop, 
    recordShopVisit,
    userPreferences 
  } = useShopDiscovery()

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

  const getPriorityBadge = (priority: ShopPriority) => {
    const badges = {
      [ShopPriority.RECOMMENDED]: { text: '⭐', color: 'bg-yellow-500' },
      [ShopPriority.FOLLOWED]: { text: '❤️', color: 'bg-red-500' },
      [ShopPriority.RECENT]: { text: '🕒', color: 'bg-blue-500' },
      [ShopPriority.POPULAR]: { text: '🔥', color: 'bg-orange-500' },
      [ShopPriority.DISCOVERY]: { text: '✨', color: 'bg-purple-500' }
    }
    return badges[priority]
  }

  const getSectionTitle = (priority: ShopPriority) => {
    const titles = {
      [ShopPriority.RECOMMENDED]: '⭐ Recommended for You',
      [ShopPriority.FOLLOWED]: '❤️ Shops You Follow',
      [ShopPriority.RECENT]: '🕒 Recently Visited',
      [ShopPriority.POPULAR]: '🔥 Trending Shops',
      [ShopPriority.DISCOVERY]: '✨ Discover New Brands'
    }
    return titles[priority]
  }

  const renderCard = (shop: DiscoveredShop) => {
    const isFollowed = userPreferences.followedShops.includes(shop.id)
    const priorityBadge = getPriorityBadge(shop.priority)
    
    // Debug: Log what we're passing to MerchantCard
    console.log(`🎯 Rendering shop card for ${shop.name}:`, {
      id: shop.id,
      name: shop.name,
      logo: shop.logo,
      priority: shop.priority
    })
    
    return (
      <div key={shop.id} className="relative">
        <div className="relative w-full">
          <div onClick={() => handleSelect(shop)} className="cursor-pointer w-full hover:scale-105 active:scale-95 transition-all duration-300 ease-out">
            <MerchantCard
              shop={{
                id: shop.id,
                name: shop.name,
                primaryDomain: { url: `https://${shop.name.toLowerCase().replace(/\s+/g, '')}.myshopify.com` },
                reviewAnalytics: { averageRating: null, reviewCount: 0 }
              }}
            />
          </div>
          
          {/* Priority Badge */}
          <div className="pointer-events-none absolute top-3 right-3 z-20">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full ${priorityBadge.color} shadow-lg ring-2 ring-white/80`}>
              <span className="text-sm" aria-hidden>
                {priorityBadge.text}
              </span>
              <span className="sr-only">{shop.reason}</span>
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
    if (shops.length === 0) return null

    return (
      <section key={priority} className="mb-8">
        <div className="px-4 mb-4">
          <h2 className="text-lg font-bold text-white">{getSectionTitle(priority)}</h2>
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
      {/* Header matches Step 2 style (centered) */}
      <header className="relative bg-transparent">
        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-white">Step 1 of 6</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Choose Your Brand</h1>
          <p className="text-sm text-white/80">
            {loading ? 'Discovering shops from Shopify...' : `Found ${discoveredShops.length} shops from Shopify`}
          </p>
        </div>
      </header>

      {/* Scrollable content with sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4">
          {/* Render each section in priority order */}
          {renderSection(ShopPriority.RECOMMENDED, groupedShops[ShopPriority.RECOMMENDED])}
          {renderSection(ShopPriority.FOLLOWED, groupedShops[ShopPriority.FOLLOWED])}
          {renderSection(ShopPriority.RECENT, groupedShops[ShopPriority.RECENT])}
          {renderSection(ShopPriority.POPULAR, groupedShops[ShopPriority.POPULAR])}
          {renderSection(ShopPriority.DISCOVERY, groupedShops[ShopPriority.DISCOVERY])}
        </div>
      </div>
    </div>
  )
}
