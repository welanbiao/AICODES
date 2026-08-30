/**
 * Server-side review + battle generation (single authority for online matches).
 */

const BANNED = ["无敌", "无限", "秒杀", "不死", "必胜", "影响AI", "控制AI", "绕过审核", "绝对防御"];

export function stripForbidden(text = "") {
  let cleaned = String(text);
  const removed = [];
  for (const w of BANNED) {
    if (cleaned.includes(w)) {
      removed.push(w);
      cleaned = cleaned.split(w).join("");
    }
  }
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  return { cleaned, removed };
}

export function mergeBattlefield(defender, challenger) {
  return `【守擂战场】${defender}｜【挑战增补】${challenger}`;
}

export function worldBattlefieldLine(title, lore) {
  const name = String(title || "小世界").slice(0, 12);
  const field = String(lore || "").slice(0, 80);
  return `【小世界·${name}】${field}`;
}

function sideText(cards = []) {
  return cards
    .map((c) => {
      const skills = (c.reviewedSkills || c.skills || [])
        .map((s) => `${s.name}:${s.description}`)
        .join("；");
      return `- ${c.name}｜${c.reviewedLore || c.lore || ""}｜技能：${skills}`;
    })
    .join("\n");
}

export function buildBattlePrompt(mode, merged, defenders, challengers, world = {}) {
  const teamSize = mode === "THREE_V_THREE" ? 3 : 1;
  const label = mode === "THREE_V_THREE" ? "三对三" : "一对一";
  const worldTitle = world.title || "小世界";
  const canon = world.canonHint || "符合该世界题材，禁止越界";
  return `你是「AI卡牌」对战AI。双方在同一小世界中对决，战场即该世界背景，不可另设。
规则：
1. 战场固定为小世界背景；守擂方仅有轻微地利。
2. 技能演绎必须符合世界题材：${canon}
3. 禁止出现无敌/无限/秒杀等；越界技能按弱化或失效处理。
4. 模式：${label}（每方 ${teamSize} 张卡）。
5. 可描述入场特效与通用战斗特效。
6. 输出 3~5 个回合叙事，最终明确胜者。

小世界：${worldTitle}（${world.genre || ""} · ${world.sourceHint || ""}）
战场：${merged}

守擂方：
${sideText(defenders)}

挑战方：
${sideText(challengers)}

只输出 JSON：
{
  "winnerSide":"DEFENDER或CHALLENGER",
  "summary":"总述",
  "rounds":[{"round":1,"narrative":"...","effectHint":"slash|burst|guard|entrance"}],
  "entranceEffects":["守擂XX华丽入场","挑战YY破空入场"],
  "commonEffects":["剑气交错","场地共鸣"],
  "defenderScoreDelta":10,
  "challengerScoreDelta":-5
}
分数变化建议在 -20~+25。`;
}

export function mockBattleResult(seedText = "") {
  const winner = String(seedText).length % 2 === 0 ? "DEFENDER" : "CHALLENGER";
  return {
    winnerSide: winner,
    summary: "联机排位战报（服务端裁决）",
    rounds: [
      { round: 1, narrative: "双方踏入共创战场，守擂提示词先定局势，挑战者补笔撕开裂隙。", effectHint: "entrance" },
      { round: 2, narrative: "技能交锋，场地共鸣掀起通用特效浪潮。", effectHint: "burst" },
      {
        round: 3,
        narrative: winner === "DEFENDER" ? "守擂方借地形稳住节奏，最终锁定胜局。" : "挑战方在增补战场中找到破绽，逆转取胜。",
        effectHint: "slash",
      },
    ],
    entranceEffects: ["守擂卡牌踏场生光", "挑战卡牌破空入阵"],
    commonEffects: ["剑气交错", "场地共鸣"],
    defenderScoreDelta: winner === "DEFENDER" ? 14 : -6,
    challengerScoreDelta: winner === "CHALLENGER" ? 16 : -5,
  };
}

export function extractJsonObject(text) {
  const start = String(text).indexOf("{");
  const end = String(text).lastIndexOf("}");
  if (start >= 0 && end > start) return String(text).substring(start, end + 1);
  return "{}";
}

export function normalizeBattleResult(raw, fallbackSeed = "") {
  let obj;
  try {
    obj = typeof raw === "string" ? JSON.parse(extractJsonObject(raw)) : raw;
  } catch {
    return mockBattleResult(fallbackSeed);
  }
  if (!obj || typeof obj !== "object") return mockBattleResult(fallbackSeed);
  const winnerSide = String(obj.winnerSide || "").toUpperCase() === "CHALLENGER" ? "CHALLENGER" : "DEFENDER";
  const rounds = Array.isArray(obj.rounds) && obj.rounds.length
    ? obj.rounds.map((r, i) => ({
        round: Number(r.round) || i + 1,
        narrative: String(r.narrative || "交锋持续。"),
        effectHint: String(r.effectHint || "slash"),
      }))
    : mockBattleResult(fallbackSeed).rounds;
  return {
    winnerSide,
    summary: String(obj.summary || "对战结束"),
    rounds,
    entranceEffects: Array.isArray(obj.entranceEffects) ? obj.entranceEffects.map(String) : ["守擂入场", "挑战入场"],
    commonEffects: Array.isArray(obj.commonEffects) ? obj.commonEffects.map(String) : ["场地共鸣"],
    defenderScoreDelta: Number.isFinite(Number(obj.defenderScoreDelta))
      ? Number(obj.defenderScoreDelta)
      : winnerSide === "DEFENDER" ? 12 : -5,
    challengerScoreDelta: Number.isFinite(Number(obj.challengerScoreDelta))
      ? Number(obj.challengerScoreDelta)
      : winnerSide === "CHALLENGER" ? 14 : -5,
  };
}
