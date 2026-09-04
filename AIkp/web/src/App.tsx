import { useEffect, useMemo, useState } from 'react'
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  cancelMatchTicket,
  enqueueMatch,
  fetchMe,
  fetchUserContent,
  loadAuthSession,
  loginAccount,
  logoutAccount,
  pollMatchTicket,
  pushUserContent,
  rateCard,
  reviewText,
  saveAuthSession,
  updateProfileNickname,
  validateCard,
  validateWorld,
  type AuthSession,
  type AuthUser,
  type CloudCard,
  type CloudWorld,
  type MatchTicket,
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

/** 备案截图：`?filing=1&screen=home`（screen 可为 auth / home / worlds / world / create / createWorld / ranked / battle / collection / profile） */
function readFilingScreen(): Screen | 'auth' | null {
  const params = new URLSearchParams(window.location.search)
  if (params.get('filing') !== '1') return null
  const raw = params.get('screen') || 'home'
  if (raw === 'auth') return 'auth'
  const allowed: Screen[] = [
    'home',
    'worlds',
    'world',
    'createWorld',
    'create',
    'ranked',
    'battle',
    'collection',
    'profile',
  ]
  return (allowed.includes(raw as Screen) ? raw : 'home') as Screen
}

const FILING_SESSION: AuthSession = {
  token: 'filing-demo-token',
  user: {
    id: 'filing_user',
    username: 'aikp_filing',
    nickname: '备案旅人',
    role: 'user',
    isAdmin: false,
    rankPoints: 42,
    gloryScore: 18,
    winStreak: 1,
    wins: 3,
    losses: 1,
  },
}

export default function App() {
  const filingScreen = useMemo(() => readFilingScreen(), [])
  const [session, setSession] = useState<AuthSession | null>(() =>
    filingScreen && filingScreen !== 'auth' ? FILING_SESSION : loadAuthSession(),
  )
  const [authReady, setAuthReady] = useState(Boolean(filingScreen) || !loadAuthSession())

  useEffect(() => {
    if (filingScreen) {
      setAuthReady(true)
      return
    }
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
      .catch(async (err) => {
        // 仅明确未授权时清会话；网络故障保留登录态
        const msg = err instanceof Error ? err.message : String(err)
        if (/未登录|过期|失效|401|HTTP 401/i.test(msg)) {
          saveAuthSession(null)
          setSession(null)
        }
      })
      .finally(() => setAuthReady(true))
  }, [filingScreen])

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

  if (filingScreen === 'auth' || (!session && !filingScreen)) {
    return (
      <AuthGate
        onAuthed={(s) => {
          setSession(s)
        }}
      />
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
        if (filingScreen) return
        await logoutAccount(session.token)
        setSession(null)
      }}
      filingScreen={filingScreen && filingScreen !== 'auth' ? filingScreen : undefined}
    />
  )
}

function AuthGate({ onAuthed }: { onAuthed: (s: AuthSession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const session = await loginAccount(username.trim(), password)
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
        <p className="sub">登录进入小世界 · 账号由管理员开通</p>
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
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value.slice(0, 64))}
          disabled={busy}
        />
        {error && <p className="error-box">{error}</p>}
        <button className="art-cta" disabled={busy || username.length < 3 || password.length < 6} onClick={submit}>
          {busy ? '请稍候…' : '登录'}
        </button>
        <p className="hint">已关闭公开注册，请联系管理员开通账号</p>
        <p className="hint">需先启动 ai-bridge（默认 http://127.0.0.1:8787）</p>
      </section>
    </div>
  )
}

function GameApp({
  session,
  onSession,
  onLogout,
  filingScreen,
}: {
  session: AuthSession
  onSession: (s: AuthSession) => void
  onLogout: () => void
  filingScreen?: Screen
}) {
  const [screen, setScreen] = useState<Screen>(filingScreen ?? 'home')
  const [kind, setKind] = useState<Kind>('online')
  const [mode, setMode] = useState<Mode>('1v1')
  const [role, setRole] = useState<RolePref>('challenger')
  const [matchPhase, setMatchPhase] = useState<'idle' | 'queued' | 'finished'>(
    filingScreen === 'battle' ? 'finished' : 'idle',
  )
  const [matchTicketId, setMatchTicketId] = useState<string | null>(null)
  const [matchStatusText, setMatchStatusText] = useState('同世界排队中')
  const [onlineReport, setOnlineReport] = useState<{
    title: string
    summary: string
    rounds: { round: number; narrative: string }[]
  } | null>(null)
  const [nickname, setNickname] = useState(session.user.nickname)
  const [managedUsers, setManagedUsers] = useState<AuthUser[]>([])
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newNick, setNewNick] = useState('')
  const isAdmin = Boolean(session.user.isAdmin || session.user.role === 'admin')

  useEffect(() => {
    if (!isAdmin || filingScreen) return
    adminListUsers(session.token)
      .then(setManagedUsers)
      .catch(() => setManagedUsers([]))
  }, [isAdmin, session.token, filingScreen])

  const [worlds, setWorlds] = useState<SmallWorld[]>(officialWorlds)
  const [activeWorldId, setActiveWorldId] = useState(officialWorlds[0].id)
  const [genreFilter, setGenreFilter] = useState<WorldGenre | 'ALL'>(
    filingScreen === 'worlds' ? 'CLASSICS' : 'ALL',
  )
  const seedPresets = officialWorlds[0].presets.slice(0, 4)
  const [cards, setCards] = useState<CardItem[]>(() =>
    filingScreen
      ? seedPresets.map((p) => ({
          id: p.id,
          name: p.name,
          lore: p.lore,
          grade: p.grade,
          skills: p.skills.map((s) => `${s.name}：${s.description}`),
          worldId: p.worldId,
          worldTitle: officialWorlds[0].title,
          comment: `入世 · ${p.roleHint}`,
        }))
      : [],
  )
  const [selectedCardId, setSelectedCardId] = useState(filingScreen ? seedPresets[0]?.id ?? '' : '')
  const [selectedOpponentIds, setSelectedOpponentIds] = useState<string[]>(
    filingScreen && seedPresets[1] ? [seedPresets[1].id] : [],
  )

  function parseSkillLine(raw: string): { name: string; description: string } {
    const idx = raw.indexOf('：')
    if (idx < 0) return { name: raw, description: '' }
    return { name: raw.slice(0, idx), description: raw.slice(idx + 1) }
  }

  function toCloudWorlds(list: SmallWorld[]): CloudWorld[] {
    return list
      .filter((w) => !w.official)
      .map((w) => ({
        id: w.id,
        title: w.title,
        genre: w.genre,
        sourceHint: w.sourceHint,
        lore: w.lore,
        reviewedLore: w.lore,
        fullLore: w.fullLore,
        canonHint: w.canonHint,
        coverKey: w.coverKey,
        isOfficial: false,
        createdAt: Date.now(),
      }))
  }

  function toCloudCards(list: CardItem[]): CloudCard[] {
    return list.map((c) => {
      const skills = c.skills.map(parseSkillLine)
      return {
        id: c.id,
        name: c.name,
        lore: c.lore,
        skills,
        worldId: c.worldId,
        worldTitle: c.worldTitle,
        createGrade: c.grade,
        battleGrade: c.grade,
        gloryGrade: c.grade,
        reviewedLore: c.lore,
        reviewedSkills: skills,
        createdAt: Date.now(),
      }
    })
  }

  async function syncPush(nextWorlds: SmallWorld[], nextCards: CardItem[]) {
    if (filingScreen) return
    try {
      await pushUserContent(session.token, {
        worlds: toCloudWorlds(nextWorlds),
        cards: toCloudCards(nextCards),
      })
    } catch {
      /* 本地仍保留，下次再推 */
    }
  }

  useEffect(() => {
    if (filingScreen) return
    let cancelled = false
    ;(async () => {
      try {
        const cloud = await fetchUserContent(session.token)
        if (cancelled) return
        const customWorlds: SmallWorld[] = (cloud.worlds || []).map((w) => ({
          id: w.id,
          title: w.title,
          genre: (w.genre as WorldGenre) || 'CUSTOM',
          sourceHint: w.sourceHint || '',
          lore: w.reviewedLore || w.lore,
          fullLore: w.fullLore || w.lore,
          canonHint: w.canonHint || '',
          coverKey: (w.coverKey as SmallWorld['coverKey']) || 'novel',
          official: false,
          presets: [],
        }))
        setWorlds([...officialWorlds, ...customWorlds.filter((w) => !officialWorlds.some((o) => o.id === w.id))])
        const cloudCards: CardItem[] = (cloud.cards || []).map((c) => ({
          id: c.id,
          name: c.name,
          lore: c.reviewedLore || c.lore,
          grade: c.createGrade || c.battleGrade || 'R',
          skills: (c.reviewedSkills || c.skills || []).map((s) => `${s.name}：${s.description}`),
          worldId: c.worldId,
          worldTitle: c.worldTitle,
        }))
        setCards(cloudCards)
        if (cloudCards[0]) setSelectedCardId(cloudCards[0].id)
      } catch {
        /* keep local defaults */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session.token, filingScreen])

  const [cardName, setCardName] = useState(filingScreen === 'create' ? '行者' : '')
  const [cardLore, setCardLore] = useState(
    filingScreen === 'create' ? '西行护僧，神通多变，受金箍约束。' : '',
  )
  const [skill1Name, setSkill1Name] = useState(filingScreen === 'create' ? '筋斗云' : '')
  const [skill1Desc, setSkill1Desc] = useState(filingScreen === 'create' ? '疾驰闪避敌手锋芒' : '')
  const [skill2Name, setSkill2Name] = useState(filingScreen === 'create' ? '棒影' : '')
  const [skill2Desc, setSkill2Desc] = useState(filingScreen === 'create' ? '短促连击破防' : '')
  const [skill3Name, setSkill3Name] = useState('')
  const [skill3Desc, setSkill3Desc] = useState('')
  const [query, setQuery] = useState('')
  const [faction, setFaction] = useState<string | null>(null)
  const [editing, setEditing] = useState<WorldPreset | null>(null)

  const [wTitle, setWTitle] = useState(filingScreen === 'createWorld' ? '夜雨江湖' : '')
  const [wGenre, setWGenre] = useState<WorldGenre>(filingScreen === 'createWorld' ? 'NOVEL' : 'NOVEL')
  const [wSource, setWSource] = useState(filingScreen === 'createWorld' ? '自创武侠' : '')
  const [wLore, setWLore] = useState(
    filingScreen === 'createWorld' ? '江南雨巷刀光剑影，门派恩怨一夜了结' : '',
  )
  const [wCanon, setWCanon] = useState(
    filingScreen === 'createWorld' ? '兵刃轻功内力；禁枪械飞升' : '',
  )

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
    const foePreset =
      world.presets.find((p) => selectedOpponentIds.includes(p.id)) ??
      world.presets.find((p) => p.id !== selectedCardId) ??
      world.presets[0]
    const asChallenger = role !== 'defender'
    const foe = {
      name: foePreset?.name ?? '守擂者',
      skill: foePreset?.skills[0]?.name ?? '护体',
    }
    const self = {
      name: mine?.name ?? '挑战者',
      skill: (mine?.skills[0] ?? '试探').split('：')[0],
    }
    return composeBattleReport(
      world.title,
      world.lore,
      asChallenger ? foe : self,
      asChallenger ? self : foe,
      true,
    )
  }, [cards, selectedCardId, selectedOpponentIds, world, role])

  useEffect(() => {
    setSelectedOpponentIds([])
  }, [activeWorldId, mode])

  useEffect(() => {
    if (kind !== 'practice') setSelectedOpponentIds([])
  }, [kind])

  function toggleOpponent(id: string) {
    const teamSize = mode === '3v3' ? 3 : 1
    setSelectedOpponentIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= teamSize) return prev
      return [...prev, id]
    })
  }

  function go(next: Screen) {
    if (next !== 'battle') {
      setMatchPhase('idle')
      setMatchTicketId(null)
      setOnlineReport(null)
    }
    setError(null)
    setStatus(null)
    setScreen(next)
  }

  async function startFight() {
    if (!selectedCardId) return
    const mine = cards.find((c) => c.id === selectedCardId)
    if (!mine) return
    setError(null)

    const teamSize = mode === '3v3' ? 3 : 1
    const team =
      teamSize === 1
        ? [mine]
        : worldCards.slice(0, 3)
    if (team.length !== teamSize) {
      setError(`三对三需要本世界至少 ${teamSize} 张卡`)
      return
    }

    if (kind === 'practice' || filingScreen) {
      const need = mode === '3v3' ? 3 : 1
      if (!filingScreen && selectedOpponentIds.length !== need) {
        setError(`练习战请选择 ${need} 名系统默认对手`)
        return
      }
      setMatchPhase('finished')
      setOnlineReport(null)
      go('battle')
      return
    }

    setBusy(true)
    setMatchPhase('queued')
    setMatchStatusText('正在进入同世界匹配队列…')
    setOnlineReport(null)
    go('battle')
    try {
      const roleMap = { defender: 'DEFENDER', challenger: 'CHALLENGER', any: 'ANY' } as const
      const ticket = await enqueueMatch({
        playerId: session.user.id,
        nickname: nickname || session.user.nickname,
        rankPoints: session.user.rankPoints || 0,
        mode: mode === '3v3' ? 'THREE_V_THREE' : 'ONE_V_ONE',
        preferredRole: roleMap[role],
        cards: team.map((c) => {
          const skills = c.skills.map(parseSkillLine)
          return {
            id: c.id,
            name: c.name,
            lore: c.lore,
            skills,
            reviewedLore: c.lore,
            reviewedSkills: skills,
            createGrade: c.grade,
            battleGrade: c.grade,
            gloryGrade: c.grade,
            worldId: c.worldId,
            worldTitle: c.worldTitle,
          }
        }),
        world: {
          id: world.id,
          title: world.title,
          lore: world.lore,
          reviewedLore: world.lore,
          canonHint: world.canonHint,
          genre: world.genre,
          sourceHint: world.sourceHint,
        },
        battlefield: {
          id: world.id,
          title: world.title,
          description: world.lore,
          reviewedDescription: world.lore,
        },
      })
      setMatchTicketId(ticket.ticketId)
      setMatchStatusText(
        ticket.status === 'queued'
          ? `同世界排队中 · 位置 ${ticket.queuePosition ?? 1}`
          : `状态：${ticket.status}`,
      )

      let latest: MatchTicket = ticket
      for (let i = 0; i < 90; i++) {
        if (['finished', 'timeout', 'cancelled'].includes(latest.status)) break
        await new Promise((r) => setTimeout(r, 2000))
        latest = await pollMatchTicket(ticket.ticketId)
        setMatchStatusText(
          latest.status === 'queued'
            ? `同世界排队中 · 位置 ${latest.queuePosition ?? 1}${latest.opponent?.nickname ? ` · 对手将匹配` : ''}`
            : latest.status === 'matched' || latest.status === 'battling'
              ? `已匹配${latest.opponent?.nickname ? ` · vs ${latest.opponent.nickname}` : ''}，演算对战中…`
              : `状态：${latest.status}`,
        )
        if (latest.status === 'finished') break
      }

      if (latest.status !== 'finished' || !latest.match?.result) {
        throw new Error(latest.status === 'timeout' ? '匹配超时，请重试' : '匹配未完成')
      }
      const result = latest.match.result
      setOnlineReport({
        title: `联机 · ${result.winnerSide === 'DEFENDER' ? '守擂方胜' : '挑战方胜'}`,
        summary: result.summary || '',
        rounds: (result.rounds || []).map((r) => ({ round: r.round, narrative: r.narrative })),
      })
      setMatchPhase('finished')
      showToast('对战结束')
    } catch (e) {
      setError(e instanceof Error ? e.message : '匹配失败')
      setMatchPhase('idle')
      setMatchStatusText('匹配失败')
      go('ranked')
    } finally {
      setBusy(false)
    }
  }

  async function cancelFight() {
    if (matchTicketId) {
      try {
        await cancelMatchTicket(matchTicketId)
      } catch {
        /* ignore */
      }
    }
    setMatchTicketId(null)
    setMatchPhase('idle')
    go('ranked')
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
    const nextCards = [item, ...cards]
    setCards(nextCards)
    setSelectedCardId(item.id)
    void syncPush(worlds, nextCards)
    showToast(`「${preset.name}」已入库并同步`)
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
      setWorlds((prev) => {
        const next = [item, ...prev]
        void syncPush(next, cards)
        return next
      })
      setActiveWorldId(item.id)
      showToast(`小世界「${item.title}」已开启并同步`)
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
      setCards((prev) => {
        const next = [item, ...prev]
        void syncPush(worlds, next)
        return next
      })
      setSelectedCardId(item.id)
      showToast(`「${item.name}」已入「${world.title}」并同步`)
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
              <p>我的卡组 · 仅本世界卡</p>
              {worldCards.map((card) => (
                <div key={card.id} className={`card ${selectedCardId === card.id ? 'selected' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setSelectedCardId(card.id)}>
                  <div className="row"><strong>{card.name}</strong><span className="grade">{card.grade}</span></div>
                </div>
              ))}
              {worldCards.length === 0 && <p className="hint">该世界还没有卡，先去选用人物或铸造。</p>}
              {kind === 'practice' && (
                <>
                  <p style={{ margin: '10px 0 6px' }}>
                    系统对手（{selectedOpponentIds.length}/{mode === '3v3' ? 3 : 1}）· 官方预设
                  </p>
                  {world.presets.map((p) => {
                    const on = selectedOpponentIds.includes(p.id)
                    return (
                      <div
                        key={p.id}
                        className={`card ${on ? 'selected' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleOpponent(p.id)}
                      >
                        <div className="row">
                          <strong>{p.name}</strong>
                          <span className="grade">{p.grade}</span>
                        </div>
                        <p className="hint" style={{ margin: '4px 0 0' }}>
                          {p.nickname || p.roleHint || p.faction}
                        </p>
                      </div>
                    )
                  })}
                  {world.presets.length === 0 && (
                    <p className="hint">当前世界暂无系统默认卡，请换官方世界练习。</p>
                  )}
                </>
              )}
              <button
                className="art-cta battle"
                onClick={() => void startFight()}
                disabled={
                  !selectedCardId ||
                  busy ||
                  (kind === 'practice' && selectedOpponentIds.length !== (mode === '3v3' ? 3 : 1))
                }
              >
                <img src="/art/btn_battle.png" alt="" />
                <span>{kind === 'online' ? '开始同世界匹配' : '开始练习战'}</span>
              </button>
            </section>
          )}

          {screen === 'battle' && (
            <section className="screen battle-bg">
              <button className="chip" onClick={() => void cancelFight()} disabled={busy && matchPhase === 'queued'}>
                {matchPhase === 'queued' ? '取消匹配' : '返回'}
              </button>
              <h2 className="section-title">
                {matchPhase === 'finished'
                  ? onlineReport?.title || '练习战结束'
                  : '同世界演武'}
              </h2>
              <p className="sub">
                {matchPhase === 'queued' ? matchStatusText : `${world.title} 战场交锋`}
              </p>
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
                    <div className="match-wait-title">{matchStatusText}</div>
                    <div className="match-wait-sub">战场：{world.lore}</div>
                    <div className="match-wait-dots" aria-hidden>
                      <i /><i /><i />
                    </div>
                  </div>
                  {error && <pre className="error-box">{error}</pre>}
                </>
              )}
              {matchPhase === 'finished' && (
                <>
                  <p className="hint">【小世界·{world.title}】{world.lore}</p>
                  <p className="hint">{onlineReport?.summary || battleReport.summary}</p>
                  {(onlineReport?.rounds || battleReport.rounds).map((r) => (
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
              <p className="sub">
                账号 {session.user.username}
                {isAdmin ? ' · 管理员' : ''}
              </p>
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

              {isAdmin && (
                <>
                  <h2 className="section-title" style={{ fontSize: 20, marginTop: 18 }}>
                    账号管理
                  </h2>
                  <p className="hint">仅管理员可添加普通用户账号</p>
                  <input
                    className="field"
                    placeholder="新账号"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value.slice(0, 16))}
                    disabled={busy}
                  />
                  <input
                    className="field"
                    type="password"
                    placeholder="新密码（至少6位）"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value.slice(0, 64))}
                    disabled={busy}
                  />
                  <input
                    className="field"
                    placeholder="昵称（可选）"
                    value={newNick}
                    onChange={(e) => setNewNick(e.target.value.slice(0, 12))}
                    disabled={busy}
                  />
                  <button
                    className="art-cta compact"
                    disabled={busy || newUser.length < 3 || newPass.length < 6}
                    onClick={async () => {
                      setBusy(true)
                      setError(null)
                      try {
                        await adminCreateUser(
                          session.token,
                          newUser.trim(),
                          newPass,
                          newNick.trim() || newUser.trim(),
                        )
                        setManagedUsers(await adminListUsers(session.token))
                        setNewUser('')
                        setNewPass('')
                        setNewNick('')
                        showToast('账号已创建')
                      } catch (e) {
                        setError(e instanceof Error ? e.message : '创建失败')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    添加普通账号
                  </button>
                  {error && <pre className="error-box">{error}</pre>}
                  {managedUsers.map((u) => (
                    <div className="card" key={u.id}>
                      <div className="row">
                        <strong>
                          {u.username} · {u.nickname}
                          {u.isAdmin || u.role === 'admin' ? ' · 管理员' : ''}
                        </strong>
                      </div>
                      {!(u.isAdmin || u.role === 'admin') && (
                        <div className="cta-row" style={{ marginTop: 8 }}>
                          <button
                            className="chip"
                            disabled={busy}
                            onClick={async () => {
                              const pwd = window.prompt(`为 ${u.username} 设置新密码（至少6位）`)
                              if (!pwd || pwd.length < 6) return
                              setBusy(true)
                              try {
                                await adminResetPassword(session.token, u.id, pwd)
                                showToast('密码已重置')
                              } catch (e) {
                                setError(e instanceof Error ? e.message : '重置失败')
                              } finally {
                                setBusy(false)
                              }
                            }}
                          >
                            重置密码
                          </button>
                          <button
                            className="chip"
                            disabled={busy}
                            onClick={async () => {
                              if (!window.confirm(`删除账号 ${u.username}？`)) return
                              setBusy(true)
                              try {
                                await adminDeleteUser(session.token, u.id)
                                setManagedUsers(await adminListUsers(session.token))
                                showToast('已删除')
                              } catch (e) {
                                setError(e instanceof Error ? e.message : '删除失败')
                              } finally {
                                setBusy(false)
                              }
                            }}
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              <button className="chip" onClick={onLogout}>
                退出登录
              </button>
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
