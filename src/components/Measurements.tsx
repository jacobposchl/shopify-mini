import { useState } from 'react'
import { Measurements } from '../types'

interface MeasurementsStepProps {
  onMeasurementsComplete: (measurements: Measurements) => void
  selectedItemName?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
}

export function MeasurementsStep({
  onMeasurementsComplete,
  selectedItemName,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName
}: MeasurementsStepProps) {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStartCamera = () => {
    setIsCameraActive(true)
    setIsProcessing(true)
    
    // Simulate camera processing and measurements
    setTimeout(() => {
      const mockMeasurements: Measurements = {
        chest: 42,
        waist: 32,
        hips: 38,
        shoulders: 18,
        armLength: 25,
        inseam: 32,
        height: 70,
        weight: 165
      }
      setMeasurements(mockMeasurements)
      setIsProcessing(false)
    }, 3000)
  }

  const handleContinue = () => {
    if (measurements) {
      onMeasurementsComplete(measurements)
    }
  }

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
            <span className="text-sm text-gray-500">{selectedSubStyleName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium text-blue-600">Step 5 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Get Your Measurements</h1>
          <p className="text-sm text-gray-500">We'll use your camera to measure you perfectly</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {!isCameraActive ? (
          <div className="text-center">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Camera Measurements
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Stand 6 feet away from your camera in good lighting. We'll use AI to measure your body for the perfect fit.
              </p>
              <button
                onClick={handleStartCamera}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Start Camera
              </button>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Tips for best results:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Wear form-fitting clothing</li>
                <li>• Stand in good lighting</li>
                <li>• Keep your arms slightly away from your body</li>
                <li>• Look straight ahead</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {isProcessing ? (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Measurements
                </h2>
                <p className="text-sm text-gray-500">
                  Please stay still while we analyze your measurements...
                </p>
              </div>
            ) : measurements ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Measurements
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.chest}"</p>
                      <p className="text-sm text-gray-500">Chest</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.waist}"</p>
                      <p className="text-sm text-gray-500">Waist</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.hips}"</p>
                      <p className="text-sm text-gray-500">Hips</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.shoulders}"</p>
                      <p className="text-sm text-gray-500">Shoulders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.armLength}"</p>
                      <p className="text-sm text-gray-500">Arm Length</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{measurements.inseam}"</p>
                      <p className="text-sm text-gray-500">Inseam</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContinue}
                  className="w-full bg-white text-black py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
                >
                  Continue to Recommendations
                </button>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}
