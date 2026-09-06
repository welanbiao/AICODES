export type GameProgress = {
  stage: number
  hp: number
  maxHp: number
  pillHp: number
  xiuwei: number
  wuXing: number[]
  cloneCount: number
  bonusShots: number
  bonusDmg: number
  bonusFire: number
  /** Extra damage added to every bolt (pills + stage breaks). */
  atkBonus: number
  updatedAt?: number
}

export type HudSnap = {
  stage: number
  stageName: string
  hp: number
  maxHp: number
  wuXing: number[]
  xiuwei: number
  needXiu: number
  shots: number
  dmgPct: number
  boltAtk: number
  clones: number
  canBreak: boolean
  breaking: boolean
  paused: boolean
  loading: boolean
  loadP: number
  ended: boolean
  breakTitle: string
}

export type Mob = {
  id: number
  kind: number
  elem: number
  x: number
  z: number
  hp: number
  dead: boolean
  bob: number
}

export type Bolt = {
  id: number
  x: number
  z: number
  vx: number
  vz: number
  dmg: number
  elem: number
  life: number
}

export type PickupKind = 'hp' | 'atk'

export type Pickup = {
  id: number
  kind: PickupKind
  x: number
  z: number
  elem: number
  qi: number
  xiu: number
  heal: number
  atk: number
  taken: boolean
}

export type Gate = {
  id: number
  x: number
  z: number
  x0: number
  x1: number
  elem: number
  add: number
  xiuAdd: number
  shotAdd: number
  dmgMul: number
  fireMul: number
  label: string
  mode: 'cloneAdd' | 'cloneSub' | 'elemAdd' | 'elemSub'
  delta: number
  used: boolean
  pulse: number
}

export type Floater = {
  x: number
  y: number
  text: string
  color: string
  t: number
}

export type Burst = {
  x: number
  y: number
  color: string
  t: number
  n: number
  seed: number
}
