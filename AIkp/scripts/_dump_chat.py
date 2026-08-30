import json
import re
from pathlib import Path

p = Path(
    r"C:\Users\yz\.cursor\projects\d-code-AIkp\agent-transcripts"
    r"\a7efb5ad-e903-4b4c-a59d-89c65635c709"
    r"\a7efb5ad-e903-4b4c-a59d-89c65635c709.jsonl"
)

turns = []
for line in p.open(encoding="utf-8"):
    try:
        o = json.loads(line)
    except Exception:
        continue
    role = o.get("role")
    msg = o.get("message") or {}
    content = msg.get("content") if isinstance(msg, dict) else None
    texts = []
    if isinstance(content, list):
        for c in content:
            if not isinstance(c, dict):
                continue
            if c.get("type") == "text":
                texts.append(c.get("text", ""))
    elif isinstance(content, str):
        texts.append(content)
    text = "\n".join(texts).strip()
    if not text or role not in ("user", "assistant"):
        continue

    ts = ""
    m = re.search(r"<timestamp>(.*?)</timestamp>", text)
    if m:
        ts = m.group(1)
    mq = re.search(r"<user_query>\s*([\s\S]*?)\s*</user_query>", text)
    if mq:
        text = mq.group(1).strip()
    # skip system notifications noise lightly
    if role == "assistant":
        text = re.sub(r"\s+", " ", text).strip()[:240]
    turns.append((role, ts, text))

n = 0
for role, ts, text in turns:
    if role == "user":
        n += 1
        print(f"--- #{n} USER {ts} ---")
        print(text)
        print()
    else:
        print(f"    ASSISTANT: {text}")
        print()
print("TOTAL_USER_TURNS", n)
