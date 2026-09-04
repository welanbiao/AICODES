/**
 * 用户自创世界 / 卡牌云端存档（按 userId）
 * 文件：ai-bridge/data/content.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { userFromToken } from "./auth.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");

function emptyStore() {
  return { byUser: {} };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(CONTENT_FILE, "utf8");
    const data = JSON.parse(raw || "{}");
    return {
      byUser: data.byUser && typeof data.byUser === "object" ? data.byUser : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  ensureStore();
  const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, CONTENT_FILE);
}

function requireUser(token) {
  const user = userFromToken(token);
  if (!user) throw new Error("未登录或登录已过期");
  return user;
}

function normalizeWorld(w) {
  if (!w || typeof w !== "object") return null;
  const id = String(w.id || "").trim();
  if (!id) return null;
  return {
    id,
    title: String(w.title || "小世界").slice(0, 12),
    genre: String(w.genre || "CUSTOM"),
    sourceHint: String(w.sourceHint || "").slice(0, 16),
    lore: String(w.lore || "").slice(0, 80),
    reviewedLore: String(w.reviewedLore || w.lore || "").slice(0, 80),
    fullLore: String(w.fullLore || w.lore || "").slice(0, 400),
    canonHint: String(w.canonHint || "").slice(0, 40),
    coverKey: String(w.coverKey || "novel"),
    isOfficial: Boolean(w.isOfficial),
    creatorId: w.creatorId ? String(w.creatorId) : null,
    createdAt: Number(w.createdAt) || Date.now(),
  };
}

function normalizeCard(c) {
  if (!c || typeof c !== "object") return null;
  const id = String(c.id || "").trim();
  if (!id) return null;
  const skills = Array.isArray(c.skills)
    ? c.skills.slice(0, 3).map((s) => ({
        name: String(s?.name || "").slice(0, 8),
        description: String(s?.description || "").slice(0, 20),
      }))
    : [];
  const reviewedSkills = Array.isArray(c.reviewedSkills)
    ? c.reviewedSkills.slice(0, 3).map((s) => ({
        name: String(s?.name || "").slice(0, 8),
        description: String(s?.description || "").slice(0, 20),
      }))
    : skills;
  return {
    id,
    name: String(c.name || "无名").slice(0, 12),
    lore: String(c.lore || "").slice(0, 60),
    skills,
    worldId: String(c.worldId || ""),
    worldTitle: String(c.worldTitle || "").slice(0, 12),
    imageUri: c.imageUri ? String(c.imageUri).slice(0, 500) : null,
    createGrade: String(c.createGrade || "N"),
    battleGrade: String(c.battleGrade || "N"),
    gloryGrade: String(c.gloryGrade || "N"),
    wins: Math.max(0, Number(c.wins) || 0),
    losses: Math.max(0, Number(c.losses) || 0),
    createdAt: Number(c.createdAt) || Date.now(),
    reviewedLore: String(c.reviewedLore || c.lore || "").slice(0, 60),
    reviewedSkills,
  };
}

function userBucket(store, userId) {
  if (!store.byUser[userId]) {
    store.byUser[userId] = { worlds: [], cards: [], updatedAt: Date.now() };
  }
  return store.byUser[userId];
}

export function getUserContent(token) {
  const user = requireUser(token);
  const store = readStore();
  const bucket = userBucket(store, user.id);
  return {
    worlds: Array.isArray(bucket.worlds) ? bucket.worlds : [],
    cards: Array.isArray(bucket.cards) ? bucket.cards : [],
    updatedAt: bucket.updatedAt || 0,
  };
}

/** 全量覆盖（客户端推送本地合并后的列表） */
export function putUserContent(token, body = {}) {
  const user = requireUser(token);
  const store = readStore();
  const worlds = Array.isArray(body.worlds)
    ? body.worlds.map(normalizeWorld).filter(Boolean).filter((w) => !w.isOfficial)
    : [];
  const cards = Array.isArray(body.cards) ? body.cards.map(normalizeCard).filter(Boolean) : [];
  store.byUser[user.id] = {
    worlds,
    cards,
    updatedAt: Date.now(),
  };
  writeStore(store);
  return getUserContent(token);
}

/** 单条 upsert 世界 */
export function upsertUserWorld(token, world) {
  const user = requireUser(token);
  const store = readStore();
  const bucket = userBucket(store, user.id);
  const item = normalizeWorld(world);
  if (!item || item.isOfficial) throw new Error("无效世界");
  const idx = bucket.worlds.findIndex((w) => w.id === item.id);
  if (idx >= 0) bucket.worlds[idx] = item;
  else bucket.worlds.push(item);
  bucket.updatedAt = Date.now();
  writeStore(store);
  return { world: item };
}

/** 单条 upsert 卡牌 */
export function upsertUserCard(token, card) {
  const user = requireUser(token);
  const store = readStore();
  const bucket = userBucket(store, user.id);
  const item = normalizeCard(card);
  if (!item) throw new Error("无效卡牌");
  const idx = bucket.cards.findIndex((c) => c.id === item.id);
  if (idx >= 0) bucket.cards[idx] = item;
  else bucket.cards.push(item);
  bucket.updatedAt = Date.now();
  writeStore(store);
  return { card: item };
}
