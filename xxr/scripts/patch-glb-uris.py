import json
import struct
from pathlib import Path

src = Path(r"d:\code\AICODES\xxr\public\models\iphone12.glb")
data = src.read_bytes()
magic, version, length = struct.unpack_from("<III", data, 0)
json_len, json_type = struct.unpack_from("<I4s", data, 12)
raw = data[20 : 20 + json_len].rstrip(b"\x00 ").decode("utf-8")
js = json.loads(raw)

fixes = {
    "metal_parts.psd": "metal_parts.jpg",
    r"iphone12_ready\textures\tex_parts_BaseColor.png": "iphone12_ready/textures/tex_parts_BaseColor.png",
    r"iphone12_ready\textures\screen.jpg": "iphone12_ready/textures/screen.jpg",
    "iphone12_ready\\textures\\tex_parts_BaseColor.png": "iphone12_ready/textures/tex_parts_BaseColor.png",
    "iphone12_ready\\textures\\screen.jpg": "iphone12_ready/textures/screen.jpg",
}

for img in js.get("images") or []:
    uri = img.get("uri")
    if not uri:
        continue
    img["uri"] = fixes.get(uri, uri.replace("\\", "/"))
    print("image", uri, "->", img["uri"])

json_bytes = json.dumps(js, separators=(",", ":")).encode("utf-8")
pad = (4 - (len(json_bytes) % 4)) % 4
json_bytes += b" " * pad

bin_off = 20 + json_len
pad2 = (4 - (bin_off % 4)) % 4
bin_off += pad2
bin_len, bin_type = struct.unpack_from("<I4s", data, bin_off)
bin_bytes = data[bin_off + 8 : bin_off + 8 + bin_len]
bin_pad = (4 - (len(bin_bytes) % 4)) % 4
bin_bytes += b"\x00" * bin_pad

out = bytearray()
out += struct.pack("<III", 0x46546C67, 2, 0)
out += struct.pack("<I4s", len(json_bytes), b"JSON")
out += json_bytes
out += struct.pack("<I4s", len(bin_bytes), b"BIN\x00")
out += bin_bytes
struct.pack_into("<I", out, 8, len(out))
src.write_bytes(out)
print("wrote", src, len(out))
