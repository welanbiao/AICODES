window.ZC_API = (function () {
  const BASE = "https://api.deepseek.com";
  const ALLOWED_MODELS = ["deepseek-v4-flash", "deepseek-v4-pro"];
  const KEY_STORE = "zongcai-deepseek-key";
  const MODEL_STORE = "zongcai-deepseek-model";

  function normalizeKey(raw) {
    return String(raw || "").trim();
  }

  function assertDeepSeek(key, model) {
    const k = normalizeKey(key);
    if (!k) throw new Error("请填写 DeepSeek API Key");
    if (!/^sk-/.test(k)) throw new Error("只接受 DeepSeek 官方 Key（sk- 开头）");
    if (/openai|anthropic|moonshot|qwen|siliconflow|volces|dashscope/i.test(k)) {
      throw new Error("密钥不是 DeepSeek 官方格式");
    }
    const m = ALLOWED_MODELS.includes(model) ? model : "deepseek-v4-flash";
    return { key: k, model: m, base: BASE };
  }

  function parseError(status, text) {
    const lower = String(text || "").toLowerCase();
    if (status === 401 || /invalid.*api key|unauthorized|incorrect api key/.test(lower)) {
      return "密钥无效，请核对 DeepSeek 官方 Key";
    }
    if (status === 402 || /insufficient|balance|quota/.test(lower)) return "DeepSeek 余额不足";
    if (status === 403) return "没有该模型权限";
    if (status === 429) return "请求太频繁，请稍后再试";
    if (status >= 500) return "DeepSeek 服务异常（" + status + "）";
    return "测试失败（" + status + "）";
  }

  async function test(key, model) {
    const cred = assertDeepSeek(key, model);
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 18000);
    try {
      const resp = await fetch(cred.base + "/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + cred.key
        },
        body: JSON.stringify({
          model: cred.model,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          stream: false
        }),
        signal: controller.signal
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(parseError(resp.status, errText));
      }
      save(cred.key, cred.model);
      return cred;
    } catch (err) {
      if (err && err.name === "AbortError") throw new Error("连接超时，请检查网络");
      if (String(err && err.message || "").toLowerCase().includes("failed to fetch")) {
        throw new Error("无法连上 DeepSeek，请确认网络与官方地址");
      }
      throw err;
    } finally {
      clearTimeout(t);
    }
  }

  function save(key, model) {
    try {
      sessionStorage.setItem(KEY_STORE, key);
      sessionStorage.setItem(MODEL_STORE, model);
    } catch (_) {}
  }

  function load() {
    try {
      return {
        key: sessionStorage.getItem(KEY_STORE) || "",
        model: sessionStorage.getItem(MODEL_STORE) || "deepseek-v4-flash"
      };
    } catch (_) {
      return { key: "", model: "deepseek-v4-flash" };
    }
  }

  function isReady() {
    const d = load();
    try {
      assertDeepSeek(d.key, d.model);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function complete(messages, opts) {
    const saved = load();
    const cred = assertDeepSeek(saved.key, saved.model);
    const controller = new AbortController();
    const ms = (opts && opts.timeout) || 12000;
    const t = setTimeout(() => controller.abort(), ms);
    try {
      const resp = await fetch(cred.base + "/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + cred.key
        },
        body: JSON.stringify({
          model: cred.model,
          messages,
          max_tokens: (opts && opts.max_tokens) || 220,
          temperature: (opts && opts.temperature) != null ? opts.temperature : 0.2,
          stream: false
        }),
        signal: controller.signal
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(parseError(resp.status, errText));
      }
      const data = await resp.json();
      return (((data || {}).choices || [])[0] || {}).message || {};
    } catch (err) {
      if (err && err.name === "AbortError") throw new Error("判定超时");
      throw err;
    } finally {
      clearTimeout(t);
    }
  }

  return { BASE, ALLOWED_MODELS, test, load, save, isReady, assertDeepSeek, complete };
})();
