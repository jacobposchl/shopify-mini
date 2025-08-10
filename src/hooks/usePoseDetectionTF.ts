import { useState, useCallback, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as posenet from '@tensorflow-models/posenet'

interface PoseResults {
  landmarks: Array<{
    x: number
    y: number
    confidence: number
  }>
  isDetected: boolean
  confidence: number
}

// Add pose stability tracking
interface PoseStability {
  isStable: boolean
  velocityThreshold: number
  relevantLandmarks: number[]
  currentVelocities: Map<number, number>
  stabilityScore: number
}

export const usePoseDetectionTF = (stabilityThreshold: number = 200) => {
  const [poseResults, setPoseResults] = useState<PoseResults | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [poseStability, setPoseStability] = useState<PoseStability | null>(null)

  // Use 'any' type for now to avoid type conflicts, or we can use the actual return type from posenet.load()
  const modelRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const isDetectionRunningRef = useRef(false)
  const lastDetectionTimeRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const initializationAttemptsRef = useRef(0)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Add pose stability tracking refs
  const previousLandmarksRef = useRef<Array<{ x: number; y: number; confidence: number }> | null>(null)
  const lastStabilityUpdateRef = useRef<number>(0)
  const selectedStyleIdRef = useRef<string | null>(null)
  const stabilityStartTimeRef = useRef<number>(0)
  const consecutiveStableFramesRef = useRef<number>(0)


  // Function to get required stable frames based on threshold
  const getRequiredStableFrames = useCallback((threshold: number): number => {
    // Lower threshold = more strict = require more stable frames
    // Higher threshold = more lenient = require fewer stable frames
    if (threshold <= 100) return 20      // More lenient: 0.7 seconds
    if (threshold <= 200) return 15     // More lenient: 0.5 seconds
    if (threshold <= 300) return 10     // More lenient: 0.3 seconds
    return 8                            // Very lenient: 0.3 seconds
  }, [])

  // Function to get relevant landmarks for clothing type
  const getRelevantLandmarks = useCallback((styleId: string): number[] => {
    const landmarkMap: { [key: string]: number[] } = {
      'shirts': [5, 6, 7, 8, 11, 12], // shoulders, elbows, hips
      'pants': [11, 12, 13, 14, 15, 16], // hips, knees, ankles
      'shorts': [11, 12, 13, 14], // hips, knees
      'jackets': [5, 6, 7, 8, 11, 12], // shoulders, elbows, hips
      'activewear': [5, 6, 11, 12, 13, 14] // shoulders, hips, knees
    }
    return landmarkMap[styleId] || [5, 6, 11, 12] // default to shoulders and hips
  }, [])

  // Function to calculate pose stability with configurable threshold
  const calculatePoseStability = useCallback((currentLandmarks: Array<{ x: number; y: number; confidence: number }>, styleId: string, stabilityThreshold: number = 200): PoseStability => {
    const relevantLandmarks = getRelevantLandmarks(styleId)
    const currentVelocities = new Map<number, number>()
    let totalVelocity = 0
    let validLandmarks = 0
    const now = Date.now()

    if (previousLandmarksRef.current) {
      relevantLandmarks.forEach(index => {
        if (currentLandmarks[index] && previousLandmarksRef.current![index]) {
          const current = currentLandmarks[index]
          const previous = previousLandmarksRef.current![index]
          
          // Calculate velocity (pixels per second)
          // Use a more stable calculation by averaging over multiple frames
          const dx = current.x - previous.x
          const dy = current.y - previous.y
          const velocity = Math.sqrt(dx * dx + dy * dy)
          
          // Apply confidence weighting to reduce noise
          const confidence = current.confidence
          const weightedVelocity = velocity * confidence
          
          currentVelocities.set(index, velocity)
          totalVelocity += weightedVelocity
          validLandmarks++
        }
      })
    }

    const avgVelocity = validLandmarks > 0 ? totalVelocity / validLandmarks : 0
    
    // Check if current frame is stable with some hysteresis
    const isCurrentFrameStable = avgVelocity <= stabilityThreshold && validLandmarks >= relevantLandmarks.length * 0.7
    
    // Update stability tracking with hysteresis to prevent flickering
    if (isCurrentFrameStable) {
      if (consecutiveStableFramesRef.current === 0) {
        // Start stability timer
        stabilityStartTimeRef.current = now
      }
      consecutiveStableFramesRef.current++
    } else {
      // Only reset if we're significantly unstable (add hysteresis)
      if (avgVelocity > stabilityThreshold * 1.5) {
        consecutiveStableFramesRef.current = 0
        stabilityStartTimeRef.current = 0
      }
    }

    // Get required stable frames based on threshold
    const requiredFrames = getRequiredStableFrames(stabilityThreshold)
    
    // Calculate stability score based on consecutive stable frames
    const stabilityScore = Math.min(consecutiveStableFramesRef.current / requiredFrames, 1.0)
    
    // Consider pose stable if we have enough consecutive stable frames
    const isStable = consecutiveStableFramesRef.current >= requiredFrames

    return {
      isStable,
      velocityThreshold: stabilityThreshold,
      relevantLandmarks,
      currentVelocities,
      stabilityScore
    }
  }, [getRelevantLandmarks])

  // Function to update pose stability
  const updatePoseStability = useCallback((landmarks: Array<{ x: number; y: number; confidence: number }>, styleId: string, stabilityThreshold: number = 200) => {
    if (landmarks.length === 0) {
      setPoseStability(null)
      return
    }

    // Use default style if none provided
    const effectiveStyleId = styleId || 'shirts' // Default to shirts if no style selected
    
    const stability = calculatePoseStability(landmarks, effectiveStyleId, stabilityThreshold)
    setPoseStability(stability)
    
    // Update previous landmarks for next frame
    previousLandmarksRef.current = landmarks
    lastStabilityUpdateRef.current = Date.now()
  }, [calculatePoseStability])

  // Function to set the selected style for stability tracking
  const setSelectedStyle = useCallback((styleId: string) => {
    selectedStyleIdRef.current = styleId
    // Reset stability when style changes
    setPoseStability(null)
    previousLandmarksRef.current = null
    consecutiveStableFramesRef.current = 0
    stabilityStartTimeRef.current = 0
  }, [])

  // Function to reset pose stability (called when pose becomes unstable)
  const resetPoseStability = useCallback(() => {
    setPoseStability(null)
    previousLandmarksRef.current = null
    lastStabilityUpdateRef.current = 0
    consecutiveStableFramesRef.current = 0
    stabilityStartTimeRef.current = 0
  }, [])

  const initializePose = useCallback(async (video: HTMLVideoElement) => {
    if (isInitialized && modelRef.current) {
      console.log('✅ TF.js: Already initialized, updating video reference')
      videoRef.current = video
      return
    }

    try {
      setIsLoading(true)
      setError('')
      videoRef.current = video
      initializationAttemptsRef.current++

      console.log('🔧 TF.js: Starting initialization... (attempt', initializationAttemptsRef.current, ')')

      // Set a timeout for the entire initialization process
      const initPromise = new Promise<void>(async (resolve, reject) => {
        try {
          // Force TensorFlow.js to use WebGL backend with fallback
          console.log('📦 TF.js: Setting backend to WebGL...')
          await tf.setBackend('webgl')
          await tf.ready()
          
          const backend = tf.getBackend()
          console.log('📦 TF.js: Backend ready:', backend)

          // Verify WebGL is working
          if (backend !== 'webgl') {
            throw new Error(`Expected WebGL backend, got ${backend}`)
          }

          // Check WebGL support and memory
          const canvas = document.createElement('canvas')
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
          if (!gl) {
            throw new Error('WebGL not supported - required for pose detection')
          }

          // Check WebGL memory limits
          const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
          const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
          console.log('🔍 WebGL capabilities:', {
            maxTextureSize,
            maxViewportDims: `${maxViewportDims[0]}x${maxViewportDims[1]}`
          })

          // Load PoseNet model with conservative settings for better compatibility
          console.log('📥 TF.js: Loading PoseNet model...')
          const model = await posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            inputResolution: { width: 257, height: 257 },
            multiplier: 0.5, // More conservative for better compatibility
            quantBytes: 2
          })

          // Verify model loaded correctly
          if (!model || typeof model.estimateSinglePose !== 'function') {
            throw new Error('PoseNet model failed to load properly')
          }

          modelRef.current = model
          setIsInitialized(true)
          setIsLoading(false)
          consecutiveErrorsRef.current = 0
          initializationAttemptsRef.current = 0

          console.log('✅ TF.js: Model loaded successfully')
          
          // Test the model with a simple prediction
          try {
            const testCanvas = document.createElement('canvas')
            testCanvas.width = 257
            testCanvas.height = 257
            const testCtx = testCanvas.getContext('2d')
            if (testCtx) {
              testCtx.fillStyle = 'black'
              testCtx.fillRect(0, 0, 257, 257)
              
              const testPose = await model.estimateSinglePose(testCanvas, {
                flipHorizontal: false
              })
              console.log('🧪 TF.js: Model test successful, keypoints:', testPose.keypoints?.length || 0)
            }
          } catch (testErr) {
            console.warn('⚠️ TF.js: Model test failed, but continuing:', testErr)
          }

          resolve()
        } catch (err) {
          reject(err)
        }
      })

      // Set a timeout for initialization
      const timeoutPromise = new Promise<void>((_, reject) => {
        initializationTimeoutRef.current = setTimeout(() => {
          reject(new Error('Pose detection initialization timed out'))
        }, 30000) // 30 second timeout
      })

      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise])

      // Clear timeout if we get here
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize pose detection'
      console.error('❌ TF.js initialization error:', err)
      setError(errorMsg)
      setIsLoading(false)
      setIsInitialized(false)
      
      // Clear timeout if it exists
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }
      
      // If we've tried too many times, give up
      if (initializationAttemptsRef.current >= 3) {
        setError('Failed to initialize pose detection after multiple attempts. Please refresh the page.')
        throw new Error('Max initialization attempts reached')
      }
      
      throw new Error(errorMsg)
    }
  }, [isInitialized])

  const detectPose = useCallback(async () => {
    // Check if we have required components
    if (!modelRef.current || !videoRef.current || !isInitialized) {
      console.log('❌ TF.js: Missing components', {
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current,
        isInitialized
      })
      return
    }

    const video = videoRef.current

    // Comprehensive video state check
    if (video.readyState < 2 || video.paused || video.ended) {
      console.log('⏳ TF.js: Video not ready', {
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended,
        currentTime: video.currentTime
      })
      return
    }

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ TF.js: Video dimensions not ready:', {
        width: video.videoWidth,
        height: video.videoHeight
      })
      return
    }

    // Check camera stream health
    const stream = video.srcObject as MediaStream
    if (!stream || !stream.active) {
      console.log('❌ TF.js: Camera stream inactive')
      return
    }

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0 || videoTracks[0].readyState !== 'live') {
      console.log('❌ TF.js: Video track not live')
      return
    }

    try {
      const now = Date.now()
      
      // Throttle detection to ~10 FPS for better performance and stability
      if (now - lastDetectionTimeRef.current < 100) {
        return
      }
      lastDetectionTimeRef.current = now

      // Create a canvas to draw the video frame for better compatibility
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Estimate pose using the canvas instead of video element
      const pose = await modelRef.current.estimateSinglePose(canvas, {
        flipHorizontal: false
      })

      // Reset error counter on successful detection
      consecutiveErrorsRef.current = 0

      if (pose && pose.keypoints && pose.keypoints.length > 0) {
        const landmarks = pose.keypoints.map((keypoint: { position: { x: number; y: number }; score: number }) => ({
          x: keypoint.position.x,
          y: keypoint.position.y,
          confidence: keypoint.score
        }))

        // Calculate detection confidence
        const avgConfidence = landmarks.reduce((sum: number, kp: { confidence: number }) => sum + kp.confidence, 0) / landmarks.length
        const highConfidenceCount = landmarks.filter((kp: { confidence: number }) => kp.confidence > 0.3).length
        const isDetected = avgConfidence > 0.2 && highConfidenceCount >= 5

        // Log detection success periodically
        if (Math.random() < 0.05) { // 5% of frames
          console.log('✅ TF.js: Pose detected', {
            avgConfidence: avgConfidence.toFixed(3),
            highConfidenceKeypoints: highConfidenceCount,
            totalKeypoints: landmarks.length,
            videoDimensions: `${video.videoWidth}x${video.videoHeight}`
          })
        }

        setPoseResults({
          landmarks,
          isDetected,
          confidence: avgConfidence
        })

        // Update pose stability
        updatePoseStability(landmarks, selectedStyleIdRef.current || 'shirts', stabilityThreshold)

      } else {
        // No pose found, but don't log this as an error
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
        // Reset stability if no pose
        resetPoseStability()
      }
    } catch (err) {
      consecutiveErrorsRef.current++
      console.error(`💥 TF.js: Detection error (${consecutiveErrorsRef.current})`, err)
      
      // If too many consecutive errors, try to recover
      if (consecutiveErrorsRef.current > 5) {
        console.log('🔄 TF.js: Too many errors, attempting recovery...')
        consecutiveErrorsRef.current = 0
        
        // Reset pose results but don't stop detection
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
        // Reset stability on error
        resetPoseStability()
      }
    }
  }, [isInitialized, updatePoseStability, resetPoseStability, stabilityThreshold])

  const startDetection = useCallback(() => {
    if (!isInitialized || !modelRef.current || !videoRef.current) {
      console.log('❌ TF.js: Cannot start detection - not ready', {
        isInitialized,
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current
      })
      return Promise.reject(new Error('Pose detection not initialized'))
    }

    if (isDetectionRunningRef.current) {
      console.log('⚠️ TF.js: Detection already running')
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      console.log('🚀 TF.js: Starting pose detection loop...')
      isDetectionRunningRef.current = true
      consecutiveErrorsRef.current = 0

      let frameCount = 0
      const startTime = Date.now()

      const runDetection = async () => {
        // Check if detection should continue
        if (!isDetectionRunningRef.current) {
          console.log('🛑 TF.js: Detection stopped')
          return
        }

        frameCount++
        
        // Periodic status logging
        if (frameCount === 1) {
          console.log('✅ TF.js: Detection loop started successfully')
          resolve()
        }
        
        if (frameCount % 300 === 0) { // Every ~20 seconds at 15fps
          const elapsed = Date.now() - startTime
          console.log(`🔄 TF.js: Detection running - Frame ${frameCount}, ${(elapsed/1000).toFixed(1)}s elapsed`)
        }

        try {
          await detectPose()
        } catch (err) {
          console.error('💥 TF.js: Detection loop error:', err)
        }

        // Continue the loop
        if (isDetectionRunningRef.current) {
          animationRef.current = requestAnimationFrame(runDetection)
        }
      }

      // Start the detection loop
      runDetection()
    })
  }, [isInitialized, detectPose])

  const stopDetection = useCallback(() => {
    console.log('🛑 TF.js: Stopping pose detection...')
    isDetectionRunningRef.current = false
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    setPoseResults(null)
    consecutiveErrorsRef.current = 0
    console.log('✅ TF.js: Detection stopped')
  }, [])

  const cleanup = useCallback(() => {
    console.log('🧹 TF.js: Cleaning up pose detection...')
    stopDetection()
    
    // Clear any pending initialization timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current)
      initializationTimeoutRef.current = null
    }
    
    modelRef.current = null
    videoRef.current = null
    setIsInitialized(false)
    setError('')
    
    console.log('✅ TF.js: Cleanup complete')
  }, [stopDetection])

  // Health check function for debugging
  const getHealthStatus = useCallback(() => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream
    
    return {
      modelLoaded: !!modelRef.current,
      videoReady: (video?.readyState ?? 0) >= 2,
      videoPlaying: !video?.paused,
      streamActive: stream?.active,
      detectionRunning: isDetectionRunningRef.current,
      hasAnimationFrame: !!animationRef.current,
      consecutiveErrors: consecutiveErrorsRef.current,
      videoDimensions: video ? `${video.videoWidth}x${video.videoHeight}` : 'N/A'
    }
  }, [])

  return {
    poseResults,
    isInitialized,
    isLoading,
    error,
    initializePose,
    startDetection,
    stopDetection,
    cleanup,
    getHealthStatus,
    poseStability,
    setSelectedStyle,
    resetPoseStability
  }
}

// PoseNet keypoint names for reference
export const POSENET_KEYPOINTS = [
  'nose',           // 0
  'leftEye',        // 1
  'rightEye',       // 2
  'leftEar',        // 3
  'rightEar',       // 4
  'leftShoulder',   // 5
  'rightShoulder',  // 6
  'leftElbow',      // 7
  'rightElbow',     // 8
  'leftWrist',      // 9
  'rightWrist',     // 10
  'leftHip',        // 11
  'rightHip',       // 12
  'leftKnee',       // 13
  'rightKnee',      // 14
  'leftAnkle',      // 15
  'rightAnkle'      // 16
]