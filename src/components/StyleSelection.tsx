import { Style } from '../types'
import { styles } from '../data/mockData'

interface StyleSelectionProps {
  onStyleSelect: (style: Style) => void
  selectedStyle?: Style
  selectedCompanyName?: string
}

export function StyleSelection({ onStyleSelect, selectedStyle, selectedCompanyName }: StyleSelectionProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-gray-500">{selectedCompanyName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium text-blue-600">Step 2 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Choose Your Style</h1>
          <p className="text-sm text-gray-500">What type of clothing are you looking for?</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {styles.map((style) => (
            <button
              key={style.id}
              onClick={() => onStyleSelect(style)}
              className={`bg-white rounded-lg shadow-sm overflow-hidden transition-all ${
                selectedStyle?.id === style.id
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="p-6 text-center">
                <div className="text-4xl mb-3">{style.icon}</div>
                <h3 className="font-semibold text-gray-900 text-xl md:text-2xl leading-tight mb-1">
                  {style.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {style.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        {selectedStyle && (
          <div className="mt-8">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Continue with {selectedStyle.name}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
