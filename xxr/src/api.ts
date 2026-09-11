const API_BASE = import.meta.env.VITE_API_BASE || "";
const AUTH_KEY = "xxr_auth";

export type AuthUser = {
  id: string;
  username: string;
  nickname: string;
  role?: string;
  isAdmin?: boolean;
  createdAt?: number;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type UserModel = {
  id: string;
  name: string;
  filename: string;
  size: number;
  createdAt: number;
  url: string;
};

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as AuthSession;
    if (!data?.token || !data?.user?.id) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession | null) {
  if (!session) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

async function readJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function loginAccount(username: string, password: string) {
  const res = await fetch(`${API_BASE}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await readJson<{ token?: string; user?: AuthUser }>(res);
  if (!data.token || !data.user) throw new Error("响应无效");
  const session = { token: data.token, user: data.user };
  saveAuthSession(session);
  return session;
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJson<{ user?: AuthUser }>(res);
  if (!data.user) throw new Error("响应无效");
  return data.user;
}

export async function logoutAccount(token: string) {
  try {
    await fetch(`${API_BASE}/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: "{}",
    });
  } catch {
    /* ignore */
  }
  saveAuthSession(null);
}

export async function adminListUsers(token: string): Promise<AuthUser[]> {
  const res = await fetch(`${API_BASE}/v1/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJson<{ users?: AuthUser[] }>(res);
  return data.users || [];
}

export async function adminCreateUser(token: string, username: string, password: string, nickname: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ username, password, nickname }),
  });
  const data = await readJson<{ user?: AuthUser }>(res);
  if (!data.user) throw new Error("响应无效");
  return data.user;
}

export async function adminResetPassword(token: string, userId: string, password: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  });
  const data = await readJson<{ user?: AuthUser }>(res);
  if (!data.user) throw new Error("响应无效");
  return data.user;
}

export async function adminDeleteUser(token: string, userId: string) {
  const res = await fetch(`${API_BASE}/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await readJson<{ error?: string }>(res);
}

export async function listMyModels(token: string): Promise<UserModel[]> {
  const res = await fetch(`${API_BASE}/v1/me/models`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJson<{ models?: UserModel[] }>(res);
  return data.models || [];
}

export async function uploadMyModel(
  token: string,
  payload: { name: string; filename: string; dataBase64: string },
): Promise<UserModel> {
  const res = await fetch(`${API_BASE}/v1/me/models`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await readJson<{ model?: UserModel }>(res);
  if (!data.model) throw new Error("响应无效");
  return data.model;
}

export async function deleteMyModel(token: string, modelId: string) {
  const res = await fetch(`${API_BASE}/v1/me/models/${encodeURIComponent(modelId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  await readJson<{ error?: string }>(res);
}

export async function fetchMyModelBuffer(
  token: string,
  modelId: string,
  onProgress?: (ratio: number) => void,
): Promise<ArrayBuffer> {
  const res = await fetch(`${API_BASE}/v1/me/models/${encodeURIComponent(modelId)}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body || !onProgress) return res.arrayBuffer();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      if (total > 0) onProgress(Math.min(1, received / total));
      else onProgress(0);
    }
  }
  if (total <= 0) onProgress(1);
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out.buffer;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const i = result.indexOf(",");
      resolve(i >= 0 ? result.slice(i + 1) : result);
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsDataURL(file);
  });
}
