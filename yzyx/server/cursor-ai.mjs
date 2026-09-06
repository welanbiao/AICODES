import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Agent, Cursor } from '@cursor/sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCRATCH = path.join(__dirname, 'ai-workspace')

let lastLoginUrl = ''
let loginInFlight = null
let cachedAgent = null
let creatingAgent = null

function modelId() {
  return process.env.CURSOR_MODEL || 'composer-2.5'
}

function openLoginUrl(url) {
  lastLoginUrl = url
  console.log(`[yzyx] 请在浏览器完成 Cursor 登录：\n${url}`)
  exec(`cmd /c start "" "${url.replace(/"/g, '')}"`)
}

export async function cursorAuthSnapshot() {
  const stored = await Cursor.auth.status().catch(() => ({ status: 'logged-out' }))
  const hasKey = Boolean(process.env.CURSOR_API_KEY)
  const ready = hasKey || stored.status === 'logged-in'
  return {
    hasKey,
    cursorLogin: stored.status,
    cursorEmail: stored.status === 'logged-in' ? stored.email || '' : '',
    loginUrl: lastLoginUrl,
    ready,
    model: modelId(),
  }
}

export async function loginCursor() {
  const snap = await cursorAuthSnapshot()
  if (snap.ready && snap.cursorLogin === 'logged-in') return snap
  if (snap.hasKey) return snap
  if (loginInFlight) return loginInFlight
  loginInFlight = (async () => {
    const result = await Cursor.auth.login({
      apiKeyName: 'yzyx-kids',
      openBrowser: openLoginUrl,
      onLoginUrl: (url) => {
        lastLoginUrl = url
      },
    })
    lastLoginUrl = ''
    console.log(`[yzyx] Cursor 已登录 ${result.email || ''}`.trim())
    return cursorAuthSnapshot()
  })().finally(() => {
    loginInFlight = null
  })
  return loginInFlight
}

function agentOptions() {
  fs.mkdirSync(SCRATCH, { recursive: true })
  const opts = {
    model: { id: modelId() },
    local: { cwd: SCRATCH, settingSources: [] },
    tools: [],
  }
  if (process.env.CURSOR_API_KEY) opts.apiKey = process.env.CURSOR_API_KEY
  return opts
}

async function getAgent() {
  if (cachedAgent) return cachedAgent
  if (creatingAgent) return creatingAgent
  creatingAgent = Agent.create(agentOptions())
    .then((agent) => {
      cachedAgent = agent
      console.log(`[yzyx] Cursor agent ready id=${agent.agentId} model=${modelId()}`)
      return agent
    })
    .finally(() => {
      creatingAgent = null
    })
  return creatingAgent
}

function textOf(result) {
  const raw = result?.result
  if (typeof raw === 'string' && raw.trim()) return raw
  if (result?.error?.message) throw new Error(result.error.message)
  throw new Error('Cursor 大模型没有返回讲解文字')
}

export async function callCursor(prompt) {
  const snap = await cursorAuthSnapshot()
  if (!snap.ready) {
    throw new Error('还没有接通 Cursor 大模型。管理员请点「登录 Cursor」，或运行 npm run cursor-login。')
  }
  const agent = await getAgent()
  const run = await agent.send(prompt)
  console.log(`[yzyx] cursor run=${run.id} agent=${agent.agentId}`)
  const result = await run.wait()
  if (result.status === 'error') {
    throw new Error(result.error?.message || 'Cursor 模型运行失败')
  }
  return textOf(result)
}

export async function disposeCursorAgent() {
  if (!cachedAgent) return
  const agent = cachedAgent
  cachedAgent = null
  try {
    await agent[Symbol.asyncDispose]()
  } catch {
    try {
      agent.close()
    } catch {
      /* ignore */
    }
  }
}
