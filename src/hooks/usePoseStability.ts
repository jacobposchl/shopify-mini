import { useState, useEffect, useRef, useCallback } from 'react'
import { PoseResults } from '../types'

interface LandmarkVelocity {
  x: number
  y: number
  magnitude: number
  timestamp: number
}

interface LandmarkStability {
  keypointIndex: number
  isStable: boolean
  velocity: LandmarkVelocity
  stabilityDuration: number
  lastStablePosition: { x: number; y: number } | null
}

interface PoseStabilityState {
  isStable: boolean
  stableLandmarksCount: number
  totalLandmarksCount: number
  stabilityProgress: number
  message: string
  landmarkStabilities: LandmarkStability[]
}

interface UsePoseStabilityProps {
  poseResults: PoseResults | null
  stabilityThreshold?: number // Maximum velocity magnitude for stability (pixels per frame)
  requiredStabilityDuration?: number // Required duration of stability in milliseconds
  requiredStableLandmarksRatio?: number // Ratio of landmarks that must be stable (0-1)
  onStabilityChange?: (stability: PoseStabilityState) => void
}

export function usePoseStability({
  poseResults,
  stabilityThreshold = 2.0, // 2 pixels per frame
  requiredStabilityDuration = 2000, // 2 seconds
  requiredStableLandmarksRatio = 0.7, // 70% of landmarks must be stable
  onStabilityChange
}: UsePoseStabilityProps) {
  const [stability, setStability] = useState<PoseStabilityState>({
    isStable: false,
    stableLandmarksCount: 0,
    totalLandmarksCount: 0,
    stabilityProgress: 0,
    message: 'Waiting for pose detection...',
    landmarkStabilities: []
  })

  const landmarkHistoryRef = useRef<Map<number, Array<{ x: number; y: number; timestamp: number }>>>(new Map())
  const stabilityStartTimesRef = useRef<Map<number, number>>(new Map())
  const lastStablePositionsRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastUpdateTimeRef = useRef<number>(0)
  const updateThrottleMs = 100 // Only update every 100ms to reduce constant updates

  // Calculate velocity between two points
  const calculateVelocity = useCallback((current: { x: number; y: number; timestamp: number }, previous: { x: number; y: number; timestamp: number }): LandmarkVelocity => {
    const timeDiff = current.timestamp - previous.timestamp
    if (timeDiff === 0) {
      return { x: 0, y: 0, magnitude: 0, timestamp: current.timestamp }
    }

    const xVelocity = (current.x - previous.x) / timeDiff * 1000 // pixels per second
    const yVelocity = (current.y - previous.y) / timeDiff * 1000
    const magnitude = Math.sqrt(xVelocity * xVelocity + yVelocity * yVelocity)

    return {
      x: xVelocity,
      y: yVelocity,
      magnitude,
      timestamp: current.timestamp
    }
  }, [])

  // Update landmark history and calculate stability
  useEffect(() => {
    if (!poseResults?.isDetected || !poseResults.landmarks || poseResults.landmarks.length === 0) {
      return
    }

    const now = Date.now()
    
    // Throttle updates to reduce constant UI changes
    if (now - lastUpdateTimeRef.current < updateThrottleMs) {
      return
    }
    lastUpdateTimeRef.current = now
    const landmarks = poseResults.landmarks
    const newLandmarkStabilities: LandmarkStability[] = []

    landmarks.forEach((landmark: { x: number; y: number; confidence: number }, index: number) => {
      if (landmark.confidence < 0.3) {
        // Skip low confidence landmarks
        newLandmarkStabilities.push({
          keypointIndex: index,
          isStable: false,
          velocity: { x: 0, y: 0, magnitude: 0, timestamp: now },
          stabilityDuration: 0,
          lastStablePosition: null
        })
        return
      }

      // Initialize history for this landmark if it doesn't exist
      if (!landmarkHistoryRef.current.has(index)) {
        landmarkHistoryRef.current.set(index, [])
      }

      const history = landmarkHistoryRef.current.get(index)!
      const currentPosition = { x: landmark.x, y: landmark.y, timestamp: now }

      // Add current position to history
      history.push(currentPosition)

      // Keep only recent history (last 3 seconds)
      const cutoff = now - 3000
      const filteredHistory = history.filter(entry => entry.timestamp > cutoff)
      landmarkHistoryRef.current.set(index, filteredHistory)

      // Calculate velocity if we have at least 2 points
      let velocity: LandmarkVelocity = { x: 0, y: 0, magnitude: 0, timestamp: now }
      let isStable = false
      let stabilityDuration = 0
      let lastStablePosition = lastStablePositionsRef.current.get(index) || null

      if (filteredHistory.length >= 2) {
        const previous = filteredHistory[filteredHistory.length - 2]
        velocity = calculateVelocity(currentPosition, previous)

        // Check if velocity is below threshold
        if (velocity.magnitude <= stabilityThreshold) {
          // Start or continue stability timer
          if (!stabilityStartTimesRef.current.has(index)) {
            stabilityStartTimesRef.current.set(index, now)
          }
          
          const stabilityStartTime = stabilityStartTimesRef.current.get(index)!
          stabilityDuration = now - stabilityStartTime
          
          // Update last stable position
          lastStablePosition = { x: landmark.x, y: landmark.y }
          lastStablePositionsRef.current.set(index, lastStablePosition)

          // Check if stability duration meets requirement
          isStable = stabilityDuration >= requiredStabilityDuration
        } else {
          // Reset stability timer if velocity is too high
          stabilityStartTimesRef.current.delete(index)
          stabilityDuration = 0
        }
      }

      newLandmarkStabilities.push({
        keypointIndex: index,
        isStable,
        velocity,
        stabilityDuration,
        lastStablePosition
      })
    })

    // Calculate overall stability
    const stableLandmarks = newLandmarkStabilities.filter(ls => ls.isStable)
    const stableLandmarksCount = stableLandmarks.length
    const totalLandmarksCount = newLandmarkStabilities.length
    const stabilityProgress = totalLandmarksCount > 0 ? stableLandmarksCount / totalLandmarksCount : 0
    const isStable = stabilityProgress >= requiredStableLandmarksRatio

    // Generate user-friendly message
    let message = ''
    if (isStable) {
      message = `Pose is stable! ${stableLandmarksCount}/${totalLandmarksCount} landmarks are stable. Ready for measurements.`
    } else if (stabilityProgress > 0.5) {
      message = `Good stability! ${stableLandmarksCount}/${totalLandmarksCount} landmarks are stable. Hold still a bit longer.`
    } else if (stabilityProgress > 0) {
      message = `Some landmarks are stable (${stableLandmarksCount}/${totalLandmarksCount}). Keep holding the pose.`
    } else {
      message = 'Waiting for pose to stabilize. Please hold still.'
    }

    const newStability: PoseStabilityState = {
      isStable,
      stableLandmarksCount,
      totalLandmarksCount,
      stabilityProgress,
      message,
      landmarkStabilities: newLandmarkStabilities
    }

    // Only update state if there's a significant change to reduce constant updates
    setStability(prevStability => {
      const progressDiff = Math.abs(prevStability.stabilityProgress - stabilityProgress)
      const stableCountDiff = Math.abs(prevStability.stableLandmarksCount - stableLandmarksCount)
      
      // Only update if progress changed by more than 5% or stable count changed
      if (progressDiff > 0.05 || stableCountDiff > 0 || prevStability.isStable !== isStable) {
        return newStability
      }
      return prevStability
    })

    // Notify parent component of stability change
    if (onStabilityChange) {
      onStabilityChange(newStability)
    }
  }, [poseResults, stabilityThreshold, requiredStabilityDuration, requiredStableLandmarksRatio, onStabilityChange, calculateVelocity])

  // Reset stability tracking
  const resetStability = useCallback(() => {
    setStability({
      isStable: false,
      stableLandmarksCount: 0,
      totalLandmarksCount: 0,
      stabilityProgress: 0,
      message: 'Waiting for pose detection...',
      landmarkStabilities: []
    })
    landmarkHistoryRef.current.clear()
    stabilityStartTimesRef.current.clear()
    lastStablePositionsRef.current.clear()
  }, [])

  // Get stability status for a specific landmark
  const getLandmarkStability = useCallback((keypointIndex: number): LandmarkStability | null => {
    return stability.landmarkStabilities.find(ls => ls.keypointIndex === keypointIndex) || null
  }, [stability.landmarkStabilities])

  return {
    stability,
    resetStability,
    getLandmarkStability,
    isStable: stability.isStable,
    stableLandmarksCount: stability.stableLandmarksCount,
    totalLandmarksCount: stability.totalLandmarksCount,
    stabilityProgress: stability.stabilityProgress,
    message: stability.message
  }
}
