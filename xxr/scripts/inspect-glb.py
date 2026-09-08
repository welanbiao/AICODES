import json
import os
import struct
import sys
from pathlib import Path


def inspect(p: str) -> None:
    data = Path(p).read_bytes()
    _magic, _ver, length = struct.unpack_from("<4sII", data, 0)
    off = 12
    gltf = None
    while off < length:
        clen, ctype = struct.unpack_from("<I4s", data, off)
        chunk = data[off + 8 : off + 8 + clen]
        if ctype.startswith(b"JSON"):
            gltf = json.loads(chunk)
            break
        off += 8 + clen
    assert gltf is not None
    g = gltf
    print("===", Path(p).name, os.path.getsize(p), "bytes ===")
    print(
        "meshes",
        len(g.get("meshes", [])),
        "nodes",
        len(g.get("nodes", [])),
        "anims",
        len(g.get("animations", [])),
        "images",
        len(g.get("images", [])),
        "materials",
        len(g.get("materials", [])),
    )
    print("ext used", g.get("extensionsUsed"))
    print("ext req", g.get("extensionsRequired"))
    for a in g.get("animations", []):
        ch = a.get("channels", [])
        samps = a.get("samplers", [])
        maxt = 0.0
        for s in samps:
            acc = g["accessors"][s["input"]]
            mx = acc.get("max") or [0]
            maxt = max(maxt, float(mx[0]))
        print("  anim", a.get("name"), "channels", len(ch), "maxT", maxt)
        paths = {}
        for c in ch:
            path = c.get("target", {}).get("path")
            paths[path] = paths.get(path, 0) + 1
        print("  paths", paths)
        node_ids = [c.get("target", {}).get("node") for c in ch]
        node_names = []
        for nid in node_ids[:30]:
            if nid is None:
                continue
            node_names.append(g["nodes"][nid].get("name"))
        print("  first targets", node_names)

    names = [n.get("name") or "" for n in g.get("nodes", [])]
    print("node count", len(names))
    wr = [n for n in names if any(k in n.lower() for k in ("wrist", "arm", "hand", "l_", "r_"))]
    print("arm-like count", len(wr))
    print("arm-like", wr[:50])

    mins = []
    maxs = []
    for m in g.get("meshes", []):
        for prim in m.get("primitives", []):
            pos = prim.get("attributes", {}).get("POSITION")
            if pos is None:
                continue
            acc = g["accessors"][pos]
            if "min" in acc and "max" in acc:
                mins.append(acc["min"])
                maxs.append(acc["max"])
    if mins:
        gmin = [min(x[i] for x in mins) for i in range(3)]
        gmax = [max(x[i] for x in maxs) for i in range(3)]
        print("pos bbox", gmin, gmax)
        print("size", [gmax[i] - gmin[i] for i in range(3)])
    skins = g.get("skins", [])
    print("skins", len(skins), "joints", [len(s.get("joints", [])) for s in skins])
    mats = g.get("materials", [])
    if mats:
        print("mat0", json.dumps(mats[0].get("name"), ensure_ascii=True), "ext", list((mats[0].get("extensions") or {}).keys()))
    print()


if __name__ == "__main__":
    for f in sys.argv[1:]:
        inspect(f)
