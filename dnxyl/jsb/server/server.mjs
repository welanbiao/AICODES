/**
 * 大闹西游路 · 账号与存档服务
 * 默认 http://127.0.0.1:8788
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
import { getProgress, putProgress } from './progress.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')
const PORT = Number(process.env.PORT || 8788)

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

const server = http.createServer(async (req, res) => {
  const urlPath = pathOf(req.url)
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {})

    if (req.method === 'GET' && urlPath === '/health') {
      return json(res, 200, { ok: true, auth: authStats() })
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

    if (req.method === 'GET' && urlPath === '/v1/me/progress') {
      return json(res, 200, getProgress(parseBearer(req)))
    }

    if (req.method === 'PUT' && urlPath === '/v1/me/progress') {
      const body = await readBody(req)
      return json(res, 200, putProgress(parseBearer(req), body))
    }

    if (req.method === 'GET' && tryStatic(req, res, urlPath)) return

    return json(res, 404, { error: 'not found' })
  } catch (err) {
    return json(res, 400, { error: String(err?.message || err) })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  const boot = bootstrapAuth()
  console.log(`[jsb] http://127.0.0.1:${PORT}`)
  console.log(`[jsb] auth: POST /v1/auth/login （公开注册已关闭）`)
  console.log(`[jsb] admin seed: ${boot.admin} / kjx.123 · users=${boot.users}`)
})
