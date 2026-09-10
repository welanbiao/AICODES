/**
 * 用户自定义 GLB 模型（关联账号）
 * 元数据：server/data/user-models.json
 * 文件：server/data/models/{userId}/{modelId}.glb
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseBearer, userFromToken } from "./auth.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const META_FILE = path.join(DATA_DIR, "user-models.json");
const MODELS_DIR = path.join(DATA_DIR, "models");
const MAX_BYTES = 40 * 1024 * 1024;
const MAX_PER_USER = 16;

function emptyMeta() {
  return { models: [] };
}

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
  if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify(emptyMeta(), null, 2), "utf8");
}

function readMeta() {
  ensure();
  try {
    const data = JSON.parse(fs.readFileSync(META_FILE, "utf8") || "{}");
    return { models: Array.isArray(data.models) ? data.models : [] };
  } catch {
    return emptyMeta();
  }
}

function writeMeta(store) {
  ensure();
  const tmp = `${META_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
  fs.renameSync(tmp, META_FILE);
}

function requireUser(token) {
  const user = userFromToken(token);
  if (!user) throw new Error("未登录或登录已过期");
  return user;
}

function publicModel(m) {
  return {
    id: m.id,
    name: m.name,
    filename: m.filename,
    size: m.size,
    createdAt: m.createdAt,
    url: `/v1/me/models/${encodeURIComponent(m.id)}/file`,
  };
}

export function listMyModels(token) {
  const user = requireUser(token);
  const store = readMeta();
  return {
    models: store.models
      .filter((m) => m.userId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(publicModel),
  };
}

export function uploadMyModel(token, { name, filename, dataBase64 }) {
  const user = requireUser(token);
  const store = readMeta();
  const mine = store.models.filter((m) => m.userId === user.id);
  if (mine.length >= MAX_PER_USER) throw new Error(`最多上传 ${MAX_PER_USER} 个模型`);

  const rawName = String(name || filename || "自定义模型").trim().slice(0, 32) || "自定义模型";
  const fileLabel = String(filename || "model.glb").trim().slice(0, 80) || "model.glb";
  if (!/\.glb$/i.test(fileLabel)) throw new Error("仅支持 .glb 文件");

  const b64 = String(dataBase64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!b64) throw new Error("模型数据为空");
  let buf;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    throw new Error("模型数据无效");
  }
  if (!buf.length) throw new Error("模型数据为空");
  if (buf.length > MAX_BYTES) throw new Error("模型过大（上限 40MB）");

  const id = `m_${crypto.randomBytes(8).toString("hex")}`;
  const userDir = path.join(MODELS_DIR, user.id);
  fs.mkdirSync(userDir, { recursive: true });
  const filePath = path.join(userDir, `${id}.glb`);
  fs.writeFileSync(filePath, buf);

  const record = {
    id,
    userId: user.id,
    name: rawName,
    filename: fileLabel,
    size: buf.length,
    createdAt: Date.now(),
  };
  store.models.push(record);
  writeMeta(store);
  return { model: publicModel(record) };
}

export function deleteMyModel(token, modelId) {
  const user = requireUser(token);
  const store = readMeta();
  const idx = store.models.findIndex((m) => m.id === modelId && m.userId === user.id);
  if (idx < 0) throw new Error("模型不存在");
  const [removed] = store.models.splice(idx, 1);
  writeMeta(store);
  const filePath = path.join(MODELS_DIR, user.id, `${removed.id}.glb`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { ok: true };
}

export function readMyModelFile(token, modelId) {
  const user = requireUser(token);
  const store = readMeta();
  const m = store.models.find((x) => x.id === modelId && x.userId === user.id);
  if (!m) throw new Error("模型不存在");
  const filePath = path.join(MODELS_DIR, user.id, `${m.id}.glb`);
  if (!fs.existsSync(filePath)) throw new Error("模型文件丢失");
  return { buffer: fs.readFileSync(filePath), filename: m.filename, name: m.name };
}

export { parseBearer };
