import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraState {
  isActive: boolean
  isLoading: boolean
  error: string | null
  stream: MediaStream | null
}

interface CameraConstraints {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
}

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isLoading: false,
    error: null,
    stream: null
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Start camera with specific constraints
  const startCamera = useCallback(async (constraints: CameraConstraints = {}) => {
    setCameraState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser')
      }

      // Default constraints optimized for mobile with fallback
      const videoConstraints = {
        width: constraints.width || { ideal: 640, max: 1280 },
        height: constraints.height || { ideal: 480, max: 720 },
        facingMode: constraints.facingMode || 'user'
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      })

      // Store stream reference for cleanup
      streamRef.current = stream

      // Attach stream to video element with better error handling
      if (videoRef.current) {
        const video = videoRef.current
        
        // Add debugging
        console.log('Stream attached to video element:', stream)
        console.log('Video tracks:', stream.getVideoTracks())
        console.log('Video element:', video)
        
        // Set up event listeners before attaching stream
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight)
        }
        
        video.oncanplay = () => {
          console.log('Video can start playing')
          video.play().catch(error => {
            console.error('Failed to play video:', error)
          })
        }
        
        video.onerror = (error) => {
          console.error('Video element error:', error)
        }
        
        // Attach stream
        video.srcObject = stream
        
        // Force load metadata
        video.load()
      }

      setCameraState({
        isActive: true,
        isLoading: false,
        error: null,
        stream
      })

      return stream
    } catch (error) {
      let errorMessage = 'Failed to access camera'
      
      if (error instanceof Error) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage = 'Camera permission denied. Please allow camera access.'
            break
          case 'NotFoundError':
            errorMessage = 'No camera found on this device'
            break
          case 'NotReadableError':
            errorMessage = 'Camera is already in use by another application'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints not supported'
            break
          default:
            errorMessage = error.message
        }
      }

      setCameraState({
        isActive: false,
        isLoading: false,
        error: errorMessage,
        stream: null
      })

      throw new Error(errorMessage)
    }
  }, [])

  // Stop camera and cleanup
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraState({
      isActive: false,
      isLoading: false,
      error: null,
      stream: null
    })
  }, [])

  // Switch between front and back camera
  const switchCamera = useCallback(async () => {
    if (!cameraState.isActive) return

    const currentFacingMode = cameraState.stream
      ?.getVideoTracks()[0]
      ?.getSettings()?.facingMode

    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    
    // Stop current camera
    stopCamera()
    
    // Start with new facing mode
    await startCamera({ facingMode: newFacingMode })
  }, [cameraState.isActive, cameraState.stream, stopCamera, startCamera])

  // Get current video track settings
  const getCameraInfo = useCallback(() => {
    if (!cameraState.stream) return null

    const videoTrack = cameraState.stream.getVideoTracks()[0]
    return videoTrack ? videoTrack.getSettings() : null
  }, [cameraState.stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    // State
    isActive: cameraState.isActive,
    isLoading: cameraState.isLoading,
    error: cameraState.error,
    stream: cameraState.stream,
    
    // Refs
    videoRef,
    
    // Actions
    startCamera,
    stopCamera,
    switchCamera,
    getCameraInfo
  }
}