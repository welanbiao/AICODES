const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

let player: HTMLAudioElement | null = null
let unlocked = false

function isWeChat() {
  return /MicroMessenger/i.test(navigator.userAgent || '')
}

function getSynth(): SpeechSynthesis | null {
  try {
    const s = window.speechSynthesis
    if (!s || typeof s.cancel !== 'function' || typeof s.speak !== 'function') return null
    return s
  } catch {
    return null
  }
}

function zhVoice(synth: SpeechSynthesis) {
  let voices: SpeechSynthesisVoice[] = []
  try {
    voices = synth.getVoices?.() || []
  } catch {
    voices = []
  }
  return (
    voices.find((v) => /zh-CN|zh_CN|Chinese.*China/i.test(`${v.lang} ${v.name}`)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null
  )
}

function getPlayer() {
  if (!player) {
    player = new Audio()
    player.setAttribute('playsinline', 'true')
    player.setAttribute('webkit-playsinline', 'true')
    player.preload = 'auto'
  }
  return player
}

export function unlockAudio() {
  if (unlocked) return
  unlocked = true
  try {
    const a = getPlayer()
    a.src = SILENT_WAV
    const play = a.play()
    if (play && typeof play.catch === 'function') play.catch(() => {})
  } catch {
    unlocked = false
  }
}

export function stopSpeak() {
  const synth = getSynth()
  try {
    synth?.cancel()
  } catch {
    /* WeChat stub */
  }
  if (!player) return
  try {
    player.pause()
  } catch {
    /* ignore */
  }
}

function speakNative(text: string, rate: number) {
  const synth = getSynth()
  if (!synth || typeof SpeechSynthesisUtterance !== 'function') return false
  try {
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'zh-CN'
    u.rate = rate
    u.pitch = 1.05
    const voice = zhVoice(synth)
    if (voice) u.voice = voice
    synth.speak(u)
    return true
  } catch {
    return false
  }
}

function speakAudio(text: string) {
  const a = getPlayer()
  const q = encodeURIComponent(text.slice(0, 80))
  a.src = `/v1/tts?text=${q}`
  const play = a.play()
  if (play && typeof play.catch === 'function') play.catch(() => {})
}

export function speakZh(text: string, rate = 0.82) {
  const t = String(text || '').trim()
  if (!t) return
  unlockAudio()
  stopSpeak()
  if (!isWeChat() && speakNative(t, rate)) return
  speakAudio(t)
}

try {
  const synth = getSynth()
  synth?.getVoices?.()
  if (synth) synth.onvoiceschanged = () => synth.getVoices?.()
} catch {
  /* WeChat has no voices API */
}
