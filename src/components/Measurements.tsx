import { useState, useRef, useEffect, useCallback } from 'react'
import { Measurements, MeasurementValidation } from '../types'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { Logger } from '../utils/Logger'

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
  onAutoProgress: () => void
  selectedItemName?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
  selectedStyleId?: string
}

export function MeasurementsStepImpl({
  onMeasurementsComplete,
  onAutoProgress,
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
    poseStability,
    setSelectedStyle
  } = usePoseDetectionTF(10)

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
    },
    poseStability
  })

  // Set selected style for pose stability tracking
  useEffect(() => {
    if (selectedStyleId) {
      setSelectedStyle(selectedStyleId)
    }
  }, [selectedStyleId, setSelectedStyle])



  // Reset validation when pose becomes unstable
  useEffect(() => {
    if (poseStability && !poseStability.isStable) {
      Logger.info('Pose became unstable, resetting validation')
      resetValidation()
      setCanTakeMeasurement(false)
    }
  }, [poseStability, resetValidation])

  // Auto-progress when stability reaches 100%
  useEffect(() => {
    if (poseStability && poseStability.stabilityScore >= 1.0 && !isProcessing) {
      Logger.info('Stability reached 100%, auto-progressing to next step in 1.5 seconds', {
        stabilityScore: poseStability.stabilityScore,
        measurements: !!measurements,
        isProcessing,
        poseStability
      })
      // Add a small delay to show the success message
      const timer = setTimeout(() => {
        Logger.info('Executing auto-progression to next step')
        onAutoProgress()
      }, 1500)
      
      return () => clearTimeout(timer)
    }
    return undefined
  }, [poseStability, isProcessing, onAutoProgress])

  // Log component initialization
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName
    })
    return undefined
  }, [selectedItemName, selectedCompanyName, selectedStyleName, selectedSubStyleName])



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

        // Check if this landmark is relevant for the current clothing type
        const isRelevant = poseStability?.relevantLandmarks.includes(index) ?? false
        
        // Draw keypoint with different colors for relevant vs non-relevant
        ctx.fillStyle = isRelevant ? '#00ff00' : '#666666'
        ctx.beginPath()
        ctx.arc(x, y, isRelevant ? 8 : 4, 0, 2 * Math.PI)
        ctx.fill()
        
        // Reset fill style for lines
        ctx.fillStyle = '#00ff00'
      }
    })

    // Draw connecting lines between relevant landmarks (skeleton)
    const skeletonConnections = [
      // Head and shoulders
      [0, 5], [0, 6], // nose to shoulders
      [1, 3], [2, 4], // eyes to ears
      [3, 5], [4, 6], // ears to shoulders
      
      // Upper body
      [5, 6], // shoulders
      [5, 7], [6, 8], // shoulders to elbows
      [7, 9], [8, 10], // elbows to wrists
      
      // Torso
      [5, 11], [6, 12], // shoulders to hips
      [11, 12], // hips
      
      // Lower body
      [11, 13], [12, 14], // hips to knees
      [13, 15], [14, 16], // knees to ankles
      [13, 14] // knees
    ]

    skeletonConnections.forEach(([index1, index2]) => {
      const landmark1 = poseResults.landmarks[index1]
      const landmark2 = poseResults.landmarks[index2]
      
      if (landmark1 && landmark2 && 
          landmark1.confidence > 0.3 && landmark2.confidence > 0.3) {
        
        const x1 = canvas.width - ((landmark1.x * scale) + offsetX)
        const y1 = (landmark1.y * scale) + offsetY
        const x2 = canvas.width - ((landmark2.x * scale) + offsetX)
        const y2 = (landmark2.y * scale) + offsetY

        // Check if this connection is relevant for the current clothing type
        const isRelevant = poseStability?.relevantLandmarks.includes(index1) && 
                          poseStability?.relevantLandmarks.includes(index2)
        
        // Draw skeleton line with different styles for relevant vs non-relevant
        ctx.strokeStyle = isRelevant ? '#00ff00' : '#666666'
        ctx.lineWidth = isRelevant ? 3 : 1
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
    })

    // Draw measurement overlay if measurements are available
    if (measurements && selectedStyleId) {
      // Define measurement connections and their labels based on clothing type
      const getMeasurementConnections = () => {
        const connections: Array<{
          indices: [number, number]
          label: string
          value: string
          description: string
        }> = []

        switch (selectedStyleId) {
          case 'shirts':
            // Shoulder width (left shoulder to right shoulder)
            connections.push({
              indices: [5, 6], // leftShoulder, rightShoulder
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points'
            })
            // Body length (nose to hip center)
            connections.push({
              indices: [0, 11], // nose to leftHip (approximate)
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Upper body length'
            })
            // Arm length (shoulder to elbow to wrist)
            connections.push({
              indices: [5, 7], // leftShoulder to leftElbow
              label: 'Arm Length',
              value: `${measurements.armLength}"`,
              description: 'Shoulder to elbow'
            })
            break

          case 'pants':
            // Hip width (left hip to right hip)
            connections.push({
              indices: [11, 12], // leftHip, rightHip
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points'
            })
            // Leg length (hip to knee to ankle)
            connections.push({
              indices: [11, 13], // leftHip to leftKnee
              label: 'Leg Length',
              value: `${measurements.inseam}"`,
              description: 'Hip to knee'
            })
            // Waist measurement
            connections.push({
              indices: [5, 11], // leftShoulder to leftHip (approximate waist)
              label: 'Waist',
              value: `${measurements.waist}"`,
              description: 'Waist circumference'
            })
            break

          case 'shorts':
            // Hip width (left hip to right hip)
            connections.push({
              indices: [11, 12], // leftHip, rightHip
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points'
            })
            // Thigh length (hip to knee)
            connections.push({
              indices: [11, 13], // leftHip to leftKnee
              label: 'Thigh Length',
              value: `${measurements.inseam}"`,
              description: 'Hip to knee'
            })
            break

          case 'jackets':
            // Shoulder width (left shoulder to right shoulder)
            connections.push({
              indices: [5, 6], // leftShoulder, rightShoulder
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points'
            })
            // Body length (nose to hip center)
            connections.push({
              indices: [0, 11], // nose to leftHip (approximate)
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Upper body length'
            })
            // Arm length (shoulder to elbow)
            connections.push({
              indices: [5, 7], // leftShoulder to leftElbow
              label: 'Arm Length',
              value: `${measurements.armLength}"`,
              description: 'Shoulder to elbow'
            })
            break

          case 'activewear':
            // Shoulder width (left shoulder to right shoulder)
            connections.push({
              indices: [5, 6], // leftShoulder, rightShoulder
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points'
            })
            // Hip width (left hip to right hip)
            connections.push({
              indices: [11, 12], // leftHip, rightHip
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points'
            })
            // Body length (shoulder to hip)
            connections.push({
              indices: [5, 11], // leftShoulder to leftHip
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Shoulder to hip'
            })
            break

          default:
            // Default connections for unknown clothing types
            connections.push({
              indices: [5, 6], // leftShoulder, rightShoulder
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points'
            })
            connections.push({
              indices: [11, 12], // leftHip, rightHip
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points'
            })
        }

        return connections
      }

      const measurementConnections = getMeasurementConnections()

      // Draw measurement text for each connection
      measurementConnections.forEach(({ indices, label, value, description }) => {
        const [index1, index2] = indices
        const landmark1 = poseResults.landmarks[index1]
        const landmark2 = poseResults.landmarks[index2]

        if (landmark1 && landmark2 && 
            landmark1.confidence > 0.3 && landmark2.confidence > 0.3) {
          
          // Transform coordinates from video space to canvas space
          const x1 = canvas.width - ((landmark1.x * scale) + offsetX)
          const y1 = (landmark1.y * scale) + offsetY
          const x2 = canvas.width - ((landmark2.x * scale) + offsetX)
          const y2 = (landmark2.y * scale) + offsetY

          // Calculate midpoint of the connection
          const midX = (x1 + x2) / 2
          const midY = (y1 + y2) / 2

          // Calculate the angle of the connection for text orientation
          const angle = Math.atan2(y2 - y1, x2 - x1)

          // Save context for rotation
          ctx.save()
          
          // Move to midpoint and rotate
          ctx.translate(midX, midY)
          ctx.rotate(angle)

          // Draw background rectangle for text
          const textWidth = ctx.measureText(`${label}: ${value}`).width
          const textHeight = 20
          const padding = 8
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(
            -textWidth / 2 - padding, 
            -textHeight / 2 - padding, 
            textWidth + padding * 2, 
            textHeight + padding * 2
          )

          // Draw border
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2
          ctx.strokeRect(
            -textWidth / 2 - padding, 
            -textHeight / 2 - padding, 
            textWidth + padding * 2, 
            textHeight + padding * 2
          )

          // Draw text
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${label}: ${value}`, 0, 0)

          // Draw description below
          ctx.font = '10px Arial'
          ctx.fillStyle = '#cccccc'
          ctx.fillText(description, 0, 15)

          // Restore context
          ctx.restore()

          // Draw a small indicator dot at the midpoint
          ctx.fillStyle = '#00ff00'
          ctx.beginPath()
          ctx.arc(midX, midY, 4, 0, 2 * Math.PI)
          ctx.fill()
        }
      })
    }

    Logger.debug('Drew pose landmarks', {
      keypoints: poseResults.landmarks.length,
      scale,
      offsetX,
      offsetY
    })
  }, [poseResults, measurements, selectedStyleId])



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

  // Log pose stability changes for debugging
  useEffect(() => {
    if (poseStability) {
      Logger.debug('Pose stability updated', {
        stabilityScore: poseStability.stabilityScore,
        isStable: poseStability.isStable,
        relevantLandmarks: poseStability.relevantLandmarks.length
      })
    }
  }, [poseStability])

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
            {isDemoMode ? 'Demo Mode - Simulated measurements' : "We'll use your camera to measure you perfectly"}
          </p>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative flex-1 overflow-hidden">
        {/* Confidence Threshold Component - Top UI */}
        <ConfidenceThreshold
          validation={validation}
          isVisible={Boolean(!isDemoMode && !measurements && !isProcessing && selectedStyleId && poseResults?.isDetected)}
          poseStability={poseStability}
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

        {/* Pose Stability Status */}
        {!isDemoMode && !measurements && !isProcessing && poseStability && (
          <div className="absolute bottom-32 left-4 z-20">






            <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
              poseStability.isStable 
                ? 'bg-green-600/80 text-white' 
                : 'bg-red-600/80 text-white'
            }`}>
              {poseStability.isStable ? '✅ Pose Stable' : '⚠️ Pose Unstable'}
            </div>
            
            {/* Stability Progress Bar */}
            <div className="mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-black/60 text-white">
              <div className="flex items-center space-x-2 mb-1">
                <span>Stability:</span>
                <span className="font-bold">{Math.round(poseStability.stabilityScore * 100)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    poseStability.stabilityScore >= 1.0 ? 'bg-green-400' : 'bg-blue-400'
                  }`}
                  style={{ width: `${poseStability.stabilityScore * 100}%` }}
                />
              </div>
            </div>
            
            {/* Auto-progression indicator */}
            {poseStability.stabilityScore >= 0.9 && poseStability.stabilityScore < 1.0 && (
              <div className="mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600/80 text-white">
                🚀 Almost ready! Hold still a bit longer...
              </div>
            )}
            {poseStability.stabilityScore >= 1.0 && (
              <div className="mt-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600/80 text-white">
                🎉 Perfect! Moving to next step...
              </div>
            )}
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
                {isDemoMode ? 'Take Measurement' : 
                  poseStability?.isStable ? 'Take Measurement' : 'Hold Still for Measurements...'}
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
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700"
                >
                  Continue to Recommendations
                </button>
              </div>
            </div>
          </div>
        )}
      </main>




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