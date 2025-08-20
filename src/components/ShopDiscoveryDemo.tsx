import React from 'react'
import { useShopDiscovery, ShopPriority } from '../hooks/useShopDiscovery'

export function ShopDiscoveryDemo() {
  const { 
    shops, 
    loading, 
    error, 
    followShop, 
    unfollowShop, 
    recordShopVisit,
    userPreferences 
  } = useShopDiscovery()

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Shop Discovery Demo</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Shop Discovery Demo</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  const getPriorityColor = (priority: ShopPriority) => {
    const colors = {
      [ShopPriority.RECOMMENDED]: 'bg-yellow-100 text-yellow-800',
      [ShopPriority.FOLLOWED]: 'bg-red-100 text-red-800',
      [ShopPriority.RECENT]: 'bg-blue-100 text-blue-800',
      [ShopPriority.POPULAR]: 'bg-orange-100 text-orange-800',
      [ShopPriority.DISCOVERY]: 'bg-purple-100 text-purple-800'
    }
    return colors[priority]
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Shop Discovery Demo</h2>
      
      <div className="mb-4">
        <h3 className="font-medium mb-2">User Preferences</h3>
        <div className="text-sm space-y-1">
          <div>Followed: {userPreferences.followedShops.length}</div>
          <div>Recent: {userPreferences.recentShops.length}</div>
          <div>Recommended: {userPreferences.recommendedShops.length}</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Discovered Shops ({shops.length})</h3>
        <div className="space-y-2">
          {shops.slice(0, 10).map((shop) => {
            const isFollowed = userPreferences.followedShops.includes(shop.id)
            
            return (
              <div key={shop.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{shop.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(shop.priority)}`}>
                    {shop.priority}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{shop.reason}</p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => isFollowed ? unfollowShop(shop.id) : followShop(shop.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      isFollowed 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {isFollowed ? 'Unfollow' : 'Follow'}
                  </button>
                  
                  <button
                    onClick={() => recordShopVisit(shop.id)}
                    className="px-3 py-1 rounded text-sm bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Visit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        
        {shops.length > 10 && (
          <p className="text-sm text-gray-500 mt-2">
            Showing first 10 of {shops.length} shops
          </p>
        )}
      </div>
    </div>
  )
}
