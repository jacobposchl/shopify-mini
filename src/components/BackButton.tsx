

type Props = { onClick: () => void; label?: string; className?: string }

export function BackButton({ onClick, label = 'Back', className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 text-gray-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black/10 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-sm">{label}</span>
    </button>
  )
}
