import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Measurements, MeasurementValidation } from '../types'
import { usePoseDetectionTF, POSENET_KEYPOINTS } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { Logger } from '../utils/Logger'
import { DebugOverlay } from './DebugOverlay'
import { ConfidenceThreshold } from './ConfidenceThreshold'
import { getClothingInstructions } from '../data/poseRequirements'
import React from 'react'

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
  onMeasurementsComplete: (measurements: Measurements) => void
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasBootedRef = useRef(false)

  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  const [canTakeMeasurement, setCanTakeMeasurement] = useState(false)

  const {
    poseResults,
    isInitialized: isPoseInitialized,
    isLoading: isPoseLoading,
    error: poseError,
    initializePose,
    startDetection,
    stopDetection,
    cleanup,
    getHealthStatus
  } = usePoseDetectionTF()

  // Pose validation hook for confidence thresholds
  const {
    validation,
    resetValidation
  } = usePoseValidation({
    poseResults,
    selectedStyleId,
    onValidationComplete: (validation: MeasurementValidation) => {
      Logger.info('Pose validation complete', { validation })
      // Auto-enable measurement button when validation is complete
      if (validation.isValid) {
        setCanTakeMeasurement(true)
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

  // Draw pose landmarks on canvas
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

    // Set drawing style
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.fillStyle = '#00ff00'

    // Draw keypoints
    poseResults.landmarks.forEach((landmark, index) => {
      if (landmark.confidence > 0.3) {
        // Transform coordinates from video space to canvas space
        // Account for object-contain scaling and centering
        // Since the canvas has -scale-x-100 applied, we need to flip the x-coordinate
        const x = canvas.width - ((landmark.x * scale) + offsetX)
        const y = (landmark.y * scale) + offsetY

        // Draw keypoint
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()

        // Draw keypoint index and confidence
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px Arial'
        ctx.fillText(`${index}:${(landmark.confidence * 100).toFixed(0)}%`, x + 8, y - 8)
        ctx.fillStyle = '#00ff00'
      }
    })

    Logger.debug('Drew pose landmarks', {
      keypoints: poseResults.landmarks.length,
      scale,
      offsetX,
      offsetY
    })
  }, [poseResults])

  const forceStartDetection = useCallback(() => {
    Logger.info('Manual detection restart triggered')
    if (!isPoseInitialized) {
      Logger.warn('Cannot force start: Pose not initialized yet')
      return
    }
    if (!videoRef.current && !isDemoMode) {
      Logger.warn('Cannot force start: No video element')
      return
    }
    try {
      stopDetection()
      Logger.info('Restarting pose detection...')
      startDetection().then(() => {
        Logger.info('Pose detection manually restarted successfully')
      }).catch((err: Error) => {
        Logger.error('Manual detection restart failed', { error: err.message })
      })
    } catch (err) {
      Logger.error('Manual detection restart error', { error: (err as Error).message })
    }
  }, [isPoseInitialized, stopDetection, startDetection, isDemoMode])

  // Demo mode activation
  const enableDemoMode = useCallback(() => {
    Logger.info('Enabling demo mode - camera not available')
    setIsDemoMode(true)
    setCameraError('')
    
    // Mock successful pose detection after delay
    setTimeout(async () => {
      Logger.info('Demo mode: Initializing mock pose detection')
      
      // Initialize pose detection in demo mode
      if (videoRef.current) {
        await initializePose(videoRef.current)
        await startDetection()
      }
      
      Logger.info('Demo mode: Ready for measurements')
    }, 1000)
  }, [initializePose, startDetection])

  // Enhanced camera initialization
  const startCamera = useCallback(async () => {
    if (hasBootedRef.current || !videoRef.current) {
      Logger.warn('startCamera: Already booted or no video element')
      return
    }

    Logger.info('Starting camera initialization')
    hasBootedRef.current = true
    setCameraError('')

    try {
      const video = videoRef.current

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this environment')
      }

      // Enhanced camera constraints with fallbacks
      const cameraConstraints = [
        {
          video: {
            facingMode: 'user',
            width: { ideal: 640, min: 320 },
            height: { ideal: 480, min: 240 },
            frameRate: { ideal: 30, min: 15 }
          }
        },
        {
          video: {
            facingMode: 'user',
            width: { ideal: 480 },
            height: { ideal: 360 }
          }
        },
        {
          video: true
        }
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

      // Try each constraint set
      for (const constraints of cameraConstraints) {
        try {
          Logger.info('Trying camera constraints:', constraints)
          stream = await navigator.mediaDevices.getUserMedia(constraints)
          Logger.info('Camera stream acquired successfully')
          break
        } catch (err) {
          lastError = err as Error
          Logger.warn(`Camera constraint failed: ${lastError.message}`)
          continue
        }
      }

      if (!stream) {
        throw lastError || new Error('All camera configurations failed')
      }

      // Set up video stream
      video.srcObject = stream
      Logger.info('Camera stream set on video element')

      // Wait for video to load with timeout and better error handling
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Video loading timeout - video may not be ready'))
        }, 15000) // Increased timeout

        const onLoadedMetadata = () => {
          clearTimeout(timeout)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          
          // Additional check for video dimensions
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            reject(new Error('Video dimensions not available'))
            return
          }
          
          Logger.info('Video metadata loaded successfully', {
            dimensions: `${video.videoWidth}x${video.videoHeight}`,
            readyState: video.readyState
          })
          resolve()
        }

        const onCanPlay = () => {
          Logger.info('Video can start playing')
        }

        const onError = (event: Event) => {
          clearTimeout(timeout)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          
          const error = event as ErrorEvent
          Logger.error('Video load error', { error: error.message || 'Unknown video error' })
          reject(new Error('Video load error: ' + (error.message || 'Unknown error')))
        }

        video.addEventListener('loadedmetadata', onLoadedMetadata)
        video.addEventListener('canplay', onCanPlay)
        video.addEventListener('error', onError)
        
        // Force load if not already loading
        if (video.readyState < 1) {
          video.load()
        }
      })

      // Try to play video with retry logic
      let playAttempts = 0
      const maxPlayAttempts = 3
      
      while (playAttempts < maxPlayAttempts) {
        try {
          await video.play()
          Logger.info('Video playing successfully')
          break
        } catch (playError) {
          playAttempts++
          Logger.warn(`Video play attempt ${playAttempts} failed:`, playError)
          
          if (playAttempts >= maxPlayAttempts) {
            throw new Error(`Failed to play video after ${maxPlayAttempts} attempts`)
          }
          
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      syncCanvasToVideo()

      // Initialize pose detection with better error handling
      try {
        await initializePose(video)
        Logger.info('Pose detection model initialized')

        await startDetection()
        Logger.info('Pose detection started successfully')
      } catch (poseError) {
        const poseErrorMessage = (poseError as Error).message
        Logger.warn('Pose detection failed, but camera is working', { 
          error: poseErrorMessage,
          stack: (poseError as Error).stack
        })

        // Don't fail completely if pose detection fails - camera is still working
        // Just show a warning and continue with basic camera functionality
        setCameraError(`Camera working but pose detection failed: ${poseErrorMessage}. You can still use manual measurements.`)
        
        // Don't enable demo mode immediately - let user see the camera feed
        // They can manually enable demo mode if needed
        return
      }

    } catch (error) {
      const errorMessage = (error as Error).message
      Logger.error('Camera initialization failed', { 
        error: errorMessage,
        stack: (error as Error).stack
      })

      // Set user-friendly error messages
      let userFriendlyMessage = errorMessage
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        userFriendlyMessage = 'Camera access denied. Please allow camera permissions and try again.'
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
        userFriendlyMessage = 'No camera found. Please ensure your device has a camera and try again.'
      } else if (errorMessage.includes('NotReadableError') || errorMessage.includes('TrackStartError')) {
        userFriendlyMessage = 'Camera is busy or unavailable. Please close other apps using the camera and try again.'
      } else if (errorMessage.includes('aborted') || errorMessage.includes('AbortError')) {
        userFriendlyMessage = 'Camera access was interrupted. Please try again.'
      } else if (errorMessage.includes('NotSupportedError') || errorMessage.includes('not supported')) {
        userFriendlyMessage = 'Camera not supported in this environment. Please use a different browser or device.'
      }

      setCameraError(userFriendlyMessage)
      hasBootedRef.current = false
      
      // Enable demo mode for testing
      enableDemoMode()
    }
  }, [syncCanvasToVideo, initializePose, startDetection, enableDemoMode])

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

  const handleTakeMeasurement = () => {
    Logger.info('Taking measurement', {
      poseDetected: poseResults?.isDetected,
      confidence: poseResults?.confidence,
      demoMode: isDemoMode
    })
    setIsProcessing(true)
    
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
      Logger.info('Measurements calculated', { measurements: mockMeasurements })
      setMeasurements(mockMeasurements)
      setIsProcessing(false)
      if (!isDemoMode) {
        stopCamera()
      }
    }, 2000)
  }

  const handleRetake = () => {
    Logger.info('User requested measurement retake')
    setMeasurements(null)
    setIsProcessing(false)
    if (!isDemoMode) {
      startCamera()
    }
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
    hasBootedRef.current = false
    setIsDemoMode(false)
    setCameraError('')
    startCamera()
  }

  const debugCameraStatus = () => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream;
    
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
      videoDimensions: `${video?.videoWidth}x${video?.videoHeight}`
    });
  };




  // Start camera automatically on mount
  useEffect(() => {
    Logger.info('Component mounted, starting camera')
    startCamera()

    return () => {
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
      hasBootedRef.current = false
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
<<<<<<< HEAD
    <div className="min-h-screen">
      {/* Header */}
=======
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header stays the same */}
>>>>>>> a455879333ab443d49dd86ea90b5414c2d995620
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
            {isDemoMode ? 'Demo Mode - Simulated measurements' : "We'll use your camera to measure you perfectly"}
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Confidence Threshold Component - Top UI */}
        <ConfidenceThreshold
          validation={validation}
          requirements={[]}
          isVisible={Boolean(!isDemoMode && !measurements && !isProcessing && selectedStyleId && poseResults?.isDetected)}
        />

        {isDemoMode ? (
          // Demo mode UI
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center p-8">
              <div className="w-32 h-32 mx-auto mb-6 border-4 border-white rounded-full flex items-center justify-center">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Demo Mode</h2>
              <p className="text-blue-100 mb-4">Camera not available - using simulated measurements</p>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                <p className="text-sm">
                  {isPoseInitialized ? '✅ Ready to take measurements' : '⏳ Initializing...'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Normal camera UI
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
          </>
        )}



        {/* Camera error UI */}
        {cameraError && !isDemoMode && (
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
                  onClick={enableDemoMode}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Demo Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clothing Instructions */}
        {!isDemoMode && !measurements && !isProcessing && selectedStyleId && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
            <div className="bg-black/60 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg">
              <p className="text-sm font-medium">
                {getClothingInstructions(selectedStyleId)}
              </p>
            </div>
          </div>
        )}

        {/* Bottom controls */}
        {!measurements && !isProcessing && (
          <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
            <div className="flex gap-3">
              <button
                onClick={isDemoMode ? enableDemoMode : stopCamera}
                className="flex-1 bg-white/80 text-gray-900 backdrop-blur px-4 py-3 rounded-lg font-medium hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeMeasurement}
                disabled={!isDemoMode && (!poseResults?.isDetected || !canTakeMeasurement)}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isDemoMode ? 'Take Measurement' : 'Waiting for Stable Pose...'}
              </button>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Processing Measurements</h2>
              <p className="text-sm text-gray-600">
                {isDemoMode ? 'Generating demo measurements...' : 'Analyzing your pose and calculating measurements...'}
              </p>
            </div>
          </div>
        )}

        {/* Results overlay */}
        {measurements && (
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
<<<<<<< HEAD
                  className="w-full bg-white text-black py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
=======
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
>>>>>>> a455879333ab443d49dd86ea90b5414c2d995620
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
          isActive: !isDemoMode && !cameraError,
          error: cameraError,
          stream: videoRef.current?.srcObject as MediaStream
        }}
        videoElement={videoRef.current}
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