// Web Audio 音效与仿真旋律
const AudioEngine = {
  ctx: null,
  musicGain: null,
  sfxGain: null,
  musicOscs: [],
  musicTimer: null,
  enabled: true,
  sfxEnabled: true,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.musicGain.gain.value = 0.08;
    this.sfxGain.gain.value = 0.15;
  },

  resume() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  playTone(freq, duration, type = 'sine', gainNode = this.sfxGain, vol = 0.3) {
    if (!this.sfxEnabled) return;
    this.resume();
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(g);
    g.connect(gainNode);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },

  sfxClick() { this.playTone(800, 0.05, 'sine', this.sfxGain, 0.15); },
  sfxPlay() { this.playTone(523, 0.1); this.playTone(659, 0.15); },
  sfxPause() { this.playTone(440, 0.12); },
  sfxLike() {
    this.playTone(880, 0.08);
    setTimeout(() => this.playTone(1047, 0.12), 80);
  },
  sfxCoin() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.playTone(f, 0.1), i * 60));
  },
  sfxNext() { this.playTone(600, 0.06); this.playTone(750, 0.08); },
  sfxUnlock() {
    [392, 494, 587, 784, 988].forEach((f, i) => setTimeout(() => this.playTone(f, 0.15, 'triangle'), i * 100));
  },

  // 每首歌的简单旋律模式（音符频率）
  melodies: {
    s1:  [262,294,330,294,262,220,262,294,330,392,330,294],
    s2:  [330,370,415,370,330,277,330,370,415,494,415,370],
    s6:  [392,440,494,440,392,330,392,440,494,587,494,440],
    s11: [349,392,440,392,349,294,349,392,440,523,440,392],
    default: [262,294,330,349,330,294,262,294,330,392,349,330],
  },

  startMusic(songId) {
    this.stopMusic();
    if (!this.enabled) return;
    this.resume();
    const notes = this.melodies[songId] || this.melodies.default;
    let i = 0;
    const playNote = () => {
      const freq = notes[i % notes.length];
      this.playTone(freq, 0.35, 'triangle', this.musicGain, 0.12);
      i++;
    };
    playNote();
    this.musicTimer = setInterval(playNote, 450);
  },

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  },

  setVolume(v) {
    this.init();
    this.musicGain.gain.value = v * 0.12;
    this.sfxGain.gain.value = v * 0.2;
  },

  toggleMusic() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  },
};
