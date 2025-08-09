import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Measurements } from '../types'
import { usePoseDetectionTF, POSENET_KEYPOINTS } from '../hooks/usePoseDetectionTF'
import { Logger } from '../utils/Logger';
import React from 'react'

const HEAD_INDEX = 0

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
        const errorMsg = `window.onerror: ${e.message}\n${e?.error?.stack ?? ''}`;
        Logger.error('Global window error', { 
          message: e.message, 
          stack: e?.error?.stack,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno
        });
        setMsg(errorMsg);
      }
      const onRej = (e: PromiseRejectionEvent) => {
        const errorMsg = `unhandledrejection: ${e.reason?.message ?? e.reason}\n${e.reason?.stack ?? ''}`;
        Logger.error('Unhandled promise rejection', {
          reason: e.reason?.message ?? e.reason,
          stack: e.reason?.stack
        });
        setMsg(errorMsg);
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
        position:'fixed', bottom:12, left:12, right:12, background:'rgba(0,0,0,0.85)',
        color:'#fff', zIndex: 99998, padding:12, borderRadius:12
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
          <strong>⚠️ Runtime Error</strong>
          <button onClick={()=>setMsg(null)} style={{background:'#333', color:'#fff', border:'none', padding:'4px 8px', borderRadius:6}}>Dismiss</button>
        </div>
        <pre style={{whiteSpace:'pre-wrap', margin:0, fontSize:12}}>{msg}</pre>
      </div>
    )
  }

interface MeasurementsStepProps {
  onMeasurementsComplete: (measurements: Measurements) => void
  selectedItemName?: string
  selectedCompanyName?: string
  selectedStyleName?: string
  selectedSubStyleName?: string
}

export function MeasurementsStepImpl({
  onMeasurementsComplete,
  selectedItemName,
  selectedCompanyName,
  selectedStyleName,
  selectedSubStyleName
}: MeasurementsStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hasBootedRef = useRef(false)

  const [measurements, setMeasurements] = useState<Measurements | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [videoDims, setVideoDims] = useState({ vw: 0, vh: 0 })
  const [displayDims, setDisplayDims] = useState({ cw: 0, ch: 0 })

  const {
    poseResults,
    isInitialized: isPoseInitialized,
    isLoading: isPoseLoading,
    error: poseError,
    initializePose,
    startDetection,
    stopDetection,
    cleanup
  } = usePoseDetectionTF()

  // Log component initialization
  useEffect(() => {
    Logger.info('MeasurementsStep component initialized', {
      selectedItem: selectedItemName,
      company: selectedCompanyName,
      style: selectedStyleName,
      subStyle: selectedSubStyleName
    });
  }, [selectedItemName, selectedCompanyName, selectedStyleName, selectedSubStyleName]);

  const HEAD_INDEX = useMemo(() => {
    if (!Array.isArray(POSENET_KEYPOINTS)) return 0
    const wanted = ['nose', 'head', 'face', 'left_eye', 'right_eye', 'lefteye', 'righteye']
    const idx = POSENET_KEYPOINTS.findIndex(k =>
      typeof k === 'string' && wanted.some(w => k.toLowerCase().includes(w))
    )
    Logger.debug('HEAD_INDEX calculated', { index: idx >= 0 ? idx : 0, keypoints: POSENET_KEYPOINTS });
    return idx >= 0 ? idx : 0
  }, [])

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

  const mapToCanvasXY = useCallback((
    lx: number,
    ly: number,
    coordsAreNormalized: boolean,
    videoWidth: number,
    videoHeight: number,
    canvasCssWidth: number,
    canvasCssHeight: number
  ) => {
    // 1) Convert to VIDEO PIXELS
    const xInVideoPx = coordsAreNormalized ? lx * videoWidth : lx
    const yInVideoPx = coordsAreNormalized ? ly * videoHeight : ly
  
    // 2) Compute how the object-contain video is drawn onto the canvas area
    const scale = Math.min(canvasCssWidth / videoWidth, canvasCssHeight / videoHeight)
    const drawnW = videoWidth * scale
    const drawnH = videoHeight * scale
  
    // 3) Letterbox offsets (video centered in the canvas rectangle)
    const offX = (canvasCssWidth - drawnW) / 2
    const offY = (canvasCssHeight - drawnH) / 2
  
    // 4) Map video pixel -> canvas CSS pixel
    const dx = offX + xInVideoPx * scale
    const dy = offY + yInVideoPx * scale
  
    return { dx, dy, scale }
  }, [])

  // How the video is drawn inside the canvas area with object-contain
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

  // Model output is normalized (0..1) in a SQUARE that was made by CENTER-CROPPING the video.
  // Map that back into the original video pixel coordinates.
  const fromSquareToVideo = useCallback(
      (nx: number, ny: number, vw: number, vh: number) => {
      // crop size = the shorter video side
      const cropSide = Math.min(vw, vh)
      // offsets of the crop inside the full video
      const offX = (vw - cropSide) / 2
      const offY = (vh - cropSide) / 2
      // scale normalized coords to crop, then shift back into video space
      const x_px = offX + nx * cropSide
      const y_px = offY + ny * cropSide
      return { x_px, y_px }
      },
      []
  )

  // Camera initialization (reliable first try, no timeouts)
  const startCamera = useCallback(async () => {
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
  
      // Wait for real dimensions before initializing pose
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
  
      // Init model once, then start detection
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

  // Log pose detection state changes
  useEffect(() => {
    if (isPoseLoading) {
      Logger.info('Pose detection model loading...');
    } else if (isPoseInitialized) {
      Logger.info('Pose detection model ready');
    }
  }, [isPoseLoading, isPoseInitialized]);

  // Log pose detection results
  useEffect(() => {
    if (poseResults?.isDetected) {
      Logger.debug('Pose detected', {
        confidence: poseResults.confidence,
        landmarksCount: poseResults.landmarks?.length
      });
    }
  }, [poseResults]);

  // Log errors
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
  
    // Draw in CSS pixels
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  
    // How video is drawn (object-contain)
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
  
    // Grab the head point robustly
    const raw = poseResults.landmarks?.[HEAD_INDEX]
    const kp = getXY(raw)
    if (!kp || !(Number.isFinite(kp.x) && Number.isFinite(kp.y))) {
      Logger.warn('Head keypoint not readable', { 
        headIndex: HEAD_INDEX, 
        rawData: raw,
        videoDims: { vw, vh },
        displayDims: { cw, ch }
      });
      
      // Loud HUD if we can't read it
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(10, 10, cw - 20, 80)
      ctx.fillStyle = '#fff'
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace'
      ctx.fillText(`HEAD_INDEX=${HEAD_INDEX} not readable. raw=${JSON.stringify(raw)?.slice(0,140)}...`, 18, 36)
      ctx.fillText(`vw×vh=${vw}×${vh}  cw×ch=${cw}×${ch}`, 18, 60)
      return
    }
  
    // Heuristics for ranges (across all points) to detect normalization
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
  
    // Compute 3 hypotheses for the head point
    // A) normalized to VIDEO (0..1)
    const Ax = offX + (kp.x * vw) * scale
    const Ay = offY + (kp.y * vh) * scale
  
    // B) VIDEO PIXELS already
    const Bx = offX + kp.x * scale
    const By = offY + kp.y * scale
  
    // C) normalized to CENTER-CROP SQUARE (0..1)
    const cropSide = Math.min(vw, vh)
    const cropOffX = (vw - cropSide) / 2
    const cropOffY = (vh - cropSide) / 2
    const Cx = offX + (cropOffX + kp.x * cropSide) * scale
    const Cy = offY + (cropOffY + kp.y * cropSide) * scale
  
    // Draw the three head dots
    ctx.fillStyle = 'red'
    ctx.beginPath(); ctx.arc(Ax, Ay, 7, 0, Math.PI * 2); ctx.fill()
  
    ctx.fillStyle = 'lime'
    ctx.beginPath(); ctx.arc(Bx, By, 6, 0, Math.PI * 2); ctx.fill()
  
    ctx.fillStyle = 'deepskyblue'
    ctx.beginPath(); ctx.arc(Cx, Cy, 5, 0, Math.PI * 2); ctx.fill()
  
    // Draw a line from center to each, so movement is obvious
    ctx.strokeStyle = 'rgba(255,0,0,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Ax, Ay); ctx.stroke()
    ctx.strokeStyle = 'rgba(0,255,0,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Bx, By); ctx.stroke()
    ctx.strokeStyle = 'rgba(0,191,255,0.7)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(Cx, Cy); ctx.stroke()
  
    // Big readable HUD
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

  // Manual force (kept for debugging)
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

  // Start camera automatically on mount
  useEffect(() => {
    Logger.info('Component mounted, starting camera');
    startCamera()
  
    // cleanup on unmount
    return () => {
      Logger.info('Component unmounting, cleaning up camera and pose detection');
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
      hasBootedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep canvas sized on resize
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
      {/* Header stays the same */}
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
          <p className="text-sm text-gray-500">We'll use your camera to measure you perfectly</p>
        </div>
      </header>

      {/* Full-screen camera area under header */}
      <main className="relative flex-1 overflow-hidden">
        {/* Video fills the area; mirrored to look like a selfie view */}
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
                <button
                  onClick={forceStartDetection}
                  className="ml-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs hover:bg-yellow-300"
                >
                  Force Start
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom controls inside the camera view */}
        {!measurements && !isProcessing && (
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
                Take Measurement
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
              <p className="text-sm text-gray-600">Analyzing your pose and calculating measurements...</p>
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