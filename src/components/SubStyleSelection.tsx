import React from 'react'
import type { SubStyle } from '../types'
import { subStyles } from '../data/mockData'

interface SubStyleSelectionProps {
  onSubStyleSelect: (sub: SubStyle) => void
  selectedSubStyle?: SubStyle
  selectedStyleId?: string
  onBack?: () => void
}

// Fallback icons for common substyles (safe, simple line icons)
// Add/remove keys as needed. You can swap any URL to your own assets.
const FALLBACK_SUBSTYLE_IMAGES: Record<string, string> = {
  // Shirts
  'crew-neck':    'https://cdn-icons-png.flaticon.com/512/892/892458.png',
  'v-neck':       'https://cdn-icons-png.flaticon.com/512/892/892458.png',
  'button-down':  'https://cdn-icons-png.flaticon.com/512/892/892466.png',
  'polo':         'https://cdn-icons-png.flaticon.com/512/892/892464.png',

  // Pants
  'jeans':        'https://cdn-icons-png.flaticon.com/512/3531/3531748.png',
  'joggers':      'https://cdn-icons-png.flaticon.com/512/3531/3531748.png',
  'dress-pants':  'https://cdn-icons-png.flaticon.com/512/3531/3531748.png',
  'leggings':     'https://cdn-icons-png.flaticon.com/512/4860/4860401.png',

  // Shorts
  'athletic-shorts': 'https://cdn-icons-png.flaticon.com/512/120/120041.png',
  'casual-shorts':   'https://cdn-icons-png.flaticon.com/512/120/120041.png',
  'dress-shorts':    'https://cdn-icons-png.flaticon.com/512/120/120041.png',

  // Jackets
  'hoodie':       'https://cdn-icons-png.flaticon.com/512/2641/2641333.png',
  'blazer':       'https://cdn-icons-png.flaticon.com/512/892/892466.png',
  'windbreaker':  'https://cdn-icons-png.flaticon.com/512/2641/2641333.png',

  // Dresses
  'casual-dress': 'https://cdn-icons-png.flaticon.com/512/892/892463.png',
  'formal-dress': 'https://cdn-icons-png.flaticon.com/512/892/892463.png',

  // Activewear
  'compression':  'https://cdn-icons-png.flaticon.com/512/4860/4860401.png',
  'loose-fit':    'https://cdn-icons-png.flaticon.com/512/4860/4860401.png',
}

export function SubStyleSelection({
  onSubStyleSelect,
  selectedSubStyle,
  selectedStyleId,
  onBack,
}: SubStyleSelectionProps) {
  // Filter sub-styles for the chosen style (shirts/pants/shorts/jackets/etc.)
  const options = React.useMemo(
    () => subStyles.filter((s) => s.styleId === selectedStyleId),
    [selectedStyleId]
  )

  return (
    <div className="min-h-screen bg-[#550cff]">
      {/* Header (mirrors Step 2) */}
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
          <h1 className="text-2xl font-extrabold text-white">Choose Specific Style</h1>
          <p className="text-sm text-white/80">Pick the cut that fits you best</p>
        </div>
      </header>

      {/* Transparent tiles with white outline + white text */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => {
            const isSelected = selectedSubStyle?.id === opt.id
            // Prefer subStyle.imageUrl (from mockData) else fallback map
            const imgSrc =
              (opt as any).imageUrl ||
              FALLBACK_SUBSTYLE_IMAGES[opt.id]

            return (
              <button
                key={opt.id}
                onClick={() => onSubStyleSelect(opt)}
                aria-pressed={isSelected}
                aria-label={`${opt.name}${isSelected ? ' selected' : ''}`}
                className={[
                  'rounded-2xl border-2 bg-transparent',
                  'transition-all focus:outline-none',
                  'border-white/70 hover:border-white/90 focus:ring-2 focus:ring-white/40',
                  isSelected ? 'ring-2 ring-white border-white bg-white/10' : '',
                  'px-4 py-6'
                ].join(' ')}
              >
                <div className="text-center flex flex-col items-center">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={opt.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain mb-3"
                      loading="eager"
                    />
                  ) : null}
                  <h3 className="font-semibold text-white text-xl md:text-2xl leading-tight mb-1">
                    {opt.name}
                  </h3>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
