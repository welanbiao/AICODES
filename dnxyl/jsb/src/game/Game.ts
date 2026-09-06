import Matter from 'matter-js'
import type { ArtPack } from './assets'
import {
  BREAK_TITLES,
  CLONE_MAX,
  LANES,
  PATH_W,
  QI_NEED,
  STAGE_COUNT,
  STAGE_NAMES,
  WX_COLORS,
  WX_NAMES,
  boltDmg,
  breakAtkGain,
  combatFireGap,
  needXiu,
  pillAtkGain,
  shotCount,
  stageSpeed,
} from './constants'
import { stageDef } from './stages'
import { StageMusic } from './audio'
import type { Bolt, Burst, Floater, GameProgress, Gate, HudSnap, Mob, Pickup } from './types'

const { Engine, Bodies, Body, Composite, Events } = Matter

const CAT = {
  player: 0x0001,
  mob: 0x0002,
  loot: 0x0004,
  bolt: 0x0008,
}

export class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  art: ArtPack
  music: StageMusic
  onHud: (s: HudSnap) => void

  stage = 1
  hp = 100
  maxHp = 100
  wuXing = [0, 0, 0, 0, 0]
  xiuwei = 0
  playTime = 0
  playerX = 0
  playerZ = 0
  pointer: number | null = 0.5
  keys = { left: false, right: false }
  paused = false
  breakHold = false
  loading = true
  loadT = 0
  breaking = false
  breakT = 0
  burstAcc = 0
  ended = false
  prompted = false
  spawnCd = 0.6
  atkCd = 0
  hurtCd = 0
  nid = 1
  bonusShots = 0
  bonusDmg = 1
  bonusFire = 1
  cloneCount = 1
  pillHp = 0
  atkBonus = 0
  hudKey = ''
  gateCd = 1.2

  mobs: Mob[] = []
  bolts: Bolt[] = []
  pickups: Pickup[] = []
  gates: Gate[] = []
  floats: Floater[] = []
  bursts: Burst[] = []

  engine: Matter.Engine
  playerBody: Matter.Body
  bodies = new Map<string, Matter.Body>()
  raf = 0
  last = 0
  running = false
  private dirty = false
  private saveAcc = 0
  private onSave?: (p: GameProgress, reason: 'break' | 'tick' | 'revive') => void
  private onAdvance?: (stage: number) => void

  private onCol: (e: Matter.IEventCollision<Matter.Engine>) => void
  private onKey: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void

  constructor(
    canvas: HTMLCanvasElement,
    art: ArtPack,
    music: StageMusic,
    onHud: (s: HudSnap) => void,
    opts?: {
      progress?: GameProgress
      onSave?: (p: GameProgress, reason: 'break' | 'tick' | 'revive') => void
      onAdvance?: (stage: number) => void
    },
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas')
    this.ctx = ctx
    this.art = art
    this.music = music
    this.onHud = onHud
    this.engine = Engine.create({ gravity: { x: 0, y: 0 } })
    this.playerBody = this.circle('player', 0, 0.4, 0.72, CAT.player, CAT.mob | CAT.loot)
    this.onCol = (e) => {
      if (this.paused || this.breakHold || this.loading || this.breaking || this.ended) return
      for (const pair of e.pairs) this.resolve(pair.bodyA, pair.bodyB)
    }
    Events.on(this.engine, 'collisionStart', this.onCol)

    this.onKey = (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        this.clickBreak()
      }
      if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause()
    }
    this.onKeyUp = (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false
    }
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKeyUp)
    this.onSave = opts?.onSave
    this.onAdvance = opts?.onAdvance
    if (opts?.progress) this.applyProgress(opts.progress)
    else {
      const jump = Number(new URLSearchParams(location.search).get('s') || 0)
      if (jump >= 1 && jump <= STAGE_COUNT) this.stage = jump
    }
  }

  snapshot(): GameProgress {
    return {
      stage: this.stage,
      hp: Math.round(this.hp),
      maxHp: Math.round(this.maxHp),
      pillHp: this.pillHp,
      xiuwei: this.xiuwei,
      wuXing: this.wuXing.slice(),
      cloneCount: this.cloneCount,
      bonusShots: this.bonusShots,
      bonusDmg: this.bonusDmg,
      bonusFire: this.bonusFire,
      atkBonus: this.atkBonus,
    }
  }

  applyProgress(p: GameProgress) {
    this.stage = Math.max(1, Math.min(STAGE_COUNT, Math.round(p.stage) || 1))
    this.pillHp = Math.max(0, p.pillHp || 0)
    this.xiuwei = Math.max(0, p.xiuwei || 0)
    this.wuXing = Array.isArray(p.wuXing) ? p.wuXing.slice(0, 5) : [0, 0, 0, 0, 0]
    while (this.wuXing.length < 5) this.wuXing.push(0)
    this.cloneCount = Math.max(1, Math.min(CLONE_MAX, Math.round(p.cloneCount) || 1))
    this.bonusShots = p.bonusShots || 0
    this.bonusDmg = p.bonusDmg || 1
    this.bonusFire = p.bonusFire || 1
    this.atkBonus = Math.max(0, p.atkBonus || 0)
    this.applyMaxHp(false)
    if (p.maxHp > 0) this.maxHp = p.maxHp
    this.hp = Math.max(1, Math.min(this.maxHp, Math.round(p.hp || this.maxHp)))
  }

  private markDirty() {
    this.dirty = true
  }

  private flushSave(reason: 'break' | 'tick' | 'revive') {
    this.dirty = false
    this.saveAcc = 0
    this.onSave?.(this.snapshot(), reason)
  }

  setPointer(nx: number) {
    this.pointer = Math.max(0, Math.min(1, nx))
    void this.music.resume()
  }

  start() {
    this.running = true
    this.last = performance.now()
    this.music.playStage(this.stage)
    this.pushHud()
    const loop = (now: number) => {
      if (!this.running) return
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.tick(dt)
      this.draw()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    Events.off(this.engine, 'collisionStart', this.onCol)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKeyUp)
    Engine.clear(this.engine)
  }

  togglePause() {
    if (this.loading || this.breaking) return
    this.paused = !this.paused
    this.music.setHeld(this.paused || this.breakHold)
    this.pushHud()
  }

  clickBreak() {
    if (!this.meetsBreak() || this.breaking || this.loading) return
    this.breaking = true
    this.breakT = 0
    this.burstAcc = 0
    this.paused = false
    this.music.setHeld(false)
    this.music.beep(523, 0.3, 'triangle', 0.16)
    this.music.beep(784, 0.45, 'sine', 0.12)
    this.pushHud()
  }

  meetsBreak() {
    if (this.stage >= STAGE_COUNT) return false
    if (this.stage === 1) return this.wuXing.every((v) => v >= QI_NEED)
    return this.xiuwei >= needXiu(this.stage)
  }

  private tick(dt: number) {
    if (this.loading) {
      this.loadT += dt
      if (this.loadT >= 2.2) this.loading = false
      this.pushHud()
      return
    }
    if (this.ended) return
    if (this.paused && !this.breaking) return

    if (this.breaking) {
      this.breakT += dt
      this.burstAcc += dt
      if (this.burstAcc >= 0.12) {
        this.burstAcc = 0
        this.burst(this.W() * 0.5, this.H() * 0.62, WX_COLORS[(this.nid + this.stage) % 5], 14)
      }
      this.stepFx(dt)
      if (this.breakT >= 2.1) this.finishBreak()
      this.pushHud()
      return
    }

    if (this.breakHold) {
      this.stepFx(dt)
      return
    }

    this.playTime += dt
    this.hurtCd = Math.max(0, this.hurtCd - dt)
    this.saveAcc += dt
    if (this.dirty && this.saveAcc >= 5) this.flushSave('tick')
    this.playerZ += stageSpeed(this.stage, this.playTime) * dt

    if (this.keys.left) this.playerX -= 5.4 * dt
    if (this.keys.right) this.playerX += 5.4 * dt
    if (this.pointer != null) {
      const target = (this.pointer * 2 - 1) * PATH_W
      this.playerX += (target - this.playerX) * (1 - Math.exp(-14 * dt))
    }
    this.playerX = Math.max(-PATH_W, Math.min(PATH_W, this.playerX))
    if (this.stage === 1) this.cloneCount = 1
    this.syncClones()

    this.spawnCd -= dt
    if (this.spawnCd <= 0) {
      this.spawnPack()
      this.spawnCd =
        this.stage === 1
          ? Math.max(0.34, 1.05 / Math.min(2.6, 1 + this.playTime / 210))
          : Math.max(0.48, (1.25 - Math.min(this.stage, 10) * 0.05) / Math.min(3, 1 + this.playTime / 920))
    }

    this.gateCd -= dt
    if (this.gateCd <= 0) {
      if (this.stage === 1) this.spawnElemPair()
      else this.spawnClonePair()
      this.gateCd = 2.4 + Math.random() * 1.4
    }
    if (Math.random() < dt * 0.22) this.spawnLootOrGate()

    if (this.stage >= 2) {
      this.atkCd -= dt
      if (this.atkCd <= 0) {
        this.shoot()
        this.atkCd = combatFireGap(this.stage, this.playTime, this.bonusFire)
      }
    }

    this.stepMobs(dt)
    this.stepBolts(dt)
    this.pruneLoot()
    for (const g of this.gates) g.pulse += dt
    Engine.update(this.engine, dt * 1000)
    this.stepFx(dt)

    if (this.meetsBreak() && !this.prompted) {
      this.prompted = true
      this.breakHold = true
      this.music.setHeld(true)
    }
    this.pushHud()
  }

  private stepFx(dt: number) {
    this.floats = this.floats.filter((f) => {
      f.t -= dt
      f.y -= 28 * dt
      return f.t > 0
    })
    this.bursts = this.bursts.filter((b) => {
      b.t -= dt
      return b.t > 0
    })
  }

  private formation() {
    const n = Math.max(1, Math.min(CLONE_MAX, this.cloneCount))
    const slots = [{ x: 0, z: 0 }]
    let left = n - 1
    let row = 1
    while (left > 0) {
      const cols = Math.min(left, row + 1)
      for (let i = 0; i < cols; i++) {
        slots.push({ x: (i - (cols - 1) * 0.5) * 0.46, z: -row * 0.4 })
      }
      left -= cols
      row++
    }
    return slots
  }

  private syncClones() {
    const slots = this.formation()
    Body.setPosition(this.playerBody, { x: this.playerX, y: this.playerZ + 0.4 })
    for (let i = 1; i < CLONE_MAX; i++) {
      const lab = `player:${i}`
      if (i >= slots.length) {
        this.drop(lab)
        continue
      }
      const x = this.playerX + slots[i].x
      const z = this.playerZ + slots[i].z + 0.4
      const b = this.bodies.get(lab)
      if (b) Body.setPosition(b, { x, y: z })
      else this.circle(lab, x, z, 0.5, CAT.player, CAT.mob | CAT.loot)
    }
  }

  private finishBreak() {
    const from = this.stage
    if (from >= STAGE_COUNT) {
      this.ended = true
      this.breaking = false
      return
    }
    if (from === 1) this.wuXing = [0, 0, 0, 0, 0]
    this.xiuwei = 0
    this.bonusShots = 0
    this.bonusFire = 1
    this.cloneCount = 1
    const atkGain = breakAtkGain(from)
    this.atkBonus += atkGain
    this.stage = from + 1
    this.hp = this.applyMaxHp(true)
    this.playTime = 0
    this.breaking = false
    this.prompted = false
    this.breakHold = false
    this.paused = false
    this.music.setHeld(false)
    this.music.playStage(this.stage)
    this.clearWorld()
    this.float(this.W() * 0.5, this.H() * 0.45, BREAK_TITLES[from - 1], '#ffd24a')
    this.float(this.W() * 0.5, this.H() * 0.52, `弹幕攻击+${atkGain}`, '#ff7a3a')
    if (this.stage < STAGE_COUNT) this.onAdvance?.(this.stage + 1)
    this.flushSave('break')
  }

  private clearWorld() {
    this.mobs = []
    this.bolts = []
    this.pickups = []
    this.gates = []
    Composite.clear(this.engine.world, false)
    this.bodies.clear()
    this.playerBody = this.circle('player', this.playerX, this.playerZ + 0.4, 0.72, CAT.player, CAT.mob | CAT.loot)
  }

  private circle(label: string, x: number, z: number, r: number, cat: number, mask: number) {
    const b = Bodies.circle(x, z, r, {
      isSensor: true,
      sleepThreshold: Infinity,
      label,
      collisionFilter: { category: cat, mask },
    })
    Composite.add(this.engine.world, b)
    this.bodies.set(label, b)
    return b
  }

  private rect(label: string, x: number, z: number, w: number, d: number, cat: number, mask: number) {
    const b = Bodies.rectangle(x, z, w, d, {
      isSensor: true,
      sleepThreshold: Infinity,
      label,
      collisionFilter: { category: cat, mask },
    })
    Composite.add(this.engine.world, b)
    this.bodies.set(label, b)
    return b
  }

  private drop(label: string) {
    const b = this.bodies.get(label)
    if (!b) return
    Composite.remove(this.engine.world, b)
    this.bodies.delete(label)
  }

  private spawnPack() {
    if (this.mobs.length > (this.stage >= 8 ? 18 : 26)) return
    const n =
      this.stage === 1
        ? 1 + (Math.random() < 0.45 ? 1 : 0)
        : this.stage <= 4
          ? 1 + (this.stage >> 1)
          : 2 + (Math.random() < 0.35 ? 1 : 0)
    const hpMul = this.stage >= 5 ? 2.7 : this.stage >= 4 ? 1.5 : 1
    const hp = Math.round((22 + this.stage * 14) * hpMul)
    for (let i = 0; i < n; i++) {
      const lane = LANES[(Math.random() * LANES.length) | 0]
      const z = this.playerZ + 18 + i * 1.2 + Math.random() * 8
      const kind = this.pickKind()
      const elem = kind <= 4 ? kind : -1
      const id = this.nid++
      const m: Mob = {
        id,
        kind,
        elem,
        x: lane * 0.95,
        z,
        hp,
        dead: false,
        bob: Math.random() * 6,
      }
      this.mobs.push(m)
      this.circle(`mob:${id}`, m.x, m.z, 0.5, CAT.mob, CAT.player | CAT.bolt)
    }
  }

  private pickKind() {
    const def = stageDef(this.stage)
    if (def.enemy === -1) return (Math.random() * 5) | 0
    const n = Array.isArray(def.enemy) ? def.enemy.length : 1
    return (Math.random() * n) | 0
  }

  private spawnClonePair() {
    if (this.gates.filter((g) => g.mode === 'cloneAdd' || g.mode === 'cloneSub').length >= 6) return
    const z = this.playerZ + 20 + Math.random() * 4
    if (this.gates.some((g) => Math.abs(g.z - z) < 7)) return
    const add = 2 + ((Math.random() * 5) | 0)
    const sub = 1 + ((Math.random() * 4) | 0)
    const [plus, minus] = this.randomSides()
    this.addGate(plus.x, z, plus.x0, plus.x1, 'cloneAdd', add, 0)
    this.addGate(minus.x, z, minus.x0, minus.x1, 'cloneSub', sub, 0)
  }

  private spawnElemPair() {
    if (this.gates.filter((g) => g.mode === 'elemAdd' || g.mode === 'elemSub').length >= 6) return
    const z = this.playerZ + 20 + Math.random() * 4
    if (this.gates.some((g) => Math.abs(g.z - z) < 7)) return
    const eAdd = (Math.random() * 5) | 0
    const eSub = (Math.random() * 5) | 0
    const add = 2 + ((Math.random() * 4) | 0)
    const sub = 1 + ((Math.random() * 3) | 0)
    const [plus, minus] = this.randomSides()
    this.addGate(plus.x, z, plus.x0, plus.x1, 'elemAdd', add, eAdd)
    this.addGate(minus.x, z, minus.x0, minus.x1, 'elemSub', sub, eSub)
  }

  private randomSides() {
    const left = { x: -PATH_W * 0.52, x0: -PATH_W, x1: -0.08 }
    const right = { x: PATH_W * 0.52, x0: 0.08, x1: PATH_W }
    return Math.random() < 0.5 ? [left, right] : [right, left]
  }

  private addGate(
    x: number,
    z: number,
    x0: number,
    x1: number,
    mode: Gate['mode'],
    delta: number,
    elem: number,
  ) {
    const id = this.nid++
    const sign = mode === 'cloneAdd' || mode === 'elemAdd' ? '+' : '-'
    const prefix = mode === 'elemAdd' || mode === 'elemSub' ? WX_NAMES[elem] : ''
    const g: Gate = {
      id,
      x,
      z,
      x0,
      x1,
      elem,
      add: delta,
      xiuAdd: 0,
      shotAdd: 0,
      dmgMul: 1,
      fireMul: 1,
      label: `${prefix}${sign}${delta}`,
      mode,
      delta,
      used: false,
      pulse: Math.random(),
    }
    this.gates.push(g)
    this.rect(`gate:${id}`, (x0 + x1) * 0.5, z, Math.abs(x1 - x0), 0.7, CAT.loot, CAT.player)
  }

  private spawnLootOrGate() {
    if (this.pickups.length > 5) return
    const z = this.playerZ + 16 + Math.random() * 12
    const x = (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.8)
    const id = this.nid++
    const atk = Math.random() < 0.5
    const grow = 8 + this.stage * 2 + ((Math.random() * 6) | 0)
    const p: Pickup = {
      id,
      kind: atk ? 'atk' : 'hp',
      x,
      z,
      elem: 0,
      qi: 0,
      xiu: 0,
      heal: atk ? 0 : grow,
      atk: atk ? pillAtkGain(this.stage) : 0,
      taken: false,
    }
    this.pickups.push(p)
    this.circle(`pick:${id}`, x, z, 0.48, CAT.loot, CAT.player)
  }

  private shoot() {
    const def = stageDef(this.stage)
    const dmg = boltDmg(this.stage, this.xiuwei, this.bonusDmg, this.atkBonus)
    const aim = this.nearestMob()
    let vx = 0
    let vz = def.boltVz
    const elem = def.boltElem
    const slots = this.formation().slice(0, 18)
    const extra = slots.length === 1 ? shotCount(this.xiuwei, this.bonusShots) : 1
    for (const s of slots) {
      for (let i = 0; i < extra; i++) {
        const spread = extra === 1 ? 0 : (i - (extra - 1) * 0.5) * 0.22
        let sx = vx
        let sz = vz
        if (aim) {
          const dx = aim.x - (this.playerX + s.x)
          const dz = Math.max(0.4, aim.z - (this.playerZ + s.z))
          const len = Math.hypot(dx, dz) || 1
          sx = (dx / len) * vz + spread * 2.4
          sz = (dz / len) * vz
        }
        const id = this.nid++
        const b: Bolt = {
          id,
          x: this.playerX + s.x + spread,
          z: this.playerZ + s.z + 1.1,
          vx: sx,
          vz: sz,
          dmg,
          elem,
          life: 1.5,
        }
        this.bolts.push(b)
        this.circle(`bolt:${id}`, b.x, b.z, 0.26, CAT.bolt, CAT.mob)
      }
    }
    this.music.fire()
  }

  private nearestMob(): Mob | null {
    let best: Mob | null = null
    let bestD = 1e9
    for (const m of this.mobs) {
      if (m.dead || m.z < this.playerZ) continue
      const d = (m.x - this.playerX) ** 2 + (m.z - this.playerZ) ** 2
      if (d < bestD) {
        bestD = d
        best = m
      }
    }
    return best
  }

  private stepMobs(dt: number) {
    const approach = this.stage === 1 ? 4.2 : this.stage >= 5 ? 5.1 : 3.4
    for (const m of this.mobs) {
      if (m.dead) continue
      m.bob += dt
      m.z -= approach * dt
      if (this.stage > 1) m.x += (this.playerX - m.x) * 0.12 * dt
      const b = this.bodies.get(`mob:${m.id}`)
      if (b) Body.setPosition(b, { x: m.x, y: m.z })
      if (m.z < this.playerZ - 1.6) this.killMob(m, false)
    }
    this.mobs = this.mobs.filter((m) => !m.dead)
  }

  private stepBolts(dt: number) {
    for (const b of this.bolts) {
      b.z += b.vz * dt
      b.x += b.vx * dt
      b.life -= dt
      const body = this.bodies.get(`bolt:${b.id}`)
      if (body) Body.setPosition(body, { x: b.x, y: b.z })
    }
    for (const b of this.bolts) {
      if (b.life <= 0) this.drop(`bolt:${b.id}`)
    }
    this.bolts = this.bolts.filter((b) => b.life > 0)
  }

  private pruneLoot() {
    for (const p of this.pickups) {
      if (p.taken || p.z < this.playerZ - 2) {
        p.taken = true
        this.drop(`pick:${p.id}`)
      }
    }
    for (const g of this.gates) {
      if (g.used || g.z < this.playerZ - 2) {
        g.used = true
        this.drop(`gate:${g.id}`)
      }
    }
    this.pickups = this.pickups.filter((p) => !p.taken)
    this.gates = this.gates.filter((g) => !g.used)
  }

  private resolve(a: Matter.Body, b: Matter.Body) {
    const pa = parseLabel(a.label)
    const pb = parseLabel(b.label)
    if (!pa || !pb) return
    const hit = (t1: Tag['t'], t2: Tag['t']) => {
      if (pa.t === t1 && pb.t === t2) return [pa, pb] as const
      if (pa.t === t2 && pb.t === t1) return [pb, pa] as const
      return null
    }
    const pm = hit('player', 'mob')
    if (pm) {
      const mob = this.mobs.find((m) => m.id === pm[1].id)
      if (mob && !mob.dead) {
        if (this.stage === 1 && mob.elem >= 0) this.capture(mob)
        else {
          this.hurt(this.stage >= 5 ? 18 : 6 + this.stage * 2)
          if (this.stage >= 2 && this.cloneCount > 1) {
            this.cloneCount -= 1
            this.floatWorld(this.playerX, this.playerZ, '分身-1', '#ff734d')
          }
          this.killMob(mob, true)
          this.burstWorld(mob.x, mob.z, '#ff4a3a', 12)
        }
      }
      return
    }
    const bm = hit('bolt', 'mob')
    if (bm) {
      const bolt = this.bolts.find((x) => x.id === bm[0].id)
      const mob = this.mobs.find((m) => m.id === bm[1].id)
      if (bolt && mob && !mob.dead && bolt.life > 0) {
        mob.hp -= bolt.dmg
        bolt.life = 0
        this.drop(`bolt:${bolt.id}`)
        this.burstWorld(mob.x, mob.z, stageDef(this.stage).burst, 14)
        this.music.hit(this.stage)
        if (mob.hp <= 0) this.kill(mob)
      }
      return
    }
    const pp = hit('player', 'pick')
    if (pp) {
      const p = this.pickups.find((x) => x.id === pp[1].id)
      if (p && !p.taken) {
        p.taken = true
        this.drop(`pick:${p.id}`)
        this.takePickup(p)
      }
      return
    }
    const pg = hit('player', 'gate')
    if (pg) {
      const g = this.gates.find((x) => x.id === pg[1].id)
      if (g && !g.used) {
        g.used = true
        this.drop(`gate:${g.id}`)
        this.takeGate(g)
      }
    }
  }

  private killMob(m: Mob, burst: boolean) {
    if (m.dead) return
    m.dead = true
    this.drop(`mob:${m.id}`)
    if (burst) this.burstWorld(m.x, m.z, '#ff4a3a', 8)
  }

  private capture(m: Mob) {
    this.killMob(m, false)
    const e = Math.max(0, m.elem)
    this.wuXing[e] = Math.min(QI_NEED, this.wuXing[e] + 1)
    this.hp = Math.min(this.maxHp, Math.round(this.hp + 1))
    this.floatWorld(m.x, m.z, `捕获 ${WX_NAMES[e]} ${this.wuXing[e]}/${QI_NEED}`, WX_COLORS[e])
    this.burstWorld(m.x, m.z, WX_COLORS[e], 16)
    this.music.capture()
    this.markDirty()
  }

  private kill(m: Mob) {
    this.killMob(m, false)
    if (this.stage === 1 && m.elem >= 0) {
      this.wuXing[m.elem] = Math.min(QI_NEED, this.wuXing[m.elem] + 1)
      this.floatWorld(m.x, m.z, `${WX_NAMES[m.elem]}+1`, WX_COLORS[m.elem])
    } else {
      let gain = 12 + this.stage * 6 + ((Math.random() * 10) | 0)
      if (this.stage === 3) gain = 55 + ((Math.random() * 30) | 0)
      if (this.stage === 4) gain = 220 + ((Math.random() * 110) | 0)
      if (this.stage >= 5) {
        const need = needXiu(this.stage)
        const kills = 85 + this.stage * 3
        gain = Math.max(240, Math.round((need / kills) * (0.72 + Math.random() * 0.5)))
      }
      this.xiuwei += gain
      this.floatWorld(m.x, m.z, `修为+${gain}`, '#ffd24a')
    }
    this.hp = Math.min(this.maxHp, Math.round(this.hp + 1))
    this.markDirty()
  }

  private takePickup(p: Pickup) {
    if (p.kind === 'atk') {
      const gain = Math.max(1, Math.round(p.atk || pillAtkGain(this.stage)))
      this.atkBonus += gain
      this.floatWorld(p.x, p.z, `诛妖丹 攻击+${gain}`, '#ff6a3a')
      this.burstWorld(p.x, p.z, '#ff4a2a', 16)
    } else {
      const grow = Math.max(1, Math.round(p.heal || 10))
      this.pillHp += grow
      this.applyMaxHp(false)
      this.hp = Math.min(this.maxHp, Math.round(this.hp + grow))
      this.floatWorld(p.x, p.z, `九转金丹 生命+${grow}`, '#ffd24a')
      this.burstWorld(p.x, p.z, '#ffd24a', 16)
    }
    this.music.capture()
    this.markDirty()
  }

  private takeGate(g: Gate) {
    if (g.mode === 'elemAdd') {
      const e = Math.max(0, Math.min(4, g.elem))
      const before = this.wuXing[e]
      this.wuXing[e] = Math.min(QI_NEED, this.wuXing[e] + g.delta)
      this.floatWorld(g.x, g.z, `${WX_NAMES[e]}+${this.wuXing[e] - before}`, WX_COLORS[e])
      this.burstWorld(g.x, g.z, WX_COLORS[e], 22)
      this.music.capture()
      return
    }
    if (g.mode === 'elemSub') {
      const e = Math.max(0, Math.min(4, g.elem))
      const before = this.wuXing[e]
      this.wuXing[e] = Math.max(0, this.wuXing[e] - g.delta)
      this.floatWorld(g.x, g.z, `${WX_NAMES[e]}-${before - this.wuXing[e]}`, '#ff5a5a')
      this.burstWorld(g.x, g.z, '#ff5a5a', 22)
      this.music.hurt()
      return
    }
    if (g.mode === 'cloneAdd') {
      const n = Math.min(CLONE_MAX, this.cloneCount + g.delta)
      const gained = n - this.cloneCount
      this.cloneCount = n
      this.floatWorld(g.x, g.z, `分身+${gained}`, '#7dff7a')
      this.burstWorld(g.x, g.z, '#7dff7a', 22)
      this.music.capture()
      this.music.beep(980, 0.18, 'sine', 0.1)
      return
    }
    if (g.mode === 'cloneSub') {
      const n = Math.max(1, this.cloneCount - g.delta)
      const lost = this.cloneCount - n
      this.cloneCount = n
      this.floatWorld(g.x, g.z, lost ? `分身-${lost}` : '分身已尽', '#ff5a5a')
      this.burstWorld(g.x, g.z, '#ff5a5a', 22)
      this.music.hurt()
      return
    }
    this.music.capture()
  }

  private applyMaxHp(fill: boolean) {
    this.maxHp = Math.round(100 + this.stage * 20 + this.pillHp)
    if (fill) this.hp = this.maxHp
    else this.hp = Math.round(Math.max(0, Math.min(this.maxHp, this.hp)))
    return this.hp
  }

  private hurt(n: number) {
    if (this.hurtCd > 0) return
    this.hurtCd = 0.7
    this.hp = Math.max(0, Math.round(this.hp - Math.round(n)))
    this.music.hurt()
    this.burst(this.W() * 0.5, this.H() * 0.72, '#ff3a3a', 12)
    this.markDirty()
    if (this.hp <= 0) this.revive()
  }

  private revive() {
    this.applyMaxHp(true)
    this.playTime = 0
    this.playerX = 0
    this.cloneCount = Math.max(1, Math.floor(this.cloneCount * 0.5))
    this.clearWorld()
    this.float(this.W() * 0.5, this.H() * 0.42, '元神溃散 · 本关再炼', '#ff734d')
    this.flushSave('revive')
  }

  private float(x: number, y: number, text: string, color: string) {
    this.floats.push({ x, y, text, color, t: 1.1 })
  }

  private floatWorld(x: number, z: number, text: string, color: string) {
    const p = this.proj(x, z)
    this.float(p.x, p.y - 20, text, color)
  }

  private burst(x: number, y: number, color: string, n: number) {
    this.bursts.push({ x, y, color, t: 0.55, n, seed: Math.random() * 99 })
  }

  private burstWorld(x: number, z: number, color: string, n: number) {
    const p = this.proj(x, z)
    this.burst(p.x, p.y, color, n)
  }

  private W() {
    return this.canvas.clientWidth || 720
  }
  private H() {
    return this.canvas.clientHeight || 1280
  }

  private proj(wx: number, wz: number) {
    const W = this.W()
    const H = this.H()
    const d = wz - this.playerZ
    const u = Math.max(0, Math.min(1, d / 36))
    const k = Math.pow(u, 0.72)
    const spread = (1 - k) * (W * 0.42) + k * (W * 0.1)
    return {
      x: W * 0.5 + (wx / PATH_W) * spread,
      y: (1 - k) * (H * 0.7) + k * (H * 0.28),
      s: (1 - k) * 1.08 + k * 0.14,
      u: k,
    }
  }

  private draw() {
    const ctx = this.ctx
    const W = this.W()
    const H = this.H()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (this.canvas.width !== Math.floor(W * dpr) || this.canvas.height !== Math.floor(H * dpr)) {
      this.canvas.width = Math.floor(W * dpr)
      this.canvas.height = Math.floor(H * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, W, H)

    this.drawBg(W, H)

    const drawables: { z: number; fn: () => void }[] = []
    for (const g of this.gates) drawables.push({ z: g.z, fn: () => this.drawGate(g) })
    for (const p of this.pickups) drawables.push({ z: p.z, fn: () => this.drawPickup(p) })
    for (const m of this.mobs) drawables.push({ z: m.z, fn: () => this.drawMob(m) })
    for (const b of this.bolts) drawables.push({ z: b.z, fn: () => this.drawBolt(b) })
    drawables.sort((a, b) => b.z - a.z)
    for (const d of drawables) d.fn()

    this.drawHero()
    this.drawFx()
    if (this.loading) this.drawLoad(W, H)
  }

  private drawBg(W: number, H: number) {
    const ctx = this.ctx
    const def = stageDef(this.stage)
    const road = this.art.roads[Math.max(0, Math.min(this.art.roads.length - 1, def.road))]
    ctx.drawImage(road, 0, 0, W, H)
    ctx.fillStyle = 'rgba(0,0,0,0.12)'
    ctx.fillRect(0, 0, W, H)
  }

  private drawHero() {
    const ctx = this.ctx
    const slots = this.formation()
    const def = stageDef(this.stage)
    const img = def.hero < 0 ? this.art.stone : this.art.heroes[Math.max(0, Math.min(this.art.heroes.length - 1, def.hero))]
    const base = this.stage === 1 ? 88 : this.stage === 2 ? 98 : this.stage === 3 ? 112 : this.stage === 4 ? 124 : 136
    for (let i = slots.length - 1; i >= 0; i--) {
      const s = slots[i]
      const p = this.proj(this.playerX + s.x, this.playerZ + s.z)
      const h = p.s * base
      const w = h * (img.width / Math.max(1, img.height))
      ctx.save()
      ctx.globalAlpha = i === 0 ? 1 : 0.82
      if (i > 0) {
        ctx.shadowColor = '#ffe56a'
        ctx.shadowBlur = 16
      }
      ctx.drawImage(img, p.x - w * 0.5, p.y - h * 0.92, w, h)
      ctx.restore()
    }
  }

  private drawMob(m: Mob) {
    const p = this.proj(m.x, m.z)
    if (p.u > 0.98) return
    const ctx = this.ctx
    const def = stageDef(this.stage)
    let img = this.art.spirit
    if (def.enemy !== -1) {
      const list = Array.isArray(def.enemy) ? def.enemy : [def.enemy]
      const idx = list[Math.abs(m.kind) % list.length]
      img = this.art.enemies[Math.max(0, Math.min(this.art.enemies.length - 1, idx))]
    }
    const h = p.s * (this.stage >= 5 ? 110 : 92)
    const w = h * (img.width / Math.max(1, img.height))
    const by = p.y - Math.sin(m.bob * 2.2) * 4
    if (this.stage === 1) {
      ctx.save()
      ctx.shadowColor = WX_COLORS[Math.max(0, m.elem)]
      ctx.shadowBlur = 18
      ctx.drawImage(img, p.x - w * 0.5, by - h * 0.9, w, h)
      ctx.restore()
    } else {
      ctx.drawImage(img, p.x - w * 0.5, by - h * 0.9, w, h)
    }
  }

  private drawGate(g: Gate) {
    const ctx = this.ctx
    const a = this.proj(g.x0, g.z)
    const b = this.proj(g.x1, g.z)
    const c = this.proj(g.x1, g.z + 0.85)
    const d = this.proj(g.x0, g.z + 0.85)
    const add = g.mode === 'cloneAdd' || g.mode === 'elemAdd'
    const pulse = 0.55 + Math.sin(g.pulse * 6) * 0.2
    const tint = g.mode === 'elemAdd' || g.mode === 'elemSub' ? WX_COLORS[Math.max(0, g.elem)] : add ? '#5dff7a' : '#ff4a4a'
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.lineTo(c.x, c.y)
    ctx.lineTo(d.x, d.y)
    ctx.closePath()
    ctx.fillStyle = add ? `rgba(40,220,90,${0.18 + pulse * 0.22})` : `rgba(230,40,40,${0.18 + pulse * 0.22})`
    ctx.fill()
    ctx.shadowColor = tint
    ctx.shadowBlur = 24
    ctx.lineWidth = 4
    ctx.strokeStyle = add ? `rgba(120,255,150,${pulse})` : `rgba(255,120,120,${pulse})`
    ctx.stroke()
    ctx.shadowBlur = 0
    const mx = (a.x + b.x + c.x + d.x) / 4
    const my = (a.y + b.y + c.y + d.y) / 4
    ctx.font = `800 ${Math.max(22, a.s * 28)}px "PingFang SC","Microsoft YaHei",sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineWidth = 5
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.strokeText(g.label, mx, my)
    ctx.fillStyle = '#fff'
    ctx.fillText(g.label, mx, my)
    ctx.restore()
  }

  private drawPickup(p: Pickup) {
    const q = this.proj(p.x, p.z)
    const img = p.kind === 'atk' ? this.art.pillAtk : this.art.pill
    const r = q.s * 22
    const ctx = this.ctx
    ctx.save()
    ctx.shadowColor = p.kind === 'atk' ? '#ff4a2a' : '#ffd24a'
    ctx.shadowBlur = 16
    ctx.beginPath()
    ctx.arc(q.x, q.y, r, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, q.x - r, q.y - r, r * 2, r * 2)
    ctx.restore()
  }

  private drawBolt(b: Bolt) {
    const p = this.proj(b.x, b.z)
    const def = stageDef(this.stage)
    const img = this.art.bolts[Math.max(0, Math.min(this.art.bolts.length - 1, def.bolt))]
    const h = p.s * 36
    const w = h * (img.width / Math.max(1, img.height))
    this.ctx.drawImage(img, p.x - w * 0.5, p.y - h * 0.5, w, h)
  }

  private drawFx() {
    const ctx = this.ctx
    for (const b of this.bursts) {
      const k = b.t / 0.55
      for (let i = 0; i < b.n; i++) {
        const a = (i / b.n) * Math.PI * 2 + b.seed
        const r = (1 - k) * 48
        ctx.globalAlpha = k
        ctx.fillStyle = b.color
        ctx.beginPath()
        ctx.arc(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 3 + k * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
    ctx.font = '700 20px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.textAlign = 'center'
    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, f.t / 0.35)
      ctx.fillStyle = '#000'
      ctx.fillText(f.text, f.x + 1, f.y + 1)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
      ctx.globalAlpha = 1
    }
  }

  private drawLoad(W: number, H: number) {
    const ctx = this.ctx
    ctx.fillStyle = '#120818'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#ffd24a'
    ctx.textAlign = 'center'
    ctx.font = '700 44px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('大闹西游路', W * 0.5, H * 0.42)
    ctx.fillStyle = '#f2c98a'
    ctx.font = '28px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText('石猴补天 · 五灵炼形', W * 0.5, H * 0.49)
    const p = Math.min(1, this.loadT / 2.2)
    ctx.fillStyle = '#3a2412'
    round(ctx, W * 0.18, H * 0.62, W * 0.64, 14, 7)
    ctx.fill()
    ctx.fillStyle = '#e48a2a'
    round(ctx, W * 0.18, H * 0.62, W * 0.64 * p, 14, 7)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '20px "PingFang SC","Microsoft YaHei",sans-serif'
    ctx.fillText(`正在进入游戏 ${Math.round(p * 100)}%`, W * 0.5, H * 0.72)
  }

  private pushHud() {
    const snap: HudSnap = {
      stage: this.stage,
      stageName: STAGE_NAMES[Math.max(0, Math.min(STAGE_COUNT, this.stage) - 1)],
      hp: Math.round(this.hp),
      maxHp: Math.round(this.maxHp),
      wuXing: this.wuXing.slice(),
      xiuwei: this.xiuwei,
      needXiu: needXiu(this.stage),
      shots: shotCount(this.xiuwei, this.bonusShots),
      dmgPct: Math.round(this.bonusDmg * 100),
      boltAtk: Math.round(boltDmg(this.stage, this.xiuwei, this.bonusDmg, this.atkBonus)),
      clones: this.cloneCount,
      canBreak: this.prompted && this.meetsBreak() && !this.breaking,
      breaking: this.breaking,
      paused: this.paused,
      loading: this.loading,
      loadP: Math.min(1, this.loadT / 2.2),
      ended: this.ended,
      breakTitle: BREAK_TITLES[Math.max(0, this.stage - 1)],
    }
    const k = JSON.stringify(snap)
    if (k === this.hudKey) return
    this.hudKey = k
    this.onHud(snap)
  }
}

type Tag = { t: 'player' | 'mob' | 'pick' | 'gate' | 'bolt'; id: number }

function parseLabel(label: string): Tag | null {
  if (label === 'player') return { t: 'player', id: 0 }
  const i = label.indexOf(':')
  if (i < 0) return null
  const t = label.slice(0, i)
  if (t !== 'mob' && t !== 'pick' && t !== 'gate' && t !== 'bolt' && t !== 'player') return null
  return { t, id: Number(label.slice(i + 1)) }
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.max(0, w / 2), Math.max(0, h / 2))
  ctx.beginPath()
  if (w <= 0 || h <= 0) return
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}
