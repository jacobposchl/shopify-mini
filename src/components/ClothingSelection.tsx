import { useState, useMemo } from 'react'
import { useProductSearch } from '@shopify/shop-minis-react'
import { BackButton } from './BackButton'
import { ProductImage } from './ProductImage'
import type { ClothingItem, Company } from '../types'
import type { ProductFilters, ProductSearchSortBy } from '@shopify/shop-minis-react'

interface ClothingSelectionProps {
  onBack: () => void
  onItemSelect: (item: ClothingItem) => void
  selectedCompany?: Company
}

// Formats "USD 12.34" → "$12.34" (and supports other currencies via Intl)
function formatPrice(amount: string | number | null | undefined, currencyCode?: string) {
  if (amount === null || amount === undefined) return 'Price not available'
  const num = typeof amount === 'number' ? amount : parseFloat(amount)
  if (isNaN(num)) return 'Price not available'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode || 'USD'
    }).format(num)
  } catch {
    return `$${num.toFixed(2)}`
  }
}

export function ClothingSelection({ onBack, onItemSelect, selectedCompany }: ClothingSelectionProps) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all')
  
  // Get user selections from previous steps (now only company)
  const company = selectedCompany
  
  // Build search query and filters for Shopify
  const searchQuery = useMemo(() => {
    const terms: string[] = []
    if (company?.name) terms.push(company.name)
    
    if (terms.length === 0) {
      return 'clothing apparel'
    }
    
    return terms.join(' ')
  }, [company?.name])

  // Ensure we have a valid search query
  const finalSearchQuery = searchQuery.trim() || 'clothing apparel'

  const filters: ProductFilters = useMemo(() => {
    const filters: ProductFilters = {}
    // Filters intentionally minimal for now
    return filters
  }, [])

  // Use the official Shopify Minis SDK hook
  const { products: shopifyProducts, loading, error } = useProductSearch({
    query: finalSearchQuery,
    // filters, // disabled while testing basic search
    sortBy: 'RELEVANCE' as ProductSearchSortBy,
    first: 50,
    includeSensitive: false
  })

  // Transform Shopify products to our ClothingItem format
  const products: ClothingItem[] = useMemo(() => {
    if (!shopifyProducts) return []
    
    return shopifyProducts.map((product) => {
      // Extract all variant options that look like sizes
      const sizes = product.variants?.reduce((acc: string[], variant) => {
        const sizeOptions = variant.selectedOptions?.filter(opt => 
          opt.name.toLowerCase().includes('size')
        ) || []

        sizeOptions.forEach(opt => {
          const size = opt.value.toUpperCase()
            .replace('SMALL', 'S')
            .replace('MEDIUM', 'M')
            .replace('LARGE', 'L')
            .replace('X-LARGE', 'XL')
            .replace('2XL', 'XXL')
            .replace('3XL', 'XXXL')
          
          if (!acc.includes(size)) {
            acc.push(size)
          }
        })

        return acc
      }, [])

      // Sort sizes in standard order
      const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
      const sortedSizes = sizes?.sort((a, b) => 
        sizeOrder.indexOf(a) - sizeOrder.indexOf(b)
      ) || ['One Size']

      return {
        id: product.id,
        name: product.title,
        brand: product.shop.name,
        style: 'Unknown',
        subStyle: 'Unknown',
        // ✅ Use currency symbol via Intl instead of "USD 12.34"
        price: product.price?.amount != null
          ? formatPrice(product.price.amount, product.price.currencyCode)
          : 'Price not available',
        image: product.featuredImage?.url || '',
        colors: [],
        sizes: sortedSizes,
        companyId: product.shop.id,
        styleId: '',
        subStyleId: '',
        shopifyProduct: product
      }
    })
  }, [shopifyProducts])

  // Dynamically generate clothing categories based on what the shop actually sells
  const availableCategories = useMemo(() => {
    if (!products.length) return []
    
    const categoryMap = new Map<string, number>()
    
    products.forEach(product => {
      const productName = product.name.toLowerCase()
      const productType = (product.shopifyProduct as any)?.productType?.toLowerCase() || ''
      const tags = (product.shopifyProduct as any)?.tags?.map((tag: string) => tag.toLowerCase()) || []
      
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
        { key: 'swimwear', keywords: ['swim', 'bathing', 'bikini', 'swimsuit', 'beach'] }
      ]
      
      categories.forEach(category => {
        const hasCategory = category.keywords.some(keyword => 
          productName.includes(keyword) || 
          productType.includes(keyword) ||
          tags.some((tag: string) => tag.includes(keyword))
        )
        
        if (hasCategory) {
          categoryMap.set(category.key, (categoryMap.get(category.key) || 0) + 1)
        }
      })
    })
    
    return Array.from(categoryMap.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category)
  }, [products])

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter - check against available categories
      if (selectedCategory) {
        const productName = product.name.toLowerCase()
        const productType = (product.shopifyProduct as any)?.productType?.toLowerCase() || ''
        const tags = (product.shopifyProduct as any)?.tags?.map((tag: string) => tag.toLowerCase()) || []
        
        const categoryKeywords = {
          'shirts': ['shirt', 't-shirt', 'tshirt', 'polo', 'button-down', 'blouse', 'top', 'tank', 'crop'],
          'pants': ['pants', 'jeans', 'trousers', 'slacks', 'chinos', 'khakis', 'cargo', 'joggers', 'sweatpants'],
          'dresses': ['dress', 'gown', 'frock', 'jumpsuit', 'romper', 'bodysuit'],
          'skirts': ['skirt', 'mini', 'midi', 'maxi', 'pencil', 'pleated'],
          'shorts': ['shorts', 'bermuda', 'athletic shorts'],
          'outerwear': ['jacket', 'coat', 'blazer', 'sweater', 'hoodie', 'cardigan', 'vest'],
          'activewear': ['active', 'athletic', 'workout', 'gym', 'sport', 'training', 'leggings'],
          'underwear': ['underwear', 'lingerie', 'bra', 'panties', 'boxers', 'briefs'],
          'sleepwear': ['sleep', 'pajamas', 'pjs', 'nightgown', 'robe', 'loungewear'],
          'swimwear': ['swim', 'bathing', 'bikini', 'swimsuit', 'beach']
        }
        
        const keywords = (categoryKeywords as any)[selectedCategory] || []
        const hasCategory = keywords.some((keyword: string) => 
          productName.includes(keyword) || 
          productType.includes(keyword) ||
          tags.some((tag: string) => tag.includes(keyword))
        )
        
        if (!hasCategory) {
          return false
        }
      }
      
      // Gender filter (basic implementation)
      if (selectedGender !== 'all') {
        const productName = product.name.toLowerCase()
        if (selectedGender === 'men' && (productName.includes('women') || productName.includes('female'))) {
          return false
        }
        if (selectedGender === 'women' && (productName.includes('men') || productName.includes('male'))) {
          return false
        }
      }
      
      // Price range filter
      if (selectedPriceRange !== 'all') {
        // Extract numeric part from formatted price like "$123.45"
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
  const useMockData = false
  
  const handleItemSelect = (item: ClothingItem) => {
    setSelectedItem(item)
  }
  
  const handleContinue = () => {
    if (selectedItem) {
      onItemSelect(selectedItem)
    }
  }

  const handleBack = () => {
    onBack()
  }
  
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
            
            {/* Show detailed error information for debugging */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                <pre className="text-xs text-red-600 whitespace-pre-wrap break-words">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Show search parameters for debugging */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-sm font-medium text-gray-800 mb-2">Search Parameters:</p>
              <div className="text-xs text-gray-600 space-y-1">
                <p>Query: "{finalSearchQuery}"</p>
                <p>Filters: {JSON.stringify(filters)}</p>
                <p>Company: {company?.name || 'undefined'}</p>
                <p>Style: {company?.name || 'undefined'}</p>
                <p>SubStyle: {company?.name || 'undefined'}</p>
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
        
        {/* Header with selection summary */}
        <div className="text-center mb-6 mt-8">
          <h1 className="text-2xl font-bold text-white mb-2">Select Item</h1>
        </div>
        
        {/* Filter Options */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
          <h3 className="text-white font-semibold mb-3 text-center">Filter Options</h3>
          
          {/* Category Filter */}
          <div className="mb-3">
            <label className="block text-white/80 text-sm mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <option value="">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            {/* Show available categories info */}
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
          
          {/* Gender Filter */}
          <div className="mb-3">
            <label className="block text-white/80 text-sm mb-2">Gender</label>
            <div className="flex gap-2">
              {['all', 'men', 'women', 'unisex'].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setSelectedGender(gender)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedGender === gender
                      ? 'bg-white text-[#550cff]'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Price Range Filter */}
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
          
          {/* Clear Filters Button */}
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
        
        {/* Products count */}
        <div className="mb-4">
          <p className="text-sm text-white/80 text-center">
            {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        {/* Products grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {filteredProducts.map((item) => {
              const isSelected = selectedItem?.id === item.id
              
              return (
                <div
                  key={item.id}
                  className={`relative bg-white rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 shadow-lg scale-105' 
                      : 'hover:shadow-md hover:scale-102'
                  }`}
                  onClick={() => handleItemSelect(item)}
                >
                  {/* Product image */}
                  <div className="aspect-square mb-3 rounded-md overflow-hidden bg-gray-100">
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
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-2xl">👕</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Product info */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-xs">{item.brand}</p>
                    <p className="font-semibold text-blue-600 text-sm">{item.price}</p>
                    
                    {/* Sizes and colors */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.sizes.length > 0 ? (
                        <>
                          {item.sizes.slice(0, 3).map((size) => (
                            <span
                              key={size}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {size}
                            </span>
                          ))}
                          {item.sizes.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{item.sizes.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">
                          One Size
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
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
                ? "No items match your current filters. Try adjusting your filter selections or clearing all filters."
                : "We couldn't find any items matching your criteria. This might be because the Shopify store doesn't have products matching your selections, or there might be a connection issue."
              }
            </p>
            <button
              onClick={handleBack}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adjust Selections
            </button>
          </div>
        )}
        
        {/* Continue button */}
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
