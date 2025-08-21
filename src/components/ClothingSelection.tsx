
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
    const terms = []
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
    
    // Only add category filter if we have a style - keep it simple
    // This logic is now redundant as style and subStyle are removed
    // if (style?.name) {
    //   // Use a single item array for now
    //   filters.category = [style.name.toLowerCase()]
    // }
    
    // Skip gender filter for now to test basic functionality
    // We can add it back once we confirm the basic search works
    
    return filters
  }, [])

  // Use the official Shopify Minis SDK hook
  const { products: shopifyProducts, loading, error } = useProductSearch({
    query: finalSearchQuery,
    // Temporarily disable filters to test basic search
    // filters,
    sortBy: 'RELEVANCE' as ProductSearchSortBy,
    first: 50,
    includeSensitive: false
  })

  // Transform Shopify products to our ClothingItem format
  const products: ClothingItem[] = useMemo(() => {
    if (!shopifyProducts) return []
    
    return shopifyProducts.map((product) => ({
      id: product.id,
      name: product.title,
      brand: product.shop.name,
      style: 'Unknown', // style and subStyle are removed
      subStyle: 'Unknown',
      price: product.price.amount ? `${product.price.currencyCode} ${product.price.amount}` : 'Price not available',
      image: product.featuredImage?.url || '',
      colors: [], // Extract from variants if available
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], // Default sizes for now
      companyId: product.shop.id,
      styleId: '', // style and subStyle are removed
      subStyleId: '',
      shopifyProduct: product // Keep reference to original Shopify data
    }))
  }, [shopifyProducts])

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      if (selectedCategory && !product.name.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false
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
  const useMockData = false // We're using real Shopify data now
  
  // Helper function to get match quality indicator
  const getMatchQuality = () => {
    if (!company) return 'all'
    
    const exactMatches = products.filter(product => 
      product.brand === company.name
    )
    
    if (exactMatches.length > 0) return 'exact'
    
    const partialMatches = products.filter(product => {
      let score = 0
      if (product.brand === company.name) score++
      return score >= 1
    })
    
    if (partialMatches.length > 0) return 'partial'
    return 'fallback'
  }
  
  const matchQuality = getMatchQuality()
  
  // Helper function to build search query display (now uses the same logic as the actual search)
  const getSearchQueryDisplay = () => finalSearchQuery
  
  const handleItemSelect = (item: ClothingItem) => {
    setSelectedItem(item)
  }
  
  const handleContinue = () => {
    if (selectedItem) {
      // Call the parent's onItemSelect to handle the selection
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
              <option value="shirts">Shirts</option>
              <option value="pants">Pants</option>
              <option value="dresses">Dresses</option>
              <option value="shoes">Shoes</option>
              <option value="accessories">Accessories</option>
              <option value="outerwear">Outerwear</option>
            </select>
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
              const isExactMatch = company && 
                item.brand === company.name
              
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
                  {/* Exact match indicator */}
                  {isExactMatch && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Perfect Match
                    </div>
                  )}
                  
                  {/* Product image */}
                  <div className="aspect-square mb-3 rounded-md overflow-hidden bg-gray-100">
                    {item.image ? (
                      <ProductImage src={item.image} alt={item.name} className="w-full h-full" />
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
                      {item.sizes.slice(0, 3).map((size, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {size}
                        </span>
                      ))}
                      {item.sizes.length > 3 && (
                        <span className="text-xs text-gray-500">+{item.sizes.length - 3}</span>
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


