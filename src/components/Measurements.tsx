<<<<<<< HEAD
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Measurements } from '../types'
import { usePoseDetectionTF, POSENET_KEYPOINTS } from '../hooks/usePoseDetectionTF'
import { Logger } from '../utils/Logger';
import React from 'react'
=======
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'
import { usePoseValidation } from '../hooks/usePoseValidation'
import { usePoseStability } from '../hooks/usePoseStability'
import { useFlowState } from '../hooks/useFlowState'
import { DebugOverlay } from './DebugOverlay'
import { ConfidenceThreshold } from './ConfidenceThreshold'
import { Logger } from '../utils/Logger'
import { Measurements as MeasurementsType, PoseResults } from '../types'
import { getClothingInstructions } from '../data/poseRequirements'
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

// ——— In-app crash & error overlay ———
class InAppErrorBoundary extends React.Component<{children: React.ReactNode}, {err?: Error, stack?: string, open: boolean}> {
  constructor(props:any){
    super(props)
    this.state = { err: undefined, stack: '', open: false }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack
    });
    this.setState({ err: error, stack: info?.componentStack ?? '', open: true })
  }
  render() {
    if (!this.state.open) return this.props.children
    const message = this.state.err?.message ?? String(this.state.err)
    const payload = `Message: ${message}\n\nStack:\n${this.state.err?.stack || ''}\n\nComponent stack:\n${this.state.stack}`
    return (
      <div style={{
        position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', color:'#fff',
        zIndex: 99999, display:'flex', alignItems:'center', justifyContent:'center', padding:16
      }}>
        <div style={{maxWidth: 700, width:'100%', background:'#111', borderRadius:12, padding:16}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <h2 style={{margin:0, fontSize:18}}>🔥 App Error</h2>
            <button
              onClick={() => this.setState({open:false})}
              style={{background:'#444', color:'#fff', border:'none', padding:'6px 10px', borderRadius:8}}
            >Dismiss</button>
          </div>
          <div style={{whiteSpace:'pre-wrap', fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize:12, maxHeight: '50vh', overflow:'auto', background:'#000', padding:12, borderRadius:8}}>
            {payload}
          </div>
          <div style={{marginTop:10, display:'flex', gap:8}}>
            <button
              onClick={() => navigator.clipboard?.writeText(payload)}
              style={{background:'#2563eb', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8, flex:1}}
            >Copy</button>
            <button
              onClick={() => location.reload()}
              style={{background:'#666', color:'#fff', border:'none', padding:'8px 12px', borderRadius:8}}
            >Reload</button>
          </div>
        </div>
      </div>
    )
  }
}

// Captures non-fatal runtime errors and shows them in the same overlay
function GlobalErrorHooks() {
  const [msg, setMsg] = React.useState<string | null>(null)
  React.useEffect(() => {
    const onErr = (e: ErrorEvent) => {
<<<<<<< HEAD
      const errorMsg = `window.onerror: ${e.message}\n${e?.error?.stack ?? ''}`;
      Logger.error('Global window error', { 
        message: e.message, 
        stack: e?.error?.stack,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      });
      setMsg(errorMsg);
=======
      const errorMsg = `${e.message}\n${e.error?.stack ?? ''}`
      console.error('Global error caught:', errorMsg)
      setMsg(errorMsg)
      
      // Auto-clear after 10 seconds
      setTimeout(() => setMsg(null), 10000)
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
    }
    const onRej = (e: PromiseRejectionEvent) => {
<<<<<<< HEAD
      const errorMsg = `unhandledrejection: ${e.reason?.message ?? e.reason}\n${e.reason?.stack ?? ''}`;
      Logger.error('Unhandled promise rejection', {
        reason: e.reason?.message ?? e.reason,
        stack: e.reason?.stack
      });
      setMsg(errorMsg);
=======
      const errorMsg = `Unhandled Promise Rejection: ${e.reason?.message || e.reason || 'Unknown error'}\n${e.reason?.stack || ''}`
      console.error('Global promise rejection caught:', errorMsg)
      
      // Log additional context for debugging
      if (e.reason instanceof Error) {
        console.error('Rejection details:', {
          name: e.reason.name,
          message: e.reason.message,
          stack: e.reason.stack
        })
      }
      
      setMsg(errorMsg)
      
      // Auto-clear after 10 seconds
      setTimeout(() => setMsg(null), 10000)
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
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
<<<<<<< HEAD
      position:'fixed', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.85)',
      color:'#fff', zIndex: 99998, padding:12, borderRadius:12
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <strong>⚠️ Runtime Error</strong>
        <button onClick={()=>setMsg(null)} style={{background:'#333', color:'#fff', border:'none', padding:'4px 8px', borderRadius:6}}>Dismiss</button>
      </div>
      <pre style={{whiteSpace:'pre-wrap', margin:0, fontSize:12}}>{msg}</pre>
=======
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#dc2626',
      color: '#fff',
      zIndex: 99999,
      padding: '12px 16px',
      fontSize: 14,
      fontFamily: 'monospace',
      wordBreak: 'break-word',
      maxHeight: '200px',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8
      }}>
        <strong>🚨 Runtime Error</strong>
        <button 
          onClick={() => setMsg(null)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            border: 'none',
            padding: '4px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            marginLeft: 16
          }}
        >
          Dismiss
        </button>
      </div>
      <pre style={{
        whiteSpace: 'pre-wrap',
        margin: 0,
        fontSize: 12,
        background: 'rgba(0,0,0,0.2)',
        padding: 8,
        borderRadius: 4,
        overflow: 'auto'
      }}>
        {msg}
      </pre>
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
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
  onBack?: () => void
}

export function MeasurementsStepImpl({
  onMeasurementsComplete,
  selectedItemName,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName,
  onBack,
}: MeasurementsStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [measurements, setMeasurements] = useState<MeasurementsType | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
<<<<<<< HEAD
  const [videoDims, setVideoDims] = useState({ vw: 0, vh: 0 })
  const [displayDims, setDisplayDims] = useState({ cw: 0, ch: 0 })
=======
  const [cameraStatus, setCameraStatus] = useState<string>('')
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string>('')
  const [autoSkipCountdown, setAutoSkipCountdown] = useState<number>(0)
  const [initialCountdown, setInitialCountdown] = useState<number>(5)
  const [isInitialCountdownActive, setIsInitialCountdownActive] = useState<boolean>(true)
  const [cameraStarted, setCameraStarted] = useState<boolean>(false)
  const [isPoseWarmingUp, setIsPoseWarmingUp] = useState<boolean>(false)
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

  const {
    poseResults,
    isInitialized: isPoseInitialized,
    isLoading: isPoseLoading,
    error: poseError,
    initializePose,
    startDetection,
    startDetectionWithRetry,
    stopDetection,
<<<<<<< HEAD
    cleanup
  } = usePoseDetectionTF()

=======
    cleanup,
    getHealthStatus,
    performHealthCheck
  } = usePoseDetectionTF()

  // Initialize pose stability tracking
  const {
    stability: poseStability,
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
    validation
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

>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
  // Log component initialization
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName
    });
  }, [selectedItemName, selectedCompanyName, selectedStyleName, selectedSubStyleName]);

<<<<<<< HEAD
  const HEAD_INDEX = useMemo(() => {
    if (!Array.isArray(POSENET_KEYPOINTS)) return 0
    const wanted = ['nose', 'head', 'face', 'left_eye', 'right_eye', 'lefteye', 'righteye']
    const idx = POSENET_KEYPOINTS.findIndex(k =>
      typeof k === 'string' && wanted.some(w => k.toLowerCase().includes(w))
    )
    Logger.debug('HEAD_INDEX calculated', { index: idx >= 0 ? idx : 0, keypoints: POSENET_KEYPOINTS });
    return idx >= 0 ? idx : 0
  }, [])
=======
  // Periodic health check for pose detection to prevent timeouts
  useEffect(() => {
    if (!isPoseWarmingUp && isPoseInitialized && poseResults) {
      // Only run health checks when pose detection is active
      const healthCheckInterval = setInterval(async () => {
        try {
          const isHealthy = await performHealthCheck()
          if (!isHealthy) {
            Logger.warn('Pose detection health check failed, attempting recovery...')
            // Try to recover by restarting detection
            try {
              await startDetectionWithRetry()
              Logger.info('Pose detection recovered successfully')
            } catch (recoveryErr) {
              Logger.error('Pose detection recovery failed:', recoveryErr)
              setCameraError('Pose detection became unstable. Please try again.')
            }
          }
        } catch (err) {
          Logger.warn('Health check error:', err)
        }
      }, 20000) // Increased from 10 seconds to 20 seconds to reduce overhead

      return () => clearInterval(healthCheckInterval)
    }
  }, [isPoseWarmingUp, isPoseInitialized, poseResults, performHealthCheck, startDetectionWithRetry])


>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

  const syncCanvasToVideo = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      Logger.warn('syncCanvasToVideo: Missing video or canvas element');
      return;
    }

    const dpr = window.devicePixelRatio || 1
    const vw = video.videoWidth || 640
    const vh = video.videoHeight || 480
    setVideoDims({ vw, vh })

    const rect = video.getBoundingClientRect()
    const cw = Math.round(rect.width)
    const ch = Math.round(rect.height)
    setDisplayDims({ cw, ch })

    canvas.style.width = `${cw}px`
    canvas.style.height = `${ch}px`
    canvas.width = Math.round(cw * dpr)
    canvas.height = Math.round(ch * dpr)

    Logger.debug('Canvas synced to video', {
      videoDimensions: { width: vw, height: vh },
      displayDimensions: { width: cw, height: ch },
      devicePixelRatio: dpr
    });
  }, [])

<<<<<<< HEAD
  const mapToCanvasXY = useCallback((
    lx: number,
    ly: number,
    coordsAreNormalized: boolean,
    videoWidth: number,
    videoHeight: number,
    canvasCssWidth: number,
    canvasCssHeight: number
  ) => {
    const xInVideoPx = coordsAreNormalized ? lx * videoWidth : lx
    const yInVideoPx = coordsAreNormalized ? ly * videoHeight : ly
    const scale = Math.min(canvasCssWidth / videoWidth, canvasCssHeight / videoHeight)
    const drawnW = videoWidth * scale
    const drawnH = videoHeight * scale
    const offX = (canvasCssWidth - drawnW) / 2
    const offY = (canvasCssHeight - drawnH) / 2
    const dx = offX + xInVideoPx * scale
    const dy = offY + yInVideoPx * scale
    return { dx, dy, scale }
  }, [])
=======
  // Enhanced canvas drawing with lines between landmarks and stability indicators
  useEffect(() => {
    if (!canvasRef.current || !poseResults || !poseResults.isDetected) return
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

  const computeContainRect = useCallback((
    videoWidth: number, videoHeight: number, canvasCssWidth: number, canvasCssHeight: number
  ) => {
    const scale = Math.min(canvasCssWidth / videoWidth, canvasCssHeight / videoHeight)
    const drawnW = videoWidth * scale
    const drawnH = videoHeight * scale
    const offX = (canvasCssWidth - drawnW) / 2
    const offY = (canvasCssHeight - drawnH) / 2
    return { scale, drawnW, drawnH, offX, offY }
  }, [])

<<<<<<< HEAD
  const getXY = (pt: any) => {
    if (!pt) return null
    if (Array.isArray(pt)) {
      const [x, y, s] = pt
      return { x, y, conf: s ?? 1 }
    }
    if (typeof pt === 'object') {
      return {
        x: pt.x,
        y: pt.y,
        conf: pt.confidence ?? pt.score ?? pt.visibility ?? 1
      }
    }
    return null
  }

  const fromSquareToVideo = useCallback(
    (nx: number, ny: number, vw: number, vh: number) => {
      const cropSide = Math.min(vw, vh)
      const offX = (vw - cropSide) / 2
      const offY = (vh - cropSide) / 2
      const x_px = offX + nx * cropSide
      const y_px = offY + ny * cropSide
      return { x_px, y_px }
    },
    []
  )
=======
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


>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

  // Camera initialization
  const startCamera = useCallback(async () => {
<<<<<<< HEAD
    if (hasBootedRef.current) {
      Logger.debug('Camera already booted, skipping initialization');
      return;
    }
    hasBootedRef.current = true

    try {
      Logger.info('Starting camera initialization');
      setCameraError('')
      setIsCameraActive(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }  // 'environment' for rear camera
      })
      Logger.info('Camera permission granted');

      const video = videoRef.current
      if (!video) {
        throw new Error('No video element available');
      }

      video.srcObject = stream

      await new Promise<void>((resolve) => {
        const onMeta = () => {
          video.removeEventListener('loadedmetadata', onMeta)
          resolve()
        }
        video.addEventListener('loadedmetadata', onMeta)
      })

      await video.play()
      Logger.info('Video playing successfully');

      syncCanvasToVideo()

      await initializePose(video)
      Logger.info('Pose detection model initialized');

      await startDetection()
      Logger.info('Pose detection started');
    } catch (error) {
      const errorMessage = (error as Error).message;
      Logger.error('Camera initialization failed', { 
        error: errorMessage,
        stack: (error as Error).stack
      });
      setCameraError(errorMessage)
      setIsCameraActive(false)
      hasBootedRef.current = false
    }
  }, [syncCanvasToVideo, initializePose, startDetection])
=======
    Logger.info('Starting camera initialization...');
    setCameraError('');
    setCameraStatus('');
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
        
        // Reduced delay before initializing pose detection (from 1000ms to 500ms)
        Logger.info('Waiting for video to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Initialize pose detection with proper loading phase
        Logger.info('Initializing pose detection...');
        setCameraStatus('Initializing pose detection model...');
        await initializePose(videoRef.current);
        
        // Reduced delay before starting detection (from 1000ms to 500ms)
        Logger.info('Waiting for model to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        Logger.info('Starting pose detection...');
        setCameraStatus('Starting pose detection...');
        await startDetectionWithRetry();
        
        Logger.info('Pose detection started successfully');
        setIsPoseWarmingUp(false);
        setCameraStatus('Pose detection started successfully');
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
          // Extract the specific pose detection error
          const poseError = error.message.replace('Pose detection failed: ', '');
          if (poseError.includes('timed out')) {
            errorMessage = 'Pose detection is taking longer than expected. This may happen on slower devices. Please try again.';
          } else if (poseError.includes('Model failed to become ready')) {
            errorMessage = 'Pose detection model failed to initialize. Please refresh the page and try again.';
          } else if (poseError.includes('WebGL')) {
            errorMessage = 'Graphics processing issue detected. Please refresh the page and try again.';
          } else if (poseError.includes('initialization timed out')) {
            errorMessage = 'Pose detection initialization is taking longer than expected. Please try again or refresh the page.';
          } else {
            errorMessage = `Pose detection failed: ${poseError}`;
          }
        } else {
          errorMessage = `Camera error: ${error.message}`;
        }
      }
      
      setCameraError(errorMessage);
      setIsPoseWarmingUp(false);
    }
  }, [initializePose, startDetectionWithRetry]);
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c

  const stopCamera = useCallback(() => {
    Logger.info('Stopping camera');
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      Logger.debug('Camera stream stopped and cleared');
    }
    stopDetection()
    setIsCameraActive(false)
  }, [stopDetection])

<<<<<<< HEAD
  useEffect(() => {
    if (isPoseLoading) {
      Logger.info('Pose detection model loading...');
    } else if (isPoseInitialized) {
      Logger.info('Pose detection model ready');
    }
  }, [isPoseLoading, isPoseInitialized]);

  useEffect(() => {
    if (poseResults?.isDetected) {
      Logger.debug('Pose detected', {
        confidence: poseResults.confidence,
        landmarksCount: poseResults.landmarks?.length
      });
    }
  }, [poseResults]);

  useEffect(() => {
    if (poseError) {
      Logger.error('Pose detection error', { error: poseError });
    }
  }, [poseError]);

  useEffect(() => {
    if (cameraError) {
      Logger.error('Camera error occurred', { error: cameraError });
    }
  }, [cameraError]);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !poseResults || !poseResults.isDetected) return

    const { vw, vh } = videoDims
    const { cw, ch } = displayDims
    if (!vw || !vh || !cw || !ch) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const scale = Math.min(cw / vw, ch / vh)
    const drawnW = vw * scale
    const drawnH = vh * scale
    const offX = (cw - drawnW) / 2
    const offY = (ch - drawnH) / 2

    // Fitted video border (yellow)
    ctx.strokeStyle = 'yellow'
    ctx.lineWidth = 2
    ctx.strokeRect(offX, offY, drawnW, drawnH)

    // Center ring (white)
    const cx = cw / 2, cy = ch / 2
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.stroke()

    // Head point
    const raw = poseResults.landmarks?.[HEAD_INDEX]
    const kp = getXY(raw)
    if (!kp || !(Number.isFinite(kp.x) && Number.isFinite(kp.y))) {
      Logger.warn('Head keypoint not readable', { 
        headIndex: HEAD_INDEX, 
        rawData: raw,
        videoDims: { vw, vh },
        displayDims: { cw, ch }
      });

      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(10, 10, cw - 20, 80)
      ctx.fillStyle = '#fff'
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillText(`HEAD_INDEX=${HEAD_INDEX} not readable. raw=${JSON.stringify(raw)?.slice(0,140)}...`, 18, 36)
      ctx.fillText(`vw×vh=${vw}×${vh}  cw×ch=${cw}×${ch}`, 18, 60)
      return
    }

    const xs = poseResults.landmarks.map((p: any) => (Array.isArray(p) ? p[0] : p?.x))
    const ys = poseResults.landmarks.map((p: any) => (Array.isArray(p) ? p[1] : p?.y))
    const minx = Math.min(...xs), maxx = Math.max(...xs)
    const miny = Math.min(...ys), maxy = Math.max(...ys)
    const looksNormalized = maxx <= 1.01 && maxy <= 1.01 && minx >= -0.01 && miny >= -0.01
    const looksPixels     = maxx > 10 && maxy > 10

    Logger.debug('Pose coordinate analysis', {
      headPoint: { x: kp.x, y: kp.y, confidence: kp.conf },
      coordinateRanges: { minx, maxx, miny, maxy },
      coordinateType: { looksNormalized, looksPixels }
    });

    // Hypotheses for mapping
    const Ax = offX + (kp.x * vw) * scale
    const Ay = offY + (kp.y * vh) * scale

    const Bx = offX + kp.x * scale
    const By = offY + kp.y * scale

    const cropSide = Math.min(vw, vh)
    const cropOffX = (vw - cropSide) / 2
    const cropOffY = (vh - cropSide) / 2
    const Cx = offX + (cropOffX + kp.x * cropSide) * scale
    const Cy = offY + (cropOffY + kp.y * cropSide) * scale

    // Draw points and lines
    ctx.fillStyle = 'red'
    ctx.beginPath(); ctx.arc(Ax, Ay, 7, 0, Math.PI * 2); ctx.fill()

    ctx.fillStyle = 'lime'
    ctx.beginPath(); ctx.arc(Bx, By, 6, 0, Math.PI * 2); ctx.fill()

    ctx.fillStyle = 'deepskyblue'
    ctx.beginPath(); ctx.arc(Cx, Cy, 5, 0, Math.PI * 2); ctx.fill()

    ctx.strokeStyle = 'rgba(255,0,0,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Ax, Ay); ctx.stroke()
    ctx.strokeStyle = 'rgba(0,255,0,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Bx, By); ctx.stroke()
    ctx.strokeStyle = 'rgba(0,191,255,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Cx, Cy); ctx.stroke()

    // HUD
    const hudW = Math.min(360, cw - 20)
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(10, 10, hudW, 110)
    ctx.fillStyle = '#fff'
    ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace'
    ctx.fillText(`vw×vh=${vw}×${vh}  cw×ch=${cw}×${ch}`, 18, 34)
    ctx.fillText(`raw head: x=${kp.x?.toFixed(3)} y=${kp.y?.toFixed(3)} conf=${(kp.conf??1).toFixed(2)}`, 18, 56)
    ctx.fillText(`ranges x:[${minx.toFixed(3)}, ${maxx.toFixed(3)}] y:[${miny.toFixed(3)}, ${maxy.toFixed(3)}]`, 18, 78)
    ctx.fillStyle = 'red'; ctx.fillRect(18, 92, 10, 10)
    ctx.fillStyle = '#fff'; ctx.fillText('A=video normalized 0..1', 34, 101)
    ctx.fillStyle = 'lime'; ctx.fillRect(200, 92, 10, 10)
    ctx.fillStyle = '#fff'; ctx.fillText('B=video pixels', 216, 101)
    ctx.fillStyle = 'deepskyblue'; ctx.fillRect(18, 108, 10, 10)
    ctx.fillStyle = '#fff'; ctx.fillText('C=center-crop square 0..1', 34, 117)

  }, [poseResults, videoDims, displayDims, HEAD_INDEX])

  const forceStartDetection = useCallback(() => {
    Logger.info('Manual detection restart triggered');
    if (!isPoseInitialized) {
      Logger.warn('Cannot force start: Pose not initialized yet');
      return
    }
    if (!videoRef.current) {
      Logger.warn('Cannot force start: No video element');
      return
    }
    try {
      stopDetection()
      Logger.info('Restarting pose detection...');
      startDetection().then(() => {
        Logger.info('Pose detection manually restarted successfully');
      }).catch((err) => {
        Logger.error('Manual detection restart failed', { error: err.message });
      });
    } catch (err) {
      Logger.error('Manual detection restart error', { error: (err as Error).message });
    }
  }, [isPoseInitialized, stopDetection, startDetection])

  useEffect(() => {
    Logger.info('Component mounted, starting camera');
    startCamera()

    return () => {
      Logger.info('Component unmounting, cleaning up camera and pose detection');
=======
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

  // Enhanced retry specifically for pose detection failures
  const retryPoseDetection = async () => {
    Logger.info('User requested pose detection retry')
    setCameraError('')
    
    try {
      // Clean up pose detection but keep camera stream
      stopDetection()
      setIsPoseWarmingUp(false)
      
      // Reduced wait time for cleanup (from 1000ms to 500ms)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Re-initialize pose detection with the existing video stream
      if (videoRef.current && videoRef.current.srcObject) {
        Logger.info('Re-initializing pose detection with existing video stream')
        setCameraStatus('Re-initializing pose detection...')
        setIsPoseWarmingUp(true)
        
        await initializePose(videoRef.current)
        
        // Reduced delay for model stabilization (from 1000ms to 500ms)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Start detection with retry
        await startDetectionWithRetry()
        
        Logger.info('Pose detection re-initialized successfully')
        setIsPoseWarmingUp(false)
        setCameraStatus('Pose detection re-started successfully')
        setCameraError('')
      } else {
        throw new Error('No video stream available for pose detection retry')
      }
    } catch (error) {
      Logger.error('Pose detection retry failed:', error)
      setCameraError('Failed to restart pose detection. Please try the full camera retry.')
      setIsPoseWarmingUp(false)
    }
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
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
      try {
        stopDetection()
      } catch (err) {
        Logger.warn('Error stopping detection during cleanup', { error: (err as Error).message });
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onResize = () => {
      Logger.debug('Window resized, syncing canvas');
      syncCanvasToVideo();
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncCanvasToVideo])

  const handleTakeMeasurement = () => {
    Logger.info('Taking measurement', {
      poseDetected: poseResults?.isDetected,
      confidence: poseResults?.confidence
    });
    setIsProcessing(true)
    
    setTimeout(() => {
      const mockMeasurements: Measurements = {
        chest: 42, waist: 32, hips: 38, shoulders: 18,
        armLength: 25, inseam: 32, height: 70, weight: 165
      }
      Logger.info('Measurements calculated', { measurements: mockMeasurements });
      setMeasurements(mockMeasurements)
      setIsProcessing(false)
      stopCamera()
    }, 2000)
  }

  const handleRetake = () => {
    Logger.info('User requested measurement retake');
    setMeasurements(null)
    setIsProcessing(false)
    startCamera()
  }

  const handleContinue = () => {
    if (measurements) {
      Logger.info('User confirmed measurements, proceeding to next step', { measurements });
      onMeasurementsComplete(measurements)
    } else {
      Logger.warn('Attempted to continue without measurements');
    }
  }



  return (
    <div className="min-h-screen flex flex-col bg-black">
      {/* Header: back absolute; centered; only Step shown */}
      <header className="relative bg-white shadow-sm border-b border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm">Back</span>
          </button>
        )}

        <div className="px-4 pt-12 pb-4 text-center">
          <div className="mb-1">
            <span className="text-sm font-medium text-gray-700">Step 5 of 6</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Get Your Measurements</h1>
<<<<<<< HEAD
          <p className="text-sm text-gray-500">We'll use your camera to measure you perfectly</p>
        </div>
      </header>

      {/* Full-screen camera area under header */}
      <main className="relative flex-1 overflow-hidden">
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

        {/* Top-left status chip */}
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-2 rounded-lg text-sm z-20">
          {isPoseLoading ? (
            <span>⏳ Loading Model...</span>
          ) : poseResults?.isDetected ? (
            <span>✅ Pose Detected ({Math.round((poseResults.confidence || 0) * 100)}%)</span>
          ) : (
            <div className="flex items-center space-x-2">
              <span>🔍 Looking for pose...</span>
              {isPoseInitialized && (
=======
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
                  {cameraStatus && (
                    <div className="bg-blue-600/20 border border-blue-600/30 rounded-md p-3 mb-4">
                        <p className="text-blue-800 text-sm">{cameraStatus}</p>
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
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
                <button
                  onClick={forceStartDetection}
                  className="ml-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs hover:bg-yellow-300"
                >
                  Force Start
                </button>
<<<<<<< HEAD
              )}
=======
                {/* Add pose detection retry button for pose-specific errors */}
                {cameraError.includes('Pose detection') && (
                  <button
                    onClick={retryPoseDetection}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Retry Pose Detection
                  </button>
                )}
                <button
                  onClick={debugCameraStatus}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  Debug
                </button>
              </div>
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
            </div>
          )}
        </div>

<<<<<<< HEAD
        {/* Bottom controls inside the camera view */}
        {!measurements && !isProcessing && (
=======
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
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
          <div className="absolute bottom-4 left-0 right-0 z-20 px-4">
            {cameraError && (
              <div className="mb-3 bg-red-600/80 text-white text-sm px-3 py-2 rounded">
                Camera Error: {cameraError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={stopCamera}
                className="flex-1 bg-white/80 text-gray-900 backdrop-blur px-4 py-3 rounded-lg font-medium hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeMeasurement}
                disabled={!poseResults?.isDetected}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
<<<<<<< HEAD
                Take Measurement
=======
                {isPoseStable ? 'Take Measurement' : 
                  `Hold Still... ${Math.round(stabilityProgress * 100)}%`}
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
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
<<<<<<< HEAD
              <p className="text-sm text-gray-600">Analyzing your pose and calculating measurements...</p>
=======
              <p className="text-sm text-gray-600">
                Analyzing your pose and calculating measurements...
              </p>
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
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
                  className="flex-1 bg-white text-black py-3 px-4 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
                >
                  Continue to Recommendations
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
<<<<<<< HEAD
=======



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
>>>>>>> d1b261c39864fb2f684e38b682d957fac50b2f1c
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
