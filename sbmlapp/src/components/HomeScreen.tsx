import type { CategoryId, OrientationMode } from '../types'
import './HomeScreen.css'

const CATEGORIES: {
  id: CategoryId
  label: string
  icon: 'hedgehog' | 'abc' | 'flower' | 'math' | 'car' | 'puzzle'
}[] = [
  { id: 'animal', label: '动物画', icon: 'hedgehog' },
  { id: 'nature', label: '自然画', icon: 'flower' },
  { id: 'machine', label: '机械画', icon: 'car' },
  { id: 'alphabet', label: '字母画', icon: 'abc' },
  { id: 'math', label: '数学画', icon: 'math' },
  { id: 'puzzle', label: '益智画', icon: 'puzzle' },
]

function CategoryIcon({ type }: { type: (typeof CATEGORIES)[number]['icon'] }) {
  switch (type) {
    case 'hedgehog':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <path
            d="M30 70 C28 45 45 28 65 30 C90 32 100 50 98 70 C96 92 70 100 50 95 C35 92 32 82 30 70 Z"
            fill="none"
            stroke="#8b6a4a"
            strokeWidth="3"
            strokeDasharray="5 4"
          />
          <path d="M55 42 L48 18 M70 38 L72 14 M82 45 L95 22 M90 58 L110 48" stroke="#8b6a4a" strokeWidth="2.5" strokeDasharray="4 3" fill="none" />
          <path d="M48 68 Q55 78 48 82" stroke="#5c3d1e" strokeWidth="2.5" fill="none" />
          <circle cx="72" cy="62" r="4" fill="#3a2a1a" />
          <ellipse cx="38" cy="82" rx="8" ry="5" fill="#a87848" />
        </svg>
      )
    case 'abc':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <text x="18" y="78" fontSize="48" fontFamily="ZCOOL KuaiLe, cursive" fill="#f0b429">a</text>
          <text x="48" y="78" fontSize="48" fontFamily="ZCOOL KuaiLe, cursive" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4 3">b</text>
          <text x="78" y="78" fontSize="48" fontFamily="ZCOOL KuaiLe, cursive" fill="none" stroke="#666" strokeWidth="2" strokeDasharray="4 3">c</text>
        </svg>
      )
    case 'flower':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <circle cx="60" cy="48" r="14" fill="none" stroke="#888" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="60" cy="30" r="12" fill="none" stroke="#888" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="78" cy="48" r="12" fill="none" stroke="#888" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="60" cy="66" r="12" fill="none" stroke="#888" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="42" cy="48" r="12" fill="none" stroke="#888" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="60" cy="48" r="8" fill="#f5d547" />
          <line x1="60" y1="66" x2="60" y2="95" stroke="#5faf4a" strokeWidth="3" />
          <path d="M48 88 Q35 78 28 95 Q42 90 48 88" fill="#5faf4a" />
          <path d="M72 88 Q85 78 92 95 Q78 90 72 88" fill="#5faf4a" />
          <circle cx="56" cy="46" r="2" fill="#333" />
          <circle cx="64" cy="46" r="2" fill="#333" />
          <path d="M55 52 Q60 56 65 52" stroke="#333" strokeWidth="1.5" fill="none" />
        </svg>
      )
    case 'math':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <text x="12" y="72" fontSize="36" fontFamily="ZCOOL KuaiLe, cursive" fill="#3a2a1a">1+1=?</text>
        </svg>
      )
    case 'car':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <path
            d="M18 72 L28 50 L55 42 L85 42 L105 62 L110 62 L110 82 L18 82 Z"
            fill="none"
            stroke="#666"
            strokeWidth="2.5"
            strokeDasharray="5 4"
          />
          <circle cx="38" cy="82" r="12" fill="none" stroke="#666" strokeWidth="2.5" strokeDasharray="4 3" />
          <circle cx="90" cy="82" r="12" fill="none" stroke="#666" strokeWidth="2.5" strokeDasharray="4 3" />
          <path d="M35 52 L52 46 L52 68 L30 72 Z" fill="#6ec4f0" opacity="0.85" />
          <path d="M58 45 L82 45 L98 65 L58 68 Z" fill="#6ec4f0" opacity="0.85" />
        </svg>
      )
    case 'puzzle':
      return (
        <svg viewBox="0 0 120 120" className="cat-svg">
          <path d="M15 40 L95 95 L15 95 Z" fill="#a87848" />
          <circle cx="35" cy="48" r="12" fill="#7b6ad6" />
          <circle cx="82" cy="88" r="12" fill="#e87aa0" />
          <circle cx="32" cy="45" r="2.5" fill="#fff" opacity="0.7" />
          <circle cx="79" cy="85" r="2.5" fill="#fff" opacity="0.7" />
        </svg>
      )
  }
}

interface Props {
  onSelect: (id: CategoryId) => void
  orientation: OrientationMode
}

export default function HomeScreen({ onSelect, orientation }: Props) {
  return (
    <div className={`home home-${orientation}`}>
      <div className="home-sky" />
      <div className="home-sea" />
      <div className="home-sand" />
      <div className="palm palm-l" aria-hidden>
        <div className="trunk" />
        <div className="frond f1" />
        <div className="frond f2" />
        <div className="frond f3" />
      </div>
      <div className="palm palm-r" aria-hidden>
        <div className="trunk" />
        <div className="frond f1" />
        <div className="frond f2" />
        <div className="frond f3" />
      </div>

      <h1 className="logo" aria-label="神笔马良">
        <span className="c1">神</span>
        <span className="c2">笔</span>
        <span className="c3">马</span>
        <span className="c4">良</span>
      </h1>

      <div className="grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="cat-btn" onClick={() => onSelect(c.id)} type="button">
            <div className="cat-frame">
              <CategoryIcon type={c.icon} />
            </div>
            <span className="cat-label">{c.label}</span>
          </button>
        ))}
      </div>

      <div className="home-footer">
        <span>版本号 2.3</span>
      </div>
    </div>
  )
}
