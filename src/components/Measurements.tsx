// src/components/Measurements.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Measurements, MeasurementValidation } from '../types'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { Logger } from '../utils/Logger'

import { ConfidenceThreshold } from './ConfidenceThreshold'
import { getClothingInstructions } from '../data/poseRequirements'
import { BackButton } from './BackButton'
import { CameraDebugOverlay } from './CameraDebugOverlay'


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
  canvasHeight: number,
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
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
  
  // Check if the union of upper and lower body joints are visible and confident
  const topItemJoints = [5, 6, 7, 8, 9, 10, 11, 12] // shoulders, elbows, wrists, hips (waist area)
  const bottomItemJoints = [11, 12, 13, 14, 15, 16] // hips, knees, ankles
  const allJoints = [...new Set([...topItemJoints, ...bottomItemJoints])] // Union of all joints
  
  const visibleJoints = allJoints.filter(index => 
    landmarks[index] && landmarks[index].confidence > 0.35
  )
  
  const isInFrame = visibleJoints.length >= allJoints.length * 0.8
  const isFullyVisible = visibleJoints.length >= allJoints.length * 0.9

  if (!isInFrame) {
    return {
      ...defaultFeedback,
      feedbackMessage: "Please step into camera view",
      adjustmentNeeded: 'center_yourself'
    }
  }

  // If less than 90% of joints are visible, suggest moving back from camera
  if (!isFullyVisible) {
    return {
      ...defaultFeedback,
      feedbackMessage: "Too close to camera",
      feedbackType: 'warning',
      adjustmentNeeded: 'move_back'
    }
  }

  // Calculate distance based on key measurement
  let currentWidth = 0
  let idealWidth = 0
  let minWidth = 0
  let maxWidth = 0
  let scaleAnalysis = {
    isGoodScale: false,
    scaleFactor: 1.0,
    feedback: ''
  }

  if (config.focusArea.includes('upper')) {
    // Use shoulder width for upper body measurements
    if (landmarks[5] && landmarks[6]) {
      currentWidth = Math.abs(landmarks[5].x - landmarks[6].x) * canvasWidth
      idealWidth = config.idealShoulderWidth
      minWidth = config.minShoulderWidth
      maxWidth = config.maxShoulderWidth
      
      // Enhanced scale analysis for upper body
      if (landmarks[11] && landmarks[12]) {
        const hipWidth = Math.abs(landmarks[11].x - landmarks[12].x) * canvasWidth
        const shoulderToHipRatio = currentWidth / hipWidth
        const expectedRatio = 1.07 // Shoulders slightly wider than hips
        
        // Calculate scale factor based on shoulder width
        scaleAnalysis.scaleFactor = currentWidth / idealWidth
        
        // Check if proportions are reasonable - more lenient thresholds
        const ratioDeviation = Math.abs(shoulderToHipRatio - expectedRatio)
        scaleAnalysis.isGoodScale = ratioDeviation < 0.3 && scaleAnalysis.scaleFactor > 0.4 && scaleAnalysis.scaleFactor < 2.5
        
        if (scaleAnalysis.scaleFactor < 0.4) {
          scaleAnalysis.feedback = 'Too far from camera'
        } else {
          scaleAnalysis.feedback = 'Stay still'
        }
      }
    }
  } else {
    // Use hip width for lower body measurements  
    if (landmarks[11] && landmarks[12]) {
      currentWidth = Math.abs(landmarks[11].x - landmarks[12].x) * canvasWidth
      idealWidth = config.idealHipWidth
      minWidth = config.minHipWidth
      maxWidth = config.maxHipWidth
      
      // Enhanced scale analysis for lower body
      if (landmarks[13] && landmarks[14]) {
        const kneeWidth = Math.abs(landmarks[13].x - landmarks[14].x) * canvasWidth
        const hipToKneeRatio = currentWidth / kneeWidth
        const expectedRatio = 1.2 // Hips wider than knees
        
        // Calculate scale factor based on hip width
        scaleAnalysis.scaleFactor = currentWidth / idealWidth
        
        // Check if proportions are reasonable - more lenient thresholds
        const ratioDeviation = Math.abs(hipToKneeRatio - expectedRatio)
        scaleAnalysis.scaleFactor = currentWidth / idealWidth
        
        if (scaleAnalysis.scaleFactor < 0.4) {
          scaleAnalysis.feedback = 'Too far from camera'
        } else {
          scaleAnalysis.feedback = 'Stay still'
        }
      }
    }
  }

  // Distance analysis - now considers both width and scale with more lenient thresholds
  const isCorrectDistance = currentWidth >= minWidth && currentWidth <= maxWidth && scaleAnalysis.isGoodScale
  const isTooFar = currentWidth < minWidth * 0.8 || scaleAnalysis.scaleFactor < 0.4

  // IMPROVED: Calculate person's actual body center based on clothing type
  let bodyCenterX = 0.5 // Default to center
  let bodyCenterY = 0.5
  
  if (config.focusArea.includes('upper')) {
    // For upper body items, use the midpoint between shoulders and hips
    if (landmarks[5] && landmarks[6] && landmarks[11] && landmarks[12]) {
      const shoulderMidX = (landmarks[5].x + landmarks[6].x) / 2
      const hipMidX = (landmarks[11].x + landmarks[12].x) / 2
      bodyCenterX = (shoulderMidX + hipMidX) / 2
      bodyCenterY = (landmarks[5].y + landmarks[11].y) / 2
    } else if (landmarks[5] && landmarks[6]) {
      // Fallback to just shoulders
      bodyCenterX = (landmarks[5].x + landmarks[6].x) / 2
      bodyCenterY = landmarks[5].y
    }
  } else {
    // For lower body items, use the midpoint between hips
    if (landmarks[11] && landmarks[12]) {
      bodyCenterX = (landmarks[11].x + landmarks[12].x) / 2
      bodyCenterY = landmarks[11].y
    }
  }

  // Calculate screen center in pixels
  const screenCenterX = canvasWidth / 2
  const screenCenterY = canvasHeight / 2
  
  // Calculate distance in pixels using the EXACT SAME method as the canvas display
  // This matches exactly what's shown above the body center
  // The canvas uses: canvas.width - (bodyCenterX * scale + offsetX) to account for horizontal flip
  // Now we use the same parameters for exact matching
  const bodyCenterCanvasX = canvasWidth - (bodyCenterX * scale + offsetX)
  const centerDistanceXPixels = bodyCenterCanvasX - screenCenterX
  const centerDistanceYPixels = (bodyCenterY * scale + offsetY) - screenCenterY
  
  // Debug the coordinate transformation and directional logic
  console.log('Debug position:', {
    bodyCenterX: bodyCenterX,
    bodyCenterCanvasX: bodyCenterCanvasX,
    screenCenterX: screenCenterX,
    centerDistanceXPixels: centerDistanceXPixels,
    shouldMoveRight: centerDistanceXPixels < 0
  });
  
  // Convert to percentage of screen dimensions for tolerance checking
  const centerDeviationX = Math.abs(centerDistanceXPixels) / canvasWidth
  const centerDeviationY = Math.abs(centerDistanceYPixels) / canvasHeight
  
  // More strict horizontal centering (10% of screen width) and vertical centering (15% of screen height)
  const horizontalTolerance = 0.10
  const verticalTolerance = 0.15
  
  // Add tighter tolerance for "almost there" feedback
  const tightHorizontalTolerance = 0.05
  const tightVerticalTolerance = 0.08
  
  const isHorizontallyCentered = centerDeviationX < horizontalTolerance
  const isVerticallyCentered = centerDeviationY < verticalTolerance
  const isProperlyAligned = isHorizontallyCentered && isVerticallyCentered
  
  // Check if user is getting close to target
  const isAlmostHorizontallyCentered = centerDeviationX < tightHorizontalTolerance
  const isAlmostVerticallyCentered = centerDeviationY < tightVerticalTolerance

  // Generate more specific feedback based on actual pixel deviation
  let feedbackMessage = ""
  let feedbackType: 'success' | 'warning' | 'error' = 'success'
  let adjustmentNeeded: PositionFeedback['adjustmentNeeded'] = 'good'

  if (!isProperlyAligned) {
    // Check if user is getting close to target for encouraging feedback
    if (isAlmostHorizontallyCentered && isAlmostVerticallyCentered) {
      feedbackMessage = "Almost there! Make small adjustments to center perfectly"
      feedbackType = 'warning'
      adjustmentNeeded = 'center_yourself'
    } else {
             // Provide specific directional feedback based on actual pixel deviation
               if (!isHorizontallyCentered && !isVerticallyCentered) {
          // Both horizontal and vertical adjustments needed
          if (centerDistanceXPixels < 0) {
            feedbackMessage = "Move right and step back from camera"  // FLIPPED due to horizontal flip
          } else {
            feedbackMessage = "Move left and step back from camera" // FLIPPED due to horizontal flip
          }
          if (centerDistanceYPixels < 0) {
            feedbackMessage = feedbackMessage.replace("step back", "move closer")
          }
        } else if (!isHorizontallyCentered) {
          // Only horizontal adjustment needed
          if (centerDistanceXPixels < 0) {
            feedbackMessage = "Move right to center"  // FLIPPED due to horizontal flip
          } else {
            feedbackMessage = "Move left to center" // FLIPPED due to horizontal flip
          }
        } else {
          // Only vertical adjustment needed
          if (centerDistanceYPixels < 0) {
            feedbackMessage = "Step back from camera"
          } else {
            feedbackMessage = "Move closer to camera"
          }
        }
      feedbackType = 'warning'
      adjustmentNeeded = 'center_yourself'
    }
    } else if (!scaleAnalysis.isGoodScale) {
    // Use the scale analysis feedback
    feedbackMessage = scaleAnalysis.feedback
    if (scaleAnalysis.scaleFactor < 0.4) {
      feedbackType = 'warning'
      adjustmentNeeded = 'move_closer'
    } else {
      feedbackType = 'success'
      adjustmentNeeded = 'good'
    }
  } else if (isTooFar) {
    feedbackMessage = "Please move closer to the camera"
    feedbackType = 'warning'
    adjustmentNeeded = 'move_closer'
  } else {
    // Check if user is very close but not quite perfect
    if (Math.abs(centerDistanceXPixels) < 20 && Math.abs(centerDistanceYPixels) < 20) {
      feedbackMessage = "Great! Just a tiny adjustment needed"
      feedbackType = 'warning'
      adjustmentNeeded = 'center_yourself'
    } else {
      feedbackMessage = "Perfect position! Hold still."
      feedbackType = 'success'
      adjustmentNeeded = 'good'
    }
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
  userHeight?: number
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
  userHeight,
}: MeasurementsStepProps) {
     // Skeleton outline removed - no more positioning needed
  
  // Simple clothing type detection based on product name
  const getOutlineForClothingType = (productName?: string): string => {
    // Always use skeleton outline for consistent UI
    return '/skeleton_outline.png'
  }

  // --- helpers to compute distances/measurements ---
  const calculateDistance = (landmark1: any, landmark2: any) => {
    // Use pose detection-based scaling for accurate measurements
    if (userHeight && canvasRef.current && poseResults?.isDetected) {
      // Measure from nose to ankle - landmarks are ALREADY in pixels
      if (poseResults.landmarks[0] && poseResults.landmarks[15]) {
        const noseY = poseResults.landmarks[0].y  // Remove * canvasRef.current.height
        const ankleY = poseResults.landmarks[15].y // Remove * canvasRef.current.height
        const personHeightPixels = Math.abs(ankleY - noseY)
        
        // Add compensation for nose/eyes to top of head (typically 4-5 inches)
        const eyesToTopOfHead = 4.5 // inches - distance from nose/eyes to top of head
        const noseToAnkleHeight = userHeight + eyesToTopOfHead 
      const pixelsPerInch = personHeightPixels / noseToAnkleHeight
        
        // Convert pixel distance - landmarks already in pixels
        const pixelDistanceInCanvas = Math.sqrt(
          Math.pow((landmark2.x - landmark1.x), 2) +  // Remove * width
          Math.pow((landmark2.y - landmark1.y), 2)   // Remove * height
        )
        const distanceInInches = pixelDistanceInCanvas / pixelsPerInch
        return distanceInInches.toFixed(1)
      }
    }
    
    // Fallback to old calibration if no height or pose detection available
    const calibrationFactor = 22.5 / 2.0 // rough, demo-only
    const pixelDistance = Math.sqrt(
      Math.pow((landmark2.x - landmark1.x), 2) +  // Remove * width
      Math.pow((landmark2.y - landmark1.y), 2)   // Remove * height
    )
    const distanceInInches = (pixelDistance / 50) * calibrationFactor
    return distanceInInches.toFixed(1)
  }

  const calculateRealMeasurements = (landmarks: any[], clothingType: string) => {
    const measurements: Measurements = {
      chest: 0,
      waist: 0,
      hips: 0,
      shoulders: 0,
      armLength: 0,
      inseam: 0,
      height: userHeight || 70, // Use user's actual height if available
      weight: 165,
    }

    if (landmarks[5] && landmarks[6]) {
      measurements.shoulders = parseFloat(calculateDistance(landmarks[5], landmarks[6]))
    }

    switch (clothingType) {
      case 'shirts':
      case 'jackets':
        // Measure chest using elbow width (more accurate than shoulder multiplier)
        if (landmarks[7] && landmarks[8]) {
          const elbowWidth = parseFloat(calculateDistance(landmarks[7], landmarks[8]))
          measurements.chest = parseFloat((elbowWidth * 3.14 * 0.9).toFixed(1)) // Convert to circumference with fit factor
        } else {
          measurements.chest = measurements.shoulders * 2.3 // Fallback to old method
        }
        
        if (landmarks[5] && landmarks[7]) {
          measurements.armLength = parseFloat(calculateDistance(landmarks[5], landmarks[7]))
        }
        
        // Measure hips first, then calculate waist from hips (more accurate)
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12]))
          measurements.waist = measurements.hips * 0.85
        } else {
          measurements.waist = measurements.chest * 0.85 // Fallback
        }
        break

      case 'pants':
      case 'shorts':
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12]))
          measurements.waist = measurements.hips * 0.85 // More accurate than 2.2 multiplier
        }
        
        if (clothingType === 'pants' && landmarks[11] && landmarks[15]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[15]))
        } else if (clothingType === 'shorts' && landmarks[11] && landmarks[13]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[13]))
        }
        break

      case 'activewear':
        // Measure chest using elbow width
        if (landmarks[7] && landmarks[8]) {
          const elbowWidth = parseFloat(calculateDistance(landmarks[7], landmarks[8]))
          measurements.chest = parseFloat((elbowWidth * 3.14 * 0.9).toFixed(1))
        } else {
          measurements.chest = measurements.shoulders * 2.3 // Fallback
        }
        
        // Measure hips first, then calculate waist from hips
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12]))
          measurements.waist = measurements.hips * 0.85
        } else {
          measurements.waist = measurements.chest * 0.85 // Fallback
        }
        
        if (landmarks[5] && landmarks[7]) {
          measurements.armLength = parseFloat(calculateDistance(landmarks[5], landmarks[7]))
        }
        if (landmarks[11] && landmarks[15]) {
          measurements.inseam = parseFloat(calculateDistance(landmarks[11], landmarks[15]))
        }
        break

      default:
        // Measure chest using elbow width if available
        if (landmarks[7] && landmarks[8]) {
          const elbowWidth = parseFloat(calculateDistance(landmarks[7], landmarks[8]))
          measurements.chest = parseFloat((elbowWidth * 3.14 * 0.9).toFixed(1))
        } else {
          measurements.chest = measurements.shoulders * 2.3 // Fallback
        }
        
        // Measure hips if available, otherwise estimate from shoulders
        if (landmarks[11] && landmarks[12]) {
          measurements.hips = parseFloat(calculateDistance(landmarks[11], landmarks[12]))
          measurements.waist = measurements.hips * 0.85
        } else {
          measurements.waist = measurements.chest * 0.85
          measurements.hips = measurements.shoulders * 2.1 // Fallback
        }
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
  // In-app debug overlay state
  const [showDebug, setShowDebug] = useState(false)

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
      const scale = parseFloat(canvasRef.current.dataset.videoScale || '1')
      const offsetX = parseFloat(canvasRef.current.dataset.videoOffsetX || '0')
      const offsetY = parseFloat(canvasRef.current.dataset.videoOffsetY || '0')
      
      const feedback = analyzeUserPosition(poseResults, selectedStyleId, canvasRef.current.width, canvasRef.current.height, scale, offsetX, offsetY)
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

    // Auto-progress when validation reaches 100%
    if (validation && validation.isValid && validation.progress >= 1.0 && !measurements && !debugAutoTrigger) {
          setDebugAutoTrigger(true)

          try {
            const averaged = averageMeasurements(measurementBuffer)
            setMeasurements(averaged)
            if (!isDemoMode) stopCamera()
            onMeasurementsComplete(averaged)
          } catch (error) {
            setDebugError((error as Error).message)
            const fallback = {
          chest: 42,
          waist: 32,
          hips: 38,
          shoulders: 18,
          armLength: 25,
          inseam: 32,
          height: 70,
          weight: 165,
        }
            setMeasurements(fallback)
            onMeasurementsComplete(fallback)
          }
    }

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

  
  

    
         // Outline drawing removed - no more skeleton outline
    


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

                   // Outline drawing removed - no more skeleton outline

    // Draw positioning guides and tolerance zones
    const drawPositioningGuides = () => {
      if (!poseResults?.isDetected || !selectedStyleId) return
      
      const config = OUTLINE_CONFIGS[selectedStyleId as keyof typeof OUTLINE_CONFIGS] || OUTLINE_CONFIGS.shirts
      const landmarks = poseResults.landmarks
      
      // Calculate body center
      let bodyCenterX = 0.5
      let bodyCenterY = 0.5
      
      if (config.focusArea.includes('upper')) {
        if (landmarks[5] && landmarks[6] && landmarks[11] && landmarks[12]) {
          const shoulderMidX = (landmarks[5].x + landmarks[6].x) / 2
          const hipMidX = (landmarks[11].x + landmarks[12].x) / 2
          bodyCenterX = (shoulderMidX + hipMidX) / 2
          bodyCenterY = (landmarks[5].y + landmarks[11].y) / 2
        } else if (landmarks[5] && landmarks[6]) {
          bodyCenterX = (landmarks[5].x + landmarks[6].x) / 2
          bodyCenterY = landmarks[5].y
        }
      } else {
        if (landmarks[11] && landmarks[12]) {
          bodyCenterX = (landmarks[11].x + landmarks[12].x) / 2
          bodyCenterY = landmarks[11].y
        }
      }
      
      // Convert normalized coordinates to canvas coordinates
      const bodyCenterCanvasX = canvas.width - (bodyCenterX * scale + offsetX)
      const bodyCenterCanvasY = bodyCenterY * scale + offsetY
      
             // Calculate distance in pixels for display
       const screenCenterX = canvas.width / 2
       const screenCenterY = canvas.height / 2
       const centerDistanceXPixels = bodyCenterCanvasX - screenCenterX
       const centerDistanceYPixels = bodyCenterCanvasY - screenCenterY
      
      
      
                                  // Tolerance zones and boundary labels removed for cleaner UI
    }
    
    // Draw positioning guides
    drawPositioningGuides()

    // Then draw pose landmarks and skeleton on top
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.fillStyle = '#00ff00'

                   // Determine which joints to highlight based on clothing type
      const config = OUTLINE_CONFIGS[selectedStyleId as keyof typeof OUTLINE_CONFIGS] || OUTLINE_CONFIGS.shirts
      const isTopItem = config.focusArea.includes('upper')
      
      // Always show both upper and lower body joints, but color them differently based on relevance
      const topItemJoints = [5, 6, 7, 8, 9, 10, 11, 12] // shoulders, elbows, wrists, hips (waist area)
      const bottomItemJoints = [11, 12, 13, 14, 15, 16] // hips, knees, ankles
      
      // Union of all joints to always show both areas
      const allJoints = [...new Set([...topItemJoints, ...bottomItemJoints])]
    
         // Draw dynamic head box that follows the detected nose position with 3D rotation
     if (isTopItem && poseResults.landmarks[0] && poseResults.landmarks[0].confidence > 0.35) {
       // Get nose position and convert to canvas coordinates
       const noseX = canvas.width - (poseResults.landmarks[0].x * scale + offsetX)
       const noseY = poseResults.landmarks[0].y * scale + offsetY
       
       // Calculate 3D rotation based on ear positions (indices 3 and 4) for head tilt
       let tiltAngle = 0
       if (poseResults.landmarks[3] && poseResults.landmarks[4] && 
           poseResults.landmarks[3].confidence > 0.35 && poseResults.landmarks[4].confidence > 0.35) {
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
            poseResults.landmarks[5].confidence > 0.35 && poseResults.landmarks[6].confidence > 0.35) {
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
    
         // Draw all landmarks but color them based on relevance to the selected clothing type
     poseResults.landmarks.forEach((landmark: any, index: number) => {
       if (landmark.confidence > 0.35 && allJoints.includes(index)) {
         const x = canvas.width - (landmark.x * scale + offsetX)
         const y = landmark.y * scale + offsetY

         // Color landmarks based on relevance: green for relevant area, grey for irrelevant area
         if (isTopItem && topItemJoints.includes(index)) {
           ctx.fillStyle = '#00ff00' // Green for relevant upper body
         } else if (!isTopItem && bottomItemJoints.includes(index)) {
           ctx.fillStyle = '#00ff00' // Green for relevant lower body
         } else {
           ctx.fillStyle = '#808080' // Grey for irrelevant area
         }
         
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

         // Draw all skeleton connections but color them based on relevance to the selected clothing type
     skeletonConnections.forEach(([index1, index2]) => {
       const landmark1 = poseResults.landmarks[index1]
       const landmark2 = poseResults.landmarks[index2]

       // Draw all connections where both landmarks are visible
       if (landmark1 && landmark2 && 
           landmark1.confidence > 0.35 && landmark2.confidence > 0.35 &&
           allJoints.includes(index1) && allJoints.includes(index2)) {
         
         const x1 = canvas.width - (landmark1.x * scale + offsetX)
         const y1 = landmark1.y * scale + offsetY
         const x2 = canvas.width - (landmark2.x * scale + offsetX)
         const y2 = landmark2.y * scale + offsetY

         // Color connections based on relevance: green for relevant area, grey for irrelevant area
         if (isTopItem && topItemJoints.includes(index1) && topItemJoints.includes(index2)) {
           ctx.strokeStyle = '#00ff00' // Green for relevant upper body connections
         } else if (!isTopItem && bottomItemJoints.includes(index1) && bottomItemJoints.includes(index2)) {
           ctx.strokeStyle = '#00ff00' // Green for relevant lower body connections
         } else {
           ctx.strokeStyle = '#808080' // Grey for irrelevant area connections
         }
         
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

        if (landmark1 && landmark2 && landmark1.confidence > 0.35 && landmark2.confidence > 0.35) {
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

  // Expose lightweight debug snapshot to window for UI-only debugging
  useEffect(() => {
    ;(window as any).__poseUI = {
      poseInitialized: isPoseInitialized,
      poseLoading: isPoseLoading,
      poseError,
      poseResults,
      poseStability,
      cameraError,
      validationProgress: validation?.progress,
      validationIsValid: validation?.isValid,
      measurementCount: measurementBuffer.length,
      hasMeasurements: !!measurements,
    }
  }, [
    isPoseInitialized,
    isPoseLoading,
    poseError,
    poseResults,
    poseStability,
    cameraError,
    validation?.progress,
    validation?.isValid,
    measurementBuffer.length,
    measurements,
  ])

  // Keyboard shortcut: Shift + D to toggle debug overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowDebug((s) => !s)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
          <BackButton onClick={onCancel} variant="minimal" iconSize={22} className="w-12 h-12" />
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
        {/* Floating debug toggle (hidden on production builds if desired) */}
        <div className="absolute top-2 right-2 z-[60]">
          <button
            onClick={() => setShowDebug((s) => !s)}
            className="bg-black/50 text-xs text-white px-2 py-1 rounded hover:bg-black/70 border border-white/20"
          >
            {showDebug ? 'Close Debug' : 'Debug'}
          </button>
        </div>
        {/* Confidence bar */}
        <ConfidenceThreshold
          validation={validation}
          isVisible={Boolean(!isDemoMode && !measurements && !isProcessing && selectedStyleId && poseResults?.isDetected)}
          poseStability={poseStability}
        />






         
         

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





        {/* Position feedback */}
        {positionFeedback && !isDemoMode && !measurements && !isProcessing && (
          <div className="absolute bottom-20 left-0 right-0 z-20 px-20">
            <div className={`text-center py-3 px-4 rounded-lg backdrop-blur-sm ${
              positionFeedback.feedbackType === 'success' 
                ? 'bg-green-500/90 text-white' 
                : positionFeedback.feedbackType === 'warning'
                ? 'bg-yellow-500/90 text-black'
                : 'bg-red-500/90 text-white'
            }`}>
              <p className="text-sm font-medium">{positionFeedback.feedbackMessage}</p>
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

        {/* Camera / Pose debug overlay */}
        <CameraDebugOverlay
          isVisible={showDebug}
            onClose={() => setShowDebug(false)}
            poseDetectionStatus={{
              isInitialized: isPoseInitialized,
              isLoading: isPoseLoading,
              error: poseError || '',
              poseResults: poseResults,
            }}
            cameraStatus={{
              isActive: Boolean(videoRef.current?.srcObject),
              error: cameraError || null,
              stream: (videoRef.current?.srcObject as MediaStream) || null,
            }}
            videoElement={videoRef.current}
            poseStability={poseStability}
            onForceCameraStart={startCamera}
            onForcePoseInit={() => {
              if (videoRef.current) {
                initializePose(videoRef.current).catch(() => {})
              }
            }}
        />
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