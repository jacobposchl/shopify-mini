// src/components/Measurements.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Measurements, MeasurementValidation } from '../types'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { Logger } from '../utils/Logger'

import { ConfidenceThreshold } from './ConfidenceThreshold'
import { getClothingInstructions } from '../data/poseRequirements'
import { BackButton } from './BackButton'

// Extend Window interface to include our custom property
declare global {
  interface Window {
    outlineImage?: HTMLImageElement
  }
}

// Style-specific outline configurations
interface OutlineConfig {
  bodyParts: string[]
  focusArea: 'upper' | 'lower' | 'upper_extended' | 'full_body'
  requiredLandmarks: number[]
  idealShoulderWidth: number
  minShoulderWidth: number
  maxShoulderWidth: number
  idealHipWidth: number
  minHipWidth: number
  maxHipWidth: number
  confidenceThreshold: number
}

const OUTLINE_CONFIGS: Record<string, OutlineConfig> = {
  shirts: {
    bodyParts: ['head', 'shoulders', 'chest', 'arms'],
    focusArea: 'upper',
    requiredLandmarks: [0, 5, 6, 7, 8, 9, 10], // nose, shoulders, elbows, wrists
    idealShoulderWidth: 150, // pixels at optimal distance
    minShoulderWidth: 100,
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  },
  pants: {
    bodyParts: ['hips', 'legs', 'knees', 'ankles'],
    focusArea: 'lower', 
    requiredLandmarks: [11, 12, 13, 14, 15, 16], // hips, knees, ankles
    idealShoulderWidth: 150,
    minShoulderWidth: 100,
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  },
  shorts: {
    bodyParts: ['hips', 'legs', 'knees'],
    focusArea: 'lower',
    requiredLandmarks: [11, 12, 13, 14], // hips, knees
    idealShoulderWidth: 150,
    minShoulderWidth: 100,
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  },
  jackets: {
    bodyParts: ['head', 'shoulders', 'chest', 'arms', 'torso'],
    focusArea: 'upper_extended', 
    requiredLandmarks: [0, 5, 6, 7, 8, 9, 10, 11, 12],
    idealShoulderWidth: 150,
    minShoulderWidth: 100, 
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  },
  dresses: {
    bodyParts: ['head', 'shoulders', 'chest', 'torso', 'hips'],
    focusArea: 'full_body',
    requiredLandmarks: [0, 5, 6, 11, 12, 13, 14],
    idealShoulderWidth: 150,
    minShoulderWidth: 100,
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  },
  activewear: {
    bodyParts: ['head', 'shoulders', 'chest', 'torso', 'hips', 'legs'],
    focusArea: 'full_body',
    requiredLandmarks: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    idealShoulderWidth: 150,
    minShoulderWidth: 100,
    maxShoulderWidth: 250,
    idealHipWidth: 140,
    minHipWidth: 90,
    maxHipWidth: 220,
    confidenceThreshold: 0.6
  }
}

// Style-specific outline drawing functions
const drawUpperBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  
  const headRadius = 25 * scale
  const shoulderWidth = 120 * scale
  const chestHeight = 80 * scale
  const armLength = 100 * scale
  
  // Head - use a box instead of circle with lines
  const headBoxWidth = headRadius * 1.5
  const headBoxHeight = headRadius * 2
  ctx.beginPath()
  ctx.rect(centerX - headBoxWidth/2, centerY - headBoxHeight/2, headBoxWidth, headBoxHeight)
  ctx.stroke()
  
  // Shoulders
  const shoulderY = centerY + headBoxHeight/2 + 15
  ctx.beginPath()
  ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX + shoulderWidth/2, shoulderY)
  ctx.stroke()
  
  // Chest/torso
  ctx.beginPath()
  ctx.rect(centerX - shoulderWidth/3, shoulderY, shoulderWidth * 2/3, chestHeight)
  ctx.stroke()
  
  // Arms
  ctx.beginPath()
  ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX - shoulderWidth/2 - 20, shoulderY + armLength/2)
  ctx.lineTo(centerX - shoulderWidth/2 - 10, shoulderY + armLength)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(centerX + shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX + shoulderWidth/2 + 20, shoulderY + armLength/2)
  ctx.lineTo(centerX + shoulderWidth/2 + 10, shoulderY + armLength)
  ctx.stroke()
  
  ctx.restore()
}

const drawLowerBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  
  const hipWidth = 100 * scale
  const legLength = 160 * scale
  const legWidth = 25 * scale
  
  // Hips
  ctx.beginPath()
  ctx.rect(centerX - hipWidth/2, centerY, hipWidth, 40 * scale)
  ctx.stroke()
  
  // Legs
  const legY = centerY + 40 * scale
  ctx.beginPath()
  ctx.rect(centerX - hipWidth/3, legY, legWidth, legLength)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.rect(centerX + hipWidth/3 - legWidth, legY, legWidth, legLength)
  ctx.stroke()
  
  ctx.restore()
}

const drawFullBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
  // Draw both upper and lower body
  drawUpperBodyOutline(ctx, centerX, centerY, scale, alpha)
  drawLowerBodyOutline(ctx, centerX, centerY + 80 * scale, scale, alpha)
}

const drawUpperExtendedOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 4
  
  const headRadius = 25 * scale
  const shoulderWidth = 120 * scale
  const chestHeight = 100 * scale
  const armLength = 100 * scale
  const torsoHeight = 60 * scale
  
  // Head - use a box instead of circle with lines
  const headBoxWidth = headRadius * 1.5
  const headBoxHeight = headRadius * 2
  ctx.beginPath()
  ctx.rect(centerX - headBoxWidth/2, centerY - headBoxHeight/2, headBoxWidth, headBoxHeight)
  ctx.stroke()
  
  // Shoulders
  const shoulderY = centerY + headBoxHeight/2 + 15
  ctx.beginPath()
  ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX + shoulderWidth/2, shoulderY)
  ctx.stroke()
  
  // Chest/torso
  ctx.beginPath()
  ctx.rect(centerX - shoulderWidth/3, shoulderY, shoulderWidth * 2/3, chestHeight)
  ctx.stroke()
  
  // Extended torso
  const torsoY = shoulderY + chestHeight
  ctx.beginPath()
  ctx.rect(centerX - shoulderWidth/4, torsoY, shoulderWidth * 1/2, torsoHeight)
  ctx.stroke()
  
  // Arms
  ctx.beginPath()
  ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX - shoulderWidth/2 - 20, shoulderY + armLength/2)
  ctx.lineTo(centerX - shoulderWidth/2 - 10, shoulderY + armLength)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.moveTo(centerX + shoulderWidth/2, shoulderY)
  ctx.lineTo(centerX + shoulderWidth/2 + 20, shoulderY + armLength/2)
  ctx.lineTo(centerX + shoulderWidth/2 + 10, shoulderY + armLength)
  ctx.stroke()
  
  ctx.restore()
}

// Position feedback interface and analysis
interface PositionFeedback {
  isInFrame: boolean
  isCorrectDistance: boolean
  isProperlyAligned: boolean
  feedbackMessage: string
  feedbackType: 'success' | 'warning' | 'error'
  adjustmentNeeded: 'move_back' | 'move_closer' | 'center_yourself' | 'good' | 'raise_camera' | 'lower_camera'
}

const analyzeUserPosition = (
  poseResults: any, 
  selectedStyleId: string, 
  canvasWidth: number, 
  canvasHeight: number
): PositionFeedback => {
  
  const defaultFeedback: PositionFeedback = {
    isInFrame: false,
    isCorrectDistance: false,
    isProperlyAligned: false,
    feedbackMessage: "Stand in front of camera",
    feedbackType: 'error',
    adjustmentNeeded: 'center_yourself'
  }

  if (!poseResults?.isDetected || !poseResults.landmarks.length) {
    return defaultFeedback
  }

  const config = OUTLINE_CONFIGS[selectedStyleId as keyof typeof OUTLINE_CONFIGS] || OUTLINE_CONFIGS.shirts
  const landmarks = poseResults.landmarks
  
  // Check if required landmarks are visible and confident
  const visibleLandmarks = config.requiredLandmarks.filter(index => 
    landmarks[index] && landmarks[index].confidence > config.confidenceThreshold
  )
  
  const isInFrame = visibleLandmarks.length >= config.requiredLandmarks.length * 0.8

  if (!isInFrame) {
    return {
      ...defaultFeedback,
      feedbackMessage: "Please step into camera view",
      adjustmentNeeded: 'center_yourself'
    }
  }

  // Calculate distance based on key measurement
  let currentWidth = 0
  let idealWidth = 0
  let minWidth = 0
  let maxWidth = 0

  if (config.focusArea.includes('upper')) {
    // Use shoulder width for upper body measurements
    if (landmarks[5] && landmarks[6]) {
      currentWidth = Math.abs(landmarks[5].x - landmarks[6].x) * canvasWidth
      idealWidth = config.idealShoulderWidth
      minWidth = config.minShoulderWidth
      maxWidth = config.maxShoulderWidth
    }
  } else {
    // Use hip width for lower body measurements  
    if (landmarks[11] && landmarks[12]) {
      currentWidth = Math.abs(landmarks[11].x - landmarks[12].x) * canvasWidth
      idealWidth = config.idealHipWidth
      minWidth = config.minHipWidth
      maxWidth = config.maxHipWidth
    }
  }

  // Distance analysis
  const isCorrectDistance = currentWidth >= minWidth && currentWidth <= maxWidth
  const isTooClose = currentWidth > maxWidth
  const isTooFar = currentWidth < minWidth

  // Alignment analysis (check if person is centered)
  const bodyCenter = landmarks[0] ? landmarks[0].x : 0.5 // Use nose as center reference
  const isProperlyAligned = Math.abs(bodyCenter - 0.5) < 0.15 // Within 15% of center

  // Generate feedback
  let feedbackMessage = ""
  let feedbackType: 'success' | 'warning' | 'error' = 'success'
  let adjustmentNeeded: PositionFeedback['adjustmentNeeded'] = 'good'

  if (!isProperlyAligned) {
    feedbackMessage = "Please center yourself in the frame"
    feedbackType = 'warning'
    adjustmentNeeded = 'center_yourself'
  } else if (isTooClose) {
    feedbackMessage = "Please step back from the camera"
    feedbackType = 'warning'  
    adjustmentNeeded = 'move_back'
  } else if (isTooFar) {
    feedbackMessage = "Please move closer to the camera"
    feedbackType = 'warning'
    adjustmentNeeded = 'move_closer'
  } else {
    feedbackMessage = "Perfect position! Hold still."
    feedbackType = 'success'
    adjustmentNeeded = 'good'
  }

  return {
    isInFrame,
    isCorrectDistance,
    isProperlyAligned,
    feedbackMessage,
    feedbackType,
    adjustmentNeeded
  }
}

// Error boundary component
class InAppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { err?: Error; stack?: string; open: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { err: undefined, stack: '', open: false }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    })
    this.setState({
      err: error,
      stack: info?.componentStack ?? '',
      open: true,
    })
  }

  render() {
    if (!this.state.open) return this.props.children

    const message = this.state.err?.message ?? 'Unknown error'

    return (
      <div
        style={{
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
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <strong>⚠️ React Error</strong>
          <button
            onClick={() => this.setState({ open: false })}
            style={{
              background: '#333',
              color: '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong>Error:</strong> {message}
        </div>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            margin: 0,
            fontSize: 12,
            background: '#222',
            padding: 12,
            borderRadius: 6,
            overflow: 'auto',
          }}
        >
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
        colno: e.colno,
      })
      setMsg(errorMsg)
    }

    const onRej = (e: PromiseRejectionEvent) => {
      const errorMsg = `unhandledrejection: ${e.reason?.message ?? e.reason}\n${e.reason?.stack ?? ''}`
      Logger.error('Unhandled promise rejection', {
        reason: e.reason?.message ?? e.reason,
        stack: e.reason?.stack,
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
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        right: 12,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        zIndex: 99998,
        padding: 12,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <strong>⚠️ Runtime Error</strong>
        <button
          onClick={() => setMsg(null)}
          style={{
            background: '#333',
            color: '#fff',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          margin: 0,
          fontSize: 12,
        }}
      >
        {msg}
      </pre>
    </div>
  )
}

interface MeasurementsStepProps {
  onMeasurementsComplete: (measurements: Measurements) => void
  onAutoProgress: () => void
  onCancel: () => void
  selectedItemName?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
  selectedStyleId?: string
}

export function MeasurementsStepImpl({
  onMeasurementsComplete,
  onAutoProgress,
  onCancel,
  selectedItemName,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName,
  selectedStyleId,
}: MeasurementsStepProps) {
  // Simple clothing type detection based on product name
  const getOutlineForClothingType = (productName?: string): string => {
    if (!productName) return '/skeleton_outline.png'
    
    const nameLower = productName.toLowerCase()
    
    // Top items (shirts, jackets, sweaters, etc.)
    const topKeywords = [
      'shirt', 't-shirt', 'tshirt', 'top', 'blouse', 'polo', 'sweater', 'hoodie', 'jacket', 'coat', 'blazer', 'vest', 'tank', 'crop'
    ]
    
    // Bottom items (pants, shorts, skirts, etc.)
    const bottomKeywords = [
      'pants', 'jeans', 'trousers', 'slacks', 'shorts', 'skirt', 'leggings', 'joggers', 'sweatpants'
    ]
    
    // Check if it's a top item
    if (topKeywords.some(keyword => nameLower.includes(keyword))) {
      return '/upper-body-outline.png'
    }
    
    // Check if it's a bottom item
    if (bottomKeywords.some(keyword => nameLower.includes(keyword))) {
      return '/lower-body-outline.png'
    }
    
    // Default to full body outline
    return '/skeleton_outline.png'
  }

  // --- helpers to compute distances/measurements ---
  const calculateDistance = (landmark1: any, landmark2: any, scale: number) => {
    const pixelDistance = Math.sqrt(
      Math.pow((landmark2.x - landmark1.x) * scale, 2) + Math.pow((landmark2.y - landmark1.y) * scale, 2),
    )
    const calibrationFactor = 22.5 / 2.0 // rough, demo-only
    const distanceInInches = (pixelDistance / 50) * calibrationFactor
    return distanceInInches.toFixed(1)
  }

  const calculateRealMeasurements = (landmarks: any[], scale: number, clothingType: string) => {
    const measurements: Measurements = {
      chest: 0,
      waist: 0,
      hips: 0,
      shoulders: 0,
      armLength: 0,
      inseam: 0,
      height: 70,
      weight: 165,
    }

    if (landmarks[5] && landmarks[6]) {
      measurements.shoulders = parseFloat(calculateDistance(landmarks[5], landmarks[6], scale))
    }

    switch (clothingType) {
      case 'shirts':
      case 'jackets':
        measurements.chest = measurements.shoulders * 2.3
        if (landmarks[5] && landmarks[7]) {
          measurements.armLength = parseFloat(calculateDistance(landmarks[5], landmarks[7], scale))
        }
        measurements.waist = measurements.chest * 0.85
        break

      case 'pants':
      case 'shorts':
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12], scale))
        }
        measurements.waist = measurements.hips * 2.2
        if (clothingType === 'pants' && landmarks[11] && landmarks[15]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[15], scale))
        } else if (clothingType === 'shorts' && landmarks[11] && landmarks[13]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[13], scale))
        }
        break

      case 'activewear':
        measurements.chest = measurements.shoulders * 2.3
        measurements.waist = measurements.chest * 0.85
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12], scale))
        }
        if (landmarks[5] && landmarks[7]) {
          measurements.armLength = parseFloat(calculateDistance(landmarks[5], landmarks[7], scale))
        }
        if (landmarks[11] && landmarks[15]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[15], scale))
        }
        break

      default:
        measurements.chest = measurements.shoulders * 2.3
        measurements.waist = measurements.chest * 0.85
        measurements.hips = measurements.shoulders * 2.1
    }

    return measurements
  }

  // --- refs & state ---
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasBootedRef = useRef(false)

  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [debugEffectCount, setDebugEffectCount] = useState(0)
  const [debugAutoTrigger, setDebugAutoTrigger] = useState(false)
  const [debugError, setDebugError] = useState<string>('')
  const [isPoseDetectionWaiting, setIsPoseDetectionWaiting] = useState(false)
  const [measurementBuffer, setMeasurementBuffer] = useState<Measurements[]>([])
  const [debugBufferSize, setDebugBufferSize] = useState(0)
  const [canTakeMeasurement, setCanTakeMeasurement] = useState(false)
  const [positionFeedback, setPositionFeedback] = useState<PositionFeedback | null>(null)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)

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
    setSelectedStyle,
    updatePositionFeedback,
  } = usePoseDetectionTF(10)

  // Pose validation hook
  const { validation, resetValidation } = usePoseValidation({
    poseResults,
    selectedStyleId,
    onValidationComplete: (validation: MeasurementValidation) => {
      Logger.info('Pose validation complete', { validation })
      if (validation.isValid) setCanTakeMeasurement(true)
    },
    poseStability,
  })

  // Set selected style for pose stability tracking
  useEffect(() => {
    if (selectedStyleId) setSelectedStyle(selectedStyleId)
  }, [selectedStyleId, setSelectedStyle])

  // Track measurements while stabilizing
  useEffect(() => {
    if (
      poseResults?.isDetected &&
      validation &&
      validation.progress > 0 &&
      validation.progress < 1.0 &&
      poseStability?.isStable &&
      selectedStyleId
    ) {
      try {
        const current = calculateRealMeasurements(
          poseResults.landmarks,
          parseFloat(canvasRef.current?.dataset.videoScale || '1'),
          selectedStyleId,
        )
        setMeasurementBuffer((prev) => {
          const next = [...prev, current].slice(-100)
          setDebugBufferSize(next.length)
          return next
        })
      } catch (e) {
        setDebugError(`Measurement tracking error: ${(e as Error).message}`)
      }
    }
  }, [poseResults, validation?.progress, poseStability?.isStable, selectedStyleId])

  // Update position feedback when pose results change
  useEffect(() => {
    if (canvasRef.current && poseResults && selectedStyleId) {
      const feedback = analyzeUserPosition(poseResults, selectedStyleId, canvasRef.current.width, canvasRef.current.height)
      setPositionFeedback(feedback)
      // Also update the pose detection hook with position feedback for stability calculations
      updatePositionFeedback(feedback)
    }
  }, [poseResults, selectedStyleId, updatePositionFeedback])

  useEffect(() => {
    if (!validation || validation.progress === 0 || !poseStability?.isStable) {
      setMeasurementBuffer([])
      setDebugBufferSize(0)
    }
  }, [validation?.progress, poseStability?.isStable])

  useEffect(() => {
    if (poseStability && !poseStability.isStable) {
      Logger.info('Pose became unstable, resetting validation')
      resetValidation()
      setCanTakeMeasurement(false)
    }
  }, [poseStability, resetValidation])

  const stopCamera = useCallback(() => {
    Logger.info('Stopping camera')
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
      Logger.debug('Camera stream stopped and cleared')
    }
    stopDetection()
  }, [stopDetection])

  // Helper function to average measurements
  const averageMeasurements = useCallback((arr: Measurements[]): Measurements => {
    if (arr.length === 0) {
      return {
        chest: 42,
        waist: 32,
        hips: 38,
        shoulders: 18,
        armLength: 25,
        inseam: 32,
        height: 70,
        weight: 165,
      }
    }

    const sum: Measurements = {
      chest: 0,
      waist: 0,
      hips: 0,
      shoulders: 0,
      armLength: 0,
      inseam: 0,
      height: 0,
      weight: 0,
    }

    arr.forEach((m) => {
      sum.chest += m.chest
      sum.waist += m.waist
      sum.hips += m.hips
      sum.shoulders += m.shoulders
      sum.armLength += m.armLength
      sum.inseam += m.inseam
      sum.height += m.height
      sum.weight += m.weight
    })

    const c = arr.length
    const round1 = (n: number) => Math.round(n * 10) / 10

    return {
      chest: round1(sum.chest / c),
      waist: round1(sum.waist / c),
      hips: round1(sum.hips / c),
      shoulders: round1(sum.shoulders / c),
      armLength: round1(sum.armLength / c),
      inseam: round1(sum.inseam / c),
      height: round1(sum.height / c),
      weight: round1(sum.weight / c),
    }
  }, [])

  // Auto-progress when valid
  useEffect(() => {
    setDebugEffectCount((prev) => prev + 1)

    // COMMENTED OUT: Auto-progress when validation reaches 100%
    // if (validation && validation.isValid && validation.progress >= 1.0 && !measurements && !debugAutoTrigger) {
    //   setDebugAutoTrigger(true)

    //   try {
    //     const averaged = averageMeasurements(measurementBuffer)
    //     setMeasurements(averaged)
    //     if (!isDemoMode) stopCamera()
    //     onMeasurementsComplete(averaged)
    //   } catch (error) {
    //     setDebugError((error as Error).message)
    //     const fallback = {
    //       chest: 42,
    //       waist: 32,
    //       hips: 38,
    //       shoulders: 18,
    //       armLength: 25,
    //       inseam: 32,
    //       height: 70,
    //       weight: 165,
    //     }
    //     setMeasurements(fallback)
    //     onMeasurementsComplete(fallback)
    //   }
    // }

    if (!validation || !validation.isValid || validation.progress < 1.0) {
      setDebugAutoTrigger(false)
      setDebugError('')
    }
  }, [
    validation?.isValid,
    validation?.progress,
    measurements,
    debugAutoTrigger,
    measurementBuffer,
    isDemoMode,
    onMeasurementsComplete,
    stopCamera,
    averageMeasurements,
  ])

  // Init log
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName,
    })
  }, [selectedItemName, selectedCompanyName, selectedStyleName, selectedSubStyleName])

  // Canvas sync
  const syncCanvasToVideo = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current

    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    const containerWidth = video.clientWidth
    const containerHeight = video.clientHeight

    const scaleX = containerWidth / videoWidth
    const scaleY = containerHeight / videoHeight
    const scale = Math.min(scaleX, scaleY)

    const displayWidth = videoWidth * scale
    const displayHeight = videoHeight * scale

    const offsetX = (containerWidth - displayWidth) / 2
    const offsetY = (containerHeight - displayHeight) / 2

    canvas.width = containerWidth
    canvas.height = containerHeight

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
      offsetY,
    })
  }, [])

  // Draw landmarks
  useEffect(() => {
    if (!canvasRef.current || !poseResults || !poseResults.isDetected) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = parseFloat(canvas.dataset.videoScale || '1')
    const offsetX = parseFloat(canvas.dataset.videoOffsetX || '0')
    const offsetY = parseFloat(canvas.dataset.videoOffsetY || '0')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

  
  

    
    // Draw style-specific outline image
    const drawStyleSpecificOutline = () => {
      console.log('Drawing style-specific outline for product:', selectedItemName)
      
      // Get the appropriate outline image based on clothing type
      const imagePath = getOutlineForClothingType(selectedItemName || '')
      console.log('Selected outline image:', imagePath, 'for product:', selectedItemName)
      
      // Create or get the appropriate image element
      if (!window.outlineImage || window.outlineImage.src !== window.location.origin + imagePath) {
        if (window.outlineImage) {
          window.outlineImage.onload = null // Remove old event listeners
        }
        window.outlineImage = new Image()
        window.outlineImage.src = imagePath
        window.outlineImage.onload = () => {
          console.log('Outline image loaded successfully:', imagePath)
          // Redraw the outline once image is loaded
          if (canvasRef.current && window.outlineImage) {
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
              drawOutlineToCanvas(ctx, canvas, window.outlineImage)
            }
          }
        }
        window.outlineImage.onerror = (err) => {
          console.error('Failed to load outline image:', imagePath, err)
        }
      }
      
      // Draw the image if it's loaded
      if (window.outlineImage && window.outlineImage.complete && window.outlineImage.naturalHeight !== 0) {
        drawOutlineToCanvas(ctx, canvas, window.outlineImage)
      }
    }
    
    const drawOutlineToCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
      if (!img) return
      
      // Determine if this is a top or bottom item
      const isTopItem = getOutlineForClothingType(selectedItemName || '') === '/upper-body-outline.png'
      
      // Calculate position and scale
      const centerX = canvas.width / 2
      let centerY: number
      
             if (isTopItem) {
         // Top items: position higher up from center for better visibility
         centerY = canvas.height * 0.4
       } else {
         // Bottom items: position higher up from bottom edge for better visibility
         centerY = canvas.height * 0.65
       }
      
      // Scale image to fit nicely on screen (adjust these values as needed)
      const targetWidth = 200
      const targetHeight = (img.height / img.width) * targetWidth
      
      // Position image centered horizontally and at calculated Y position
      const x = centerX - targetWidth / 2
      const y = centerY - targetHeight / 2
      
      // Set transparency - make outlines more visible
      ctx.save()
      ctx.globalAlpha = 0.50
      
      // Draw the image
      ctx.drawImage(img, x, y, targetWidth, targetHeight)
      
      ctx.restore()
      console.log('Outline drawn successfully for', isTopItem ? 'top' : 'bottom', 'item')
    }
    


    // Define outline drawing functions locally for this canvas context
    const drawUpperBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
      console.log('Drawing upper body outline at:', centerX, centerY, 'scale:', scale, 'alpha:', alpha)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      
      const headRadius = 25 * scale
      const shoulderWidth = 120 * scale
      const chestHeight = 80 * scale
      const armLength = 100 * scale
      
      // Head - use a box instead of circle with lines
      const headBoxWidth = headRadius * 1.5
      const headBoxHeight = headRadius * 2
      ctx.beginPath()
      ctx.rect(centerX - headBoxWidth/2, centerY - headBoxHeight/2, headBoxWidth, headBoxHeight)
      ctx.stroke()
      
      // Shoulders
      const shoulderY = centerY + headBoxHeight/2 + 15
      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX + shoulderWidth/2, shoulderY)
      ctx.stroke()
      
      // Chest/torso
      ctx.beginPath()
      ctx.rect(centerX - shoulderWidth/3, shoulderY, shoulderWidth * 2/3, chestHeight)
      ctx.stroke()
      
      // Arms
      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX - shoulderWidth/2 - 20, shoulderY + armLength/2)
      ctx.lineTo(centerX - shoulderWidth/2 - 10, shoulderY + armLength)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(centerX + shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX + shoulderWidth/2 + 20, shoulderY + armLength/2)
      ctx.lineTo(centerX + shoulderWidth/2 + 10, shoulderY + armLength)
      ctx.stroke()
      
      console.log('Upper body outline drawn successfully')
      ctx.restore()
    }

    const drawLowerBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      
      const hipWidth = 100 * scale
      const legLength = 160 * scale
      const legWidth = 25 * scale
      
      // Hips
      ctx.beginPath()
      ctx.rect(centerX - hipWidth/2, centerY, hipWidth, 40 * scale)
      ctx.stroke()
      
      // Legs
      const legY = centerY + 40 * scale
      ctx.beginPath()
      ctx.rect(centerX - hipWidth/3, legY, legWidth, legLength)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.rect(centerX + hipWidth/3 - legWidth, legY, legWidth, legLength)
      ctx.stroke()
      
      ctx.restore()
    }

    const drawFullBodyOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
      // Draw both upper and lower body
      drawUpperBodyOutline(ctx, centerX, centerY, scale, alpha)
      drawLowerBodyOutline(ctx, centerX, centerY + 80 * scale, scale, alpha)
    }

    const drawUpperExtendedOutline = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, scale: number = 1, alpha: number = 0.8) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      
      const headRadius = 25 * scale
      const shoulderWidth = 120 * scale
      const chestHeight = 100 * scale
      const armLength = 100 * scale
      const torsoHeight = 60 * scale
      
      // Head - use a box instead of circle with lines
      const headBoxWidth = headRadius * 1.5
      const headBoxHeight = headRadius * 2
      ctx.beginPath()
      ctx.rect(centerX - headBoxWidth/2, centerY - headBoxHeight/2, headBoxWidth, headBoxHeight)
      ctx.stroke()
      
      // Shoulders
      const shoulderY = centerY + headBoxHeight/2 + 15
      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX + shoulderWidth/2, shoulderY)
      ctx.stroke()
      
      // Chest/torso
      ctx.beginPath()
      ctx.rect(centerX - shoulderWidth/3, shoulderY, shoulderWidth * 2/3, chestHeight)
      ctx.stroke()
      
      // Extended torso
      const torsoY = shoulderY + chestHeight
      ctx.beginPath()
      ctx.rect(centerX - shoulderWidth/4, torsoY, shoulderWidth * 1/2, torsoHeight)
      ctx.stroke()
      
      // Arms
      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX - shoulderWidth/2 - 20, shoulderY + armLength/2)
      ctx.lineTo(centerX - shoulderWidth/2 - 10, shoulderY + armLength)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(centerX + shoulderWidth/2, shoulderY)
      ctx.lineTo(centerX + shoulderWidth/2 + 20, shoulderY + armLength/2)
      ctx.lineTo(centerX + shoulderWidth/2 + 10, shoulderY + armLength)
      ctx.stroke()
      
      ctx.restore()
    }

         // Draw style-specific outline first (behind everything)
     drawStyleSpecificOutline()

    // Then draw pose landmarks and skeleton on top
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.fillStyle = '#00ff00'

    // Determine which joints to highlight based on clothing type
    const isTopItem = getOutlineForClothingType(selectedItemName || '') === '/upper-body-outline.png'
    
         // Define relevant joints for top vs bottom items - exclude head features, only show body joints
     const topItemJoints = [5, 6, 7, 8, 9, 10, 11, 12] // shoulders, elbows, wrists, hips (waist area)
     const bottomItemJoints = [11, 12, 13, 14, 15, 16] // hips, knees, ankles
    
    // Use the same logic as the pose detection hook for consistency
    const relevantJoints = isTopItem ? topItemJoints : bottomItemJoints
    
         // Draw dynamic head box that follows the detected nose position with 3D rotation
     if (isTopItem && poseResults.landmarks[0] && poseResults.landmarks[0].confidence > 0.3) {
       // Get nose position and convert to canvas coordinates
       const noseX = canvas.width - (poseResults.landmarks[0].x * scale + offsetX)
       const noseY = poseResults.landmarks[0].y * scale + offsetY
       
       // Calculate 3D rotation based on ear positions (indices 3 and 4) for head tilt
       let tiltAngle = 0
       if (poseResults.landmarks[3] && poseResults.landmarks[4] && 
           poseResults.landmarks[3].confidence > 0.3 && poseResults.landmarks[4].confidence > 0.3) {
         const leftEarX = poseResults.landmarks[3].x * scale + offsetX
         const leftEarY = poseResults.landmarks[3].y * scale + offsetY
         const rightEarX = poseResults.landmarks[4].x * scale + offsetX
         const rightEarY = poseResults.landmarks[4].y * scale + offsetY
         
         // Calculate head tilt (roll) - corrected direction
         tiltAngle = Math.atan2(leftEarY - rightEarY, rightEarX - leftEarX)
       }
       
               // Calculate dynamic head box size based on shoulder distance (indices 5 and 6)
        let headBoxWidth = 60 // Default size - reduced from 120
        let headBoxHeight = 80 // Default size - reduced from 160
        
        if (poseResults.landmarks[5] && poseResults.landmarks[6] && 
            poseResults.landmarks[5].confidence > 0.3 && poseResults.landmarks[6].confidence > 0.3) {
          // Get shoulder positions
          const leftShoulderX = poseResults.landmarks[5].x * scale + offsetX
          const rightShoulderX = poseResults.landmarks[6].x * scale + offsetX
          
          // Calculate shoulder width in canvas coordinates
          const shoulderWidth = Math.abs(rightShoulderX - leftShoulderX)
          
          // Scale head box proportionally to shoulder width
          // Base the head box size on shoulder width with appropriate proportions
          const baseShoulderWidth = 120 // Base shoulder width for scaling
          const scaleFactor = shoulderWidth / baseShoulderWidth
          
          headBoxWidth = headBoxWidth * scaleFactor // Reduced from 120
          headBoxHeight = headBoxHeight * scaleFactor // Reduced from 160
          
          // Ensure minimum and maximum sizes - adjusted for smaller base size
          headBoxWidth = Math.max(40, Math.min(140, headBoxWidth)) // Reduced from 60-200
          headBoxHeight = Math.max(50, Math.min(175, headBoxHeight)) // Reduced from 80-267
        }
       
       ctx.save()
       ctx.strokeStyle = '#00ff00' // Green color
       ctx.lineWidth = 6 // Doubled from 3 to make edges twice as thick
       ctx.globalAlpha = 0.8
       
       // Move to nose position and apply 3D rotation (tilt)
       ctx.translate(noseX, noseY)
       ctx.rotate(tiltAngle)
       
       // Draw only the corners of the box
       const halfWidth = headBoxWidth / 2
       const halfHeight = headBoxHeight / 2
       
       // Top-left corner
       ctx.beginPath()
       ctx.moveTo(-halfWidth, -halfHeight)
       ctx.lineTo(-halfWidth + 15, -halfHeight)
       ctx.moveTo(-halfWidth, -halfHeight)
       ctx.lineTo(-halfWidth, -halfHeight + 15)
       ctx.stroke()
       
       // Top-right corner
       ctx.beginPath()
       ctx.moveTo(halfWidth, -halfHeight)
       ctx.lineTo(halfWidth - 15, -halfHeight)
       ctx.moveTo(halfWidth, -halfHeight)
       ctx.lineTo(halfWidth, -halfHeight + 15)
       ctx.stroke()
       
       // Bottom-left corner
       ctx.beginPath()
       ctx.moveTo(-halfWidth, halfHeight)
       ctx.lineTo(-halfWidth + 15, halfHeight)
       ctx.moveTo(-halfWidth, halfHeight)
       ctx.lineTo(-halfWidth, halfHeight - 15)
       ctx.stroke()
       
       // Bottom-right corner
       ctx.beginPath()
       ctx.moveTo(halfWidth, halfHeight)
       ctx.lineTo(halfWidth - 15, halfHeight)
       ctx.moveTo(halfWidth, halfHeight)
       ctx.lineTo(halfWidth, halfHeight - 15)
       ctx.stroke()
       
       ctx.restore()
     }
    
    // Only draw prioritized landmarks based on clothing type - hide non-relevant joints
    poseResults.landmarks.forEach((landmark: any, index: number) => {
      if (landmark.confidence > 0.3 && relevantJoints.includes(index)) {
        const x = canvas.width - (landmark.x * scale + offsetX)
        const y = landmark.y * scale + offsetY

        ctx.fillStyle = '#00ff00'
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

    const skeletonConnections = [
      // COMMENTED OUT: All head-related connections to avoid lines to head
      // [0, 5], // nose to left shoulder
      // [0, 6], // nose to right shoulder
      // [1, 3], // left eye to left ear
      // [2, 4], // right eye to right ear
      // [3, 5], // left ear to left shoulder
      // [4, 6], // right ear to right shoulder
      [5, 6], // left shoulder to right shoulder
      [5, 7], // left shoulder to left elbow
      [6, 8], // right shoulder to right elbow
      [7, 9], // left elbow to left wrist
      [8, 10], // right elbow to right wrist
      [5, 11], // left shoulder to left hip
      [6, 12], // right shoulder to right hip
      [11, 12], // left hip to right hip
      [11, 13], // left hip to left knee
      [12, 14], // right hip to right knee
      [13, 15], // left knee to left ankle
      [14, 16], // right knee to right ankle
      [13, 14], // left knee to right knee
    ]

    // Only draw prioritized skeleton connections based on clothing type - hide non-relevant connections
    skeletonConnections.forEach(([index1, index2]) => {
      const landmark1 = poseResults.landmarks[index1]
      const landmark2 = poseResults.landmarks[index2]

      // Only draw connections where both landmarks are prioritized for the clothing type
      if (landmark1 && landmark2 && 
          landmark1.confidence > 0.3 && landmark2.confidence > 0.3 &&
          relevantJoints.includes(index1) && relevantJoints.includes(index2)) {
        
        const x1 = canvas.width - (landmark1.x * scale + offsetX)
        const y1 = landmark1.y * scale + offsetY
        const x2 = canvas.width - (landmark2.x * scale + offsetX)
        const y2 = landmark2.y * scale + offsetY

        ctx.strokeStyle = '#00ff00'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

                 // Draw distance measurements for relevant connections
         // COMMENTED OUT: Number texts for now
         /*
         const distance = calculateDistance(landmark1, landmark2, scale)
         const midX = (x1 + x2) / 2
         const midY = (y1 + y2) / 2
         const lineLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
         const offsetDist = 25
         const offX = (-(y2 - y1) / lineLength) * offsetDist
         const offY = ((x2 - x1) / lineLength) * offsetDist
         const textX = midX + offX
         const textY = midY + offY

         ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
         ctx.font = 'bold 12px Arial'
         const text = `${distance}"`
         const textWidth = ctx.measureText(text).width
         ctx.fillRect(textX - textWidth / 2 - 3, textY - 8, textWidth + 6, 16)

         ctx.fillStyle = '#00ff00'
         ctx.textAlign = 'center'
         ctx.fillText(text, textX, textY + 3)
         */
      }
    })

    if (measurements && selectedStyleId) {
      const getMeasurementConnections = () => {
        const connections: Array<{
          indices: [number, number]
          label: string
          value: string
          description: string
        }> = []

        switch (selectedStyleId) {
          case 'shirts':
            connections.push({
              indices: [5, 6],
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points',
            })
            // COMMENTED OUT: Head-to-hip connection to avoid lines to head
            // connections.push({
            //   indices: [0, 11],
            //   label: 'Body Length',
            //   value: `${measurements.chest}"`,
            //   description: 'Upper body length',
            // })
            connections.push({
              indices: [5, 7],
              label: 'Arm Length',
              value: `${measurements.armLength}"`,
              description: 'Shoulder to elbow',
            })
            break

          case 'pants':
            connections.push({
              indices: [11, 12],
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points',
            })
            connections.push({
              indices: [11, 13],
              label: 'Leg Length',
              value: `${measurements.inseam}"`,
              description: 'Hip to knee',
            })
            connections.push({
              indices: [5, 11],
              label: 'Waist',
              value: `${measurements.waist}"`,
              description: 'Waist circumference',
            })
            break

          case 'shorts':
            connections.push({
              indices: [11, 12],
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points',
            })
            connections.push({
              indices: [11, 13],
              label: 'Thigh Length',
              value: `${measurements.inseam}"`,
              description: 'Hip to knee',
            })
            break

          case 'jackets':
            connections.push({
              indices: [5, 6],
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points',
            })
            // COMMENTED OUT: Head-to-hip connection to avoid lines to head
            // connections.push({
            //   indices: [0, 11],
            //   label: 'Body Length',
            //   value: `${measurements.chest}"`,
            //   description: 'Upper body length',
            // })
            connections.push({
              indices: [5, 7],
              label: 'Arm Length',
              value: `${measurements.armLength}"`,
              description: 'Shoulder to elbow',
            })
            break

          case 'activewear':
            connections.push({
              indices: [5, 6],
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points',
            })
            connections.push({
              indices: [11, 12],
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points',
            })
            connections.push({
              indices: [5, 11],
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Shoulder to hip',
            })
            break

          default:
            connections.push({
              indices: [5, 6],
              label: 'Shoulder Width',
              value: `${measurements.shoulders}"`,
              description: 'Distance between shoulder points',
            })
            connections.push({
              indices: [11, 12],
              label: 'Hip Width',
              value: `${measurements.hips}"`,
              description: 'Distance between hip points',
            })
        }

        return connections
      }

      const measurementConnections = getMeasurementConnections()

      measurementConnections.forEach(({ indices, label, value, description }) => {
        const [index1, index2] = indices
        const landmark1 = poseResults.landmarks[index1]
        const landmark2 = poseResults.landmarks[index2]

        if (landmark1 && landmark2 && landmark1.confidence > 0.3 && landmark2.confidence > 0.3) {
          const x1 = canvas.width - (landmark1.x * scale + offsetX)
          const y1 = landmark1.y * scale + offsetY
          const x2 = canvas.width - (landmark2.x * scale + offsetX)
          const y2 = landmark2.y * scale + offsetY

          const midX = (x1 + x2) / 2
          const midY = (y1 + y2) / 2

          const angle = Math.atan2(y2 - y1, x2 - x1)

          ctx.save()
          ctx.translate(midX, midY)
          ctx.rotate(angle)

          const text = `${label}: ${value}`
          ctx.font = 'bold 12px Arial'
          const textWidth = ctx.measureText(text).width
          const textHeight = 20
          const padding = 8

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
          ctx.fillRect(-textWidth / 2 - padding, -textHeight / 2 - padding, textWidth + padding * 2, textHeight + padding * 2)

          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2
          ctx.strokeRect(
            -textWidth / 2 - padding,
            -textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2,
          )

          ctx.fillStyle = '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(text, 0, 0)

          ctx.font = '10px Arial'
          ctx.fillStyle = '#cccccc'
          ctx.fillText(description, 0, 15)

          ctx.restore()

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
      offsetY,
    })
  }, [poseResults, measurements, selectedStyleId, poseStability])

  const checkPoseDetectionStatus = useCallback(() => {
    if (isPoseLoading) return 'loading'
    if (poseError) return 'error'
    if (isPoseInitialized) return 'ready'
    return 'not-started'
  }, [isPoseLoading, poseError, isPoseInitialized])

  const enableDemoMode = useCallback(() => {
    Logger.info('Enabling demo mode - camera not available')
    setIsDemoMode(true)
    setCameraError('')
    setTimeout(async () => {
      Logger.info('Demo mode: Initializing mock pose detection')
      if (videoRef.current) {
        await initializePose(videoRef.current)
        await startDetection()
      }
      Logger.info('Demo mode: Ready for measurements')
    }, 1000)
  }, [initializePose, startDetection])

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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this environment')
      }

      const cameraConstraints = [
        {
          video: { facingMode: 'user', width: { ideal: 640, min: 320 }, height: { ideal: 480, min: 240 }, frameRate: { ideal: 30, min: 15 } },
        },
        { video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } } },
        { video: true },
      ]

      let stream: MediaStream | null = null
      let lastError: Error | null = null

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

      video.srcObject = stream
      Logger.info('Camera stream set on video element')

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video loading timeout - video may not be ready')), 15000)

        const onLoadedMetadata = () => {
          clearTimeout(timeout)
          video.removeEventListener('loadedmetadata', onLoadedMetadata)
          video.removeEventListener('error', onError)
          video.removeEventListener('canplay', onCanPlay)
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            reject(new Error('Video dimensions not available'))
            return
          }
          Logger.info('Video metadata loaded successfully', {
            dimensions: `${video.videoWidth}x${video.videoHeight}`,
            readyState: video.readyState,
          })
          resolve()
        }

        const onCanPlay = () => Logger.info('Video can start playing')
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
        if (video.readyState < 1) video.load()
      })

      let attempts = 0
      while (attempts < 3) {
        try {
          await video.play()
          Logger.info('Video playing successfully')
          break
        } catch (e) {
          attempts++
          Logger.warn(`Video play attempt ${attempts} failed:`, e)
          if (attempts >= 3) throw new Error('Failed to play video after 3 attempts')
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      syncCanvasToVideo()

      try {
        await initializePose(video)
        Logger.info('Pose detection model initialized')
        await startDetection()
        Logger.info('Pose detection started successfully')
      } catch (poseErr) {
        Logger.warn('Pose detection initialization failed, checking status...', { error: (poseErr as Error).message })
        const status = checkPoseDetectionStatus()
        if (status === 'loading') {
          setIsPoseDetectionWaiting(true)
          setCameraError('')
          setupPoseDetectionRetry()
          return
        } else {
          setCameraError(`The camera will be used to calculate your measurements`)
          return
        }
      }
    } catch (error) {
      const message = (error as Error).message
      Logger.error('Camera initialization failed', { error: message, stack: (error as Error).stack })

      let userMessage = message
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        userMessage = 'Camera access denied. Please allow camera permissions and try again.'
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        userMessage = 'No camera found. Please ensure your device has a camera and try again.'
      } else if (message.includes('NotReadableError') || message.includes('TrackStartError')) {
        userMessage = 'Camera is busy or unavailable. Please close other apps using the camera and try again.'
      } else if (message.includes('AbortError')) {
        userMessage = 'Camera access was interrupted. Please try again.'
      } else if (message.includes('NotSupportedError') || message.includes('not supported')) {
        userMessage = 'Camera not supported in this environment. Please use a different browser or device.'
      }

      setCameraError(userMessage)
      hasBootedRef.current = false
      enableDemoMode()
    }
  }, [syncCanvasToVideo, initializePose, startDetection, enableDemoMode, checkPoseDetectionStatus])

  const setupPoseDetectionRetry = useCallback(() => {
    Logger.info('Setting up pose detection auto-retry...')
    if (retryTimerRef.current) clearInterval(retryTimerRef.current)

    const checkInterval = 500
    const maxRetries = 60
    let retryCount = 0

    retryTimerRef.current = setInterval(async () => {
      retryCount++
      const status = checkPoseDetectionStatus()
      Logger.debug(`Pose detection retry ${retryCount}/${maxRetries}, status: ${status}`)

      if (status === 'ready' && videoRef.current) {
        Logger.info('Pose detection became ready, attempting to start...')
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current)
          retryTimerRef.current = null
        }
        setIsPoseDetectionWaiting(false)
        try {
          await startDetection()
          Logger.info('Pose detection started successfully after retry')
        } catch (e) {
          Logger.error('Failed to start detection after retry:', e)
          setCameraError('Pose detection failed to start. You can still use manual measurements.')
        }
      } else if (status === 'error' || retryCount >= maxRetries) {
        Logger.warn('Giving up on pose detection retry', { status, retryCount })
        if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current)
          retryTimerRef.current = null
        }
        setIsPoseDetectionWaiting(false)
        if (retryCount >= maxRetries) {
          setCameraError('Pose detection is taking too long to load. You can still use manual measurements.')
        } else {
          setCameraError('Pose detection failed to initialize. You can still use manual measurements.')
        }
      }
    }, checkInterval)
  }, [checkPoseDetectionStatus, startDetection])

  const handleTakeMeasurement = () => {
    Logger.info('Taking measurement', {
      poseDetected: poseResults?.isDetected,
      confidence: poseResults?.confidence,
      demoMode: isDemoMode,
    })
    setIsProcessing(true)
    setTimeout(() => {
      const mock: Measurements = {
        chest: 42,
        waist: 32,
        hips: 38,
        shoulders: 18,
        armLength: 25,
        inseam: 32,
        height: 70,
        weight: 165,
      }
      Logger.info('Measurements calculated', { measurements: mock })
      setMeasurements(mock)
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
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current)
        retryTimerRef.current = null
      }
      try {
        stopDetection()
      } catch (err) {
        Logger.warn('Error stopping detection during cleanup', { error: (err as Error).message })
      }
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
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

  useEffect(() => {
    if (isPoseLoading) {
      Logger.info('Pose detection model loading...')
    } else if (isPoseInitialized) {
      Logger.info('Pose detection model ready')
    }
  }, [isPoseLoading, isPoseInitialized])

  useEffect(() => {
    if (poseResults?.isDetected) {
      Logger.debug('Pose detected', {
        confidence: poseResults.confidence,
        landmarksCount: poseResults.landmarks?.length,
      })
    }
  }, [poseResults])

  useEffect(() => {
    if (poseStability) {
      Logger.debug('Pose stability updated', {
        stabilityScore: poseStability.stabilityScore,
        isStable: poseStability.isStable,
        relevantLandmarks: poseStability.relevantLandmarks.length,
      })
    }
  }, [poseStability])

  useEffect(() => {
    if (poseError) {
      Logger.error('Pose detection error', { error: poseError })
    }
  }, [poseError])

  // Loading overlay
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
      <div className="bg-white bg-opacity-90 rounded-lg p-6 text-center shadow-lg">
        <div className="flex items-center justify-center mb-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-lg font-semibold text-gray-800">Loading pose detection...</span>
        </div>
        <p className="text-sm text-gray-600">Initializing AI model for automatic measurements</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#550cff]">
      {/* Header - matches style of other pages */}
      <header className="relative bg-transparent">
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={onCancel} />
        </div>

        <div className="px-4 pt-16 pb-4 text-center">
          <h1 className="text-xl font-bold text-white">Get Your Measurements</h1>
          <p className="text-sm text-white/80">
            {isDemoMode ? 'Demo Mode - Simulated measurements' : "We'll use your camera to measure you perfectly"}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden bg-black rounded-t-3xl">
        {/* Confidence bar */}
        <ConfidenceThreshold
          validation={validation}
          isVisible={Boolean(!isDemoMode && !measurements && !isProcessing && selectedStyleId && poseResults?.isDetected)}
          poseStability={poseStability}
        />

        {/* Position feedback */}
        {positionFeedback && !isDemoMode && !measurements && !isProcessing && (
          <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg font-medium text-center max-w-xs z-40 ${
            positionFeedback.feedbackType === 'success' 
              ? 'bg-green-500/90 text-white' 
              : positionFeedback.feedbackType === 'warning'
              ? 'bg-yellow-500/90 text-black'
              : 'bg-red-500/90 text-white'
          }`}>
            {positionFeedback.feedbackMessage}
          </div>
        )}

        {isDemoMode ? (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-center p-8">
              <div className="w-32 h-32 mx-auto mb-6 border-4 border-white rounded-full flex items-center justify-center">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Demo Mode</h2>
              <p className="text-blue-100 mb-4">Camera not available — using simulated measurements</p>
              <div className="bg-white/20 rounded-lg p-4 backdrop-blur">
                <p className="text-sm">{isPoseInitialized ? '✅ Ready to take measurements' : '⏳ Initializing...'}</p>
              </div>
            </div>
          </div>
        ) : (
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

            {isPoseDetectionWaiting && <LoadingOverlay />}
          </>
        )}

        {/* Camera error UI */}
        {cameraError && !isDemoMode && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Warning</h3>
              <p className="text-sm text-gray-600 mb-4">{cameraError}</p>
              <div className="flex gap-3">
                <button
                  onClick={retryCamera}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Agree
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Clothing instructions */}
        {!isDemoMode && !measurements && !isProcessing && selectedStyleId && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-20">
            <div className="bg-black/60 backdrop-blur-sm text-white text-center py-3 px-4 rounded-lg">
              <p className="text-sm font-medium">{getClothingInstructions(selectedStyleId)}</p>
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
                  { label: 'Inseam', value: measurements.inseam },
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