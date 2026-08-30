import { useEffect, useRef } from 'react'
import { speakLevelComplete, stopSpeech } from '../utils/speech'
import './SuccessOverlay.css'

interface Props {
  title: string
  subtitle: string
  onHome: () => void
  onAgain: () => void
  /** 字母画：要朗读的字母或单词 */
  speakEnglish?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  kind: 'spark' | 'star' | 'ribbon'
  rot: number
  vr: number
}

const COLORS = [
  '#ff4d6d',
  '#ff8a3a',
  '#ffd166',
  '#06d6a0',
  '#4cc9f0',
  '#7b2cbf',
  '#f72585',
  '#80ed99',
  '#ffe66d',
  '#48cae4',
]

export default function SuccessOverlay({ title, subtitle, onHome, onAgain, speakEnglish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    void speakLevelComplete(speakEnglish)
    return () => {
      stopSpeech()
    }
  }, [speakEnglish])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const particles: Particle[] = []
    let burstTimer = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const spawnCannon = (cx: number, cy: number, dir: number) => {
      for (let i = 0; i < 48; i++) {
        const angle = dir + (Math.random() - 0.5) * 0.9
        const speed = 8 + Math.random() * 14
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 6,
          life: 0,
          max: 60 + Math.random() * 50,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          size: 3 + Math.random() * 6,
          kind: (['spark', 'star', 'ribbon'] as const)[(Math.random() * 3) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
        })
      }
    }

    const fire = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      spawnCannon(w * 0.18, h * 0.88, -Math.PI / 2 - 0.35)
      spawnCannon(w * 0.82, h * 0.88, -Math.PI / 2 + 0.35)
      spawnCannon(w * 0.5, h * 0.92, -Math.PI / 2)
    }

    fire()
    burstTimer = 25

    const drawCannon = (x: number, y: number, tilt: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(tilt)
      const g = ctx.createLinearGradient(-14, 0, 14, 0)
      g.addColorStop(0, '#ff6b9d')
      g.addColorStop(0.5, '#ffd166')
      g.addColorStop(1, '#4cc9f0')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(-16, 20)
      ctx.lineTo(-12, -48)
      ctx.lineTo(12, -48)
      ctx.lineTo(16, 20)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,200,0.85)'
      ctx.beginPath()
      ctx.ellipse(0, -50, 14, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#c44569'
      ctx.fillRect(-22, 16, 44, 14)
      ctx.restore()
    }

    const tick = () => {
      if (!running) return
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      burstTimer--
      if (burstTimer <= 0) {
        fire()
        burstTimer = 40 + ((Math.random() * 20) | 0)
      }

      drawCannon(w * 0.18, h * 0.9, -0.25)
      drawCannon(w * 0.82, h * 0.9, 0.25)
      drawCannon(w * 0.5, h * 0.94, 0)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life++
        p.vy += 0.22
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr
        const t = p.life / p.max
        if (t >= 1) {
          particles.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 1 - t * t
        ctx.fillStyle = p.color
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.kind === 'star') {
          ctx.beginPath()
          for (let k = 0; k < 5; k++) {
            const a = (k * Math.PI * 2) / 5 - Math.PI / 2
            const r = k % 2 === 0 ? p.size : p.size * 0.45
            const x = Math.cos(a) * r
            const y = Math.sin(a) * r
            if (k === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.fill()
        } else if (p.kind === 'ribbon') {
          ctx.fillRect(-p.size * 0.4, -p.size * 1.4, p.size * 0.8, p.size * 2.8)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.55, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="success">
      <canvas ref={canvasRef} className="fw-canvas" aria-hidden />
      <div className="success-card">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="success-actions">
          <button type="button" onClick={onAgain}>
            再玩一次
          </button>
          <button type="button" className="primary" onClick={onHome}>
            返回
          </button>
        </div>
      </div>
    </div>
  )
}
