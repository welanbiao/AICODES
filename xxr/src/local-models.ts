/** 管理员本地模型库（IndexedDB），不经服务器。 */

const DB_NAME = "xxr_local_models";
const DB_VERSION = 1;
const STORE = "models";
const MAX_BYTES = 40 * 1024 * 1024;
const MAX_COUNT = 16;

export type LocalModelMeta = {
  id: string;
  name: string;
  filename: string;
  size: number;
  createdAt: number;
};

type LocalModelRecord = LocalModelMeta & {
  data: ArrayBuffer;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("打开本地模型库失败"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("本地模型库写入失败"));
    tx.onabort = () => reject(tx.error || new Error("本地模型库写入中断"));
  });
}

function b64ToArrayBuffer(dataBase64: string): ArrayBuffer {
  const b64 = String(dataBase64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!b64) throw new Error("模型数据为空");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function randomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `m_local_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function localListModels(): Promise<LocalModelMeta[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as LocalModelRecord[]) || [];
      resolve(
        rows
          .map(({ id, name, filename, size, createdAt }) => ({ id, name, filename, size, createdAt }))
          .sort((a, b) => b.createdAt - a.createdAt),
      );
    };
    req.onerror = () => reject(req.error || new Error("读取本地模型失败"));
  });
}

export async function localUploadModel(payload: {
  name: string;
  filename: string;
  dataBase64: string;
}): Promise<LocalModelMeta> {
  const list = await localListModels();
  if (list.length >= MAX_COUNT) throw new Error(`最多保存 ${MAX_COUNT} 个模型`);

  const name = String(payload.name || payload.filename || "自定义模型").trim().slice(0, 32) || "自定义模型";
  const filename = String(payload.filename || "model.glb").trim().slice(0, 80) || "model.glb";
  if (!/\.glb$/i.test(filename)) throw new Error("仅支持 .glb 文件");

  const data = b64ToArrayBuffer(payload.dataBase64);
  if (!data.byteLength) throw new Error("模型数据为空");
  if (data.byteLength > MAX_BYTES) throw new Error("模型过大（上限 40MB）");

  const record: LocalModelRecord = {
    id: randomId(),
    name,
    filename,
    size: data.byteLength,
    createdAt: Date.now(),
    data,
  };

  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(record);
  await txDone(tx);
  return {
    id: record.id,
    name: record.name,
    filename: record.filename,
    size: record.size,
    createdAt: record.createdAt,
  };
}

export async function localDeleteModel(modelId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(modelId);
  await txDone(tx);
}

export async function localFetchModelBuffer(
  modelId: string,
  onProgress?: (ratio: number) => void,
): Promise<ArrayBuffer> {
  const db = await openDb();
  const record = await new Promise<LocalModelRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(modelId);
    req.onsuccess = () => resolve(req.result as LocalModelRecord | undefined);
    req.onerror = () => reject(req.error || new Error("读取本地模型失败"));
  });
  if (!record?.data) throw new Error("模型不存在");
  onProgress?.(1);
  return record.data.slice(0);
}
