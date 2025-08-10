import { SubStyle } from '../types'
import { subStyles } from '../data/mockData'

interface SubStyleSelectionProps {
  onSubStyleSelect: (subStyle: SubStyle) => void
  selectedSubStyle?: SubStyle
  selectedStyleId?: string
  selectedCompanyName?: string
  selectedStyleName?: string
}

export function SubStyleSelection({ 
  onSubStyleSelect, 
  selectedSubStyle, 
  selectedStyleId,
  selectedCompanyName,
  selectedStyleName
}: SubStyleSelectionProps) {
  // Filter sub-styles based on selected style
  const availableSubStyles = subStyles.filter(subStyle => subStyle.styleId === selectedStyleId)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm text-gray-500">{selectedCompanyName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">{selectedStyleName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium text-blue-600">Step 3 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Choose Your Fit</h1>
          <p className="text-sm text-gray-500">What specific style are you looking for?</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="grid grid-cols-1 gap-3">
          {availableSubStyles.map((subStyle) => (
            <button
              key={subStyle.id}
              onClick={() => onSubStyleSelect(subStyle)}
              className={`bg-white rounded-lg shadow-sm p-4 transition-all text-left ${
                selectedSubStyle?.id === subStyle.id
                  ? 'ring-2 ring-blue-500 shadow-md'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {subStyle.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {subStyle.description}
                  </p>
                </div>
                {selectedSubStyle?.id === subStyle.id && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        {selectedSubStyle && (
          <div className="mt-8">
            <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Continue with {selectedSubStyle.name}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
