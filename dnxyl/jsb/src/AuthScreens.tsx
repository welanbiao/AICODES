import { useEffect, useState } from 'react'
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  loginAccount,
  type AuthSession,
  type AuthUser,
} from './api'
import type { GameProgress } from './game/types'
import { boltDmg, STAGE_NAMES } from './game/constants'

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
      setError(/fetch|network|Failed/i.test(msg) ? '无法连接服务器，请先运行 npm run server' : msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gate">
      <h1>大闹西游路</h1>
      <p>账号由管理员开通，登录后从上次突破的关卡继续</p>
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
      {error ? <p className="gate-err">{error}</p> : null}
      <button type="button" disabled={busy || username.length < 3 || password.length < 6} onClick={() => void submit()}>
        {busy ? '登录中…' : '登录'}
      </button>
    </div>
  )
}

export function Lobby({
  session,
  progress,
  onPlay,
  onLogout,
}: {
  session: AuthSession
  progress: GameProgress
  onPlay: () => void
  onLogout: () => void
}) {
  const admin = Boolean(session.user.isAdmin || session.user.role === 'admin')
  const [showAdmin, setShowAdmin] = useState(false)
  const name = STAGE_NAMES[Math.max(0, progress.stage - 1)] || ''

  return (
    <div className="gate lobby-gate">
      <h1>大闹西游路</h1>
      <p>
        {session.user.nickname}
        {admin ? ' · 管理员' : ''} · {session.user.username}
      </p>
      <p>
        上次进度：第{progress.stage}关 {name}
        <br />
        生命 {Math.round(progress.hp)} / {Math.round(progress.maxHp)} · 弹幕攻击{' '}
        {Math.round(boltDmg(progress.stage, progress.xiuwei, progress.bonusDmg, progress.atkBonus || 0))}
      </p>
      <button type="button" onClick={onPlay}>
        进入游戏
      </button>
      {admin ? (
        <button type="button" className="gate-sub" onClick={() => setShowAdmin((v) => !v)}>
          {showAdmin ? '收起账号管理' : '账号管理'}
        </button>
      ) : null}
      <button type="button" className="gate-sub" onClick={onLogout}>
        退出登录
      </button>
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

  async function reload() {
    setUsers(await adminListUsers(token))
  }

  useEffect(() => {
    void reload().catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
  }, [token])

  async function createUser() {
    const username = newUser.trim()
    const password = newPass
    const nickname = newNick.trim() || username
    setTip('')
    if (username.length < 3) {
      setError('账号至少 3 位')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    setBusy(true)
    setError('')
    try {
      await adminCreateUser(token, username, password, nickname)
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
    <div className="admin-box">
      <h2>账号管理</h2>
      <p>仅管理员可创建普通账号</p>
      <label className="admin-field">
        <span>新账号</span>
        <input
          placeholder="3~16 位字母/数字/下划线/中文"
          value={newUser}
          maxLength={16}
          disabled={busy}
          autoComplete="off"
          onChange={(e) => setNewUser(e.target.value)}
        />
      </label>
      <label className="admin-field">
        <span>密码</span>
        <input
          type="password"
          placeholder="至少 6 位"
          value={newPass}
          maxLength={64}
          disabled={busy}
          autoComplete="new-password"
          onChange={(e) => setNewPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void createUser()}
        />
      </label>
      <label className="admin-field">
        <span>昵称（可选）</span>
        <input
          placeholder="不填则与账号相同"
          value={newNick}
          maxLength={12}
          disabled={busy}
          autoComplete="off"
          onChange={(e) => setNewNick(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void createUser()}
        />
      </label>
      <button type="button" className="admin-add-btn" disabled={busy} onClick={() => void createUser()}>
        {busy ? '创建中…' : '添加普通账号'}
      </button>
      {tip ? <p className="gate-hint">{tip}</p> : null}
      {error ? <p className="gate-err">{error}</p> : null}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <span>
              {u.username} · {u.nickname}
              {u.isAdmin || u.role === 'admin' ? ' · 管理员' : ''}
            </span>
            {!(u.isAdmin || u.role === 'admin') ? (
              <span className="admin-ops">
                <button
                  type="button"
                  className="gate-mini"
                  disabled={busy}
                  onClick={() => {
                    const pwd = window.prompt(`为 ${u.username} 设置新密码（至少6位）`)
                    if (!pwd || pwd.length < 6) return
                    void (async () => {
                      setBusy(true)
                      try {
                        await adminResetPassword(token, u.id, pwd)
                        setTip('密码已重置')
                      } catch (e) {
                        setError(e instanceof Error ? e.message : '重置失败')
                      } finally {
                        setBusy(false)
                      }
                    })()
                  }}
                >
                  重置密码
                </button>
                <button
                  type="button"
                  className="gate-mini"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`删除账号 ${u.username}？`)) return
                    void (async () => {
                      setBusy(true)
                      try {
                        await adminDeleteUser(token, u.id)
                        await reload()
                      } catch (e) {
                        setError(e instanceof Error ? e.message : '删除失败')
                      } finally {
                        setBusy(false)
                      }
                    })()
                  }}
                >
                  删除
                </button>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
