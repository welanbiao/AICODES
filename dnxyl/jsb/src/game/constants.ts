export const WX_NAMES = ['金', '木', '水', '火', '土'] as const
export const WX_COLORS = ['#ffd647', '#47e06b', '#47b8ff', '#ff6130', '#c78447'] as const
export { BREAK_TITLES, STAGE_COUNT, STAGE_NAMES, stageDef } from './stages'

export const QI_NEED = 20
export const LANES = [-2, -1, 0, 1, 2]
export const PATH_W = 2.35
export const CLONE_MAX = 40

export function needXiu(stage: number): number {
  if (stage <= 1) return 0
  if (stage === 2) return 6000
  if (stage === 3) return 15000
  if (stage === 4) return 75000
  if (stage === 5) return 220000
  let n = 220000
  for (let i = 5; i < stage; i++) n = Math.round(n * 1.18 + 28000)
  return n
}

export function stageSpeed(stage: number, playTime: number): number {
  const base =
    stage <= 1 ? 6.9 : stage === 2 ? 5.8 : stage === 3 ? 7.0 : stage === 4 ? 8.4 : Math.min(11.2, 9.8 + (stage - 5) * 0.12)
  const pace = stage <= 1 ? Math.min(2.6, 1 + playTime / 210) : Math.min(3, 1 + playTime / 920)
  return base * pace
}

export function boltDmg(stage: number, xiu: number, bonusDmg = 1, atkBonus = 0): number {
  let n = 11 + stage * 7
  if (stage > 1) n += Math.log(1 + xiu) * 1.8
  return n * Math.max(1, bonusDmg) + Math.max(0, atkBonus)
}

/** Extra per-bolt attack granted when clearing a stage. */
export function breakAtkGain(fromStage: number): number {
  return 4 + Math.max(1, fromStage) * 2
}

/** Extra per-bolt attack from one attack pill. */
export function pillAtkGain(stage: number): number {
  return 2 + Math.max(1, stage)
}

export function shotCount(xiu: number, bonusShots: number): number {
  let n = 1
  if (xiu > 80000) n = 4
  else if (xiu > 12000) n = 3
  else if (xiu > 1500) n = 2
  return Math.max(1, Math.min(8, n + Math.max(0, Math.min(7, bonusShots))))
}

export function combatFireGap(stage: number, playTime: number, bonusFire: number): number {
  const pace = Math.min(3, 1 + playTime / 920)
  return Math.max(0.08, (0.36 - stage * 0.018) / (0.82 + 0.38 * pace) / Math.max(1, bonusFire))
}
