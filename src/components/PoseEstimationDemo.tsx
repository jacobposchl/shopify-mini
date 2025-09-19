import { useState, useRef, useEffect } from 'react'
import { BackButton } from './BackButton'
import { useCamera } from '../hooks/useCamera'
import { usePoseDetectionTF } from '../hooks/usePoseDetectionTF'

interface PoseEstimationDemoProps {
  onBack: () => void
}

export function PoseEstimationDemo({ onBack }: PoseEstimationDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isStarted, setIsStarted] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Use camera hook
  const {
    isActive: isCameraReady,
    isLoading: isCameraLoading,
    error: cameraError,
    videoRef, // Use the camera's video ref
    startCamera,
    stopCamera
  } = useCamera()

  // Use pose detection hook
  const {
    poseResults,
    isInitialized: isPoseReady,
    isLoading: isPoseLoading,
    error: poseError,
    initializePose,
    startDetection,
    stopDetection,
    cleanup: cleanupPose,
    getHealthStatus
  } = usePoseDetectionTF()

  // Start the demo
  const handleStart = async () => {
    try {
      setIsStarted(true)
      
      // Test network access FIRST to confirm CSP issue
      console.log('🔍 Testing network access to TensorFlow.js CDN...')
      try {
        const testUrl = 'https://storage.googleapis.com/tfjs-models/savedmodel/posenet/mobilenet/float/100/model-stride16.json'
        const response = await fetch(testUrl, { method: 'HEAD' })
        console.log('✅ Network test passed:', response.status)
      } catch (networkErr) {
        console.error('🚨 NETWORK TEST FAILED - CSP ISSUE CONFIRMED:', networkErr)
        setDebugInfo((prev: any) => ({
          ...prev,
          networkTest: {
            failed: true,
            error: networkErr instanceof Error ? networkErr.message : String(networkErr),
            cause: 'CSP blocks storage.googleapis.com - this is why PoseNet fails'
          }
        }))
      }
      
      // Initialize camera first
      await startCamera({ facingMode: 'user' })
      
      // Wait a bit for video to be ready
      setTimeout(async () => {
        if (videoRef.current) {
          // Initialize pose detection
          await initializePose(videoRef.current)
          
          // Start pose detection
          await startDetection()
        }
      }, 1000)
    } catch (err) {
      console.error('Failed to start demo:', err)
    }
  }

  // Stop the demo
  const handleStop = () => {
    setIsStarted(false)
    stopDetection()
    stopCamera()
  }

  // Update debug info periodically
  useEffect(() => {
    if (!isStarted) return

    const interval = setInterval(() => {
      const health = getHealthStatus()
      const initErrors = (window as any).__poseInitErrors || []
      
      setDebugInfo({
        camera: {
          isReady: isCameraReady,
          isLoading: isCameraLoading,
          error: cameraError
        },
        pose: {
          isReady: isPoseReady,
          isLoading: isPoseLoading,
          error: poseError,
          results: poseResults,
          health
        },
        initErrors: initErrors.slice(-10), // Last 10 errors
        timestamp: new Date().toLocaleTimeString()
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isStarted, isCameraReady, isCameraLoading, cameraError, isPoseReady, isPoseLoading, poseError, poseResults, getHealthStatus])

  // Draw pose on canvas
  useEffect(() => {
    if (!poseResults || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw landmarks
    if (poseResults.landmarks && poseResults.landmarks.length > 0) {
      poseResults.landmarks.forEach((landmark, index) => {
        if (landmark.confidence > 0.3) {
          // Draw landmark point
          ctx.fillStyle = landmark.confidence > 0.6 ? '#00ff00' : '#ffff00'
          ctx.beginPath()
          ctx.arc(landmark.x, landmark.y, 4, 0, 2 * Math.PI)
          ctx.fill()

          // Draw landmark index
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px Arial'
          ctx.fillText(index.toString(), landmark.x + 6, landmark.y - 6)
        }
      })

      // Draw skeleton connections
      const connections = [
        [0, 1], [0, 2], [1, 3], [2, 4], // Head
        [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], // Arms
        [5, 11], [6, 12], [11, 12], // Torso
        [11, 13], [12, 14], [13, 15], [14, 16] // Legs
      ]

      ctx.strokeStyle = '#00ffff'
      ctx.lineWidth = 2
      connections.forEach(([from, to]) => {
        const fromPoint = poseResults.landmarks[from]
        const toPoint = poseResults.landmarks[to]
        if (fromPoint && toPoint && fromPoint.confidence > 0.3 && toPoint.confidence > 0.3) {
          ctx.beginPath()
          ctx.moveTo(fromPoint.x, fromPoint.y)
          ctx.lineTo(toPoint.x, toPoint.y)
          ctx.stroke()
        }
      })
    }
  }, [poseResults])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleStop()
      cleanupPose()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#550cff]">
      {/* Header */}
      <header className="relative bg-transparent">
        <div className="absolute top-4 left-4 z-10">
          <BackButton onClick={onBack} variant="minimal" iconSize={22} className="w-12 h-12" />
        </div>

        <div className="px-4 pt-12 pb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Pose Estimation Demo
          </h1>
          <p className="text-sm text-white/80">
            Test pose detection functionality
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex-1 overflow-hidden bg-black rounded-t-3xl">
        <div className="flex flex-col h-full">
          
          {/* Camera and controls section */}
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              
              {/* Video and canvas container */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-96"
                  style={{ transform: 'scaleX(-1)' }} // Mirror for selfie view
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ transform: 'scaleX(-1)' }} // Mirror to match video
                />
                
                {/* Status overlay */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                  {!isStarted && 'Ready to start'}
                  {isStarted && (isCameraLoading || !isCameraReady) && 'Initializing camera...'}
                  {isStarted && isCameraReady && (isPoseLoading || !isPoseReady) && 'Loading pose model...'}
                  {isStarted && isCameraReady && isPoseReady && 'Pose detection active'}
                </div>

                {/* Pose info overlay */}
                {poseResults && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                    <div>Detected: {poseResults.isDetected ? 'Yes' : 'No'}</div>
                    <div>Confidence: {(poseResults.confidence * 100).toFixed(1)}%</div>
                    <div>Landmarks: {poseResults.landmarks?.length || 0}</div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex justify-center gap-4">
                {!isStarted ? (
                  <button
                    onClick={handleStart}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Start Demo
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Stop Demo
                  </button>
                )}
              </div>

              {/* Error display */}
              {(cameraError || poseError) && (
                <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                  {cameraError && <div>Camera Error: {cameraError}</div>}
                  {poseError && <div>Pose Error: {poseError}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Debug UI section */}
          <div className="bg-gray-900 p-4 max-h-64 overflow-y-auto">
            <h3 className="text-white font-semibold mb-2">Debug Information</h3>
            <div className="text-xs text-gray-300 font-mono space-y-1">
              <div>
                <span className="text-blue-300">Camera:</span> 
                Ready: {debugInfo.camera?.isReady ? '✅' : '❌'} | 
                Loading: {debugInfo.camera?.isLoading ? '⏳' : '✅'} | 
                Error: {debugInfo.camera?.error || 'None'}
              </div>
              
              <div>
                <span className="text-green-300">Pose:</span> 
                Ready: {debugInfo.pose?.isReady ? '✅' : '❌'} | 
                Loading: {debugInfo.pose?.isLoading ? '⏳' : '✅'} | 
                Error: {debugInfo.pose?.error || 'None'}
              </div>

              {debugInfo.pose?.health && (
                <div>
                  <span className="text-yellow-300">Health:</span> 
                  Model: {debugInfo.pose.health.modelLoaded ? '✅' : '❌'} | 
                  Video: {debugInfo.pose.health.videoReady ? '✅' : '❌'} | 
                  Detection: {debugInfo.pose.health.detectionRunning ? '🏃' : '⏹️'}
                </div>
              )}

              {debugInfo.pose?.results && (
                <div>
                  <span className="text-purple-300">Results:</span> 
                  Detected: {debugInfo.pose.results.isDetected ? '✅' : '❌'} | 
                  Confidence: {(debugInfo.pose.results.confidence * 100).toFixed(1)}% | 
                  Points: {debugInfo.pose.results.landmarks?.length || 0}
                </div>
              )}

              {debugInfo.initErrors && debugInfo.initErrors.length > 0 && (
                <div className="mt-2">
                  <span className="text-red-300">Init Errors (last 10):</span>
                  {debugInfo.initErrors.map((error: string, index: number) => (
                    <div key={index} className="ml-2 text-red-200">
                      {error}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-gray-400">
                Last Update: {debugInfo.timestamp}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}