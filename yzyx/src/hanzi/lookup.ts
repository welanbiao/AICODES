import { pinyin } from 'pinyin-pro'
import { COMMON_CHARS } from './common'
import { composeSyllable, withTone } from './pinyin'

const index = new Map<string, string[]>()
const commonRank = new Map<string, number>()

function normPy(raw: string) {
  return String(raw || '')
    .toLowerCase()
    .replace(/ü/g, 'v')
    .replace(/u:/g, 'v')
    .trim()
}

function readingsOf(ch: string) {
  const raw = pinyin(ch, { toneType: 'num', v: true, type: 'array', multiple: true })
  const list = Array.isArray(raw) ? raw : [String(raw || '')]
  const out: string[] = []
  for (const item of list) {
    const py = normPy(item)
    if (py && py !== ch && /[1-5]$/.test(py) && !out.includes(py)) out.push(py)
  }
  return out
}

function add(py: string, ch: string) {
  const list = index.get(py)
  if (list) {
    if (!list.includes(ch)) list.push(ch)
  } else index.set(py, [ch])
}

function build() {
  if (index.size) return
  for (let i = 0; i < COMMON_CHARS.length; i++) {
    const ch = COMMON_CHARS[i]
    if (ch) commonRank.set(ch, i)
  }
  for (const ch of COMMON_CHARS) {
    if (ch < '\u4e00' || ch > '\u9fff') continue
    for (const py of readingsOf(ch)) add(py, ch)
  }
  for (let code = 0x4e00; code <= 0x9fff; code++) {
    const ch = String.fromCharCode(code)
    for (const py of readingsOf(ch)) add(py, ch)
  }
}

function sortChars(chars: string[]) {
  return [...chars].sort((a, b) => {
    const ra = commonRank.get(a)
    const rb = commonRank.get(b)
    if (ra != null && rb != null) return ra - rb
    if (ra != null) return -1
    if (rb != null) return 1
    return a.localeCompare(b, 'zh-CN')
  })
}

export function charsForPinyin(py: string, limit = 48) {
  build()
  const key = normPy(py)
  const list = index.get(key) || []
  const light = key.replace(/[1-5]$/, '5')
  const extra = key.endsWith('5') ? [] : index.get(light) || []
  const out: string[] = []
  for (const ch of sortChars([...list, ...extra])) {
    if (!out.includes(ch)) out.push(ch)
    if (out.length >= limit) break
  }
  return out
}

export function charsFromParts(sheng: string | null, yun: string | null, tone: number | null, whole: string | null) {
  build()
  const found: { py: string; source: string; chars: string[] }[] = []
  if (sheng && yun && tone) {
    const syl = composeSyllable(sheng, yun)
    if (syl) {
      const py = withTone(syl, tone)
      found.push({ py, source: `声母 ${sheng} + 韵母 ${yun} + ${tone}声`, chars: charsForPinyin(py) })
    }
  }
  if (whole && tone) {
    const py = withTone(whole, tone)
    if (!found.some((f) => f.py === py)) {
      found.push({ py, source: `整体认读 ${whole} + ${tone}声`, chars: charsForPinyin(py) })
    }
  }
  return found
}

export function pickMainChar(groups: { py: string; chars: string[] }[]) {
  for (const g of groups) {
    if (g.chars.length) return { char: g.chars[0], py: g.py, all: g.chars }
  }
  return null
}

if (typeof window !== 'undefined') {
  const start = () => {
    try {
      build()
    } catch {
      /* first combine() will retry */
    }
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(start)
  else window.setTimeout(start, 0)
}
