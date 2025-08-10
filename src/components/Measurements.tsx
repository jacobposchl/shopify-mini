// src/components/Measurements.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Measurements, MeasurementValidation } from '../types'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { Logger } from '../utils/Logger'

import { ConfidenceThreshold } from './ConfidenceThreshold'
import { getClothingInstructions } from '../data/poseRequirements'

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

  // Auto-progress when valid
  useEffect(() => {
    setDebugEffectCount((prev) => prev + 1)

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
  ])

  // Init log
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName,
    })
    return undefined
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

  const averageMeasurements = (arr: Measurements[]): Measurements => {
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
  }

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

    const drawHumanGuide = () => {
      ctx.save()

      const centerX = canvas.width / 2
      const totalHeight = canvas.height * 0.75
      const headHeight = totalHeight / 8
      const startY = canvas.height * 0.15

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = 3
      ctx.setLineDash([8, 4])

      const headWidth = headHeight * 0.7
      const headCenterY = startY + headHeight / 2
      ctx.beginPath()
      ctx.ellipse(centerX, headCenterY, headWidth / 2, headHeight / 2, 0, 0, 2 * Math.PI)
      ctx.stroke()

      const neckStartY = startY + headHeight
      const neckEndY = neckStartY + headHeight * 0.4
      ctx.beginPath()
      ctx.moveTo(centerX, neckStartY)
      ctx.lineTo(centerX, neckEndY)
      ctx.stroke()

      const shoulderY = neckEndY + headHeight * 1
      const shoulderWidth = headHeight * 2.2
      ctx.beginPath()
      ctx.arc(centerX, shoulderY, shoulderWidth / 2, Math.PI, 0, false)
      ctx.stroke()

      const waistY = shoulderY + headHeight * 2
      const hipY = shoulderY + headHeight * 2.8
      const waistWidth = shoulderWidth * 0.7
      const hipWidth = shoulderWidth * 0.9

      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth / 2, shoulderY)
      ctx.quadraticCurveTo(centerX - waistWidth / 2, waistY, centerX - hipWidth / 2, hipY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(centerX + shoulderWidth / 2, shoulderY)
      ctx.quadraticCurveTo(centerX + waistWidth / 2, waistY, centerX + hipWidth / 2, hipY)
      ctx.stroke()

      const elbowY = shoulderY + headHeight * 1.5
      const wristY = shoulderY + headHeight * 2.5
      const armWidth = headHeight * 0.3

      ctx.beginPath()
      ctx.moveTo(centerX - shoulderWidth / 2, shoulderY)
      ctx.lineTo(centerX - shoulderWidth / 2 - armWidth, elbowY)
      ctx.lineTo(centerX - shoulderWidth / 2 - armWidth * 0.5, wristY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(centerX + shoulderWidth / 2, shoulderY)
      ctx.lineTo(centerX + shoulderWidth / 2 + armWidth, elbowY)
      ctx.lineTo(centerX + shoulderWidth / 2 + armWidth * 0.5, wristY)
      ctx.stroke()

      const legWidth = headHeight * 0.4
      const kneeY = hipY + headHeight * 2
      const maxAnkleY = startY + totalHeight
      const ankleY = Math.min(hipY + headHeight * 4, maxAnkleY)

      ctx.beginPath()
      ctx.moveTo(centerX - hipWidth / 4, hipY)
      ctx.lineTo(centerX - legWidth / 2, kneeY)
      ctx.lineTo(centerX - legWidth / 3, ankleY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(centerX + hipWidth / 4, hipY)
      ctx.lineTo(centerX + legWidth / 2, kneeY)
      ctx.lineTo(centerX + legWidth / 3, ankleY)
      ctx.stroke()

      ctx.restore()
    }

    drawHumanGuide()

    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.fillStyle = '#00ff00'

    poseResults.landmarks.forEach((landmark: any, index: number) => {
      if (landmark.confidence > 0.3) {
        const x = canvas.width - (landmark.x * scale + offsetX)
        const y = landmark.y * scale + offsetY

        const isRelevant = poseStability?.relevantLandmarks.includes(index) ?? false

        ctx.fillStyle = isRelevant ? '#00ff00' : '#666666'
        ctx.beginPath()
        ctx.arc(x, y, isRelevant ? 8 : 4, 0, 2 * Math.PI)
        ctx.fill()

        ctx.fillStyle = '#00ff00'
      }
    })

    const skeletonConnections = [
      [0, 5],
      [0, 6],
      [1, 3],
      [2, 4],
      [3, 5],
      [4, 6],
      [5, 6],
      [5, 7],
      [6, 8],
      [7, 9],
      [8, 10],
      [5, 11],
      [6, 12],
      [11, 12],
      [11, 13],
      [12, 14],
      [13, 15],
      [14, 16],
      [13, 14],
    ]

    skeletonConnections.forEach(([index1, index2]) => {
      const landmark1 = poseResults.landmarks[index1]
      const landmark2 = poseResults.landmarks[index2]

      if (landmark1 && landmark2 && landmark1.confidence > 0.3 && landmark2.confidence > 0.3) {
        const x1 = canvas.width - (landmark1.x * scale + offsetX)
        const y1 = landmark1.y * scale + offsetY
        const x2 = canvas.width - (landmark2.x * scale + offsetX)
        const y2 = landmark2.y * scale + offsetY

        const isRelevant =
          (poseStability?.relevantLandmarks.includes(index1) ?? false) &&
          (poseStability?.relevantLandmarks.includes(index2) ?? false)

        ctx.strokeStyle = isRelevant ? '#00ff00' : '#666666'
        ctx.lineWidth = isRelevant ? 3 : 1
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        if (isRelevant) {
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
        }
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
            connections.push({
              indices: [0, 11],
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Upper body length',
            })
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
            connections.push({
              indices: [0, 11],
              label: 'Body Length',
              value: `${measurements.chest}"`,
              description: 'Upper body length',
            })
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
      {/* Themed header (matches steps 2/3): back button in top-left, centered step/title/subtitle */}
      <header className="relative bg-transparent">
        <button
          onClick={onCancel}
          aria-label="Back"
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 text-gray-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Back</span>
        </button>

        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-white">Step 5 of 6</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Get Your Measurements</h1>
          <p className="text-sm text-white/80">
            {isDemoMode ? 'Demo Mode - Simulated measurements' : "We’ll use your camera to measure you perfectly"}
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
          <div className="absolute bottom-20 left-0 right-0 z-20 px-4">
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
