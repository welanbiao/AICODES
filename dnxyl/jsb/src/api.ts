import type { GameProgress } from './game/types'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const AUTH_KEY = 'jsb_auth'

export type AuthUser = {
  id: string
  username: string
  nickname: string
  role?: string
  isAdmin?: boolean
  createdAt?: number
}

export type AuthSession = {
  token: string
  user: AuthUser
}

export type { GameProgress }

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as AuthSession
    if (!data?.token || !data?.user?.id) return null
    return data
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession | null) {
  if (!session) localStorage.removeItem(AUTH_KEY)
  else localStorage.setItem(AUTH_KEY, JSON.stringify(session))
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

async function authRequest(path: string, body: Record<string, string>): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await readJson<{ token?: string; user?: AuthUser }>(res)
  if (!data.token || !data.user) throw new Error('响应无效')
  return { token: data.token, user: data.user }
}

export async function loginAccount(username: string, password: string) {
  const session = await authRequest('/v1/auth/login', { username, password })
  saveAuthSession(session)
  return session
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await readJson<{ user?: AuthUser }>(res)
  if (!data.user) throw new Error('响应无效')
  return data.user
}

export async function logoutAccount(token: string) {
  try {
    await fetch(`${API_BASE}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: '{}',
    })
  } catch {
    /* ignore */
  }
  saveAuthSession(null)
}

export async function adminListUsers(token: string): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/v1/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await readJson<{ users?: AuthUser[] }>(res)
  return data.users || []
}

export async function adminCreateUser(
  token: string,
  username: string,
  password: string,
  nickname: string,
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, password, nickname }),
  })
  const data = await readJson<{ user?: AuthUser }>(res)
  if (!data.user) throw new Error('响应无效')
  return data.user
}

export async function adminResetPassword(token: string, userId: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })
  const data = await readJson<{ user?: AuthUser }>(res)
  if (!data.user) throw new Error('响应无效')
  return data.user
}

export async function adminDeleteUser(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  await readJson<{ error?: string }>(res)
}

export async function fetchProgress(token: string): Promise<GameProgress> {
  const res = await fetch(`${API_BASE}/v1/me/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return readJson<GameProgress>(res)
}

export async function pushProgress(token: string, progress: GameProgress): Promise<GameProgress> {
  const res = await fetch(`${API_BASE}/v1/me/progress`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(progress),
    keepalive: true,
  })
  return readJson<GameProgress>(res)
}
