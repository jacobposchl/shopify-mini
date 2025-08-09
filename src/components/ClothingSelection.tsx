import { ClothingItem } from '../types'
import { clothingItems } from '../data/mockData'

interface ClothingSelectionProps {
  onItemSelect: (item: ClothingItem) => void
  selectedItem?: ClothingItem
  selectedCompanyId?: string
  selectedStyleId?: string
  selectedSubStyleId?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
}

export function ClothingSelection({
  onItemSelect,
  selectedItem,
  selectedCompanyId,
  selectedStyleId,
  selectedSubStyleId,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName
}: ClothingSelectionProps) {
  // Debug logging
  console.log('ClothingSelection Debug:', {
    selectedCompanyId,
    selectedStyleId,
    selectedSubStyleId,
    totalItems: clothingItems.length
  })

  // Filter clothing items based on user selections
  const filteredItems = clothingItems.filter(item => {
    const matchesCompany = selectedCompanyId ? item.companyId === selectedCompanyId : true
    const matchesStyle = selectedStyleId ? item.styleId === selectedStyleId : true
    const matchesSubStyle = selectedSubStyleId ? item.subStyleId === selectedSubStyleId : true
    
    console.log('Item filter check:', {
      itemName: item.name,
      itemCompanyId: item.companyId,
      itemStyleId: item.styleId,
      itemSubStyleId: item.subStyleId,
      matchesCompany,
      matchesStyle,
      matchesSubStyle
    })
    
    return matchesCompany && matchesStyle && matchesSubStyle
  })

  console.log('Filtered items count:', filteredItems.length)

  // Use filtered items, or fall back to all items if none found (for debugging)
  const displayItems = filteredItems.length > 0 ? filteredItems : clothingItems

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-gray-500">{selectedCompanyName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{selectedStyleName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{selectedSubStyleName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium text-blue-600">Step 4 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Choose Your Item</h1>
          <p className="text-sm text-gray-500">Select the perfect item for you</p>
          {filteredItems.length === 0 && clothingItems.length > 0 && (
            <p className="text-xs text-orange-600 mt-1">
              Showing all items (no filtered matches found)
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {displayItems.length > 0 ? (
          <div className="space-y-4">
            {displayItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemSelect(item)}
                className={`w-full bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
                  selectedItem?.id === item.id
                    ? 'ring-2 ring-blue-500 shadow-md'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-4 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {item.name}
                        </h3>
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          {item.price}
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            {item.colors.slice(0, 3).map((color, index) => (
                              <div
                                key={index}
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: color.toLowerCase() }}
                              />
                            ))}
                            {item.colors.length > 3 && (
                              <span className="text-xs text-gray-500">+{item.colors.length - 3}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {item.sizes.join(', ')}
                          </span>
                        </div>
                      </div>
                      {selectedItem?.id === item.id && (
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center ml-3">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your selections to find more options.
            </p>
            {/* Debug info */}
            <div className="mt-4 text-xs text-gray-400">
              <p>Debug: Company ID: {selectedCompanyId}</p>
              <p>Debug: Style ID: {selectedStyleId}</p>
              <p>Debug: SubStyle ID: {selectedSubStyleId}</p>
              <p>Debug: Total items: {clothingItems.length}</p>
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedItem && (
          <div className="mt-8">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Continue with {selectedItem.name}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
