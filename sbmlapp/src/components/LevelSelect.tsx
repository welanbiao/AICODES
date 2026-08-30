import type { CategoryId } from '../types'
import { templatesByCategory } from '../data/templates'
import { mathLevels } from '../data/mathLevels'
import { puzzleLevels } from '../data/puzzleLevels'
import './LevelSelect.css'

const TITLES: Record<CategoryId, string> = {
  animal: '动物画',
  alphabet: '字母画',
  nature: '自然画',
  math: '数学画',
  machine: '机械画',
  puzzle: '益智画',
}

interface Props {
  category: CategoryId
  onBack: () => void
  onPick: (levelId: string) => void
}

interface Item {
  id: string
  title: string
  preview: string
}

export default function LevelSelect({ category, onBack, onPick }: Props) {
  const alphabet = category === 'alphabet' ? templatesByCategory('alphabet') : []
  const letters = alphabet.filter((t) => t.id.startsWith('letter-'))
  const words = alphabet.filter((t) => t.id.startsWith('word-'))

  const items: Item[] =
    category === 'math'
      ? mathLevels.map((l) => ({ id: l.id, title: l.title, preview: l.emoji }))
      : category === 'puzzle'
        ? puzzleLevels.map((l) => ({ id: l.id, title: l.title, preview: '🎈' }))
        : category === 'alphabet'
          ? []
          : templatesByCategory(category).map((t) => ({
              id: t.id,
              title: t.title,
              preview: t.preview || '✏️',
            }))

  const renderGrid = (list: Item[], startIndex = 0) => (
    <div className="levels-grid">
      {list.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className="level-card"
          style={{ animationDelay: `${Math.min(i, 20) * 0.03}s` }}
          onClick={() => onPick(item.id)}
        >
          <span className="level-emoji">{item.preview}</span>
          <span className="level-title">{item.title}</span>
          <span className="level-num">第 {startIndex + i + 1} 关</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="levels">
      <header className="levels-bar">
        <button type="button" className="back-btn" onClick={onBack} aria-label="返回">
          ←
        </button>
        <h2>{TITLES[category]}</h2>
        <span className="levels-count">
          {category === 'alphabet'
            ? `${letters.length} 字母 · ${words.length} 单词`
            : `${items.length} 关`}
        </span>
      </header>

      {category === 'alphabet' ? (
        <div className="levels-scroll">
          <h3 className="levels-section">字母关卡（A–Z）</h3>
          {renderGrid(
            letters.map((t) => ({
              id: t.id,
              title: t.title,
              preview: t.preview || t.title,
            })),
          )}
          <h3 className="levels-section">常用单词（100 关）</h3>
          {renderGrid(
            words.map((t) => ({
              id: t.id,
              title: t.title,
              preview: '📝',
            })),
            letters.length,
          )}
        </div>
      ) : (
        <div className="levels-scroll">{renderGrid(items)}</div>
      )}
    </div>
  )
}
