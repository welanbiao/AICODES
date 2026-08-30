/**
 * AI卡牌 · Cursor 大模型调试桥 + 联机匹配服
 *
 * Android 模拟器: http://10.0.2.2:8787
 * 真机: 改 AI_BRIDGE_URL 为电脑局域网 IP
 *
 * 环境变量:
 *   CURSOR_API_KEY / PORT / CURSOR_MODEL / FORCE_MOCK=1
 */
import http from "node:http";
import { Agent } from "@cursor/sdk";
import {
  authStats,
  loginUser,
  logoutUser,
  parseBearer,
  registerUser,
  updateUserProfile,
  userFromToken,
} from "./auth.mjs";
import { cancelTicket, enqueue, getLeaderboard, lobbySnapshot, ticketStatus } from "./matchmaking.mjs";

const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.CURSOR_MODEL || "composer-2.5";
const FORCE_MOCK = process.env.FORCE_MOCK === "1";

function json(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  });
  res.end(data);
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("invalid json");
  }
}

function mockComplete(task, prompt) {
  if (task === "review") {
    const raw = (prompt.split("原文：")[1] || prompt).split("请只输出")[0].trim();
    const banned = ["无敌", "无限", "秒杀", "影响AI", "控制AI"];
    let cleaned = raw;
    const removed = [];
    for (const w of banned) {
      if (cleaned.includes(w)) {
        removed.push(w);
        cleaned = cleaned.split(w).join("");
      }
    }
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim() || "平静的训练场";
    return JSON.stringify({
      cleanedText: cleaned.slice(0, 60),
      removedParts: removed,
      passed: cleaned.length >= 2,
      reason: removed.length ? `已移除：${removed.join(",")}` : "通过",
    });
  }
  if (task === "rate_card") {
    const score = prompt.length % 100;
    const grade = score > 70 ? "SR" : score > 40 ? "R" : "N";
    return JSON.stringify({ grade, comment: `桥接 mock 评级 ${grade}` });
  }
  const winner = prompt.length % 2 === 0 ? "DEFENDER" : "CHALLENGER";
  return JSON.stringify({
    winnerSide: winner,
    summary: "Cursor 桥接 mock 战报（未配置 API Key 或 FORCE_MOCK=1）",
    rounds: [
      { round: 1, narrative: "双方踏入共创战场，守擂提示词先定局势。", effectHint: "entrance" },
      { round: 2, narrative: "技能交锋，通用特效席卷全场。", effectHint: "burst" },
      {
        round: 3,
        narrative: winner === "DEFENDER" ? "守擂方稳住节奏取胜。" : "挑战方撕开裂隙逆转。",
        effectHint: "slash",
      },
    ],
    entranceEffects: ["守擂华丽入场", "挑战破空入场"],
    commonEffects: ["剑气交错", "场地共鸣"],
    defenderScoreDelta: winner === "DEFENDER" ? 12 : -6,
    challengerScoreDelta: winner === "CHALLENGER" ? 14 : -5,
  });
}

async function callCursor(prompt) {
  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) throw new Error("缺少 CURSOR_API_KEY");
  const result = await Agent.prompt(prompt, {
    apiKey,
    model: { id: MODEL },
    local: { cwd: process.cwd() },
  });
  return result?.result ?? result?.text ?? String(result);
}

async function completeAi(task, prompt) {
  if (FORCE_MOCK || !process.env.CURSOR_API_KEY) {
    return mockComplete(task, prompt);
  }
  try {
    return await callCursor(prompt);
  } catch (err) {
    console.warn("[ai] fallback mock:", err?.message || err);
    return mockComplete(task, prompt);
  }
}

function pathOf(url) {
  return (url || "/").split("?")[0];
}

const server = http.createServer(async (req, res) => {
  const path = pathOf(req.url);
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});

    if (req.method === "GET" && path === "/health") {
      return json(res, 200, {
        ok: true,
        model: MODEL,
        hasKey: Boolean(process.env.CURSOR_API_KEY),
        forceMock: FORCE_MOCK,
        lobby: lobbySnapshot(),
        auth: authStats(),
      });
    }

    if (req.method === "POST" && path === "/v1/auth/register") {
      const body = await readBody(req);
      return json(res, 200, registerUser(body));
    }

    if (req.method === "POST" && path === "/v1/auth/login") {
      const body = await readBody(req);
      return json(res, 200, loginUser(body));
    }

    if (req.method === "POST" && path === "/v1/auth/logout") {
      const token = parseBearer(req) || (await readBody(req)).token || "";
      return json(res, 200, logoutUser(token));
    }

    if (req.method === "GET" && path === "/v1/auth/me") {
      const user = userFromToken(parseBearer(req));
      if (!user) return json(res, 401, { error: "未登录或登录已过期" });
      return json(res, 200, { user });
    }

    if (req.method === "PUT" && path === "/v1/auth/profile") {
      const token = parseBearer(req);
      if (!token) return json(res, 401, { error: "未登录" });
      const body = await readBody(req);
      return json(res, 200, { user: updateUserProfile(token, body) });
    }

    if (req.method === "GET" && path === "/v1/match/lobby") {
      return json(res, 200, lobbySnapshot());
    }

    if (req.method === "GET" && path === "/v1/match/leaderboard") {
      return json(res, 200, { entries: getLeaderboard(30) });
    }

    if (req.method === "POST" && path === "/v1/match/queue") {
      const body = await readBody(req);
      const ticket = enqueue(body, completeAi);
      return json(res, 200, ticket);
    }

    if (req.method === "GET" && path.startsWith("/v1/match/ticket/")) {
      const ticketId = decodeURIComponent(path.slice("/v1/match/ticket/".length));
      const view = ticketStatus(ticketId);
      if (!view) return json(res, 404, { error: "ticket not found" });
      return json(res, 200, view);
    }

    if (req.method === "DELETE" && path.startsWith("/v1/match/ticket/")) {
      const ticketId = decodeURIComponent(path.slice("/v1/match/ticket/".length));
      return json(res, 200, cancelTicket(ticketId));
    }

    if (req.method === "POST" && path === "/v1/ai/complete") {
      const body = await readBody(req);
      const task = body.task || "battle";
      const prompt = body.prompt || "";
      const text = await completeAi(task, prompt);
      const mock = FORCE_MOCK || !process.env.CURSOR_API_KEY || text.includes("mock");
      return json(res, 200, {
        text,
        source: mock ? "mock" : "cursor",
        mock,
        model: MODEL,
      });
    }

    return json(res, 404, { error: "not found" });
  } catch (err) {
    return json(res, 400, { error: String(err?.message || err) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[aikp] http://127.0.0.1:${PORT}`);
  console.log(`[aikp] model=${MODEL} key=${process.env.CURSOR_API_KEY ? "yes" : "no"}`);
  console.log(`[aikp] matchmaking ready: POST /v1/match/queue`);
  console.log(`[aikp] auth ready: POST /v1/auth/register | /v1/auth/login`);
});
