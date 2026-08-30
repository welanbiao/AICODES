export type CategoryId =
  | 'animal'
  | 'alphabet'
  | 'nature'
  | 'math'
  | 'machine'
  | 'puzzle'

export type OrientationMode = 'landscape' | 'portrait'

export type AppScreen =
  | { name: 'home' }
  | { name: 'levels'; category: CategoryId }
  | { name: 'draw'; category: CategoryId; levelId: string }
  | { name: 'math'; levelId: string }
  | { name: 'puzzle'; levelId: string }

export type AnimalMotion = 'bounce' | 'swim' | 'fly' | 'wiggle' | 'hop'

export interface GuidePath {
  d: string
  color?: string
}

export interface SolidPart {
  d: string
  fill?: string
  stroke?: string
  strokeWidth?: number
}

/** 一个描摹步骤：画完后才显示下一步虚线 */
export interface DrawStep {
  label?: string
  guides?: GuidePath[]
  solids?: SolidPart[]
  /** 字母/单词逐步显示 */
  guideText?: string
}

export interface DrawTemplate {
  id: string
  title: string
  category: CategoryId
  steps: DrawStep[]
  /** 上方范例字 */
  sampleText?: string
  sampleColor?: string
  motion?: AnimalMotion
  preview?: string
}

/** 逻辑画布：横屏 800×450，竖屏 450×800 —— 绘图时按模式取 */
export const CANVAS_LANDSCAPE = { w: 800, h: 450 }
export const CANVAS_PORTRAIT = { w: 450, h: 800 }

/** 虚线与实笔共用线宽（逻辑坐标） */
export const GUIDE_LINE_WIDTH = 16

export interface MathLevel {
  id: string
  title: string
  expression: string
  startCount: number
  subtract: number[]
  options: number[]
  answer: number
  emoji: string
}

export interface PuzzleLevel {
  id: string
  title: string
  platforms: { x: number; y: number; w: number; h: number }[]
  balls: { x: number; y: number; color: string }[]
  hint: string
}
