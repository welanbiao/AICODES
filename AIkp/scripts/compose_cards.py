# -*- coding: utf-8 -*-
"""Build portrait JPGs for every official preset.

Unique AI art when assets/{id}.png exists; otherwise world fallback.
Text (name / grade / skills) is rendered in app UI overlays, not baked here.
"""
from __future__ import annotations

import re
from pathlib import Path

from PIL import Image

ROOT = Path(r"d:\code\AIkp")
ASSETS = Path(r"C:\Users\yz\.cursor\projects\d-code-AIkp\assets")
WEB = ROOT / r"web\public\art\cards"
ANDROID = ROOT / r"app\src\main\assets\cards"
WORLDS_TS = ROOT / r"web\src\worlds.ts"

SIZE = (540, 720)

PRESET = re.compile(
    r'id: "(?P<id>[^"]+)",\s*'
    r'worldId: "(?P<worldId>[^"]+)",\s*'
    r'name: "(?P<name>[^"]+)",\s*'
    r'nickname: "(?P<nickname>[^"]*)",\s*'
    r'faction: "(?P<faction>[^"]*)",.*?'
    r'grade: "(?P<grade>[^"]+)",.*?'
    r"skills: \[(?P<skills>[^\]]*)\]",
    re.S,
)


def parse_presets() -> list[dict]:
    text = WORLDS_TS.read_text(encoding="utf-8")
    out = []
    for m in PRESET.finditer(text):
        out.append(m.groupdict())
    return out


def fit(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    im = im.convert("RGB")
    tw, th = size
    scale = max(tw / im.width, th / im.height)
    nw, nh = int(im.width * scale), int(im.height * scale)
    im = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return im.crop((left, top, left + tw, top + th))


def compose(preset: dict, unique: dict[str, Path], fallbacks: dict[str, Path]) -> Image.Image:
    pid = preset["id"]
    world = preset["worldId"]
    src = unique.get(pid) or fallbacks.get(world)
    if src is None:
        return Image.new("RGB", SIZE, (11, 18, 32))
    return fit(Image.open(src), SIZE)


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    ANDROID.mkdir(parents=True, exist_ok=True)
    presets = parse_presets()
    unique = {p.stem: p for p in ASSETS.glob("w_*.png")}
    fallbacks = {
        k: ASSETS / f"fallback_{k}.png"
        for k in ("w_xiyou", "w_sanguo", "w_shuihu", "w_liaozhai")
        if (ASSETS / f"fallback_{k}.png").exists()
    }
    print("presets", len(presets), "unique art", len(unique))
    for preset in presets:
        card = compose(preset, unique, fallbacks)
        name = f"{preset['id']}.jpg"
        for dest in (WEB / name, ANDROID / name):
            card.save(dest, "JPEG", quality=86, optimize=True)
    print("wrote", len(presets), "cards")


if __name__ == "__main__":
    main()
