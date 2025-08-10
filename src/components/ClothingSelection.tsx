import React from 'react'
import { ClothingItem } from '../types'
import { clothingItems } from '../data/mockData'

interface ClothingSelectionProps {
  onItemSelect: (item: ClothingItem) => void
  selectedItem?: ClothingItem
  selectedCompanyId?: string
  selectedStyleId?: string
  selectedSubStyleId?: string
  selectedCompanyName?: string // kept for compatibility; not rendered
  selectedStyleName?: string   // kept for compatibility; not rendered
  selectedSubStyleName?: string// kept for compatibility; not rendered
  onBack?: () => void
}

export function ClothingSelection({
  onItemSelect,
  selectedItem,
  selectedCompanyId,
  selectedStyleId,
  selectedSubStyleId,
  onBack,
}: ClothingSelectionProps) {
  const filteredItems = clothingItems.filter(item => {
    const matchesCompany = selectedCompanyId ? item.companyId === selectedCompanyId : true
    const matchesStyle = selectedStyleId ? item.styleId === selectedStyleId : true
    const matchesSubStyle = selectedSubStyleId ? item.subStyleId === selectedSubStyleId : true
    return matchesCompany && matchesStyle && matchesSubStyle
  })

  const displayItems = filteredItems.length > 0 ? filteredItems : clothingItems

  return (
    <div className="min-h-screen bg-[#550cff]">
      {/* Header (Back absolute; centered; only Step shown) */}
      <header className="relative bg-transparent">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 text-gray-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm">Back</span>
          </button>
        )}

        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-white">Step 4 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-white">Choose Your Item</h1>
          <p className="text-sm text-white/80">Select the perfect item for you</p>
          {filteredItems.length === 0 && clothingItems.length > 0 && (
            <p className="text-xs text-white/80 mt-1">
              Showing all items (no filtered matches found)
            </p>
          )}
        </div>
      </header>

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
          <div className="text-center py-12 text-white">
            <svg className="mx-auto h-12 w-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4-0.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium">No items found</h3>
            <p className="mt-1 text-sm text-white/80">Try adjusting your selections to find more options.</p>
          </div>
        )}
      </main>
    </div>
  )
}


