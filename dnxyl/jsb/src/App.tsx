import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as PE, type ReactNode, type RefObject } from 'react'
import { fetchMe, fetchProgress, loadAuthSession, logoutAccount, pushProgress, saveAuthSession, type AuthSession } from './api'
import { AuthGate, Lobby } from './AuthScreens'
import gateBg from './assets/bg_gate_xiyou.png'
import { fitPlayFrame, onViewportChange, pinToViewport } from './fit'
import { ensureStages, loadArtForProgress, type ArtPack } from './game/assets'
import { StageMusic } from './game/audio'
import { Game } from './game/Game'
import { STAGE_COUNT, WX_COLORS, WX_NAMES } from './game/constants'
import type { GameProgress, HudSnap } from './game/types'
import './App.css'

function useFillViewport<T extends HTMLElement>(ref: RefObject<T | null>) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => pinToViewport(el)
    apply()
    return onViewportChange(apply)
  }, [ref])
}

function GateShell({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  useFillViewport(rootRef)
  return (
    <div className="app-root is-gate" ref={rootRef}>
      <img className="gate-scene" src={gateBg} alt="" />
      {children}
    </div>
  )
}

function canvasPng(c?: HTMLCanvasElement | null) {
  if (!c) return ''
  try {
    return c.toDataURL()
  } catch {
    return ''
  }
}

function waitFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
    else setTimeout(resolve, 0)
  })
}

function defaultProgress(): GameProgress {
  return {
    stage: 1,
    hp: 100,
    maxHp: 100,
    pillHp: 0,
    xiuwei: 0,
    wuXing: [0, 0, 0, 0, 0],
    cloneCount: 1,
    bonusShots: 0,
    bonusDmg: 1,
    bonusFire: 1,
    atkBonus: 0,
  }
}

const blank: HudSnap = {
  stage: 1,
  stageName: '补天五彩石',
  hp: 100,
  maxHp: 100,
  wuXing: [0, 0, 0, 0, 0],
  xiuwei: 0,
  needXiu: 0,
  shots: 1,
  dmgPct: 100,
  boltAtk: 18,
  clones: 1,
  canBreak: false,
  breaking: false,
  paused: false,
  loading: true,
  loadP: 0,
  ended: false,
  breakTitle: '',
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession())
  const [authReady, setAuthReady] = useState(!loadAuthSession())
  const [progress, setProgress] = useState<GameProgress | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const cached = loadAuthSession()
    if (!cached) {
      setAuthReady(true)
      return
    }
    fetchMe(cached.token)
      .then(async (user) => {
        const next = { token: cached.token, user }
        saveAuthSession(next)
        setSession(next)
        setProgress(await fetchProgress(cached.token).catch(() => defaultProgress()))
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err)
        if (/未登录|过期|失效|401|HTTP 401/i.test(msg)) {
          saveAuthSession(null)
          setSession(null)
        }
      })
      .finally(() => setAuthReady(true))
  }, [])

  if (!authReady) {
    return (
      <GateShell>
        <div className="gate">校验登录…</div>
      </GateShell>
    )
  }

  if (!session) {
    return (
      <GateShell>
        <AuthGate
          onAuthed={(s) => {
            setSession(s)
            setProgress(null)
            setPlaying(false)
            void fetchProgress(s.token).then(setProgress).catch(() => setProgress(defaultProgress()))
          }}
        />
      </GateShell>
    )
  }

  if (!playing) {
    return (
      <GateShell>
        {progress ? (
          <Lobby
            session={session}
            progress={progress}
            onPlay={() => setPlaying(true)}
            onLogout={() => {
              void logoutAccount(session.token)
              setSession(null)
              setProgress(null)
            }}
          />
        ) : (
          <div className="gate">读取存档…</div>
        )}
      </GateShell>
    )
  }

  return (
    <PlayView
      session={session}
      progress={progress}
      onProgress={setProgress}
      onLobby={() => setPlaying(false)}
      onLogout={() => {
        void logoutAccount(session.token)
        setSession(null)
        setProgress(null)
        setPlaying(false)
      }}
    />
  )
}

function PlayView({
  session,
  progress,
  onProgress,
  onLobby,
  onLogout,
}: {
  session: AuthSession
  progress: GameProgress | null
  onProgress: (p: GameProgress) => void
  onLobby: () => void
  onLogout: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game | null>(null)
  const artRef = useRef<ArtPack | null>(null)
  const tokenRef = useRef(session.token)
  const bootProgress = useRef(progress)
  tokenRef.current = session.token
  const [hud, setHud] = useState<HudSnap>(blank)
  const [boot, setBoot] = useState('正在载入本关素材…')
  const [err, setErr] = useState('')
  const [face, setFace] = useState('')

  useEffect(() => {
    let dead = false
    const hold: { music: StageMusic | null; game: Game | null } = { music: null, game: null }
    const saved = bootProgress.current
    const startStage = Math.max(1, Math.min(STAGE_COUNT, saved?.stage || 1))
    loadArtForProgress(startStage, (done, total) => {
      if (!dead) setBoot(`正在载入本关素材… ${done}/${total}`)
    })
      .then(async (art) => {
        if (dead) return
        let canvas = canvasRef.current
        for (let i = 0; !canvas && i < 40; i++) {
          await waitFrame()
          canvas = canvasRef.current
        }
        if (!canvas) {
          setErr('画布未就绪，请刷新重试')
          return
        }
        artRef.current = art
        setBoot('')
        setFace(canvasPng(art.portraits[startStage - 1]))
        hold.music = new StageMusic()
        hold.game = new Game(canvas, art, hold.music, setHud, {
          progress: saved || undefined,
          onSave: (p) => {
            onProgress(p)
            void pushProgress(tokenRef.current, p).catch(() => {})
          },
          onAdvance: (stage) => {
            if (stage > STAGE_COUNT) return
            void ensureStages(art, [stage]).then(() => {
              if (!dead) setFace(canvasPng(art.portraits[Math.max(0, (hold.game?.stage || stage) - 1)]))
            })
          },
        })
        gameRef.current = hold.game
        hold.game.start()
        const next = startStage + 1
        if (next <= STAGE_COUNT) void ensureStages(art, [next])
      })
      .catch((e: unknown) => {
        if (!dead) setErr(e instanceof Error ? e.message : '素材载入失败')
      })
    const onHide = () => {
      const snap = gameRef.current?.snapshot()
      if (snap) void pushProgress(tokenRef.current, snap).catch(() => {})
    }
    window.addEventListener('pagehide', onHide)
    return () => {
      dead = true
      onHide()
      window.removeEventListener('pagehide', onHide)
      hold.game?.destroy()
      hold.music?.dispose()
      gameRef.current = null
    }
    // 只在进入游戏时加载当前关+下一关，存档回写不得重载整局
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const art = artRef.current
    if (!art) return
    const i = Math.max(0, hud.stage - 1)
    if (art.portraits[i]) setFace(canvasPng(art.portraits[i]))
  }, [hud.stage])

  useLayoutEffect(() => {
    const root = rootRef.current
    const frame = frameRef.current
    if (!root || !frame) return
    const apply = () => {
      pinToViewport(root)
      fitPlayFrame(frame, root)
    }
    apply()
    return onViewportChange(apply)
  }, [])

  const aim = (e: PE<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    const box = frameRef.current?.getBoundingClientRect()
    if (!box || box.width <= 0) return
    gameRef.current?.setPointer((e.clientX - box.left) / box.width)
  }

  const onDown = (e: PE<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    aim(e)
  }

  const qi = hud.wuXing.reduce((a, b) => a + b, 0)
  const expText = hud.stage === 1 ? `EXP ${qi}` : `EXP ${hud.xiuwei}`

  return (
    <div className="app-root" ref={rootRef}>
      <div className="phone-frame" ref={frameRef} onPointerDown={onDown} onPointerMove={aim}>
        <canvas ref={canvasRef} />
        {boot && !err ? <div className="boot">{boot}</div> : null}
        {err ? <div className="err">{err}</div> : null}
        {!hud.loading && !err ? (
          <div className="hud">
            <div className="hud-stage">第{hud.stage}关</div>
            <div className="hud-exp">
              {expText}
              {hud.stage >= 2 ? <span>分身 {hud.clones}</span> : null}
              <span>攻 {hud.boltAtk}</span>
            </div>
            <button type="button" className="pause-btn" onClick={() => gameRef.current?.togglePause()}>
              {hud.paused ? '▶' : '⏸'}
            </button>
            {hud.stage === 1 ? (
              <div className="wx-row">
                {WX_NAMES.map((n, i) => (
                  <div className="wx" key={n}>
                    <i style={{ width: `${(hud.wuXing[i] / 20) * 100}%`, background: WX_COLORS[i] }} />
                    <span>
                      {n} {hud.wuXing[i]}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="dock">
              {face ? <img className="dock-face" src={face} alt="" /> : null}
              <div className="hp">
                <i style={{ width: `${Math.max(0, Math.min(1, hud.hp / hud.maxHp)) * 100}%` }} />
                <span>
                  {Math.round(hud.hp)} / {Math.round(hud.maxHp)}
                </span>
              </div>
            </div>
            {hud.canBreak || hud.breaking || hud.ended ? (
              <div className="veil">
                <div className="veil-card">
                  <h2>{hud.ended ? '金身问道 · 学成出师' : hud.breakTitle}</h2>
                  <p>
                    {hud.ended
                      ? '方寸山法成，可继续问道，或暂停返回。'
                      : hud.breaking
                        ? '破关中…'
                        : '点击突破'}
                  </p>
                  {hud.canBreak && !hud.breaking ? (
                    <button type="button" className="break-btn inline" onClick={() => gameRef.current?.clickBreak()}>
                      突破
                    </button>
                  ) : null}
                </div>
              </div>
            ) : hud.paused ? (
              <div className="veil">
                <div className="veil-card">
                  <h2>已暂停</h2>
                  <p>
                    第{hud.stage}关 · 生命 {Math.round(hud.hp)}/{Math.round(hud.maxHp)}
                  </p>
                  <button type="button" className="break-btn inline" onClick={() => gameRef.current?.togglePause()}>
                    继续
                  </button>
                  <button
                    type="button"
                    className="break-btn inline gate-sub"
                    onClick={() => {
                      const snap = gameRef.current?.snapshot()
                      if (snap) {
                        onProgress(snap)
                        void pushProgress(session.token, snap).catch(() => {})
                      }
                      onLobby()
                    }}
                  >
                    返回大厅
                  </button>
                  <button type="button" className="break-btn inline gate-sub" onClick={onLogout}>
                    退出登录
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
