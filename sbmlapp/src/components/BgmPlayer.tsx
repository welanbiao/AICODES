import { useEffect, useRef, useState } from 'react'
import './BgmPlayer.css'

export interface Track {
  id: string
  title: string
  src: string
}

const FALLBACK_TRACKS: Track[] = [
  { id: 'twinkle', title: '一闪一闪亮晶晶', src: '/music/twinkle.wav' },
  { id: 'little-lamb', title: '玛丽有只小羊羔', src: '/music/little-lamb.wav' },
  { id: 'happy-day', title: '快乐画画歌', src: '/music/happy-day.wav' },
  { id: 'row-boat', title: '划船歌', src: '/music/row-boat.wav' },
]

export default function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [tracks, setTracks] = useState<Track[]>(FALLBACK_TRACKS)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch('/music/playlist.json')
      .then((r) => (r.ok ? r.json() : FALLBACK_TRACKS))
      .then((data: Track[]) => {
        if (Array.isArray(data) && data.length) setTracks(data)
      })
      .catch(() => {
        /* keep fallback */
      })
  }, [])

  useEffect(() => {
    const audio = new Audio()
    audio.loop = false
    audio.volume = 0.45
    audio.preload = 'auto'
    audioRef.current = audio

    const onEnded = () => {
      setIndex((i) => (i + 1) % Math.max(tracks.length, 1))
    }
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.pause()
      audio.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !tracks.length) return
    const track = tracks[index % tracks.length]
    const wasPlaying = playing
    audio.src = track.src
    audio.load()
    setReady(true)
    if (wasPlaying) {
      audio.play().catch(() => setPlaying(false))
    }
  }, [index, tracks])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
      return
    }
    try {
      if (!audio.src) {
        audio.src = tracks[index % tracks.length].src
      }
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
    }
  }

  const next = () => {
    setIndex((i) => (i + 1) % tracks.length)
    setPlaying(true)
    window.setTimeout(() => {
      audioRef.current?.play().catch(() => setPlaying(false))
    }, 50)
  }

  const pick = (i: number) => {
    setIndex(i)
    setPlaying(true)
    setOpen(false)
    window.setTimeout(() => {
      audioRef.current?.play().catch(() => setPlaying(false))
    }, 50)
  }

  const title = tracks[index % tracks.length]?.title ?? '儿歌'

  return (
    <div className={`bgm ${open ? 'open' : ''}`}>
      <button type="button" className="bgm-main" onClick={toggle} title="背景音乐" disabled={!ready}>
        {playing ? '🔊' : '🔇'}
      </button>
      <button type="button" className="bgm-more" onClick={() => setOpen((v) => !v)} title="选歌">
        ♪
      </button>
      {open && (
        <div className="bgm-panel">
          <div className="bgm-now">正在：{title}</div>
          <ul>
            {tracks.map((t, i) => (
              <li key={t.id}>
                <button type="button" className={i === index ? 'active' : ''} onClick={() => pick(i)}>
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="bgm-next" onClick={next}>
            下一首 →
          </button>
        </div>
      )}
    </div>
  )
}
