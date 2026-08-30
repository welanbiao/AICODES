import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Matter from 'matter-js'
import type { PuzzleLevel } from '../types'
import SuccessOverlay from './SuccessOverlay'
import './PuzzleScreen.css'

const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter

interface Props {
  level: PuzzleLevel
  onBack: () => void
}

const RAINBOW = ['#ff5a5a', '#ff8a3a', '#f5d547', '#5ecf6a', '#5bb5f0', '#7b6ad6']

export default function PuzzleScreen({ level, onBack }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const ballsRef = useRef<Matter.Body[]>([])
  const drawingRef = useRef(false)
  const pointsRef = useRef<{ x: number; y: number }[]>([])
  const wonRef = useRef(false)
  const [seconds, setSeconds] = useState(5 * 60)
  const [won, setWon] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [seed, setSeed] = useState(0)

  const timeText = useMemo(() => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [seconds])

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((v) => Math.max(0, v - 1)), 1000)
    return () => clearInterval(t)
  }, [seed])

  const teardown = useCallback(() => {
    if (runnerRef.current) Runner.stop(runnerRef.current)
    if (renderRef.current) {
      Render.stop(renderRef.current)
      renderRef.current.canvas.remove()
      renderRef.current = null
    }
    if (engineRef.current) {
      Engine.clear(engineRef.current)
      engineRef.current = null
    }
    runnerRef.current = null
    ballsRef.current = []
  }, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    teardown()
    wonRef.current = false

    const w = host.clientWidth || 800
    const h = host.clientHeight || 450
    const sx = w / 800
    const sy = h / 450
    const scale = Math.min(sx, sy)

    const engine = Engine.create({ gravity: { x: 0, y: 1.15 } })
    engine.timing.timeScale = 1
    engineRef.current = engine

    const render = Render.create({
      element: host,
      engine,
      options: {
        width: w,
        height: h,
        wireframes: false,
        background: 'transparent',
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      },
    })
    renderRef.current = render

    const walls = [
      Bodies.rectangle(w / 2, h + 30, w, 60, {
        isStatic: true,
        render: { fillStyle: '#6b5bb5' },
      }),
      Bodies.rectangle(-30, h / 2, 60, h * 2, {
        isStatic: true,
        render: { visible: false },
      }),
      Bodies.rectangle(w + 30, h / 2, 60, h * 2, {
        isStatic: true,
        render: { visible: false },
      }),
    ]

    const platforms = level.platforms.map((p) =>
      Bodies.rectangle(p.x * sx, p.y * sy, p.w * sx, p.h * sy, {
        isStatic: true,
        chamfer: { radius: 6 },
        render: { fillStyle: '#6b5bb5', strokeStyle: '#5648a0', lineWidth: 2 },
      }),
    )

    const balls = level.balls.map((b) =>
      Bodies.circle(b.x * sx, b.y * sy, 20 * scale, {
        restitution: 0.35,
        friction: 0.15,
        frictionAir: 0.01,
        density: 0.0025,
        render: {
          fillStyle: b.color,
          strokeStyle: '#fff',
          lineWidth: 3,
        },
        label: 'ball',
      }),
    )
    ballsRef.current = balls

    Composite.add(engine.world, [...walls, ...platforms, ...balls])

    Events.on(engine, 'afterUpdate', () => {
      if (wonRef.current) return
      const [a, b] = ballsRef.current
      if (!a || !b) return
      const dx = a.position.x - b.position.x
      const dy = a.position.y - b.position.y
      if (Math.hypot(dx, dy) < 44 * scale) {
        wonRef.current = true
        setWon(true)
      }
    })

    Events.on(render, 'afterRender', () => {
      const ctx = render.context
      for (const ball of ballsRef.current) {
        const { x, y } = ball.position
        const angle = ball.angle
        const r = ball.circleRadius || 16
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        // eyes
        ctx.fillStyle = '#222'
        ctx.beginPath()
        ctx.arc(-r * 0.28, -r * 0.18, r * 0.16, 0, Math.PI * 2)
        ctx.arc(r * 0.28, -r * 0.18, r * 0.16, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(-r * 0.22, -r * 0.24, r * 0.06, 0, Math.PI * 2)
        ctx.arc(r * 0.34, -r * 0.24, r * 0.06, 0, Math.PI * 2)
        ctx.fill()
        // smile
        ctx.strokeStyle = '#222'
        ctx.lineWidth = Math.max(2, r * 0.12)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, r * 0.08, r * 0.42, 0.15 * Math.PI, 0.85 * Math.PI)
        ctx.stroke()
        ctx.restore()
      }
      const pts = pointsRef.current
      if (pts.length > 1) {
        ctx.lineWidth = 10
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        for (let i = 1; i < pts.length; i++) {
          ctx.strokeStyle = RAINBOW[i % RAINBOW.length]
          ctx.beginPath()
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
          ctx.lineTo(pts[i].x, pts[i].y)
          ctx.stroke()
        }
      }
    })

    Render.run(render)
    const runner = Runner.create()
    runnerRef.current = runner
    Runner.run(runner, engine)

    const onResize = () => setSeed((s) => s + 1)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      teardown()
    }
  }, [level, seed, teardown])

  const localPos = (e: React.PointerEvent) => {
    const host = hostRef.current!
    const rect = host.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const commitStroke = () => {
    const engine = engineRef.current
    const pts = pointsRef.current
    if (!engine || pts.length < 2) {
      pointsRef.current = []
      return
    }

    const simplified: { x: number; y: number }[] = [pts[0]]
    for (let i = 1; i < pts.length; i++) {
      const prev = simplified[simplified.length - 1]
      if (Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y) >= 8) {
        simplified.push(pts[i])
      }
    }
    if (simplified.length < 2) {
      pointsRef.current = []
      return
    }

    // 动态刚体彩虹线：整体受重力，内部不收缩
    const parts: Matter.Body[] = []
    for (let i = 1; i < simplified.length; i++) {
      const a = simplified[i - 1]
      const b = simplified[i]
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const len = Math.max(Math.hypot(b.x - a.x, b.y - a.y), 4)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const color = RAINBOW[i % RAINBOW.length]
      parts.push(
        Bodies.rectangle(midX, midY, len + 2, 12, {
          angle,
          chamfer: { radius: 4 },
          friction: 0.85,
          restitution: 0.05,
          density: 0.0018,
          frictionAir: 0.02,
          render: { fillStyle: color },
          label: 'stroke-part',
        }),
      )
    }

    if (parts.length === 1) {
      Composite.add(engine.world, parts[0])
    } else if (parts.length > 1) {
      const compound = Body.create({
        parts,
        friction: 0.85,
        restitution: 0.05,
        frictionAir: 0.02,
        label: 'stroke',
      })
      Composite.add(engine.world, compound)
    }
    pointsRef.current = []
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (wonRef.current) return
    drawingRef.current = true
    hostRef.current?.setPointerCapture(e.pointerId)
    pointsRef.current = [localPos(e)]
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current) return
    pointsRef.current.push(localPos(e))
  }

  const onPointerUp = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    commitStroke()
  }

  const reset = () => {
    setWon(false)
    wonRef.current = false
    setShowHint(false)
    setSeconds(5 * 60)
    setSeed((s) => s + 1)
  }

  return (
    <div className="puzzle">
      <header className="puzzle-bar">
        <button type="button" className="p-btn back" onClick={onBack} title="返回">
          ←
        </button>
        <button type="button" className="p-btn" onClick={() => setShowHint((v) => !v)} title="提示">
          💡
        </button>
        <div className="p-timer">时间 {timeText}</div>
        <button type="button" className="p-btn" onClick={reset} title="重来">
          ↻
        </button>
      </header>

      {showHint && <div className="puzzle-hint">{level.hint}</div>}

      <div
        className="puzzle-stage"
        ref={hostRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {won && (
        <SuccessOverlay title="恭喜通关" subtitle="你真聪明！" onHome={onBack} onAgain={reset} />
      )}
    </div>
  )
}
