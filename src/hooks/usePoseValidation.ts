import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  PoseConfidenceRequirement, 
  MeasurementValidation,
  PoseResults 
} from '../types'
import { getPoseRequirements } from '../data/poseRequirements'

interface UsePoseValidationProps {
  poseResults: PoseResults | null
  selectedStyleId?: string
  onValidationComplete?: (validation: MeasurementValidation) => void
}

export function usePoseValidation({
  poseResults,
  selectedStyleId,
  onValidationComplete
}: UsePoseValidationProps) {
  const [validation, setValidation] = useState<MeasurementValidation>({
    isValid: false,
    confidence: 0,
    progress: 0,
    requirements: {},
    message: 'Waiting for pose detection...'
  })

  const requirementsRef = useRef<PoseConfidenceRequirement[]>([])
  const confidenceHistoryRef = useRef<Map<string, Array<{ confidence: number; timestamp: number }>>>(new Map())
  const lastUpdateRef = useRef<number>(0)

  // Get pose requirements for the selected style
  useEffect(() => {
    if (selectedStyleId) {
      requirementsRef.current = getPoseRequirements(selectedStyleId)
      // Reset validation when style changes
      setValidation({
        isValid: false,
        confidence: 0,
        progress: 0,
        requirements: {},
        message: `Requirements set for ${selectedStyleId}. Waiting for pose detection...`
      })
      confidenceHistoryRef.current.clear()
    }
  }, [selectedStyleId])

  // Update confidence history when pose results change
  useEffect(() => {
    if (!poseResults?.isDetected || !poseResults.landmarks || requirementsRef.current.length === 0) {
      return
    }

    const now = Date.now()
    const landmarks = poseResults.landmarks

    // Update confidence history for each requirement
    requirementsRef.current.forEach(requirement => {
      const key = requirement.description
      if (!confidenceHistoryRef.current.has(key)) {
        confidenceHistoryRef.current.set(key, [])
      }

      const history = confidenceHistoryRef.current.get(key)!
      
      // Calculate average confidence for required keypoints
      let totalConfidence = 0
      let validKeypoints = 0
      
      requirement.keypointIndices.forEach(index => {
        if (landmarks[index] && landmarks[index].confidence > 0) {
          totalConfidence += landmarks[index].confidence
          validKeypoints++
        }
      })

      if (validKeypoints > 0) {
        const avgConfidence = totalConfidence / validKeypoints
        
        // Add to history
        history.push({ confidence: avgConfidence, timestamp: now })
        
        // Keep only recent history (last 10 seconds)
        const cutoff = now - 10000
        const filteredHistory = history.filter(entry => entry.timestamp > cutoff)
        confidenceHistoryRef.current.set(key, filteredHistory)
      }
    })

    // Update validation status
    updateValidation(now)
  }, [poseResults])

  // Update validation status based on current confidence history
  const updateValidation = useCallback((timestamp: number) => {
    if (requirementsRef.current.length === 0) return

    const requirements = requirementsRef.current
    const newRequirements: MeasurementValidation['requirements'] = {}
    let totalProgress = 0
    let totalConfidence = 0
    let metRequirements = 0

    requirements.forEach(requirement => {
      const key = requirement.description
      const history = confidenceHistoryRef.current.get(key) || []
      
      // Calculate current confidence (average of last 5 detections)
      const recentHistory = history.slice(-5)
      const currentConfidence = recentHistory.length > 0 
        ? recentHistory.reduce((sum, entry) => sum + entry.confidence, 0) / recentHistory.length
        : 0

      // Calculate duration above threshold
      const aboveThreshold = history.filter(entry => 
        entry.confidence >= requirement.minConfidence
      )
      
      const duration = aboveThreshold.length > 0 
        ? timestamp - aboveThreshold[0].timestamp
        : 0

      const progress = Math.min(duration / requirement.requiredDuration, 1)
      const isMet = currentConfidence >= requirement.minConfidence && duration >= requirement.requiredDuration

      newRequirements[key] = {
        met: isMet,
        progress,
        duration: Math.min(duration, requirement.requiredDuration),
        confidence: currentConfidence
      }

      totalProgress += progress
      totalConfidence += currentConfidence
      if (isMet) metRequirements++
    })

    const overallProgress = totalProgress / requirements.length
    const overallConfidence = totalConfidence / requirements.length
    const isValid = metRequirements === requirements.length

    let message = ''
    if (isValid) {
      message = 'All pose requirements met! Ready to take measurements.'
    } else if (overallProgress > 0.5) {
      message = 'Good progress! Keep holding the pose.'
    } else if (overallProgress > 0) {
      message = 'Pose detected. Hold still to meet requirements.'
    } else {
      message = 'Waiting for pose detection...'
    }

    const newValidation: MeasurementValidation = {
      isValid,
      confidence: overallConfidence,
      progress: overallProgress,
      requirements: newRequirements,
      message
    }

    setValidation(newValidation)

    // Notify parent component when validation is complete
    if (isValid && onValidationComplete && timestamp - lastUpdateRef.current > 1000) {
      lastUpdateRef.current = timestamp
      onValidationComplete(newValidation)
    }
  }, [onValidationComplete])

  // Reset validation
  const resetValidation = useCallback(() => {
    setValidation({
      isValid: false,
      confidence: 0,
      progress: 0,
      requirements: {},
      message: 'Waiting for pose detection...'
    })
    confidenceHistoryRef.current.clear()
  }, [])

  return {
    validation,
    resetValidation,
    requirements: requirementsRef.current
  }
}
