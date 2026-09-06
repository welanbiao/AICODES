/**
 * 打开浏览器登录 Cursor，把 API Key 存到 ~/.cursor/sdk/auth.json
 * 之后 npm run server 会用 Cursor 大模型讲解汉字。
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { loadEnvFiles } from './env.mjs'
import { loginCursor } from './cursor-ai.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnvFiles([path.join(__dirname, '.env'), path.join(__dirname, '..', '.env')])

const snap = await loginCursor()
if (!snap.ready) {
  console.error('[yzyx] Cursor 仍未接通')
  process.exit(1)
}
console.log(`[yzyx] Cursor 大模型已接通 model=${snap.model} ${snap.cursorEmail || 'key'}`)
