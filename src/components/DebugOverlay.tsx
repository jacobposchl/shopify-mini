// src/components/DebugOverlay.tsx
import React, { useState, useEffect } from 'react'
import { Logger } from '../utils/Logger'

interface DebugOverlayProps {
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
}

export function DebugOverlay({
  isVisible,
  onClose,
  poseDetectionStatus,
  cameraStatus,
  videoElement
}: DebugOverlayProps) {
  const [tfBackend, setTfBackend] = useState<string>('Unknown')
  const [webglInfo, setWebglInfo] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)

  useEffect(() => {
    if (isVisible) {
      // Get TensorFlow.js backend info
      import('@tensorflow/tfjs').then((tf) => {
        try {
          const backend = tf.getBackend()
          setTfBackend(backend)
          
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
            }
          }
        } catch (err) {
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
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Debug Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* TensorFlow.js Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">TensorFlow.js Status</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Backend:</span>
                <span className={`font-mono ${tfBackend === 'webgl' ? 'text-green-600' : 'text-red-600'}`}>
                  {tfBackend}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Model Initialized:</span>
                <span className={poseDetectionStatus.isInitialized ? 'text-green-600' : 'text-red-600'}>
                  {poseDetectionStatus.isInitialized ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Model Loading:</span>
                <span className={poseDetectionStatus.isLoading ? 'text-yellow-600' : 'text-gray-600'}>
                  {poseDetectionStatus.isLoading ? '⏳ Loading...' : 'Idle'}
                </span>
              </div>
              {poseDetectionStatus.error && (
                <div className="flex justify-between">
                  <span>Error:</span>
                  <span className="text-red-600 text-sm max-w-xs text-right">
                    {poseDetectionStatus.error}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WebGL Information */}
          {webglInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">WebGL Capabilities</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Max Texture Size:</span>
                  <span className="font-mono">{webglInfo.maxTextureSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Viewport:</span>
                  <span className="font-mono">{webglInfo.maxViewportDims[0]} × {webglInfo.maxViewportDims[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Renderbuffer:</span>
                  <span className="font-mono">{webglInfo.maxRenderbufferSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendor:</span>
                  <span className="font-mono text-sm">{webglInfo.vendor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Renderer:</span>
                  <span className="font-mono text-sm">{webglInfo.renderer}</span>
                </div>
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono text-sm">{webglInfo.version}</span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Camera Status</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Camera Active:</span>
                <span className={cameraStatus.isActive ? 'text-green-600' : 'text-red-600'}>
                  {cameraStatus.isActive ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stream Available:</span>
                <span className={cameraStatus.stream ? 'text-green-600' : 'text-red-600'}>
                  {cameraStatus.stream ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Stream Active:</span>
                <span className={cameraStatus.stream?.active ? 'text-green-600' : 'text-red-600'}>
                  {cameraStatus.stream?.active ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              {videoElement && (
                <>
                  <div className="flex justify-between">
                    <span>Video Ready State:</span>
                    <span className="font-mono">{videoElement.readyState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Video Dimensions:</span>
                    <span className="font-mono">
                      {videoElement.videoWidth} × {videoElement.videoHeight}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Video Playing:</span>
                    <span className={!videoElement.paused ? 'text-green-600' : 'text-red-600'}>
                      {!videoElement.paused ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>
                </>
              )}
              {cameraStatus.error && (
                <div className="flex justify-between">
                  <span>Camera Error:</span>
                  <span className="text-red-600 text-sm max-w-xs text-right">
                    {cameraStatus.error}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pose Detection Results */}
          {poseDetectionStatus.poseResults && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Pose Detection Results</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Pose Detected:</span>
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

          {/* System Information */}
          {systemInfo && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-mono text-sm">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span className="font-mono text-sm">{systemInfo.language}</span>
                </div>
                <div className="flex justify-between">
                  <span>Online:</span>
                  <span className={systemInfo.onLine ? 'text-green-600' : 'text-red-600'}>
                    {systemInfo.onLine ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                {systemInfo.deviceMemory && (
                  <div className="flex justify-between">
                    <span>Device Memory:</span>
                    <span className="font-mono">{systemInfo.deviceMemory} GB</span>
                  </div>
                )}
                {systemInfo.hardwareConcurrency && (
                  <div className="flex justify-between">
                    <span>CPU Cores:</span>
                    <span className="font-mono">{systemInfo.hardwareConcurrency}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Touch Points:</span>
                  <span className="font-mono">{systemInfo.maxTouchPoints}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={async () => {
                Logger.info('Debug: Testing TensorFlow.js initialization')
                try {
                  const tf = await import('@tensorflow/tfjs')
                  await tf.setBackend('webgl')
                  await tf.ready()
                  
                  const posenet = await import('@tensorflow-models/posenet')
                  const model = await posenet.load({
                    architecture: 'MobileNetV1',
                    outputStride: 16,
                    inputResolution: { width: 257, height: 257 },
                    multiplier: 0.5,
                    quantBytes: 2
                  })
                  
                  alert(`✅ TensorFlow.js test successful!\nBackend: ${tf.getBackend()}\nModel loaded: ${!!model}`)
                } catch (err) {
                  alert(`❌ TensorFlow.js test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
                }
              }}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Test TF.js
            </button>
            <button
              onClick={() => {
                Logger.info('Debug: Copy debug info to clipboard')
                const debugInfo = {
                  tfBackend,
                  webglInfo,
                  poseDetectionStatus,
                  cameraStatus,
                  systemInfo,
                  timestamp: new Date().toISOString()
                }
                navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
                  .then(() => alert('Debug info copied to clipboard'))
                  .catch(() => alert('Failed to copy debug info'))
              }}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            >
              Copy Debug Info
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}