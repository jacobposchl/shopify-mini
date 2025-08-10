import React from 'react'
import type { Style } from '../types'
import { styles } from '../data/mockData'

interface StyleSelectionProps {
  onStyleSelect: (style: Style) => void
  selectedStyle?: Style
  selectedCompanyName?: string // not rendered
  onBack?: () => void
}

export function StyleSelection({
  onStyleSelect,
  selectedStyle,
  onBack,
}: StyleSelectionProps) {
  return (
    <div className="min-h-screen bg-[#550cff]">
      {/* Header (Back absolute; title centered; only Step shown) */}
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
            <span className="text-sm font-medium text-white">Step 2 of 6</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Choose Your Style</h1>
          <p className="text-sm text-white/80">What type of clothing are you looking for?</p>
        </div>
      </header>

      {/* Transparent tiles with white outline */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {styles.map((style) => {
            const isSelected = selectedStyle?.id === style.id
            const imgSrc = (isSelected && (style as any).iconSelectedUrl)
              ? (style as any).iconSelectedUrl
              : (style as any).iconUrl

            return (
              <button
                key={style.id}
                onClick={() => onStyleSelect(style)}
                aria-pressed={isSelected}
                aria-label={`${style.name}${isSelected ? ' selected' : ''}`}
                className={[
                  'rounded-2xl border-2 bg-transparent',
                  'transition-all focus:outline-none',
                  'border-white/70 hover:border-white/90 focus:ring-2 focus:ring-white/40',
                  isSelected ? 'ring-2 ring-white border-white bg-white/10' : '',
                  'px-4 py-6' // internal padding to mimic card
                ].join(' ')}
              >
                <div className="text-center flex flex-col items-center">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={style.name}
                      width={64}
                      height={64}
                      className="style-icon mb-3"
                      loading="eager"
                    />
                  ) : (
                    <span className="text-4xl mb-3 text-white" aria-hidden>
                      {(style as any).icon}
                    </span>
                  )}
                  <h3 className="font-semibold text-white text-xl md:text-2xl leading-tight mb-1">
                    {style.name}
                  </h3>
                  {(style as any).description ? (
                    <p className="text-sm text-white/80">{(style as any).description}</p>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  )
}
