import type { MathLevel } from '../types'

function makeOptions(answer: number, extras: number[]): number[] {
  return [...new Set([answer, ...extras])].sort((a, b) => a - b).slice(0, 4)
}

export const mathLevels: MathLevel[] = [
  { id: 'm1', title: '蝴蝶减法', expression: '8 − 2 − 1 = ?', startCount: 8, subtract: [2, 1], options: makeOptions(5, [3, 4, 6]), answer: 5, emoji: '🦋' },
  { id: 'm2', title: '小花加法', expression: '3 + 2 = ?', startCount: 3, subtract: [], options: makeOptions(5, [4, 6, 7]), answer: 5, emoji: '🌸' },
  { id: 'm3', title: '星星计算', expression: '6 − 3 = ?', startCount: 6, subtract: [3], options: makeOptions(3, [2, 4, 5]), answer: 3, emoji: '⭐' },
  { id: 'm4', title: '苹果加法', expression: '4 + 3 = ?', startCount: 4, subtract: [], options: makeOptions(7, [5, 6, 8]), answer: 7, emoji: '🍎' },
  { id: 'm5', title: '小鸟减法', expression: '9 − 4 − 2 = ?', startCount: 9, subtract: [4, 2], options: makeOptions(3, [2, 4, 5]), answer: 3, emoji: '🐦' },
  { id: 'm6', title: '糖果加法', expression: '5 + 4 = ?', startCount: 5, subtract: [], options: makeOptions(9, [7, 8, 10]), answer: 9, emoji: '🍬' },
  { id: 'm7', title: '气球加法', expression: '2 + 2 = ?', startCount: 2, subtract: [], options: makeOptions(4, [2, 3, 5]), answer: 4, emoji: '🎈' },
  { id: 'm8', title: '西瓜减法', expression: '7 − 2 = ?', startCount: 7, subtract: [2], options: makeOptions(5, [3, 4, 6]), answer: 5, emoji: '🍉' },
  { id: 'm9', title: '草莓加法', expression: '1 + 6 = ?', startCount: 1, subtract: [], options: makeOptions(7, [5, 6, 8]), answer: 7, emoji: '🍓' },
  { id: 'm10', title: '青蛙减法', expression: '10 − 3 − 2 = ?', startCount: 10, subtract: [3, 2], options: makeOptions(5, [4, 6, 7]), answer: 5, emoji: '🐸' },
  { id: 'm11', title: '月亮加法', expression: '4 + 4 = ?', startCount: 4, subtract: [], options: makeOptions(8, [6, 7, 9]), answer: 8, emoji: '🌙' },
  { id: 'm12', title: '蜜蜂减法', expression: '5 − 1 = ?', startCount: 5, subtract: [1], options: makeOptions(4, [2, 3, 5]), answer: 4, emoji: '🐝' },
  { id: 'm13', title: '葡萄加法', expression: '3 + 5 = ?', startCount: 3, subtract: [], options: makeOptions(8, [6, 7, 9]), answer: 8, emoji: '🍇' },
  { id: 'm14', title: '小车减法', expression: '8 − 5 = ?', startCount: 8, subtract: [5], options: makeOptions(3, [2, 4, 5]), answer: 3, emoji: '🚗' },
  { id: 'm15', title: '雪花加法', expression: '6 + 3 = ?', startCount: 6, subtract: [], options: makeOptions(9, [7, 8, 10]), answer: 9, emoji: '❄️' },
  { id: 'm16', title: '彩虹减法', expression: '9 − 1 − 3 = ?', startCount: 9, subtract: [1, 3], options: makeOptions(5, [3, 4, 6]), answer: 5, emoji: '🌈' },
]

export function getMathLevel(id: string) {
  return mathLevels.find((l) => l.id === id)
}
