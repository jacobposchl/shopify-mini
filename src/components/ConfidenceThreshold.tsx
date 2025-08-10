import React from 'react'
import { MeasurementValidation, PoseConfidenceRequirement } from '../types'

interface ConfidenceThresholdProps {
  validation: MeasurementValidation
  requirements: PoseConfidenceRequirement[]
  isVisible: boolean
  stabilityProgress?: number // Add stability progress from pose stability hook
}

export function ConfidenceThreshold({ 
  validation, 
  requirements, 
  isVisible,
  stabilityProgress
}: ConfidenceThresholdProps) {
  if (!isVisible) return null

  // Use stability progress if available, otherwise fall back to validation progress
  const overallProgress = stabilityProgress !== undefined ? stabilityProgress : validation.progress
  const isComplete = stabilityProgress !== undefined ? stabilityProgress >= 1.0 : validation.isValid

  return (
    <div className="absolute top-4 left-4 right-4 z-20">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isComplete ? 'bg-green-400' : 'bg-blue-400'
                }`}
                style={{ width: `${overallProgress * 100}%` }}
              />
            </div>
          </div>
          
          {/* Progress Percentage */}
          <div className="text-white text-sm font-medium min-w-[3rem] text-right">
            {Math.round(overallProgress * 100)}%
          </div>
          
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isComplete ? 'bg-green-400' : 'bg-yellow-400'
          }`} />
        </div>
      </div>
    </div>
  )
}
