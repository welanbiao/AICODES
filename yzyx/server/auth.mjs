/**
 * 用户登录 + 管理员账号管理。
 * 禁止公开注册；普通账号仅管理员可创建。
 * 文件：server/data/users.json
 *
 * 内置管理员（与 AI卡牌 AIkp 相同）：kjxgl / kjx.123
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fff]{3,16}$/
const SESSION_DAYS = 30

export const ADMIN_USERNAME = 'kjxgl'
const ADMIN_PASSWORD = 'kjx.123'

function emptyStore() {
  return { users: [], sessions: {} }
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(emptyStore(), null, 2), 'utf8')
  }
}

function readStore() {
  ensureStore()
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8')
    const data = JSON.parse(raw || '{}')
    return {
      users: Array.isArray(data.users) ? data.users : [],
      sessions: data.sessions && typeof data.sessions === 'object' ? data.sessions : {},
    }
  } catch {
    return emptyStore()
  }
}

function writeStore(store) {
  ensureStore()
  const tmp = `${USERS_FILE}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  fs.renameSync(tmp, USERS_FILE)
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

function verifyPassword(password, salt, expectedHash) {
  const got = crypto.scryptSync(password, salt, 64).toString('hex')
  const a = Buffer.from(got, 'hex')
  const b = Buffer.from(expectedHash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function publicUser(user) {
  const role = user.role === 'admin' ? 'admin' : 'user'
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role,
    isAdmin: role === 'admin',
    createdAt: user.createdAt,
  }
}

function issueToken(store, userId) {
  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  store.sessions[token] = { userId, expiresAt }
  return { token, expiresAt }
}

function purgeExpired(store) {
  const now = Date.now()
  for (const [token, sess] of Object.entries(store.sessions)) {
    if (!sess || sess.expiresAt < now) delete store.sessions[token]
  }
}

function findUserByUsername(store, username) {
  const key = String(username || '').trim().toLowerCase()
  return store.users.find((u) => u.username.toLowerCase() === key)
}

function findUserById(store, id) {
  return store.users.find((u) => u.id === id)
}

function revokeUserSessions(store, userId) {
  for (const [token, sess] of Object.entries(store.sessions)) {
    if (sess?.userId === userId) delete store.sessions[token]
  }
}

function upsertAdmin(store) {
  const { salt, hash } = hashPassword(ADMIN_PASSWORD)
  const now = Date.now()
  let admin = findUserByUsername(store, ADMIN_USERNAME)
  if (!admin) {
    admin = {
      id: `u_admin_${crypto.randomBytes(4).toString('hex')}`,
      username: ADMIN_USERNAME,
      passwordSalt: salt,
      passwordHash: hash,
      nickname: '管理员',
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    }
    store.users.push(admin)
  } else {
    admin.role = 'admin'
    admin.passwordSalt = salt
    admin.passwordHash = hash
    admin.updatedAt = now
    if (!admin.nickname) admin.nickname = '管理员'
  }
  for (const u of store.users) {
    if (u.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) u.role = 'admin'
    else if (!u.role) u.role = 'user'
  }
  return admin
}

export function bootstrapAuth() {
  const store = readStore()
  upsertAdmin(store)
  writeStore(store)
  return { admin: ADMIN_USERNAME, users: store.users.length }
}

function requireAdminFromToken(token) {
  if (!token) throw new Error('未登录')
  const store = readStore()
  purgeExpired(store)
  const sess = store.sessions[token]
  if (!sess || sess.expiresAt < Date.now()) throw new Error('未登录或登录已过期')
  const user = findUserById(store, sess.userId)
  if (!user) throw new Error('用户不存在')
  if (user.role !== 'admin') throw new Error('需要管理员权限')
  return { store, admin: user }
}

function createUserRecord(store, { username, password, nickname, role = 'user' }) {
  const name = String(username || '').trim()
  const pass = String(password || '')
  const nick = String(nickname || name).trim().slice(0, 12) || name.slice(0, 12)
  const userRole = role === 'admin' ? 'admin' : 'user'

  if (!USERNAME_RE.test(name)) {
    throw new Error('账号需 3~16 位（字母/数字/下划线/中文）')
  }
  if (pass.length < 6 || pass.length > 64) {
    throw new Error('密码需 6~64 位')
  }
  if (findUserByUsername(store, name)) {
    throw new Error('账号已存在')
  }
  if (name.toLowerCase() === ADMIN_USERNAME.toLowerCase() && userRole !== 'admin') {
    throw new Error('保留账号名不可用')
  }

  const { salt, hash } = hashPassword(pass)
  const now = Date.now()
  const user = {
    id: `u_${crypto.randomBytes(8).toString('hex')}`,
    username: name,
    passwordSalt: salt,
    passwordHash: hash,
    nickname: nick,
    role: userRole,
    createdAt: now,
    updatedAt: now,
  }
  store.users.push(user)
  return user
}

export function registerUser() {
  throw new Error('已关闭公开注册，请联系管理员开通账号')
}

export function loginUser({ username, password }) {
  const name = String(username || '').trim()
  const pass = String(password || '')
  if (!name || !pass) throw new Error('请输入账号和密码')

  const store = readStore()
  upsertAdmin(store)
  purgeExpired(store)
  const user = findUserByUsername(store, name)
  if (!user || !verifyPassword(pass, user.passwordSalt, user.passwordHash)) {
    throw new Error('账号或密码错误')
  }
  if (!user.role) user.role = user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase() ? 'admin' : 'user'
  const session = issueToken(store, user.id)
  user.updatedAt = Date.now()
  writeStore(store)
  return { token: session.token, expiresAt: session.expiresAt, user: publicUser(user) }
}

export function logoutUser(token) {
  if (!token) return { ok: true }
  const store = readStore()
  delete store.sessions[token]
  writeStore(store)
  return { ok: true }
}

export function userFromToken(token) {
  if (!token) return null
  const store = readStore()
  purgeExpired(store)
  const sess = store.sessions[token]
  if (!sess || sess.expiresAt < Date.now()) {
    if (sess) {
      delete store.sessions[token]
      writeStore(store)
    }
    return null
  }
  const user = findUserById(store, sess.userId)
  return user ? publicUser(user) : null
}

export function updateUserProfile(token, patch = {}) {
  const store = readStore()
  purgeExpired(store)
  const sess = store.sessions[token]
  if (!sess || sess.expiresAt < Date.now()) throw new Error('未登录或登录已过期')
  const user = findUserById(store, sess.userId)
  if (!user) throw new Error('用户不存在')

  if (patch.nickname != null) {
    const nick = String(patch.nickname).trim().slice(0, 12)
    if (nick) user.nickname = nick
  }
  user.updatedAt = Date.now()
  writeStore(store)
  return publicUser(user)
}

export function adminListUsers(token) {
  const { store } = requireAdminFromToken(token)
  writeStore(store)
  return {
    users: store.users
      .map(publicUser)
      .sort((a, b) => (a.isAdmin === b.isAdmin ? a.username.localeCompare(b.username) : a.isAdmin ? -1 : 1)),
  }
}

export function adminCreateUser(token, body) {
  const { store } = requireAdminFromToken(token)
  const user = createUserRecord(store, {
    username: body.username,
    password: body.password,
    nickname: body.nickname,
    role: 'user',
  })
  writeStore(store)
  return { user: publicUser(user) }
}

export function adminResetPassword(token, userId, password) {
  const { store } = requireAdminFromToken(token)
  const user = findUserById(store, userId)
  if (!user) throw new Error('用户不存在')
  const pass = String(password || '')
  if (pass.length < 6 || pass.length > 64) throw new Error('密码需 6~64 位')
  const { salt, hash } = hashPassword(pass)
  user.passwordSalt = salt
  user.passwordHash = hash
  user.updatedAt = Date.now()
  revokeUserSessions(store, user.id)
  writeStore(store)
  return { user: publicUser(user), ok: true }
}

export function adminDeleteUser(token, userId) {
  const { store, admin } = requireAdminFromToken(token)
  const user = findUserById(store, userId)
  if (!user) throw new Error('用户不存在')
  if (user.id === admin.id || user.role === 'admin' || user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
    throw new Error('不能删除管理员账号')
  }
  store.users = store.users.filter((u) => u.id !== user.id)
  revokeUserSessions(store, user.id)
  writeStore(store)
  return { ok: true }
}

export function parseBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || ''
  const m = String(h).match(/^Bearer\s+(.+)$/i)
  if (m) return m[1].trim()
  return ''
}

export function authStats() {
  const store = readStore()
  purgeExpired(store)
  return {
    users: store.users.length,
    sessions: Object.keys(store.sessions).length,
    admin: ADMIN_USERNAME,
  }
}
