import { useState, useMemo } from 'react'
import { useProductSearch, useProductVariants } from '@shopify/shop-minis-react'
import { BackButton } from './BackButton'
import { ProductImage } from './ProductImage'
import type { ClothingItem, Company } from '../types'
import type { ProductFilters, ProductSearchSortBy } from '@shopify/shop-minis-react'

interface ClothingSelectionProps {
  onBack: () => void
  onItemSelect: (item: ClothingItem) => void
  selectedCompany?: Company
}

/* ---------- Price helpers ---------- */
function formatPrice(amount: string | number | null | undefined, currencyCode?: string) {
  if (amount === null || amount === undefined) return 'Price not available'
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  if (isNaN(num)) return 'Price not available'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}

/* ---------- Size helpers ---------- */
const ALPHA_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'One Size']

function normalizeSizeValue(raw?: string | null): string | null {
  if (!raw) return null
  let v = String(raw).trim()

  // Strip prefixes like "US ", "EU ", "UK "
  v = v.replace(/^(US|EU|UK)\s*/i, '')

  const lowered = v.toLowerCase()
  const compact = lowered.replace(/[\s-]/g, '') // handles "2 XL", "3-XL", etc.

  // One size
  if (/(^one\s*-?\s*size$|^os$|^o\/s$)/i.test(lowered)) return 'One Size'

  // Alpha sizes
  if (/^(xxs|2xs)$/.test(compact)) return 'XXS'
  if (/^(xs|xsmall|extrasmall)$/.test(compact)) return 'XS'
  if (/^(s|small)$/.test(compact)) return 'S'
  if (/^(m|medium)$/.test(compact)) return 'M'
  if (/^(l|large)$/.test(compact)) return 'L'
  if (/^(xl|xlarge|extralarge)$/.test(compact)) return 'XL'

  // Extended sizes — robust to "2XL", "3XL", variants
  if (/^(2xl|xxl|xxlarge|2xlarge|2x)$/.test(compact)) return 'XXL'
  if (/^(3xl|xxxl|xxxlarge|3xlarge|3x)$/.test(compact)) return 'XXXL'
  if (/^(4xl|xxxxl|xxxxlarge|4xlarge|4x)$/.test(compact)) return 'XXXXL'

  // Numeric sizes
  if (/^\d+(\.\d+)?$/.test(lowered)) return String(v.replace(/^0+/, '')) || '0'

  return v.toUpperCase()
}

function sizeSortKey(a: string): [number, number] {
  const alphaIdx = ALPHA_ORDER.indexOf(a)
  if (alphaIdx >= 0) return [0, alphaIdx]
  const num = parseFloat(a)
  if (!isNaN(num)) return [1, num]
  return [2, ALPHA_ORDER.length]
}

function sortSizes(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const [ga, va] = sizeSortKey(a)
    const [gb, vb] = sizeSortKey(b)
    if (ga !== gb) return ga - gb
    if (va !== vb) return (va as number) - (vb as number)
    return a.localeCompare(b)
  })
}

/* Extract sizes from an array of variants (ProductVariant[]) */
function extractSizesFromVariants(variants: any[] | null | undefined): string[] {
  const out = new Set<string>()
  const push = (val?: string | null) => {
    const n = normalizeSizeValue(val)
    if (n) out.add(n)
  }

  if (variants && Array.isArray(variants)) {
    variants.forEach((variant) => {
      // 1) selectedOptions: [{ name, value }]
      const so = variant?.selectedOptions
      if (Array.isArray(so)) {
        so.forEach((opt: any) => {
          if (String(opt?.name || '').toLowerCase().includes('size')) {
            push(opt?.value)
          }
        })
      }

      // 2) fallback: parse from title parts like "M / Black" or "2 XL / Navy"
      if (typeof variant?.title === 'string') {
        const parts = variant.title.split('/').map((s: string) => s.trim())
        const guess =
          parts.find((p) =>
            /^(xxs|xs|s|m|l|xl|xxl|xxxl|xxxxl|one\s*-?\s*size|os|o\/s|\d+(\.\d+)?|2\s*xl|3\s*xl|2x|3x)$/i.test(
              p
            ),
          ) || null
        push(guess)
      }
    })
  }

  // If more than one size found and 'One Size' is present, drop 'One Size'
  if (out.size > 1 && out.has('One Size')) out.delete('One Size')

  const list = sortSizes([...out])
  return list.length ? list : ['One Size']
}

/* ---------- Per-card sizes (uses useProductVariants) ---------- */
function ProductSizesBadges({ productId }: { productId: string }) {
  const { variants, loading } = useProductVariants({ id: productId, first: 50 })
  const sizes = useMemo(() => extractSizesFromVariants(variants || []), [variants])

  if (loading) {
    // light skeleton
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        <span className="h-5 w-8 bg-white/30 rounded animate-pulse" />
        <span className="h-5 w-8 bg-white/30 rounded animate-pulse" />
        <span className="h-5 w-10 bg-white/30 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {sizes.slice(0, 6).map((size) => (
        <span
          key={size}
          className="text-xs text-white border border-white px-2 py-1 rounded"
        >
          {size}
        </span>
      ))}
      {sizes.length > 6 && (
        <span className="text-xs text-white">+{sizes.length - 6}</span>
      )}
    </div>
  )
}

export function ClothingSelection({ onBack, onItemSelect, selectedCompany }: ClothingSelectionProps) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all')

  const company = selectedCompany

  // Build search query
  const searchQuery = useMemo(() => {
    const terms: string[] = []
    if (company?.name) terms.push(company.name)
    if (terms.length === 0) return 'clothing apparel'
    return terms.join(' ')
  }, [company?.name])

  const finalSearchQuery = searchQuery.trim() || 'clothing apparel'

  const filters: ProductFilters = useMemo(() => {
    const filters: ProductFilters = {}
    return filters
  }, [])

  const { products: shopifyProducts, loading, error } = useProductSearch({
    query: finalSearchQuery,
    // filters, // re-enable when needed
    sortBy: 'RELEVANCE' as ProductSearchSortBy,
    first: 50,
    includeSensitive: false,
  })

  // Transform Shopify products to our ClothingItem format
  const products: ClothingItem[] = useMemo(() => {
    if (!shopifyProducts) return []

    return shopifyProducts.map((product) => {
      return {
        id: product.id,
        name: product.title,
        brand: product.shop.name,
        style: 'Unknown',
        subStyle: 'Unknown',
        price:
          product.price?.amount != null
            ? formatPrice(product.price.amount, product.price.currencyCode)
            : 'Price not available',
        image: product.featuredImage?.url || '',
        colors: [],
        sizes: [], // sizes fetched per card via useProductVariants
        companyId: product.shop.id,
        styleId: '',
        subStyleId: '',
        shopifyProduct: product,
      }
    })
  }, [shopifyProducts])

  // Build categories dynamically
  const availableCategories = useMemo(() => {
    if (!products.length) return []

    const categoryMap = new Map<string, number>()

    products.forEach((product) => {
      const productName = product.name.toLowerCase()
      const productType = (product.shopifyProduct as any)?.productType?.toLowerCase() || ''
      const tags =
        ((product.shopifyProduct as any)?.tags || []).map((tag: string) => tag.toLowerCase())

      const categories = [
        { key: 'shirts', keywords: ['shirt', 't-shirt', 'tshirt', 'polo', 'button-down', 'blouse', 'top', 'tank', 'crop'] },
        { key: 'pants', keywords: ['pants', 'jeans', 'trousers', 'slacks', 'chinos', 'khakis', 'cargo', 'joggers', 'sweatpants'] },
        { key: 'dresses', keywords: ['dress', 'gown', 'frock', 'jumpsuit', 'romper', 'bodysuit'] },
        { key: 'skirts', keywords: ['skirt', 'mini', 'midi', 'maxi', 'pencil', 'pleated'] },
        { key: 'shorts', keywords: ['shorts', 'bermuda', 'athletic shorts'] },
        { key: 'outerwear', keywords: ['jacket', 'coat', 'blazer', 'sweater', 'hoodie', 'cardigan', 'vest'] },
        { key: 'activewear', keywords: ['active', 'athletic', 'workout', 'gym', 'sport', 'training', 'leggings'] },
        { key: 'underwear', keywords: ['underwear', 'lingerie', 'bra', 'panties', 'boxers', 'briefs'] },
        { key: 'sleepwear', keywords: ['sleep', 'pajamas', 'pjs', 'nightgown', 'robe', 'loungewear'] },
        { key: 'swimwear', keywords: ['swim', 'bathing', 'bikini', 'swimsuit', 'beach'] },
      ]

      categories.forEach((category) => {
        const hasCategory = category.keywords.some(
          (keyword) =>
            productName.includes(keyword) ||
            productType.includes(keyword) ||
            tags.some((tag: string) => tag.includes(keyword)),
        )
        if (hasCategory) {
          categoryMap.set(category.key, (categoryMap.get(category.key) || 0) + 1)
        }
      })
    })

    return Array.from(categoryMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category)
  }, [products])

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory) {
        const productName = product.name.toLowerCase()
        const productType = (product.shopifyProduct as any)?.productType?.toLowerCase() || ''
        const tags =
          ((product.shopifyProduct as any)?.tags || []).map((tag: string) => tag.toLowerCase())

        const categoryKeywords: Record<string, string[]> = {
          shirts: ['shirt', 't-shirt', 'tshirt', 'polo', 'button-down', 'blouse', 'top', 'tank', 'crop'],
          pants: ['pants', 'jeans', 'trousers', 'slacks', 'chinos', 'khakis', 'cargo', 'joggers', 'sweatpants'],
          dresses: ['dress', 'gown', 'frock', 'jumpsuit', 'romper', 'bodysuit'],
          skirts: ['skirt', 'mini', 'midi', 'maxi', 'pencil', 'pleated'],
          shorts: ['shorts', 'bermuda', 'athletic shorts'],
          outerwear: ['jacket', 'coat', 'blazer', 'sweater', 'hoodie', 'cardigan', 'vest'],
          activewear: ['active', 'athletic', 'workout', 'gym', 'sport', 'training', 'leggings'],
          underwear: ['underwear', 'lingerie', 'bra', 'panties', 'boxers', 'briefs'],
          sleepwear: ['sleep', 'pajamas', 'pjs', 'nightgown', 'robe', 'loungewear'],
          swimwear: ['swim', 'bathing', 'bikini', 'swimsuit', 'beach'],
        }

        const keywords = categoryKeywords[selectedCategory] || []
        const hasCategory = keywords.some(
          (keyword) =>
            productName.includes(keyword) ||
            productType.includes(keyword) ||
            tags.some((tag: string) => tag.includes(keyword)),
        )

        if (!hasCategory) return false
      }

      if (selectedGender !== 'all') {
        const productName = product.name.toLowerCase()
        const productType = (product.shopifyProduct as any)?.productType?.toLowerCase() || ''
        const tags = ((product.shopifyProduct as any)?.tags || []).map((tag: string) => tag.toLowerCase())
        const vendor = (product.shopifyProduct as any)?.vendor?.toLowerCase() || ''
        
        // More comprehensive gender detection
        const isMenProduct = 
          productName.includes('men') || 
          productName.includes('male') || 
          productName.includes('guy') ||
          productType.includes('men') || 
          productType.includes('male') ||
          tags.some(tag => tag.includes('men') || tag.includes('male') || tag.includes('guy')) ||
          vendor.includes('men') || 
          vendor.includes('male')
        
        const isWomenProduct = 
          productName.includes('women') || 
          productName.includes('female') || 
          productName.includes('girl') ||
          productType.includes('women') || 
          productType.includes('female') ||
          tags.some(tag => tag.includes('women') || tag.includes('female') || tag.includes('girl')) ||
          vendor.includes('women') || 
          vendor.includes('female')
        
        const isUnisexProduct = 
          productName.includes('unisex') || 
          productName.includes('gender neutral') ||
          productType.includes('unisex') ||
          tags.some(tag => tag.includes('unisex') || tag.includes('gender neutral'))
        
        // Apply gender filtering
        if (selectedGender === 'men') {
          if (isWomenProduct) return false
          // For men's filter, prefer men's products but allow unisex
        } else if (selectedGender === 'women') {
          if (isMenProduct) return false
          // For women's filter, prefer women's products but allow unisex
        } else if (selectedGender === 'unisex') {
          // For unisex filter, only show explicitly unisex products
          if (!isUnisexProduct) return false
        }
      }

      if (selectedPriceRange !== 'all') {
        const price = parseFloat(product.price.replace(/[^0-9.]/g, ''))
        if (!isNaN(price)) {
          switch (selectedPriceRange) {
            case 'budget':
              if (price > 50) return false
              break
            case 'mid':
              if (price < 50 || price > 150) return false
              break
            case 'premium':
              if (price < 150 || price > 300) return false
              break
            case 'luxury':
              if (price < 300) return false
              break
          }
        }
      }

      return true
    })
  }, [products, selectedCategory, selectedGender, selectedPriceRange])

  const isLoading = loading

  const handleItemSelect = (item: ClothingItem) =>
    setSelectedItem((prev) => (prev?.id === item.id ? null : item)) // toggle select/deselect

  const handleContinue = () => {
    if (selectedItem) onItemSelect(selectedItem)
  }
  const handleBack = () => onBack()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <BackButton onClick={handleBack} />
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding perfect items for you...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <BackButton onClick={handleBack} />
          <div className="text-center py-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-4">We couldn't load the products right now.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-sm font-medium text-gray-800 mb-2">Search Parameters:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Query: "{finalSearchQuery}"</p>
                <p>Filters: {JSON.stringify(filters)}</p>
                <p>Company: {company?.name || 'undefined'}</p>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#550cff]">
      <div className="max-w-md mx-auto p-4">
        <BackButton onClick={handleBack} />

        {/* Header */}
        <div className="text-center mb-6 mt-8">
          {/* ↑ Bigger to match "Select Shop" */}
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2 tracking-tight">
            Select Item
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold mb-3 text-center">Filter Options</h3>

          {/* Category */}
          <div className="mb-3">
            <label className="block text-white/80 text-sm mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <option value="">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {availableCategories.length > 0 && (
              <p className="text-xs text-white/60 mt-1">
                This shop sells: {availableCategories.slice(0, 3).join(', ')}
                {availableCategories.length > 3 && ` and ${availableCategories.length - 3} more`}
              </p>
            )}

            {availableCategories.length === 0 && products.length > 0 && (
              <p className="text-xs text-white/60 mt-1">
                No specific clothing categories detected, but {products.length} clothing items available
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="mb-3">
            <label className="block text-white/80 text-sm mb-2">Gender</label>
            <div className="flex gap-2">
              {['all', 'men', 'women', 'unisex'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedGender === gender ? 'bg-white text-[#550cff]' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <label className="block text-white/80 text-sm mb-2">Price Range</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <option value="all">All Prices</option>
              <option value="budget">Budget ($0 - $50)</option>
              <option value="mid">Mid-Range ($50 - $150)</option>
              <option value="premium">Premium ($150 - $300)</option>
              <option value="luxury">Luxury ($300+)</option>
            </select>
          </div>

          {/* Clear */}
          <div className="text-center">
            <button
              onClick={() => {
                setSelectedCategory('')
                setSelectedGender('all')
                setSelectedPriceRange('all')
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Count */}
        <div className="mb-4">
          <p className="text-sm text-white/80 text-center">
            {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
          

        </div>

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {filteredProducts.map((item) => {
              const isSelected = selectedItem?.id === item.id
              return (
                <div
                  key={item.id}
                  className={`relative rounded-lg p-3 border border-white cursor-pointer transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-white scale-105' : 'hover:bg-white/5 hover:scale-102'
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  {/* Image */}
                  <div className="aspect-square mb-3 rounded-md overflow-hidden bg-white/10">
                    {item.image ? (
                      <ProductImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full"
                        width={400}
                        height={400}
                        quality={90}
                        format="webp"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <span className="text-2xl">👕</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-white text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-white text-xs">{item.brand}</p>
                    <p className="font-semibold text-white text-sm">{item.price}</p>

                    {/* Real sizes via useProductVariants */}
                    <ProductSizesBadges productId={item.id} />
                  </div>

                  {/* Selected tick */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-white text-[#550cff] rounded-full w-6 h-6 flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-white mb-2">No items found</h3>
            <p className="text-white/80 mb-4">
              {selectedCategory || selectedGender !== 'all' || selectedPriceRange !== 'all'
                ? 'No items match your current filters. Try adjusting your filter selections or clearing all filters.'
                : "We couldn't find any items matching your criteria. This might be because the Shopify store doesn't have products matching your selections, or there might be a connection issue."}
            </p>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adjust Selections
            </button>
          </div>
        )}

        {/* Continue */}
        {selectedItem && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="max-w-md mx-auto">
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
