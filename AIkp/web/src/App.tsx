import { useEffect, useMemo, useState } from 'react'
import {
  fetchMe,
  loadAuthSession,
  loginAccount,
  logoutAccount,
  rateCard,
  registerAccount,
  reviewText,
  saveAuthSession,
  updateProfileNickname,
  validateCard,
  validateWorld,
  type AuthSession,
} from './api'
import { composeBattleReport } from './battleNarration'
import { CharacterArtCard } from './CharacterArtCard'
import { COVER, GENRE_LABEL, officialWorlds, type SmallWorld, type WorldGenre, type WorldPreset, type Skill } from './worlds'
import './App.css'

type Screen = 'home' | 'worlds' | 'world' | 'createWorld' | 'create' | 'ranked' | 'battle' | 'collection' | 'profile'
type Kind = 'online' | 'practice'
type Mode = '1v1' | '3v3'
type RolePref = 'defender' | 'challenger' | 'any'

type CardItem = {
  id: string
  name: string
  lore: string
  grade: string
  skills: string[]
  worldId: string
  worldTitle: string
  comment?: string
}

const MODERN = ['机甲', '激光', '核弹', '手机', '电脑', '导弹', '坦克', '步枪']

function parseCardSkills(raw: string[]): Skill[] {
  return raw.map((s) => {
    const idx = s.indexOf('：')
    if (idx < 0) return { name: s, description: '' }
    return { name: s.slice(0, idx), description: s.slice(idx + 1) }
  })
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => loadAuthSession())
  const [authReady, setAuthReady] = useState(!loadAuthSession())

  useEffect(() => {
    const cached = loadAuthSession()
    if (!cached) {
      setAuthReady(true)
      return
    }
    fetchMe(cached.token)
      .then((user) => {
        const next = { token: cached.token, user }
        saveAuthSession(next)
        setSession(next)
      })
      .catch(() => {
        saveAuthSession(null)
        setSession(null)
      })
      .finally(() => setAuthReady(true))
  }, [])

  if (!authReady) {
    return (
      <div className="app">
        <section className="screen hall">
          <h2 className="section-title">AI卡牌</h2>
          <p className="sub">校验登录…</p>
        </section>
      </div>
    )
  }

  if (!session) {
    return (
      <AuthGate
        onAuthed={(s) => {
          setSession(s)
        }}
      />
    )
  }

  return (
    <GameApp
      session={session}
      onSession={(s) => setSession(s)}
      onLogout={async () => {
        await logoutAccount(session.token)
        setSession(null)
      }}
    />
  )
}

function AuthGate({ onAuthed }: { onAuthed: (s: AuthSession) => void }) {
  const [modeRegister, setModeRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const session = modeRegister
        ? await registerAccount(username.trim(), password, nickname.trim() || username.trim())
        : await loginAccount(username.trim(), password)
      onAuthed(session)
    } catch (e) {
      setError(e instanceof Error ? e.message : '失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <section className="screen hall">
        <h2 className="section-title">AI卡牌</h2>
        <p className="sub">{modeRegister ? '注册账号 · 数据存于服务器文件' : '登录进入小世界'}</p>
        <input
          className="field"
          placeholder="账号（3~16位）"
          value={username}
          onChange={(e) => setUsername(e.target.value.slice(0, 16))}
          disabled={busy}
        />
        <input
          className="field"
          type="password"
          placeholder="密码（至少6位）"
          value={password}
          onChange={(e) => setPassword(e.target.value.slice(0, 64))}
          disabled={busy}
        />
        {modeRegister && (
          <input
            className="field"
            placeholder="昵称（可选）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 12))}
            disabled={busy}
          />
        )}
        {error && <p className="error-box">{error}</p>}
        <button className="art-cta" disabled={busy || username.length < 3 || password.length < 6} onClick={submit}>
          {busy ? '请稍候…' : modeRegister ? '注册并进入' : '登录'}
        </button>
        <button className="chip" disabled={busy} onClick={() => setModeRegister((v) => !v)}>
          {modeRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </button>
        <p className="hint">需先启动 ai-bridge（默认 http://127.0.0.1:8787）</p>
      </section>
    </div>
  )
}

function GameApp({
  session,
  onSession,
  onLogout,
}: {
  session: AuthSession
  onSession: (s: AuthSession) => void
  onLogout: () => void
}) {
  const [screen, setScreen] = useState<Screen>('home')
  const [kind, setKind] = useState<Kind>('online')
  const [mode, setMode] = useState<Mode>('1v1')
  const [role, setRole] = useState<RolePref>('challenger')
  const [matchPhase, setMatchPhase] = useState<'idle' | 'queued' | 'finished'>('idle')
  const [nickname, setNickname] = useState(session.user.nickname)
  const [worlds, setWorlds] = useState<SmallWorld[]>(officialWorlds)
  const [activeWorldId, setActiveWorldId] = useState(officialWorlds[0].id)
  const [genreFilter, setGenreFilter] = useState<WorldGenre | 'ALL'>('ALL')
  const [cards, setCards] = useState<CardItem[]>([])
  const [selectedCardId, setSelectedCardId] = useState('')

  const [cardName, setCardName] = useState('')
  const [cardLore, setCardLore] = useState('')
  const [skill1Name, setSkill1Name] = useState('')
  const [skill1Desc, setSkill1Desc] = useState('')
  const [skill2Name, setSkill2Name] = useState('')
  const [skill2Desc, setSkill2Desc] = useState('')
  const [skill3Name, setSkill3Name] = useState('')
  const [skill3Desc, setSkill3Desc] = useState('')
  const [query, setQuery] = useState('')
  const [faction, setFaction] = useState<string | null>(null)
  const [editing, setEditing] = useState<WorldPreset | null>(null)

  const [wTitle, setWTitle] = useState('')
  const [wGenre, setWGenre] = useState<WorldGenre>('NOVEL')
  const [wSource, setWSource] = useState('')
  const [wLore, setWLore] = useState('')
  const [wCanon, setWCanon] = useState('')

  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const world = worlds.find((w) => w.id === activeWorldId) ?? worlds[0]
  const worldCards = cards.filter((c) => c.worldId === world.id)
  const featured = worlds[0]
  const filtered = worlds.filter((w) => genreFilter === 'ALL' || w.genre === genreFilter)
  const factions = useMemo(
    () => [...new Set(world.presets.map((p) => p.faction).filter(Boolean))],
    [world],
  )
  const filteredPresets = useMemo(() => {
    const q = query.trim()
    return world.presets.filter((p) => {
      if (faction && p.faction !== faction) return false
      if (!q) return true
      return p.name.includes(q) || p.nickname.includes(q) || p.lore.includes(q) || p.faction.includes(q)
    })
  }, [world, query, faction])

  const navActive = useMemo(() => {
    if (screen === 'world' || screen === 'createWorld' || screen === 'create') return 'worlds'
    if (screen === 'battle') return 'ranked'
    return screen
  }, [screen])

  const battleReport = useMemo(() => {
    const mine = cards.find((c) => c.id === selectedCardId)
    const foe = world.presets.find((p) => p.id !== selectedCardId) ?? world.presets[0]
    return composeBattleReport(
      world.title,
      world.lore,
      { name: foe?.name ?? '守擂者', skill: foe?.skills[0]?.name ?? '护体' },
      {
        name: mine?.name ?? '挑战者',
        skill: (mine?.skills[0] ?? '试探').split('：')[0],
      },
      true,
    )
  }, [cards, selectedCardId, world])

  function go(next: Screen) {
    if (next === 'battle') setMatchPhase('queued')
    setError(null)
    setStatus(null)
    setScreen(next)
  }

  function showToast(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2200)
  }

  function openWorld(id: string) {
    setActiveWorldId(id)
    setQuery('')
    setFaction(null)
    setEditing(null)
    go('world')
  }

  function startEdit(preset: WorldPreset) {
    setEditing(preset)
    setCardName(preset.name)
    setCardLore(preset.lore)
    setSkill1Name(preset.skills[0]?.name ?? '')
    setSkill1Desc(preset.skills[0]?.description ?? '')
    setSkill2Name(preset.skills[1]?.name ?? '')
    setSkill2Desc(preset.skills[1]?.description ?? '')
    setSkill3Name(preset.skills[2]?.name ?? '')
    setSkill3Desc(preset.skills[2]?.description ?? '')
    setError(null)
    setStatus(null)
  }

  function claimPreset(preset: WorldPreset) {
    if (cards.some((c) => c.id === preset.id)) {
      showToast(`「${preset.name}」已在卡册`)
      return
    }
    const item: CardItem = {
      id: preset.id,
      name: preset.name,
      lore: preset.lore,
      grade: preset.grade,
      skills: preset.skills.map((s) => `${s.name}：${s.description}`),
      worldId: preset.worldId,
      worldTitle: world.title,
      comment: `入世 · ${preset.roleHint}`,
    }
    setCards((prev) => [item, ...prev])
    setSelectedCardId(item.id)
    showToast(`已选用「${preset.name}」`)
  }

  async function submitWorld() {
    setError(null)
    const errors = validateWorld(wTitle, wSource, wLore, wCanon)
    if (errors.length) {
      setError(errors.join('\n'))
      return
    }
    setBusy(true)
    setStatus('正在审核小世界…')
    try {
      const review = await reviewText('小世界背景', wLore.trim(), {
        title: wTitle,
        lore: wLore,
        canonHint: wCanon,
      })
      if (!review.passed) throw new Error(review.reason || '世界审核未通过')
      const item: SmallWorld = {
        id: `u_${crypto.randomUUID()}`,
        title: wTitle.trim(),
        genre: wGenre,
        sourceHint: wSource.trim() || GENRE_LABEL[wGenre],
        lore: review.cleanedText.slice(0, 80),
        fullLore: review.cleanedText,
        canonHint: wCanon.trim(),
        coverKey: wGenre === 'HISTORY' ? 'history' : wGenre === 'DRAMA' ? 'drama' : wGenre === 'CLASSICS' ? 'classics' : 'novel',
        official: false,
        presets: [],
      }
      setWorlds((prev) => [item, ...prev])
      setActiveWorldId(item.id)
      showToast(`小世界「${item.title}」已开启`)
      go('world')
    } catch (e) {
      setError(e instanceof Error ? e.message : '审核失败')
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }

  async function submitCard() {
    setError(null)
    const skills = [
      { name: skill1Name.trim(), description: skill1Desc.trim() },
      { name: skill2Name.trim(), description: skill2Desc.trim() },
      { name: skill3Name.trim(), description: skill3Desc.trim() },
    ].filter((s) => s.name || s.description)
    const errors = validateCard(cardName, cardLore, skills)
    const blob = cardName + cardLore + skills.map((s) => s.name + s.description).join('')
    if (['HISTORY', 'CLASSICS', 'DRAMA'].includes(world.genre)) {
      MODERN.filter((w) => blob.includes(w)).forEach((w) => errors.push(`「${w}」超出「${world.title}」时代设定`))
    }
    if (errors.length) {
      setError(errors.join('\n'))
      return
    }
    setBusy(true)
    setStatus('审核是否越出小世界…')
    try {
      const loreReview = await reviewText('卡牌人物设定', cardLore.trim(), world)
      if (!loreReview.passed) throw new Error(loreReview.reason || '设定审核未通过')
      setStatus('审核通过，正在初创评级…')
      const skillsText = skills.map((s) => `- ${s.name}:${s.description}`).join('\n')
      const rate = await rateCard(cardName.trim(), loreReview.cleanedText, skillsText, world.title)
      const item: CardItem = {
        id: crypto.randomUUID(),
        name: cardName.trim(),
        lore: loreReview.cleanedText,
        grade: rate.grade || 'R',
        skills: skills.map((s) => `${s.name}：${s.description}`),
        worldId: world.id,
        worldTitle: world.title,
        comment: rate.comment,
      }
      setCards((prev) => [item, ...prev])
      setSelectedCardId(item.id)
      showToast(`「${item.name}」已入「${world.title}」`)
      setEditing(null)
      go('world')
    } catch (e) {
      setError(e instanceof Error ? e.message : '审核失败')
    } finally {
      setBusy(false)
      setStatus(null)
    }
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        <div className="dev-tag">AI卡牌 · 小世界对决</div>
        <div className="phone">
          <div className="notch">9:41</div>

          {screen === 'home' && (
            <section className="screen hall">
              <div className="row">
                <div>
                  <h1 className="brand">AI卡牌</h1>
                  <div>{nickname} · 新锐</div>
                </div>
                <div className="jade">综合 {86 + cards.length * 4}</div>
              </div>
              <button className="cover-card" onClick={() => openWorld(featured.id)}>
                {featured.official && <i className="badge">官方</i>}
                <img src={COVER[featured.coverKey]} alt="" />
                <span>
                  <em>{GENRE_LABEL[featured.genre]}</em>
                  <strong>{featured.title}</strong>
                  <small>{featured.lore}</small>
                </span>
              </button>
              <button className="art-cta battle" onClick={() => go('ranked')}>
                <img src="/art/btn_battle.png" alt="" />
                <span>开 战</span>
              </button>
              <div className="cta-row">
                <button className="art-cta" onClick={() => go('worlds')}>
                  <img src="/art/btn_world.png" alt="" />
                  <span>小世界</span>
                </button>
                <button className="art-cta" onClick={() => { setActiveWorldId(featured.id); go('create') }}>
                  <img src="/art/btn_forge.png" alt="" />
                  <span>铸造</span>
                </button>
              </div>
              <button className="art-cta" onClick={() => go('createWorld')}>
                <img src="/art/btn_create.png" alt="" />
                <span>创建小世界</span>
              </button>
              <h2 className="section-title" style={{ fontSize: 20, marginTop: 18 }}>最近卡牌</h2>
              {cards.length === 0 && <p className="hint">进入小世界选用人物或铸造卡牌</p>}
              {cards.slice(0, 4).map((card) => (
                <div className="card" key={card.id}>
                  <div className="row">
                    <strong>{card.name}</strong>
                    <span className="grade">{card.grade}</span>
                  </div>
                  <div className="jade" style={{ fontSize: 12, marginTop: 4 }}>世界 · {card.worldTitle}</div>
                </div>
              ))}
            </section>
          )}

          {screen === 'worlds' && (
            <section className="screen hall">
              <h2 className="section-title">小世界</h2>
              <p className="sub">进入世界铸卡；点选人物可原样选用或修改后入库</p>
              <div>
                <button className={`chip ${genreFilter === 'ALL' ? 'on' : ''}`} onClick={() => setGenreFilter('ALL')}>全部</button>
                {(['CLASSICS', 'HISTORY', 'DRAMA', 'NOVEL'] as WorldGenre[]).map((g) => (
                  <button key={g} className={`chip ${genreFilter === g ? 'on' : ''}`} onClick={() => setGenreFilter(g)}>
                    {GENRE_LABEL[g]}
                  </button>
                ))}
              </div>
              <button className="art-cta" onClick={() => go('createWorld')}>
                <img src="/art/btn_create.png" alt="" />
                <span>创建我的小世界</span>
              </button>
              {filtered.map((w) => (
                <button key={w.id} className="cover-card" onClick={() => openWorld(w.id)}>
                  {w.official && <i className="badge">官方</i>}
                  <img src={COVER[w.coverKey]} alt="" />
                  <span>
                    <em>{GENRE_LABEL[w.genre]}{w.official ? ' · 官方' : ''}</em>
                    <strong>{w.title}</strong>
                    <small>{w.lore}</small>
                  </span>
                </button>
              ))}
            </section>
          )}

          {screen === 'world' && (
            <section className="screen hall">
              {editing ? (
                <>
                  <button className="chip" onClick={() => { setEditing(null); setError(null) }} disabled={busy}>取消</button>
                  <h2 className="section-title">修改人物设定</h2>
                  <div style={{ maxWidth: 220, margin: '0 auto 10px' }}>
                    <CharacterArtCard
                      id={editing.id}
                      name={editing.name}
                      grade={editing.grade}
                      nickname={editing.nickname}
                      skills={editing.skills}
                    />
                  </div>
                  <p className="sub">{editing.faction} · {editing.nickname || editing.roleHint}</p>
                  <p className="hint">{editing.fullLore}</p>
                  <input className="field" value={cardName} onChange={(e) => setCardName(e.target.value.slice(0, 12))} placeholder="名称" disabled={busy} />
                  <textarea className="field" rows={2} value={cardLore} onChange={(e) => setCardLore(e.target.value.slice(0, 60))} placeholder="人物设定 ≤60字" disabled={busy} />
                  <input className="field" value={skill1Name} onChange={(e) => setSkill1Name(e.target.value.slice(0, 8))} placeholder="技能一名" disabled={busy} />
                  <input className="field" value={skill1Desc} onChange={(e) => setSkill1Desc(e.target.value.slice(0, 20))} placeholder="技能一描述≤20字" disabled={busy} />
                  <input className="field" value={skill2Name} onChange={(e) => setSkill2Name(e.target.value.slice(0, 8))} placeholder="技能二名（可选）" disabled={busy} />
                  <input className="field" value={skill2Desc} onChange={(e) => setSkill2Desc(e.target.value.slice(0, 20))} placeholder="技能二描述（可选）" disabled={busy} />
                  <input className="field" value={skill3Name} onChange={(e) => setSkill3Name(e.target.value.slice(0, 8))} placeholder="技能三名（可选）" disabled={busy} />
                  <input className="field" value={skill3Desc} onChange={(e) => setSkill3Desc(e.target.value.slice(0, 20))} placeholder="技能三描述（可选）" disabled={busy} />
                  {status && <p className="jade">{status}</p>}
                  {error && <pre className="error-box">{error}</pre>}
                  <button className="art-cta compact" onClick={() => { claimPreset(editing); setEditing(null) }} disabled={busy}>
                    <img src="/art/btn_jade.png" alt="" />
                    <span>按原设定选用</span>
                  </button>
                  <button className="art-cta" onClick={submitCard} disabled={busy}>
                    <img src="/art/btn_brass.png" alt="" />
                    <span>{busy ? 'AI 审核中…' : '提交修改并审核入库'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button className="chip" onClick={() => go('worlds')}>返回</button>
                  <div className="cover-card static">
                    {world.official && <i className="badge">官方</i>}
                    <img src={COVER[world.coverKey]} alt="" />
                    <span>
                      <em>{GENRE_LABEL[world.genre]}{world.official ? ' · 官方' : ''}</em>
                      <strong>{world.title}</strong>
                      <small>{world.lore}</small>
                    </span>
                  </div>
                  <p className="card hint" style={{ marginTop: 0 }}>{world.fullLore}</p>
                  <p className="jade" style={{ fontSize: 12 }}>战场（锁定）：{world.lore}</p>
                  <p className="jade" style={{ fontSize: 12 }}>题材约束：{world.canonHint}</p>
                  <button className="art-cta" onClick={() => {
                    setEditing(null)
                    setCardName('')
                    setCardLore('')
                    setSkill1Name('')
                    setSkill1Desc('')
                    setSkill2Name('')
                    setSkill2Desc('')
                    setSkill3Name('')
                    setSkill3Desc('')
                    go('create')
                  }}>
                    <img src="/art/btn_forge.png" alt="" />
                    <span>空白铸造</span>
                  </button>
                  <button className="art-cta battle" onClick={() => go('ranked')}>
                    <img src="/art/btn_battle.png" alt="" />
                    <span>在此对战</span>
                  </button>
                  {world.presets.length > 0 && (
                    <>
                      <p style={{ color: 'var(--brass)' }}>点选人物：可原样入库，也可改设定后再提交审核 · {world.presets.length} 人</p>
                      <input
                        className="field"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="搜索人物 / 绰号 / 阵营"
                      />
                      <div>
                        <button className={`chip ${faction == null ? 'on' : ''}`} onClick={() => setFaction(null)}>全部 {world.presets.length}</button>
                        {factions.map((f) => (
                          <button key={f} className={`chip ${faction === f ? 'on' : ''}`} onClick={() => setFaction(f)}>
                            {f} {world.presets.filter((p) => p.faction === f).length}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {filteredPresets.length > 0 && (
                    <div className="char-grid">
                      {filteredPresets.map((c) => (
                        <div className="char-3d-wrap" key={c.id}>
                          <CharacterArtCard
                            id={c.id}
                            name={c.name}
                            grade={c.grade}
                            nickname={c.nickname}
                            skills={c.skills}
                          />
                          <div className="btn-row">
                            <button className="art-cta compact" onClick={() => claimPreset(c)} disabled={cards.some((x) => x.id === c.id)}>
                              <img src="/art/btn_jade.png" alt="" />
                              <span>{cards.some((x) => x.id === c.id) ? '已选用' : '选用'}</span>
                            </button>
                            <button className="art-cta compact" onClick={() => startEdit(c)}>
                              <img src="/art/btn_brass.png" alt="" />
                              <span>修改</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p style={{ color: 'var(--brass)' }}>本世界卡牌 {worldCards.length}</p>
                  {worldCards.length > 0 && (
                    <div className="char-grid">
                      {worldCards.map((card) => (
                        <CharacterArtCard
                          key={card.id}
                          id={card.id}
                          name={card.name}
                          grade={card.grade}
                          skills={parseCardSkills(card.skills)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {screen === 'createWorld' && (
            <section className="screen hall">
              <button className="chip" onClick={() => go('worlds')} disabled={busy}>返回</button>
              <h2 className="section-title">创建小世界</h2>
              <p className="sub">背景即战场，他人进入后只能按此设定铸卡</p>
              <input className="field" value={wTitle} onChange={(e) => setWTitle(e.target.value.slice(0, 12))} placeholder="世界名" disabled={busy} />
              <div>
                {(['CLASSICS', 'HISTORY', 'DRAMA', 'NOVEL', 'CUSTOM'] as WorldGenre[]).map((g) => (
                  <button key={g} className={`chip ${wGenre === g ? 'on' : ''}`} onClick={() => setWGenre(g)}>{GENRE_LABEL[g]}</button>
                ))}
              </div>
              <input className="field" value={wSource} onChange={(e) => setWSource(e.target.value.slice(0, 16))} placeholder="出处（三国演义 / 大秦 / 自定义）" disabled={busy} />
              <textarea className="field" rows={2} value={wLore} onChange={(e) => setWLore(e.target.value.slice(0, 80))} placeholder="世界背景＝战场 ≤80字" disabled={busy} />
              <textarea className="field" rows={2} value={wCanon} onChange={(e) => setWCanon(e.target.value.slice(0, 40))} placeholder="允许的技能题材 ≤40字" disabled={busy} />
              {status && <p className="jade">{status}</p>}
              {error && <pre className="error-box">{error}</pre>}
              <button className="art-cta" onClick={submitWorld} disabled={busy}>
                <img src="/art/btn_create.png" alt="" />
                <span>{busy ? '审核中…' : '提交审核并开启世界'}</span>
              </button>
            </section>
          )}

          {screen === 'create' && (
            <section className="screen hall">
              <button className="chip" onClick={() => go('world')} disabled={busy}>返回</button>
              <h2 className="section-title">铸造卡牌</h2>
              <p className="sub">{world.title} · 战场：{world.lore}</p>
              <p className="jade" style={{ fontSize: 12 }}>不得超出：{world.canonHint}</p>
              <input className="field" value={cardName} onChange={(e) => setCardName(e.target.value.slice(0, 12))} placeholder="名称" disabled={busy} />
              <textarea className="field" rows={2} value={cardLore} onChange={(e) => setCardLore(e.target.value.slice(0, 60))} placeholder="人物设定" disabled={busy} />
              <input className="field" value={skill1Name} onChange={(e) => setSkill1Name(e.target.value.slice(0, 8))} placeholder="技能一名" disabled={busy} />
              <input className="field" value={skill1Desc} onChange={(e) => setSkill1Desc(e.target.value.slice(0, 20))} placeholder="技能一描述≤20字" disabled={busy} />
              <input className="field" value={skill2Name} onChange={(e) => setSkill2Name(e.target.value.slice(0, 8))} placeholder="技能二名（可选）" disabled={busy} />
              <input className="field" value={skill2Desc} onChange={(e) => setSkill2Desc(e.target.value.slice(0, 20))} placeholder="技能二描述（可选）" disabled={busy} />
              <input className="field" value={skill3Name} onChange={(e) => setSkill3Name(e.target.value.slice(0, 8))} placeholder="技能三名（可选）" disabled={busy} />
              <input className="field" value={skill3Desc} onChange={(e) => setSkill3Desc(e.target.value.slice(0, 20))} placeholder="技能三描述（可选）" disabled={busy} />
              {status && <p className="jade">{status}</p>}
              {error && <pre className="error-box">{error}</pre>}
              <button className="art-cta" onClick={submitCard} disabled={busy}>
                <img src="/art/btn_forge.png" alt="" />
                <span>{busy ? 'AI 审核中…' : '提交审核入库'}</span>
              </button>
            </section>
          )}

          {screen === 'ranked' && (
            <section className="screen battle-bg">
              <h2 className="section-title">排位对决</h2>
              <p className="sub">同一小世界匹配；战场锁定为该世界背景</p>
              <div>
                <button className={`chip ${kind === 'online' ? 'on' : ''}`} onClick={() => setKind('online')}>联机排位</button>
                <button className={`chip ${kind === 'practice' ? 'on' : ''}`} onClick={() => setKind('practice')}>练习战</button>
              </div>
              <div>
                <button className={`chip ${mode === '1v1' ? 'on' : ''}`} onClick={() => setMode('1v1')}>一对一</button>
                <button className={`chip ${mode === '3v3' ? 'on' : ''}`} onClick={() => setMode('3v3')}>三对三</button>
              </div>
              <div>
                <button className={`chip jade ${role === 'defender' ? 'on' : ''}`} onClick={() => setRole('defender')}>守擂</button>
                <button className={`chip jade ${role === 'challenger' ? 'on' : ''}`} onClick={() => setRole('challenger')}>挑战</button>
                <button className={`chip jade ${role === 'any' ? 'on' : ''}`} onClick={() => setRole('any')}>任意</button>
              </div>
              <p style={{ margin: '10px 0 6px' }}>选择小世界（战场）</p>
              {worlds.map((w) => (
                <div key={w.id} className={`card ${activeWorldId === w.id ? 'selected' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveWorldId(w.id)}>
                  {w.title}｜{w.lore}
                </div>
              ))}
              <p>选择卡组 · 仅本世界卡</p>
              {worldCards.map((card) => (
                <div key={card.id} className={`card ${selectedCardId === card.id ? 'selected' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedCardId(card.id)}>
                  <div className="row"><strong>{card.name}</strong><span className="grade">{card.grade}</span></div>
                </div>
              ))}
              {worldCards.length === 0 && <p className="hint">该世界还没有卡，先去选用人物或铸造。</p>}
              <button className="art-cta battle" onClick={() => go('battle')} disabled={!selectedCardId}>
                <img src="/art/btn_battle.png" alt="" />
                <span>{kind === 'online' ? '开始同世界匹配' : '开始练习战'}</span>
              </button>
            </section>
          )}

          {screen === 'battle' && (
            <section className="screen battle-bg">
              <button className="chip" onClick={() => go('ranked')}>返回</button>
              <h2 className="section-title">{matchPhase === 'finished' ? '联机 · 挑战方胜' : '同世界演武'}</h2>
              <p className="sub">{matchPhase === 'queued' ? '同世界排队中 · 位置 1' : `${world.title} 战场交锋`}</p>
              {matchPhase === 'queued' && (
                <>
                  <div className="match-wait" aria-live="polite">
                    <div className="match-wait-stage">
                      <div className="match-wait-ring" />
                      <div className="match-wait-ring" />
                      <div className="match-wait-ring" />
                      <div className="match-wait-orbit" />
                      <div className="match-wait-cards">
                        <div className="match-wait-card" />
                        <div className="match-wait-card jade" />
                      </div>
                      <div className="match-wait-spark" />
                    </div>
                    <div className="match-wait-title">同世界排队中 · 位置 1</div>
                    <div className="match-wait-sub">战场：{world.lore}</div>
                    <div className="match-wait-dots" aria-hidden>
                      <i /><i /><i />
                    </div>
                  </div>
                  <button className="btn secondary" onClick={() => setMatchPhase('finished')}>模拟匹配成功</button>
                </>
              )}
              {matchPhase === 'finished' && (
                <>
                  <p className="hint">【小世界·{world.title}】{world.lore}</p>
                  <p className="hint">{battleReport.summary}</p>
                  {battleReport.rounds.map((r) => (
                    <div className="round" key={r.round}>
                      <span className="grade">第{r.round}回合</span>
                      <p>{r.narrative}</p>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}

          {screen === 'collection' && (
            <section className="screen hall">
              <h2 className="section-title">卡册</h2>
              <p className="sub">按小世界收录 · {cards.length} 张</p>
              {cards.length > 0 && (
                <div className="char-grid">
                  {cards.map((card) => (
                    <CharacterArtCard
                      key={card.id}
                      id={card.id}
                      name={card.name}
                      grade={card.grade}
                      skills={parseCardSkills(card.skills)}
                    />
                  ))}
                </div>
              )}
              {cards.length === 0 && <p className="hint">卡册为空。进入世界选用人物。</p>}
            </section>
          )}

          {screen === 'profile' && (
            <section className="screen hall">
              <h2 className="section-title">荣耀册</h2>
              <p className="sub">账号 {session.user.username}</p>
              <input className="field" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 12))} />
              <button
                className="art-cta compact"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  try {
                    const user = await updateProfileNickname(session.token, nickname.trim() || session.user.nickname)
                    const next = { token: session.token, user }
                    saveAuthSession(next)
                    onSession(next)
                    setNickname(user.nickname)
                    showToast('昵称已同步')
                  } catch (e) {
                    setError(e instanceof Error ? e.message : '同步失败')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                保存昵称
              </button>
              <div>段位：新锐</div>
              <div className="jade">综合评分 {86 + cards.length * 4}</div>
              <div className="hint">小世界 {worlds.length} · 卡牌 {cards.length}</div>
              <button className="chip" onClick={onLogout}>退出登录</button>
            </section>
          )}

          <nav className="nav five">
            <button className={navActive === 'home' ? 'on' : ''} onClick={() => !busy && go('home')}>大厅</button>
            <button className={navActive === 'worlds' ? 'on' : ''} onClick={() => !busy && go('worlds')}>世界</button>
            <button className={navActive === 'ranked' ? 'on' : ''} onClick={() => !busy && go('ranked')}>对战</button>
            <button className={navActive === 'collection' ? 'on' : ''} onClick={() => !busy && go('collection')}>卡册</button>
            <button className={navActive === 'profile' ? 'on' : ''} onClick={() => !busy && go('profile')}>我的</button>
          </nav>

          {busy && (
            <div className="busy-mask">
              <div className="busy-card">
                <div className="spinner" />
                <div>{status || 'AI 演算中…'}</div>
              </div>
            </div>
          )}
          {toast && <div className="toast">{toast}</div>}
        </div>
      </div>
    </div>
  )
}
