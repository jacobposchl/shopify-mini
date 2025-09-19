import { useState, useCallback, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import '@tensorflow/tfjs-backend-cpu'
import * as posenet from '@tensorflow-models/posenet'

interface PoseResults {
  landmarks: Array<{
    x: number
    y: number
    confidence: number
  }>
  isDetected: boolean
  confidence: number
}

// Add pose stability tracking
interface PoseStability {
  isStable: boolean
  velocityThreshold: number
  relevantLandmarks: number[]
  currentVelocities: Map<number, number>
  stabilityScore: number
}

export const usePoseDetectionTF = (stabilityThreshold: number = 200) => {
  const [poseResults, setPoseResults] = useState<PoseResults | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [poseStability, setPoseStability] = useState<PoseStability | null>(null)
  const [positionFeedback, setPositionFeedback] = useState<any>(null)

  // Use 'any' type for now to avoid type conflicts, or we can use the actual return type from posenet.load()
  const modelRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const isDetectionRunningRef = useRef(false)
  const lastDetectionTimeRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const initializationAttemptsRef = useRef(0)
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastInitErrorsRef = useRef<string[]>([])
  
  // Add temporal smoothing refs
  const landmarkHistoryRef = useRef<Array<Array<{ x: number; y: number; confidence: number }>>>([[]])
  const smoothingWindowSize = 4 // Reduced from 5 for faster response
  
  // Performance monitoring ref
  const lastPerformanceLogRef = useRef<number>(0)
  
  // Add pose stability tracking refs
  const previousLandmarksRef = useRef<Array<{ x: number; y: number; confidence: number }> | null>(null)
  const lastStabilityUpdateRef = useRef<number>(0)
  const selectedStyleIdRef = useRef<string | null>(null)
  const stabilityStartTimeRef = useRef<number>(0)
  const consecutiveStableFramesRef = useRef<number>(0)

  // Temporal smoothing function for more stable landmarks
  const smoothLandmarks = useCallback((newLandmarks: Array<{ x: number; y: number; confidence: number }>) => {
    return newLandmarks.map((landmark, idx) => {
      // Initialize history array for this landmark if it doesn't exist
      if (!landmarkHistoryRef.current[idx]) {
        landmarkHistoryRef.current[idx] = []
      }
      
      const history = landmarkHistoryRef.current[idx]
      history.push(landmark)
      
      // Keep only the last N frames
      if (history.length > smoothingWindowSize) {
        history.shift()
      }
      
      // Calculate weighted average (more weight on recent frames for MobileNetV2)
      const weights = [0.5, 0.3, 0.15, 0.05] // More weight on recent frames
      let weightedX = 0, weightedY = 0, maxConfidence = 0
      let totalWeight = 0
      
      for (let i = 0; i < history.length; i++) {
        const weight = weights[i] || 0.05
        weightedX += history[history.length - 1 - i].x * weight
        weightedY += history[history.length - 1 - i].y * weight
        maxConfidence = Math.max(maxConfidence, history[history.length - 1 - i].confidence)
        totalWeight += weight
      }
      
      return {
        x: weightedX / totalWeight,
        y: weightedY / totalWeight,
        confidence: maxConfidence
      }
    })
  }, [])

  // Function to get required stable frames based on threshold
  const getRequiredStableFrames = useCallback((threshold: number): number => {
    // Lower threshold = more strict = require more stable frames
    // Higher threshold = more lenient = require fewer stable frames
    if (threshold <= 100) return 20      // More lenient: 0.7 seconds
    if (threshold <= 200) return 15     // More lenient: 0.5 seconds
    if (threshold <= 300) return 10     // More lenient: 0.3 seconds
    return 8                            // Very lenient: 0.3 seconds
  }, [])

  // Function to get relevant landmarks for clothing type
  const getRelevantLandmarks = useCallback((styleId: string): number[] => {
    // Simple top vs bottom logic - same as in Measurements component
    if (!styleId) return [0, 5, 6, 11, 12] // default to nose, shoulders, and hips
    
    const styleIdLower = styleId.toLowerCase()
    
    // Top items (shirts, jackets, sweaters, etc.)
    const topKeywords = [
      'shirt', 't-shirt', 'tshirt', 'top', 'blouse', 'polo', 'sweater', 'hoodie', 'jacket', 'coat', 'blazer', 'vest', 'tank', 'crop'
    ]
    
    // Bottom items (pants, shorts, skirts, etc.)
    const bottomKeywords = [
      'pants', 'jeans', 'trousers', 'slacks', 'shorts', 'skirt', 'leggings', 'joggers', 'sweatpants'
    ]
    
    // Check if it's a top item
    if (topKeywords.some(keyword => styleIdLower.includes(keyword))) {
      return [5, 6, 7, 8, 9, 10, 11, 12] // shoulders, elbows, wrists, hips (waist area)
    }
    
    // Check if it's a bottom item
    if (bottomKeywords.some(keyword => styleIdLower.includes(keyword))) {
      return [0, 11, 12, 13, 14, 15, 16] // nose, hips, knees, ankles
    }
    
    // Default to nose, shoulders, and hips
    return [0, 5, 6, 11, 12]
  }, [])

  // Function to calculate pose stability with configurable threshold
  const calculatePoseStability = useCallback((currentLandmarks: Array<{ x: number; y: number; confidence: number }>, styleId: string, stabilityThreshold: number = 200, positionFeedback?: any): PoseStability => {
    const relevantLandmarks = getRelevantLandmarks(styleId)
    const currentVelocities = new Map<number, number>()
    let totalVelocity = 0
    let validLandmarks = 0
    const now = Date.now()

    if (previousLandmarksRef.current) {
      relevantLandmarks.forEach(index => {
        if (currentLandmarks[index] && previousLandmarksRef.current![index]) {
          const current = currentLandmarks[index]
          const previous = previousLandmarksRef.current![index]
          
          // Calculate velocity (pixels per second)
          // Use a more stable calculation by averaging over multiple frames
          const dx = current.x - previous.x
          const dy = current.y - previous.y
          const velocity = Math.sqrt(dx * dx + dy * dy)
          
          // Apply confidence weighting to reduce noise
          const confidence = current.confidence
          const weightedVelocity = velocity * confidence
          
          currentVelocities.set(index, velocity)
          totalVelocity += weightedVelocity
          validLandmarks++
        }
      })
    }

    const avgVelocity = validLandmarks > 0 ? totalVelocity / validLandmarks : 0
    
    // Check if current frame is stable with some hysteresis
    // More lenient threshold since we're tracking more comprehensive landmarks
    const isCurrentFrameStable = avgVelocity <= stabilityThreshold && validLandmarks >= relevantLandmarks.length * 0.6
    
    // Only consider frame stable if user is properly positioned
    const isProperlyPositioned = !positionFeedback || positionFeedback.feedbackType === 'success'
    const isCurrentFrameStableAndPositioned = isCurrentFrameStable && isProperlyPositioned
    
    // Update stability tracking with hysteresis to prevent flickering
    if (isCurrentFrameStableAndPositioned) {
      if (consecutiveStableFramesRef.current === 0) {
        // Start stability timer
        stabilityStartTimeRef.current = now
      }
      consecutiveStableFramesRef.current++
    } else {
      // Only reset if we're significantly unstable (add hysteresis)
      if (avgVelocity > stabilityThreshold * 1.5 || !isProperlyPositioned) {
        consecutiveStableFramesRef.current = 0
        stabilityStartTimeRef.current = 0
      }
    }

    // Get required stable frames based on threshold
    const requiredFrames = getRequiredStableFrames(stabilityThreshold)
    
    // Calculate stability score based on consecutive stable frames
    const stabilityScore = Math.min(consecutiveStableFramesRef.current / requiredFrames, 1.0)
    
    // Consider pose stable if we have enough consecutive stable frames AND user is properly positioned
    const isStable = consecutiveStableFramesRef.current >= requiredFrames && isProperlyPositioned

    return {
      isStable,
      velocityThreshold: stabilityThreshold,
      relevantLandmarks,
      currentVelocities,
      stabilityScore
    }
  }, [getRelevantLandmarks])

  // Function to update pose stability
  const updatePoseStability = useCallback((landmarks: Array<{ x: number; y: number; confidence: number }>, styleId: string, stabilityThreshold: number = 200, positionFeedback?: any) => {
    if (landmarks.length === 0) {
      setPoseStability(null)
      return
    }

    // Use default style if none provided
    const effectiveStyleId = styleId || 'shirts' // Default to shirts if no style selected
    
    const stability = calculatePoseStability(landmarks, effectiveStyleId, stabilityThreshold, positionFeedback)
    setPoseStability(stability)
    
    // Update previous landmarks for next frame
    previousLandmarksRef.current = landmarks
    lastStabilityUpdateRef.current = Date.now()
  }, [calculatePoseStability])

  // Function to set the selected style for stability tracking
  const setSelectedStyle = useCallback((styleId: string) => {
    selectedStyleIdRef.current = styleId
    // Reset stability when style changes
    setPoseStability(null)
    previousLandmarksRef.current = null
    consecutiveStableFramesRef.current = 0
    stabilityStartTimeRef.current = 0
  }, [])

  // Function to reset pose stability (called when pose becomes unstable)
  const resetPoseStability = useCallback(() => {
    setPoseStability(null)
    previousLandmarksRef.current = null
    lastStabilityUpdateRef.current = 0
    consecutiveStableFramesRef.current = 0
    stabilityStartTimeRef.current = 0
  }, [])

  const initializePose = useCallback(async (video: HTMLVideoElement) => {
    if (isInitialized && modelRef.current) {
      console.log('✅ TF.js: Already initialized, updating video reference')
      videoRef.current = video
      return
    }

    try {
      setIsLoading(true)
      setError('')
      videoRef.current = video
      initializationAttemptsRef.current++

      console.log('🔧 TF.js: Starting initialization... (attempt', initializationAttemptsRef.current, ')')
      try {
        ;(window as any).__tfVersion = tf?.version_core
      } catch {}
      console.log('ℹ️ TF.js: version_core =', (tf as any)?.version_core)
      try {
        lastInitErrorsRef.current.push(`TFJS version_core: ${(tf as any)?.version_core || 'unknown'}`)
        try { lastInitErrorsRef.current.push(`PoseNet version: ${(posenet as any)?.version || 'unknown'}`) } catch {}
        ;(window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20)
      } catch {}
      // Read runtime tuning flags
      const forceCpu = (() => { try { return localStorage.getItem('pose.forceCpu') === '1' } catch { return false } })()
      const lowRes = (() => { try { return localStorage.getItem('pose.lowRes') === '1' } catch { return false } })()
      const modelBaseUrl = (() => { try { return localStorage.getItem('pose.modelBaseUrl') || '' } catch { return '' } })()
      
      // CSP Detection Helper
      const checkCSP = () => {
        try {
          const metaTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
          const cspHeaders = Array.from(metaTags).map(tag => (tag as HTMLMetaElement).content)
          if (cspHeaders.length > 0) {
            lastInitErrorsRef.current.push(`🔍 Found CSP meta tags: ${cspHeaders.length}`)
            cspHeaders.forEach(csp => {
              if (csp.includes('connect-src')) {
                const connectSrc = csp.match(/connect-src[^;]*/)?.[0] || ''
                lastInitErrorsRef.current.push(`🔍 CSP connect-src: ${connectSrc}`)
                if (!connectSrc.includes('storage.googleapis.com') && !connectSrc.includes('*')) {
                  lastInitErrorsRef.current.push(`⚠️ CSP Issue: storage.googleapis.com NOT in connect-src`)
                }
              }
            })
          } else {
            lastInitErrorsRef.current.push(`🔍 No CSP meta tags found (may be in HTTP headers)`)
          }
        } catch (e) {
          lastInitErrorsRef.current.push(`🔍 CSP check failed: ${e}`)
        }
      }
      
      checkCSP()
      
      // Test network access to googleapis.com with a simple request
      try {
        const testUrl = 'https://storage.googleapis.com/tfjs-models/savedmodel/posenet/mobilenet/float/100/model-stride16.json'
        const testResp = await fetch(testUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' })
        if (testResp.ok) {
          const msg = `🟢 Network Test: googleapis.com accessible (${testResp.status})`
          lastInitErrorsRef.current.push(msg)
          console.log('CSP Debug:', msg)
        } else {
          const msg = `🔴 Network Test: googleapis.com returned ${testResp.status} ${testResp.statusText}`
          lastInitErrorsRef.current.push(msg)
          console.error('CSP Debug:', msg)
        }
      } catch (testErr: any) {
        const testMsg = testErr?.message || String(testErr)
        const msg1 = `🔴 Network Test Failed: ${testMsg}`
        lastInitErrorsRef.current.push(msg1)
        console.error('CSP Debug:', msg1)
        if (testMsg.includes('Failed to fetch')) {
          const msg2 = `🚨 CONFIRMED: CSP or Network blocks googleapis.com`
          lastInitErrorsRef.current.push(msg2)
          console.error('CSP Debug:', msg2)
        }
      }
      
      if (modelBaseUrl) {
        lastInitErrorsRef.current.push(`Using custom PoseNet model base URL: ${modelBaseUrl}`)
        try { (window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20) } catch {}
      }

      const buildModelUrl = (base: string, cfg: any) => {
        const precision = cfg.quantBytes === 4 ? 'float' : cfg.quantBytes === 2 ? 'quant2' : 'quant1'
        const mult = typeof cfg.multiplier === 'number' ? String(Math.round(cfg.multiplier * 100)).padStart(3, '0') : '075'
        const stride = cfg.outputStride
        return `${base.replace(/\/$/, '')}/mobilenet/${precision}/${mult}/model-stride${stride}.json`
      }

      // Progressive fallback configurations (higher -> lower fidelity)
      // Use posenet.InputResolution for typing
      const MODEL_FALLBACK_CHAIN: Array<posenet.InputResolution & posenet.ModelConfig> = [
        {
          architecture: 'MobileNetV1',
          outputStride: 8,
          inputResolution: lowRes ? { width: 257, height: 257 } : { width: 353, height: 353 },
          multiplier: 0.75,
          quantBytes: 4,
        } as any,
        {
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: lowRes ? { width: 193, height: 193 } : { width: 257, height: 257 },
          multiplier: 0.75,
          quantBytes: 4,
        } as any,
        {
          architecture: 'MobileNetV1',
          outputStride: 16,
          inputResolution: lowRes ? { width: 193, height: 193 } : { width: 257, height: 257 },
          multiplier: 0.50,
          quantBytes: 2,
        } as any,
      ]

      let loadSucceeded = false
      let selectedConfigIndex = -1

      // Set a timeout for the entire initialization process
      const initPromise = new Promise<void>(async (resolve, reject) => {
        try {
          // Force TensorFlow.js backend based on tuning flag
          console.log('📦 TF.js: Setting backend...', { forceCpu })
          await tf.setBackend(forceCpu ? 'cpu' : 'webgl')
          await tf.ready()
          
          const backend = tf.getBackend()
          console.log('📦 TF.js: Backend ready:', backend)
          try {
            lastInitErrorsRef.current.push(`TFJS backend ready: ${backend}`)
            ;(window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20)
          } catch {}

          // Verify WebGL is working
          if (!forceCpu && backend !== 'webgl') {
            throw new Error(`Expected WebGL backend, got ${backend}`)
          }

          // Check WebGL support and memory
          const canvas = document.createElement('canvas')
          const gl = forceCpu ? null : (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
          if (!forceCpu && !gl) {
            throw new Error('WebGL not supported - required for pose detection')
          }

          // Check WebGL memory limits
          if (gl) {
            const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
            const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
            console.log('🔍 WebGL capabilities:', {
              maxTextureSize,
              maxViewportDims: `${(maxViewportDims as number[])[0]}x${(maxViewportDims as number[])[1]}`
            })
          }

          // Attempt progressive model loading
          for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
            const cfg = MODEL_FALLBACK_CHAIN[i]
            console.log(`📥 TF.js: Loading PoseNet config #${i + 1}/${MODEL_FALLBACK_CHAIN.length}`, cfg)
            try {
              const loadCfg: any = { ...(cfg as any) }
              
              // Enhanced pre-load debugging
              lastInitErrorsRef.current.push(`📋 Config ${i} Details:`)
              lastInitErrorsRef.current.push(`  Architecture: ${cfg.architecture}`)
              lastInitErrorsRef.current.push(`  OutputStride: ${cfg.outputStride}`)
              lastInitErrorsRef.current.push(`  Multiplier: ${cfg.multiplier}`)
              lastInitErrorsRef.current.push(`  QuantBytes: ${cfg.quantBytes}`)
              lastInitErrorsRef.current.push(`  InputRes: ${JSON.stringify(cfg.inputResolution)}`)
              
              // Only add custom modelUrl if user explicitly set a base URL
              if (modelBaseUrl) {
                const effectiveUrl = buildModelUrl(modelBaseUrl, cfg)
                loadCfg.modelUrl = effectiveUrl
                lastInitErrorsRef.current.push(`📍 Using custom modelUrl: ${effectiveUrl}`)
              } else {
                lastInitErrorsRef.current.push(`📍 Using PoseNet default URLs for config ${i}`)
                lastInitErrorsRef.current.push(`📍 Will auto-download from: storage.googleapis.com/tfjs-models/`)
              }
              
              lastInitErrorsRef.current.push(`📦 Final loadCfg object:`)
              lastInitErrorsRef.current.push(`${JSON.stringify(loadCfg, null, 2).slice(0, 300)}...`)
              
              // Only do HEAD check if we're using custom URL
              if (modelBaseUrl) {
                const effectiveUrl = buildModelUrl(modelBaseUrl, cfg)
                try {
                  const headResp = await fetch(effectiveUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' })
                  if (!headResp.ok) {
                    lastInitErrorsRef.current.push(`HEAD ${effectiveUrl} -> ${headResp.status} ${headResp.statusText}`)
                  } else {
                    lastInitErrorsRef.current.push(`HEAD ${effectiveUrl} -> ${headResp.status} OK`)
                  }
                } catch (headErr: any) {
                  // Detailed CSP/CORS debugging
                  const errMsg = headErr?.message || String(headErr)
                  lastInitErrorsRef.current.push(`HEAD ${effectiveUrl} failed: ${errMsg}`)
                  
                  // Check for specific CSP/CORS indicators
                  if (errMsg.includes('Failed to fetch')) {
                    lastInitErrorsRef.current.push(`🚨 CSP Issue: "Failed to fetch" usually means CSP connect-src blocks ${new URL(effectiveUrl).hostname}`)
                  }
                  if (errMsg.includes('CORS')) {
                    lastInitErrorsRef.current.push(`🚨 CORS Issue: Cross-origin request blocked for ${effectiveUrl}`)
                  }
                  if (errMsg.includes('NetworkError')) {
                    lastInitErrorsRef.current.push(`🚨 Network Issue: Could be CSP, ad-blocker, or network connectivity`)
                  }
                }
              }
              
              try { (window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20) } catch {}
              
              // Enhanced posenet.load() debugging
              lastInitErrorsRef.current.push(`🚀 CALLING posenet.load() with config ${i}...`)
              lastInitErrorsRef.current.push(`⏰ Timestamp: ${new Date().toISOString()}`)
              
              const loadStartTime = performance.now()
              let model: any
              
              try {
                lastInitErrorsRef.current.push(`🔄 posenet.load() starting...`)
                model = await posenet.load(loadCfg)
                const loadEndTime = performance.now()
                lastInitErrorsRef.current.push(`✅ posenet.load() completed in ${(loadEndTime - loadStartTime).toFixed(2)}ms`)
                lastInitErrorsRef.current.push(`📊 Model object type: ${typeof model}`)
                lastInitErrorsRef.current.push(`📊 Model constructor: ${model?.constructor?.name || 'unknown'}`)
                lastInitErrorsRef.current.push(`📊 Has estimateSinglePose: ${typeof model?.estimateSinglePose}`)
                
                if (model) {
                  // Try to get more info about the model
                  const modelKeys = Object.keys(model).slice(0, 10) // First 10 keys
                  lastInitErrorsRef.current.push(`📊 Model keys: ${modelKeys.join(', ')}`)
                }
              } catch (poseLoadErr) {
                const loadEndTime = performance.now()
                const poseErrMsg = poseLoadErr instanceof Error ? poseLoadErr.message : String(poseLoadErr)
                const poseErrName = poseLoadErr instanceof Error ? poseLoadErr.name : 'Unknown'
                const poseErrStack = poseLoadErr instanceof Error ? poseLoadErr.stack?.slice(0, 500) : 'N/A'
                
                lastInitErrorsRef.current.push(`❌ posenet.load() FAILED after ${(loadEndTime - loadStartTime).toFixed(2)}ms`)
                lastInitErrorsRef.current.push(`❌ PoseNet Error Name: ${poseErrName}`)
                lastInitErrorsRef.current.push(`❌ PoseNet Error Message: ${poseErrMsg}`)
                lastInitErrorsRef.current.push(`❌ PoseNet Error Type: ${typeof poseLoadErr}`)
                lastInitErrorsRef.current.push(`❌ PoseNet Error Constructor: ${poseLoadErr?.constructor?.name || 'unknown'}`)
                lastInitErrorsRef.current.push(`❌ PoseNet Stack Trace: ${poseErrStack}`)
                
                // Re-throw to be caught by the outer catch
                throw poseLoadErr
              }
              
              if (!model || typeof (model as any).estimateSinglePose !== 'function') {
                lastInitErrorsRef.current.push(`❌ Model validation failed:`)
                lastInitErrorsRef.current.push(`  Model exists: ${!!model}`)
                lastInitErrorsRef.current.push(`  estimateSinglePose type: ${typeof model?.estimateSinglePose}`)
                throw new Error('Loaded object missing estimateSinglePose')
              }
              
              lastInitErrorsRef.current.push(`✅ Model validation passed - storing in modelRef`)
              modelRef.current = model
              loadSucceeded = true
              selectedConfigIndex = i
              console.log('✅ TF.js: PoseNet model loaded with fallback index', i)
              ;(window as any).__poseSelectedConfig = { index: i, backend: tf.getBackend(), lowRes, forceCpu }
              break
            } catch (cfgErr) {
              const msg = cfgErr instanceof Error ? cfgErr.message : String(cfgErr)
              console.error('🔥 LOAD FAILED DEBUG:', { index: i, msg, cfgErr })
              
              // ENHANCED DEBUG INFO FOR OVERLAY
              const errorName = cfgErr instanceof Error ? cfgErr.name : 'Unknown'
              const errorStack = cfgErr instanceof Error ? cfgErr.stack?.slice(0, 200) + '...' : 'N/A'
              
              lastInitErrorsRef.current.push(`🔥 LOAD FAILED: Config ${i} (${cfg.architecture}, stride=${cfg.outputStride}, mult=${cfg.multiplier})`)
              lastInitErrorsRef.current.push(`🔥 ERROR: ${errorName}: ${msg}`)
              lastInitErrorsRef.current.push(`🔥 ERROR TYPE: ${typeof cfgErr} (${cfgErr?.constructor?.name || 'unknown'})`)
              lastInitErrorsRef.current.push(`🔥 STACK: ${errorStack}`)
              
              // Check if we're using custom or default URLs
              if (modelBaseUrl) {
                const effectiveUrl = buildModelUrl(modelBaseUrl, cfg)
                lastInitErrorsRef.current.push(`🔥 CUSTOM URL: ${effectiveUrl}`)
              } else {
                lastInitErrorsRef.current.push(`🔥 DEFAULT POSENET URLs (no custom modelUrl set)`)
              }
              
              // Enhanced diagnosis for common "load failed" issues
              if (msg.includes('load failed') && msg.length < 20) {
                lastInitErrorsRef.current.push(`🚨 GENERIC LOAD FAILURE: This is a very generic PoseNet error`)
                lastInitErrorsRef.current.push(`🚨 COMMON CAUSES: Version incompatibility, CSP blocking, URL issues, or memory`)
                lastInitErrorsRef.current.push(`🚨 DEBUG STEPS:`)
                lastInitErrorsRef.current.push(`  1. Check if network requests are blocked (CSP)`)
                lastInitErrorsRef.current.push(`  2. Try with custom modelUrl removed`)
                lastInitErrorsRef.current.push(`  3. Try CPU backend (pose.forceCpu=1)`)
                lastInitErrorsRef.current.push(`  4. Check TFJS & PoseNet version compatibility`)
              }
              
              if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                lastInitErrorsRef.current.push(`� CSP ISSUE DETECTED: Failed to fetch model`)
                lastInitErrorsRef.current.push(`🚨 FIX: Add 'connect-src https://storage.googleapis.com' to CSP`)
              }
              if (msg.includes('Loading failed') || msg.includes('Not found')) {
                lastInitErrorsRef.current.push(`� MODEL NOT FOUND: URL may be wrong`)
              }
              if (msg.includes('CORS')) {
                lastInitErrorsRef.current.push(`🚨 CORS BLOCKED: Cross-origin issue`)
              }
              
              // FORCE OVERLAY UPDATE
              try { (window as any).__poseInitErrors = [...lastInitErrorsRef.current] } catch {}
              
              lastInitErrorsRef.current.push(`WebGL config ${i} failed: ${msg}`)
              
              console.warn('⚠️ TF.js: Config load failed, trying next', { index: i, error: msg })
            }
          }

          // If all WebGL configs failed, attempt CPU fallback with simplest config
          if (!loadSucceeded) {
            let cpuEffectiveUrl = ''
            try {
              console.warn('⚠️ TF.js: All WebGL configs failed, attempting CPU backend fallback...')
              await tf.setBackend('cpu')
              await tf.ready()
              const cpuCfg = {
                architecture: 'MobileNetV1',
                outputStride: 16,
                inputResolution: lowRes ? { width: 193, height: 193 } : { width: 257, height: 257 },
                multiplier: 0.50,
                quantBytes: 2,
              }
              const cpuLoadCfg: any = { ...(cpuCfg as any) }
              
              // Only add custom modelUrl for CPU if user explicitly set base URL
              if (modelBaseUrl) {
                cpuEffectiveUrl = buildModelUrl(modelBaseUrl, cpuCfg)
                cpuLoadCfg.modelUrl = cpuEffectiveUrl
                lastInitErrorsRef.current.push(`Using custom CPU modelUrl: ${cpuEffectiveUrl}`)
              } else {
                lastInitErrorsRef.current.push(`Using PoseNet default URLs for CPU fallback`)
              }
              
              // Only do HEAD check if using custom URL
              if (modelBaseUrl) {
                try {
                  const headResp = await fetch(cpuEffectiveUrl, { method: 'HEAD', mode: 'cors', cache: 'no-cache' })
                  if (!headResp.ok) {
                    lastInitErrorsRef.current.push(`HEAD ${cpuEffectiveUrl} -> ${headResp.status} ${headResp.statusText}`)
                  } else {
                    lastInitErrorsRef.current.push(`HEAD ${cpuEffectiveUrl} -> ${headResp.status} OK`)
                  }
                } catch (headErr: any) {
                  // Detailed CSP/CORS debugging for CPU fallback
                  const errMsg = headErr?.message || String(headErr)
                  lastInitErrorsRef.current.push(`HEAD ${cpuEffectiveUrl} failed: ${errMsg}`)
                  
                  // Check for specific CSP/CORS indicators
                  if (errMsg.includes('Failed to fetch')) {
                    lastInitErrorsRef.current.push(`🚨 CSP Issue: "Failed to fetch" usually means CSP connect-src blocks ${new URL(cpuEffectiveUrl).hostname}`)
                  }
                  if (errMsg.includes('CORS')) {
                    lastInitErrorsRef.current.push(`🚨 CORS Issue: Cross-origin request blocked for ${cpuEffectiveUrl}`)
                  }
                  if (errMsg.includes('NetworkError')) {
                    lastInitErrorsRef.current.push(`🚨 Network Issue: Could be CSP, ad-blocker, or network connectivity`)
                  }
                }
              }
              try { (window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20) } catch {}
              const cpuModel = await posenet.load(cpuLoadCfg)
              if (!cpuModel || typeof (cpuModel as any).estimateSinglePose !== 'function') {
                throw new Error('CPU fallback model invalid')
              }
              modelRef.current = cpuModel
              loadSucceeded = true
              selectedConfigIndex = MODEL_FALLBACK_CHAIN.length
              console.log('✅ TF.js: CPU backend PoseNet model loaded')
              ;(window as any).__poseSelectedConfig = { index: 'cpu', backend: tf.getBackend(), lowRes, forceCpu }
            } catch (cpuErr) {
              const msg = cpuErr instanceof Error ? cpuErr.message : String(cpuErr)
              const errorName = cpuErr instanceof Error ? cpuErr.name : 'Unknown'
              lastInitErrorsRef.current.push(`🔥 CPU FALLBACK FAILED: ${errorName}: ${msg}`)
              
              // Enhanced CSP/Network error detection for CPU fallback
              if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                lastInitErrorsRef.current.push(`🚨 CSP Issue Confirmed: Even CPU fallback blocked. Fix CSP connect-src`)
                lastInitErrorsRef.current.push(`🚨 SOLUTION: Add 'connect-src https://storage.googleapis.com' to CSP`)
              } else if (msg.includes('Loading failed') || msg.includes('Not found')) {
                if (modelBaseUrl) {
                  lastInitErrorsRef.current.push(`🚨 Model Not Found: Check if URL exists: ${cpuEffectiveUrl}`)
                  lastInitErrorsRef.current.push(`🚨 TRY: Remove custom modelBaseUrl to use PoseNet defaults`)
                } else {
                  lastInitErrorsRef.current.push(`🚨 Model Not Found: Even default PoseNet URLs failing`)
                  lastInitErrorsRef.current.push(`🚨 LIKELY CAUSE: Network issue or CSP blocking defaults`)
                }
              } else if (msg.includes('load failed') && msg.length < 20) {
                lastInitErrorsRef.current.push(`🚨 GENERIC CPU LOAD FAILURE: Internal PoseNet/TFJS error`)
                lastInitErrorsRef.current.push(`🚨 POSSIBLE CAUSES: Version incompatibility or memory issue`)
                lastInitErrorsRef.current.push(`🚨 TRY: Different TFJS version or check browser console`)
              }
              
              console.error('❌ TF.js: CPU fallback failed', msg)
            }
          }

          if (!loadSucceeded) {
            // Add summary of all attempted configs before final failure
            lastInitErrorsRef.current.push(`🚨🚨 FINAL FAILURE SUMMARY 🚨🚨`)
            lastInitErrorsRef.current.push(`ALL ${MODEL_FALLBACK_CHAIN.length} WebGL configs + CPU fallback FAILED`)
            lastInitErrorsRef.current.push(`TFJS version: ${(tf as any)?.version_core || 'unknown'}`)
            lastInitErrorsRef.current.push(`PoseNet version: ${(posenet as any)?.version || 'unknown'}`)
            lastInitErrorsRef.current.push(`Backend: ${tf.getBackend()}`)
            lastInitErrorsRef.current.push(`Custom modelBaseUrl: ${modelBaseUrl || 'none (using defaults)'}`)
            lastInitErrorsRef.current.push(`Force CPU: ${forceCpu}`)
            lastInitErrorsRef.current.push(`Low Res: ${lowRes}`)
            lastInitErrorsRef.current.push(`🚨 NEXT STEPS:`)
            lastInitErrorsRef.current.push(`1. Check all errors above for patterns`)
            lastInitErrorsRef.current.push(`2. If 'Failed to fetch' - fix CSP connect-src`)
            lastInitErrorsRef.current.push(`3. If 'load failed' - try different TFJS version`)
            lastInitErrorsRef.current.push(`4. Clear all localStorage pose.* settings`)
            try { (window as any).__poseInitErrors = [...lastInitErrorsRef.current] } catch {}
            throw new Error('PoseNet model failed across all configurations - loadSucceeded' )
          }
          if (!modelRef.current){
            throw new Error('PoseNet model failed across all configurations - Ref.current')
          }

          setIsInitialized(true)
          setIsLoading(false)
          consecutiveErrorsRef.current = 0
          initializationAttemptsRef.current = 0

          console.log('✅ TF.js: Model ready (config index:', selectedConfigIndex, ')')
          
          // Test the model with a simple prediction
          if (modelRef.current) {
            try {
              const testCanvas = document.createElement('canvas')
              testCanvas.width = 257
              testCanvas.height = 257
              const testCtx = testCanvas.getContext('2d')
              if (testCtx) {
                testCtx.fillStyle = 'black'
                testCtx.fillRect(0, 0, 257, 257)
                const testPose = await (modelRef.current as any).estimateSinglePose(testCanvas, { flipHorizontal: false })
                console.log('🧪 TF.js: Model test successful, keypoints:', testPose.keypoints?.length || 0)
              }
            } catch (testErr) {
              console.warn('⚠️ TF.js: Model test failed, but continuing:', testErr)
            }
          }

          resolve()
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          lastInitErrorsRef.current.push(`Top-level init error: ${msg}`)
          try { (window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20) } catch {}
          reject(err)
        }
      })

      // Set a timeout for initialization
      const timeoutPromise = new Promise<void>((_, reject) => {
        initializationTimeoutRef.current = setTimeout(() => {
          reject(new Error('Pose detection initialization timed out'))
        }, 40000) // 40 second timeout for MobileNetV1
      })

      // Race between initialization and timeout
      await Promise.race([initPromise, timeoutPromise])

      // Clear timeout if we get here
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize pose detection'
      console.error('❌ TF.js initialization error:', err)
      setError(errorMsg)
      setIsLoading(false)
      setIsInitialized(false)
      try { (window as any).__poseInitErrors = lastInitErrorsRef.current.slice(-20) } catch {}
      
      // Clear timeout if it exists
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current)
        initializationTimeoutRef.current = null
      }
      
      // If we've tried too many times, give up
      if (initializationAttemptsRef.current >= 3) {
        const aggregated = lastInitErrorsRef.current.slice(-10)
        setError('Failed to initialize pose detection after multiple attempts. Please refresh the page.')
        ;(window as any).__poseInitErrors = aggregated
        throw new Error('Max initialization attempts reached')
      }
      
      throw new Error(errorMsg)
    }
  }, [isInitialized])

  const detectPose = useCallback(async () => {
    // Check if we have required components
    if (!modelRef.current || !videoRef.current || !isInitialized) {
      console.log('❌ TF.js: Missing components', {
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current,
        isInitialized
      })
      return
    }

    const video = videoRef.current

    // Comprehensive video state check
    if (video.readyState < 2 || video.paused || video.ended) {
      console.log('⏳ TF.js: Video not ready', {
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended,
        currentTime: video.currentTime
      })
      return
    }

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('⏳ TF.js: Video dimensions not ready:', {
        width: video.videoWidth,
        height: video.videoHeight
      })
      return
    }

    // Check camera stream health
    const stream = video.srcObject as MediaStream
    if (!stream || !stream.active) {
      console.log('❌ TF.js: Camera stream inactive')
      return
    }

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0 || videoTracks[0].readyState !== 'live') {
      console.log('❌ TF.js: Video track not live')
      return
    }

    try {
      const now = Date.now()
      
      // Throttle detection to ~10 FPS for better performance and stability
      if (now - lastDetectionTimeRef.current < 100) {
        return
      }
      lastDetectionTimeRef.current = now

      // Create a canvas to draw the video frame for better compatibility
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw the current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Estimate pose using the canvas instead of video element
      const pose = await modelRef.current.estimateSinglePose(canvas, {
        flipHorizontal: false,
        minPoseConfidence: 0.3,
        minPartConfidence: 0.3
      })

      // Reset error counter on successful detection
      consecutiveErrorsRef.current = 0

      if (pose && pose.keypoints && pose.keypoints.length > 0) {
        const landmarks = pose.keypoints.map((keypoint: { position: { x: number; y: number }; score: number }) => ({
          x: keypoint.position.x,
          y: keypoint.position.y,
          confidence: keypoint.score
        }))

        // Apply temporal smoothing for more stable measurements
        const smoothedLandmarks = smoothLandmarks(landmarks)

        // Calculate detection confidence with balanced thresholds for MobileNetV1
        const avgConfidence = smoothedLandmarks.reduce((sum: number, kp: { confidence: number }) => sum + kp.confidence, 0) / smoothedLandmarks.length
        const highConfidenceCount = smoothedLandmarks.filter((kp: { confidence: number }) => kp.confidence > 0.4).length
        const isDetected = avgConfidence > 0.35 && highConfidenceCount >= 8

        // Performance monitoring for MobileNetV1
        if (Math.random() < 0.02) { // 2% of frames
          const now = performance.now()
          const timeSinceLastLog = now - (lastPerformanceLogRef.current || now)
          const estimatedFPS = timeSinceLastLog > 0 ? Math.round(1000 / timeSinceLastLog * 50) : 0
          console.log('📊 MobileNetV1 Performance:', {
            avgConfidence: avgConfidence.toFixed(3),
            detectedKeypoints: highConfidenceCount,
            estimatedFPS,
            inputResolution: '353x353'
          })
          lastPerformanceLogRef.current = now
        }

        setPoseResults({
          landmarks: smoothedLandmarks,
          isDetected,
          confidence: avgConfidence
        })

        // Update pose stability
        updatePoseStability(smoothedLandmarks, selectedStyleIdRef.current || 'shirts', stabilityThreshold, positionFeedback)

      } else {
        // No pose found, but don't log this as an error
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
        // Reset stability if no pose
        resetPoseStability()
      }
    } catch (err) {
      consecutiveErrorsRef.current++
      console.error(`💥 TF.js: Detection error (${consecutiveErrorsRef.current})`, err)
      
      // If too many consecutive errors, try to recover
      if (consecutiveErrorsRef.current > 5) {
        console.log('🔄 TF.js: Too many errors, attempting recovery...')
        consecutiveErrorsRef.current = 0
        
        // Reset pose results but don't stop detection
        setPoseResults({
          landmarks: [],
          isDetected: false,
          confidence: 0
        })
        // Reset stability on error
        resetPoseStability()
      }
    }
  }, [isInitialized, updatePoseStability, resetPoseStability, stabilityThreshold])

  const startDetection = useCallback(() => {
    if (!isInitialized || !modelRef.current || !videoRef.current) {
      console.log('❌ TF.js: Cannot start detection - not ready', {
        isInitialized,
        hasModel: !!modelRef.current,
        hasVideo: !!videoRef.current
      })
      return Promise.reject(new Error('Pose detection not initialized'))
    }

    if (isDetectionRunningRef.current) {
      console.log('⚠️ TF.js: Detection already running')
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      console.log('🚀 TF.js: Starting pose detection loop...')
      isDetectionRunningRef.current = true
      consecutiveErrorsRef.current = 0

      let frameCount = 0
      const startTime = Date.now()

      const runDetection = async () => {
        // Check if detection should continue
        if (!isDetectionRunningRef.current) {
          console.log('🛑 TF.js: Detection stopped')
          return
        }

        frameCount++
        
        // Periodic status logging
        if (frameCount === 1) {
          console.log('✅ TF.js: Detection loop started successfully')
          resolve()
        }
        
        if (frameCount % 300 === 0) { // Every ~20 seconds at 15fps
          const elapsed = Date.now() - startTime
          console.log(`🔄 TF.js: Detection running - Frame ${frameCount}, ${(elapsed/1000).toFixed(1)}s elapsed`)
        }

        try {
          await detectPose()
        } catch (err) {
          console.error('💥 TF.js: Detection loop error:', err)
        }

        // Continue the loop
        if (isDetectionRunningRef.current) {
          animationRef.current = requestAnimationFrame(runDetection)
        }
      }

      // Start the detection loop
      runDetection()
    })
  }, [isInitialized, detectPose])

  const stopDetection = useCallback(() => {
    console.log('🛑 TF.js: Stopping pose detection...')
    isDetectionRunningRef.current = false
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    setPoseResults(null)
    consecutiveErrorsRef.current = 0
    console.log('✅ TF.js: Detection stopped')
  }, [])

  const cleanup = useCallback(() => {
    console.log('🧹 TF.js: Cleaning up pose detection...')
    stopDetection()
    
    // Clear any pending initialization timeout
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current)
      initializationTimeoutRef.current = null
    }
    
    modelRef.current = null
    videoRef.current = null
    setIsInitialized(false)
    setError('')
    
    console.log('✅ TF.js: Cleanup complete')
  }, [stopDetection])

  // Health check function for debugging
  const getHealthStatus = useCallback(() => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream
    
    return {
      modelLoaded: !!modelRef.current,
      videoReady: (video?.readyState ?? 0) >= 2,
      videoPlaying: !video?.paused,
      streamActive: stream?.active,
      detectionRunning: isDetectionRunningRef.current,
      hasAnimationFrame: !!animationRef.current,
      consecutiveErrors: consecutiveErrorsRef.current,
      videoDimensions: video ? `${video.videoWidth}x${video.videoHeight}` : 'N/A'
    }
  }, [])

  // Function to update position feedback for stability calculations
  const updatePositionFeedback = useCallback((feedback: any) => {
    setPositionFeedback(feedback)
  }, [])

  return {
    poseResults,
    isInitialized,
    isLoading,
    error,
    initializePose,
    startDetection,
    stopDetection,
    cleanup,
    getHealthStatus,
    poseStability,
    setSelectedStyle,
    resetPoseStability,
    updatePositionFeedback,
    positionFeedback
  }
}

// PoseNet keypoint names for reference
export const POSENET_KEYPOINTS = [
  'nose',           // 0
  'leftEye',        // 1
  'rightEye',       // 2
  'leftEar',        // 3
  'rightEar',       // 4
  'leftShoulder',   // 5
  'rightShoulder',  // 6
  'leftElbow',      // 7
  'rightElbow',     // 8
  'leftWrist',      // 9
  'rightWrist',     // 10
  'leftHip',        // 11
  'rightHip',       // 12
  'leftKnee',       // 13
  'rightKnee',      // 14
  'leftAnkle',      // 15
  'rightAnkle'      // 16
]