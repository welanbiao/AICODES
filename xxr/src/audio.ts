export type SfxName = "fire" | "hit" | "miss" | "recall";

const files: Record<SfxName, string> = {
  fire: "/audio/hook-fire.wav",
  hit: "/audio/hook-hit.wav",
  miss: "/audio/hook-miss.wav",
  recall: "/audio/hook-recall.wav",
};

let bgm: HTMLAudioElement | null = null;
let unlocked = false;
const sfxPool = new Map<SfxName, HTMLAudioElement>();

function makeAudio(src: string, loop = false, volume = 1) {
  const el = new Audio(src);
  el.preload = "auto";
  el.loop = loop;
  el.volume = volume;
  return el;
}

export function initAudio() {
  if (bgm) return;
  bgm = makeAudio("/audio/cosmic-stroll.wav?v=2", true, 0.46);
  (Object.keys(files) as SfxName[]).forEach((key) => {
    sfxPool.set(key, makeAudio(files[key], false, 0.55));
  });
}

export function unlockAudio() {
  initAudio();
  if (unlocked) {
    if (bgm?.paused) void bgm.play().catch(() => undefined);
    return;
  }
  unlocked = true;
  void bgm?.play().catch(() => undefined);
}

export function playSfx(name: SfxName) {
  initAudio();
  const base = sfxPool.get(name);
  if (!base) return;
  const node = base.cloneNode(true) as HTMLAudioElement;
  node.volume = name === "hit" ? 0.7 : 0.52;
  void node.play().catch(() => undefined);
}

export function stopAudio() {
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}
