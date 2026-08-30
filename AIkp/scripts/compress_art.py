from PIL import Image
from pathlib import Path

assets = Path(r"C:\Users\yz\.cursor\projects\d-code-AIkp\assets")
android = Path(r"d:\code\AIkp\app\src\main\res\drawable-nodpi")
web = Path(r"d:\code\AIkp\web\public\art")
android.mkdir(parents=True, exist_ok=True)
web.mkdir(parents=True, exist_ok=True)

specs = {
    "bg_hall.png": (720, 1280),
    "bg_battle.png": (720, 1280),
    "btn_battle.png": (960, 360),
    "btn_world.png": (960, 360),
    "btn_forge.png": (960, 360),
    "btn_create.png": (960, 360),
    "btn_jade.png": (960, 360),
    "btn_brass.png": (960, 360),
    "cover_classics.png": (960, 540),
    "cover_history.png": (960, 540),
    "cover_drama.png": (960, 540),
    "cover_novel.png": (960, 540),
    "cover_xiyou.png": (960, 540),
    "cover_sanguo.png": (960, 540),
    "cover_shuihu.png": (960, 540),
    "cover_liaozhai.png": (960, 540),
}

for name, size in specs.items():
    src = assets / name
    if not src.exists():
        print("skip missing", name)
        continue
    im = Image.open(src).convert("RGB")
    im = im.resize(size, Image.Resampling.LANCZOS)
    for dest in (android / name, web / name):
        im.save(dest, "PNG", optimize=True)
        print(f"{dest} {dest.stat().st_size}")
