import { useEffect, useState } from 'react'
import { fetchMe, loadAuthSession, logoutAccount, saveAuthSession, type AuthSession } from './api'
import { AuthGate, Home } from './AuthScreens'
import { HanziLottery } from './HanziLottery'
import './index.css'

type Screen = 'home' | 'hanzi'

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession())
  const [ready, setReady] = useState(!loadAuthSession())
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    const cached = loadAuthSession()
    if (!cached) {
      setReady(true)
      return
    }
    fetchMe(cached.token)
      .then((user) => {
        const next = { token: cached.token, user }
        saveAuthSession(next)
        setSession(next)
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (/未登录|过期|失效|401/i.test(msg)) {
          saveAuthSession(null)
          setSession(null)
        }
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return <div className="boot">正在进入…</div>
  if (!session) {
    return (
      <div className="page">
        <AuthGate
          onAuthed={(s) => {
            setSession(s)
            setScreen('home')
          }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      {screen === 'hanzi' ? (
        <HanziLottery session={session} onBack={() => setScreen('home')} />
      ) : (
        <Home
          session={session}
          onPlay={() => setScreen('hanzi')}
          onLogout={() => {
            void logoutAccount(session.token)
            setSession(null)
          }}
        />
      )}
    </div>
  )
}
