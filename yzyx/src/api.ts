const API_BASE = import.meta.env.VITE_API_BASE || ''
const AUTH_KEY = 'yzyx_auth'

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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

export async function adminCreateUser(token: string, username: string, password: string, nickname: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ username, password, nickname }),
  })
  const data = await readJson<{ user?: AuthUser }>(res)
  if (!data.user) throw new Error('响应无效')
  return data.user
}

export async function adminResetPassword(token: string, userId: string, password: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  })
  const data = await readJson<{ user?: AuthUser }>(res)
  if (!data.user) throw new Error('响应无效')
  return data.user
}

export async function adminDeleteUser(token: string, userId: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  await readJson<{ error?: string }>(res)
}

export async function fetchAiHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return readJson<{
    ready?: boolean
    model?: string
    forceMock?: boolean
    cursorLogin?: string
    cursorEmail?: string
    loginUrl?: string
  }>(res)
}

export async function startCursorLogin(token: string) {
  const res = await fetch(`${API_BASE}/v1/admin/cursor-login`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return readJson<{ ready?: boolean; cursorEmail?: string; loginUrl?: string; model?: string }>(res)
}

export type TeachResult = {
  spell: string
  word: string
  sentence: string
  explain: string
  source: string
  model: string
}

function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return {}
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return {}
  }
}

export async function teachHanzi(token: string, char: string, py: string): Promise<TeachResult> {
  const prompt = `你是幼儿语文老师，用普通话、简短句子教5到8岁小朋友。
汉字「${char}」，拼音「${py}」。
请只输出 JSON：{"spell":"按声母韵母拼读，并说出第几声","word":"一个适合小朋友的词语，必须含该字","sentence":"一句完整的话，必须含该字","explain":"用一句大白话解释词语"}
不要调用工具，不要改文件，不要输出其他文字。`
  const res = await fetch(`${API_BASE}/v1/ai/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ task: 'hanzi_teach', prompt }),
  })
  const data = await readJson<{ text?: string; source?: string; model?: string }>(res)
  const obj = extractJson(data.text || '')
  return {
    spell: String(obj.spell || `${py}，请跟老师读。`),
    word: String(obj.word || `${char}字`),
    sentence: String(obj.sentence || `小朋友认识「${char}」。`),
    explain: String(obj.explain || ''),
    source: data.source || 'ai',
    model: data.model || '',
  }
}
