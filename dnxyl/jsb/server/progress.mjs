/**
 * 玩家关卡进度（突破关卡 + 生命值等）按 userId 存服务器。
 * 文件：server/data/progress.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { userFromToken } from './auth.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const FILE = path.join(DATA_DIR, 'progress.json')

function emptyStore() {
  return { byUser: {} }
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify(emptyStore(), null, 2), 'utf8')
  }
}

function readStore() {
  ensureStore()
  try {
    const raw = fs.readFileSync(FILE, 'utf8')
    const data = JSON.parse(raw || '{}')
    return { byUser: data.byUser && typeof data.byUser === 'object' ? data.byUser : {} }
  } catch {
    return emptyStore()
  }
}

function writeStore(store) {
  ensureStore()
  const tmp = `${FILE}.${process.pid}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  fs.renameSync(tmp, FILE)
}

function requireUser(token) {
  const user = userFromToken(token)
  if (!user) throw new Error('未登录或登录已过期')
  return user
}

function clampInt(n, lo, hi, fallback) {
  const v = Number(n)
  if (!Number.isFinite(v)) return fallback
  return Math.max(lo, Math.min(hi, Math.round(v)))
}

function defaultProgress() {
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
    updatedAt: 0,
  }
}

export function normalizeProgress(raw = {}) {
  const base = defaultProgress()
  const wu = Array.isArray(raw.wuXing) ? raw.wuXing.slice(0, 5).map((n) => clampInt(n, 0, 20, 0)) : base.wuXing
  while (wu.length < 5) wu.push(0)
  return {
    stage: clampInt(raw.stage, 1, 128, 1),
    hp: clampInt(raw.hp, 0, 99999, 100),
    maxHp: clampInt(raw.maxHp, 1, 99999, 100),
    pillHp: clampInt(raw.pillHp, 0, 99999, 0),
    xiuwei: clampInt(raw.xiuwei, 0, 1e9, 0),
    wuXing: wu,
    cloneCount: clampInt(raw.cloneCount, 1, 40, 1),
    bonusShots: clampInt(raw.bonusShots, 0, 7, 0),
    bonusDmg: Math.max(0.2, Math.min(8, Number(raw.bonusDmg) || 1)),
    bonusFire: Math.max(0.2, Math.min(8, Number(raw.bonusFire) || 1)),
    atkBonus: clampInt(raw.atkBonus, 0, 99999, 0),
    updatedAt: Number(raw.updatedAt) || 0,
  }
}

export function getProgress(token) {
  const user = requireUser(token)
  const store = readStore()
  const saved = store.byUser[user.id]
  return normalizeProgress(saved || defaultProgress())
}

export function putProgress(token, body = {}) {
  const user = requireUser(token)
  const store = readStore()
  const next = normalizeProgress({ ...body, updatedAt: Date.now() })
  store.byUser[user.id] = next
  writeStore(store)
  return next
}
