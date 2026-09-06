import { STAGE_DEFS, heroIndexForStage } from './stages'

const WECHAT = typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent)
const LOAD_MS = WECHAT ? 16000 : 22000
const POOL = WECHAT ? 2 : 4
const CUT_EDGE = WECHAT ? 480 : 768
const ROAD_EDGE = WECHAT ? 640 : 1024
const blobUrls: string[] = []

export type ArtProgress = (done: number, total: number) => void

function artUrl(file: string): string {
  const base = import.meta.env.BASE_URL || './'
  const path = `${base.endsWith('/') ? base : `${base}/`}art/${file}`
  try {
    return new URL(path, window.location.href).href
  } catch {
    return path
  }
}

function yieldFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
    else setTimeout(resolve, 0)
  })
}

function loadImageTag(src: string, ms: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      img.onload = null
      img.onerror = null
      img.remove()
      if (ok && (img.naturalWidth || img.width)) resolve(img)
      else reject(new Error('load ' + src))
    }
    const timer = setTimeout(() => finish(false), ms)
    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.style.cssText = 'position:fixed;left:-9999px;top:0;max-width:none;pointer-events:none'
    try {
      document.body?.appendChild(img)
    } catch {
      /* ignore */
    }
    img.src = src
    if (img.complete && img.naturalWidth) finish(true)
  })
}

async function fetchBlob(src: string, ms: number): Promise<Blob> {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null
  const timer = setTimeout(() => ctrl?.abort(), ms)
  try {
    const res = await fetch(src, { signal: ctrl?.signal })
    if (!res.ok) throw new Error('http ' + res.status)
    return await res.blob()
  } finally {
    clearTimeout(timer)
  }
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  try {
    return await loadImageTag(src, LOAD_MS)
  } catch {
    const blob = await fetchBlob(src, LOAD_MS)
    const url = URL.createObjectURL(blob)
    const img = await loadImageTag(url, 10000)
    blobUrls.push(url)
    return img
  }
}

function sourceSize(img: CanvasImageSource): { w: number; h: number } {
  if (img instanceof HTMLImageElement) {
    return { w: img.naturalWidth || img.width, h: img.naturalHeight || img.height }
  }
  if (img instanceof HTMLCanvasElement) return { w: img.width, h: img.height }
  return {
    w: Math.max(1, Number('width' in img ? img.width : 8) || 8),
    h: Math.max(1, Number('height' in img ? img.height : 8) || 8),
  }
}

/** Chroma-key green (#00FF00-ish) to alpha, with spill suppression. */
export function chromaKey(img: CanvasImageSource, maxEdge = CUT_EDGE): HTMLCanvasElement {
  const { w: iw, h: ih } = sourceSize(img)
  const scale = Math.min(1, maxEdge / Math.max(iw, ih, 1))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(iw * scale))
  c.height = Math.max(1, Math.round(ih * scale))
  const g = (() => {
    try {
      return c.getContext('2d', { willReadFrequently: true }) || c.getContext('2d')
    } catch {
      return c.getContext('2d')
    }
  })()
  if (!g) return c
  g.drawImage(img, 0, 0, c.width, c.height)
  let data: ImageData
  try {
    data = g.getImageData(0, 0, c.width, c.height)
  } catch {
    return c
  }
  const px = data.data
  const corners = [0, (c.width - 1) * 4, (c.height - 1) * c.width * 4, ((c.height - 1) * c.width + c.width - 1) * 4]
  let kr = 0
  let kg = 0
  let kb = 0
  for (const i of corners) {
    kr += px[i]
    kg += px[i + 1]
    kb += px[i + 2]
  }
  kr /= 4
  kg /= 4
  kb /= 4
  const keyIsGreen = kg > kr + 40 && kg > kb + 40 && kg > 140
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]
    const g0 = px[i + 1]
    const b = px[i + 2]
    if (keyIsGreen) {
      const dist = Math.hypot(r - kr, g0 - kg, b - kb)
      const screenGreen = g0 > 140 && g0 > r + 45 && g0 > b + 45 && r < 120 && b < 120
      let a = 255
      if (screenGreen && dist < 70) a = 0
      else if (screenGreen && dist < 110) a = Math.max(0, Math.round(((dist - 70) / 40) * 255))
      else if (dist < 28) a = 0
      px[i + 3] = Math.min(px[i + 3], a)
    } else {
      const lum = r * 0.3 + g0 * 0.5 + b * 0.2
      const chroma = Math.max(r, g0, b) - Math.min(r, g0, b)
      if (lum > 232 && chroma < 18) px[i + 3] = 0
    }
  }
  g.putImageData(data, 0, 0)
  let opaque = 0
  for (let i = 3; i < px.length; i += 4) if (px[i] > 12) opaque++
  if (opaque < c.width * c.height * 0.05) {
    g.clearRect(0, 0, c.width, c.height)
    g.drawImage(img, 0, 0, c.width, c.height)
  }
  return c
}

export type ArtPack = {
  stone: HTMLCanvasElement
  heroes: HTMLCanvasElement[]
  portraits: HTMLCanvasElement[]
  spirit: HTMLCanvasElement
  enemies: HTMLCanvasElement[]
  bolts: HTMLCanvasElement[]
  roads: CanvasImageSource[]
  pill: HTMLCanvasElement
  pillAtk: HTMLCanvasElement
}

const HERO_FILES = Array.from({ length: Math.max(1, STAGE_DEFS.length - 1) }, (_, i) => `wukong_s${i + 2}.png`)

const ENEMY_FILES = [
  'enemy_yao.png',
  'enemy_fish.png',
  'enemy_xian.png',
  'enemy_guard.png',
  'enemy_xia.png',
  'enemy_niuma.png',
  'enemy_tianbing.png',
  'enemy_tianjiang.png',
  'enemy_erlang.png',
  'enemy_xiaotian.png',
  'enemy_lingguan.png',
  'enemy_jingang.png',
  'enemy_jinghelong.png',
  'enemy_longgui.png',
  'enemy_panguan.png',
  'enemy_sengbing.png',
  'enemy_huyao.png',
  'enemy_liuzei.png',
  'enemy_bailong.png',
  'enemy_tanseng.png',
  'enemy_heixiong.png',
  'enemy_zhuyao.png',
  'enemy_bajie.png',
  'enemy_huangfeng.png',
  'enemy_huxianfeng.png',
  'enemy_shawujing.png',
  'enemy_sisheng.png',
  'enemy_renshen.png',
  'enemy_zhenyuan.png',
  'enemy_haixian.png',
  'enemy_baigu.png',
  'enemy_qunyao.png',
  'enemy_baowei.png',
  'enemy_huangpao.png',
  'enemy_jingui.png',
  'enemy_jinjiao.png',
  'enemy_yinjiao.png',
  'enemy_wujigui.png',
  'enemy_shiwang.png',
  'enemy_honghai.png',
]

const BOLT_FILES = [
  'bullet_stone.png',
  'bullet_water.png',
  'bullet_gold.png',
  'bullet_fire.png',
  'bullet_jingu.png',
  'bullet_xiandan.png',
  'bullet_samadhi.png',
  'bullet_foguang.png',
  'bullet_guihuo.png',
  'bullet_heifeng.png',
  'bullet_huangsha.png',
  'bullet_renshen.png',
  'bullet_baigu.png',
  'bullet_hulu.png',
  'bullet_sanmei.png',
]

const ROAD_FILES = [
  'road_cloud.png',
  'road_huaguo.png',
  'road_sea.png',
  'road_fangcun.png',
  'road_xiandian.png',
  'road_longgong.png',
  'road_yumajian.png',
  'road_pantao.png',
  'road_tianluo.png',
  'road_bagualu.png',
  'road_lingshan.png',
  'road_jinghe.png',
  'road_tanggong.png',
  'road_lunhui.png',
  'road_shuiliu.png',
  'road_shuangcha.png',
  'road_liangjie.png',
  'road_yingchou.png',
  'road_guanyinyuan.png',
  'road_heifeng.png',
  'road_gaolao.png',
  'road_yunzhan.png',
  'road_huangfeng.png',
  'road_liusha.png',
  'road_lingji.png',
  'road_sisheng.png',
  'road_wuzhuang.png',
  'road_zhenyuan.png',
  'road_sandao.png',
  'road_baihu.png',
  'road_qunyao.png',
  'road_baoxiang.png',
  'road_heisong.png',
  'road_pingding.png',
  'road_lianhua.png',
  'road_yeming.png',
  'road_wuji.png',
  'road_huoyun.png',
  'road_nanhai.png',
]

const imgCache = new Map<string, Promise<HTMLImageElement>>()
const cutCache = new Map<string, HTMLCanvasElement>()
const cutWait = new Map<string, Promise<HTMLCanvasElement>>()
const roadCache = new Map<string, CanvasImageSource>()
const readyKeys = new Set<string>()

function loadCached(src: string): Promise<HTMLImageElement> {
  let p = imgCache.get(src)
  if (!p) {
    p = loadImage(src).catch((err) => {
      imgCache.delete(src)
      throw err
    })
    imgCache.set(src, p)
  }
  return p
}

function fitSource(img: CanvasImageSource, maxEdge: number): HTMLCanvasElement {
  const { w: iw, h: ih } = sourceSize(img)
  const scale = Math.min(1, maxEdge / Math.max(iw, ih, 1))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(iw * scale))
  c.height = Math.max(1, Math.round(ih * scale))
  const g = c.getContext('2d')
  if (g) g.drawImage(img, 0, 0, c.width, c.height)
  return c
}

async function cut(src: string): Promise<HTMLCanvasElement> {
  const hit = cutCache.get(src)
  if (hit) return hit
  let p = cutWait.get(src)
  if (!p) {
    p = (async () => {
      try {
        const canvas = chromaKey(await loadCached(src), CUT_EDGE)
        cutCache.set(src, canvas)
        return canvas
      } catch {
        const ph = blank()
        cutCache.set(src, ph)
        return ph
      } finally {
        cutWait.delete(src)
      }
    })()
    cutWait.set(src, p)
  }
  return p
}

async function runPool<T>(items: T[], fn: (item: T) => Promise<void>): Promise<void> {
  if (!items.length) return
  let i = 0
  const n = Math.min(POOL, items.length)
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const item = items[i++]
        await fn(item)
        await yieldFrame()
      }
    }),
  )
}

function blank(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 8
  return c
}

function fill<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make)
}

export function createArtPack(): ArtPack {
  const ph = blank()
  return {
    stone: ph,
    spirit: ph,
    pill: ph,
    pillAtk: ph,
    heroes: fill(HERO_FILES.length, blank),
    enemies: fill(ENEMY_FILES.length, blank),
    bolts: fill(BOLT_FILES.length, blank),
    roads: fill(ROAD_FILES.length, blank),
    portraits: fill(STAGE_DEFS.length, blank),
  }
}

export function windowStages(startStage: number, extra = 1): number[] {
  const from = Math.max(1, Math.min(STAGE_DEFS.length, startStage))
  const out: number[] = []
  for (let s = from; s <= Math.min(STAGE_DEFS.length, from + extra); s++) out.push(s)
  return out
}

function collectNeed(stages: number[]) {
  const heroes = new Set<number>()
  const enemies = new Set<number>()
  const bolts = new Set<number>()
  const roads = new Set<number>()
  let stone = false
  let spirit = false
  for (const stage of stages) {
    const i = Math.max(0, Math.min(STAGE_DEFS.length - 1, stage - 1))
    const d = STAGE_DEFS[i]
    const h = heroIndexForStage(stage)
    if (h < 0) stone = true
    else if (h < HERO_FILES.length) heroes.add(h)
    if (d.enemy === -1) spirit = true
    else {
      const list = Array.isArray(d.enemy) ? d.enemy : [d.enemy]
      for (const e of list) {
        if (e >= 0 && e < ENEMY_FILES.length) enemies.add(e)
      }
    }
    if (d.bolt >= 0 && d.bolt < BOLT_FILES.length) bolts.add(d.bolt)
    if (d.road >= 0 && d.road < ROAD_FILES.length) roads.add(d.road)
  }
  return { heroes, enemies, bolts, roads, stone, spirit }
}

export async function ensureStages(pack: ArtPack, stages: number[], onProg?: ArtProgress): Promise<void> {
  const need = collectNeed(stages)
  type Job = { key: string; file: string; kind: 'cut' | 'road'; apply: (src: CanvasImageSource) => void }
  const jobs: Job[] = []

  const addCut = (key: string, file: string, apply: (c: HTMLCanvasElement) => void) => {
    const url = artUrl(file)
    const cached = cutCache.get(url)
    if (cached) {
      apply(cached)
      readyKeys.add(key)
      return
    }
    if (jobs.some((j) => j.key === key)) return
    jobs.push({ key, file, kind: 'cut', apply: (src) => apply(src as HTMLCanvasElement) })
  }

  if (need.stone) addCut('shared:stone', 'stone_hero.png', (c) => { pack.stone = c })
  if (need.spirit) addCut('shared:spirit', 'enemy_spirit.png', (c) => { pack.spirit = c })
  addCut('shared:pill', 'pill_xiandan.png', (c) => { pack.pill = c })
  addCut('shared:pillAtk', 'pill_atk.png', (c) => { pack.pillAtk = c })
  for (const i of need.heroes) addCut(`h:${i}`, HERO_FILES[i], (c) => { pack.heroes[i] = c })
  for (const i of need.enemies) addCut(`e:${i}`, ENEMY_FILES[i], (c) => { pack.enemies[i] = c })
  for (const i of need.bolts) addCut(`b:${i}`, BOLT_FILES[i], (c) => { pack.bolts[i] = c })
  for (const i of need.roads) {
    const key = `r:${i}`
    const file = ROAD_FILES[i]
    const url = artUrl(file)
    const cached = roadCache.get(url)
    if (cached) {
      pack.roads[i] = cached
      readyKeys.add(key)
      continue
    }
    jobs.push({
      key,
      file,
      kind: 'road',
      apply: (src) => {
        pack.roads[i] = src
        roadCache.set(url, src)
      },
    })
  }

  const total = Math.max(1, jobs.length)
  let done = 0
  onProg?.(jobs.length ? 0 : 1, total)

  await runPool(jobs, async (job) => {
    const url = artUrl(job.file)
    try {
      if (job.kind === 'cut') job.apply(await cut(url))
      else job.apply(fitSource(await loadCached(url), ROAD_EDGE))
    } catch {
      if (job.key.startsWith('h:')) {
        const idx = Number(job.key.slice(2))
        let prev = pack.stone
        for (let j = idx - 1; j >= 0; j--) {
          if (pack.heroes[j] && pack.heroes[j].width > 8) {
            prev = pack.heroes[j]
            break
          }
        }
        job.apply(prev)
      } else job.apply(blank())
    }
    readyKeys.add(job.key)
    done += 1
    onProg?.(done, total)
  })

  for (const stage of stages) {
    const i = Math.max(0, Math.min(STAGE_DEFS.length - 1, stage - 1))
    const h = heroIndexForStage(stage)
    pack.portraits[i] = h < 0 ? pack.stone : pack.heroes[Math.max(0, h)]
  }
}

/** 先加载当前关，进游戏后再预取下一关，避免微信里一次解码过多大图卡死。 */
export async function loadArtForProgress(startStage: number, onProg?: ArtProgress): Promise<ArtPack> {
  const pack = createArtPack()
  await ensureStages(pack, [startStage], onProg)
  return pack
}
