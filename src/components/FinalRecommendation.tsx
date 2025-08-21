import { useState } from 'react'

// Define the types since they're imported from '../types'
interface Item {
  name: string
  price: string
  brand: string
  style: string
  subStyle: string
  image: string
  colors: string[]
}

interface Measurements {
  chest: number
  waist: number
  hips: number
  shoulders: number
  armLength: number
  inseam: number
}

interface Recommendation {
  item: Item
  recommendedSize: string
  confidence: number
  measurements: Measurements
}

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
  const [rating, setRating] = useState(0)
  const [hasRated, setHasRated] = useState(false)

  const handleSubmitRating = () => {
    setHasRated(true)
  }

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-8 h-8 transition-colors duration-200 ${
        filled ? 'text-yellow-400' : 'text-gray-300'
      }`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[#550cff] shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-2 mb-1">
          </div>
          <h1 className="text-xl font-bold text-white">Your Perfect Fit</h1>
          <p className="text-sm text-white/80">Based on your preferences and measurements</p>
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

          {/* Rating Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rate Your Experience
            </h3>
            {!hasRated ? (
              <>
                <p className="text-gray-600 mb-4">
                  How accurate was your sizing?
                </p>
                <div className="flex justify-center space-x-3 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transform transition-transform hover:scale-110 focus:outline-none"
                    >
                      <StarIcon filled={rating >= star} />
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleSubmitRating}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    rating > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={rating === 0}
                >
                  Submit Rating
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🎉</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Thanks for your feedback!
                </h4>
                <p className="text-gray-600">
                  Your rating helps us improve the experience for everyone.
                </p>
              </div>
            )}
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