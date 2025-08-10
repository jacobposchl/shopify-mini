import React from 'react'
import type { SubStyle } from '../types'
import { subStyles } from '../data/mockData'

interface SubStyleSelectionProps {
  onSubStyleSelect: (subStyle: SubStyle) => void
  selectedSubStyle?: SubStyle
  selectedStyleId?: string
  selectedCompanyName?: string // kept for compatibility; not rendered
  selectedStyleName?: string   // kept for compatibility; not rendered
  onBack?: () => void
}

export function SubStyleSelection({
  onSubStyleSelect,
  selectedSubStyle,
  selectedStyleId,
  onBack,
}: SubStyleSelectionProps) {
  const options = React.useMemo(
    () => subStyles.filter((s) => (selectedStyleId ? s.styleId === selectedStyleId : true)),
    [selectedStyleId]
  )

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
            <span className="text-sm font-medium text-white">Step 3 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-white">Choose Your Fit</h1>
          <p className="text-sm text-white/80">Pick the specific style that matches what you want.</p>
        </div>
      </header>

      <main className="px-4 py-6">
        {options.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const isSelected = selectedSubStyle?.id === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => onSubStyleSelect(opt)}
                  aria-pressed={isSelected}
                  aria-label={`${opt.name}${isSelected ? ' selected' : ''}`}
                  className={`bg-white rounded-lg overflow-hidden transition-all border focus:outline-none ${
                    isSelected
                      ? 'ring-2 ring-blue-500 border-blue-200 shadow-md'
                      : 'border-gray-200 hover:shadow-md focus:ring-2 focus:ring-black/10'
                  }`}
                >
                  <div className="p-6 text-center flex flex-col items-center">
                    <h3 className="font-semibold text-gray-900 text-lg md:text-xl leading-tight mb-1">
                      {opt.name}
                    </h3>
                    {opt.description ? (
                      <p className="text-sm text-gray-500">{opt.description}</p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-white">
            <svg className="mx-auto h-12 w-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium">No options found</h3>
            <p className="mt-1 text-sm text-white/80">Try a different clothing type.</p>
          </div>
        )}
      </main>
    </div>
  )
}
