import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DrawTemplate, OrientationMode } from '../types'
import { GUIDE_LINE_WIDTH } from '../types'
import SuccessOverlay from './SuccessOverlay'
import './DrawingScreen.css'

const PENCILS = [
  '#e87aa0',
  '#c4784a',
  '#f08a4a',
  '#f5c84a',
  '#5ecf6a',
  '#5bb5f0',
  '#7b6ad6',
  '#5c3d1e',
]

const LOGICAL = { w: 800, h: 450 }
const COVER_THRESHOLD = 0.42
/** 字母虚线描边（比路径虚线细，避免粗描边糊成一团） */
const TEXT_GUIDE_WIDTH = 6
/** 已加载的规范大写印刷体（圆角黑体，儿童易辨认） */
const LETTER_FACE = '"Fredoka", "Arial Black", Arial, sans-serif'

interface Props {
  template: DrawTemplate
  onBack: () => void
  orientation: OrientationMode
}

export default function DrawingScreen({ template, onBack, orientation }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null)
  const paintRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const transformRef = useRef({ scale: 1, ox: 0, oy: 0, dpr: 1 })
  const [color, setColor] = useState(PENCILS[1])
  const [erase, setErase] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [stepFlash, setStepFlash] = useState(false)
  const [alive, setAlive] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const steps = template.steps
  const current = steps[Math.min(stepIndex, steps.length - 1)]
  const isLastStep = stepIndex >= steps.length - 1

  const formatTime = useMemo(() => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [seconds])

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setStepIndex(0)
    setAlive(false)
    setShowSuccess(false)
  }, [template.id])

  const textLayout = useCallback(
    (stepIdx: number, text: string) => {
      const wordSteps = steps.filter((s) => s.guideText).length
      const isWord = !!template.sampleText && wordSteps > 1
      if (!isWord) {
        const isLetter = text.length <= 1
        return {
          x: 400,
          y: isLetter ? 290 : 310,
          font: isLetter ? `700 176px ${LETTER_FACE}` : text.length > 6 ? `600 72px ${LETTER_FACE}` : `600 100px ${LETTER_FACE}`,
        }
      }
      const n = wordSteps
      const spacing = Math.min(108, 620 / Math.max(n, 1))
      const startX = 400 - ((n - 1) * spacing) / 2
      return {
        x: startX + stepIdx * spacing,
        y: 305,
        font: n > 6 ? `600 68px ${LETTER_FACE}` : `600 86px ${LETTER_FACE}`,
      }
    },
    [steps, template.sampleText],
  )

  const paintGuides = useCallback(
    (ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number) => {
      const scale = Math.min(cssW / LOGICAL.w, cssH / LOGICAL.h)
      const ox = (cssW - LOGICAL.w * scale) / 2
      const oy = (cssH - LOGICAL.h * scale) / 2
      transformRef.current = { scale, ox, oy, dpr }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.translate(ox, oy)
      ctx.scale(scale, scale)

      if (template.sampleText) {
        const isLetter = steps.length === 1 && !!steps[0].guideText
        ctx.font = isLetter
          ? `700 96px ${LETTER_FACE}`
          : template.sampleText.length > 6
            ? `600 44px ${LETTER_FACE}`
            : `600 56px ${LETTER_FACE}`
        ctx.fillStyle = template.sampleColor || '#e87aa0'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(template.sampleText.toUpperCase(), 400, 100)
      }

      // 已完成步骤的 solids + 当前及之前的 solids
      for (let i = 0; i <= stepIndex && i < steps.length; i++) {
        const step = steps[i]
        for (const s of step.solids || []) {
          const path = new Path2D(s.d)
          if (s.fill) {
            ctx.fillStyle = s.fill
            ctx.fill(path)
          }
          if (s.stroke) {
            ctx.strokeStyle = s.stroke
            ctx.lineWidth = s.strokeWidth || GUIDE_LINE_WIDTH
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.stroke(path)
          }
        }
      }

      // 仅当前步骤虚线
      const step = steps[stepIndex]
      if (!step) return

      ctx.strokeStyle = '#8a8a8a'
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (step.guideText) {
        const guide = step.guideText.toUpperCase()
        const layout = textLayout(stepIndex, guide)
        ctx.font = layout.font
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.lineWidth = TEXT_GUIDE_WIDTH
        ctx.setLineDash([TEXT_GUIDE_WIDTH * 1.6, TEXT_GUIDE_WIDTH * 1.2])
        ctx.strokeText(guide, layout.x, layout.y)
      }

      ctx.lineWidth = GUIDE_LINE_WIDTH
      ctx.setLineDash([GUIDE_LINE_WIDTH * 1.8, GUIDE_LINE_WIDTH * 1.4])
      for (const g of step.guides || []) {
        ctx.stroke(new Path2D(g.d))
      }
      ctx.setLineDash([])
    },
    [template, steps, stepIndex, textLayout],
  )

  const resize = useCallback(() => {
    const wrap = wrapRef.current
    const guide = guideRef.current
    const paint = paintRef.current
    if (!wrap || !guide || !paint) return
    const rect = wrap.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const prev = document.createElement('canvas')
    prev.width = paint.width
    prev.height = paint.height
    const prevCtx = prev.getContext('2d')
    if (prevCtx && paint.width) prevCtx.drawImage(paint, 0, 0)

    for (const c of [guide, paint]) {
      c.width = Math.floor(rect.width * dpr)
      c.height = Math.floor(rect.height * dpr)
      c.style.width = `${rect.width}px`
      c.style.height = `${rect.height}px`
    }

    const gctx = guide.getContext('2d')
    if (gctx) paintGuides(gctx, rect.width, rect.height, dpr)

    const pctx = paint.getContext('2d')
    if (pctx) {
      pctx.setTransform(1, 0, 0, 1, 0, 0)
      pctx.clearRect(0, 0, paint.width, paint.height)
      if (prev.width) pctx.drawImage(prev, 0, 0, paint.width, paint.height)
    }
  }, [paintGuides])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    void document.fonts.load(`700 176px ${LETTER_FACE}`).then(() => resize())
    return () => window.removeEventListener('resize', resize)
  }, [resize, orientation])

  useEffect(() => {
    const guide = guideRef.current
    const wrap = wrapRef.current
    if (!guide || !wrap) return
    const rect = wrap.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const gctx = guide.getContext('2d')
    if (gctx) paintGuides(gctx, rect.width, rect.height, dpr)
  }, [stepIndex, paintGuides])

  const onPointerDown = (e: React.PointerEvent) => {
    if (alive || showSuccess) return
    e.preventDefault()
    const canvas = paintRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { scale, dpr } = transformRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const widthCss = GUIDE_LINE_WIDTH * scale
    ctx.lineWidth = widthCss * dpr
    if (erase) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.lineWidth = widthCss * dpr * 2.2
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawing.current) return
    const canvas = paintRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = transformRef.current.dpr
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const tryAdvanceStep = () => {
    const paint = paintRef.current
    if (!paint || !current) return
    let coverage = 1

    if (current.guideText) {
      const guide = current.guideText.toUpperCase()
      const layout = textLayout(stepIndex, guide)
      coverage = measureTextCoverageTransformed(
        paint,
        guide,
        layout.font,
        layout.x,
        layout.y,
      )
    } else if (current.guides?.length) {
      coverage = measurePathsTransformed(
        paint,
        current.guides.map((g) => new Path2D(g.d)),
      )
    } else {
      // 仅 solids 的步骤自动跳过
      coverage = 1
    }

    if (coverage >= COVER_THRESHOLD) {
      if (isLastStep) return
      setStepFlash(true)
      window.setTimeout(() => setStepFlash(false), 500)
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
    }
  }

  const measurePathsTransformed = (paint: HTMLCanvasElement, paths: Path2D[]) => {
    const { scale, ox, oy, dpr } = transformRef.current
    const w = paint.width
    const h = paint.height
    const mask = document.createElement('canvas')
    mask.width = w
    mask.height = h
    const mctx = mask.getContext('2d')
    const pctx = paint.getContext('2d', { willReadFrequently: true })
    if (!mctx || !pctx) return 0
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    mctx.translate(ox, oy)
    mctx.scale(scale, scale)
    mctx.strokeStyle = '#fff'
    mctx.lineWidth = GUIDE_LINE_WIDTH * 1.8
    mctx.lineCap = 'round'
    mctx.lineJoin = 'round'
    for (const p of paths) mctx.stroke(p)
    return sampleCoverage(mctx, pctx, w, h, Math.max(2, Math.round(GUIDE_LINE_WIDTH * scale * dpr)))
  }

  const measureTextCoverageTransformed = (
    paint: HTMLCanvasElement,
    text: string,
    font: string,
    lx: number,
    ly: number,
  ) => {
    const { scale, ox, oy, dpr } = transformRef.current
    const w = paint.width
    const h = paint.height
    const mask = document.createElement('canvas')
    mask.width = w
    mask.height = h
    const mctx = mask.getContext('2d')
    const pctx = paint.getContext('2d', { willReadFrequently: true })
    if (!mctx || !pctx) return 0
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    mctx.translate(ox, oy)
    mctx.scale(scale, scale)
    mctx.font = font
    mctx.textAlign = 'center'
    mctx.textBaseline = 'middle'
    mctx.lineWidth = TEXT_GUIDE_WIDTH
    mctx.lineJoin = 'round'
    mctx.strokeStyle = '#fff'
    mctx.strokeText(text, lx, ly)
    return sampleCoverage(mctx, pctx, w, h, Math.max(2, Math.round(TEXT_GUIDE_WIDTH * 1.6 * scale * dpr)))
  }

  const sampleCoverage = (
    mctx: CanvasRenderingContext2D,
    pctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    radius: number,
  ) => {
    const maskData = mctx.getImageData(0, 0, w, h).data
    const paintData = pctx.getImageData(0, 0, w, h).data
    let guidePixels = 0
    let covered = 0
    const step = Math.max(2, Math.floor(Math.min(w, h) / 160))
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4
        if (maskData[i + 3] < 40) continue
        guidePixels++
        let hit = false
        for (let dy = -radius; dy <= radius && !hit; dy++) {
          for (let dx = -radius; dx <= radius && !hit; dx++) {
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue
            const j = (yy * w + xx) * 4
            if (paintData[j + 3] > 40) hit = true
          }
        }
        if (hit) covered++
      }
    }
    if (guidePixels === 0) return 1
    return covered / guidePixels
  }

  const onPointerUp = (e: React.PointerEvent) => {
    drawing.current = false
    const canvas = paintRef.current
    if (!canvas) return
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (!erase) tryAdvanceStep()
  }

  // auto-skip solid-only steps
  useEffect(() => {
    const step = steps[stepIndex]
    if (!step) return
    const hasTrace = (step.guides && step.guides.length > 0) || !!step.guideText
    if (!hasTrace && stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1)
    }
  }, [stepIndex, steps])

  const clearAll = () => {
    const canvas = paintRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStepIndex(0)
  }

  const finish = () => {
    if (template.category === 'animal' && template.motion) {
      setAlive(true)
      window.setTimeout(() => setShowSuccess(true), 2800)
    } else {
      setShowSuccess(true)
    }
  }

  const resetRound = () => {
    setShowSuccess(false)
    setAlive(false)
    clearAll()
    setSeconds(0)
  }

  const motionClass = alive && template.motion ? `alive alive-${template.motion}` : ''

  return (
    <div className={`draw draw-${orientation}`}>
      <div className={`draw-stage ${motionClass} ${stepFlash ? 'step-flash' : ''}`} ref={wrapRef}>
        <canvas ref={guideRef} className="draw-guide" />
        <canvas
          ref={paintRef}
          className="draw-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        <div className="step-hud">
          <span className="step-label">{current?.label || `步骤 ${stepIndex + 1}`}</span>
          <span className="step-progress">
            {stepIndex + 1} / {steps.length}
          </span>
        </div>
        {alive && (
          <div className="alive-banner" aria-live="polite">
            {template.preview || '✨'} 动起来啦！
          </div>
        )}
        <button type="button" className="done-btn" onClick={finish} aria-label="完成" disabled={alive}>
          ✓
        </button>
        <button type="button" className="clear-btn" onClick={clearAll} aria-label="清空" disabled={alive}>
          ↻
        </button>
        <button type="button" className="home-mini" onClick={onBack} aria-label="返回">
          ←
        </button>
        <div className="timer">{formatTime}</div>
      </div>

      <aside className={`pencils ${alive ? 'dim' : ''}`}>
        {PENCILS.map((c) => (
          <button
            key={c}
            type="button"
            className={`pencil ${!erase && color === c ? 'active' : ''}`}
            style={{ '--c': c } as React.CSSProperties}
            onClick={() => {
              setColor(c)
              setErase(false)
            }}
            aria-label={`颜色 ${c}`}
          />
        ))}
        <button
          type="button"
          className={`eraser ${erase ? 'active' : ''}`}
          onClick={() => setErase(true)}
          aria-label="橡皮"
        />
      </aside>

      {showSuccess && (
        <SuccessOverlay
          title="画得真棒！"
          subtitle={
            template.category === 'animal'
              ? '小动物活起来啦！'
              : template.category === 'alphabet'
                ? `学会了 ${template.sampleText || template.title}！`
                : '你真是小画家！'
          }
          speakEnglish={
            template.category === 'alphabet'
              ? template.sampleText || template.title
              : undefined
          }
          onHome={onBack}
          onAgain={resetRound}
        />
      )}
    </div>
  )
}
