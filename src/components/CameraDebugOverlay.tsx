// src/components/CameraDebugOverlay.tsx
import { useState, useEffect, useCallback } from 'react'
import { Logger } from '../utils/Logger'

interface CameraDebugOverlayProps {
  isVisible: boolean
  onClose: () => void
  poseDetectionStatus: {
    isInitialized: boolean
    isLoading: boolean
    error: string
    poseResults: any
  }
  cameraStatus: {
    isActive: boolean
    error: string | null
    stream: MediaStream | null
  }
  videoElement: HTMLVideoElement | null
  poseStability?: {
    isStable: boolean
    stabilityScore: number
    relevantLandmarks: number[]
    velocityThreshold: number
    currentVelocities: Map<number, number>
  } | null
  onForceCameraStart?: () => void
  onForcePoseInit?: () => void
}

export function CameraDebugOverlay({
  isVisible,
  onClose,
  poseDetectionStatus,
  cameraStatus,
  videoElement,
  poseStability,
  onForceCameraStart,
  onForcePoseInit
}: CameraDebugOverlayProps) {
  const [tfBackend, setTfBackend] = useState<string>('Unknown')
  const [webglInfo, setWebglInfo] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [permissionState, setPermissionState] = useState<string>('Unknown')
  const [cameraConstraints, setCameraConstraints] = useState<any>(null)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [forceCpu, setForceCpu] = useState<boolean>(false)
  const [lowRes, setLowRes] = useState<boolean>(false)
  const [initErrors, setInitErrors] = useState<string[]>([])

  // Add debug logging
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }, [])

  useEffect(() => {
    if (isVisible) {
      addDebugLog('Debug overlay opened')
      // Load flags
      try {
        setForceCpu(localStorage.getItem('pose.forceCpu') === '1')
        setLowRes(localStorage.getItem('pose.lowRes') === '1')
      } catch {}
      // Capture recent init errors if any (populated by the hook)
      try {
        const errs = (window as any).__poseInitErrors
        if (Array.isArray(errs)) setInitErrors(errs as string[])
      } catch {}
      
      // Get TensorFlow.js backend info
      import('@tensorflow/tfjs').then((tf) => {
        try {
          const backend = tf.getBackend()
          setTfBackend(backend)
          addDebugLog(`TF.js backend: ${backend}`)
          
          // Get WebGL info if available
          if (backend === 'webgl') {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl')
            if (gl) {
              setWebglInfo({
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION)
              })
              addDebugLog('WebGL info captured')
            }
          }
        } catch (err) {
          addDebugLog(`TF.js error: ${err instanceof Error ? err.message : 'Unknown'}`)
          Logger.error('Failed to get TF.js info:', err)
        }
      })

      // Get system info
      setSystemInfo({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints
      })

      // Check camera permissions
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' as any }).then((result) => {
          setPermissionState(result.state)
          addDebugLog(`Camera permission: ${result.state}`)
        }).catch(() => {
          setPermissionState('Not supported')
          addDebugLog('Camera permission check not supported')
        })
      }

      // Get camera constraints
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          const constraints = videoTrack.getConstraints()
          setCameraConstraints({ settings, constraints })
          addDebugLog('Camera constraints captured')
        }
      }
    }
  }, [isVisible, addDebugLog, videoElement])

  // Monitor for changes
  useEffect(() => {
    if (poseDetectionStatus.error) {
      addDebugLog(`Pose error: ${poseDetectionStatus.error}`)
    }
    if (cameraStatus.error) {
      addDebugLog(`Camera error: ${cameraStatus.error}`)
    }
    if (poseDetectionStatus.isInitialized) {
      addDebugLog('Pose detection initialized')
    }
    if (cameraStatus.isActive) {
      addDebugLog('Camera activated')
    }
  }, [poseDetectionStatus, cameraStatus, addDebugLog])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-50 px-4 py-3 border-b border-red-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-red-900">🚨 Camera Debug</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded border border-red-300"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </button>
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Tuning Flags */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h3 className="font-semibold text-purple-900 mb-2">🎛️ Tuning</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const next = !forceCpu
                  setForceCpu(next)
                  try { localStorage.setItem('pose.forceCpu', next ? '1' : '0') } catch {}
                  addDebugLog(`Force CPU ${next ? 'ENABLED' : 'DISABLED'}`)
                  onForcePoseInit && onForcePoseInit()
                }}
                className={`px-3 py-2 rounded text-sm ${forceCpu ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-300'}`}
              >
                {forceCpu ? 'CPU: ON' : 'CPU: OFF'}
              </button>
              <button
                onClick={() => {
                  const next = !lowRes
                  setLowRes(next)
                  try { localStorage.setItem('pose.lowRes', next ? '1' : '0') } catch {}
                  addDebugLog(`Low-Res ${next ? 'ENABLED' : 'DISABLED'}`)
                  onForcePoseInit && onForcePoseInit()
                }}
                className={`px-3 py-2 rounded text-sm ${lowRes ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-300'}`}
              >
                {lowRes ? 'Low-Res: ON' : 'Low-Res: OFF'}
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('pose.forceCpu')
                    localStorage.removeItem('pose.lowRes')
                  } catch {}
                  setForceCpu(false)
                  setLowRes(false)
                  addDebugLog('Flags reset')
                  onForcePoseInit && onForcePoseInit()
                }}
                className="px-3 py-2 rounded text-sm bg-white text-purple-700 border border-purple-300"
              >
                Reset Flags
              </button>
            </div>
          </div>

          {/* Critical Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h3 className="font-semibold text-red-900 mb-2">🚨 Critical Issues</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Camera Active:</span>
                <span className={cameraStatus.isActive ? 'text-green-600' : 'text-red-600 font-bold'}>
                  {cameraStatus.isActive ? '✅ Yes' : '❌ NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pose Initialized:</span>
                <span className={poseDetectionStatus.isInitialized ? 'text-green-600' : 'text-red-600 font-bold'}>
                  {poseDetectionStatus.isInitialized ? '✅ Yes' : '❌ NO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Camera Permission:</span>
                <span className={`font-bold ${
                  permissionState === 'granted' ? 'text-green-600' : 
                  permissionState === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {permissionState.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h3 className="font-semibold text-blue-900 mb-2">🔧 Quick Actions</h3>
            <div className="flex gap-2">
              {onForceCameraStart && (
                <button
                  onClick={() => {
                    addDebugLog('Force camera start clicked')
                    onForceCameraStart()
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                >
                  Force Camera
                </button>
              )}
              {onForcePoseInit && (
                <button
                  onClick={() => {
                    addDebugLog('Force pose init clicked')
                    onForcePoseInit()
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                >
                  Force Pose Init
                </button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {(poseDetectionStatus.error || cameraStatus.error) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="font-semibold text-red-900 mb-2">❌ Errors</h3>
              <div className="space-y-2 text-sm">
                {poseDetectionStatus.error && (
                  <div>
                    <span className="font-medium">Pose Detection:</span>
                    <div className="text-red-700 mt-1 break-words">{poseDetectionStatus.error}</div>
                  </div>
                )}
                {cameraStatus.error && (
                  <div>
                    <span className="font-medium">Camera:</span>
                    <div className="text-red-700 mt-1 break-words">{cameraStatus.error}</div>
                  </div>
                )}
                {initErrors.length > 0 && (
                  <div>
                    <span className="font-medium">Init Attempts:</span>
                    <ul className="mt-1 list-disc list-inside text-red-700 space-y-1">
                      {initErrors.slice(-8).map((e, i) => (
                        <li key={i} className="break-words">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expanded Debug Info */}
          {isExpanded && (
            <>
              {/* TensorFlow.js Status */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">🤖 TensorFlow.js</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Backend:</span>
                    <span className={`font-mono ${tfBackend === 'webgl' ? 'text-green-600' : 'text-red-600'}`}>
                      {tfBackend}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Loading:</span>
                    <span className={poseDetectionStatus.isLoading ? 'text-yellow-600' : 'text-gray-600'}>
                      {poseDetectionStatus.isLoading ? '⏳ Loading...' : 'Idle'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Details */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">📹 Camera Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Stream Active:</span>
                    <span className={cameraStatus.stream?.active ? 'text-green-600' : 'text-red-600'}>
                      {cameraStatus.stream?.active ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                  {videoElement && (
                    <>
                      <div className="flex justify-between">
                        <span>Ready State:</span>
                        <span className="font-mono">{videoElement.readyState}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span className="font-mono">
                          {videoElement.videoWidth} × {videoElement.videoHeight}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pose Results */}
              {poseDetectionStatus.poseResults && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h3 className="font-semibold text-gray-900 mb-2">🎯 Pose Results</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Detected:</span>
                      <span className={poseDetectionStatus.poseResults.isDetected ? 'text-green-600' : 'text-red-600'}>
                        {poseDetectionStatus.poseResults.isDetected ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-mono">
                        {Math.round((poseDetectionStatus.poseResults.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Landmarks:</span>
                      <span className="font-mono">
                        {poseDetectionStatus.poseResults.landmarks?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Logs */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h3 className="font-semibold text-gray-900 mb-2">📝 Debug Logs</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {debugLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600 bg-white px-2 py-1 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Copy Debug Info */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                const debugInfo = {
                  timestamp: new Date().toISOString(),
                  tfBackend,
                  webglInfo,
                  poseDetectionStatus,
                  cameraStatus,
                  permissionState,
                  cameraConstraints,
                  systemInfo,
                  debugLogs
                }
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                  .then(() => {
                    addDebugLog('Debug info copied to clipboard')
                    alert('Debug info copied!')
                  })
                  .catch(() => {
                    addDebugLog('Failed to copy debug info')
                    alert('Failed to copy debug info')
                  })
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded text-sm hover:bg-gray-700"
            >
              Copy Debug Info
            </button>
            <button
              onClick={() => {
                addDebugLog('Manual refresh triggered')
                window.location.reload()
              }}
              className="flex-1 bg-orange-600 text-white py-2 px-4 rounded text-sm hover:bg-orange-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
