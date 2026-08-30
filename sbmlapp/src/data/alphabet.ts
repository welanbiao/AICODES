import type { DrawTemplate } from '../types'

const COLORS = [
  '#f0b429',
  '#e87aa0',
  '#5bb5f0',
  '#5ecf6a',
  '#f08a4a',
  '#7b6ad6',
  '#c4784a',
]

/** 26 个字母，每字母一关 */
export const letterTemplates: DrawTemplate[] = 'abcdefghijklmnopqrstuvwxyz'.split('').map((ch, i) => {
  const upper = ch.toUpperCase()
  return {
    id: `letter-${ch}`,
    title: upper,
    category: 'alphabet' as const,
    sampleText: upper,
    sampleColor: COLORS[i % COLORS.length],
    preview: upper,
    steps: [{ label: upper, guideText: upper }],
  }
})

/** 儿童常用 100 个英语单词；每个字母一步虚线 */
export const COMMON_WORDS = [
  'cat', 'dog', 'sun', 'moon', 'star', 'fish', 'bird', 'tree', 'book', 'pen',
  'red', 'blue', 'yes', 'no', 'big', 'small', 'hot', 'cold', 'run', 'jump',
  'eat', 'milk', 'egg', 'rice', 'cake', 'apple', 'banana', 'water', 'hand', 'foot',
  'eye', 'ear', 'nose', 'mouth', 'face', 'hair', 'boy', 'girl', 'mom', 'dad',
  'baby', 'home', 'door', 'window', 'bed', 'chair', 'table', 'ball', 'car', 'bus',
  'bike', 'train', 'plane', 'boat', 'ship', 'road', 'park', 'school', 'friend', 'play',
  'happy', 'sad', 'love', 'good', 'bad', 'new', 'old', 'one', 'two', 'three',
  'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hello', 'bye', 'please',
  'thank', 'sorry', 'help', 'look', 'listen', 'sing', 'dance', 'draw', 'read', 'write',
  'sleep', 'wake', 'walk', 'swim', 'fly', 'rain', 'snow', 'wind', 'flower', 'rocket',
] as const

export const wordTemplates: DrawTemplate[] = COMMON_WORDS.map((word, i) => {
  const upperWord = word.toUpperCase()
  return {
    id: `word-${word}`,
    title: upperWord,
    category: 'alphabet' as const,
    sampleText: upperWord,
    sampleColor: COLORS[i % COLORS.length],
    preview: '📝',
    steps: upperWord.split('').map((ch) => ({
      label: ch,
      guideText: ch,
    })),
  }
})

export const alphabetTemplates: DrawTemplate[] = [...letterTemplates, ...wordTemplates]
