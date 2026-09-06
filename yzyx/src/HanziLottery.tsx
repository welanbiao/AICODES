import { useState } from 'react'
import { teachHanzi, type AuthSession, type TeachResult } from './api'
import { charsFromParts, pickMainChar } from './hanzi/lookup'
import { SHENG, TONES, WHOLE, YUN, displayTone, pick } from './hanzi/pinyin'
import { speakZh, unlockAudio } from './speak'

const asset = (name: string) => `${import.meta.env.BASE_URL}machines/${name}`
const shengmuImg = asset('shengmu.png')
const yunmuImg = asset('yunmu.png')
const zhengtiImg = asset('zhengti.png')
const shengdiaoImg = asset('shengdiao.png')

type Draw = {
  sheng: string | null
  yun: string | null
  whole: string | null
  tone: number | null
}

const empty: Draw = { sheng: null, yun: null, whole: null, tone: null }

export function HanziLottery({ session, onBack }: { session: AuthSession; onBack: () => void }) {
  const [draw, setDraw] = useState<Draw>(empty)
  const [spinning, setSpinning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [chars, setChars] = useState<string[]>([])
  const [py, setPy] = useState('')
  const [source, setSource] = useState('')
  const [picked, setPicked] = useState('')
  const [teach, setTeach] = useState<TeachResult | null>(null)

  function rollAll() {
    if (spinning || busy) return
    setErr('')
    setTeach(null)
    setChars([])
    setPicked('')
    setPy('')
    setSource('')
    setSpinning(true)
    let n = 0
    const timer = window.setInterval(() => {
      n += 1
      setDraw({
        sheng: pick(SHENG),
        yun: pick(YUN),
        whole: pick(WHOLE),
        tone: pick(TONES).n,
      })
      if (n >= 14) {
        window.clearInterval(timer)
        const final: Draw = {
          sheng: pick(SHENG),
          yun: pick(YUN),
          whole: pick(WHOLE),
          tone: pick(TONES).n,
        }
        setDraw(final)
        setSpinning(false)
        void applyResult(final)
      }
    }, 70)
  }

  async function applyResult(result: Draw) {
    const groups = charsFromParts(result.sheng, result.yun, result.tone, result.whole)
    const hit = groups.find((g) => g.chars.length) || groups[0]
    if (!hit) {
      setChars([])
      setPy('')
      setSource('')
      setErr('这次没有拼出音节，再开一次奖。')
      return
    }
    setSource(hit.source)
    setPy(hit.py)
    setChars(hit.chars)
    if (!hit.chars.length) {
      setPicked('')
      setTeach({
        spell: `读 ${hit.py.replace(/5$/, '（轻声）').replace(/1$/, '一声').replace(/2$/, '二声').replace(/3$/, '三声').replace(/4$/, '四声')}`,
        word: '（这个音没有汉字）',
        sentence: `先把拼音 ${hit.py.replace(/[1-5]$/, '')} 读准。`,
        explain: '字典里暂时没有对应汉字，也可以先学这个音。',
        source: 'pinyin',
        model: '',
      })
      speakZh(hit.py.replace(/[1-5]$/, ''), 0.7)
      return
    }
    const main = pickMainChar(groups)
    const ch = main?.char || hit.chars[0]
    setPicked(ch)
    speakZh(ch, 0.7)
    setBusy(true)
    try {
      const lesson = await teachHanzi(session.token, ch, hit.py)
      setTeach(lesson)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI 讲解失败')
    } finally {
      setBusy(false)
    }
  }

  async function pickChar(ch: string) {
    setPicked(ch)
    speakZh(ch, 0.7)
    setBusy(true)
    setErr('')
    try {
      const lesson = await teachHanzi(session.token, ch, py)
      setTeach(lesson)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'AI 讲解失败')
    } finally {
      setBusy(false)
    }
  }

  const tone = draw.tone ? displayTone(draw.tone) : null

  return (
    <div className="lottery">
      <header className="top">
        <button type="button" className="btn ghost" onClick={onBack}>
          返回
        </button>
        <h1>开奖汉字</h1>
        <span />
      </header>
      <p className="lead">点开奖，四个开奖机一起转，转完自动找出汉字。常用字排在前面，生僻字也能开出来，并请 AI 拼读、造词、造句。</p>
      <div className="machines">
        <Machine title="声母开奖机" img={shengmuImg} value={draw.sheng} spinning={spinning} />
        <Machine title="韵母开奖机" img={yunmuImg} value={draw.yun} spinning={spinning} />
        <Machine title="整体认读音节开奖机" img={zhengtiImg} value={draw.whole} spinning={spinning} />
        <Machine title="音调开奖机" img={shengdiaoImg} value={tone ? `${tone.mark} ${tone.name}` : null} spinning={spinning} />
      </div>
      <button type="button" className="btn primary fat" disabled={spinning || busy} onPointerDown={unlockAudio} onClick={rollAll}>
        {spinning ? '开奖中…' : busy ? 'AI 正在拼读…' : '开奖'}
      </button>
      {err ? <p className="err">{err}</p> : null}
      {source ? <p className="hint">{source}{py ? `　拼音 ${py}` : ''}</p> : null}
      {chars.length ? (
        <div className="chars">
          {chars.map((ch) => (
            <button key={ch} type="button" className={ch === picked ? 'hanzi on' : 'hanzi'} onPointerDown={unlockAudio} onClick={() => void pickChar(ch)}>
              {ch}
            </button>
          ))}
        </div>
      ) : null}
      {teach ? (
        <div className="teach">
          <TeachLine label="拼读" text={teach.spell} onSpeak={() => speakZh(picked || teach.spell, 0.7)} />
          <TeachLine label="词语" text={teach.word} onSpeak={() => speakZh(teach.word)} />
          <TeachLine label="句子" text={teach.sentence} onSpeak={() => speakZh(teach.sentence)} />
          {teach.explain ? <p className="hint">{teach.explain}</p> : null}
          <p className="hint">
            {teach.source === 'cursor' ? `讲解来自 Cursor${teach.model ? ` · ${teach.model}` : ''}` : '本地讲解'}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Machine({ title, img, value, spinning }: { title: string; img: string; value: string | null; spinning: boolean }) {
  return (
    <article className="machine">
      <div className={`bubble ${spinning ? 'spin' : ''}`}>{value || '？'}</div>
      <img src={img} alt={title} />
      <h2>{title}</h2>
    </article>
  )
}

function TeachLine({ label, text, onSpeak }: { label: string; text: string; onSpeak: () => void }) {
  return (
    <div className="teach-line">
      <strong>{label}</strong>
      <span>{text}</span>
      <button type="button" className="btn mini" onPointerDown={unlockAudio} onClick={onSpeak}>
        听一听
      </button>
    </div>
  )
}
