/**
 * 用户注册/登录：数据写入服务器本地 JSON 文件。
 * 文件：ai-bridge/data/users.json
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fff]{3,16}$/;
const SESSION_DAYS = 30;

function emptyStore() {
  return { users: [], sessions: {} };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(emptyStore(), null, 2), "utf8");
  }
}

function readStore() {
  ensureStore();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const data = JSON.parse(raw || "{}");
    return {
      users: Array.isArray(data.users) ? data.users : [],
      sessions: data.sessions && typeof data.sessions === "object" ? data.sessions : {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  ensureStore();
  const tmp = `${USERS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, USERS_FILE);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const got = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(got, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    rankPoints: user.rankPoints || 0,
    gloryScore: user.gloryScore || 0,
    winStreak: user.winStreak || 0,
    wins: user.wins || 0,
    losses: user.losses || 0,
    createdAt: user.createdAt,
  };
}

function issueToken(store, userId) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  store.sessions[token] = { userId, expiresAt };
  return { token, expiresAt };
}

function purgeExpired(store) {
  const now = Date.now();
  for (const [token, sess] of Object.entries(store.sessions)) {
    if (!sess || sess.expiresAt < now) delete store.sessions[token];
  }
}

function findUserByUsername(store, username) {
  const key = String(username || "").trim().toLowerCase();
  return store.users.find((u) => u.username.toLowerCase() === key);
}

function findUserById(store, id) {
  return store.users.find((u) => u.id === id);
}

export function registerUser({ username, password, nickname }) {
  const name = String(username || "").trim();
  const pass = String(password || "");
  const nick = String(nickname || name).trim().slice(0, 12) || name.slice(0, 12);

  if (!USERNAME_RE.test(name)) {
    throw new Error("账号需 3~16 位（字母/数字/下划线/中文）");
  }
  if (pass.length < 6 || pass.length > 64) {
    throw new Error("密码需 6~64 位");
  }

  const store = readStore();
  purgeExpired(store);
  if (findUserByUsername(store, name)) {
    throw new Error("账号已存在");
  }

  const { salt, hash } = hashPassword(pass);
  const now = Date.now();
  const user = {
    id: `u_${crypto.randomBytes(8).toString("hex")}`,
    username: name,
    passwordSalt: salt,
    passwordHash: hash,
    nickname: nick,
    rankPoints: 0,
    gloryScore: 0,
    winStreak: 0,
    wins: 0,
    losses: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.users.push(user);
  const session = issueToken(store, user.id);
  writeStore(store);
  return { token: session.token, expiresAt: session.expiresAt, user: publicUser(user) };
}

export function loginUser({ username, password }) {
  const name = String(username || "").trim();
  const pass = String(password || "");
  if (!name || !pass) throw new Error("请输入账号和密码");

  const store = readStore();
  purgeExpired(store);
  const user = findUserByUsername(store, name);
  if (!user || !verifyPassword(pass, user.passwordSalt, user.passwordHash)) {
    throw new Error("账号或密码错误");
  }
  const session = issueToken(store, user.id);
  user.updatedAt = Date.now();
  writeStore(store);
  return { token: session.token, expiresAt: session.expiresAt, user: publicUser(user) };
}

export function logoutUser(token) {
  if (!token) return { ok: true };
  const store = readStore();
  delete store.sessions[token];
  writeStore(store);
  return { ok: true };
}

export function userFromToken(token) {
  if (!token) return null;
  const store = readStore();
  purgeExpired(store);
  const sess = store.sessions[token];
  if (!sess || sess.expiresAt < Date.now()) {
    if (sess) {
      delete store.sessions[token];
      writeStore(store);
    }
    return null;
  }
  const user = findUserById(store, sess.userId);
  return user ? publicUser(user) : null;
}

export function updateUserProfile(token, patch = {}) {
  const store = readStore();
  purgeExpired(store);
  const sess = store.sessions[token];
  if (!sess || sess.expiresAt < Date.now()) throw new Error("未登录或登录已过期");
  const user = findUserById(store, sess.userId);
  if (!user) throw new Error("用户不存在");

  if (patch.nickname != null) {
    const nick = String(patch.nickname).trim().slice(0, 12);
    if (nick) user.nickname = nick;
  }
  if (typeof patch.rankPoints === "number") user.rankPoints = Math.max(0, Math.floor(patch.rankPoints));
  if (typeof patch.gloryScore === "number") user.gloryScore = Math.max(0, Math.floor(patch.gloryScore));
  if (typeof patch.winStreak === "number") user.winStreak = Math.max(0, Math.floor(patch.winStreak));
  if (typeof patch.wins === "number") user.wins = Math.max(0, Math.floor(patch.wins));
  if (typeof patch.losses === "number") user.losses = Math.max(0, Math.floor(patch.losses));
  user.updatedAt = Date.now();
  writeStore(store);
  return publicUser(user);
}

export function parseBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if (m) return m[1].trim();
  return "";
}

export function authStats() {
  const store = readStore();
  purgeExpired(store);
  return { users: store.users.length, sessions: Object.keys(store.sessions).length };
}
