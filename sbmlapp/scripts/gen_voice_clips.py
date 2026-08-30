"""Generate bundled AI voice clips with Microsoft Edge TTS (neural)."""
from __future__ import annotations

import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "voice"
OUT.mkdir(parents=True, exist_ok=True)

COMMON_WORDS = [
    "cat", "dog", "sun", "moon", "star", "fish", "bird", "tree", "book", "pen",
    "red", "blue", "yes", "no", "big", "small", "hot", "cold", "run", "jump",
    "eat", "milk", "egg", "rice", "cake", "apple", "banana", "water", "hand", "foot",
    "eye", "ear", "nose", "mouth", "face", "hair", "boy", "girl", "mom", "dad",
    "baby", "home", "door", "window", "bed", "chair", "table", "ball", "car", "bus",
    "bike", "train", "plane", "boat", "ship", "road", "park", "school", "friend", "play",
    "happy", "sad", "love", "good", "bad", "new", "old", "one", "two", "three",
    "four", "five", "six", "seven", "eight", "nine", "ten", "hello", "bye", "please",
    "thank", "sorry", "help", "look", "listen", "sing", "dance", "draw", "read", "write",
    "sleep", "wake", "walk", "swim", "fly", "rain", "snow", "wind", "flower", "rocket",
]

# 赞赏：活泼女声；英文：清晰童趣女声
ZH_VOICE = "zh-CN-XiaoxiaoNeural"
EN_VOICE = "en-US-AnaNeural"

LETTER_NAMES = {
    "a": "A",
    "b": "B",
    "c": "C",
    "d": "D",
    "e": "E",
    "f": "F",
    "g": "G",
    "h": "H",
    "i": "I",
    "j": "J",
    "k": "K",
    "l": "L",
    "m": "M",
    "n": "N",
    "o": "O",
    "p": "P",
    "q": "Q",
    "r": "R",
    "s": "S",
    "t": "T",
    "u": "U",
    "v": "V",
    "w": "W",
    "x": "X",
    "y": "Y",
    "z": "Z",
}


async def save_clip(text: str, voice: str, path: Path, rate: str = "+0%", pitch: str = "+0Hz") -> None:
    communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    await communicate.save(str(path))
    print("ok", path.name, path.stat().st_size)


async def main() -> None:
    jobs: list[tuple[str, str, Path, str, str]] = []

    # 赞赏语气稍高亢、稍快一点更像鼓励
    jobs.append(("你真棒！", ZH_VOICE, OUT / "praise.mp3", "+8%", "+4Hz"))

    for ch, name in LETTER_NAMES.items():
        # 单字母念慢一点
        jobs.append((name, EN_VOICE, OUT / f"letter-{ch}.mp3", "-10%", "+0Hz"))

    for word in COMMON_WORDS:
        jobs.append((word, EN_VOICE, OUT / f"word-{word}.mp3", "-5%", "+0Hz"))

    sem = asyncio.Semaphore(4)

    async def one(text: str, voice: str, path: Path, rate: str, pitch: str) -> None:
        async with sem:
            for attempt in range(3):
                try:
                    await save_clip(text, voice, path, rate, pitch)
                    return
                except Exception as e:
                    print("retry", path.name, attempt, e)
                    await asyncio.sleep(1.2 * (attempt + 1))
            raise RuntimeError(f"failed {path}")

    await asyncio.gather(*[one(*j) for j in jobs])

    manifest = {
        "praise": "/voice/praise.mp3",
        "letters": {ch: f"/voice/letter-{ch}.mp3" for ch in LETTER_NAMES},
        "words": {w: f"/voice/word-{w}.mp3" for w in COMMON_WORDS},
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("done", len(jobs), "clips ->", OUT)


if __name__ == "__main__":
    asyncio.run(main())
