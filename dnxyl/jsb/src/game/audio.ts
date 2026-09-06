export class StageMusic {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private nodes: AudioNode[] = []
  private timer = 0
  private stage = -1
  private held = false
  private vol = 0.28

  ensure() {
    if (this.ctx) return
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.vol
    this.master.connect(this.ctx.destination)
  }

  async resume() {
    this.ensure()
    if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume()
  }

  setHeld(on: boolean) {
    this.held = on
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? 0 : this.vol, this.ctx.currentTime, 0.04)
    }
  }

  playStage(stage: number) {
    this.ensure()
    if (!this.ctx || !this.master) return
    const id = Math.min(5, Math.max(1, stage))
    if (id === this.stage) return
    this.stage = id
    this.stopNodes()
    const bpm = id === 1 ? 68 : id === 2 ? 112 : id === 3 ? 90 : id === 4 ? 76 : 126
    const root = id === 1 ? 84 : id === 2 ? 79 : id === 3 ? 69 : id === 4 ? 71 : 81
    this.drone(midi(root - 24), 0.05)
    this.drone(midi(root - 17), 0.03)
    this.seq(bpm, root, id)
  }

  beep(freq: number, dur = 0.12, type: OscillatorType = 'sine', amp = 0.12) {
    if (this.held || !this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(amp, this.ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur)
    o.connect(g)
    g.connect(this.master)
    o.start()
    o.stop(this.ctx.currentTime + dur)
  }

  hit(stage: number) {
    this.beep(stage === 1 ? 1397 : 220 + stage * 40, 0.16, 'triangle', 0.14)
  }

  capture() {
    this.beep(880, 0.18, 'sine', 0.12)
    this.beep(1320, 0.22, 'sine', 0.08)
  }

  hurt() {
    this.beep(90, 0.22, 'sawtooth', 0.16)
  }

  fire() {
    this.beep(420, 0.08, 'square', 0.07)
  }

  private drone(freq: number, amp: number) {
    if (!this.ctx || !this.master) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = amp
    o.connect(g)
    g.connect(this.master)
    o.start()
    this.nodes.push(o, g)
  }

  private seq(bpm: number, root: number, stage: number) {
    if (!this.ctx || !this.master) return
    const step = 60 / bpm / 2
    const notes = [0, 0, -3, -5, 0, 4, 0, -3, -5, -8, -5, -3, 0, 4, 7, 4]
    const t0 = this.ctx.currentTime + 0.05
    for (let i = 0; i < 64; i++) {
      const n = notes[i % notes.length]
      if ((i + stage) % 7 === 3) continue
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = stage === 1 ? 'triangle' : 'sine'
      o.frequency.value = midi(root + n)
      const t = t0 + i * step
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.85)
      o.connect(g)
      g.connect(this.master)
      o.start(t)
      o.stop(t + step)
      this.nodes.push(o, g)
    }
    const loop = 64 * step
    this.timer = window.setTimeout(() => {
      this.timer = 0
      if (this.stage === stage) {
        this.stage = -1
        this.playStage(stage)
      }
    }, loop * 1000)
  }

  private stopNodes() {
    if (this.timer) {
      window.clearTimeout(this.timer)
      this.timer = 0
    }
    for (const n of this.nodes) {
      try {
        if ('stop' in n) (n as OscillatorNode).stop()
        n.disconnect()
      } catch {
        /* ignore */
      }
    }
    this.nodes = []
  }

  dispose() {
    this.stopNodes()
    void this.ctx?.close()
    this.ctx = null
    this.master = null
  }
}

function midi(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12)
}
