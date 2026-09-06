export const SHENG = [
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'zh',
  'ch',
  'sh',
  'r',
  'z',
  'c',
  's',
  'y',
  'w',
] as const

export const YUN = [
  'a',
  'o',
  'e',
  'i',
  'u',
  'ü',
  'ai',
  'ei',
  'ui',
  'ao',
  'ou',
  'iu',
  'ie',
  'üe',
  'er',
  'an',
  'en',
  'in',
  'un',
  'ün',
  'ang',
  'eng',
  'ing',
  'ong',
  'ia',
  'iao',
  'ian',
  'iang',
  'iong',
  'ua',
  'uo',
  'uai',
  'uan',
  'uang',
  'üan',
] as const

export const WHOLE = [
  'zhi',
  'chi',
  'shi',
  'ri',
  'zi',
  'ci',
  'si',
  'yi',
  'wu',
  'yu',
  'ye',
  'yue',
  'yuan',
  'yin',
  'yun',
  'ying',
] as const

export const TONES = [
  { n: 1, mark: 'ˉ', name: '一声' },
  { n: 2, mark: 'ˊ', name: '二声' },
  { n: 3, mark: 'ˇ', name: '三声' },
  { n: 4, mark: 'ˋ', name: '四声' },
  { n: 5, mark: '·', name: '轻声' },
] as const

export type ToneInfo = (typeof TONES)[number]

function v(yun: string) {
  return yun.replace(/ü/g, 'v')
}

/** 声母 + 韵母 → 音节（不含声调），按小学拼音规则 */
export function composeSyllable(sheng: string, yun: string): string | null {
  const s = sheng
  const y = v(yun)
  if (!s || !yun) return null
  if (s === 'y') {
    if (y === 'i') return 'yi'
    if (y === 'in') return 'yin'
    if (y === 'ing') return 'ying'
    if (y === 'v') return 'yu'
    if (y === 've') return 'yue'
    if (y === 'van') return 'yuan'
    if (y === 'vn') return 'yun'
    if (y === 'u') return 'yu'
    if (y === 'ue') return 'yue'
    if (y === 'uan') return 'yuan'
    if (y === 'un') return 'yun'
    if (y === 'ou') return 'you'
    if (y === 'ong') return 'yong'
    return `y${y}`
  }
  if (s === 'w') {
    if (y === 'u') return 'wu'
    if (y === 'en') return 'wen'
    if (y === 'eng') return 'weng'
    if (y === 'ei') return 'wei'
    return `w${y}`
  }
  if (['j', 'q', 'x'].includes(s) && y.startsWith('v')) return s + 'u' + y.slice(1)
  return s + y
}

export function withTone(syl: string, tone: number) {
  return `${syl}${tone}`
}

export function displayTone(n: number) {
  return TONES.find((t) => t.n === n) || TONES[0]
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
