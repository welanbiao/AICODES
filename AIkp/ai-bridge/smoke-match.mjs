/**
 * Local smoke test: two fake players queue and wait for a finished match.
 * Usage: node smoke-match.mjs
 */
const BASE = process.env.BASE || "http://127.0.0.1:8787";

function card(name) {
  return {
    id: name,
    name,
    lore: `${name}的设定`,
    skills: [{ name: "技", description: "普通一击" }],
    reviewedLore: `${name}的设定`,
    reviewedSkills: [{ name: "技", description: "普通一击" }],
  };
}

async function queue(playerId, nickname, role) {
  const res = await fetch(`${BASE}/v1/match/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId,
      nickname,
      rankPoints: 40,
      mode: "ONE_V_ONE",
      preferredRole: role,
      cards: [card(nickname + "卡")],
      world: {
        id: "w_smoke",
        title: "试炼场",
        lore: "风沙漫卷的试炼场",
        reviewedLore: "风沙漫卷的试炼场",
        canonHint: "试炼比武",
        genre: "CUSTOM",
        sourceHint: "测试",
      },
      battlefield: {
        id: "w_smoke",
        title: "试炼场",
        description: "风沙漫卷的试炼场",
        reviewedDescription: "风沙漫卷的试炼场",
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function poll(ticketId) {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${BASE}/v1/match/ticket/${ticketId}`);
    const data = await res.json();
    process.stdout.write(`\r[${ticketId.slice(0, 6)}] ${data.status}   `);
    if (data.status === "finished") {
      console.log("\n", data.match?.result?.summary, "winner=", data.match?.result?.winnerSide);
      return data;
    }
    if (["timeout", "cancelled"].includes(data.status)) throw new Error(data.status);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("poll timeout");
}

const a = await queue("p-a", "甲", "DEFENDER");
const b = await queue("p-b", "乙", "CHALLENGER");
console.log("queued", a.ticketId, b.ticketId, "status", a.status, b.status);
await Promise.all([poll(a.ticketId), poll(b.ticketId)]);
console.log("smoke ok");
