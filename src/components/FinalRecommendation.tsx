import { Recommendation } from '../types'

// TODO: Replace mock data with real Shopify product data
// To fix the image issue and get proper Nike product photos:
// 1. Install @shopify/shop-minis-react if not already installed
// 2. Use useProducts() hook to fetch real product data
// 3. Replace the mock recommendation with real Shopify product data
// 4. Real product images will come from Shopify's CDN with proper product photos

interface FinalRecommendationProps {
  recommendation: Recommendation
  onStartOver: () => void
  onAddToCart: () => void
}

export function FinalRecommendation({ 
  recommendation, 
  onStartOver, 
  onAddToCart 
}: FinalRecommendationProps) {
  const { item, recommendedSize, confidence, measurements } = recommendation

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-green-600">Step 6 of 6</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500">Complete</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Your Perfect Fit</h1>
          <p className="text-sm text-gray-500">Based on your preferences and measurements</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <div className="space-y-6">


          {/* Product Card */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-64 object-cover"
              />
              <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                Recommended Size: {recommendedSize}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {item.name}
              </h2>
              <p className="text-2xl font-bold text-blue-600 mb-4">
                {item.price}
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Brand</span>
                  <span className="text-sm font-medium text-gray-900">{item.brand}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Style</span>
                  <span className="text-sm font-medium text-gray-900">{item.style}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fit</span>
                  <span className="text-sm font-medium text-gray-900">{item.subStyle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Recommended Size</span>
                  <span className="text-sm font-medium text-blue-600">{recommendedSize}</span>
                </div>
              </div>

              {/* Color Options */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Available Colors</h3>
                <div className="flex space-x-2">
                  {item.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: color.toLowerCase() }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Measurements Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Measurements Used
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {measurements.chest > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.chest}"</p>
                  <p className="text-sm text-gray-500">Chest</p>
                </div>
              )}
              {measurements.waist > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.waist}"</p>
                  <p className="text-sm text-gray-500">Waist</p>
                </div>
              )}
              {measurements.hips > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.hips}"</p>
                  <p className="text-sm text-gray-500">Hips</p>
                </div>
              )}
              {measurements.shoulders > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.shoulders}"</p>
                  <p className="text-sm text-gray-500">Shoulders</p>
                </div>
              )}
              {measurements.armLength > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.armLength}"</p>
                  <p className="text-sm text-gray-500">Arm Length</p>
                </div>
              )}
              {measurements.inseam > 0 && (
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{measurements.inseam}"</p>
                  <p className="text-sm text-gray-500">Inseam</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAddToCart}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Add to Cart - {item.price}
            </button>
            <button
              onClick={onStartOver}
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
