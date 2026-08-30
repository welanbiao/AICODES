import { useEffect, useMemo, useState } from 'react'
import type { MathLevel } from '../types'
import SuccessOverlay from './SuccessOverlay'
import './MathScreen.css'

interface Props {
  level: MathLevel
  onBack: () => void
}

export default function MathScreen({ level, onBack }: Props) {
  const [seconds, setSeconds] = useState(5 * 60)
  const [picked, setPicked] = useState<number | null>(null)
  const [wrong, setWrong] = useState(false)
  const [won, setWon] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  const timeText = useMemo(() => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [seconds])

  const addMode = level.subtract.length === 0
  const addend = addMode ? level.answer - level.startCount : 0

  const onPick = (n: number) => {
    setPicked(n)
    if (n === level.answer) {
      setWrong(false)
      setTimeout(() => setWon(true), 450)
    } else {
      setWrong(true)
      setTimeout(() => {
        setWrong(false)
        setPicked(null)
      }, 700)
    }
  }

  return (
    <div className="math">
      <button type="button" className="math-back" onClick={onBack}>
        ←
      </button>
      <div className="math-frame">
        <div className="math-timer">{timeText}</div>

        <div className="math-eq">
          <div className="cluster">
            {Array.from({ length: level.startCount }, (_, i) => (
              <span key={i} className="item" style={{ animationDelay: `${i * 0.04}s` }}>
                {level.emoji}
              </span>
            ))}
          </div>

          {addMode ? (
            <>
              <span className="op">+</span>
              <div className="cluster small">
                {Array.from({ length: addend }, (_, i) => (
                  <span key={i} className="item">
                    {level.emoji}
                  </span>
                ))}
              </div>
            </>
          ) : (
            level.subtract.map((n, idx) => (
              <div key={idx} className="sub-group">
                <span className="op">−</span>
                <div className="cluster small">
                  {Array.from({ length: n }, (_, i) => (
                    <span key={i} className="item">
                      {level.emoji}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}

          <span className="op">=</span>
          <span className="qmark">?</span>
        </div>

        <div className="math-options">
          {level.options.map((n) => (
            <button
              key={n}
              type="button"
              className={`opt ${picked === n && n === level.answer ? 'correct' : ''} ${
                picked === n && wrong ? 'wrong' : ''
              }`}
              onClick={() => onPick(n)}
            >
              <div className="opt-items">
                {Array.from({ length: n }, (_, i) => (
                  <span key={i}>{level.emoji}</span>
                ))}
              </div>
              {picked === n && n === level.answer && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {won && (
        <SuccessOverlay
          title="恭喜答对！"
          subtitle="你真聪明！"
          onHome={onBack}
          onAgain={() => {
            setWon(false)
            setPicked(null)
            setSeconds(5 * 60)
          }}
        />
      )}
    </div>
  )
}
