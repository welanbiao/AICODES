import type { CSSProperties } from 'react'
import type { Skill } from './worlds'
import { COVER, officialWorlds } from './worlds'

export type CharacterArtCardProps = {
  id: string
  name: string
  grade?: string
  nickname?: string
  skills?: Skill[]
  className?: string
  style?: CSSProperties
}

const GRADE_CLASS: Record<string, string> = {
  UR: 'grade-ur',
  SSR: 'grade-ssr',
  SR: 'grade-sr',
  R: 'grade-r',
  N: 'grade-n',
}

function coverFallback(id: string) {
  const worldId = id.split('_').slice(0, 2).join('_')
  const world = officialWorlds.find((w) => w.id === worldId)
  return COVER[world?.coverKey ?? 'classics']
}

export function CharacterArtCard({
  id,
  name,
  grade = 'R',
  nickname,
  skills = [],
  className = '',
  style,
}: CharacterArtCardProps) {
  const gradeKey = grade.toUpperCase()
  const gradeClass = GRADE_CLASS[gradeKey] ?? GRADE_CLASS.R

  return (
    <div className={`char-3d char-art-card ${className}`.trim()} style={style}>
      <img
        src={`/art/cards/${id}.jpg`}
        alt={name}
        onError={(e) => { e.currentTarget.src = coverFallback(id) }}
      />
      <div className="char-art-overlay" aria-hidden />
      <div className="char-art-text">
        <div className="char-art-head">
          <div className="char-art-title">
            <strong className={gradeClass}>{name}</strong>
            {nickname ? <span className="char-art-nick">{nickname}</span> : null}
          </div>
          <span className={`char-art-badge ${gradeClass}`}>{gradeKey}</span>
        </div>
        {skills.length > 0 && (
          <ul className="char-art-skills">
            {skills.slice(0, 3).map((s) => (
              <li key={s.name}>
                <em>{s.name}</em>
                <small>{s.description}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
