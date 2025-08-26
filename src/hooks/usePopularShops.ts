import { useMemo } from 'react'
import { useProductSearch } from '@shopify/shop-minis-react'
import type { ProductSearchSortBy } from '@shopify/shop-minis-react'
import type { DiscoveredShop } from '../types'
import { ShopPriority } from '../types'

export function usePopularShops(limit = 10) {
  const { products, loading } = useProductSearch({
    query: 'clothing apparel',
    sortBy: 'BEST_SELLING' as ProductSearchSortBy,
    first: 50,
    includeSensitive: false
  })

  const shops: DiscoveredShop[] = useMemo(() => {
    if (!products || products.length === 0) return []
    const map = new Map<string, DiscoveredShop>()
    for (const product of products) {
      let shop = product.shop
      if ((!shop || !shop.id) && product.vendor) {
        const vendor = String(product.vendor).trim()
        const vendorId = `vendor:${vendor.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')}`
        shop = { id: vendorId, name: vendor }
      }
      if (!shop || !shop.id) continue
      if (!map.has(shop.id)) {
        map.set(shop.id, {
          id: shop.id,
          name: shop.name,
          logo: shop.logoImage?.url || shop.logo?.url || shop.logo || '',
          description: 'Popular today',
          priority: ShopPriority.POPULAR,
          reason: 'Popular today',
          lastSeen: new Date(),
          interactionCount: 0
        })
      }
      if (map.size >= limit) break
    }
    return Array.from(map.values())
  }, [products, limit])

  return { shops, loading }
}
