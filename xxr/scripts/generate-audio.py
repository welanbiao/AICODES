import math
import random
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "audio"
ROOT.mkdir(parents=True, exist_ok=True)
SR = 22050


def clamp(v: float) -> int:
    return max(-32767, min(32767, int(v * 32767)))


def write_wav(name: str, samples: list[float]) -> None:
    path = ROOT / name
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(b"".join(struct.pack("<h", clamp(s)) for s in samples))
    print(path.name, path.stat().st_size)


def env(t: float, a: float, d: float, s: float, r: float, dur: float) -> float:
    if t < a:
        return t / max(a, 1e-4)
    if t < a + d:
        return 1 - (1 - s) * ((t - a) / max(d, 1e-4))
    if t < dur - r:
        return s
    if t < dur:
        return s * (1 - (t - (dur - r)) / max(r, 1e-4))
    return 0.0


def sine(t: float, f: float, ph: float = 0.0) -> float:
    return math.sin(2 * math.pi * f * t + ph)


def bgm() -> None:
    dur = 32.0
    n = int(SR * dur)
    out = [0.0] * n
    rng = random.Random(12)
    chords = [
        (110.0, 130.81, 164.81, 196.0),
        (98.0, 130.81, 146.83, 196.0),
        (82.41, 123.47, 164.81, 196.0),
        (92.5, 116.54, 146.83, 185.0),
    ]
    for i in range(n):
        t = i / SR
        bar = int(t / 8.0) % 4
        a, b, c, d = chords[bar]
        lfo = 0.5 + 0.5 * sine(t, 0.07)
        pad = (
            0.22 * sine(t, a, 0.1)
            + 0.16 * sine(t, a * 2.005, 0.4)
            + 0.18 * sine(t, b)
            + 0.14 * sine(t, c)
            + 0.10 * sine(t, d * 0.5)
        )
        pulse = 0.05 * sine(t, 55.0) * (0.5 + 0.5 * sine(t, 0.5))
        shimmer = 0.035 * sine(t, 659.25 + 8 * sine(t, 0.2)) * lfo
        noise = (rng.random() * 2 - 1) * 0.012
        e = 0.55 + 0.45 * math.sin(math.pi * t / dur)
        out[i] = (pad + pulse + shimmer + noise) * 0.55 * e
    # cheap tail into loop
    fade = int(SR * 0.4)
    for i in range(fade):
        k = i / fade
        out[i] *= k
        out[n - 1 - i] *= k
    write_wav("bgm.wav", out)


def sfx_fire() -> None:
    dur = 0.42
    n = int(SR * dur)
    rng = random.Random(3)
    out = []
    for i in range(n):
        t = i / SR
        e = env(t, 0.01, 0.08, 0.35, 0.18, dur)
        f = 420 - 280 * (t / dur)
        whoosh = (rng.random() * 2 - 1) * 0.7
        tone = 0.35 * sine(t, f) + 0.2 * sine(t, f * 1.5)
        out.append((whoosh * 0.55 + tone) * e)
    write_wav("hook-fire.wav", out)


def sfx_hit() -> None:
    dur = 0.28
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        e = env(t, 0.002, 0.04, 0.2, 0.16, dur)
        clang = (
            0.45 * sine(t, 920)
            + 0.28 * sine(t, 1840)
            + 0.18 * sine(t, 430)
            + 0.12 * sine(t, 2600) * math.exp(-t * 18)
        )
        out.append(clang * e)
    write_wav("hook-hit.wav", out)


def sfx_miss() -> None:
    dur = 0.35
    n = int(SR * dur)
    rng = random.Random(9)
    out = []
    for i in range(n):
        t = i / SR
        e = env(t, 0.01, 0.1, 0.25, 0.16, dur)
        f = 180 + 90 * (t / dur)
        out.append((0.4 * sine(t, f) + (rng.random() * 2 - 1) * 0.2) * e * 0.7)
    write_wav("hook-miss.wav", out)


def sfx_recall() -> None:
    dur = 0.38
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        e = env(t, 0.02, 0.08, 0.4, 0.14, dur)
        f = 140 + 220 * (t / dur)
        out.append((0.4 * sine(t, f) + 0.15 * sine(t, f * 2.2)) * e)
    write_wav("hook-recall.wav", out)


if __name__ == "__main__":
    bgm()
    sfx_fire()
    sfx_hit()
    sfx_miss()
    sfx_recall()
