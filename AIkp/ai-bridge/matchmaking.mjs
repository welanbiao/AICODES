/**
 * In-memory matchmaking for real-player ranked battles.
 * Pairing prefers opposite roles and closer rankPoints.
 */
import { randomUUID } from "node:crypto";
import {
  buildBattlePrompt,
  mockBattleResult,
  normalizeBattleResult,
  stripForbidden,
  worldBattlefieldLine,
} from "./battleEngine.mjs";

const QUEUE_TTL_MS = 90_000;
const MATCH_TTL_MS = 30 * 60_000;
const RANK_BAND = 250;

/** @type {Map<string, any>} */
const tickets = new Map();
/** @type {Map<string, any>} */
const matches = new Map();
/** mode -> ticketId[] */
const queues = {
  ONE_V_ONE: [],
  THREE_V_THREE: [],
};
/** simple leaderboard playerId -> stats */
const ladder = new Map();

export function lobbySnapshot() {
  return {
    queue: {
      ONE_V_ONE: queues.ONE_V_ONE.length,
      THREE_V_THREE: queues.THREE_V_THREE.length,
    },
    activeMatches: [...matches.values()].filter((m) => m.status !== "expired").length,
    ladderSize: ladder.size,
  };
}

export function getLeaderboard(limit = 20) {
  return [...ladder.values()]
    .sort((a, b) => b.rankPoints - a.rankPoints || b.wins - a.wins)
    .slice(0, limit);
}

function sanitizePayload(body) {
  const mode = body.mode === "THREE_V_THREE" ? "THREE_V_THREE" : "ONE_V_ONE";
  const teamSize = mode === "THREE_V_THREE" ? 3 : 1;
  const preferredRole = ["DEFENDER", "CHALLENGER", "ANY"].includes(body.preferredRole)
    ? body.preferredRole
    : "ANY";
  const cards = Array.isArray(body.cards) ? body.cards.slice(0, teamSize) : [];
  if (cards.length !== teamSize) {
    throw new Error(`卡组数量需为 ${teamSize}`);
  }
  const world = body.world || {};
  const field = body.battlefield || {};
  const worldLore = stripForbidden(
    world.reviewedLore || world.lore || field.reviewedDescription || field.description || ""
  ).cleaned;
  if (!worldLore) throw new Error("小世界背景无效");
  const worldId = String(world.id || field.id || "").trim() || randomUUID();
  const worldTitle = String(world.title || field.title || "小世界").slice(0, 12);
  const worldPayload = {
    id: worldId,
    title: worldTitle,
    lore: String(world.lore || worldLore).slice(0, 80),
    reviewedLore: worldLore.slice(0, 80),
    canonHint: String(world.canonHint || "").slice(0, 40),
    genre: String(world.genre || "CUSTOM"),
    sourceHint: String(world.sourceHint || "").slice(0, 16),
  };
  return {
    playerId: String(body.playerId || "").trim() || randomUUID(),
    nickname: String(body.nickname || "旅人").slice(0, 16),
    rankPoints: Math.max(0, Number(body.rankPoints) || 0),
    mode,
    preferredRole,
    worldId,
    world: worldPayload,
    cards: cards.map((c) => ({
      id: String(c.id || randomUUID()),
      name: String(c.name || "无名").slice(0, 12),
      lore: String(c.lore || ""),
      skills: Array.isArray(c.skills) ? c.skills : [],
      reviewedLore: String(c.reviewedLore || c.lore || "").slice(0, 80),
      reviewedSkills: Array.isArray(c.reviewedSkills || c.skills)
        ? (c.reviewedSkills || c.skills).slice(0, 3).map((s) => ({
            name: String(s.name || "").slice(0, 8),
            description: String(s.description || "").slice(0, 20),
          }))
        : [],
      imageUri: c.imageUri ? String(c.imageUri) : null,
      createGrade: c.createGrade || "N",
      battleGrade: c.battleGrade || "N",
      gloryGrade: c.gloryGrade || "N",
      worldId: String(c.worldId || worldId),
      worldTitle: String(c.worldTitle || worldTitle),
    })),
    battlefield: {
      id: worldId,
      title: worldTitle,
      description: worldLore.slice(0, 80),
      reviewedDescription: worldLore.slice(0, 80),
    },
  };
}

function removeFromQueue(ticketId) {
  for (const mode of Object.keys(queues)) {
    queues[mode] = queues[mode].filter((id) => id !== ticketId);
  }
}

function cleanup() {
  const now = Date.now();
  for (const [id, t] of tickets) {
    if (t.status === "queued" && now - t.createdAt > QUEUE_TTL_MS) {
      t.status = "timeout";
      removeFromQueue(id);
    }
    if (["cancelled", "timeout", "finished"].includes(t.status) && now - t.createdAt > MATCH_TTL_MS) {
      tickets.delete(id);
    }
  }
  for (const [id, m] of matches) {
    if (now - m.createdAt > MATCH_TTL_MS) matches.delete(id);
  }
}

function rolesCompatible(a, b) {
  if (a === "ANY" || b === "ANY") return true;
  return a !== b;
}

function assignRoles(a, b) {
  // returns [roleA, roleB]
  if (a.preferredRole === "DEFENDER" && b.preferredRole !== "DEFENDER") {
    return ["DEFENDER", "CHALLENGER"];
  }
  if (a.preferredRole === "CHALLENGER" && b.preferredRole !== "CHALLENGER") {
    return ["CHALLENGER", "DEFENDER"];
  }
  if (b.preferredRole === "DEFENDER" && a.preferredRole !== "DEFENDER") {
    return ["CHALLENGER", "DEFENDER"];
  }
  // same preference or both ANY: higher rank defends
  if (a.rankPoints >= b.rankPoints) return ["DEFENDER", "CHALLENGER"];
  return ["CHALLENGER", "DEFENDER"];
}

function findPartner(ticket) {
  const list = queues[ticket.mode] || [];
  let best = null;
  let bestScore = Infinity;
  for (const id of list) {
    if (id === ticket.id) continue;
    const other = tickets.get(id);
    if (!other || other.status !== "queued") continue;
    if (other.playerId === ticket.playerId) continue;
    if (ticket.worldId && other.worldId && ticket.worldId !== other.worldId) continue;
    if (!rolesCompatible(ticket.preferredRole, other.preferredRole)) continue;
    const rankDiff = Math.abs(ticket.rankPoints - other.rankPoints);
    if (rankDiff > RANK_BAND) continue;
    const score = rankDiff;
    if (score < bestScore) {
      best = other;
      bestScore = score;
    }
  }
  // widen band if nobody in band
  if (!best) {
    for (const id of list) {
      if (id === ticket.id) continue;
      const other = tickets.get(id);
      if (!other || other.status !== "queued") continue;
      if (other.playerId === ticket.playerId) continue;
      if (ticket.worldId && other.worldId && ticket.worldId !== other.worldId) continue;
      if (!rolesCompatible(ticket.preferredRole, other.preferredRole)) continue;
      const score = Math.abs(ticket.rankPoints - other.rankPoints);
      if (score < bestScore) {
        best = other;
        bestScore = score;
      }
    }
  }
  return best;
}

async function runMatchBattle(match, completeAi) {
  match.status = "battling";
  const world = match.world || {};
  const lore = stripForbidden(world.reviewedLore || world.lore || match.defender.battlefield?.reviewedDescription || "").cleaned;
  const merged = worldBattlefieldLine(world.title || match.defender.battlefield?.title, lore);
  match.battlefieldMerged = merged;
  match.worldId = world.id || "";
  match.worldTitle = world.title || "";

  const prompt = buildBattlePrompt(
    match.mode,
    merged,
    match.defender.cards,
    match.challenger.cards,
    world
  );

  let result;
  try {
    const text = await completeAi("battle", prompt);
    result = normalizeBattleResult(text, merged);
  } catch {
    result = mockBattleResult(merged);
  }
  match.result = result;
  match.status = "finished";
  match.finishedAt = Date.now();

  for (const side of ["defender", "challenger"]) {
    const p = match[side];
    const won =
      (side === "defender" && result.winnerSide === "DEFENDER") ||
      (side === "challenger" && result.winnerSide === "CHALLENGER");
    const delta = side === "defender" ? result.defenderScoreDelta : result.challengerScoreDelta;
    const prev = ladder.get(p.playerId) || {
      playerId: p.playerId,
      nickname: p.nickname,
      rankPoints: p.rankPoints,
      wins: 0,
      losses: 0,
    };
    prev.nickname = p.nickname;
    prev.rankPoints = Math.max(0, (prev.rankPoints || p.rankPoints) + (Number(delta) || 0));
    if (won) prev.wins += 1;
    else prev.losses += 1;
    ladder.set(p.playerId, prev);
  }

  const defTicket = tickets.get(match.defenderTicketId);
  const atkTicket = tickets.get(match.challengerTicketId);
  if (defTicket) defTicket.status = "finished";
  if (atkTicket) atkTicket.status = "finished";
}

function pairTickets(a, b, completeAi) {
  const [roleA, roleB] = assignRoles(a, b);
  removeFromQueue(a.id);
  removeFromQueue(b.id);

  const defender = roleA === "DEFENDER" ? a : b;
  const challenger = roleA === "DEFENDER" ? b : a;
  const matchId = randomUUID();
  const match = {
    id: matchId,
    mode: a.mode,
    status: "matched",
    createdAt: Date.now(),
    defenderTicketId: defender.id,
    challengerTicketId: challenger.id,
    defender: {
      playerId: defender.playerId,
      nickname: defender.nickname,
      rankPoints: defender.rankPoints,
      cards: defender.cards,
      battlefield: defender.battlefield,
    },
    challenger: {
      playerId: challenger.playerId,
      nickname: challenger.nickname,
      rankPoints: challenger.rankPoints,
      cards: challenger.cards,
      battlefield: challenger.battlefield,
    },
    world: defender.world || challenger.world || {},
    worldId: defender.worldId || challenger.worldId || "",
    worldTitle: defender.world?.title || challenger.world?.title || "",
    battlefieldMerged: "",
    result: null,
  };
  matches.set(matchId, match);

  a.status = "matched";
  b.status = "matched";
  a.matchId = matchId;
  b.matchId = matchId;
  a.assignedRole = roleA;
  b.assignedRole = roleB;
  a.opponent = publicOpponent(roleA === "DEFENDER" ? b : a);
  b.opponent = publicOpponent(roleB === "DEFENDER" ? a : b);

  // fire and forget battle generation
  runMatchBattle(match, completeAi).catch((err) => {
    match.status = "finished";
    match.result = mockBattleResult(String(err));
    match.error = String(err?.message || err);
    const defTicket = tickets.get(match.defenderTicketId);
    const atkTicket = tickets.get(match.challengerTicketId);
    if (defTicket) defTicket.status = "finished";
    if (atkTicket) atkTicket.status = "finished";
  });

  return match;
}

function publicOpponent(ticket) {
  return {
    playerId: ticket.playerId,
    nickname: ticket.nickname,
    rankPoints: ticket.rankPoints,
    preferredRole: ticket.preferredRole,
  };
}

export function enqueue(body, completeAi) {
  cleanup();
  const data = sanitizePayload(body);
  // cancel previous queued tickets for same player
  for (const [id, t] of tickets) {
    if (t.playerId === data.playerId && t.status === "queued") {
      t.status = "cancelled";
      removeFromQueue(id);
    }
  }

  const ticketId = randomUUID();
  const ticket = {
    id: ticketId,
    ...data,
    status: "queued",
    createdAt: Date.now(),
    matchId: null,
    assignedRole: null,
    opponent: null,
  };
  tickets.set(ticketId, ticket);
  queues[data.mode].push(ticketId);

  const partner = findPartner(ticket);
  if (partner) {
    pairTickets(ticket, partner, completeAi);
  }
  return ticketView(ticket);
}

export function cancelTicket(ticketId) {
  const t = tickets.get(ticketId);
  if (!t) return { ok: false, error: "ticket not found" };
  if (t.status === "queued") {
    t.status = "cancelled";
    removeFromQueue(ticketId);
  }
  return { ok: true, ticket: ticketView(t) };
}

export function ticketStatus(ticketId) {
  cleanup();
  const t = tickets.get(ticketId);
  if (!t) return null;
  return ticketView(t);
}

function ticketView(t) {
  const match = t.matchId ? matches.get(t.matchId) : null;
  return {
    ticketId: t.id,
    status: match?.status === "battling" ? "battling" : match?.status === "finished" ? "finished" : t.status,
    mode: t.mode,
    preferredRole: t.preferredRole,
    assignedRole: t.assignedRole,
    opponent: t.opponent,
    matchId: t.matchId,
    queuePosition: t.status === "queued" ? Math.max(1, queues[t.mode].indexOf(t.id) + 1) : null,
    createdAt: t.createdAt,
    match: match ? matchView(match, t.playerId) : null,
  };
}

function matchView(match, viewerId) {
  const mySide =
    match.defender.playerId === viewerId
      ? "DEFENDER"
      : match.challenger.playerId === viewerId
        ? "CHALLENGER"
        : null;
  return {
    id: match.id,
    mode: match.mode,
    status: match.status,
    myRole: mySide,
    defender: {
      playerId: match.defender.playerId,
      nickname: match.defender.nickname,
      rankPoints: match.defender.rankPoints,
      cards: match.defender.cards,
      battlefield: match.defender.battlefield,
    },
    challenger: {
      playerId: match.challenger.playerId,
      nickname: match.challenger.nickname,
      rankPoints: match.challenger.rankPoints,
      cards: match.challenger.cards,
      battlefield: match.challenger.battlefield,
    },
    worldId: match.worldId || match.world?.id || "",
    worldTitle: match.worldTitle || match.world?.title || "",
    battlefieldMerged: match.battlefieldMerged,
    result: match.result,
    finishedAt: match.finishedAt || null,
  };
}
