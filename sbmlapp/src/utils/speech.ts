/** 内置 AI 语音（Edge TTS 神经声音，打包在 /voice） */

let current: HTMLAudioElement | null = null

function stopCurrent() {
  if (current) {
    current.pause()
    current.src = ''
    current = null
  }
}

function playUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    stopCurrent()
    const audio = new Audio(url)
    audio.preload = 'auto'
    audio.volume = 1
    current = audio

    const done = () => {
      audio.onended = null
      audio.onerror = null
      if (current === audio) current = null
      resolve()
    }

    audio.onended = done
    audio.onerror = done
    void audio.play().catch(done)
  })
}

function englishClipUrl(text: string): string | null {
  const t = text.trim().toLowerCase()
  if (!t) return null
  if (/^[a-z]$/.test(t)) return `/voice/letter-${t}.mp3`
  if (/^[a-z]+$/.test(t)) return `/voice/word-${t}.mp3`
  return null
}

/** 赞赏语气：你真棒 */
export function speakPraise(): Promise<void> {
  return playUrl('/voice/praise.mp3')
}

/** 英文字母 / 单词发音（内置 MP3） */
export function speakEnglish(text: string): Promise<void> {
  const url = englishClipUrl(text)
  if (!url) return Promise.resolve()
  return playUrl(url)
}

/** 通关语音：先读字母/单词（可选），再赞赏 */
export async function speakLevelComplete(english?: string): Promise<void> {
  if (english) {
    await speakEnglish(english)
    await new Promise((r) => setTimeout(r, 220))
  }
  await speakPraise()
}

export function stopSpeech() {
  stopCurrent()
}
