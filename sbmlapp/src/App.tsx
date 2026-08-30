import { useState, type ReactNode } from 'react'
import type { AppScreen, CategoryId, OrientationMode } from './types'
import HomeScreen from './components/HomeScreen'
import LevelSelect from './components/LevelSelect'
import DrawingScreen from './components/DrawingScreen'
import MathScreen from './components/MathScreen'
import PuzzleScreen from './components/PuzzleScreen'
import { getTemplate } from './data/templates'
import { getMathLevel } from './data/mathLevels'
import { getPuzzleLevel } from './data/puzzleLevels'
import BgmPlayer from './components/BgmPlayer'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>({ name: 'home' })
  const [orientation, setOrientation] = useState<OrientationMode>('landscape')

  const openCategory = (category: CategoryId) => {
    setScreen({ name: 'levels', category })
  }

  const openLevel = (category: CategoryId, levelId: string) => {
    if (category === 'math') {
      setScreen({ name: 'math', levelId })
    } else if (category === 'puzzle') {
      setScreen({ name: 'puzzle', levelId })
    } else {
      setScreen({ name: 'draw', category, levelId })
    }
  }

  const goHome = () => setScreen({ name: 'home' })
  const goLevels = (category: CategoryId) => setScreen({ name: 'levels', category })

  const toggleOrientation = () => {
    setOrientation((o) => (o === 'landscape' ? 'portrait' : 'landscape'))
  }

  let content: ReactNode = null

  if (screen.name === 'home') {
    content = <HomeScreen onSelect={openCategory} orientation={orientation} />
  } else if (screen.name === 'levels') {
    content = (
      <LevelSelect
        category={screen.category}
        onBack={goHome}
        onPick={(id) => openLevel(screen.category, id)}
      />
    )
  } else if (screen.name === 'draw') {
    const template = getTemplate(screen.levelId)
    content = template ? (
      <DrawingScreen
        template={template}
        onBack={() => goLevels(screen.category)}
        orientation={orientation}
      />
    ) : (
      <LevelSelect
        category={screen.category}
        onBack={goHome}
        onPick={(id) => openLevel(screen.category, id)}
      />
    )
  } else if (screen.name === 'math') {
    const level = getMathLevel(screen.levelId)
    content = level ? (
      <MathScreen level={level} onBack={() => goLevels('math')} />
    ) : (
      <LevelSelect category="math" onBack={goHome} onPick={(id) => openLevel('math', id)} />
    )
  } else if (screen.name === 'puzzle') {
    const level = getPuzzleLevel(screen.levelId)
    content = level ? (
      <PuzzleScreen level={level} onBack={() => goLevels('puzzle')} />
    ) : (
      <LevelSelect category="puzzle" onBack={goHome} onPick={(id) => openLevel('puzzle', id)} />
    )
  }

  return (
    <div className="app-root">
      <div className={`tablet-11 ${orientation}`}>
        {content}
        <BgmPlayer />
        <button
          type="button"
          className="orient-toggle"
          onClick={toggleOrientation}
          title={orientation === 'landscape' ? '切换竖屏' : '切换横屏'}
        >
          {orientation === 'landscape' ? '竖屏' : '横屏'}
        </button>
      </div>
    </div>
  )
}
