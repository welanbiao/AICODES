/**
 * 给孩子的AI益智游戏 · 账号 + 自己的 AI（与 AIkp 相同：Cursor Agent）
 * 默认 http://127.0.0.1:8789
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  authStats,
  bootstrapAuth,
  loginUser,
  logoutUser,
  parseBearer,
  updateUserProfile,
  userFromToken,
} from './auth.mjs'
import { callCursor, cursorAuthSnapshot, disposeCursorAgent, loginCursor } from './cursor-ai.mjs'
import { loadEnvFiles } from './env.mjs'
import { handleTts } from './tts.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnvFiles([path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')])

const DIST = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 8789)
const MODEL = process.env.CURSOR_MODEL || 'composer-2.5'
const FORCE_MOCK = process.env.FORCE_MOCK === '1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function json(res, code, body) {
  const data = JSON.stringify(body)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  })
  res.end(data)
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  try {
    return JSON.parse(raw || '{}')
  } catch {
    throw new Error('invalid json')
  }
}

function pathOf(url) {
  return decodeURIComponent((url || '/').split('?')[0])
}

function tryStatic(req, res, urlPath) {
  if (!fs.existsSync(DIST)) return false
  let rel = urlPath === '/' ? '/index.html' : urlPath
  const file = path.normalize(path.join(DIST, rel))
  if (!file.startsWith(DIST)) return false
  let target = file
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    target = path.join(DIST, 'index.html')
    if (!fs.existsSync(target)) return false
  }
  const ext = path.extname(target).toLowerCase()
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(target).pipe(res)
  return true
}

function mockTeach(char, py) {
  const spell = spellPinyin(py)
  return JSON.stringify({
    spell,
    word: `${char}字`,
    sentence: `小朋友会读「${char}」，拼音是 ${py}。`,
    explain: `这是常用字，读作 ${py}。`,
  })
}

function spellPinyin(py) {
  const tone = py.match(/[1-5]$/)?.[0] || ''
  const base = py.replace(/[1-5]$/, '')
  const names = { 1: '一声', 2: '二声', 3: '三声', 4: '四声', 5: '轻声' }
  return `${base.split('').join('-')}，${names[tone] || ''}`.replace(/-+/g, '-')
}

async function completeAi(task, prompt) {
  if (FORCE_MOCK) {
    if (task === 'hanzi_teach') {
      const char = (prompt.match(/汉字「(.?)」/) || [])[1] || '字'
      const py = (prompt.match(/拼音「([^」]+)」/) || [])[1] || ''
      return mockTeach(char, py)
    }
    return mockTeach('字', 'zi4')
  }
  return callCursor(prompt)
}

const server = http.createServer(async (req, res) => {
  const urlPath = pathOf(req.url)
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {})

    if (req.method === 'GET' && urlPath === '/health') {
      const cursor = await cursorAuthSnapshot()
      return json(res, 200, {
        ok: true,
        name: 'yzyx',
        model: MODEL,
        forceMock: FORCE_MOCK,
        auth: authStats(),
        ...cursor,
      })
    }

    if (req.method === 'POST' && urlPath === '/v1/auth/register') {
      return json(res, 403, { error: '已关闭公开注册，请联系管理员开通账号' })
    }
    if (req.method === 'POST' && urlPath === '/v1/auth/login') {
      const body = await readBody(req)
      return json(res, 200, loginUser(body))
    }
    if (req.method === 'POST' && urlPath === '/v1/auth/logout') {
      const token = parseBearer(req) || (await readBody(req)).token || ''
      return json(res, 200, logoutUser(token))
    }
    if (req.method === 'GET' && urlPath === '/v1/auth/me') {
      const user = userFromToken(parseBearer(req))
      if (!user) return json(res, 401, { error: '未登录或登录已过期' })
      return json(res, 200, { user })
    }
    if (req.method === 'PUT' && urlPath === '/v1/auth/profile') {
      const token = parseBearer(req)
      if (!token) return json(res, 401, { error: '未登录' })
      const body = await readBody(req)
      return json(res, 200, { user: updateUserProfile(token, body) })
    }
    if (req.method === 'GET' && urlPath === '/v1/admin/users') {
      return json(res, 200, adminListUsers(parseBearer(req)))
    }
    if (req.method === 'POST' && urlPath === '/v1/admin/users') {
      const body = await readBody(req)
      return json(res, 200, adminCreateUser(parseBearer(req), body))
    }
    if (req.method === 'PUT' && urlPath.startsWith('/v1/admin/users/') && urlPath.endsWith('/password')) {
      const userId = decodeURIComponent(urlPath.slice('/v1/admin/users/'.length, -'/password'.length))
      const body = await readBody(req)
      return json(res, 200, adminResetPassword(parseBearer(req), userId, body.password))
    }
    if (req.method === 'DELETE' && urlPath.startsWith('/v1/admin/users/')) {
      const userId = decodeURIComponent(urlPath.slice('/v1/admin/users/'.length))
      return json(res, 200, adminDeleteUser(parseBearer(req), userId))
    }
    if (req.method === 'POST' && urlPath === '/v1/admin/cursor-login') {
      const user = userFromToken(parseBearer(req))
      if (!user) return json(res, 401, { error: '未登录' })
      if (!user.isAdmin && user.role !== 'admin') return json(res, 403, { error: '需要管理员' })
      const cursor = await loginCursor()
      return json(res, 200, cursor)
    }

    if (req.method === 'GET' && urlPath === '/v1/tts') {
      return handleTts(req, res)
    }

    if (req.method === 'POST' && urlPath === '/v1/ai/complete') {
      const user = userFromToken(parseBearer(req))
      if (!user) return json(res, 401, { error: '请先登录' })
      const body = await readBody(req)
      const task = body.task || 'hanzi_teach'
      const prompt = body.prompt || ''
      const text = await completeAi(task, prompt)
      return json(res, 200, { text, source: FORCE_MOCK ? 'mock' : 'cursor', mock: FORCE_MOCK, model: MODEL })
    }

    if (req.method === 'GET' || req.method === 'HEAD') {
      if (tryStatic(req, res, urlPath)) return
    }

    return json(res, 404, { error: 'not found' })
  } catch (err) {
    const msg = String(err?.message || err)
    const code = /接通 Cursor|CURSOR_API_KEY|Authentication/i.test(msg) ? 503 : 400
    return json(res, code, { error: msg })
  }
})

server.requestTimeout = 0
server.headersTimeout = 0
server.timeout = 0
server.listen(PORT, '0.0.0.0', () => {
  const boot = bootstrapAuth()
  console.log(`[yzyx] http://127.0.0.1:${PORT}`)
  console.log(`[yzyx] model=${MODEL} mock=${FORCE_MOCK ? 'yes' : 'no'}`)
  console.log(`[yzyx] auth: POST /v1/auth/login （公开注册已关闭）`)
  console.log(`[yzyx] admin seed: ${boot.admin} / kjx.123 · users=${boot.users}`)
  if (!FORCE_MOCK) {
    cursorAuthSnapshot().then((snap) => {
      if (snap.ready) {
        console.log(`[yzyx] Cursor 大模型已接通 ${snap.cursorEmail || 'API key'}`)
        return
      }
      console.log('[yzyx] 正在打开浏览器登录 Cursor 大模型…')
      return loginCursor()
    }).catch((err) => {
      console.warn('[yzyx] Cursor 登录未完成:', err?.message || err)
    })
  }
})

process.on('SIGINT', () => {
  void disposeCursorAgent().finally(() => process.exit(0))
})
process.on('SIGTERM', () => {
  void disposeCursorAgent().finally(() => process.exit(0))
})
