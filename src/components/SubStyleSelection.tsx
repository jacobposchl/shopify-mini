// src/components/SubStyleSelection.tsx
import React from 'react'
import type { SubStyle } from '../types'
import { subStyles } from '../data/mockData'
import { BackButton } from './BackButton'

interface SubStyleSelectionProps {
  onSubStyleSelect: (sub: SubStyle) => void
  selectedSubStyle?: SubStyle
  selectedStyleId?: string
  onBack?: () => void
}

export function SubStyleSelection({
  onSubStyleSelect,
  selectedSubStyle,
  selectedStyleId,
  onBack,
}: SubStyleSelectionProps) {
  const options = React.useMemo(
    () => subStyles.filter((s) => s.styleId === selectedStyleId),
    [selectedStyleId]
  )

  return (
    <div className="min-h-screen bg-[#550cff]">
      {/* Header (matches Step 2) */}
      <header className="relative bg-transparent">
        {onBack && (
          <div className="absolute top-3 left-3 z-10">
            <BackButton onClick={onBack} />
          </div>
        )}

        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-white">Step 3 of 6</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Choose Specific Style</h1>
          <p className="text-sm text-white/80">Pick the cut that fits you best</p>
        </div>
      </header>

      {/* Transparent tiles with white outline + white text (same as Step 2) */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => {
            const isSelected = selectedSubStyle?.id === opt.id
            const imgSrc =
              (isSelected && opt.iconSelectedUrl) ? opt.iconSelectedUrl : opt.iconUrl

            return (
              <button
                key={opt.id}
                onClick={() => onSubStyleSelect(opt)}
                aria-pressed={isSelected}
                aria-label={`${opt.name}${isSelected ? ' selected' : ''}`}
                className={[
                  'rounded-2xl border-2 bg-transparent',
                  'transition-all duration-150 ease-out focus:outline-none',
                  'border-white/70 hover:border-white/90 focus:ring-2 focus:ring-white/40',
                  'active:scale-95',
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
