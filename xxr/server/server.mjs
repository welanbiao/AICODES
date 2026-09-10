/**
 * 小小人 · 账号与自定义模型服务
 * 默认 http://127.0.0.1:8789
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminResetPassword,
  authStats,
  bootstrapAuth,
  loginUser,
  logoutUser,
  parseBearer,
  updateUserProfile,
  userFromToken,
} from "./auth.mjs";
import { deleteMyModel, listMyModels, readMyModelFile, uploadMyModel } from "./models.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "..", "dist");
const PORT = Number(process.env.PORT || 8789);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".glb": "model/gltf-binary",
  ".woff2": "font/woff2",
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
}

function json(res, code, body) {
  const data = JSON.stringify(body);
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(data);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 55 * 1024 * 1024) throw new Error("请求体过大");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    throw new Error("invalid json");
  }
}

function pathOf(url) {
  return decodeURIComponent((url || "/").split("?")[0]);
}

function tryStatic(req, res, urlPath) {
  if (!fs.existsSync(DIST)) return false;
  let rel = urlPath === "/" ? "/index.html" : urlPath;
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) return false;
  let target = file;
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    target = path.join(DIST, "index.html");
    if (!fs.existsSync(target)) return false;
  }
  const ext = path.extname(target).toLowerCase();
  cors(res);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  fs.createReadStream(target).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  const urlPath = pathOf(req.url);
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});

    if (req.method === "GET" && urlPath === "/health") {
      return json(res, 200, { ok: true, auth: authStats() });
    }

    if (req.method === "POST" && urlPath === "/v1/auth/register") {
      return json(res, 403, { error: "已关闭公开注册，请联系管理员开通账号" });
    }

    if (req.method === "POST" && urlPath === "/v1/auth/login") {
      const body = await readBody(req);
      return json(res, 200, loginUser(body));
    }

    if (req.method === "POST" && urlPath === "/v1/auth/logout") {
      const token = parseBearer(req) || (await readBody(req)).token || "";
      return json(res, 200, logoutUser(token));
    }

    if (req.method === "GET" && urlPath === "/v1/auth/me") {
      const user = userFromToken(parseBearer(req));
      if (!user) return json(res, 401, { error: "未登录或登录已过期" });
      return json(res, 200, { user });
    }

    if (req.method === "PUT" && urlPath === "/v1/auth/profile") {
      const token = parseBearer(req);
      if (!token) return json(res, 401, { error: "未登录" });
      const body = await readBody(req);
      return json(res, 200, { user: updateUserProfile(token, body) });
    }

    if (req.method === "GET" && urlPath === "/v1/admin/users") {
      return json(res, 200, adminListUsers(parseBearer(req)));
    }

    if (req.method === "POST" && urlPath === "/v1/admin/users") {
      const body = await readBody(req);
      return json(res, 200, adminCreateUser(parseBearer(req), body));
    }

    if (req.method === "PUT" && urlPath.startsWith("/v1/admin/users/") && urlPath.endsWith("/password")) {
      const userId = decodeURIComponent(urlPath.slice("/v1/admin/users/".length, -"/password".length));
      const body = await readBody(req);
      return json(res, 200, adminResetPassword(parseBearer(req), userId, body.password));
    }

    if (req.method === "DELETE" && urlPath.startsWith("/v1/admin/users/")) {
      const userId = decodeURIComponent(urlPath.slice("/v1/admin/users/".length));
      return json(res, 200, adminDeleteUser(parseBearer(req), userId));
    }

    if (req.method === "GET" && urlPath === "/v1/me/models") {
      return json(res, 200, listMyModels(parseBearer(req)));
    }

    if (req.method === "POST" && urlPath === "/v1/me/models") {
      const body = await readBody(req);
      return json(res, 200, uploadMyModel(parseBearer(req), body));
    }

    if (req.method === "DELETE" && urlPath.startsWith("/v1/me/models/") && !urlPath.endsWith("/file")) {
      const modelId = decodeURIComponent(urlPath.slice("/v1/me/models/".length));
      return json(res, 200, deleteMyModel(parseBearer(req), modelId));
    }

    if (req.method === "GET" && urlPath.startsWith("/v1/me/models/") && urlPath.endsWith("/file")) {
      const modelId = decodeURIComponent(urlPath.slice("/v1/me/models/".length, -"/file".length));
      const { buffer, filename } = readMyModelFile(parseBearer(req), modelId);
      cors(res);
      res.writeHead(200, {
        "Content-Type": "model/gltf-binary",
        "Content-Length": buffer.length,
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=60",
      });
      res.end(buffer);
      return;
    }

    if (req.method === "GET" && tryStatic(req, res, urlPath)) return;

    return json(res, 404, { error: "not found" });
  } catch (err) {
    return json(res, 400, { error: String(err?.message || err) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  const boot = bootstrapAuth();
  console.log(`[xxr] http://127.0.0.1:${PORT}`);
  console.log(`[xxr] auth: POST /v1/auth/login （公开注册已关闭）`);
  console.log(`[xxr] admin seed: ${boot.admin} / kjx.123 · users=${boot.users}`);
});
