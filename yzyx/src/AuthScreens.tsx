import { useEffect, useState } from 'react'
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  fetchAiHealth,
  loginAccount,
  startCursorLogin,
  type AuthSession,
  type AuthUser,
} from './api'

export function AuthGate({ onAuthed }: { onAuthed: (s: AuthSession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setBusy(true)
    setError('')
    try {
      onAuthed(await loginAccount(username.trim(), password))
    } catch (e) {
      const msg = e instanceof Error ? e.message : '登录失败'
      setError(/fetch|network|Failed/i.test(msg) ? '连不上服务器，请先运行 npm run server' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card gate">
      <p className="eyebrow">给孩子的</p>
      <h1>AI益智游戏</h1>
      <p className="hint">账号由老师或管理员开通，没有公开注册</p>
      <input
        placeholder="账号"
        value={username}
        maxLength={16}
        disabled={busy}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        maxLength={64}
        disabled={busy}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && void submit()}
      />
      {error ? <p className="err">{error}</p> : null}
      <button type="button" className="btn primary" disabled={busy || username.length < 3 || password.length < 6} onClick={() => void submit()}>
        {busy ? '登录中…' : '登录'}
      </button>
    </div>
  )
}

export function Home({
  session,
  onPlay,
  onLogout,
}: {
  session: AuthSession
  onPlay: (id: 'hanzi') => void
  onLogout: () => void
}) {
  const admin = Boolean(session.user.isAdmin || session.user.role === 'admin')
  const [showAdmin, setShowAdmin] = useState(false)
  const [aiHint, setAiHint] = useState('正在检查 Cursor 大模型…')

  useEffect(() => {
    let stop = false
    async function refresh() {
      try {
        const h = await fetchAiHealth()
        if (stop) return
        if (h.forceMock) setAiHint('当前是本地讲解（FORCE_MOCK）')
        else if (h.ready) setAiHint(`Cursor 大模型已接通 · ${h.model || 'composer-2.5'}`)
        else setAiHint('Cursor 大模型未接通，管理员请登录 Cursor')
      } catch {
        if (!stop) setAiHint('连不上讲解服务，请先运行 npm run server')
      }
    }
    void refresh()
    const t = window.setInterval(() => void refresh(), 4000)
    return () => {
      stop = true
      window.clearInterval(t)
    }
  }, [])

  return (
    <div className="home">
      <header className="top">
        <div>
          <p className="eyebrow">给孩子的AI益智游戏</p>
          <h1>选一个游戏吧</h1>
          <p className="hint">
            {session.user.nickname}
            {admin ? ' · 管理员' : ''}
            {' · '}
            {aiHint}
          </p>
        </div>
        <div className="top-actions">
          {admin ? (
            <button type="button" className="btn ghost" onClick={() => setShowAdmin((v) => !v)}>
              {showAdmin ? '收起账号' : '账号管理'}
            </button>
          ) : null}
          <button type="button" className="btn ghost" onClick={onLogout}>
            退出
          </button>
        </div>
      </header>
      <div className="game-grid">
        <button type="button" className="game-card" onClick={() => onPlay('hanzi')}>
          <strong>开奖汉字</strong>
          <span>声母、韵母、整体认读和音调开奖，自动出汉字（含生僻字），再听普通话。</span>
        </button>
        <div className="game-card soon">
          <strong>更多游戏</strong>
          <span>即将开放</span>
        </div>
      </div>
      {showAdmin && admin ? <AdminPanel token={session.token} /> : null}
    </div>
  )
}

function AdminPanel({ token }: { token: string }) {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [newUser, setNewUser] = useState('')
  const [newPass, setNewPass] = useState('')
  const [newNick, setNewNick] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tip, setTip] = useState('')
  const [cursorBusy, setCursorBusy] = useState(false)

  async function reload() {
    setUsers(await adminListUsers(token))
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
  }, [token])

  async function createUser() {
    const username = newUser.trim()
    if (username.length < 3) return setError('账号至少 3 位')
    if (newPass.length < 6) return setError('密码至少 6 位')
    setBusy(true)
    setError('')
    setTip('')
    try {
      await adminCreateUser(token, username, newPass, newNick.trim() || username)
      setNewUser('')
      setNewPass('')
      setNewNick('')
      setTip(`已创建账号 ${username}`)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card admin">
      <h2>账号管理</h2>
      <p className="hint">只有管理员能给小朋友开账号</p>
      <button
        type="button"
        className="btn primary"
        disabled={cursorBusy}
        onClick={() => {
          setCursorBusy(true)
          setError('')
          setTip('请在弹出的浏览器里登录 Cursor…')
          void startCursorLogin(token)
            .then((s) => setTip(s.ready ? `Cursor 已接通 ${s.cursorEmail || s.model || ''}` : '仍未接通，请看浏览器'))
            .catch((e) => setError(e instanceof Error ? e.message : 'Cursor 登录失败'))
            .finally(() => setCursorBusy(false))
        }}
      >
        {cursorBusy ? '等待 Cursor 登录…' : '登录 Cursor 大模型'}
      </button>
      <label>
        新账号
        <input value={newUser} maxLength={16} disabled={busy} onChange={(e) => setNewUser(e.target.value)} />
      </label>
      <label>
        密码
        <input type="password" value={newPass} maxLength={64} disabled={busy} onChange={(e) => setNewPass(e.target.value)} />
      </label>
      <label>
        昵称
        <input value={newNick} maxLength={12} disabled={busy} onChange={(e) => setNewNick(e.target.value)} />
      </label>
      <button type="button" className="btn primary" disabled={busy} onClick={() => void createUser()}>
        {busy ? '创建中…' : '添加小朋友账号'}
      </button>
      {tip ? <p className="ok">{tip}</p> : null}
      {error ? <p className="err">{error}</p> : null}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <span>
              {u.username} · {u.nickname}
              {u.isAdmin || u.role === 'admin' ? ' · 管理员' : ''}
            </span>
            {!(u.isAdmin || u.role === 'admin') ? (
              <span className="ops">
                <button
                  type="button"
                  className="btn mini"
                  onClick={() => {
                    const pwd = window.prompt(`为 ${u.username} 设置新密码`)
                    if (!pwd || pwd.length < 6) return
                    void adminResetPassword(token, u.id, pwd).then(() => setTip('密码已重置')).catch((e) => setError(e instanceof Error ? e.message : '失败'))
                  }}
                >
                  重置密码
                </button>
                <button
                  type="button"
                  className="btn mini"
                  onClick={() => {
                    if (!window.confirm(`删除 ${u.username}？`)) return
                    void adminDeleteUser(token, u.id).then(reload).catch((e) => setError(e instanceof Error ? e.message : '失败'))
                  }}
                >
                  删除
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
