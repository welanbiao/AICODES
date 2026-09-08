import json
import struct
from pathlib import Path


def gltf(p: str):
    data = Path(p).read_bytes()
    off = 12
    while off < len(data):
        clen, ctype = struct.unpack_from("<I4s", data, off)
        chunk = data[off + 8 : off + 8 + clen]
        if ctype.startswith(b"JSON"):
            return json.loads(chunk)
        off += 8 + clen
    raise RuntimeError("no json")


g = gltf(r"D:\code\AICODES\xxr\mx\fps_arms.glb")
for i, n in enumerate(g["nodes"]):
    name = n.get("name")
    t = n.get("translation")
    r = n.get("rotation")
    s = n.get("scale")
    m = n.get("matrix")
    children = n.get("children")
    print(
        f"{i:3d} {name!r:24s} t={t} r={r} s={s} mesh={n.get('mesh')} skin={n.get('skin')} ch={children}"
    )
