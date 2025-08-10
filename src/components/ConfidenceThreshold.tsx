import React from 'react'
import { MeasurementValidation, PoseConfidenceRequirement } from '../types'

interface ConfidenceThresholdProps {
  validation: MeasurementValidation
  requirements: PoseConfidenceRequirement[]
  isVisible: boolean
  poseStability?: {
    isStable: boolean
    stabilityScore: number
    relevantLandmarks: number[]
  } | null
}

export function ConfidenceThreshold({ 
  validation, 
  requirements, 
  isVisible,
  poseStability
}: ConfidenceThresholdProps) {
  if (!isVisible) return null

  const overallProgress = validation.progress
  const isComplete = validation.isValid
  const isStable = poseStability?.isStable ?? false
  const stabilityScore = poseStability?.stabilityScore ?? 0

  return (
    <div className="absolute top-4 left-4 right-4 z-20">
      <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3 mb-2">
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

        {/* Stability Indicator */}
        {poseStability && (
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <div className="w-full bg-white/20 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isStable ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${stabilityScore * 100}%` }}
                />
              </div>
            </div>
            
            {/* Stability Status */}
            <div className="text-white text-xs font-medium min-w-[4rem] text-right">
              {isStable ? 'Stable' : 'Unstable'}
            </div>
            
            {/* Stability Indicator */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isStable ? 'bg-green-400' : 'bg-red-400'
            }`} />
          </div>
        )}
      </div>
    </div>
  )
}
