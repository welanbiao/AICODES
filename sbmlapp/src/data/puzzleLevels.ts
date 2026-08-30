import type { PuzzleLevel } from '../types'

/** Coordinates in 800×450 logical space */
export const puzzleLevels: PuzzleLevel[] = [
  {
    id: 'p1',
    title: '斜坡相会',
    platforms: [
      { x: 200, y: 180, w: 160, h: 28 },
      { x: 400, y: 320, w: 280, h: 36 },
      { x: 600, y: 400, w: 200, h: 40 },
    ],
    balls: [
      { x: 200, y: 140, color: '#5b7fd6' },
      { x: 600, y: 360, color: '#e87aa0' },
    ],
    hint: '画一条彩虹滑梯，让蓝球滚向粉球吧！',
  },
  {
    id: 'p2',
    title: '双台相逢',
    platforms: [
      { x: 250, y: 200, w: 140, h: 28 },
      { x: 550, y: 320, w: 140, h: 28 },
      { x: 400, y: 420, w: 500, h: 36 },
    ],
    balls: [
      { x: 250, y: 160, color: '#5b7fd6' },
      { x: 550, y: 280, color: '#e87aa0' },
    ],
    hint: '画一座桥或一条弯道，让两颗球碰到一起。',
  },
  {
    id: 'p3',
    title: '悬崖牵手',
    platforms: [
      { x: 180, y: 280, w: 120, h: 200 },
      { x: 620, y: 280, w: 120, h: 200 },
      { x: 400, y: 400, w: 160, h: 40 },
    ],
    balls: [
      { x: 180, y: 160, color: '#5b7fd6' },
      { x: 620, y: 160, color: '#e87aa0' },
    ],
    hint: '画一条彩虹桥，把两座悬崖连起来。',
  },
  {
    id: 'p4',
    title: '台阶下落',
    platforms: [
      { x: 150, y: 150, w: 120, h: 24 },
      { x: 320, y: 250, w: 100, h: 24 },
      { x: 480, y: 340, w: 100, h: 24 },
      { x: 650, y: 400, w: 140, h: 30 },
    ],
    balls: [
      { x: 150, y: 110, color: '#5b7fd6' },
      { x: 650, y: 360, color: '#e87aa0' },
    ],
    hint: '画几条斜坡，引导蓝球一级级滚下去。',
  },
  {
    id: 'p5',
    title: '中间相会',
    platforms: [
      { x: 200, y: 220, w: 100, h: 24 },
      { x: 600, y: 220, w: 100, h: 24 },
      { x: 400, y: 380, w: 80, h: 24 },
    ],
    balls: [
      { x: 200, y: 180, color: '#5b7fd6' },
      { x: 600, y: 180, color: '#e87aa0' },
    ],
    hint: '画两条弯道，让两球在中间平台相遇。',
  },
  {
    id: 'p6',
    title: '高台跳下',
    platforms: [
      { x: 150, y: 120, w: 100, h: 24 },
      { x: 650, y: 380, w: 120, h: 28 },
      { x: 400, y: 420, w: 600, h: 30 },
    ],
    balls: [
      { x: 150, y: 80, color: '#5b7fd6' },
      { x: 650, y: 340, color: '#e87aa0' },
    ],
    hint: '画一条长滑梯，从高台滑到粉球身边。',
  },
  {
    id: 'p7',
    title: '峡谷飞渡',
    platforms: [
      { x: 120, y: 300, w: 100, h: 180 },
      { x: 680, y: 300, w: 100, h: 180 },
    ],
    balls: [
      { x: 120, y: 180, color: '#5b7fd6' },
      { x: 680, y: 180, color: '#e87aa0' },
    ],
    hint: '画一座拱桥，跨越中间的峡谷。',
  },
  {
    id: 'p8',
    title: '三层楼',
    platforms: [
      { x: 200, y: 140, w: 120, h: 22 },
      { x: 400, y: 260, w: 120, h: 22 },
      { x: 600, y: 380, w: 120, h: 22 },
    ],
    balls: [
      { x: 200, y: 100, color: '#5b7fd6' },
      { x: 600, y: 340, color: '#e87aa0' },
    ],
    hint: '用折线把三层平台连起来。',
  },
  {
    id: 'p9',
    title: '口袋接球',
    platforms: [
      { x: 400, y: 120, w: 80, h: 22 },
      { x: 250, y: 350, w: 40, h: 140 },
      { x: 550, y: 350, w: 40, h: 140 },
      { x: 400, y: 410, w: 340, h: 28 },
    ],
    balls: [
      { x: 400, y: 80, color: '#5b7fd6' },
      { x: 400, y: 370, color: '#e87aa0' },
    ],
    hint: '画漏斗，让蓝球掉进口袋里找粉球。',
  },
  {
    id: 'p10',
    title: '对称滑梯',
    platforms: [
      { x: 150, y: 160, w: 90, h: 22 },
      { x: 650, y: 160, w: 90, h: 22 },
      { x: 400, y: 400, w: 100, h: 26 },
    ],
    balls: [
      { x: 150, y: 120, color: '#5b7fd6' },
      { x: 650, y: 120, color: '#e87aa0' },
    ],
    hint: '两边各画一条滑梯，在底部相会。',
  },
  {
    id: 'p11',
    title: '障碍绕行',
    platforms: [
      { x: 200, y: 200, w: 100, h: 24 },
      { x: 400, y: 200, w: 40, h: 220 },
      { x: 600, y: 200, w: 100, h: 24 },
      { x: 400, y: 420, w: 500, h: 28 },
    ],
    balls: [
      { x: 200, y: 160, color: '#5b7fd6' },
      { x: 600, y: 160, color: '#e87aa0' },
    ],
    hint: '绕过中间高墙，从上方或下方汇合。',
  },
  {
    id: 'p12',
    title: '弹跳台',
    platforms: [
      { x: 180, y: 300, w: 140, h: 26 },
      { x: 620, y: 300, w: 140, h: 26 },
      { x: 400, y: 180, w: 80, h: 24 },
    ],
    balls: [
      { x: 180, y: 260, color: '#5b7fd6' },
      { x: 620, y: 260, color: '#e87aa0' },
    ],
    hint: '画两条向上的坡，让球滚到中间高台相遇。',
  },
]

export function getPuzzleLevel(id: string) {
  return puzzleLevels.find((l) => l.id === id)
}
