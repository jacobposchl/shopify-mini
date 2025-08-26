import React from 'react'

type Props = { onClick: () => void; label?: string; className?: string; variant?: 'default' | 'minimal'; iconSize?: number }

export function BackButton({
  onClick,
  label = 'Back',
  className = '',
  variant = 'default',
  iconSize = 16,
}: Props) {
  if (variant === 'minimal') {
    // compute stroke width to remain proportional as icon grows
    const strokeWidth = iconSize >= 24 ? 3.6 : iconSize >= 20 ? 3.2 : iconSize >= 18 ? 3.0 : iconSize >= 16 ? 2.8 : 2.2

    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-150 ${className}`}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/90 text-gray-800 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-[#550cff] transition-all duration-200 hover:shadow-sm ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-600">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-sm font-medium tracking-wide">{label}</span>
    </button>
  )
}
