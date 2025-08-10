
import { useState, useMemo } from 'react'
import { useProductSearch } from '@shopify/shop-minis-react'
import { BackButton } from './BackButton'
import { ProductImage } from './ProductImage'
import type { ClothingItem, Company, Style, SubStyle } from '../types'
import type { ProductFilters, ProductSearchSortBy } from '@shopify/shop-minis-react'

interface ClothingSelectionProps {
  onBack: () => void
  onItemSelect: (item: ClothingItem) => void
  selectedCompany?: Company
  selectedStyle?: Style
  selectedSubStyle?: SubStyle
}

export function ClothingSelection({ onBack, onItemSelect, selectedCompany, selectedStyle, selectedSubStyle }: ClothingSelectionProps) {
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null)
  
  // Get user selections from previous steps (now passed as props)
  const company = selectedCompany
  const style = selectedStyle
  const subStyle = selectedSubStyle
  
  // Build search query and filters for Shopify
  const searchQuery = useMemo(() => {
    const terms = []
    if (company?.name) terms.push(company.name)
    if (style?.name) terms.push(style.name)
    if (subStyle?.name) terms.push(subStyle.name)
    
    if (terms.length === 0) {
      return 'clothing apparel'
    }
    
    return terms.join(' ')
  }, [company?.name, style?.name, subStyle?.name])

  // Ensure we have a valid search query
  const finalSearchQuery = searchQuery.trim() || 'clothing apparel'

  const filters: ProductFilters = useMemo(() => {
    const filters: ProductFilters = {}
    
    // Only add category filter if we have a style - keep it simple
    if (style?.name) {
      // Use a single item array for now
      filters.category = [style.name.toLowerCase()]
    }
    
    // Skip gender filter for now to test basic functionality
    // We can add it back once we confirm the basic search works
    
    return filters
  }, [style?.name])

  // Use the official Shopify Minis SDK hook
  const { products: shopifyProducts, loading, error } = useProductSearch({
    query: finalSearchQuery,
    // Temporarily disable filters to test basic search
    // filters,
    sortBy: 'RELEVANCE' as ProductSearchSortBy,
    first: 50,
    includeSensitive: false
  })

  // Debug logging for troubleshooting
  console.log('ClothingSelection - useProductSearch params:', {
    query: finalSearchQuery,
    filters,
    sortBy: 'RELEVANCE',
    first: 50,
    includeSensitive: false
  })
  
  console.log('ClothingSelection - Filter details:', {
    filtersObject: filters,
    filtersKeys: Object.keys(filters),
    filtersValues: Object.values(filters),
    filtersStringified: JSON.stringify(filters),
    styleName: style?.name,
    styleId: style?.id
  })
  
  console.log('ClothingSelection - useProductSearch result:', {
    products: shopifyProducts,
    loading,
    error,
    productsCount: shopifyProducts?.length || 0
  })

  // Transform Shopify products to our ClothingItem format
  const products: ClothingItem[] = useMemo(() => {
    if (!shopifyProducts) return []
    
    return shopifyProducts.map((product) => ({
      id: product.id,
      name: product.title,
      brand: product.shop.name,
      style: style?.name || 'Unknown',
      subStyle: subStyle?.name || 'Unknown',
      price: product.price.amount ? `${product.price.currencyCode} ${product.price.amount}` : 'Price not available',
      image: product.featuredImage?.url || '',
      colors: [], // Extract from variants if available
      sizes: [], // Extract from variants if available
      companyId: product.shop.id,
      styleId: style?.id || '',
      subStyleId: subStyle?.id || '',
      shopifyProduct: product // Keep reference to original Shopify data
    }))
  }, [shopifyProducts, style?.name, style?.id, subStyle?.name, subStyle?.id])

  const isLoading = loading
  const useMockData = false // We're using real Shopify data now
  
  // Helper function to get match quality indicator
  const getMatchQuality = () => {
    if (!company || !style || !subStyle) return 'all'
    
    const exactMatches = products.filter(product => 
      product.brand === company.name &&
      product.style === style.name &&
      product.subStyle === subStyle.name
    )
    
    if (exactMatches.length > 0) return 'exact'
    
    const partialMatches = products.filter(product => {
      let score = 0
      if (product.brand === company.name) score++
      if (product.style === style.name) score++
      if (product.subStyle === subStyle.name) score++
      return score >= 2
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
                <p>Style: {style?.name || 'undefined'}</p>
                <p>SubStyle: {subStyle?.name || 'undefined'}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md mx-auto p-4">
        <BackButton onClick={handleBack} />
        
        {/* Header with selection summary */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Step 4: Choose Your Items</h1>

          
          
          
          
          
          {/* Search query and filters display */}
          <div className="space-y-2 mb-4">
            <div className="text-center space-y-1">
              {style?.name && (
                <div className="text-xs text-gray-500">
                  Category: {style.name} • Gender: {style.name.toLowerCase().includes('dress') || style.name.toLowerCase().includes('suit') ? 'Male' : style.name.toLowerCase().includes('dress') || style.name.toLowerCase().includes('skirt') ? 'Female' : 'Neutral'}
                </div>
              )}
               {/* Show when using fallback products */}
               {!shopifyProducts && (
                 <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                   No products found from main search
                 </div>
               )}
            </div>
            
          </div>
        </div>
        
        {/* Products count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 text-center">
            {products.length} item{products.length !== 1 ? 's' : ''} available
          </p>
        </div>
        
        {/* Products grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {products.map((item) => {
              const isSelected = selectedItem?.id === item.id
              const isExactMatch = company && style && subStyle && 
                item.brand === company.name &&
                item.style === style.name &&
                item.subStyle === subStyle.name
              
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
                      <ProductImage src={item.image} alt={item.name} />
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
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No items found</h3>
                         <p className="text-gray-600 mb-4">
               We couldn't find any items matching your exact criteria. This might be because the Shopify store doesn't have products matching your selections, or there might be a connection issue.
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
                Continue with {selectedItem.name}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


