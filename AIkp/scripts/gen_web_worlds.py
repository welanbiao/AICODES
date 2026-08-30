# -*- coding: utf-8 -*-
"""Parse Kotlin preset() calls into web/src/worlds.ts"""
import re
from pathlib import Path

ROOT = Path(r"d:\code\AIkp")
KT_DIR = ROOT / r"app\src\main\java\com\aikp\cardgame\domain\world"

WORLDS = [
    {
        "id": "w_xiyou",
        "title": "西游记",
        "genre": "CLASSICS",
        "sourceHint": "吴承恩",
        "lore": "西天取经路，八十一难精怪拦道",
        "fullLore": "唐僧奉旨西行求取真经，收悟空、八戒、沙僧与白龙马为伴。沿途有天庭仙佛点拨，也有洞府精怪劫僧。战场是取经路：山岭、流沙、火焰山与西天雷音之间的试炼。神通可变可战，但须受金箍、因果与佛门约束，不得写成无敌不死。",
        "canonHint": "神通、金箍、变化、禅机；禁无敌不死与热兵器",
        "coverKey": "xiyou",
        "file": "CharactersXiYou.kt",
    },
    {
        "id": "w_sanguo",
        "title": "三国演义",
        "genre": "CLASSICS",
        "sourceHint": "罗贯中",
        "lore": "汉末群雄逐鹿，魏蜀吴三分天下",
        "fullLore": "黄巾乱后，董卓入京、诸侯讨伐，曹操挟天子令诸侯，刘备以仁义聚将，孙权坐断江东。赤壁之后三国鼎立，战场是中原、荆襄、巴蜀与江淮。计谋、阵法、水战火攻与坐骑兵刃并存，禁仙术飞升与现代枪械。",
        "canonHint": "冷兵器、阵法、坐骑、权谋；禁枪械与仙术飞升",
        "coverKey": "sanguo",
        "file": "CharactersSanGuo.kt",
    },
    {
        "id": "w_shuihu",
        "title": "水浒传",
        "genre": "CLASSICS",
        "sourceHint": "施耐庵",
        "lore": "水泊梁山聚义，替天行道较武",
        "fullLore": "北宋末年，好汉因冤案、义气或被逼上梁山。晁盖劫生辰纲开局，宋江聚一百零八将排座次，有马军、步军、水军与头领。战场是梁山水泊、祝家庄、曾头市与征途关隘。拳脚兵刃、水战弓马皆可，禁法术飞升与火器。",
        "canonHint": "兵刃、拳脚、水战、义气；禁飞升与枪炮",
        "coverKey": "shuihu",
        "file": "CharactersShuiHu.kt",
    },
    {
        "id": "w_liaozhai",
        "title": "聊斋志异",
        "genre": "CLASSICS",
        "sourceHint": "蒲松龄",
        "lore": "花妖狐魅入世，书生侠客夜遇奇缘",
        "fullLore": "蒲松龄笔下的狐鬼花妖与人间交错：兰若寺、画皮、婴宁之笑、席方平告阴司。战场是夜巷、废寺、园林与冥司边缘。可写狐术、鬼影、剑客与科举冷暖，须守人情分寸，禁无敌不死、秒杀与现代武器。",
        "canonHint": "狐魅、鬼影、剑客、人情；禁无敌秒杀与热兵器",
        "coverKey": "liaozhai",
        "file": "CharactersLiaoZhai.kt",
    },
]

HEAD = re.compile(
    r'preset\(\s*W,\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*(SSR|SR|R|N),\s*"([^"]+)",\s*(.*)\s*\)\s*\Z',
    re.S,
)
PAIR = re.compile(r'"([^"]*)"\s*to\s*"([^"]*)"')
FULL = re.compile(r'fullLore\s*=\s*"([^"]*)"')
FORBIDDEN = ("无敌", "无限", "不死", "秒杀", "必胜")


def extract_calls(text: str) -> list[str]:
    calls = []
    i = 0
    while True:
        start = text.find("preset(", i)
        if start < 0:
            break
        depth = 0
        j = start
        in_str = False
        while j < len(text):
            ch = text[j]
            if ch == '"' and (j == 0 or text[j - 1] != "\\"):
                in_str = not in_str
            elif not in_str:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        calls.append(text[start : j + 1])
                        j += 1
                        break
            j += 1
        i = j
    return calls


def parse_file(path: Path, world_id: str):
    text = path.read_text(encoding="utf-8")
    out = []
    for raw in extract_calls(text):
        compact = " ".join(raw.split())
        m = HEAD.match(compact)
        if not m:
            print("skip", compact[:80])
            continue
        key, name, nick, faction, lore, grade, role, rest = m.groups()
        fm = FULL.search(rest)
        full = fm.group(1) if fm else lore
        rest_skills = FULL.sub("", rest)
        skills = PAIR.findall(rest_skills)
        issues = []
        if len(name) > 12:
            issues.append(f"name {len(name)}>{12}")
        if len(lore) > 60:
            issues.append(f"lore {len(lore)}>{60}")
        if not skills:
            issues.append("no skills")
        if len(skills) > 3:
            issues.append(f"skills {len(skills)}")
        blob = name + lore
        for a, b in skills:
            if len(a) > 8:
                issues.append(f"skill name {a} {len(a)}")
            if len(b) > 20:
                issues.append(f"skill desc {a} {len(b)}")
            blob += a + b
        for word in FORBIDDEN:
            if word in blob:
                issues.append(f"forbidden {word}")
        if issues:
            print("WARN", world_id, name, issues)
        out.append({
            "id": f"{world_id}_{key}",
            "worldId": world_id,
            "name": name,
            "nickname": nick,
            "faction": faction,
            "lore": lore,
            "fullLore": full,
            "grade": grade,
            "roleHint": role,
            "skills": [{"name": a, "description": b} for a, b in skills],
        })
    return out


def js_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'


def emit_preset(p: dict) -> str:
    skills = ", ".join(
        f'{{ name: {js_str(s["name"])}, description: {js_str(s["description"])} }}' for s in p["skills"]
    )
    return (
        "      {\n"
        f'        id: {js_str(p["id"])},\n'
        f'        worldId: {js_str(p["worldId"])},\n'
        f'        name: {js_str(p["name"])},\n'
        f'        nickname: {js_str(p["nickname"])},\n'
        f'        faction: {js_str(p["faction"])},\n'
        f'        lore: {js_str(p["lore"])},\n'
        f'        fullLore: {js_str(p["fullLore"])},\n'
        f'        grade: {js_str(p["grade"])},\n'
        f'        roleHint: {js_str(p["roleHint"])},\n'
        f"        skills: [{skills}],\n"
        "      }"
    )


parts = ['''export type WorldGenre = 'HISTORY' | 'CLASSICS' | 'DRAMA' | 'NOVEL' | 'CUSTOM'

export type Skill = { name: string; description: string }

export type WorldPreset = {
  id: string
  worldId: string
  name: string
  lore: string
  skills: Skill[]
  grade: string
  roleHint: string
  faction: string
  nickname: string
  fullLore: string
}

export type SmallWorld = {
  id: string
  title: string
  genre: WorldGenre
  sourceHint: string
  lore: string
  fullLore: string
  canonHint: string
  coverKey: 'classics' | 'history' | 'drama' | 'novel' | 'xiyou' | 'sanguo' | 'shuihu' | 'liaozhai'
  official: boolean
  presets: WorldPreset[]
}

export const GENRE_LABEL: Record<WorldGenre, string> = {
  HISTORY: '历史国度',
  CLASSICS: '四大名著',
  DRAMA: '著名剧集',
  NOVEL: '热门小说',
  CUSTOM: '自定义',
}

export const COVER: Record<SmallWorld['coverKey'], string> = {
  classics: '/art/cover_classics.png',
  history: '/art/cover_history.png',
  drama: '/art/cover_drama.png',
  novel: '/art/cover_novel.png',
  xiyou: '/art/cover_xiyou.png',
  sanguo: '/art/cover_sanguo.png',
  shuihu: '/art/cover_shuihu.png',
  liaozhai: '/art/cover_liaozhai.png',
}

export const officialWorlds: SmallWorld[] = [
''']

total = 0
for w in WORLDS:
    presets = parse_file(KT_DIR / w["file"], w["id"])
    total += len(presets)
    print(w["id"], len(presets))
    body = ",\n".join(emit_preset(p) for p in presets)
    parts.append(
        "  {\n"
        f'    id: {js_str(w["id"])},\n'
        f'    title: {js_str(w["title"])},\n'
        f'    genre: {js_str(w["genre"])},\n'
        f'    sourceHint: {js_str(w["sourceHint"])},\n'
        f'    lore: {js_str(w["lore"])},\n'
        f'    fullLore: {js_str(w["fullLore"])},\n'
        f'    canonHint: {js_str(w["canonHint"])},\n'
        f'    coverKey: {js_str(w["coverKey"])},\n'
        "    official: true,\n"
        f"    presets: [\n{body}\n    ],\n"
        "  },\n"
    )

parts.append("]\n")
out = ROOT / r"web\src\worlds.ts"
out.write_text("".join(parts), encoding="utf-8")
print("wrote", out, "total presets", total)
