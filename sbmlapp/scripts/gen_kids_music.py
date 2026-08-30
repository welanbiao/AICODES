"""Generate public-domain nursery rhyme melodies as soft kids BGM (WAV)."""
from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

SR = 22050
OUT = Path(__file__).resolve().parents[1] / "public" / "music"
OUT.mkdir(parents=True, exist_ok=True)

# Note name -> frequency
NOTES = {
    "C3": 130.81,
    "D3": 146.83,
    "E3": 164.81,
    "F3": 174.61,
    "G3": 196.00,
    "A3": 220.00,
    "B3": 246.94,
    "C4": 261.63,
    "D4": 293.66,
    "E4": 329.63,
    "F4": 349.23,
    "G4": 392.00,
    "A4": 440.00,
    "B4": 493.88,
    "C5": 523.25,
    "D5": 587.33,
    "E5": 659.25,
    "F5": 698.46,
    "G5": 783.99,
    "REST": 0.0,
}


def tone(freq: float, seconds: float, volume: float = 0.22) -> list[float]:
    n = int(SR * seconds)
    samples: list[float] = []
    if freq <= 0:
        return [0.0] * n
    attack = max(1, int(0.02 * SR))
    release = max(1, int(0.06 * SR))
    for i in range(n):
        t = i / SR
        # soft triangle + gentle sine (kids-friendly, not harsh)
        tri = 2 * abs(2 * ((t * freq) % 1) - 1) - 1
        sine = math.sin(2 * math.pi * freq * t)
        env = 1.0
        if i < attack:
            env = i / attack
        elif i > n - release:
            env = max(0.0, (n - i) / release)
        samples.append((0.55 * sine + 0.45 * tri) * volume * env)
    return samples


def render(score: list[tuple[str, float]], bpm: float = 100) -> list[float]:
    beat = 60.0 / bpm
    out: list[float] = []
    for name, beats in score:
        out.extend(tone(NOTES[name], beats * beat))
    # short pause between loops baked in
    out.extend(tone(0, 0.35, 0))
    return out


def write_wav(path: Path, samples: list[float]) -> None:
    # loop-friendly: duplicate once for longer track
    samples = samples * 2
    with wave.open(str(path), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s))
            frames += struct.pack("<h", int(v * 32767))
        w.writeframes(frames)


# Public domain melodies (simplified)
TWINKLE = [
    ("C4", 1), ("C4", 1), ("G4", 1), ("G4", 1), ("A4", 1), ("A4", 1), ("G4", 2),
    ("F4", 1), ("F4", 1), ("E4", 1), ("E4", 1), ("D4", 1), ("D4", 1), ("C4", 2),
    ("G4", 1), ("G4", 1), ("F4", 1), ("F4", 1), ("E4", 1), ("E4", 1), ("D4", 2),
    ("G4", 1), ("G4", 1), ("F4", 1), ("F4", 1), ("E4", 1), ("E4", 1), ("D4", 2),
    ("C4", 1), ("C4", 1), ("G4", 1), ("G4", 1), ("A4", 1), ("A4", 1), ("G4", 2),
    ("F4", 1), ("F4", 1), ("E4", 1), ("E4", 1), ("D4", 1), ("D4", 1), ("C4", 2),
]

LITTLE_LAMB = [
    ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("E4", 1), ("E4", 2),
    ("D4", 1), ("D4", 1), ("D4", 2), ("E4", 1), ("G4", 1), ("G4", 2),
    ("E4", 1), ("D4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("E4", 1), ("E4", 1), ("E4", 1),
    ("D4", 1), ("D4", 1), ("E4", 1), ("D4", 1), ("C4", 4),
]

HAPPY = [
    ("C4", 1), ("C4", 1), ("D4", 1), ("E4", 1), ("E4", 1), ("D4", 1), ("C4", 1), ("E4", 1),
    ("D4", 1), ("D4", 1), ("C4", 1), ("G3", 1), ("A3", 1), ("C4", 2), ("REST", 1),
    ("E4", 1), ("E4", 1), ("F4", 1), ("G4", 1), ("G4", 1), ("F4", 1), ("E4", 1), ("C4", 1),
    ("D4", 1), ("G3", 1), ("A3", 1), ("B3", 1), ("C4", 2), ("REST", 1),
]

ROW_BOAT = [
    ("C4", 1.5), ("C4", 0.5), ("C4", 1), ("D4", 1), ("E4", 2), ("E4", 1), ("D4", 1), ("E4", 1), ("F4", 1), ("G4", 4),
    ("C5", 0.5), ("C5", 0.5), ("C5", 0.5), ("G4", 0.5), ("G4", 0.5), ("G4", 0.5), ("E4", 0.5), ("E4", 0.5), ("E4", 0.5), ("C4", 0.5), ("C4", 0.5), ("C4", 0.5),
    ("G4", 1), ("F4", 1), ("E4", 1), ("D4", 1), ("C4", 4),
]


def main() -> None:
    tracks = [
        ("twinkle.wav", "一闪一闪亮晶晶", TWINKLE, 96),
        ("little-lamb.wav", "玛丽有只小羊羔", LITTLE_LAMB, 108),
        ("happy-day.wav", "快乐画画歌", HAPPY, 112),
        ("row-boat.wav", "划船歌", ROW_BOAT, 92),
    ]
    meta: list[dict[str, str]] = []
    for filename, title, score, bpm in tracks:
        path = OUT / filename
        write_wav(path, render(score, bpm))
        meta.append({"id": filename.replace(".wav", ""), "title": title, "src": f"/music/{filename}"})
        print("wrote", path, "bytes", path.stat().st_size)
    # playlist json
    import json

    (OUT / "playlist.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("playlist", len(meta))


if __name__ == "__main__":
    main()
