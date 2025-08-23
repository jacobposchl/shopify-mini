import React, { useState } from 'react'
import { BackButton } from './BackButton'

interface HeightInputStepProps {
  onHeightSubmit: (height: number) => void
  onBack: () => void
  selectedItemName?: string
  selectedCompanyName?: string
}

export function HeightInputStep({
  onHeightSubmit,
  onBack,
  selectedItemName,
  selectedCompanyName,
}: HeightInputStepProps) {
  const [heightFeet, setHeightFeet] = useState<number>(5)
  const [heightInches, setHeightInches] = useState<number>(8)
  const [error, setError] = useState<string>('')

  const handleSubmit = () => {
    if (heightFeet < 3 || heightFeet > 8) {
      setError('Please enter a valid height between 3 and 8 feet')
      return
    }
    if (heightInches < 0 || heightInches > 11) {
      setError('Please enter a valid height in inches (0-11)')
      return
    }

    const totalHeightInches = (heightFeet * 12) + heightInches
    onHeightSubmit(totalHeightInches)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#550cff]">
      {/* Header - matches style of other pages */}
      <header className="relative bg-transparent">
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={onBack} />
        </div>

        <div className="px-4 pt-16 pb-4 text-center">
          <h1 className="text-xl font-bold text-white">Enter Your Height</h1>
          <p className="text-sm text-white/80">
            We'll use this to get accurate measurements
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden bg-black rounded-t-3xl">
        <div className="flex flex-col items-center justify-center min-h-full p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Height</h2>
              <p className="text-gray-600">
                This helps us calculate accurate measurements from your camera
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height-feet" className="block text-sm font-medium text-gray-700 mb-2">
                    Feet
                  </label>
                  <select
                    id="height-feet"
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 6 }, (_, i) => i + 3).map(feet => (
                      <option key={feet} value={feet}>{feet}'</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="height-inches" className="block text-sm font-medium text-gray-700 mb-2">
                    Inches
                  </label>
                  <select
                    id="height-inches"
                    value={heightInches}
                    onChange={(e) => setHeightInches(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i).map(inches => (
                      <option key={inches} value={inches}>{inches}"</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {heightFeet}' {heightInches}"
                </p>
                <p className="text-sm text-gray-500">
                  ({((heightFeet * 12) + heightInches).toFixed(0)} inches total)
                </p>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to Measurements
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
