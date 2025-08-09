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
  
  }, [poseResults, videoDims, displayDims])