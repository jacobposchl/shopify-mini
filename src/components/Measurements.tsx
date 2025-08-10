import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useCamera } from '../hooks/useCamera'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { usePoseStability } from '../hooks/usePoseStability'
import { useFlowState } from '../hooks/useFlowState'
import { DebugOverlay } from './DebugOverlay'
import { ConfidenceThreshold } from './ConfidenceThreshold'
import { Logger } from '../utils/Logger'
import { Measurements as MeasurementsType } from '../types'
import { POSENET_KEYPOINTS } from '../hooks/usePoseDetectionTF'
import { getClothingInstructions } from '../data/poseRequirements'

// Error boundary component
class InAppErrorBoundary extends React.Component<
  {children: React.ReactNode}, 
  {err?: Error, stack?: string, open: boolean}
> {
  constructor(props: {children: React.ReactNode}) {
    super(props)
    this.state = { err: undefined, stack: '', open: false }
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack
    })
    this.setState({ 
      err: error, 
      stack: info?.componentStack ?? '', 
      open: true 
    })
  }
  
  render() {
    if (!this.state.open) return this.props.children
    
    const message = this.state.err?.message ?? 'Unknown error'
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        zIndex: 99999,
        padding: 20,
        fontSize: 14,
        fontFamily: 'monospace'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <strong>⚠️ React Error</strong>
          <button 
            onClick={() => this.setState({ open: false })}
            style={{
              background: '#333',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Error:</strong> {message}
        </div>
        <pre style={{
          whiteSpace: 'pre-wrap',
          margin: 0,
          fontSize: 12,
          background: '#222',
          padding: 12,
          borderRadius: 6,
          overflow: 'auto'
        }}>
          {this.state.stack}
        </pre>
      </div>
    )
  }
}

// Global error hooks component
function GlobalErrorHooks() {
  const [msg, setMsg] = useState<string | null>(null)
  
  useEffect(() => {
    const onErr = (e: ErrorEvent) => {
      const errorMsg = `${e.message}\n${e.error?.stack ?? ''}`
      Logger.error('Global window error', { 
        message: e.message, 
        stack: e?.error?.stack,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      })
      setMsg(errorMsg)
    }
    
    const onRej = (e: PromiseRejectionEvent) => {
      const errorMsg = `unhandledrejection: ${e.reason?.message ?? e.reason}\n${e.reason?.stack ?? ''}`
      Logger.error('Unhandled promise rejection', {
        reason: e.reason?.message ?? e.reason,
        stack: e.reason?.stack
      })
      setMsg(errorMsg)
    }
    
    window.addEventListener('error', onErr)
    window.addEventListener('unhandledrejection', onRej)
    
    return () => {
      window.removeEventListener('error', onErr)
      window.removeEventListener('unhandledrejection', onRej)
    }
  }, [])
  
  if (!msg) return null
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      left: 12,
      right: 12,
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      zIndex: 99998,
      padding: 12,
      borderRadius: 12
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
      }}>
        <strong>⚠️ Runtime Error</strong>
        <button 
          onClick={() => setMsg(null)}
          style={{
            background: '#333',
            color: '#fff',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Dismiss
        </button>
      </div>
      <pre style={{
        whiteSpace: 'pre-wrap',
        margin: 0,
        fontSize: 12
      }}>
        {msg}
      </pre>
    </div>
  )
}

interface MeasurementsStepProps {
  onMeasurementsComplete: (measurements: MeasurementsType) => void
  selectedItemName?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
  selectedStyleId?: string
}

export function MeasurementsStepImpl({
  onMeasurementsComplete,
  selectedItemName,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName,
  selectedStyleId
}: MeasurementsStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const [measurements, setMeasurements] = useState<MeasurementsType | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  const [canTakeMeasurement, setCanTakeMeasurement] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string>('')
  const [autoSkipCountdown, setAutoSkipCountdown] = useState<number>(0)
  const [initialCountdown, setInitialCountdown] = useState<number>(5)
  const [isInitialCountdownActive, setIsInitialCountdownActive] = useState<boolean>(true)
  const [cameraStarted, setCameraStarted] = useState<boolean>(false)
  const [isPoseWarmingUp, setIsPoseWarmingUp] = useState<boolean>(false)

  const {
    poseResults,
    isInitialized: isPoseInitialized,
    isLoading: isPoseLoading,
    error: poseError,
    initializePose,
    startDetection,
    startDetectionWithRetry,
    stopDetection,
    cleanup,
    getHealthStatus
  } = usePoseDetectionTF()

  // Initialize pose stability tracking
  const {
    stability: poseStability,
    resetStability,
    isStable: isPoseStable,
    stableLandmarksCount,
    totalLandmarksCount,
    stabilityProgress,
    message: stabilityMessage
  } = usePoseStability({
    poseResults,
    stabilityThreshold: 2.0, // 2 pixels per frame
    requiredStabilityDuration: 2000, // 2 seconds
    requiredStableLandmarksRatio: 0.7, // 70% of landmarks must be stable
    onStabilityChange: (stability) => {
      Logger.info('Pose stability changed', {
        isStable: stability.isStable,
        stableLandmarks: stability.stableLandmarksCount,
        totalLandmarks: stability.totalLandmarksCount,
        progress: stability.stabilityProgress
      })
    }
  })

  // Enhanced pose validation with stability
  const {
    validation,
    resetValidation,
    requirements
  } = usePoseValidation({
    poseResults,
    selectedStyleId,
    isPoseStable, // Pass stability status to validation
    onValidationComplete: (validation) => {
      Logger.info('Pose validation complete', validation)
      if (validation.isValid) {
        setShowMeasurements(true)
        setValidationMessage('Pose requirements met and stable! Taking measurements...')
      }
    }
  })

  // Log component initialization
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName
    })
  }, [selectedItemName, selectedCompanyName, selectedStyleName, selectedSubStyleName])

  const headIndex = useMemo(() => {
    if (!Array.isArray(POSENET_KEYPOINTS)) return 0
    const wanted = ['nose', 'head', 'face', 'left_eye', 'right_eye', 'lefteye', 'righteye']
    const idx = POSENET_KEYPOINTS.findIndex(k =>
      typeof k === 'string' && wanted.some(w => k.toLowerCase().includes(w))
    )
    Logger.debug('HEAD_INDEX calculated', { 
      index: idx >= 0 ? idx : 0, 
      keypoints: POSENET_KEYPOINTS 
    })
    return idx >= 0 ? idx : 0
  }, [])

  // Sync canvas size and position to match video
  const syncCanvasToVideo = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    // Get the actual video dimensions
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Get the container dimensions
    const containerWidth = video.clientWidth
    const containerHeight = video.clientHeight

    // Calculate the scaling factors for object-contain
    const scaleX = containerWidth / videoWidth
    const scaleY = containerHeight / videoHeight
    const scale = Math.min(scaleX, scaleY)

    // Calculate the actual video display dimensions after object-contain scaling
    const displayWidth = videoWidth * scale
    const displayHeight = videoHeight * scale

    // Calculate the offset to center the video within its container
    const offsetX = (containerWidth - displayWidth) / 2
    const offsetY = (containerHeight - displayHeight) / 2

    // Set canvas size to match the container
    canvas.width = containerWidth
    canvas.height = containerHeight

    // Store the transformation parameters for pose drawing
    canvas.dataset.videoScale = scale.toString()
    canvas.dataset.videoOffsetX = offsetX.toString()
    canvas.dataset.videoOffsetY = offsetY.toString()
    canvas.dataset.videoDisplayWidth = displayWidth.toString()
    canvas.dataset.videoDisplayHeight = displayHeight.toString()

    Logger.info('Canvas synced to video', {
      videoWidth,
      videoHeight,
      containerWidth,
      containerHeight,
      scale,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY
    })
  }, [])

  // Enhanced canvas drawing with lines between landmarks and stability indicators
  useEffect(() => {
    if (!canvasRef.current || !poseResults || !poseResults.isDetected) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get transformation parameters
    const scale = parseFloat(canvas.dataset.videoScale || '1')
    const offsetX = parseFloat(canvas.dataset.videoOffsetX || '0')
    const offsetY = parseFloat(canvas.dataset.videoOffsetY || '0')

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Define connections between keypoints (PoseNet skeleton)
    const keypointConnections = [
      // Head and torso
      [0, 1], [1, 3], [0, 2], [2, 4], // nose to eyes to ears
      [5, 6], // shoulders
      [5, 7], [7, 9], // left arm
      [6, 8], [8, 10], // right arm
      [5, 11], [6, 12], // shoulders to hips
      [11, 12], // hips
      [11, 13], [13, 15], // left leg
      [12, 14], [14, 16] // right leg
    ]

    // Draw connections (skeleton lines)
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    keypointConnections.forEach(([startIdx, endIdx]) => {
      const startLandmark = poseResults.landmarks[startIdx]
      const endLandmark = poseResults.landmarks[endIdx]
      
      if (startLandmark && endLandmark && 
          startLandmark.confidence > 0.3 && endLandmark.confidence > 0.3) {
        
        // Transform coordinates
        const startX = canvas.width - ((startLandmark.x * scale) + offsetX)
        const startY = (startLandmark.y * scale) + offsetY
        const endX = canvas.width - ((endLandmark.x * scale) + offsetX)
        const endY = (endLandmark.y * scale) + offsetY

        // Draw line
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
    })

    // Draw keypoints with stability indicators
    poseResults.landmarks.forEach((landmark, index) => {
      if (landmark.confidence > 0.3) {
        // Transform coordinates
        const x = canvas.width - ((landmark.x * scale) + offsetX)
        const y = (landmark.y * scale) + offsetY

        // Get stability info for this landmark
        const landmarkStability = poseStability.landmarkStabilities.find(ls => ls.keypointIndex === index)
        const isStable = landmarkStability?.isStable || false
        const velocity = landmarkStability?.velocity.magnitude || 0

        // Choose color based on stability
        let fillColor = '#00ff00' // Default green
        let strokeColor = '#ffffff'
        
        if (isStable) {
          fillColor = '#00ff00' // Green for stable
          strokeColor = '#00aa00'
        } else if (velocity > 5) {
          fillColor = '#ff0000' // Red for high velocity
          strokeColor = '#aa0000'
        } else if (velocity > 2) {
          fillColor = '#ffaa00' // Orange for medium velocity
          strokeColor = '#aa6600'
        }

        // Draw keypoint with stability indicator
        ctx.fillStyle = fillColor
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 2
        
        // Draw outer circle for stability
        ctx.beginPath()
        ctx.arc(x, y, isStable ? 6 : 4, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()

        // Draw inner circle
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fill()

        // Removed text labels for cleaner display
      }
    })

    // Draw stability status overlay
    if (poseStability.totalLandmarksCount > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(10, 10, 200, 100)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial'
      ctx.fillText(`Stability: ${Math.round(stabilityProgress * 100)}%`, 20, 30)
      ctx.fillText(`Stable: ${stableLandmarksCount}/${totalLandmarksCount}`, 20, 50)
      ctx.fillText(`Threshold: 70% for 2s`, 20, 70)
      
      if (isPoseStable) {
        ctx.fillStyle = '#00ff00'
        ctx.fillText('✓ READY FOR MEASUREMENTS', 20, 90)
      } else if (stabilityProgress > 0.5) {
        ctx.fillStyle = '#ffff00'
        ctx.fillText('⏳ ALMOST READY', 20, 90)
      } else {
        ctx.fillStyle = '#ff0000'
        ctx.fillText('⏳ HOLD STILL', 20, 90)
      }
    }

    Logger.debug('Enhanced pose landmarks drawn', {
      keypoints: poseResults.landmarks.length,
      stableLandmarks: stableLandmarksCount,
      totalLandmarks: totalLandmarksCount,
      isStable: isPoseStable
    })
  }, [poseResults, poseStability, stableLandmarksCount, totalLandmarksCount, stabilityProgress, isPoseStable])

  const forceStartDetection = useCallback(() => {
    Logger.info('Manual detection restart triggered')
    if (!isPoseInitialized) {
      Logger.warn('Cannot force start: Pose not initialized yet')
      return
    }
    if (!videoRef.current) {
      Logger.warn('Cannot force start: No video element')
      return
    }
    try {
      stopDetection()
      Logger.info('Restarting pose detection...')
      startDetectionWithRetry().then(() => {
        Logger.info('Pose detection manually restarted successfully')
      }).catch((err: Error) => {
        Logger.error('Manual detection restart failed', { error: err.message })
      })
    } catch (err) {
      Logger.error('Manual detection restart error', { error: (err as Error).message })
    }
  }, [isPoseInitialized, stopDetection, startDetection, startDetectionWithRetry])

  // Enhanced camera initialization
  const startCamera = useCallback(async () => {
    Logger.info('Starting camera initialization...');
    setCameraError('');
    setIsPoseWarmingUp(true);
    
    try {
      // Start camera
      Logger.info('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        Logger.info('Setting video stream...');
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              Logger.info('Video metadata loaded');
              resolve();
            };
          }
        });
        
        Logger.info('Camera started successfully');
        setCameraStarted(true);
        
        // Add a delay before initializing pose detection to ensure video is fully ready
        Logger.info('Waiting for video to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Initialize pose detection with proper loading phase
        Logger.info('Initializing pose detection...');
        setCameraError('Initializing pose detection model...');
        await initializePose(videoRef.current);
        
        // Add another delay before starting detection to ensure model is fully ready
        Logger.info('Waiting for model to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced from 2000ms
        
        Logger.info('Starting pose detection...');
        setCameraError('Starting pose detection...');
        await startDetectionWithRetry();
        
        Logger.info('Pose detection started successfully');
        setIsPoseWarmingUp(false);
        setCameraError('');
      } else {
        throw new Error('Video element not available');
      }
    } catch (error) {
      Logger.error('Camera initialization failed:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Camera failed to start';
      if (error instanceof Error) {
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
        } else if (error.message.includes('NotFoundError') || error.message.includes('DevicesNotFoundError')) {
          errorMessage = 'No camera found. Please check your device has a camera and try again.';
        } else if (error.message.includes('NotReadableError') || error.message.includes('TrackStartError')) {
          errorMessage = 'Camera is in use by another application. Please close other camera apps and try again.';
        } else if (error.message.includes('Pose detection failed')) {
          errorMessage = `Pose detection failed: ${error.message}`;
        } else {
          errorMessage = `Camera error: ${error.message}`;
        }
      }
      
      setCameraError(errorMessage);
      setIsPoseWarmingUp(false);
    }
  }, [initializePose, startDetectionWithRetry]);

  const stopCamera = useCallback(() => {
    Logger.info('Stopping camera')
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      Logger.debug('Camera stream stopped and cleared')
    }
    stopDetection()
  }, [stopDetection])

  // Enhanced measurement taking with stability check
  const handleTakeMeasurement = () => {
    if (!isPoseStable) {
      setValidationMessage('Please hold still until the pose is stable before taking measurements.')
      return
    }

    if (!validation.isValid) {
      setValidationMessage('Please meet all pose requirements before taking measurements.')
      return
    }

    Logger.info('Taking measurements with stable pose', {
      isStable: isPoseStable,
      stableLandmarks: stableLandmarksCount,
      validation: validation
    })
    setIsProcessing(true)
    
    setTimeout(() => {
      const mockMeasurements: MeasurementsType = {
        chest: 42, 
        waist: 32, 
        hips: 38, 
        shoulders: 18,
        armLength: 25, 
        inseam: 32, 
        height: 70, 
        weight: 165
      }
      Logger.info('Measurements calculated', { measurements: mockMeasurements })
      setMeasurements(mockMeasurements)
      setIsProcessing(false)
      stopCamera()
    }, 2000)
  }

  // Auto-skip to recommendations when countdown reaches 0
  useEffect(() => {
    if (autoSkipCountdown === 0 && isPoseStable && validation.isValid && !measurements && !isProcessing) {
      Logger.info('Auto-skipping to recommendations - countdown complete', {
        stabilityProgress,
        validation: validation.isValid
      })
      
      // Generate mock measurements and proceed directly to recommendations
      const mockMeasurements: MeasurementsType = {
        chest: 42, 
        waist: 32, 
        hips: 38, 
        shoulders: 18,
        armLength: 25, 
        inseam: 32, 
        height: 70, 
        weight: 165
      }
      
      // Call the completion handler directly to skip measurements display
      onMeasurementsComplete(mockMeasurements)
    }
  }, [autoSkipCountdown, isPoseStable, validation.isValid, measurements, isProcessing, onMeasurementsComplete])

  // Countdown effect when pose is stable
  useEffect(() => {
    if (isPoseStable && validation.isValid && !measurements && !isProcessing) {
      // Start 3-second countdown before auto-skip
      setAutoSkipCountdown(3)
      const interval = setInterval(() => {
        setAutoSkipCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setAutoSkipCountdown(0)
    }
  }, [isPoseStable, validation.isValid, measurements, isProcessing])

  const handleRetake = () => {
    Logger.info('User requested measurement retake')
    setMeasurements(null)
    setIsProcessing(false)
    startCamera()
  }

  const handleContinue = () => {
    if (measurements) {
      Logger.info('User confirmed measurements, proceeding to next step', { measurements })
      onMeasurementsComplete(measurements)
    } else {
      Logger.warn('Attempted to continue without measurements')
    }
  }

  const retryCamera = () => {
    Logger.info('User requested camera retry')
    setCameraError('')
    
    // Clean up previous attempt
    try {
      stopDetection()
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      setCameraStarted(false)
      setIsPoseWarmingUp(false)
    } catch (err) {
      Logger.warn('Error during cleanup before retry:', err)
    }
    
    // Wait a moment before retrying to ensure cleanup is complete
    setTimeout(() => {
      startCamera()
    }, 500)
  }

  const debugCameraStatus = () => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream;
    
    // Get pose detection health status
    const poseHealth = getHealthStatus();
    
    console.log('Camera Debug:', {
      hasVideo: !!video,
      hasStream: !!stream,
      streamActive: stream?.active,
      tracks: stream?.getTracks().map(track => ({
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState
      })),
      videoPlaying: !video?.paused,
      videoDimensions: `${video?.videoWidth}x${video?.videoHeight}`,
      videoReadyState: video?.readyState,
      poseDetection: poseHealth
    });
    
    // Also log to the UI for debugging
    const debugInfo = `
Camera: ${video ? 'Available' : 'Not Available'}
Stream: ${stream?.active ? 'Active' : 'Inactive'}
Video Ready: ${video?.readyState !== undefined && video.readyState >= 2 ? 'Yes' : 'No'}
Dimensions: ${video?.videoWidth}x${video?.videoHeight}
Pose Model: ${poseHealth.modelLoaded ? 'Loaded' : 'Not Loaded'}
Detection: ${poseHealth.detectionRunning ? 'Running' : 'Stopped'}
Errors: ${poseHealth.consecutiveErrors}
    `.trim();
    
    console.log('Debug Info:', debugInfo);
  };




  // Start camera automatically on mount with initial countdown
  useEffect(() => {
    Logger.info('Component mounted, starting initial countdown')
    
    // Start 5-second countdown before camera initialization
    const countdownInterval = setInterval(() => {
      setInitialCountdown(prev => {
        Logger.info(`Countdown: ${prev} -> ${prev - 1}`)
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setIsInitialCountdownActive(false)
          Logger.info('Initial countdown complete, starting camera')
          
          // Add a delay to ensure DOM has been updated and video element is rendered
          setTimeout(() => {
            Logger.info('Calling startCamera after delay')
            startCamera()
          }, 300)
          
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
      Logger.info('Component unmounting, cleaning up camera and pose detection')
      try {
        stopDetection()
      } catch (err) {
        Logger.warn('Error stopping detection during cleanup', { error: (err as Error).message })
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep canvas sized on resize
  useEffect(() => {
    const onResize = () => {
      Logger.debug('Window resized, syncing canvas')
      syncCanvasToVideo()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncCanvasToVideo])

  // Log pose detection state changes
  useEffect(() => {
    if (isPoseLoading) {
      Logger.info('Pose detection model loading...')
    } else if (isPoseInitialized) {
      Logger.info('Pose detection model ready')
    }
  }, [isPoseLoading, isPoseInitialized])

  // Log pose detection results
  useEffect(() => {
    if (poseResults?.isDetected) {
      Logger.debug('Pose detected', {
        confidence: poseResults.confidence,
        landmarksCount: poseResults.landmarks?.length
      })
    }
  }, [poseResults])

  // Log errors
  useEffect(() => {
    if (poseError) {
      Logger.error('Pose detection error', { error: poseError })
    }
  }, [poseError])



  return (
    <div className="min-h-screen flex flex-col bg-black">
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
          <p className="text-sm text-gray-500">
            We'll use your camera to measure you perfectly
          </p>
        </div>
      </header>

      {/* Initial Countdown Overlay */}
      {isInitialCountdownActive && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="text-8xl font-bold text-blue-500 mb-4">{initialCountdown}</div>
              <h2 className="text-2xl font-bold mb-4">Get Ready for Measurements</h2>
              <p className="text-lg text-gray-300 max-w-md mx-auto leading-relaxed">
                We will begin taking measurements. Place the camera in a position to view your measurements.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Debug info */}
        {!isInitialCountdownActive && (
          <div className="absolute top-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded">
            <div>Countdown: {isInitialCountdownActive ? 'Active' : 'Complete'}</div>
            <div>Camera: {cameraStarted ? 'Started' : 'Not Started'}</div>
            <div>Error: {cameraError || 'None'}</div>
          </div>
        )}

        {/* Confidence Threshold Component - Top UI */}
        {!isInitialCountdownActive && (
          <ConfidenceThreshold
            validation={validation}
            requirements={[]}
            stabilityProgress={stabilityProgress}
            isVisible={Boolean(!measurements && !isProcessing && selectedStyleId && poseResults?.isDetected)}
          />
        )}

        {/* Camera UI - Show when countdown is complete */}
        {!isInitialCountdownActive && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black transform -scale-x-100"
              autoPlay
              playsInline
              muted
              onLoadedMetadata={syncCanvasToVideo}
            />

            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none transform z-50"
              style={{ zIndex: 10, transformOrigin: 'center' }}
            />

            {/* Camera Loading Overlay */}
            {!cameraStarted && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {isPoseWarmingUp ? 'Warming Up Pose Detection...' : 'Starting Camera...'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {isPoseWarmingUp 
                      ? 'Initializing the AI model for pose detection. This may take a few seconds.'
                      : 'Setting up camera access and video stream...'
                    }
                  </p>
                  {cameraError && (
                    <div className="bg-blue-600/20 border border-blue-600/30 rounded-md p-3 mb-4">
                      <p className="text-blue-800 text-sm">{cameraError}</p>
                    </div>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={debugCameraStatus}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Debug
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}



        {/* Camera error UI */}
        {!isInitialCountdownActive && cameraError && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Issue</h3>
              <p className="text-sm text-gray-600 mb-4">{cameraError}</p>
              <div className="flex gap-3">
                <button
                  onClick={retryCamera}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Try Again
                </button>
                <button
                  onClick={debugCameraStatus}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  Debug
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clothing Instructions */}
        {!isInitialCountdownActive && !measurements && !isProcessing && selectedStyleId && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
            <div className="bg-black/60 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg">
              <p className="text-sm font-medium">
                {getClothingInstructions(selectedStyleId)}
              </p>
            </div>
          </div>
        )}

        {/* Auto-skip countdown overlay */}
        {!isInitialCountdownActive && autoSkipCountdown > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
            <div className="bg-green-600 text-white rounded-full w-24 h-24 flex items-center justify-center text-2xl font-bold">
              {autoSkipCountdown}
            </div>
            <div className="mt-4 text-center">
              <p className="text-white text-lg font-medium bg-black/60 px-4 py-2 rounded-lg">
                Auto-skipping in {autoSkipCountdown} second{autoSkipCountdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        {!isInitialCountdownActive && !measurements && !isProcessing && (
          <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
            <div className="flex gap-3">
              <button
                onClick={stopCamera}
                className="flex-1 bg-white/80 text-gray-900 backdrop-blur px-4 py-3 rounded-lg font-medium hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeMeasurement}
                disabled={!poseResults?.isDetected || !canTakeMeasurement}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isPoseStable ? 'Take Measurement' : 
                  `Hold Still... ${Math.round(stabilityProgress * 100)}%`}
              </button>
            </div>
            
            {/* Manual override when pose is stable */}
            {isPoseStable && validation.isValid && (
              <div className="mt-3 text-center">
                <button
                  onClick={() => {
                    setAutoSkipCountdown(0)
                    handleTakeMeasurement()
                  }}
                  className="text-white/80 text-sm hover:text-white underline"
                >
                  Take measurements manually instead of auto-skip
                </button>
              </div>
            )}
          </div>
        )}

        {/* Processing overlay */}
        {!isInitialCountdownActive && isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Processing Measurements</h2>
              <p className="text-sm text-gray-600">
                Analyzing your pose and calculating measurements...
              </p>
            </div>
          </div>
        )}

        {/* Results overlay */}
        {!isInitialCountdownActive && measurements && (
          <div className="absolute inset-0 z-30 flex items-end p-4">
            <div className="w-full bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Measurements</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Chest', value: measurements.chest },
                  { label: 'Waist', value: measurements.waist },
                  { label: 'Hips', value: measurements.hips },
                  { label: 'Shoulders', value: measurements.shoulders },
                  { label: 'Arm Length', value: measurements.armLength },
                  { label: 'Inseam', value: measurements.inseam }
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{value}"</p>
                    <p className="text-sm text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleRetake}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200"
                >
                  Retake
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                  Continue to Recommendations
                </button>
              </div>
            </div>
          </div>
        )}
      </main>



      {/* Debug Overlay */}
      <DebugOverlay
        isVisible={showDebugOverlay}
        onClose={() => setShowDebugOverlay(false)}
        poseDetectionStatus={{
          isInitialized: isPoseInitialized,
          isLoading: isPoseLoading,
          error: poseError,
          poseResults: poseResults
        }}
        cameraStatus={{
          isActive: !cameraError,
          error: cameraError,
          stream: videoRef.current?.srcObject as MediaStream
        }}
        videoElement={videoRef.current}
        poseStability={{
          isStable: isPoseStable,
          stableLandmarksCount,
          totalLandmarksCount,
          stabilityProgress,
          message: stabilityMessage
        }}
      />
    </div>
  )
}

export function MeasurementsStep(props: MeasurementsStepProps) {
  return (
    <InAppErrorBoundary>
      <GlobalErrorHooks />
      <MeasurementsStepImpl {...props} />
    </InAppErrorBoundary>
  )
}