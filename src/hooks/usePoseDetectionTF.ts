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

export const usePoseDetectionTF = () => {
  const [poseResults, setPoseResults] = useState<PoseResults | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const modelRef = useRef<posenet.PoseNet | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const isDetectionRunningRef = useRef(false)
  const lastDetectionTimeRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const initializationAttemptsRef = useRef(0)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
        const landmarks = pose.keypoints.map((keypoint) => ({
          x: keypoint.position.x,
          y: keypoint.position.y,
          confidence: keypoint.score
        }))

        // Calculate detection confidence
        const avgConfidence = landmarks.reduce((sum, kp) => sum + kp.confidence, 0) / landmarks.length
        const highConfidenceCount = landmarks.filter(kp => kp.confidence > 0.3).length
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
      } else {
        // No pose found, but don't log this as an error
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
      }
    } catch (err) {
      consecutiveErrorsRef.current++
      console.error(`💥 TF.js: Detection error (${consecutiveErrorsRef.current})`, err)
      
      // If too many consecutive errors, try to recover
      if (consecutiveErrorsRef.current > 5) {
        console.log('🔄 TF.js: Too many errors, attempting recovery...')
        consecutiveErrorsRef.current = 0
        
        // Check if video is still available
        if (!videoRef.current || !videoRef.current.srcObject) {
          console.log('🔄 TF.js: Video no longer available, stopping detection')
          // Set a flag to stop detection instead of calling stopDetection directly
          isDetectionRunningRef.current = false
          return
        }
        
        // Reset pose results but don't stop detection
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
      }
    }
  }, [isInitialized])

  const startDetection = useCallback(() => {
    if (!isInitialized || !modelRef.current || !videoRef.current) {
      console.log('❌ TF.js: Cannot start detection - not ready', {
        isInitialized,
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current
      })
      return Promise.reject(new Error('Pose detection not initialized'))
    }

    // Check if video is still available and has a valid stream
    if (!videoRef.current.srcObject) {
      console.log('❌ TF.js: Cannot start detection - no video stream')
      return Promise.reject(new Error('No video stream available'))
    }

    if (isDetectionRunningRef.current) {
      console.log('⚠️ TF.js: Detection already running')
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
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

        // Check if video is still available
        if (!videoRef.current || !videoRef.current.srcObject) {
          console.log('🛑 TF.js: Video no longer available, stopping detection')
          isDetectionRunningRef.current = false
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

  // New function: Wait for pose detection to be ready with retries
  const waitForReadiness = useCallback(async (): Promise<void> => {
    const maxAttempts = 15; // Increased attempts but with shorter delays
    const maxWaitTime = 10000; // 10 second maximum wait time
    let attempt = 0;
    const startTime = Date.now();
    
    while (attempt < maxAttempts) {
      // Check if we've exceeded the maximum wait time
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Pose detection readiness check timed out');
      }
      
      // Check basic requirements
      if (!isInitialized || !modelRef.current || !videoRef.current) {
        console.log(`Waiting for basic requirements... attempt ${attempt + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay
        attempt++;
        continue;
      }

      // Check if video is actually ready - use a more lenient check
      if (videoRef.current.readyState < 2) { // HAVE_CURRENT_DATA instead of HAVE_FUTURE_DATA
        console.log(`Waiting for video to be ready... attempt ${attempt + 1}/${maxAttempts}, readyState: ${videoRef.current.readyState}`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay
        attempt++;
        continue;
      }

      // Check if video has valid dimensions
      if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
        console.log(`Waiting for video dimensions... attempt ${attempt + 1}/${maxAttempts}, dimensions: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay
        attempt++;
        continue;
      }

      // Test if model can actually process frames
      try {
        console.log('Testing model readiness with dummy frame...');
        const dummyCanvas = document.createElement('canvas');
        dummyCanvas.width = 640;
        dummyCanvas.height = 480;
        const dummyCtx = dummyCanvas.getContext('2d');
        if (dummyCtx) {
          // Create a simple test image
          dummyCtx.fillStyle = 'black';
          dummyCtx.fillRect(0, 0, 640, 480);
          
          // Try to run pose detection on the dummy frame
          const testResult = await modelRef.current.estimateSinglePose(dummyCanvas, {
            flipHorizontal: false
          });
          
          console.log('Model readiness test successful!');
          return; // Model is truly ready
        }
      } catch (error) {
        console.warn(`Model readiness test failed: ${error}`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay
        attempt++;
        continue;
      }
    }
    
    throw new Error('Model failed to become ready after maximum attempts');
  }, [isInitialized]);

  // Enhanced startDetection with automatic readiness waiting
  const startDetectionWithRetry = useCallback(async (maxRetries = 3, retryDelay = 1000) => {
    console.log('🚀 TF.js: Starting detection with retry mechanism...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // First, wait for readiness
        console.log(`🔄 TF.js: Attempt ${attempt}/${maxRetries} - Waiting for readiness...`)
        await waitForReadiness()
        
        // Then start detection
        console.log(`🔄 TF.js: Attempt ${attempt}/${maxRetries} - Starting detection...`)
        await startDetection()
        console.log(`✅ TF.js: Detection started successfully on attempt ${attempt}`)
        return
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.warn(`⚠️ TF.js: Detection attempt ${attempt} failed:`, errorMsg)
        
        if (attempt < maxRetries) {
          console.log(`🔄 TF.js: Retrying in ${retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
          // Exponential backoff
          retryDelay = Math.min(retryDelay * 1.5, 5000)
        } else {
          console.error('❌ TF.js: All detection attempts failed')
          // Set a more specific error message
          setError(`Pose detection failed after ${maxRetries} attempts: ${errorMsg}`)
          throw new Error(`Pose detection failed: ${errorMsg}`)
        }
      }
    }
  }, [waitForReadiness, startDetection])

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
      videoReady: video?.readyState !== undefined && video.readyState >= 2,
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
    startDetectionWithRetry,
    waitForReadiness,
    stopDetection,
    cleanup,
    getHealthStatus
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