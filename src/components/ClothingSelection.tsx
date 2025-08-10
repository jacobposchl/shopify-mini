// src/components/ClothingSelection.tsx
import React from 'react'
import type { ClothingItem } from '../types'
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
  onBack?: () => void // optional, if you use a back button pattern elsewhere
}

export function ClothingSelection({
  onItemSelect,
  selectedItem,
  selectedCompanyId,
  selectedStyleId,
  selectedSubStyleId,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName,
  onBack,
}: ClothingSelectionProps) {
  // Filter items based on selections
  const filteredItems = clothingItems.filter((item) => {
    const matchesCompany = selectedCompanyId ? item.companyId === selectedCompanyId : true
    const matchesStyle = selectedStyleId ? item.styleId === selectedStyleId : true
    const matchesSubStyle = selectedSubStyleId ? item.subStyleId === selectedSubStyleId : true
    return matchesCompany && matchesStyle && matchesSubStyle
  })

  const displayItems = filteredItems.length > 0 ? filteredItems : clothingItems

  return (
    <div className="min-h-screen bg-[#550cff]">
      {/* Header to match other steps */}
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
          <h1 className="text-2xl font-extrabold text-white">Choose Your Item</h1>
          <p className="text-sm text-white/80">Select the perfect item for you</p>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 py-6">
        {displayItems.length > 0 ? (
          <div className="space-y-4">
            {displayItems.map((item) => {
              const isSelected = selectedItem?.id === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onItemSelect(item)}
                  className={`w-full rounded-xl overflow-hidden bg-white transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-sm hover:shadow-md'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Grid ensures the media column stretches to card height */}
                  <div className="grid grid-cols-[96px_1fr]">
                    {/* Media column: full-height, no white gap */}
                    <div className="relative h-full">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 text-left">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-base mb-1">
                            {item.name}
                          </h3>
                          <p className="text-2xl font-bold text-gray-900 mb-2">
                            {item.price}
                          </p>

                          {/* Colors + sizes row */}
                          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              {item.colors.slice(0, 3).map((color, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block w-3 h-3 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color.toLowerCase() }}
                                />
                              ))}
                              {item.colors.length > 3 && (
                                <span className="text-xs text-gray-500">+{item.colors.length - 3}</span>
                              )}
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{item.sizes.join(', ')}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="ml-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white/90">
            <h3 className="mt-2 text-sm font-medium">No items found</h3>
            <p className="mt-1 text-sm opacity-80">
              Try adjusting your selections to find more options.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
