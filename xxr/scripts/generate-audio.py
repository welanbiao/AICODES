from array import array
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


def write_wav_stereo(name: str, left: list[float], right: list[float]) -> None:
    path = ROOT / name
    n = min(len(left), len(right))
    pcm = array("h")
    for i in range(n):
        pcm.append(clamp(left[i]))
        pcm.append(clamp(right[i]))
    with wave.open(str(path), "w") as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())
    print(path.name, path.stat().st_size)


def highpass(buf: list[float], cutoff: float, sr: int) -> None:
    rc = 1.0 / (2.0 * math.pi * cutoff)
    dt = 1.0 / sr
    alpha = rc / (rc + dt)
    prev_x = 0.0
    prev_y = 0.0
    for i, x in enumerate(buf):
        y = alpha * (prev_y + x - prev_x)
        buf[i] = y
        prev_x = x
        prev_y = y


def mix_bell(left: list[float], right: list[float], sr: int, start: float, freq: float, length: float, vol: float, pan: float = 0.0) -> None:
    i0 = int(start * sr)
    count = int(length * sr)
    n = min(len(left), len(right))
    lg = math.sqrt(0.5 * (1.0 - pan))
    rg = math.sqrt(0.5 * (1.0 + pan))
    for i in range(count):
        idx = i0 + i
        if idx >= n:
            break
        t = i / sr
        att = min(1.0, t / 0.006)
        e = att * math.exp(-t * 7.8)
        mod = math.sin(2 * math.pi * freq * 2.01 * t)
        car = math.sin(2 * math.pi * freq * t + 1.6 * mod * math.exp(-t * 9))
        sparkle = 0.22 * math.sin(2 * math.pi * freq * 3.01 * t) * math.exp(-t * 14)
        sample = (car + sparkle) * e * vol
        left[idx] += sample * lg
        right[idx] += sample * rg


def mix_blip(left: list[float], right: list[float], sr: int, start: float, freq: float, length: float, vol: float) -> None:
    i0 = int(start * sr)
    count = int(length * sr)
    n = min(len(left), len(right))
    for i in range(count):
        idx = i0 + i
        if idx >= n:
            break
        t = i / sr
        e = math.exp(-t * 38)
        s = math.sin(2 * math.pi * freq * t) * e * vol
        left[idx] += s
        right[idx] += s


def cosmic_stroll() -> None:
    """Bright, cheerful space stroll: bells + melody, no bass drone."""
    global SR
    SR = 44100
    bpm = 128.0
    beat = 60.0 / bpm
    bars = 16
    dur = bars * 4 * beat
    n = int(SR * dur)
    left = [0.0] * n
    right = [0.0] * n

    g4, a4 = 392.00, 440.00
    c5, d5, e5, f5, g5, a5, b5 = 523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77
    c6, d6, e6, g6 = 1046.50, 1174.66, 1318.51, 1567.98

    melody = [
        g5, e5, g5, c6, a5, g5, e5, d5,
        f5, a5, c6, a5, g5, e5, c5, d5,
        e5, g5, c6, g5, a5, f5, d5, f5,
        e5, d5, c5, e5, g5, e5, c5, g5,
        g5, a5, b5, c6, d6, c6, a5, g5,
        e5, g5, a5, g5, f5, d5, e5, c5,
        c6, a5, g5, e5, f5, a5, g5, e5,
        d5, e5, g5, e5, c5, e5, g5, c6,
    ] * 2
    # one melody note per eighth-note; rest every 8th slot for air
    for i, note in enumerate(melody):
        if i % 8 == 7:
            continue
        t0 = i * beat * 0.5
        mix_bell(left, right, SR, t0, note, 0.38, 0.34, pan=(-0.25 if i % 2 == 0 else 0.25))
        mix_bell(left, right, SR, t0 + 0.012, note * 2.005, 0.22, 0.09, pan=(0.35 if i % 2 == 0 else -0.35))

    # high sparkle ostinato, not a pad
    sparkle = [g6, e6, c6, e6]
    for bar in range(bars):
        t0 = bar * 4 * beat
        root = [c5, a4, f5, g4][bar % 4]
        mix_bell(left, right, SR, t0, root * 2, 0.28, 0.12, pan=-0.1)
        mix_bell(left, right, SR, t0 + 2 * beat, e5, 0.22, 0.1, pan=0.1)
        for k in range(4):
            mix_bell(left, right, SR, t0 + (0.5 + k) * beat, sparkle[k], 0.18, 0.07, pan=0.45 if k % 2 else -0.45)
        mix_blip(left, right, SR, t0, 2480, 0.045, 0.11)
        mix_blip(left, right, SR, t0 + beat, 3120, 0.03, 0.07)
        mix_blip(left, right, SR, t0 + 2 * beat, 2480, 0.04, 0.1)
        mix_blip(left, right, SR, t0 + 3 * beat, 3360, 0.028, 0.06)

    highpass(left, 320, SR)
    highpass(right, 320, SR)
    peak = 1e-6
    for i in range(n):
        peak = max(peak, abs(left[i]), abs(right[i]))
    gain = 0.86 / peak
    fade = int(SR * 0.18)
    for i in range(n):
        edge = 1.0
        if i < fade:
            edge = i / fade
        elif i > n - fade:
            edge = (n - 1 - i) / fade
        left[i] *= gain * edge
        right[i] *= gain * edge
    write_wav_stereo("cosmic-stroll.wav", left, right)
    write_wav_stereo("starlit-jaunt.wav", left, right)
    write_wav_stereo("celestial-drift.wav", left, right)
    write_wav_stereo("bgm.wav", left, right)


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
    cosmic_stroll()
