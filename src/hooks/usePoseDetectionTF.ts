import { useRef, useCallback, useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import * as posenet from '@tensorflow-models/posenet'

export interface PoseLandmark {
  x: number
  y: number
  confidence: number
}

export interface PoseResults {
  landmarks: PoseLandmark[]
  isDetected: boolean
  confidence: number
}

export function usePoseDetectionTF() {
  const [poseResults, setPoseResults] = useState<PoseResults | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const modelRef = useRef<posenet.PoseNet | null>(null)
  const animationRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const initializePose = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔧 TF.js: Starting initialization...')
      
      // Wait for TensorFlow.js to be ready
      await tf.ready()
      console.log('✅ TF.js: TensorFlow ready')
      
      // Load PoseNet model
      console.log('⏳ TF.js: Loading PoseNet model...')
      const net = await posenet.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        inputResolution: { width: 640, height: 480 },
        multiplier: 0.75
      })
      console.log('✅ TF.js: PoseNet model loaded successfully')

      modelRef.current = net
      videoRef.current = videoElement
      setIsInitialized(true)
      setIsLoading(false)
      
      console.log('✅ TF.js: Pose detection ready')

      return net
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize pose detection'
      console.error('❌ TF.js initialization error:', err)
      setError(errorMsg)
      setIsLoading(false)
      throw new Error(errorMsg)
    }
  }, [])

  const detectPose = useCallback(async () => {
    if (!modelRef.current || !videoRef.current) {
      console.log('❌ TF.js: Missing model or video element', {
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current,
        videoReady: videoRef.current?.readyState >= 2
      })
      return
    }

    try {
      const video = videoRef.current
      
      // Check video state
      if (video.readyState < 2) {
        console.log('⏳ TF.js: Video not ready, readyState:', video.readyState)
        return
      }

      console.log('🔍 TF.js: Starting pose estimation...', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        currentTime: video.currentTime
      })

      const pose = await modelRef.current.estimateSinglePose(video, {
        flipHorizontal: false
      })

      console.log('📊 TF.js: Raw pose result:', pose)

      if (pose && pose.keypoints && pose.keypoints.length > 0) {
        const landmarks = pose.keypoints.map((keypoint, idx) => ({
          x: keypoint.position.x,
          y: keypoint.position.y,
          confidence: keypoint.score
        }))

        // Calculate overall confidence
        const avgConfidence = landmarks.reduce((sum, kp) => sum + kp.confidence, 0) / landmarks.length
        const highConfidenceCount = landmarks.filter(kp => kp.confidence > 0.5).length
        const mediumConfidenceCount = landmarks.filter(kp => kp.confidence > 0.3 && kp.confidence <= 0.5).length
        
        console.log(`✅ TF.js: Found ${landmarks.length} keypoints`, {
          avgConfidence: avgConfidence.toFixed(3),
          highConfidence: highConfidenceCount,
          mediumConfidence: mediumConfidenceCount,
          detectionThreshold: 0.3,
          willDetect: avgConfidence > 0.3
        })

        // Log individual keypoint details
        landmarks.forEach((landmark, idx) => {
          if (landmark.confidence > 0.2) { // Log any decent confidence
            console.log(`  ${POSENET_KEYPOINTS[idx]}: ${(landmark.confidence * 100).toFixed(1)}% at (${landmark.x.toFixed(0)}, ${landmark.y.toFixed(0)})`)
          }
        })

        setPoseResults({
          landmarks,
          isDetected: avgConfidence > 0.3, // Threshold for "detected"
          confidence: avgConfidence
        })
      } else {
        console.log('❌ TF.js: No pose or keypoints found in result')
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
      }
    } catch (err) {
      console.error('💥 TF.js: Pose detection error:', err)
      setPoseResults({
        landmarks: [],
        isDetected: false,
        confidence: 0
      })
    }
  }, [])

  const startDetection = useCallback(() => {
    if (!isInitialized) {
      console.log('❌ TF.js: Cannot start detection - not initialized')
      return
    }

    console.log('🚀 TF.js: Starting pose detection loop...')

    let frameCount = 0
    const runDetection = async () => {
      frameCount++
      if (frameCount % 30 === 0) { // Log every 30 frames (~1 second at 30fps)
        console.log(`🔄 TF.js: Detection loop running, frame ${frameCount}`)
      }
      
      await detectPose()
      animationRef.current = requestAnimationFrame(runDetection)
    }

    // Start the detection loop
    runDetection()
    console.log('✅ TF.js: Detection loop started')
  }, [isInitialized, detectPose])

  const stopDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setPoseResults(null)
  }, [])

  const cleanup = useCallback(() => {
    stopDetection()
    modelRef.current = null
    videoRef.current = null
    setIsInitialized(false)
  }, [stopDetection])

  return {
    poseResults,
    isInitialized,
    isLoading,
    error,
    initializePose,
    startDetection,
    stopDetection,
    cleanup
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