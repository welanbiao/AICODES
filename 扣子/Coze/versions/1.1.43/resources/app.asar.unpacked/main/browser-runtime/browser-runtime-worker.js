(() => {
"use strict";
var __webpack_modules__ = ({
7884(module, __unused_rspack_exports, __webpack_require__) {

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/playwright-core/src/cozeBrowserEngine.ts
var cozeBrowserEngine_exports = {};
__export(cozeBrowserEngine_exports, {
  COZE_BROWSER_ENGINE_PROTOCOL_VERSION: () => COZE_BROWSER_ENGINE_PROTOCOL_VERSION,
  COZE_PLAYWRIGHT_REVISION: () => COZE_PLAYWRIGHT_REVISION,
  CozeBrowserEngine: () => CozeBrowserEngine,
  CozeCdpTransport: () => CozeCdpTransport
});
module.exports = __toCommonJS(cozeBrowserEngine_exports);
var import_fs = __toESM(__webpack_require__(9896));
var import_path = __toESM(__webpack_require__(6928));

// packages/isomorphic/stringUtils.ts
function escapeRegexForSelector(re) {
  if (re.unicode || re.unicodeSets)
    return String(re);
  return String(re).replace(/(^|[^\\])(\\\\)*(["'`])/g, "$1$2\\$3").replace(/>>/g, "\\>\\>");
}
function escapeForTextSelector(text, exact) {
  if (typeof text !== "string")
    return escapeRegexForSelector(text);
  return `${JSON.stringify(text)}${exact ? "s" : "i"}`;
}
function escapeForAttributeSelector(value, exact) {
  if (typeof value !== "string")
    return escapeRegexForSelector(value);
  return `"${value.replace(/\\/g, "\\\\").replace(/["]/g, '\\"')}"${exact ? "s" : "i"}`;
}
var ansiRegex = new RegExp("([\\u001B\\u009B][[\\]()#?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{0,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))", "g");

// packages/isomorphic/locatorUtils.ts
function getByAttributeTextSelector(attrName, text, options) {
  return `internal:attr=[${attrName}=${escapeForAttributeSelector(text, options?.exact || false)}]`;
}
function encodeTestIdAttributeName(testIdAttributeName) {
  return testIdAttributeName.includes(",") ? JSON.stringify(testIdAttributeName) : testIdAttributeName;
}
function getByTestIdSelector(testIdAttributeName, testId) {
  return `internal:testid=[${encodeTestIdAttributeName(testIdAttributeName)}=${escapeForAttributeSelector(testId, true)}]`;
}
function getByLabelSelector(text, options) {
  return "internal:label=" + escapeForTextSelector(text, !!options?.exact);
}
function getByPlaceholderSelector(text, options) {
  return getByAttributeTextSelector("placeholder", text, options);
}
function getByTextSelector(text, options) {
  return "internal:text=" + escapeForTextSelector(text, !!options?.exact);
}
function getByRoleSelector(role, options = {}) {
  const props = [];
  if (options.checked !== void 0)
    props.push(["checked", String(options.checked)]);
  if (options.disabled !== void 0)
    props.push(["disabled", String(options.disabled)]);
  if (options.selected !== void 0)
    props.push(["selected", String(options.selected)]);
  if (options.expanded !== void 0)
    props.push(["expanded", String(options.expanded)]);
  if (options.includeHidden !== void 0)
    props.push(["include-hidden", String(options.includeHidden)]);
  if (options.level !== void 0)
    props.push(["level", String(options.level)]);
  if (options.name !== void 0)
    props.push(["name", escapeForAttributeSelector(options.name, !!options.exact)]);
  if (options.description !== void 0)
    props.push(["description", escapeForAttributeSelector(options.description, !!options.exact)]);
  if (options.pressed !== void 0)
    props.push(["pressed", String(options.pressed)]);
  return `internal:role=${role}${props.map(([n, v]) => `[${n}=${v}]`).join("")}`;
}

// packages/playwright-core/src/cozeBrowserEngine.ts
var COZE_PLAYWRIGHT_REVISION = "26a9e470a7b3c7822084b09fb7f13902c5f37b51";
var COZE_BROWSER_ENGINE_PROTOCOL_VERSION = "2.1.0";
var kAllowedCdpMethods = /* @__PURE__ */ new Set([
  "Accessibility.enable",
  "Accessibility.disable",
  "Accessibility.getFullAXTree",
  "Accessibility.getPartialAXTree",
  "DOM.enable",
  "DOM.disable",
  "DOM.describeNode",
  "DOM.getContentQuads",
  "DOM.getDocument",
  "DOM.getFrameOwner",
  "DOM.querySelector",
  "DOM.resolveNode",
  "DOM.scrollIntoViewIfNeeded",
  "DOM.setFileInputFiles",
  "Emulation.setFocusEmulationEnabled",
  "Input.dispatchKeyEvent",
  "Input.dispatchMouseEvent",
  "Input.synthesizeScrollGesture",
  "Input.insertText",
  "Log.disable",
  "Log.enable",
  "Network.disable",
  "Network.enable",
  "Network.getResponseBody",
  "Page.addScriptToEvaluateOnNewDocument",
  "Page.captureScreenshot",
  "Page.createIsolatedWorld",
  "Page.disable",
  "Page.enable",
  "Page.getFrameTree",
  "Page.getLayoutMetrics",
  "Page.handleJavaScriptDialog",
  "Page.navigate",
  "Page.removeScriptToEvaluateOnNewDocument",
  "Page.setLifecycleEventsEnabled",
  "Page.stopLoading",
  "Runtime.addBinding",
  "Runtime.callFunctionOn",
  "Runtime.disable",
  "Runtime.enable",
  "Runtime.evaluate",
  "Runtime.getProperties",
  "Runtime.releaseObject",
  "Runtime.releaseObjectGroup",
  "Runtime.runIfWaitingForDebugger"
]);
function cdpError(message, code = -32e3) {
  return Object.assign(new Error(message), { code });
}
var CozeCdpTransport = class {
  constructor(_options) {
    this._options = _options;
    this._closed = false;
    this._lastId = 0;
    this._pending = /* @__PURE__ */ new Map();
    this._eventListeners = /* @__PURE__ */ new Set();
    this._closeListeners = /* @__PURE__ */ new Set();
    this._activeTargets = /* @__PURE__ */ new Map();
    this._onPortMessage = (event) => {
      const envelope = event.data;
      if (this._closed || envelope.capability !== this._options.capability || envelope.tabId !== this._options.tabId)
        return;
      if (envelope.type === "coze-cdp-closed") {
        this._terminate(envelope.reason ?? "Coze Browser CDP channel closed", false);
        return;
      }
      if (envelope.type !== "coze-cdp-response" && envelope.type !== "coze-cdp-event" || !envelope.message)
        return;
      const message = envelope.message;
      if (envelope.type === "coze-cdp-response" && typeof message.id === "number") {
        const error = message.error ? cdpError(message.error.message, message.error.code) : void 0;
        this._finish(message.id, error, message.result);
      } else {
        this._updateActiveTargets(message);
        for (const listener of this._eventListeners)
          listener(message);
      }
      this._dispatch(message);
    };
    _options.port.on("message", this._onPortMessage);
    _options.port.start?.();
  }
  send(message) {
    if (this._closed)
      return;
    if (!kAllowedCdpMethods.has(message.method)) {
      this._dispatch({
        id: message.id,
        error: cdpError(`CDP method is denied by Coze Browser Kernel: ${message.method}`)
      });
      return;
    }
    this._options.port.postMessage({
      type: "coze-cdp-command",
      capability: this._options.capability,
      sessionId: this._options.sessionId,
      tabId: this._options.tabId,
      message
    });
  }
  sendCommand(method, params = {}, sessionId, options = {}) {
    if (this._closed)
      return Promise.reject(new Error("Coze Browser CDP transport is closed"));
    if (!kAllowedCdpMethods.has(method))
      return Promise.reject(cdpError(`CDP method is denied by Coze Browser Kernel: ${method}`));
    if (options.signal?.aborted)
      return Promise.reject(cdpError(String(options.signal.reason ?? "Browser operation cancelled")));
    const id = ++this._lastId;
    return new Promise((resolve, reject) => {
      const timeoutMs = Math.max(1, options.timeoutMs ?? 15e3);
      const timer = setTimeout(() => {
        this._cancel(id, `CDP command timed out: ${method}`);
      }, timeoutMs);
      const pending = { reject, resolve, sessionId, timer, signal: options.signal };
      if (options.signal) {
        pending.abort = () => this._cancel(id, String(options.signal?.reason ?? "Browser operation cancelled"));
        options.signal.addEventListener("abort", pending.abort, { once: true });
      }
      this._pending.set(id, pending);
      if (options.signal?.aborted) {
        pending.abort?.();
        return;
      }
      try {
        this.send({ id, method, params, ...sessionId ? { sessionId } : {} });
      } catch (error) {
        this._finish(id, error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
  onEvent(listener) {
    if (this._closed)
      return () => {
      };
    this._eventListeners.add(listener);
    const replay = [...this._activeTargets.values()];
    let disposed = false;
    queueMicrotask(() => {
      if (disposed || this._closed || !this._eventListeners.has(listener))
        return;
      for (const target of replay) {
        if (this._activeTargets.get(target.sessionId) === target)
          listener(target.message);
      }
    });
    return () => {
      disposed = true;
      this._eventListeners.delete(listener);
    };
  }
  onClose(listener) {
    if (this._closed) {
      queueMicrotask(() => listener(this._closeReason));
      return () => {
      };
    }
    this._closeListeners.add(listener);
    return () => this._closeListeners.delete(listener);
  }
  close() {
    this._terminate("Coze Browser CDP transport closed", true);
  }
  cancelPending(reason = "Browser operation cancelled") {
    for (const id of [...this._pending.keys()])
      this._cancel(id, reason);
  }
  _cancel(id, reason) {
    if (!this._pending.has(id))
      return;
    try {
      this._options.port.postMessage({
        type: "coze-cdp-cancel",
        capability: this._options.capability,
        sessionId: this._options.sessionId,
        tabId: this._options.tabId,
        id,
        reason
      });
    } catch {
    } finally {
      this._finish(id, cdpError(reason));
    }
  }
  _finish(id, error, result) {
    const pending = this._pending.get(id);
    if (!pending)
      return;
    this._pending.delete(id);
    clearTimeout(pending.timer);
    if (pending.signal && pending.abort)
      pending.signal.removeEventListener("abort", pending.abort);
    if (error)
      pending.reject(error);
    else
      pending.resolve(result);
  }
  _dispatch(message) {
    queueMicrotask(() => this.onmessage?.(message));
  }
  _updateActiveTargets(message) {
    if (message.method === "Target.attachedToTarget") {
      const sessionId2 = message.params?.sessionId;
      const targetId2 = message.params?.targetInfo?.targetId;
      const targetType = message.params?.targetInfo?.type;
      if (targetType === "iframe" && typeof sessionId2 === "string" && typeof targetId2 === "string")
        this._activeTargets.set(sessionId2, { message, sessionId: sessionId2, targetId: targetId2 });
      return;
    }
    if (message.method !== "Target.detachedFromTarget")
      return;
    const sessionId = message.params?.sessionId;
    const targetId = message.params?.targetId;
    if (typeof sessionId === "string")
      this._activeTargets.delete(sessionId);
    if (typeof targetId === "string") {
      for (const [key, target] of this._activeTargets) {
        if (target.targetId === targetId)
          this._activeTargets.delete(key);
      }
    }
  }
  _terminate(reason, notifyPeer) {
    if (this._closed)
      return;
    this._closed = true;
    this._closeReason = reason;
    this._options.port.removeListener?.("message", this._onPortMessage);
    this._activeTargets.clear();
    this._eventListeners.clear();
    for (const id of [...this._pending.keys()])
      this._finish(id, cdpError(reason));
    try {
      if (notifyPeer) {
        this._options.port.postMessage({
          type: "coze-cdp-disconnect",
          capability: this._options.capability,
          sessionId: this._options.sessionId,
          tabId: this._options.tabId
        });
      }
    } catch {
    } finally {
      for (const listener of [...this._closeListeners]) {
        try {
          listener(reason);
        } catch {
        }
      }
      this._closeListeners.clear();
      try {
        this.onclose?.(reason);
      } catch {
      }
    }
  }
};
function truncateSnapshot(text, targets, maxChars) {
  const originalLength = text.length;
  if (originalLength <= maxChars)
    return { text, targets, truncated: false, originalLength, maxChars };
  if (!maxChars)
    return { text: "", targets: [], truncated: true, originalLength, maxChars };
  const candidate = text.slice(0, maxChars);
  const lastLineBreak = candidate.lastIndexOf("\n");
  const safeText = lastLineBreak === -1 ? "" : candidate.slice(0, lastLineBreak);
  const visibleRefs = new Set([...safeText.matchAll(/\[ref=([^\]]+)\]/g)].map((match) => match[1]));
  return {
    text: safeText,
    targets: targets.filter((target) => visibleRefs.has(target.ref)),
    truncated: true,
    originalLength,
    maxChars
  };
}
var kKeyDefinitions = {
  Enter: { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
  Tab: { key: "Tab", code: "Tab", keyCode: 9, text: "	" },
  Escape: { key: "Escape", code: "Escape", keyCode: 27 },
  Backspace: { key: "Backspace", code: "Backspace", keyCode: 8 },
  Delete: { key: "Delete", code: "Delete", keyCode: 46 },
  ArrowLeft: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  ArrowUp: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  ArrowRight: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  ArrowDown: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  Home: { key: "Home", code: "Home", keyCode: 36 },
  End: { key: "End", code: "End", keyCode: 35 },
  PageUp: { key: "PageUp", code: "PageUp", keyCode: 33 },
  PageDown: { key: "PageDown", code: "PageDown", keyCode: 34 },
  Space: { key: " ", code: "Space", keyCode: 32, text: " " }
};
function selectorFor(locator) {
  switch (locator.kind) {
    case "role":
      return getByRoleSelector(locator.value, { name: locator.name, exact: locator.exact });
    case "text":
      return getByTextSelector(locator.value, { exact: locator.exact });
    case "label":
      return getByLabelSelector(locator.value, { exact: locator.exact });
    case "placeholder":
      return getByPlaceholderSelector(locator.value, { exact: locator.exact });
    case "test-id":
      return getByTestIdSelector("data-testid", locator.value);
    case "css":
      return locator.value;
  }
}
function injectedOptions(frameSeq) {
  return {
    isUnderTest: false,
    sdkLanguage: "javascript",
    frameSeq,
    testIdAttributeName: "data-testid",
    stableRafCount: 2,
    browserName: "chromium",
    shouldPrependErrorPrefix: true,
    isUtilityWorld: true,
    customEngines: []
  };
}
function javascript(value) {
  const serialized = JSON.stringify(value);
  return serialized === void 0 ? "undefined" : serialized.replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function resultError(result) {
  const details = result.exceptionDetails;
  if (!details)
    return void 0;
  return new Error(details.exception?.description || details.text || "Browser evaluation failed");
}
var CozeBrowserEngine = class _CozeBrowserEngine {
  constructor(options) {
    this._closeController = new AbortController();
    this._worlds = /* @__PURE__ */ new Map();
    this._targetSessions = /* @__PURE__ */ new Map();
    this._sessionInitializers = /* @__PURE__ */ new Map();
    this._lifecycleEvents = /* @__PURE__ */ new Set();
    this._rootFrameId = "";
    this._frameSequence = 0;
    this._closed = false;
    this._transport = options.transport;
    this._defaultTimeoutMs = options.timeoutMs ?? 15e3;
    this._injectedSource = import_fs.default.readFileSync(
      import_path.default.join(__dirname, "coze-browser-injected.js"),
      "utf8"
    );
    this._disposeEvents = this._transport.onEvent((message) => this._onCdpEvent(message));
    this._disposeTransportClose = this._transport.onClose((reason) => this._close(reason ?? "Coze Browser CDP transport closed"));
  }
  static async connect(options) {
    const engine = new _CozeBrowserEngine(options);
    try {
      await engine._run(options.timeoutMs ?? 15e3, options.signal, (op) => engine._initializeSession(void 0, op));
      return engine;
    } catch (error) {
      await engine.close();
      throw error;
    }
  }
  async domSnapshot(options) {
    if (!options || options.refs !== "actionable" && options.refs !== "none")
      throw new Error("domSnapshot requires refs to be either actionable or none");
    if (options.refs === "actionable" && (!options.refPrefix || !/^[A-Za-z0-9_-]+$/.test(options.refPrefix)))
      throw new Error("domSnapshot actionable refs require a non-empty alphanumeric refPrefix");
    const maxChars = options.maxChars ?? 64 * 1024;
    if (!Number.isSafeInteger(maxChars) || maxChars < 0)
      throw new Error("domSnapshot maxChars must be a non-negative safe integer");
    const timeoutMs = options.timeoutMs ?? this._defaultTimeoutMs;
    return this._run(timeoutMs, options.signal, async (op) => {
      const frame = await this._rootFrame(op);
      const snapshot = await this._snapshotFrame(frame, [], options, { nextFrame: 0 }, op);
      return truncateSnapshot(snapshot.text, snapshot.targets, maxChars);
    });
  }
  async _snapshotFrame(frame, framePath, options, sequence, op) {
    const refPrefix = options.refs === "actionable" ? framePath.length ? `${options.refPrefix}f${++sequence.nextFrame}_` : options.refPrefix : void 0;
    const snapshot = await this._evaluate(frame, `async (injected, arg) => {
      const root = document.body || document.documentElement;
      return root ? injected.cozeRenderedSnapshot(root, arg) : { snapshotId: 0, text: '', refs: [], frames: [] };
    }`, { refs: options.refs, refPrefix }, op);
    const visibleRefs = new Set([...snapshot.text.matchAll(/\[ref=([^\]]+)\]/g)].map((match) => match[1]));
    const targets = options.refs === "actionable" ? snapshot.refs.filter((ref) => visibleRefs.has(ref)).map((ref) => ({ ref, frames: framePath })) : [];
    const childSnapshots = /* @__PURE__ */ new Map();
    for (const child of snapshot.frames) {
      let object;
      try {
        object = await this._evaluateObject(
          frame,
          `globalThis.__cozePlaywrightInjected.cozeSnapshotFrame(${snapshot.snapshotId}, ${child.slot})`,
          op
        );
        if (!object.objectId)
          continue;
        const described = await this._command("DOM.describeNode", { objectId: object.objectId }, frame.sessionId, op);
        const frameId = described?.node?.frameId ?? described?.node?.contentDocument?.frameId;
        if (!frameId)
          continue;
        const sessionId = this._targetSessions.get(frameId) ?? frame.sessionId;
        if (sessionId)
          await this._initializeSession(sessionId, op);
        const childPath = options.refs === "actionable" && child.ref ? [...framePath, { kind: "css", value: `aria-ref=${child.ref}` }] : framePath;
        const childSnapshot = await this._snapshotFrame(
          { frameId, sessionId, offsetX: 0, offsetY: 0 },
          childPath,
          options,
          sequence,
          op
        );
        childSnapshots.set(child.line, childSnapshot);
        targets.push(...childSnapshot.targets);
      } catch {
        this._throwIfExpired(op);
      } finally {
        if (object?.objectId)
          await this._command("Runtime.releaseObject", { objectId: object.objectId }, frame.sessionId, op).catch(() => {
          });
      }
    }
    await this._evaluate(
      frame,
      `async (injected, snapshotId) => injected.clearCozeSnapshotFrames(snapshotId)`,
      snapshot.snapshotId,
      op
    ).catch(() => {
    });
    const lines = [];
    for (const [lineNumber, line] of snapshot.text.split("\n").entries()) {
      const childSnapshot = childSnapshots.get(lineNumber);
      if (!childSnapshot?.text) {
        lines.push(line);
        continue;
      }
      lines.push(line.endsWith(":") ? line : line + ":");
      const indentation = line.match(/^\s*/)?.[0] ?? "";
      lines.push(...childSnapshot.text.split("\n").map((childLine) => indentation + "  " + childLine));
    }
    return { text: lines.join("\n"), targets };
  }
  async locatorState(locator, state, options = {}) {
    const allowedStates = [
      "attached",
      "detached",
      "visible",
      "hidden",
      "enabled",
      "disabled",
      "checked",
      "unchecked"
    ];
    if (!allowedStates.includes(state))
      throw new Error(`Unsupported locator state: ${state}`);
    return this._run(options.timeoutMs ?? this._defaultTimeoutMs, options.signal, async (op) => {
      const frame = await this._resolveFrame(locator.frames ?? [], op);
      return this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (arg.state === 'attached')
          return !!element;
        if (arg.state === 'detached')
          return !element;
        if (!element)
          return arg.state === 'hidden';
        return injected.elementState(element, arg.state).matches;
      }`, { selector: selectorFor(locator), state }, op);
    });
  }
  async locatorValue(locator, options = {}) {
    return this._run(options.timeoutMs ?? this._defaultTimeoutMs, options.signal, async (op) => {
      const frame = await this._resolveFrame(locator.frames ?? [], op);
      return this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return undefined;
        if (element instanceof HTMLInputElement) {
          if (element.type === 'checkbox' || element.type === 'radio')
            return element.checked;
          return element.value;
        }
        if (element instanceof HTMLTextAreaElement)
          return element.value;
        if (element instanceof HTMLSelectElement) {
          const values = [...element.selectedOptions].map(option => option.value);
          return element.multiple ? values : values[0] ?? '';
        }
        return element.textContent ?? '';
      }`, { selector: selectorFor(locator) }, op);
    });
  }
  async locatorAction(locator, action, value, timeoutMs = this._defaultTimeoutMs, signal) {
    return this._run(timeoutMs, signal, async (op) => {
      const frame = await this._resolveFrame(locator.frames ?? [], op);
      const selector = selectorFor(locator);
      if (action === "count")
        return this._queryCount(frame, selector, op);
      if (action === "wait-for") {
        await this._retry(op, async () => {
          const state = await this._queryState(frame, selector, ["visible"], op);
          return state.kind === "ready" ? true : void 0;
        });
        return void 0;
      }
      if (action === "fill")
        return this._fill(frame, selector, String(value ?? ""), op);
      if (action === "type")
        return this._type(frame, selector, String(value ?? ""), op);
      if (action === "press")
        return this._press(frame, selector, String(value ?? ""), op);
      if (action === "select-option")
        return this._selectOption(frame, selector, value, op);
      if (action === "check" || action === "set-checked") {
        const checked = action === "check" ? true : Boolean(value);
        return this._setChecked(frame, selector, checked, op);
      }
      const target = await this._actionTarget(
        frame,
        selector,
        action === "click" || action === "double-click" ? ["visible", "enabled", "stable"] : ["visible", "stable"],
        action === "hover" ? "hover" : action === "scroll" ? void 0 : "mouse",
        op
      );
      if (action === "hover") {
        await this._mouse("mouseMoved", target.pagePoint, {}, op);
        await this._stopInterceptor(target, op);
        return void 0;
      }
      if (action === "scroll") {
        const scroll = value;
        const deltaX = scroll?.deltaX ?? 0;
        const deltaY = scroll?.deltaY;
        if (typeof deltaX !== "number" || !Number.isFinite(deltaX) || typeof deltaY !== "number" || !Number.isFinite(deltaY))
          throw new Error("Scroll requires finite deltaX and deltaY values");
        await this._mouse("mouseMoved", target.pagePoint, {}, op);
        await this._command("Input.synthesizeScrollGesture", {
          x: Math.round(target.pagePoint.x),
          y: Math.round(target.pagePoint.y),
          xDistance: -deltaX,
          yDistance: -deltaY,
          gestureSourceType: "mouse",
          speed: 1200
        }, void 0, op);
        return void 0;
      }
      await this._trustedClick(target, action === "double-click" ? 2 : 1, op);
      return void 0;
    });
  }
  async goto(url, timeoutMs = this._defaultTimeoutMs, signal) {
    await this._run(timeoutMs, signal, async (op) => {
      const loaded = this._waitForEvent("Page.loadEventFired", void 0, op);
      try {
        const result = await this._command("Page.navigate", { url }, void 0, op);
        if (result.errorText)
          throw new Error(`Navigation failed: ${result.errorText}`);
        await loaded.promise;
      } finally {
        loaded.dispose();
      }
    });
  }
  async waitFor(options, timeoutMs = this._defaultTimeoutMs, signal) {
    await this._run(timeoutMs, signal, async (op) => {
      await this._retry(op, async () => {
        const frame = await this._rootFrame(op);
        const state = await this._evaluate(frame, `async () => ({
          url: location.href,
          readyState: document.readyState,
        })`, void 0, op);
        if (options.urlIncludes && !state.url.includes(options.urlIncludes))
          return void 0;
        if (options.loadState === "load" && state.readyState !== "complete")
          return void 0;
        if (options.loadState === "domcontentloaded" && state.readyState === "loading")
          return void 0;
        return true;
      });
      if (options.loadState === "networkidle") {
        const frame = await this._rootFrame(op);
        const key = `${frame.sessionId ?? "root"}:${frame.frameId}:networkIdle`;
        if (!this._lifecycleEvents.has(key)) {
          const networkIdle = this._waitForEvent("Page.lifecycleEvent", (params) => params?.frameId === frame.frameId && params?.name === "networkIdle", op);
          try {
            await networkIdle.promise;
          } finally {
            networkIdle.dispose();
          }
        }
      }
    });
  }
  async screenshot(timeoutMs = this._defaultTimeoutMs, signal) {
    return this._run(timeoutMs, signal, async (op) => {
      const result = await this._command("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: true
      }, void 0, op);
      return Buffer.from(result.data, "base64");
    });
  }
  async upload(locator, paths, timeoutMs = this._defaultTimeoutMs, signal) {
    await this._run(timeoutMs, signal, async (op) => {
      const frame = await this._resolveFrame(locator.frames ?? [], op);
      const object = await this._queryObject(frame, selectorFor(locator), op);
      try {
        await this._command("DOM.setFileInputFiles", { files: paths, objectId: object.objectId }, frame.sessionId, op);
      } finally {
        if (object.objectId)
          await this._command("Runtime.releaseObject", { objectId: object.objectId }, frame.sessionId, op).catch(() => {
          });
      }
    });
  }
  async close() {
    this._close("Coze Browser Engine closed");
  }
  _close(reason) {
    if (this._closed)
      return;
    this._closed = true;
    this._closeController.abort(reason);
    this._disposeEvents?.();
    this._disposeEvents = void 0;
    this._disposeTransportClose?.();
    this._disposeTransportClose = void 0;
    this._worlds.clear();
    this._targetSessions.clear();
    this._sessionInitializers.clear();
    this._lifecycleEvents.clear();
  }
  async _initializeSession(sessionId, op) {
    const key = sessionId ?? "root";
    const existing = this._sessionInitializers.get(key);
    if (existing)
      return existing;
    const initializer = Promise.all([
      this._command("Page.enable", {}, sessionId, op),
      this._command("Runtime.enable", {}, sessionId, op),
      this._command("DOM.enable", {}, sessionId, op),
      this._command("Page.setLifecycleEventsEnabled", { enabled: true }, sessionId, op),
      this._command("Emulation.setFocusEmulationEnabled", { enabled: true }, sessionId, op)
    ]).then(async () => {
      const frameTree = await this._command("Page.getFrameTree", {}, sessionId, op);
      const frameId = frameTree?.frameTree?.frame?.id;
      if (!sessionId && frameId)
        this._rootFrameId = frameId;
      await this._command("Runtime.runIfWaitingForDebugger", {}, sessionId, op).catch(() => {
      });
    });
    this._sessionInitializers.set(key, initializer);
    try {
      await initializer;
    } catch (error) {
      this._sessionInitializers.delete(key);
      throw error;
    }
  }
  _onCdpEvent(message) {
    if (message.method === "Target.attachedToTarget") {
      const sessionId = message.params?.sessionId;
      const targetId = message.params?.targetInfo?.targetId;
      const targetType = message.params?.targetInfo?.type;
      if (targetType === "iframe" && typeof sessionId === "string" && typeof targetId === "string") {
        this._targetSessions.set(targetId, sessionId);
        void this._run(this._defaultTimeoutMs, void 0, (op) => this._initializeSession(sessionId, op)).catch(() => {
        });
      }
      return;
    }
    if (message.method === "Target.detachedFromTarget") {
      const sessionId = message.params?.sessionId;
      if (typeof sessionId !== "string")
        return;
      for (const [targetId, value] of this._targetSessions) {
        if (value === sessionId)
          this._targetSessions.delete(targetId);
      }
      this._sessionInitializers.delete(sessionId);
      for (const key of this._worlds.keys()) {
        if (key.startsWith(`${sessionId}:`))
          this._worlds.delete(key);
      }
      return;
    }
    if (message.method === "Page.frameNavigated") {
      const frameId = message.params?.frame?.id;
      if (typeof frameId === "string") {
        for (const key of this._worlds.keys()) {
          if (key.endsWith(`:${frameId}`))
            this._worlds.delete(key);
        }
        if (!message.sessionId && !message.params?.frame?.parentId)
          this._rootFrameId = frameId;
        for (const key of this._lifecycleEvents) {
          if (key.includes(`:${frameId}:`))
            this._lifecycleEvents.delete(key);
        }
      }
      return;
    }
    if (message.method === "Page.lifecycleEvent") {
      const frameId = message.params?.frameId;
      const name = message.params?.name;
      if (typeof frameId === "string" && typeof name === "string")
        this._lifecycleEvents.add(`${message.sessionId ?? "root"}:${frameId}:${name}`);
    }
  }
  async _rootFrame(op) {
    if (!this._rootFrameId) {
      const tree = await this._command("Page.getFrameTree", {}, void 0, op);
      this._rootFrameId = tree?.frameTree?.frame?.id;
    }
    if (!this._rootFrameId)
      throw new Error("Coze Browser Kernel could not resolve the root frame");
    return { frameId: this._rootFrameId, offsetX: 0, offsetY: 0 };
  }
  async _resolveFrame(frames, op) {
    let current = await this._rootFrame(op);
    for (const locator of frames) {
      const parentSessionId = current.sessionId;
      const selector = selectorFor(locator);
      const frameInfo = await this._retry(op, async () => {
        const result = await this._evaluate(current, `async (injected, arg) => {
          const elements = injected.querySelectorAll(injected.parseSelector(arg.selector), document);
          if (elements.length > 1)
            throw injected.strictModeViolationError(injected.parseSelector(arg.selector), elements);
          const element = elements[0];
          if (!element)
            return null;
          element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
          const rect = element.getBoundingClientRect();
          globalThis.__cozeFrameElement = element;
          return {
            left: rect.left + element.clientLeft,
            top: rect.top + element.clientTop,
          };
        }`, { selector }, op);
        return result || void 0;
      });
      const object = await this._evaluateObject(current, "globalThis.__cozeFrameElement", op);
      try {
        if (!object.objectId)
          throw new Error(`Frame locator did not resolve to an iframe: ${selector}`);
        const described = await this._command("DOM.describeNode", { objectId: object.objectId }, current.sessionId, op);
        const frameId = described?.node?.frameId;
        if (!frameId)
          throw new Error(`Locator does not target a frame element: ${selector}`);
        current = {
          frameId,
          sessionId: this._targetSessions.get(frameId) ?? current.sessionId,
          offsetX: current.offsetX + frameInfo.left,
          offsetY: current.offsetY + frameInfo.top
        };
        if (current.sessionId)
          await this._initializeSession(current.sessionId, op);
      } finally {
        if (object.objectId)
          await this._command("Runtime.releaseObject", { objectId: object.objectId }, parentSessionId, op).catch(() => {
          });
      }
    }
    return current;
  }
  async _queryCount(frame, selector, op) {
    return this._evaluate(frame, `async (injected, arg) =>
      injected.querySelectorAll(injected.parseSelector(arg.selector), document).length`, { selector }, op);
  }
  async _queryState(frame, selector, states, op) {
    return this._evaluate(frame, `async (injected, arg) => {
      const parsed = injected.parseSelector(arg.selector);
      const elements = injected.querySelectorAll(parsed, document);
      if (elements.length > 1)
        throw injected.strictModeViolationError(parsed, elements);
      const element = elements[0];
      if (!element)
        return { kind: 'retry', reason: 'element was not found' };
      const state = await injected.checkElementStates(element, arg.states);
      return state ? { kind: 'retry', reason: JSON.stringify(state) } : { kind: 'ready' };
    }`, { selector, states }, op);
  }
  async _actionTarget(frame, selector, states, actionType, op) {
    const result = await this._retry(op, async () => {
      const candidate = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return null;
        const hidden = document.visibilityState === 'hidden';
        const states = hidden ? arg.states.filter(state => state !== 'stable') : arg.states;
        const state = await injected.checkElementStates(element, states);
        if (state)
          return null;
        element.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
        const stable = await injected.checkElementStates(element, states);
        if (stable)
          return null;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height)
          return null;
        const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const hit = injected.expectHitTarget(point, element);
        if (hit !== 'done')
          return null;
        return {
          hidden,
          point,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      }`, { selector, states, actionType }, op);
      if (!candidate)
        return void 0;
      if (candidate.hidden && states.includes("stable")) {
        await this._pause(16, op);
        const next = await this._evaluate(frame, `async (injected, arg) => {
          const element = injected.querySelector(injected.parseSelector(arg.selector), document, true);
          if (!element)
            return null;
          const state = await injected.checkElementStates(
              element,
              arg.states.filter(state => state !== 'stable'),
          );
          if (state)
            return null;
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }`, { selector, states }, op);
        if (!next || Object.keys(candidate.rect).some((key) => candidate.rect[key] !== next[key]))
          return void 0;
      }
      if (!actionType)
        return candidate;
      const intercepted = await this._evaluate(frame, `async (injected, arg) => {
        const element = injected.querySelector(injected.parseSelector(arg.selector), document, true);
        if (!element || injected.expectHitTarget(arg.point, element) !== 'done')
          return false;
        const interceptor = injected.setupHitTargetInterceptor(
            element,
            arg.actionType,
            arg.point,
            false,
        );
        if (typeof interceptor === 'string')
          return false;
        globalThis.__cozeHitTargetInterceptor = interceptor;
        return true;
      }`, { selector, actionType, point: candidate.point }, op);
      return intercepted ? candidate : void 0;
    });
    return {
      ...frame,
      localPoint: result.point,
      pagePoint: {
        x: frame.offsetX + result.point.x,
        y: frame.offsetY + result.point.y
      }
    };
  }
  async _trustedClick(target, clickCount, op) {
    try {
      await this._mouse("mouseMoved", target.pagePoint, {}, op);
      for (let currentClick = 1; currentClick <= clickCount; ++currentClick) {
        await this._mouse("mousePressed", target.pagePoint, { button: "left", buttons: 1, clickCount: currentClick }, op);
        await this._mouse("mouseReleased", target.pagePoint, { button: "left", buttons: 0, clickCount: currentClick }, op);
      }
      const result = await this._stopInterceptor(target, op).catch((error) => {
        if (this._isTransientEvaluationError(error))
          return "done";
        throw error;
      });
      if (result && result !== "done")
        throw new Error(`Element did not receive pointer input: ${JSON.stringify(result)}`);
    } catch (error) {
      await this._stopInterceptor(target, op).catch(() => {
      });
      throw error;
    }
  }
  _mouse(type, point, extra, op) {
    return this._command("Input.dispatchMouseEvent", { type, x: Math.round(point.x), y: Math.round(point.y), ...extra }, void 0, op);
  }
  _stopInterceptor(frame, op) {
    return this._evaluate(frame, `async () => {
      const interceptor = globalThis.__cozeHitTargetInterceptor;
      delete globalThis.__cozeHitTargetInterceptor;
      return interceptor?.stop?.() ?? 'done';
    }`, void 0, op);
  }
  async _focus(frame, selector, editable, op) {
    await this._retry(op, async () => {
      const result = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return null;
        if (arg.editable) {
          const state = await injected.checkElementStates(element, ['visible', 'enabled', 'editable']);
          if (state)
            return null;
        }
        const target = arg.editable ? injected.retarget(element, 'follow-label') : element;
        return injected.focusNode(target, true);
      }`, { selector, editable }, op);
      return result === "done" ? true : void 0;
    });
  }
  async _fill(frame, selector, value, op) {
    const result = await this._retry(op, async () => {
      const fillResult = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return null;
        const state = await injected.checkElementStates(element, ['visible', 'enabled', 'editable']);
        if (state)
          return null;
        return injected.fill(element, arg.value);
      }`, { selector, value }, op);
      return fillResult === "error:notconnected" ? void 0 : fillResult;
    });
    if (result === "needsinput") {
      if (value)
        await this._command("Input.insertText", { text: value }, void 0, op);
      else
        await this._dispatchKey("Delete", [], op);
    }
  }
  async _type(frame, selector, value, op) {
    await this._focus(frame, selector, true, op);
    if (value)
      await this._command("Input.insertText", { text: value }, void 0, op);
  }
  async _press(frame, selector, shortcut, op) {
    await this._focus(frame, selector, false, op);
    const tokens = shortcut.split("+").map((token) => token.trim()).filter(Boolean);
    const key = tokens.pop();
    if (!key)
      throw new Error("press requires a key");
    await this._dispatchKey(key, tokens, op);
  }
  async _dispatchKey(keyName, modifiers, op) {
    const modifierMask = modifiers.reduce((mask, modifier) => {
      const value = { Alt: 1, Control: 2, Meta: 4, Shift: 8 }[modifier];
      if (!value)
        throw new Error(`Unsupported keyboard modifier: ${modifier}`);
      return mask | value;
    }, 0);
    const definition = kKeyDefinitions[keyName] ?? (keyName.length === 1 ? {
      key: keyName,
      code: /[a-z]/i.test(keyName) ? `Key${keyName.toUpperCase()}` : keyName,
      keyCode: keyName.toUpperCase().charCodeAt(0),
      text: modifierMask & ~8 ? void 0 : keyName
    } : void 0);
    if (!definition)
      throw new Error(`Unsupported key: ${keyName}`);
    const common = {
      key: definition.key,
      code: definition.code,
      windowsVirtualKeyCode: definition.keyCode,
      nativeVirtualKeyCode: definition.keyCode,
      modifiers: modifierMask
    };
    await this._command("Input.dispatchKeyEvent", {
      type: definition.text ? "keyDown" : "rawKeyDown",
      ...common,
      ...definition.text ? { text: definition.text, unmodifiedText: definition.text } : {}
    }, void 0, op);
    await this._command("Input.dispatchKeyEvent", { type: "keyUp", ...common }, void 0, op);
  }
  async _setChecked(frame, selector, checked, op) {
    const current = await this._retry(op, async () => {
      const result = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return null;
        const state = injected.elementState(element, 'checked');
        if (state.received === 'error:notconnected')
          return null;
        return state.matches;
      }`, { selector }, op);
      return typeof result === "boolean" ? result : void 0;
    });
    if (current === checked)
      return;
    const target = await this._actionTarget(frame, selector, ["visible", "enabled", "stable"], "mouse", op);
    await this._trustedClick(target, 1, op);
    const after = await this._evaluate(frame, `async (injected, arg) => {
      const element = injected.querySelector(injected.parseSelector(arg.selector), document, true);
      return injected.elementState(element, 'checked').matches;
    }`, { selector }, op);
    if (after !== checked)
      throw new Error(`Checkbox did not become ${checked ? "checked" : "unchecked"}`);
  }
  async _selectOption(frame, selector, value, op) {
    const values = (Array.isArray(value) ? value : [value]).map((item) => ({ valueOrLabel: String(item ?? "") }));
    return this._retry(op, async () => {
      const result = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        const element = elements[0];
        if (!element)
          return null;
        const state = await injected.checkElementStates(element, ['visible', 'enabled']);
        if (state)
          return null;
        const selected = injected.selectOptions(element, arg.values);
        return Array.isArray(selected) ? selected : null;
      }`, { selector, values }, op);
      return result || void 0;
    });
  }
  async _queryObject(frame, selector, op) {
    await this._retry(op, async () => {
      const found = await this._evaluate(frame, `async (injected, arg) => {
        const parsed = injected.parseSelector(arg.selector);
        const elements = injected.querySelectorAll(parsed, document);
        if (elements.length > 1)
          throw injected.strictModeViolationError(parsed, elements);
        globalThis.__cozeQueryElement = elements[0];
        return !!elements[0];
      }`, { selector }, op);
      return found ? true : void 0;
    });
    const object = await this._evaluateObject(frame, "globalThis.__cozeQueryElement", op);
    if (!object.objectId)
      throw new Error(`Locator did not resolve to an element: ${selector}`);
    return object;
  }
  async _world(frame, op) {
    const key = `${frame.sessionId ?? "root"}:${frame.frameId}`;
    const existing = this._worlds.get(key);
    if (existing)
      return existing;
    const result = await this._command("Page.createIsolatedWorld", {
      frameId: frame.frameId,
      worldName: "__coze_playwright_kernel__",
      grantUniveralAccess: false
    }, frame.sessionId, op);
    const contextId = result.executionContextId;
    const expression = `${this._injectedSource}
;globalThis.__cozePlaywrightInjected = new __CozeBrowserInjectedBundle.InjectedScript(globalThis, ${javascript(injectedOptions(++this._frameSequence))});void 0;`;
    const evaluated = await this._command("Runtime.evaluate", {
      expression,
      contextId,
      awaitPromise: true,
      returnByValue: true
    }, frame.sessionId, op);
    const error = resultError(evaluated);
    if (error)
      throw error;
    this._worlds.set(key, contextId);
    return contextId;
  }
  async _evaluate(frame, functionSource, arg, op) {
    const contextId = await this._world(frame, op);
    const expression = `(${functionSource})(globalThis.__cozePlaywrightInjected, ${javascript(arg)})`;
    const evaluated = await this._command("Runtime.evaluate", {
      expression,
      contextId,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    }, frame.sessionId, op);
    const error = resultError(evaluated);
    if (error)
      throw error;
    return evaluated.result?.value;
  }
  async _evaluateObject(frame, expression, op) {
    const contextId = await this._world(frame, op);
    const evaluated = await this._command("Runtime.evaluate", {
      expression,
      contextId,
      awaitPromise: true,
      returnByValue: false,
      userGesture: true
    }, frame.sessionId, op);
    const error = resultError(evaluated);
    if (error)
      throw error;
    return evaluated.result;
  }
  _command(method, params, sessionId, op) {
    this._throwIfExpired(op);
    return this._transport.sendCommand(method, params, sessionId, {
      signal: op.signal,
      timeoutMs: Math.max(1, op.deadline - Date.now())
    });
  }
  async _retry(op, task) {
    let lastError;
    while (true) {
      this._throwIfExpired(op, lastError);
      try {
        const result = await task();
        if (result !== void 0)
          return result;
      } catch (error) {
        if (String(error).includes("strict mode violation"))
          throw error;
        if (!this._isTransientEvaluationError(error))
          throw error;
        lastError = error;
        this._worlds.clear();
      }
      await this._pause(50, op);
    }
  }
  async _pause(durationMs, op) {
    this._throwIfExpired(op);
    await new Promise((resolve, reject) => {
      const cleanup = () => op.signal?.removeEventListener("abort", abort);
      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, Math.min(durationMs, Math.max(1, op.deadline - Date.now())));
      const abort = () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error(String(op.signal?.reason ?? "Browser operation cancelled")));
      };
      op.signal?.addEventListener("abort", abort, { once: true });
      if (op.signal?.aborted)
        abort();
    });
  }
  _isTransientEvaluationError(error) {
    const message = String(error);
    return [
      "Cannot find context",
      "Execution context was destroyed",
      "Inspected target navigated or closed",
      "Cannot find context with specified id",
      "No frame with given id"
    ].some((fragment) => message.includes(fragment));
  }
  _waitForEvent(method, predicate, op) {
    let dispose;
    let settleDisposed;
    const promise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        dispose();
        reject(new Error(`Timed out waiting for ${method}`));
      }, Math.max(1, op.deadline - Date.now()));
      const abort = () => {
        dispose();
        reject(new Error(String(op.signal?.reason ?? "Browser operation cancelled")));
      };
      const disposeEvent = this._transport.onEvent((message) => {
        if (message.method !== method || predicate && !predicate(message.params))
          return;
        dispose();
        resolve(message.params);
      });
      dispose = () => {
        clearTimeout(timeout);
        disposeEvent();
        op.signal?.removeEventListener("abort", abort);
      };
      settleDisposed = () => {
        dispose();
        resolve(void 0);
      };
      op.signal?.addEventListener("abort", abort, { once: true });
      if (op.signal?.aborted)
        abort();
    });
    void promise.catch(() => {
    });
    return { promise, dispose: settleDisposed };
  }
  _throwIfExpired(op, cause) {
    if (op.signal?.aborted)
      throw new Error(String(op.signal.reason ?? "Browser operation cancelled"));
    if (Date.now() >= op.deadline)
      throw Object.assign(new Error(cause ? `Browser operation timed out: ${String(cause)}` : "Browser operation timed out"), { code: "TIMEOUT" });
  }
  async _run(timeoutMs, signal, task) {
    if (this._closed)
      throw new Error(String(this._closeController.signal.reason ?? "Coze Browser Engine closed"));
    const controller = new AbortController();
    const abort = (source) => {
      if (!controller.signal.aborted)
        controller.abort(source.reason ?? "Browser operation cancelled");
    };
    const onCallerAbort = () => abort(signal);
    const onEngineClose = () => abort(this._closeController.signal);
    signal?.addEventListener("abort", onCallerAbort, { once: true });
    this._closeController.signal.addEventListener("abort", onEngineClose, { once: true });
    if (signal?.aborted)
      abort(signal);
    if (this._closeController.signal.aborted)
      abort(this._closeController.signal);
    try {
      return await task({ deadline: Date.now() + Math.max(1, timeoutMs), signal: controller.signal });
    } finally {
      signal?.removeEventListener("abort", onCallerAbort);
      this._closeController.signal.removeEventListener("abort", onEngineClose);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (0);


},
9896(module) {
module.exports = require("fs");

},
6928(module) {
module.exports = require("path");

},

});
// The module cache
var __webpack_module_cache__ = {};

// The require function
function __webpack_require__(moduleId) {

// Check if module is in cache
var cachedModule = __webpack_module_cache__[moduleId];
if (cachedModule !== undefined) {
return cachedModule.exports;
}
// Create a new module (and put it into the cache)
var module = (__webpack_module_cache__[moduleId] = {
exports: {}
});
// Execute the module function
__webpack_modules__[moduleId](module, module.exports, __webpack_require__);

// Return the exports of the module
return module.exports;

}

var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {

;// CONCATENATED MODULE: external "node:net"
const external_node_net_namespaceObject = require("node:net");
;// CONCATENATED MODULE: external "node:fs/promises"
const promises_namespaceObject = require("node:fs/promises");
;// CONCATENATED MODULE: external "node:crypto"
const external_node_crypto_namespaceObject = require("node:crypto");
;// CONCATENATED MODULE: ../../packages/coze-browser-protocol/src/validation.ts
function validation_isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function validation_hasOnlyFields(value, fields) {
    const allowed = new Set(fields);
    return Object.keys(value).every((field)=>allowed.has(field));
}
function validation_isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}

;// CONCATENATED MODULE: ../../packages/coze-browser-protocol/src/step.ts
/* eslint-disable max-lines -- owns the versioned Step wire types and validators */ 


const COZE_BROWSER_STEP_SCHEMA_VERSION = 1;
// Public timeout bounds shared by SDK, Runtime and Gateway.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- versioned wire deadline
const COZE_BROWSER_MAX_RPC_TIMEOUT_MS = 30000;
// The Gateway must answer before the SDK transport deadline. Keep both values
// versioned so every layer derives the same deadline ordering.
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- versioned response grace
const COZE_BROWSER_STEP_GATEWAY_RESPONSE_GRACE_MS = 1000;
// eslint-disable-next-line @typescript-eslint/no-magic-numbers -- versioned transport grace
const COZE_BROWSER_STEP_TRANSPORT_GRACE_MS = 2000;
const COZE_BROWSER_STEP_RESPONSE_GRACE_MS = (/* unused pure expression or super */ null && (COZE_BROWSER_STEP_TRANSPORT_GRACE_MS));
const COZE_BROWSER_MAX_STEP_EXECUTION_TIMEOUT_MS = COZE_BROWSER_MAX_RPC_TIMEOUT_MS - COZE_BROWSER_STEP_TRANSPORT_GRACE_MS;
const REQUEST_ERROR_POLICY = {
    category: 'request',
    recovery: 'none',
    retryable: false
};
const AUTHORIZATION_ERROR_POLICY = {
    category: 'authorization',
    recovery: 'none',
    retryable: false
};
const TARGET_ERROR_POLICY = {
    category: 'target',
    recovery: 'observe-again',
    retryable: false
};
const AVAILABILITY_RETRY_LATER_ERROR_POLICY = {
    category: 'availability',
    recovery: 'retry-later',
    retryable: true
};
const ACTION_OUTCOME_UNKNOWN_ERROR_POLICY = {
    category: 'execution',
    recovery: 'observe-again',
    retryable: false
};
const REF_CONSUMED_ERROR_POLICY = {
    category: 'target',
    recovery: 'observe-again',
    retryable: false
};
const COZE_BROWSER_ERROR_POLICY = {
    INVALID_REQUEST: {
        default: REQUEST_ERROR_POLICY
    },
    PROTOCOL_MISMATCH: {
        default: REQUEST_ERROR_POLICY
    },
    NOT_SUPPORTED: {
        default: REQUEST_ERROR_POLICY
    },
    UNSUPPORTED_CAPABILITY: {
        default: REQUEST_ERROR_POLICY
    },
    UNAUTHORIZED: {
        default: AUTHORIZATION_ERROR_POLICY
    },
    CAPABILITY_EXPIRED: {
        default: AUTHORIZATION_ERROR_POLICY
    },
    CAPABILITY_REVOKED: {
        default: AUTHORIZATION_ERROR_POLICY
    },
    CONTEXT_MISMATCH: {
        default: AUTHORIZATION_ERROR_POLICY
    },
    TAB_NOT_FOUND: {
        default: TARGET_ERROR_POLICY
    },
    STRICT_MODE_VIOLATION: {
        default: TARGET_ERROR_POLICY
    },
    TARGET_NOT_ACTIONABLE: {
        default: TARGET_ERROR_POLICY
    },
    STALE_SNAPSHOT_REF: {
        default: TARGET_ERROR_POLICY
    },
    OBSERVATION_INCONSISTENT: {
        default: TARGET_ERROR_POLICY
    },
    ACTION_DISPATCH_FAILED: {
        default: {
            category: 'execution',
            recovery: 'observe-again',
            retryable: false
        }
    },
    TIMEOUT: {
        default: AVAILABILITY_RETRY_LATER_ERROR_POLICY,
        actionOutcomeUnknown: ACTION_OUTCOME_UNKNOWN_ERROR_POLICY,
        refConsumed: REF_CONSUMED_ERROR_POLICY
    },
    CANCELLED: {
        default: {
            category: 'execution',
            recovery: 'retry-read',
            retryable: true
        },
        actionOutcomeUnknown: ACTION_OUTCOME_UNKNOWN_ERROR_POLICY,
        refConsumed: REF_CONSUMED_ERROR_POLICY
    },
    RATE_LIMITED: {
        default: AVAILABILITY_RETRY_LATER_ERROR_POLICY
    },
    RUNTIME_UNAVAILABLE: {
        default: AVAILABILITY_RETRY_LATER_ERROR_POLICY
    },
    ENGINE_UNAVAILABLE: {
        default: AVAILABILITY_RETRY_LATER_ERROR_POLICY
    },
    INTERNAL_ERROR: {
        default: {
            category: 'internal',
            recovery: 'retry-later',
            retryable: false
        }
    }
};
function getCozeBrowserErrorPolicy(code, variant = 'default') {
    const entry = COZE_BROWSER_ERROR_POLICY[code];
    if (variant === 'action-outcome-unknown') {
        return entry.actionOutcomeUnknown ?? entry.default;
    }
    return variant === 'ref-consumed' ? entry.refConsumed ?? entry.default : entry.default;
}
function getCozeBrowserErrorPolicyVariant(details) {
    if (details?.refConsumed === true && details.outcome === 'not-dispatched') {
        return 'ref-consumed';
    }
    return details?.outcome === 'unknown-after-dispatch' || details?.outcome === 'unknown' && details.dispatchState === 'unknown' ? 'action-outcome-unknown' : 'default';
}
function step_isCozeBrowserErrorPolicy(code, value, details) {
    const expected = getCozeBrowserErrorPolicy(code, getCozeBrowserErrorPolicyVariant(details));
    return value.category === expected.category && value.recovery === expected.recovery && value.retryable === expected.retryable;
}
const step_COZE_BROWSER_ERROR_CATEGORY_SET = new Set([
    'request',
    'authorization',
    'target',
    'execution',
    'availability',
    'internal'
]);
const step_COZE_BROWSER_ERROR_RECOVERY_SET = new Set([
    'none',
    'observe-again',
    'retry-read',
    'retry-later'
]);
const step_COZE_BROWSER_STEP_PHASE_NAME_SET = new Set([
    'queue',
    'resolve-target',
    'preflight',
    'act',
    'settle',
    'observe'
]);
const LOCATOR_KINDS = new Set([
    'role',
    'text',
    'label',
    'placeholder',
    'test-id',
    'css'
]);
const OBSERVATION_KINDS = new Set([
    'semantic',
    'visible-dom'
]);
const ACT_AFTER_KINDS = new Set([
    'semantic',
    'dom',
    'none'
]);
const STEP_PHASE_NAMES = (/* unused pure expression or super */ null && ([
    'queue',
    'resolve-target',
    'preflight',
    'act',
    'settle',
    'observe'
]));
const STEP_PHASE_STATUSES = new Set([
    'settled',
    'busy',
    'blocked',
    'skipped'
]);
const TRACE_STATUSES = new Set([
    'success',
    'error',
    'cancelled'
]);
const ACTION_OUTCOMES = new Set([
    'not-dispatched',
    'dispatched',
    'unknown'
]);
const MODIFIER_KEYS = new Set([
    'Alt',
    'Control',
    'ControlOrMeta',
    'Ctrl',
    'Meta',
    'Command',
    'Shift'
]);
const DOWNLOAD_STATUSES = new Set([
    'awaiting-destination',
    'progressing',
    'completed',
    'cancelled',
    'interrupted'
]);
function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
function isNonNegativeFiniteNumber(value) {
    return isFiniteNumber(value) && value >= 0;
}
function isNonNegativeSafeInteger(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
function isNonEmptyStringArray(value) {
    return Array.isArray(value) && value.length > 0 && value.every(validation_isNonEmptyString);
}
function isObservationKinds(value) {
    return Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every((item)=>typeof item === 'string' && OBSERVATION_KINDS.has(item));
}
function isLocatorDescriptor(value, ancestors = new Set()) {
    if (!validation_isRecord(value) || ancestors.has(value) || !validation_hasOnlyFields(value, [
        'kind',
        'value',
        'name',
        'exact',
        'frames'
    ])) {
        return false;
    }
    const nextAncestors = new Set(ancestors).add(value);
    return typeof value.kind === 'string' && LOCATOR_KINDS.has(value.kind) && validation_isNonEmptyString(value.value) && (value.name === undefined || typeof value.name === 'string') && (value.exact === undefined || typeof value.exact === 'boolean') && (value.frames === undefined || Array.isArray(value.frames) && value.frames.length > 0 && value.frames.every((frame)=>isLocatorDescriptor(frame, nextAncestors)));
}
function isPoint(value) {
    return validation_isRecord(value) && validation_hasOnlyFields(value, [
        'x',
        'y'
    ]) && isNonNegativeFiniteNumber(value.x) && isNonNegativeFiniteNumber(value.y);
}
function isMouseButton(value) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- versioned browser mouse button wire values
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}
function isOptionalModifiers(value) {
    return value === undefined || Array.isArray(value) && value.length > 0 && value.every((item)=>typeof item === 'string' && MODIFIER_KEYS.has(item));
}
function isSemanticAction(value) {
    if (!validation_isNonEmptyString(value.ref)) {
        return false;
    }
    switch(value.name){
        case 'click':
        case 'double-click':
        case 'hover':
        case 'check':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref'
            ]);
        case 'fill':
        case 'type':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref',
                'text'
            ]) && typeof value.text === 'string';
        case 'press':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref',
                'key'
            ]) && validation_isNonEmptyString(value.key);
        case 'select':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref',
                'values'
            ]) && Array.isArray(value.values) && value.values.length > 0 && value.values.every((item)=>typeof item === 'string');
        case 'scroll':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref',
                'deltaX',
                'deltaY'
            ]) && isFiniteNumber(value.deltaX) && isFiniteNumber(value.deltaY);
        case 'upload':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'ref',
                'path'
            ]) && validation_isNonEmptyString(value.path);
        default:
            return false;
    }
}
function isVisualAction(value) {
    switch(value.name){
        case 'click':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'point',
                'button',
                'modifiers'
            ]) && isPoint(value.point) && (value.button === undefined || isMouseButton(value.button)) && isOptionalModifiers(value.modifiers);
        case 'double-click':
        case 'move':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'point',
                'modifiers'
            ]) && isPoint(value.point) && isOptionalModifiers(value.modifiers);
        case 'drag':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'path',
                'modifiers'
            ]) && Array.isArray(value.path) && // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- drag requires start and end points
            value.path.length >= 2 && value.path.length <= (/* inlined export .COZE_BROWSER_MAX_DRAG_PATH_POINTS */256) && value.path.every(isPoint) && isOptionalModifiers(value.modifiers);
        case 'scroll':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'point',
                'deltaX',
                'deltaY',
                'modifiers'
            ]) && (value.point === undefined || isPoint(value.point)) && isFiniteNumber(value.deltaX) && isFiniteNumber(value.deltaY) && isOptionalModifiers(value.modifiers);
        case 'type':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'text'
            ]) && typeof value.text === 'string';
        case 'keypress':
            return validation_hasOnlyFields(value, [
                'engine',
                'name',
                'keys'
            ]) && isNonEmptyStringArray(value.keys);
        default:
            return false;
    }
}
function isStepAction(value) {
    if (!validation_isRecord(value)) {
        return false;
    }
    if (value.engine === 'semantic') {
        return isSemanticAction(value);
    }
    return value.engine === 'visual' && isVisualAction(value);
}
function isStringMatcher(value) {
    return validation_isRecord(value) && validation_hasOnlyFields(value, [
        'operator',
        'value'
    ]) && (value.operator === 'equals' || value.operator === 'contains') && validation_isNonEmptyString(value.value);
}
function isCountMatcher(value) {
    return validation_isRecord(value) && validation_hasOnlyFields(value, [
        'operator',
        'value'
    ]) && (value.operator === 'eq' || value.operator === 'gte' || value.operator === 'lte') && isNonNegativeSafeInteger(value.value);
}
function isWaitCondition(value) {
    if (!validation_isRecord(value)) {
        return false;
    }
    switch(value.kind){
        case 'url':
        case 'title':
            return validation_hasOnlyFields(value, [
                'kind',
                'matcher'
            ]) && isStringMatcher(value.matcher);
        case 'text':
            return validation_hasOnlyFields(value, [
                'kind',
                'value',
                'state'
            ]) && validation_isNonEmptyString(value.value) && (value.state === 'visible' || value.state === 'hidden');
        case 'ref-state':
            return validation_hasOnlyFields(value, [
                'kind',
                'ref',
                'state'
            ]) && validation_isNonEmptyString(value.ref) && (value.state === 'attached' || value.state === 'detached' || value.state === 'visible' || value.state === 'hidden' || value.state === 'enabled' || value.state === 'disabled' || value.state === 'checked' || value.state === 'unchecked');
        case 'query-count':
            return validation_hasOnlyFields(value, [
                'kind',
                'query',
                'matcher'
            ]) && isLocatorDescriptor(value.query) && isCountMatcher(value.matcher);
        case 'navigation':
            return validation_hasOnlyFields(value, [
                'kind',
                'since'
            ]) && (value.since === undefined || isNonNegativeSafeInteger(value.since));
        case 'new-tab':
            return validation_hasOnlyFields(value, [
                'kind',
                'since',
                'state'
            ]) && isNonNegativeSafeInteger(value.since) && value.state === 'opened';
        case 'dialog':
            return validation_hasOnlyFields(value, [
                'kind',
                'since',
                'state'
            ]) && isNonNegativeSafeInteger(value.since) && (value.state === 'opened' || value.state === 'closed');
        case 'download':
            return validation_hasOnlyFields(value, [
                'kind',
                'since',
                'state'
            ]) && isNonNegativeSafeInteger(value.since) && (value.state === 'started' || value.state === 'completed' || value.state === 'cancelled' || value.state === 'interrupted');
        default:
            return false;
    }
}
function hasValidRequestBase(value) {
    return (value.tabId === undefined || validation_isNonEmptyString(value.tabId)) && validation_isNonEmptyString(value.traceId) && (value.executionTimeoutMs === undefined || isFiniteNumber(value.executionTimeoutMs) && value.executionTimeoutMs > 0 && value.executionTimeoutMs <= COZE_BROWSER_MAX_STEP_EXECUTION_TIMEOUT_MS);
}
function isCozeBrowserStepRequest(value) {
    if (!validation_isRecord(value) || !hasValidRequestBase(value)) {
        return false;
    }
    const baseFields = [
        'kind',
        'tabId',
        'traceId',
        'executionTimeoutMs'
    ];
    switch(value.kind){
        case 'observe':
            return validation_hasOnlyFields(value, [
                ...baseFields,
                'observation'
            ]) && typeof value.observation === 'string' && OBSERVATION_KINDS.has(value.observation);
        case 'act':
            return validation_hasOnlyFields(value, [
                ...baseFields,
                'action',
                'after'
            ]) && isStepAction(value.action) && (value.after === undefined || typeof value.after === 'string' && ACT_AFTER_KINDS.has(value.after));
        case 'wait':
            return validation_hasOnlyFields(value, [
                ...baseFields,
                'condition',
                'after'
            ]) && isWaitCondition(value.condition) && (value.after === undefined || isObservationKinds(value.after));
        default:
            return false;
    }
}
function isStepPhase(value, expectedName) {
    return isRecord(value) && hasOnlyFields(value, [
        'name',
        'status',
        'durationMs'
    ]) && value.name === expectedName && typeof value.status === 'string' && STEP_PHASE_STATUSES.has(value.status) && isNonNegativeFiniteNumber(value.durationMs);
}
function isStepTrace(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'id',
        'targetTabId',
        'resultTabId',
        'status',
        'startedAt',
        'durationMs',
        'phases'
    ]) && isNonEmptyString(value.id) && isNonEmptyString(value.targetTabId) && isNonEmptyString(value.resultTabId) && typeof value.status === 'string' && TRACE_STATUSES.has(value.status) && isNonNegativeFiniteNumber(value.startedAt) && isNonNegativeFiniteNumber(value.durationMs) && Array.isArray(value.phases) && value.phases.length === STEP_PHASE_NAMES.length && value.phases.every((phase, index)=>isStepPhase(phase, STEP_PHASE_NAMES[index]));
}
function isObservationTab(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'id',
        'url',
        'title',
        'status'
    ]) && isNonEmptyString(value.id) && typeof value.url === 'string' && typeof value.title === 'string' && typeof value.status === 'string';
}
function isVisibleDomSnapshot(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'url',
        'title',
        'viewport',
        'truncated',
        'nodes'
    ]) && typeof value.url === 'string' && typeof value.title === 'string' && isRecord(value.viewport) && hasOnlyFields(value.viewport, [
        'width',
        'height'
    ]) && isFiniteNumber(value.viewport.width) && isFiniteNumber(value.viewport.height) && typeof value.truncated === 'boolean' && Array.isArray(value.nodes) && value.nodes.every(isVisibleDomNode);
}
function isVisibleDomNode(value) {
    if (!isRecord(value) || !hasOnlyFields(value, [
        'ref',
        'tag',
        'role',
        'name',
        'text',
        'interactive',
        'focused',
        'disabled',
        'bounding_box',
        'attributes'
    ]) || !isRecord(value.bounding_box) || !hasOnlyFields(value.bounding_box, [
        'x',
        'y',
        'width',
        'height'
    ])) {
        return false;
    }
    const boundingBox = value.bounding_box;
    return isNonEmptyString(value.ref) && typeof value.tag === 'string' && typeof value.role === 'string' && typeof value.name === 'string' && typeof value.text === 'string' && typeof value.interactive === 'boolean' && typeof value.focused === 'boolean' && typeof value.disabled === 'boolean' && [
        'x',
        'y',
        'width',
        'height'
    ].every((field)=>isFiniteNumber(boundingBox[field])) && isRecord(value.attributes) && Object.values(value.attributes).every((item)=>typeof item === 'string');
}
function isObservation(value) {
    if (!isRecord(value) || !hasOnlyFields(value, [
        'kind',
        'observationId',
        'refs',
        'refPrefix',
        'eventCursor',
        'formatVersion',
        'fingerprint',
        'tab',
        'value'
    ]) || !isNonEmptyString(value.observationId) || !isNonNegativeSafeInteger(value.eventCursor) || !isNonEmptyString(value.fingerprint) || !isObservationTab(value.tab)) {
        return false;
    }
    if (value.refs === 'published') {
        if (!isNonEmptyString(value.refPrefix)) {
            return false;
        }
    } else if (value.refs !== 'none' || 'refPrefix' in value) {
        return false;
    }
    if (value.kind === 'semantic') {
        return value.formatVersion === COZE_BROWSER_SNAPSHOT_FORMAT_VERSION && typeof value.value === 'string';
    }
    return value.kind === 'visible-dom' && value.formatVersion === (/* inlined export .COZE_BROWSER_DOM_SNAPSHOT_FORMAT_VERSION */1) && isVisibleDomSnapshot(value.value);
}
function isObservationArray(value) {
    return Array.isArray(value) && value.length > 0 && new Set(value.map((observation)=>isRecord(observation) ? observation.kind : undefined)).size === value.length && value.every(isObservation);
}
function isBrowserTabSummary(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'id',
        'sessionId',
        'url',
        'title',
        'status',
        'active',
        'visible'
    ]) && isNonEmptyString(value.id) && isNonEmptyString(value.sessionId) && typeof value.url === 'string' && typeof value.title === 'string' && typeof value.status === 'string' && typeof value.active === 'boolean' && (value.visible === undefined || typeof value.visible === 'boolean');
}
function isNavigationEffect(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'tabId',
        'fromUrl',
        'toUrl'
    ]) && isNonEmptyString(value.tabId) && typeof value.fromUrl === 'string' && typeof value.toUrl === 'string';
}
function isDownloadEffect(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'id',
        'tabId',
        'filename',
        'status',
        'receivedBytes',
        'totalBytes'
    ]) && isNonEmptyString(value.id) && isNonEmptyString(value.tabId) && typeof value.filename === 'string' && typeof value.status === 'string' && DOWNLOAD_STATUSES.has(value.status) && isNonNegativeSafeInteger(value.receivedBytes) && isNonNegativeSafeInteger(value.totalBytes);
}
function isDialogEffect(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'id',
        'tabId',
        'state',
        'type',
        'message',
        'defaultPrompt'
    ]) && isNonEmptyString(value.id) && isNonEmptyString(value.tabId) && (value.state === 'opened' || value.state === 'closed') && (value.type === undefined || typeof value.type === 'string') && (value.message === undefined || typeof value.message === 'string') && (value.defaultPrompt === undefined || typeof value.defaultPrompt === 'string');
}
function isPermissionEffect(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'requestId',
        'tabId',
        'state'
    ]) && isNonEmptyString(value.requestId) && (value.tabId === undefined || isNonEmptyString(value.tabId)) && (value.state === 'requested' || value.state === 'resolved');
}
function isStepEffects(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'createdTabs',
        'closedTabIds',
        'navigations',
        'activeTabBefore',
        'activeTabAfter',
        'downloads',
        'dialogs',
        'permissions'
    ]) && Array.isArray(value.createdTabs) && value.createdTabs.every(isBrowserTabSummary) && Array.isArray(value.closedTabIds) && value.closedTabIds.every(isNonEmptyString) && Array.isArray(value.navigations) && value.navigations.every(isNavigationEffect) && (value.activeTabBefore === undefined || isNonEmptyString(value.activeTabBefore)) && (value.activeTabAfter === undefined || isNonEmptyString(value.activeTabAfter)) && Array.isArray(value.downloads) && value.downloads.every(isDownloadEffect) && Array.isArray(value.dialogs) && value.dialogs.every(isDialogEffect) && Array.isArray(value.permissions) && value.permissions.every(isPermissionEffect);
}
function isStepSettle(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'status',
        'durationMs'
    ]) && typeof value.status === 'string' && STEP_PHASE_STATUSES.has(value.status) && isNonNegativeFiniteNumber(value.durationMs);
}
function isStepError(value) {
    if (!(isRecord(value) && hasOnlyFields(value, [
        'code',
        'message',
        'retryable',
        'category',
        'recovery',
        'phase',
        'traceId',
        'details'
    ]) && typeof value.code === 'string' && Object.values(COZE_BROWSER_ERROR_CODES).includes(value.code) && typeof value.message === 'string' && typeof value.retryable === 'boolean' && typeof value.category === 'string' && step_COZE_BROWSER_ERROR_CATEGORY_SET.has(value.category) && typeof value.recovery === 'string' && step_COZE_BROWSER_ERROR_RECOVERY_SET.has(value.recovery) && typeof value.phase === 'string' && step_COZE_BROWSER_STEP_PHASE_NAME_SET.has(value.phase) && isNonEmptyString(value.traceId) && (value.details === undefined || isRecord(value.details)))) {
        return false;
    }
    return step_isCozeBrowserErrorPolicy(value.code, {
        category: value.category,
        recovery: value.recovery,
        retryable: value.retryable
    }, value.details);
}
function isCozeBrowserStepResult(value) {
    if (!isRecord(value) || !hasOnlyFields(value, [
        'schemaVersion',
        'ok',
        'outcome',
        'eventCursor',
        'trace',
        'actionOutcome',
        'effects',
        'settle',
        'after',
        'error'
    ]) || value.schemaVersion !== COZE_BROWSER_STEP_SCHEMA_VERSION || typeof value.ok !== 'boolean' || !isNonNegativeSafeInteger(value.eventCursor) || !isStepTrace(value.trace) || value.actionOutcome !== undefined && !(typeof value.actionOutcome === 'string' && ACTION_OUTCOMES.has(value.actionOutcome)) || value.effects !== undefined && !isStepEffects(value.effects) || value.settle !== undefined && !isStepSettle(value.settle) || value.after !== undefined && !isObservationArray(value.after)) {
        return false;
    }
    const trace = value.trace;
    const after = value.after;
    if (after?.some((observation)=>observation.tab.id !== trace.resultTabId)) {
        return false;
    }
    if (!value.ok) {
        return value.outcome === 'failed' && (after === undefined || after.every((observation)=>observation.refs === 'none')) && isStepError(value.error) && value.error.traceId === trace.id && trace.status !== 'success';
    }
    if (value.error !== undefined || trace.status !== 'success') {
        return false;
    }
    switch(value.outcome){
        case 'observed':
            return after !== undefined && after.every((observation)=>observation.refs === 'published');
        case 'acted':
            return value.actionOutcome === 'dispatched' && (after === undefined || after.every((observation)=>observation.refs === 'published'));
        case 'matched':
            return isRecord(value.settle) && value.settle.status === 'settled' && (after === undefined || after.every((observation)=>observation.refs === 'published'));
        default:
            return false;
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-protocol/src/index.ts


const src_COZE_BROWSER_ERROR_CODES = {
    invalidRequest: 'INVALID_REQUEST',
    protocolMismatch: 'PROTOCOL_MISMATCH',
    unauthorized: 'UNAUTHORIZED',
    capabilityExpired: 'CAPABILITY_EXPIRED',
    capabilityRevoked: 'CAPABILITY_REVOKED',
    contextMismatch: 'CONTEXT_MISMATCH',
    notSupported: 'NOT_SUPPORTED',
    unsupportedCapability: 'UNSUPPORTED_CAPABILITY',
    tabNotFound: 'TAB_NOT_FOUND',
    strictModeViolation: 'STRICT_MODE_VIOLATION',
    targetNotActionable: 'TARGET_NOT_ACTIONABLE',
    timeout: 'TIMEOUT',
    cancelled: 'CANCELLED',
    rateLimited: 'RATE_LIMITED',
    runtimeUnavailable: 'RUNTIME_UNAVAILABLE',
    staleSnapshotRef: 'STALE_SNAPSHOT_REF',
    actionDispatchFailed: 'ACTION_DISPATCH_FAILED',
    observationInconsistent: 'OBSERVATION_INCONSISTENT',
    engineUnavailable: 'ENGINE_UNAVAILABLE',
    internal: 'INTERNAL_ERROR'
};
const COZE_BROWSER_ERROR_CODE_SET = new Set(Object.values(src_COZE_BROWSER_ERROR_CODES));
const COZE_BROWSER_RPC_METHODS = [
    'status',
    'capabilities',
    'tabs.list',
    'tabs.new',
    'tabs.get',
    'tabs.selected',
    'tabs.attach',
    'tabs.detach',
    'tabs.activate',
    'tabs.close',
    'tab.goto',
    'tab.back',
    'tab.forward',
    'tab.reload',
    'browser.step',
    'tab.screenshot',
    'dialog.accept',
    'dialog.dismiss'
];
const createRpcError = (code, message, retryable = false, metadata)=>({
        code,
        message,
        retryable,
        ...metadata ?? {}
    });
function isCozeBrowserDialogAcceptParams(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'dialogId',
        'tabId',
        'promptText'
    ]) && isNonEmptyString(value.dialogId) && (value.tabId === undefined || isNonEmptyString(value.tabId)) && (value.promptText === undefined || typeof value.promptText === 'string');
}
function isCozeBrowserDialogDismissParams(value) {
    return isRecord(value) && hasOnlyFields(value, [
        'dialogId',
        'tabId'
    ]) && isNonEmptyString(value.dialogId) && (value.tabId === undefined || isNonEmptyString(value.tabId));
}
function isRpcResponse(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value;
    if (typeof candidate.id !== 'string' || typeof candidate.ok !== 'boolean') {
        return false;
    }
    if (candidate.ok) {
        return true;
    }
    const { error } = candidate;
    const hasCategory = error?.category !== undefined;
    const hasRecovery = error?.recovery !== undefined;
    const details = error?.details === undefined || isRecord(error.details) ? error?.details : undefined;
    const hasStructuredPolicy = hasCategory || hasRecovery;
    return Boolean(error && typeof error.code === 'string' && COZE_BROWSER_ERROR_CODE_SET.has(error.code) && typeof error.message === 'string' && typeof error.retryable === 'boolean' && (!hasStructuredPolicy || hasCategory && hasRecovery && COZE_BROWSER_ERROR_CATEGORY_SET.has(error.category) && COZE_BROWSER_ERROR_RECOVERY_SET.has(error.recovery) && isCozeBrowserErrorPolicy(error.code, {
        category: error.category,
        recovery: error.recovery,
        retryable: error.retryable
    }, details)) && (error.traceId === undefined || typeof error.traceId === 'string' && error.traceId.length > 0) && (error.phase === undefined || error.traceId !== undefined && COZE_BROWSER_STEP_PHASE_NAME_SET.has(error.phase)) && (error.details === undefined || details !== undefined));
}






;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/runtime-gateway.ts




const MAX_REQUEST_BYTES = 1024 * 1024;
const MAX_REQUESTS_PER_SECOND = 30;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const MAX_HANDLER_CLEANUP_GRACE_MS = 1000;
const MAX_REQUEST_TIMEOUT_MS = (/* inlined export .COZE_BROWSER_MAX_RPC_TIMEOUT_MS */30000);
const RPC_METHODS = new Set(COZE_BROWSER_RPC_METHODS);
const RPC_ERROR_CODES = new Set(Object.values(src_COZE_BROWSER_ERROR_CODES));
const ERROR_PHASES = new Set([
    'queue',
    'resolve-target',
    'preflight',
    'act',
    'settle',
    'observe'
]);
function isRuntimeErrorCode(code) {
    return typeof code === 'string' && RPC_ERROR_CODES.has(code);
}
function runtime_gateway_isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function runtimeErrorCandidate(error) {
    return runtime_gateway_isRecord(error) ? error : {};
}
function runtimeErrorMetadata(code, candidate) {
    const details = runtime_gateway_isRecord(candidate.details) ? candidate.details : undefined;
    const policy = getCozeBrowserErrorPolicy(code, getCozeBrowserErrorPolicyVariant(details));
    const hasStructuredMetadata = candidate.category !== undefined || candidate.recovery !== undefined || candidate.traceId !== undefined || candidate.phase !== undefined || details !== undefined;
    return {
        ...hasStructuredMetadata ? {
            category: policy.category,
            recovery: policy.recovery
        } : {},
        ...typeof candidate.traceId === 'string' ? {
            traceId: candidate.traceId
        } : {},
        ...typeof candidate.phase === 'string' && ERROR_PHASES.has(candidate.phase) ? {
            phase: candidate.phase
        } : {},
        ...details ? {
            details
        } : {}
    };
}
function classifyRuntimeError(error) {
    const candidate = runtimeErrorCandidate(error);
    if (isRuntimeErrorCode(candidate.code)) {
        return candidate.code;
    }
    const message = String(candidate.message ?? error).toLowerCase();
    if (message.includes('strict mode violation')) {
        return src_COZE_BROWSER_ERROR_CODES.strictModeViolation;
    }
    if (message.includes('timed out') || message.includes('timeout')) {
        return src_COZE_BROWSER_ERROR_CODES.timeout;
    }
    if (message.includes('cancelled') || message.includes('aborted')) {
        return src_COZE_BROWSER_ERROR_CODES.cancelled;
    }
    if (message.includes('not visible') || message.includes('not enabled') || message.includes('not editable') || message.includes('outside of the viewport') || message.includes('intercepts pointer events')) {
        return src_COZE_BROWSER_ERROR_CODES.targetNotActionable;
    }
    return src_COZE_BROWSER_ERROR_CODES.internal;
}
function createRuntimeGatewayListenOptions(socketPath, platform = process.platform) {
    return platform === 'win32' ? {
        path: socketPath,
        readableAll: false,
        writableAll: false
    } : {
        path: socketPath
    };
}
function parseRequest(line) {
    // This infrastructure package owns the untrusted JSON boundary and validates
    // every field before forwarding the request.
    let value;
    try {
        // eslint-disable-next-line no-restricted-syntax -- validated protocol boundary
        value = JSON.parse(line);
    } catch  {
        return undefined;
    }
    if (!value || typeof value !== 'object') {
        return undefined;
    }
    const request = value;
    if (typeof request.id !== 'string' || typeof request.protocolVersion !== 'string' || typeof request.capability !== 'string' || !request.capability || request.refAuthority !== undefined && (typeof request.refAuthority !== 'string' || !request.refAuthority) || typeof request.sessionId !== 'string' || !request.sessionId || typeof request.method !== 'string' || !RPC_METHODS.has(request.method) || request.params !== undefined && (!request.params || typeof request.params !== 'object' || Array.isArray(request.params)) || request.timeoutMs !== undefined && (typeof request.timeoutMs !== 'number' || !Number.isFinite(request.timeoutMs) || request.timeoutMs <= 0)) {
        return undefined;
    }
    return request;
}
function writeResponse(socket, response) {
    if (!socket.destroyed) {
        socket.end(`${JSON.stringify(response)}\n`);
    }
}
function createGatewayTimeoutError(request) {
    const isPotentiallyMutating = request.method === 'browser.step' && request.params?.kind === 'act';
    if (!isPotentiallyMutating) {
        const policy = getCozeBrowserErrorPolicy(src_COZE_BROWSER_ERROR_CODES.timeout);
        return createRpcError(src_COZE_BROWSER_ERROR_CODES.timeout, 'Browser request timed out', policy.retryable);
    }
    const traceId = request.params?.traceId;
    const policy = getCozeBrowserErrorPolicy(src_COZE_BROWSER_ERROR_CODES.timeout, 'action-outcome-unknown');
    return createRpcError(src_COZE_BROWSER_ERROR_CODES.timeout, 'Browser request timed out; action dispatch state is unknown', policy.retryable, {
        category: policy.category,
        recovery: policy.recovery,
        ...typeof traceId === 'string' && traceId.length > 0 ? {
            traceId
        } : {},
        details: {
            outcome: 'unknown',
            dispatchState: 'unknown'
        }
    });
}
function stepExecutionTimeoutMs(request) {
    if (request.method === 'browser.step') {
        const executionTimeoutMs = request.params?.executionTimeoutMs;
        if (typeof executionTimeoutMs === 'number' && Number.isFinite(executionTimeoutMs) && executionTimeoutMs > 0 && executionTimeoutMs <= (/* inlined export .COZE_BROWSER_MAX_STEP_EXECUTION_TIMEOUT_MS */28000)) {
            return executionTimeoutMs;
        }
    }
    return undefined;
}
function isMutatingStepRequest(request) {
    return request.method === 'browser.step' && request.params?.kind === 'act';
}
function stepHandlerCleanupGraceMs() {
    return Math.min((/* inlined export .COZE_BROWSER_STEP_GATEWAY_RESPONSE_GRACE_MS */1000), MAX_HANDLER_CLEANUP_GRACE_MS);
}
function gatewayRequestTimeoutMs(request) {
    const executionTimeoutMs = stepExecutionTimeoutMs(request);
    if (executionTimeoutMs !== undefined) {
        return executionTimeoutMs + stepHandlerCleanupGraceMs();
    }
    return Math.min(request.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS, MAX_REQUEST_TIMEOUT_MS);
}
function createHandlerTimeoutError() {
    const policy = getCozeBrowserErrorPolicy(src_COZE_BROWSER_ERROR_CODES.timeout);
    const rpcError = createRpcError(src_COZE_BROWSER_ERROR_CODES.timeout, 'Browser request timed out', policy.retryable);
    return Object.assign(new Error(rpcError.message), rpcError);
}
function scheduleHandlerAbort(request, controller) {
    const executionTimeoutMs = stepExecutionTimeoutMs(request);
    return isMutatingStepRequest(request) && executionTimeoutMs !== undefined ? setTimeout(()=>controller.abort(createHandlerTimeoutError()), executionTimeoutMs) : undefined;
}
class RuntimeGateway {
    options;
    server;
    runtimeInstanceId = (0,external_node_crypto_namespaceObject.randomUUID)();
    requestWindowStartedAt = Date.now();
    requestCount = 0;
    constructor(options){
        this.options = options;
    }
    async listen() {
        await this.close();
        if (process.platform !== 'win32') {
            await (0,promises_namespaceObject.rm)(this.options.socketPath, {
                force: true
            }).catch(()=>undefined);
        }
        const server = (0,external_node_net_namespaceObject.createServer)((socket)=>this.handleConnection(socket));
        this.server = server;
        await new Promise((resolve, reject)=>{
            server.once('error', reject);
            const listenOptions = createRuntimeGatewayListenOptions(this.options.socketPath);
            server.listen(listenOptions, ()=>{
                server.removeListener('error', reject);
                resolve();
            });
        });
        if (process.platform !== 'win32') {
            await (0,promises_namespaceObject.chmod)(this.options.socketPath, 384);
        }
    }
    async close() {
        const { server } = this;
        this.server = undefined;
        if (server) {
            await new Promise((resolve)=>server.close(()=>resolve()));
        }
        if (process.platform !== 'win32') {
            await (0,promises_namespaceObject.rm)(this.options.socketPath, {
                force: true
            }).catch(()=>undefined);
        }
    }
    allowRequest() {
        const now = Date.now();
        if (now - this.requestWindowStartedAt >= 1000) {
            this.requestWindowStartedAt = now;
            this.requestCount = 0;
        }
        this.requestCount += 1;
        return this.requestCount <= MAX_REQUESTS_PER_SECOND;
    }
    emitTraceEvent(event) {
        try {
            this.options.onTraceEvent?.(event);
        } catch (error) {
            // Diagnostics must never affect Browser Runtime request handling.
            void error;
        }
    }
    handleConnection(socket) {
        socket.setEncoding('utf8');
        let buffer = '';
        let completed = false;
        let requestStarted = false;
        let controller;
        let handlerAbortTimer;
        let requestTimer;
        let tracedRequest;
        let traceStartedAt;
        const respondOnce = (response)=>{
            if (completed) {
                return;
            }
            completed = true;
            clearTimeout(handlerAbortTimer);
            clearTimeout(requestTimer);
            if (tracedRequest && traceStartedAt !== undefined) {
                const completedAt = Date.now();
                this.emitTraceEvent({
                    type: 'browser-runtime-trace-completed',
                    runtimeInstanceId: this.runtimeInstanceId,
                    capability: tracedRequest.capability,
                    requestId: tracedRequest.id,
                    sessionId: tracedRequest.sessionId,
                    response,
                    completedAt,
                    durationMs: Math.max(0, completedAt - traceStartedAt)
                });
            }
            writeResponse(socket, response);
        };
        socket.once('close', ()=>{
            if (requestStarted && !completed) {
                controller?.abort(new Error('Browser client disconnected'));
            }
        });
        socket.on('data', (chunk)=>{
            if (completed || requestStarted) {
                return;
            }
            buffer += chunk;
            if (buffer.length > MAX_REQUEST_BYTES) {
                respondOnce({
                    id: '',
                    ok: false,
                    error: createRpcError(src_COZE_BROWSER_ERROR_CODES.invalidRequest, 'Request exceeded the size limit')
                });
                return;
            }
            const newline = buffer.indexOf('\n');
            if (newline < 0) {
                return;
            }
            const request = parseRequest(buffer.slice(0, newline));
            buffer = '';
            if (!request) {
                respondOnce({
                    id: '',
                    ok: false,
                    error: createRpcError(src_COZE_BROWSER_ERROR_CODES.invalidRequest, 'Invalid Browser Runtime request')
                });
                return;
            }
            tracedRequest = request;
            traceStartedAt = Date.now();
            this.emitTraceEvent({
                type: 'browser-runtime-trace-started',
                runtimeInstanceId: this.runtimeInstanceId,
                capability: request.capability,
                requestId: request.id,
                sessionId: request.sessionId,
                method: request.method,
                params: request.params ?? {},
                ...request.timeoutMs === undefined ? {} : {
                    timeoutMs: request.timeoutMs
                },
                startedAt: traceStartedAt
            });
            if (request.protocolVersion !== (/* inlined export .COZE_BROWSER_PROTOCOL_VERSION */"3.0.0")) {
                respondOnce({
                    id: request.id,
                    ok: false,
                    error: createRpcError(src_COZE_BROWSER_ERROR_CODES.protocolMismatch, `Expected protocol ${(/* inlined export .COZE_BROWSER_PROTOCOL_VERSION */"3.0.0")}`)
                });
                return;
            }
            if (!this.allowRequest()) {
                respondOnce({
                    id: request.id,
                    ok: false,
                    error: createRpcError(src_COZE_BROWSER_ERROR_CODES.rateLimited, 'Browser Runtime rate limit exceeded', true)
                });
                return;
            }
            requestStarted = true;
            controller = new AbortController();
            const timeoutMs = gatewayRequestTimeoutMs(request);
            handlerAbortTimer = scheduleHandlerAbort(request, controller);
            requestTimer = setTimeout(()=>{
                controller?.abort(new Error('Browser request timed out'));
                respondOnce({
                    id: request.id,
                    ok: false,
                    error: createGatewayTimeoutError(request)
                });
            }, timeoutMs);
            void this.options.handleRequest(request, controller.signal).then((result)=>{
                respondOnce({
                    id: request.id,
                    ok: true,
                    result
                });
            }).catch((error)=>{
                const candidate = runtimeErrorCandidate(error);
                const code = classifyRuntimeError(error);
                const policy = getCozeBrowserErrorPolicy(code, getCozeBrowserErrorPolicyVariant(runtime_gateway_isRecord(candidate.details) ? candidate.details : undefined));
                const rpcError = createRpcError(code, typeof candidate.message === 'string' ? candidate.message : String(error), policy.retryable);
                respondOnce({
                    id: request.id,
                    ok: false,
                    error: {
                        ...rpcError,
                        ...runtimeErrorMetadata(code, candidate)
                    }
                });
            });
        });
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/request-cancellation.ts

const CANCELLED_OPERATION_CLEANUP_TIMEOUT_MS = 1000;
const PUBLIC_ERROR_CODES = new Set(Object.values(src_COZE_BROWSER_ERROR_CODES));
function cancellationError(signal) {
    const reason = signal?.reason;
    const candidate = reason;
    if (candidate && typeof candidate.code === 'string' && PUBLIC_ERROR_CODES.has(candidate.code)) {
        return reason instanceof Error ? reason : Object.assign(new Error(typeof candidate.message === 'string' ? candidate.message : 'Browser request cancelled'), candidate);
    }
    return Object.assign(new Error(reason instanceof Error ? reason.message : 'Browser request cancelled'), {
        code: 'CANCELLED'
    });
}
function throwIfCancelled(signal) {
    if (signal?.aborted) {
        throw cancellationError(signal);
    }
}
function raceWithCancellation(task, signal) {
    if (!signal) {
        return task;
    }
    return new Promise((resolve, reject)=>{
        let settled = false;
        const resolveOnce = (value)=>{
            if (settled) {
                return;
            }
            settled = true;
            signal.removeEventListener('abort', cancel);
            resolve(value);
        };
        const rejectOnce = (error)=>{
            if (settled) {
                return;
            }
            settled = true;
            signal.removeEventListener('abort', cancel);
            reject(error);
        };
        const cancel = ()=>rejectOnce(cancellationError(signal));
        signal.addEventListener('abort', cancel, {
            once: true
        });
        task.then(resolveOnce, rejectOnce);
        if (signal.aborted) {
            cancel();
        }
    });
}
function cancelledCleanupTimeout(requestTimeoutMs) {
    return Math.min(requestTimeoutMs ?? CANCELLED_OPERATION_CLEANUP_TIMEOUT_MS, CANCELLED_OPERATION_CLEANUP_TIMEOUT_MS);
}

;// CONCATENATED MODULE: external "node:perf_hooks"
const external_node_perf_hooks_namespaceObject = require("node:perf_hooks");
// EXTERNAL MODULE: ../../common/temp/default/node_modules/.pnpm/@coze+playwright-browser-engine@1.62.1-coze.2/node_modules/@coze/playwright-browser-engine/dist/index.js
var dist = __webpack_require__(7884);
;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/visual-cua-drag.ts
const DRAG_INTERCEPT_WAIT_MS = 100;
const DRAG_MOVE_SETTLE_MS = 16;
const MIN_DRAG_PATH_POINTS = 2;
function sendCleanup(cdp, method, params) {
    return (cdp.sendCleanup ?? cdp.send)(method, params);
}
async function executeVisualDrag(cdp, path, modifiers) {
    const button = {
        button: 'left',
        mask: 1
    };
    const start = path[0];
    const firstMove = path[1];
    const remainingPath = path.slice(MIN_DRAG_PATH_POINTS);
    let resolveIntercept;
    const interceptedData = new Promise((resolve)=>{
        resolveIntercept = resolve;
    });
    const unsubscribe = cdp.onEvent?.((message)=>{
        if (message.method !== 'Input.dragIntercepted') {
            return;
        }
        const data = message.params?.data;
        if (!data || typeof data !== 'object') {
            return;
        }
        resolveIntercept?.(data);
        resolveIntercept = undefined;
    });
    let interceptEnabled = false;
    let mousePressed = false;
    let interceptedDragData;
    let primaryFailure;
    let cleanupFailure;
    const releasePoint = remainingPath[remainingPath.length - 1] ?? firstMove;
    const releaseMouse = async ()=>{
        if (!mousePressed) {
            return;
        }
        mousePressed = false;
        try {
            await sendCleanup(cdp, 'Input.dispatchMouseEvent', {
                type: 'mouseReleased',
                ...releasePoint,
                button: button.button,
                buttons: 0,
                clickCount: 1,
                modifiers
            });
        } catch (error) {
            cleanupFailure ??= {
                error
            };
        }
    };
    try {
        interceptEnabled = true;
        await cdp.send('Input.setInterceptDrags', {
            enabled: true
        });
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            ...start,
            button: 'none',
            buttons: 0,
            modifiers
        });
        mousePressed = true;
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            ...start,
            button: button.button,
            buttons: button.mask,
            clickCount: 1,
            force: 0.5,
            modifiers
        });
        const firstMovePromise = dispatchPressedMove(cdp, firstMove, button, modifiers);
        const outcome = await waitForDragOutcome(interceptedData, firstMovePromise);
        if (outcome.kind === 'intercepted') {
            interceptedDragData = outcome.data;
            await dispatchInterceptedDrag(cdp, firstMove, remainingPath, outcome.data, modifiers);
            interceptedDragData = undefined;
            await firstMovePromise;
            await releaseMouse();
        } else {
            await dispatchPointerDrag(cdp, firstMovePromise, remainingPath, button, modifiers, releaseMouse);
        }
    } catch (error) {
        primaryFailure = {
            error
        };
    }
    try {
        resolveIntercept?.(undefined);
        unsubscribe?.();
    } catch (error) {
        cleanupFailure ??= {
            error
        };
    }
    await releaseMouse();
    if (interceptedDragData) {
        try {
            await sendCleanup(cdp, 'Input.dispatchDragEvent', {
                type: 'dragCancel',
                ...releasePoint,
                data: {
                    items: [],
                    dragOperationsMask: 0xffff
                },
                modifiers
            });
        } catch (error) {
            cleanupFailure ??= {
                error
            };
        }
    }
    if (interceptEnabled) {
        try {
            await sendCleanup(cdp, 'Input.setInterceptDrags', {
                enabled: false
            });
        } catch (error) {
            cleanupFailure ??= {
                error
            };
        }
    }
    if (primaryFailure) {
        throw primaryFailure.error;
    }
    if (cleanupFailure) {
        throw cleanupFailure.error;
    }
}
async function dispatchPressedMove(cdp, point, button, modifiers) {
    const result = await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        ...point,
        button: button.button,
        buttons: button.mask,
        force: 0.5,
        modifiers
    });
    // Chromium drag initiation is frame-driven. Yielding one frame between
    // pressed moves lets the renderer cross its native drag threshold and emit
    // Input.dragIntercepted instead of collapsing the whole path into one frame.
    await new Promise((resolve)=>setTimeout(resolve, DRAG_MOVE_SETTLE_MS));
    return result;
}
async function waitForDragOutcome(interceptedData, firstMovePromise) {
    // Chromium acknowledges Input.dispatchMouseEvent independently from the
    // asynchronous Input.dragIntercepted event. A successful command response
    // therefore must not select the pointer fallback: the interception event may
    // still be queued behind that response on the transport. Keep the rejection
    // observable, but let the event or the bounded grace period decide the path.
    const firstMoveFailure = firstMovePromise.then(()=>new Promise(()=>undefined));
    return Promise.race([
        interceptedData.then((data)=>data ? {
                kind: 'intercepted',
                data
            } : {
                kind: 'pointer'
            }),
        firstMoveFailure,
        new Promise((resolve)=>setTimeout(()=>resolve({
                    kind: 'pointer'
                }), DRAG_INTERCEPT_WAIT_MS))
    ]);
}
async function dispatchPointerDrag(cdp, firstMovePromise, remainingPath, button, modifiers, releaseMouse) {
    await firstMovePromise;
    for (const point of remainingPath){
        await dispatchPressedMove(cdp, point, button, modifiers);
    }
    await releaseMouse();
}
async function dispatchInterceptedDrag(cdp, start, path, data, modifiers) {
    await cdp.send('Input.dispatchDragEvent', {
        type: 'dragEnter',
        ...start,
        data,
        modifiers
    });
    for (const point of path){
        await cdp.send('Input.dispatchDragEvent', {
            type: 'dragOver',
            ...point,
            data,
            modifiers
        });
    }
    const dropPoint = path[path.length - 1] ?? start;
    await cdp.send('Input.dispatchDragEvent', {
        type: 'drop',
        ...dropPoint,
        data,
        modifiers
    });
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/visual-cua.ts
const MIDDLE_MOUSE_BUTTON = 2;
const RIGHT_MOUSE_BUTTON = 3;
const BACK_MOUSE_BUTTON = 4;
const FORWARD_MOUSE_BUTTON = 5;
const DOUBLE_CLICK_COUNT = 2;
const visual_cua_MIN_DRAG_PATH_POINTS = 2;
const MAX_DRAG_PATH_POINTS = 256;
function visual_cua_sendCleanup(cdp, method, params) {
    return (cdp.sendCleanup ?? cdp.send)(method, params);
}
function isVisualCuaCleanupCommand(method, params) {
    return method === 'Input.dispatchKeyEvent' && params.type === 'keyUp' || method === 'Input.dispatchMouseEvent' && params.type === 'mouseReleased' || method === 'Input.setInterceptDrags' && params.enabled === false || method === 'Input.dispatchDragEvent' && params.type === 'dragCancel' || method === 'Runtime.releaseObjectGroup' && params.objectGroup === 'coze-browser-dom-cua';
}
function invalidRequest(message) {
    return Object.assign(new Error(message), {
        code: 'INVALID_REQUEST'
    });
}
function visual_cua_isRecord(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function assertActionFields(params, action, actionFields) {
    const allowedFields = new Set([
        'action',
        'tabId',
        ...actionFields
    ]);
    const unexpectedField = Object.keys(params).find((field)=>!allowedFields.has(field));
    if (unexpectedField) {
        throw invalidRequest([
            action,
            ' does not support field ',
            unexpectedField
        ].join(''));
    }
    if (params.tabId !== undefined && (typeof params.tabId !== 'string' || params.tabId.length === 0)) {
        throw invalidRequest('tabId must be a non-empty string');
    }
}
function coordinate(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw invalidRequest([
            field,
            ' must be a finite non-negative number'
        ].join(''));
    }
    return value;
}
function finiteNumber(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw invalidRequest([
            field,
            ' must be a finite number'
        ].join(''));
    }
    return value;
}
function visual_cua_point(value, field) {
    if (!visual_cua_isRecord(value)) {
        throw invalidRequest([
            field,
            ' must be a point'
        ].join(''));
    }
    return {
        x: coordinate(value.x, [
            field,
            '.x'
        ].join('')),
        y: coordinate(value.y, [
            field,
            '.y'
        ].join(''))
    };
}
async function viewportSize(cdp) {
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const width = metrics.cssVisualViewport?.clientWidth;
    const height = metrics.cssVisualViewport?.clientHeight;
    if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
        throw Object.assign(new Error('Browser viewport is unavailable; inspect the page and retry.'), {
            code: 'TARGET_NOT_ACTIONABLE'
        });
    }
    return {
        width,
        height
    };
}
function assertPointInViewport(target, viewport) {
    if (target.x < viewport.width && target.y < viewport.height) {
        return;
    }
    throw Object.assign(new Error(`Viewport point (${target.x}, ${target.y}) is outside ` + `${viewport.width}x${viewport.height} CSS pixels; coordinates are ` + 'relative to the embedded page, not the Coze window.'), {
        code: 'TARGET_NOT_ACTIONABLE',
        details: {
            point: target,
            viewport,
            coordinateSpace: 'page-viewport-css-pixels'
        }
    });
}
async function preflightVisualCuaAction(cdp, params) {
    if (!visual_cua_isRecord(params) || typeof params.action !== 'string') {
        throw invalidRequest('Visual CUA action is required');
    }
    let targets = [];
    switch(params.action){
        case 'click':
        case 'double-click':
        case 'move':
            targets = [
                visual_cua_point(params, params.action)
            ];
            break;
        case 'scroll':
            if (params.x !== undefined || params.y !== undefined) {
                targets = [
                    visual_cua_point(params, 'scroll')
                ];
            }
            break;
        case 'drag':
            if (Array.isArray(params.path)) {
                targets = params.path.map((value, index)=>visual_cua_point(value, `path[${index}]`));
            }
            break;
        default:
            return;
    }
    if (targets.length === 0) {
        return;
    }
    const viewport = await viewportSize(cdp);
    targets.forEach((target)=>assertPointInViewport(target, viewport));
}
function keyDefinition(key) {
    switch(key){
        case 'Alt':
            return {
                key,
                modifierMask: 1
            };
        case 'Control':
        case 'Ctrl':
            return {
                key: 'Control',
                modifierMask: 2
            };
        case 'ControlOrMeta':
            return process.platform === 'darwin' ? {
                key: 'Meta',
                modifierMask: 4
            } : {
                key: 'Control',
                modifierMask: 2
            };
        case 'Meta':
        case 'Command':
            return {
                key: 'Meta',
                modifierMask: 4
            };
        case 'Shift':
            return {
                key,
                modifierMask: 8
            };
        default:
            return {
                key,
                modifierMask: 0
            };
    }
}
function visual_cua_isNonEmptyStringArray(value) {
    return Array.isArray(value) && value.length > 0 && value.every((key)=>typeof key === 'string' && key.length > 0);
}
function keyChord(value, field, optional, modifiersOnly) {
    if (optional && value === undefined) {
        return undefined;
    }
    if (!visual_cua_isNonEmptyStringArray(value)) {
        throw invalidRequest([
            field,
            ' must be a non-empty array of non-empty strings'
        ].join(''));
    }
    const chord = value.map(keyDefinition);
    if (modifiersOnly && chord.some((key)=>key.modifierMask === 0)) {
        throw invalidRequest([
            field,
            ' only supports modifier keys'
        ].join(''));
    }
    return chord;
}
function mouseButton(value) {
    switch(value === undefined ? 1 : value){
        case 1:
            return {
                button: 'left',
                mask: 1
            };
        case MIDDLE_MOUSE_BUTTON:
            return {
                button: 'middle',
                mask: 4
            };
        case RIGHT_MOUSE_BUTTON:
            return {
                button: 'right',
                mask: 2
            };
        case BACK_MOUSE_BUTTON:
            return {
                button: 'back',
                mask: 8
            };
        case FORWARD_MOUSE_BUTTON:
            return {
                button: 'forward',
                mask: 16
            };
        default:
            throw invalidRequest('button must be an integer from 1 to 5');
    }
}
async function releaseKeys(cdp, pressedKeys, initialModifierMask) {
    let failure;
    let modifierMask = initialModifierMask;
    for (const definition of [
        ...pressedKeys
    ].reverse()){
        modifierMask &= ~definition.modifierMask;
        try {
            await visual_cua_sendCleanup(cdp, 'Input.dispatchKeyEvent', {
                type: 'keyUp',
                key: definition.key,
                modifiers: modifierMask
            });
        } catch (error) {
            failure ??= {
                error
            };
        }
    }
    return failure;
}
async function withKeyChord(cdp, chord, action) {
    const pressedKeys = [];
    let modifierMask = 0;
    let actionFailure;
    try {
        for (const definition of chord ?? []){
            pressedKeys.push(definition);
            modifierMask |= definition.modifierMask;
            await cdp.send('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: definition.key,
                modifiers: modifierMask
            });
        }
        await action(modifierMask);
    } catch (error) {
        actionFailure = {
            error
        };
    }
    const releaseFailure = await releaseKeys(cdp, pressedKeys, modifierMask);
    if (actionFailure) {
        throw actionFailure.error;
    }
    if (releaseFailure) {
        throw releaseFailure.error;
    }
}
async function click(cdp, target, definition, clickCount, modifiers) {
    await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        ...target,
        button: 'none',
        buttons: 0,
        modifiers
    });
    let pressFailure;
    try {
        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            ...target,
            button: definition.button,
            buttons: definition.mask,
            clickCount,
            modifiers
        });
    } catch (error) {
        pressFailure = {
            error
        };
    }
    let releaseFailure;
    try {
        await visual_cua_sendCleanup(cdp, 'Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            ...target,
            button: definition.button,
            buttons: 0,
            clickCount,
            modifiers
        });
    } catch (error) {
        releaseFailure = {
            error
        };
    }
    if (pressFailure) {
        throw pressFailure.error;
    }
    if (releaseFailure) {
        throw releaseFailure.error;
    }
}
async function executeVisualCuaAction(cdp, params) {
    if (!visual_cua_isRecord(params) || typeof params.action !== 'string') {
        throw invalidRequest('Visual CUA action is required');
    }
    switch(params.action){
        case 'click':
            {
                assertActionFields(params, 'click', [
                    'x',
                    'y',
                    'button',
                    'keypress'
                ]);
                const target = visual_cua_point(params, 'click');
                const definition = mouseButton(params.button);
                const chord = keyChord(params.keypress, 'keypress', true, true);
                await withKeyChord(cdp, chord, (modifiers)=>click(cdp, target, definition, 1, modifiers));
                return;
            }
        case 'double-click':
            {
                assertActionFields(params, 'double-click', [
                    'x',
                    'y',
                    'keypress'
                ]);
                const target = visual_cua_point(params, 'double-click');
                const chord = keyChord(params.keypress, 'keypress', true, true);
                await withKeyChord(cdp, chord, async (modifiers)=>{
                    const definition = mouseButton(1);
                    await click(cdp, target, definition, 1, modifiers);
                    await click(cdp, target, definition, DOUBLE_CLICK_COUNT, modifiers);
                });
                return;
            }
        case 'drag':
            {
                assertActionFields(params, 'drag', [
                    'path',
                    'keys'
                ]);
                if (!Array.isArray(params.path) || params.path.length < visual_cua_MIN_DRAG_PATH_POINTS || params.path.length > MAX_DRAG_PATH_POINTS) {
                    throw invalidRequest(`path must contain 2..${MAX_DRAG_PATH_POINTS} points`);
                }
                const path = params.path.map((value, index)=>visual_cua_point(value, [
                        'path[',
                        String(index),
                        ']'
                    ].join('')));
                const chord = keyChord(params.keys, 'keys', true, true);
                await withKeyChord(cdp, chord, (modifiers)=>executeVisualDrag(cdp, path, modifiers));
                return;
            }
        case 'keypress':
            {
                assertActionFields(params, 'keypress', [
                    'keys'
                ]);
                const chord = keyChord(params.keys, 'keys', false, false);
                await withKeyChord(cdp, chord, ()=>undefined);
                return;
            }
        case 'move':
            {
                assertActionFields(params, 'move', [
                    'x',
                    'y',
                    'keys'
                ]);
                const target = visual_cua_point(params, 'move');
                const chord = keyChord(params.keys, 'keys', true, true);
                await withKeyChord(cdp, chord, async (modifiers)=>{
                    await cdp.send('Input.dispatchMouseEvent', {
                        type: 'mouseMoved',
                        ...target,
                        button: 'none',
                        buttons: 0,
                        modifiers
                    });
                });
                return;
            }
        case 'scroll':
            {
                assertActionFields(params, 'scroll', [
                    'x',
                    'y',
                    'scrollX',
                    'scrollY',
                    'keypress'
                ]);
                const target = params.x === undefined && params.y === undefined ? await viewportCenter(cdp) : visual_cua_point(params, 'scroll');
                const scrollX = finiteNumber(params.scrollX, 'scrollX');
                const scrollY = finiteNumber(params.scrollY, 'scrollY');
                const chord = keyChord(params.keypress, 'keypress', true, true);
                await withKeyChord(cdp, chord, async (modifiers)=>{
                    await cdp.send('Input.synthesizeScrollGesture', {
                        ...target,
                        xDistance: -scrollX,
                        yDistance: -scrollY,
                        modifiers
                    });
                });
                return;
            }
        case 'type':
            {
                assertActionFields(params, 'type', [
                    'text'
                ]);
                if (typeof params.text !== 'string' || params.text.length === 0) {
                    throw invalidRequest('text must be a non-empty string');
                }
                const editable = await cdp.send('Runtime.evaluate', {
                    expression: String.raw`(() => {
          const element = document.activeElement;
          return Boolean(element && (
            element instanceof HTMLTextAreaElement ||
            (element instanceof HTMLInputElement &&
              !['button', 'checkbox', 'file', 'hidden', 'radio', 'reset',
                'submit'].includes(element.type)) ||
            element.isContentEditable
          ));
        })()`,
                    returnByValue: true
                });
                if (editable.result?.value !== true) {
                    throw Object.assign(new Error('No editable page element is focused; use a semantic ref or goto.'), {
                        code: 'TARGET_NOT_ACTIONABLE'
                    });
                }
                await cdp.send('Input.insertText', {
                    text: params.text
                });
                return;
            }
        default:
            throw invalidRequest([
                'Unsupported Visual CUA action: ',
                params.action
            ].join(''));
    }
}
async function viewportCenter(cdp) {
    const { width, height } = await viewportSize(cdp);
    return {
        x: width / 2,
        y: height / 2
    };
}


;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/locator.ts
const PLAYWRIGHT_LOCATOR_KINDS = new Set([
    'role',
    'text',
    'label',
    'placeholder',
    'test-id',
    'css'
]);
const MAX_LOCATOR_DEPTH = 16;
function locator_isLocatorDescriptor(value, depth = 0) {
    if (!value || typeof value !== 'object' || depth > MAX_LOCATOR_DEPTH) {
        return false;
    }
    const locator = value;
    return typeof locator.kind === 'string' && PLAYWRIGHT_LOCATOR_KINDS.has(locator.kind) && typeof locator.value === 'string' && (locator.name === undefined || typeof locator.name === 'string') && (locator.exact === undefined || typeof locator.exact === 'boolean') && (locator.frames === undefined || Array.isArray(locator.frames) && locator.frames.every((frame)=>locator_isLocatorDescriptor(frame, depth + 1)));
}
function toEngineLocator(locator) {
    return {
        kind: locator.kind,
        value: locator.value,
        ...locator.name ? {
            name: locator.name
        } : {},
        ...locator.exact === undefined ? {} : {
            exact: locator.exact
        },
        ...locator.frames ? {
            frames: locator.frames.map((frame)=>toEngineLocator(frame))
        } : {}
    };
}
function toEngineRefLocator(ref, frames = []) {
    if (!/^[a-zA-Z0-9_-]+$/.test(ref)) {
        throw Object.assign(new Error('Snapshot ref is invalid'), {
            code: 'STALE_SNAPSHOT_REF'
        });
    }
    return {
        kind: 'css',
        value: `aria-ref=${ref}`,
        ...frames.length ? {
            frames: frames.map((frame)=>({
                    ...frame
                }))
        } : {}
    };
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/engine-contract.ts

function createEngineCapabilities(input) {
    return {
        protocolVersion: (/* inlined export .COZE_BROWSER_PROTOCOL_VERSION */"3.0.0"),
        runtimeVersion: (/* inlined export .COZE_BROWSER_RUNTIME_VERSION */"0.5.0"),
        engines: {
            playwright: {
                available: input.available,
                commands: input.available ? [
                    ...input.commands
                ] : [],
                ...input.reason ? {
                    reason: input.reason
                } : {}
            },
            // DOM/Visual CUA use the trusted CDP transport directly and deliberately
            // remain available when only the Playwright injected ABI probe fails.
            'dom-cua': {
                available: true,
                commands: [
                    ...input.domCuaCommands
                ]
            },
            'visual-cua': {
                available: true,
                commands: [
                    ...input.visualCuaCommands
                ]
            }
        },
        features: {
            tabs: true,
            navigation: true,
            screenshot: true,
            dialog: true
        },
        compatibility: {
            electron: input.electron,
            chromium: input.chromium,
            playwright: input.playwright,
            injectedHash: input.injectedHash,
            stable: input.available,
            ...input.reason ? {
                reason: input.reason
            } : {}
        }
    };
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/download-dialog.ts
const DOWNLOAD_POLL_INTERVAL_MS = 100;
async function waitForDownload(options) {
    const { kernel, request, tab, timeoutMs, signal } = options;
    const deadline = Date.now() + timeoutMs;
    while(Date.now() < deadline){
        if (signal?.aborted) {
            throw Object.assign(new Error('Browser request cancelled'), {
                code: 'CANCELLED'
            });
        }
        const downloads = await kernel.call(request, 'downloads.list');
        const completed = [
            ...downloads
        ].reverse().find((item)=>item.tabId === tab.id && item.status === 'completed');
        if (completed) {
            return completed;
        }
        const failed = [
            ...downloads
        ].reverse().find((item)=>item.tabId === tab.id && [
                'cancelled',
                'interrupted'
            ].includes(item.status));
        if (failed) {
            throw new Error(`download ${failed.status}`);
        }
        await new Promise((resolve)=>setTimeout(resolve, DOWNLOAD_POLL_INTERVAL_MS));
    }
    throw Object.assign(new Error('download wait timed out'), {
        code: 'TIMEOUT'
    });
}
function handleDialog(options) {
    const { kernel, request, tab } = options;
    const dialogId = request.params?.dialogId;
    if (typeof dialogId !== 'string' || dialogId.length === 0) {
        return Promise.reject(Object.assign(new Error('dialogId must be a non-empty string'), {
            code: 'INVALID_REQUEST'
        }));
    }
    return kernel.call(request, 'dialog.handle', {
        tabId: tab.id,
        dialogId,
        accept: request.method === 'dialog.accept',
        ...typeof request.params?.promptText === 'string' ? {
            promptText: request.params.promptText
        } : {}
    });
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/cua-step-adapter.ts
const DOM_CUA_COMMANDS = [
    'snapshot',
    'click',
    'double-click',
    'type',
    'keypress',
    'scroll'
];
const VISUAL_CUA_COMMANDS = [
    'click',
    'double-click',
    'drag',
    'keypress',
    'move',
    'scroll',
    'type'
];
/** Converts the public viewport action shape to the trusted visual CUA API. */ function toVisualCuaActionParams(action) {
    switch(action.name){
        case 'click':
            return {
                action: action.name,
                ...action.point,
                ...action.button === undefined ? {} : {
                    button: action.button
                },
                ...action.modifiers ? {
                    keypress: action.modifiers
                } : {}
            };
        case 'double-click':
            return {
                action: action.name,
                ...action.point,
                ...action.modifiers ? {
                    keypress: action.modifiers
                } : {}
            };
        case 'move':
            return {
                action: action.name,
                ...action.point,
                ...action.modifiers ? {
                    keys: action.modifiers
                } : {}
            };
        case 'drag':
            return {
                action: action.name,
                path: action.path,
                ...action.modifiers ? {
                    keys: action.modifiers
                } : {}
            };
        case 'scroll':
            return {
                action: action.name,
                ...action.point ?? {},
                scrollX: action.deltaX,
                scrollY: action.deltaY,
                ...action.modifiers ? {
                    keypress: action.modifiers
                } : {}
            };
        case 'type':
            return {
                action: action.name,
                text: action.text
            };
        case 'keypress':
            return {
                action: action.name,
                keys: action.keys
            };
        default:
            throw new Error('Unsupported visual CUA action');
    }
}
/**
 * Converts a semantic action whose ref came from visible DOM into one or more
 * DOM CUA calls. Some semantic operations are intentionally unavailable for a
 * DOM ref because the DOM CUA primitive cannot preserve their semantics.
 */ function toDomCuaActionParams(action, nodeId) {
    switch(action.name){
        case 'click':
        case 'double-click':
            return [
                {
                    action: action.name,
                    nodeId
                }
            ];
        case 'check':
            return [
                {
                    action: 'click',
                    nodeId
                }
            ];
        case 'scroll':
            return [
                {
                    action: 'scroll',
                    nodeId,
                    x: action.deltaX,
                    y: action.deltaY
                }
            ];
        case 'type':
            return [
                {
                    action: 'click',
                    nodeId
                },
                {
                    action: 'type',
                    text: action.text
                }
            ];
        case 'fill':
            return [
                {
                    action: 'click',
                    nodeId
                },
                {
                    action: 'keypress',
                    keys: [
                        'ControlOrMeta',
                        'A'
                    ]
                },
                {
                    action: 'type',
                    text: action.text
                }
            ];
        case 'press':
            return [
                {
                    action: 'click',
                    nodeId
                },
                {
                    action: 'keypress',
                    keys: action.key.split('+')
                }
            ];
        case 'hover':
        case 'select':
        case 'upload':
            throw Object.assign(new Error(`Semantic ${action.name} is unavailable for a DOM ref`), {
                code: 'NOT_SUPPORTED'
            });
        default:
            throw new Error('Unsupported semantic DOM CUA action');
    }
}

;// CONCATENATED MODULE: external "node:async_hooks"
const external_node_async_hooks_namespaceObject = require("node:async_hooks");
;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/cdp-transport-pool.ts


function transportKey(authority, sessionId, tabId) {
    return `${authority}:${sessionId}:${tabId}`;
}
function refAuthority(request) {
    return request.refAuthority ?? request.capability;
}
class CdpTransportPool {
    port;
    config;
    transports = new Map();
    commandCapability = new external_node_async_hooks_namespaceObject.AsyncLocalStorage();
    constructor(port, config){
        this.port = port;
        this.config = config;
    }
    run(request, task) {
        return this.commandCapability.run(request.capability, task);
    }
    get(request, tab) {
        const authority = refAuthority(request);
        const key = transportKey(authority, request.sessionId, tab.id);
        const existing = this.transports.get(key);
        if (existing) {
            return existing;
        }
        const transport = new dist.CozeCdpTransport({
            port: {
                postMessage: (message)=>{
                    if (message && typeof message === 'object' && 'type' in message && typeof message.type === 'string' && message.type.startsWith('coze-cdp-')) {
                        const commandCapability = this.commandCapability.getStore();
                        this.port.postMessage({
                            ...message,
                            ...commandCapability ? {
                                commandCapability
                            } : {}
                        });
                        return;
                    }
                    this.port.postMessage(message);
                },
                on: (event, listener)=>this.port.on(event, listener),
                ...this.port.start ? {
                    start: ()=>this.port.start?.()
                } : {},
                ...this.port.removeListener ? {
                    removeListener: (event, listener)=>this.port.removeListener?.(event, listener)
                } : {}
            },
            capability: authority,
            sessionId: request.sessionId,
            tabId: tab.id,
            url: tab.url,
            chromiumVersion: this.config.versions.chromium,
            playwrightRevision: this.config.manifest.playwrightRevision
        });
        transport.onClose(()=>{
            if (this.transports.get(key) === transport) {
                this.transports.delete(key);
            }
        });
        this.transports.set(key, transport);
        return transport;
    }
    close(request, tabId) {
        const key = transportKey(refAuthority(request), request.sessionId, tabId);
        const transport = this.transports.get(key);
        this.transports.delete(key);
        transport?.close();
    }
    forget(capability, tabId) {
        const prefix = `${capability}:`;
        const suffix = `:${tabId}`;
        for (const key of this.transports.keys()){
            if (key.startsWith(prefix) && key.endsWith(suffix)) {
                this.transports.delete(key);
            }
        }
    }
    revoke(capability) {
        const prefix = `${capability}:`;
        for (const [key, transport] of this.transports){
            if (key.startsWith(prefix)) {
                this.transports.delete(key);
                transport.close();
            }
        }
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/action-settle.ts

const DEFAULT_QUIET_WINDOW_MS = 200;
const DEFAULT_MAX_SETTLE_MS = 1000;
const DEFAULT_POLL_INTERVAL_MS = 50;
function isCursor(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
function relevantEvent(event, trackedTabIds, closedTabIds) {
    if (event.type === 'tab-created') {
        if (event.tabId) {
            trackedTabIds.add(event.tabId);
        }
        return true;
    }
    if (event.type === 'active-tab-changed') {
        if (event.tabId) {
            trackedTabIds.add(event.tabId);
        }
        return true;
    }
    if (event.type === 'permission-resolved') {
        return true;
    }
    if (event.type === 'tab-closed' && event.tabId && trackedTabIds.has(event.tabId)) {
        closedTabIds.add(event.tabId);
        return true;
    }
    return event.tabId !== undefined && trackedTabIds.has(event.tabId);
}
function tabStateFingerprint(tabs, trackedTabIds, closedTabIds) {
    const tabsById = new Map(tabs.map((tab)=>[
            tab.id,
            tab
        ]));
    const states = [
        ...trackedTabIds
    ].sort().map((tabId)=>{
        const tab = tabsById.get(tabId);
        if (!tab) {
            return closedTabIds.has(tabId) ? {
                id: tabId,
                status: 'closed'
            } : {
                id: tabId,
                status: 'missing'
            };
        }
        return {
            id: tab.id,
            url: tab.url,
            status: tab.status,
            active: tab.active
        };
    });
    return {
        fingerprint: JSON.stringify(states),
        stable: states.every((state)=>state.status === 'ready' || state.status === 'complete' || state.status === 'closed')
    };
}
function validateEventPage(page, cursor, trackedTabIds, closedTabIds) {
    if (!isCursor(page.cursor) || page.cursor < cursor || page.truncated) {
        return undefined;
    }
    let hasActivity = false;
    for (const event of page.events){
        if (!isCursor(event.cursor) || event.cursor <= cursor || event.cursor > page.cursor) {
            return undefined;
        }
        hasActivity = relevantEvent(event, trackedTabIds, closedTabIds) || hasActivity;
    }
    return {
        cursor: page.cursor,
        hasActivity
    };
}
function abortableDelay(durationMs, signal) {
    throwIfCancelled(signal);
    return new Promise((resolve, reject)=>{
        const timer = setTimeout(()=>{
            signal?.removeEventListener('abort', abort);
            resolve();
        }, durationMs);
        const abort = ()=>{
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            reject(cancellationError(signal));
        };
        signal?.addEventListener('abort', abort, {
            once: true
        });
        if (signal?.aborted) {
            abort();
        }
    });
}
/**
 * Proves a short host-event quiet window after an action. The result is busy
 * when the event history or tab state cannot establish stability.
 */ async function settleBrowserAction(options) {
    const startedAt = Date.now();
    if (!isCursor(options.eventCursor)) {
        return {
            status: 'busy',
            durationMs: 0
        };
    }
    const quietWindowMs = options.quietWindowMs ?? DEFAULT_QUIET_WINDOW_MS;
    const maxSettleMs = options.maxSettleMs ?? DEFAULT_MAX_SETTLE_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const deadline = startedAt + maxSettleMs;
    let quietDeadline = startedAt + quietWindowMs;
    let cursor = options.eventCursor;
    const trackedTabIds = new Set([
        options.targetTabId
    ]);
    const closedTabIds = new Set();
    let previousTabFingerprint;
    let stableSnapshotCount = 0;
    while(Date.now() <= deadline){
        throwIfCancelled(options.signal);
        let page;
        try {
            page = await raceWithCancellation(options.primitives.eventsSince(cursor, options.signal), options.signal);
        } catch (error) {
            if (options.signal?.aborted) {
                throw error;
            }
            return {
                status: 'busy',
                durationMs: Date.now() - startedAt,
                eventCursor: cursor
            };
        }
        const validated = validateEventPage(page, cursor, trackedTabIds, closedTabIds);
        if (!validated) {
            return {
                status: 'busy',
                durationMs: Date.now() - startedAt,
                eventCursor: cursor
            };
        }
        cursor = validated.cursor;
        if (validated.hasActivity) {
            quietDeadline = Date.now() + quietWindowMs;
        }
        let stable = false;
        try {
            const tabs = await raceWithCancellation(options.primitives.listTabs(options.signal), options.signal);
            const tabState = tabStateFingerprint(tabs, trackedTabIds, closedTabIds);
            if (tabState.fingerprint === previousTabFingerprint) {
                stableSnapshotCount += 1;
            } else {
                previousTabFingerprint = tabState.fingerprint;
                stableSnapshotCount = 1;
                quietDeadline = Date.now() + quietWindowMs;
            }
            stable = tabState.stable && stableSnapshotCount >= 2;
        } catch (error) {
            if (options.signal?.aborted) {
                throw error;
            }
            return {
                status: 'busy',
                durationMs: Date.now() - startedAt,
                eventCursor: cursor
            };
        }
        const currentTime = Date.now();
        if (stable && currentTime >= quietDeadline) {
            const fence = await raceWithCancellation(options.primitives.eventsSince(cursor, options.signal), options.signal).catch(()=>undefined);
            const finalPage = fence && validateEventPage(fence, cursor, trackedTabIds, closedTabIds);
            if (!finalPage) {
                return {
                    status: 'busy',
                    durationMs: Date.now() - startedAt,
                    eventCursor: cursor
                };
            }
            cursor = finalPage.cursor;
            if (finalPage.hasActivity) {
                quietDeadline = Date.now() + quietWindowMs;
                previousTabFingerprint = undefined;
                stableSnapshotCount = 0;
                continue;
            }
            return {
                status: 'settled',
                durationMs: currentTime - startedAt,
                eventCursor: cursor
            };
        }
        if (currentTime >= deadline) {
            break;
        }
        await abortableDelay(Math.min(pollIntervalMs, deadline - currentTime), options.signal);
    }
    return {
        status: 'busy',
        durationMs: Math.max(0, Date.now() - startedAt),
        eventCursor: cursor
    };
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/operation-lifecycle.ts

const operation_lifecycle_DOWNLOAD_STATUSES = new Set([
    'awaiting-destination',
    'progressing',
    'completed',
    'cancelled',
    'interrupted'
]);
function operation_lifecycle_isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function operation_lifecycle_isNonEmptyString(value) {
    return typeof value === 'string' && value.length > 0;
}
function normalizeArray(value, normalizeItem) {
    if (!Array.isArray(value)) {
        return undefined;
    }
    const normalized = [];
    for (const item of value){
        const next = normalizeItem(item);
        if (next === undefined) {
            return undefined;
        }
        normalized.push(next);
    }
    return normalized;
}
function normalizeTab(value) {
    if (!operation_lifecycle_isRecord(value) || !operation_lifecycle_isNonEmptyString(value.id) || !operation_lifecycle_isNonEmptyString(value.sessionId) || typeof value.url !== 'string' || typeof value.title !== 'string' || typeof value.status !== 'string' || typeof value.active !== 'boolean' || value.visible !== undefined && typeof value.visible !== 'boolean') {
        return undefined;
    }
    return {
        id: value.id,
        sessionId: value.sessionId,
        url: value.url,
        title: value.title,
        status: value.status,
        active: value.active,
        ...value.visible !== undefined ? {
            visible: value.visible
        } : {}
    };
}
function normalizeNavigation(value) {
    if (!operation_lifecycle_isRecord(value) || !operation_lifecycle_isNonEmptyString(value.tabId) || typeof value.fromUrl !== 'string' || typeof value.toUrl !== 'string') {
        return undefined;
    }
    return {
        tabId: value.tabId,
        fromUrl: value.fromUrl,
        toUrl: value.toUrl
    };
}
function normalizeDownload(value) {
    if (!operation_lifecycle_isRecord(value) || !operation_lifecycle_isNonEmptyString(value.id) || !operation_lifecycle_isNonEmptyString(value.tabId) || typeof value.filename !== 'string' || typeof value.status !== 'string' || !operation_lifecycle_DOWNLOAD_STATUSES.has(value.status) || typeof value.receivedBytes !== 'number' || !Number.isSafeInteger(value.receivedBytes) || value.receivedBytes < 0 || typeof value.totalBytes !== 'number' || !Number.isSafeInteger(value.totalBytes) || value.totalBytes < 0) {
        return undefined;
    }
    return {
        id: value.id,
        tabId: value.tabId,
        filename: value.filename,
        status: value.status,
        receivedBytes: value.receivedBytes,
        totalBytes: value.totalBytes
    };
}
function normalizeDialog(value) {
    if (!operation_lifecycle_isRecord(value) || !operation_lifecycle_isNonEmptyString(value.id) || !operation_lifecycle_isNonEmptyString(value.tabId) || value.state !== 'opened' && value.state !== 'closed' || value.type !== undefined && typeof value.type !== 'string' || value.message !== undefined && typeof value.message !== 'string' || value.defaultPrompt !== undefined && typeof value.defaultPrompt !== 'string') {
        return undefined;
    }
    return {
        id: value.id,
        tabId: value.tabId,
        state: value.state,
        ...value.type !== undefined ? {
            type: value.type
        } : {},
        ...value.message !== undefined ? {
            message: value.message
        } : {},
        ...value.defaultPrompt !== undefined ? {
            defaultPrompt: value.defaultPrompt
        } : {}
    };
}
function normalizePermission(value) {
    if (!operation_lifecycle_isRecord(value) || !operation_lifecycle_isNonEmptyString(value.requestId) || value.tabId !== undefined && !operation_lifecycle_isNonEmptyString(value.tabId) || value.state !== 'requested' && value.state !== 'resolved') {
        return undefined;
    }
    return {
        requestId: value.requestId,
        ...value.tabId !== undefined ? {
            tabId: value.tabId
        } : {},
        state: value.state
    };
}
function normalizeOptionalTabId(value) {
    return value === undefined ? undefined : operation_lifecycle_isNonEmptyString(value) ? value : null;
}
function normalizeEffects(value) {
    if (!operation_lifecycle_isRecord(value)) {
        return undefined;
    }
    const createdTabs = normalizeArray(value.createdTabs, normalizeTab);
    const closedTabIds = normalizeArray(value.closedTabIds, (tabId)=>operation_lifecycle_isNonEmptyString(tabId) ? tabId : undefined);
    const navigations = normalizeArray(value.navigations, normalizeNavigation);
    const downloads = normalizeArray(value.downloads, normalizeDownload);
    const dialogs = normalizeArray(value.dialogs ?? [], normalizeDialog);
    const permissions = normalizeArray(value.permissions ?? [], normalizePermission);
    const activeTabBefore = normalizeOptionalTabId(value.activeTabBefore);
    const activeTabAfter = normalizeOptionalTabId(value.activeTabAfter);
    if (!createdTabs || !closedTabIds || !navigations || !downloads || !dialogs || !permissions || activeTabBefore === null || activeTabAfter === null) {
        return undefined;
    }
    return {
        createdTabs,
        closedTabIds,
        navigations,
        ...activeTabBefore !== undefined ? {
            activeTabBefore
        } : {},
        ...activeTabAfter !== undefined ? {
            activeTabAfter
        } : {},
        downloads,
        dialogs,
        permissions
    };
}
async function endBrowserOperation(kernel, request, tabId, operationId, status, traceId, operationCursor) {
    const cleanupRequest = status === 'cancelled' ? {
        ...request,
        timeoutMs: cancelledCleanupTimeout(request.timeoutMs)
    } : request;
    return Promise.resolve().then(()=>kernel.call(cleanupRequest, 'agent.operation.end', {
            tabId,
            operationId,
            status,
            ...traceId ? {
                traceId
            } : {},
            ...typeof operationCursor?.eventCursor === 'number' && Number.isSafeInteger(operationCursor.eventCursor) && operationCursor.eventCursor >= 0 ? {
                eventCursor: operationCursor.eventCursor
            } : {},
            ...operationCursor?.cursor !== undefined ? {
                cursor: operationCursor.cursor
            } : {}
        })).then((ended)=>{
        const effects = normalizeEffects(ended?.effects);
        const eventCursor = ended && validEventCursor(ended.eventCursor) ? ended.eventCursor : undefined;
        return {
            ...eventCursor === undefined ? {} : {
                eventCursor
            },
            ...effects === undefined ? {} : {
                effects
            }
        };
    }).catch(()=>({}));
}
function validEventCursor(value) {
    return Number.isSafeInteger(value) && value >= 0;
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/browser-operation.ts


const operationFactsByError = new WeakMap();
function isObjectLike(value) {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
}
function browser_operation_validEventCursor(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
function attachBrowserOperationFacts(error, facts) {
    const target = isObjectLike(error) ? error : Object.assign(new Error(String(error)), {
        cause: error
    });
    operationFactsByError.set(target, facts);
    if (Object.isExtensible(target)) {
        Object.assign(target, facts);
    }
    return target;
}
function getBrowserOperationFacts(error) {
    if (!isObjectLike(error)) {
        return undefined;
    }
    const stored = operationFactsByError.get(error);
    if (stored) {
        return stored;
    }
    const candidate = error;
    return typeof candidate.operationId === 'string' ? {
        operationId: candidate.operationId,
        ...typeof candidate.eventCursor === 'number' && Number.isSafeInteger(candidate.eventCursor) && candidate.eventCursor >= 0 ? {
            eventCursor: candidate.eventCursor
        } : {},
        ...candidate.effects !== undefined ? {
            effects: candidate.effects
        } : {}
    } : undefined;
}
async function waitForCancelledTaskCleanup(task, requestTimeoutMs) {
    let timer;
    try {
        await Promise.race([
            task.then(()=>undefined, ()=>undefined),
            new Promise((resolve)=>{
                timer = setTimeout(resolve, Math.max(1, cancelledCleanupTimeout(requestTimeoutMs)));
            })
        ]);
    } finally{
        clearTimeout(timer);
    }
}
async function runOperationTask(task, signal, requestTimeoutMs) {
    try {
        throwIfCancelled(signal);
        const taskPromise = task();
        try {
            const data = await raceWithCancellation(taskPromise, signal);
            throwIfCancelled(signal);
            return {
                ok: true,
                data,
                status: 'success'
            };
        } catch (error) {
            if (signal?.aborted) {
                await waitForCancelledTaskCleanup(taskPromise, requestTimeoutMs);
            }
            throw error;
        }
    } catch (error) {
        return signal?.aborted ? {
            ok: false,
            error: cancellationError(signal),
            status: 'cancelled'
        } : {
            ok: false,
            error,
            status: 'error'
        };
    }
}
async function runBrowserOperation(options) {
    const { kernel, request, signal, tab, task, onAbort, action, traceId } = options;
    const operationStart = kernel.call(request, 'agent.operation.start', {
        tabId: tab.id,
        action,
        traceId
    });
    let started;
    try {
        started = await raceWithCancellation(operationStart, signal);
    } catch (error) {
        if (signal?.aborted) {
            void operationStart.then((lateStart)=>endBrowserOperation(kernel, request, tab.id, lateStart.operationId, 'cancelled', traceId, lateStart)).catch(()=>undefined);
            throw cancellationError(signal);
        }
        throw error;
    }
    if (onAbort) {
        signal?.addEventListener('abort', onAbort, {
            once: true
        });
    }
    let outcome;
    try {
        outcome = await runOperationTask(()=>task(started), signal, request.timeoutMs);
    } finally{
        if (onAbort) {
            signal?.removeEventListener('abort', onAbort);
        }
    }
    const ended = await endBrowserOperation(kernel, request, tab.id, started.operationId, outcome.status, traceId, started);
    const facts = {
        operationId: started.operationId,
        ...ended.eventCursor === undefined && !browser_operation_validEventCursor(started.eventCursor) ? {} : {
            eventCursor: ended.eventCursor ?? started.eventCursor
        },
        ...ended.effects !== undefined ? {
            effects: ended.effects
        } : {}
    };
    if (!outcome.ok) {
        throw attachBrowserOperationFacts(outcome.error, facts);
    }
    return {
        data: outcome.data,
        ...facts
    };
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/dom-cua-utils.ts
const DOM_CUA_STATE_SYMBOL = 'coze.browser.dom-cua.state.v1';
function domCuaError(code, message) {
    return Object.assign(new Error(message), {
        code
    });
}
function evaluatedResult(response, context) {
    const result = response;
    if (result?.exceptionDetails || !result?.result) {
        throw domCuaError('TARGET_NOT_ACTIONABLE', `${context} could not be evaluated`);
    }
    return result;
}
function evaluatedValue(response, context) {
    return evaluatedResult(response, context).result?.value;
}
function finiteDomNumber(value, field) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw domCuaError('INVALID_REQUEST', `${field} must be a finite number`);
    }
    return value;
}
function requiredDomString(value, field) {
    if (typeof value !== 'string' || !value) {
        throw domCuaError('INVALID_REQUEST', `${field} must be a non-empty string`);
    }
    return value;
}
async function evaluateDomByValue(cdp, expression, context, contextId) {
    return evaluatedValue(await cdp.send('Runtime.evaluate', {
        expression,
        contextId,
        returnByValue: true
    }), context);
}
function domStateExpression(body, nodeId) {
    return String.raw`(() => {
    const state = globalThis[Symbol.for(${JSON.stringify(DOM_CUA_STATE_SYMBOL)})];
    const id = ${JSON.stringify(nodeId)};
    ${body}
  })()`;
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/dom-cua.ts
/* eslint-disable max-lines -- DOM capture and exact-node actions share one isolated-world contract */ 


const DOM_CUA_OBJECT_GROUP = 'coze-browser-dom-cua';
const DOM_CUA_WORLD_NAME = '__coze_dom_cua_v1';
const QUAD_COORDINATE_COUNT = 8;
const QUAD_STRIDE = 2;
const MAX_VISIBLE_DOM_TEXT_LENGTH = 500;
const MAX_VISIBLE_DOM_URL_LENGTH = 2048;
const MAX_VISIBLE_DOM_NODES = 2000;
const MAX_VISIBLE_DOM_INSPECTED_ELEMENTS = 10000;
const MAX_VISIBLE_DOM_ATTRIBUTES = 20;
const MAX_VISIBLE_DOM_ATTRIBUTE_NAME_LENGTH = 128;
const MAX_VISIBLE_DOM_ATTRIBUTE_VALUE_LENGTH = 500;
const MAX_VISIBLE_DOM_NORMALIZATION_INPUT_LENGTH = 1000;
const MAX_VISIBLE_DOM_SNAPSHOT_BYTES = 8388608;
/* eslint-disable max-lines-per-function, @coze-arch/max-line-per-function --
 * the emitted isolated-world script must remain self-contained */ function visibleDomExpression(generation) {
    return String.raw`(() => {
  const stateKey = Symbol.for('coze.browser.dom-cua.state.v1');
  const root = globalThis;
  const generation = ${JSON.stringify(generation)};
  root[stateKey]?.observer?.disconnect?.();
  const state = {
    generation, url: location.href, elements: new Map(), invalidated: false,
  };
  root[stateKey] = state;
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const interactiveRoles = new Set([
    'button', 'checkbox', 'combobox', 'link', 'listbox', 'menuitem',
    'menuitemcheckbox', 'menuitemradio', 'option', 'radio', 'scrollbar',
    'searchbox', 'slider', 'spinbutton', 'switch', 'tab', 'textbox', 'treeitem',
  ]);
  const allowedAttributes = new Set([
    'alt', 'aria-checked', 'aria-current', 'aria-describedby', 'aria-disabled',
    'aria-expanded', 'aria-haspopup', 'aria-label', 'aria-labelledby',
    'aria-pressed', 'aria-selected', 'autocomplete', 'checked', 'disabled',
    'href', 'id', 'max', 'min', 'multiple', 'name', 'placeholder', 'readonly',
    'required', 'role', 'selected', 'src', 'step', 'tabindex', 'title', 'type',
    'value',
  ]);
  const credentialPattern = new RegExp(
    '(?:2fa|access|api.?key|auth|card|cc-|credential|cvv|cvc|email|hidden|' +
      'login|mfa|mobile|otp|one.?time|pass|phone|pin|secret|security|tel|' +
      'token|user)',
    'i',
  );
  const safeUrlAttribute = value => {
    try {
      const parsed = new URL(value, location.href);
      if (!['http:', 'https:'].includes(parsed.protocol)) return parsed.protocol;
      parsed.username = '';
      parsed.password = '';
      parsed.search = '';
      parsed.hash = '';
      return parsed.href;
    } catch {
      return '';
    }
  };
  const implicitRole = element => {
    const tag = element.localName;
    if (tag === 'a' && element.hasAttribute('href')) return 'link';
    if (tag === 'button') return 'button';
    if (tag === 'textarea') return 'textbox';
    if (tag === 'select') return element.multiple ? 'listbox' : 'combobox';
    if (tag === 'option') return 'option';
    if (tag === 'summary') return 'button';
    if (tag === 'img') return 'img';
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'input') {
      const type = (element.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      if (type === 'search') return 'searchbox';
      if (type !== 'hidden') return 'textbox';
    }
    return '';
  };
  const isVisible = element => {
    if (!(element instanceof Element) || !element.isConnected) return false;
    if (element.closest('[hidden], [inert]')) return false;
    if (typeof element.checkVisibility === 'function' && !element.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    })) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' ||
        style.visibility === 'collapse' || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.bottom > 0 &&
      rect.left < viewport.width && rect.top < viewport.height;
  };
  const isInteractive = (element, role) => {
    const tag = element.localName;
    return (tag === 'a' && element.hasAttribute('href')) ||
      ['button', 'input', 'select', 'textarea', 'summary'].includes(tag) ||
      element.isContentEditable || element.tabIndex >= 0 ||
      interactiveRoles.has(role) || typeof element.onclick === 'function';
  };
  let truncated = false;
  const clippedText = value => {
    const source = String(value || '');
    const normalizationInput = source.slice(0, ${MAX_VISIBLE_DOM_NORMALIZATION_INPUT_LENGTH});
    const normalized = normalizationInput.replace(/\s+/g, ' ').trim();
    if (normalizationInput.length !== source.length) truncated = true;
    if (normalized.length > ${MAX_VISIBLE_DOM_TEXT_LENGTH}) truncated = true;
    return normalized.slice(0, ${MAX_VISIBLE_DOM_TEXT_LENGTH});
  };
  const accessibleName = element => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return clippedText(ariaLabel);
    const labelledByValue = element.getAttribute('aria-labelledby');
    const labelledBy = labelledByValue ? clippedText(labelledByValue) : '';
    if (labelledBy) {
      const value = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || '').join(' ');
      const labelledName = clippedText(value);
      if (labelledName) return labelledName;
    }
    let labels = '';
    let labelCount = 0;
    for (const label of element.labels || []) {
      if (labelCount >= ${MAX_VISIBLE_DOM_ATTRIBUTES}) {
        truncated = true;
        break;
      }
      labels += ' ' + clippedText(label.textContent);
      labelCount++;
    }
    return clippedText(labels || element.getAttribute('alt') ||
      element.getAttribute('title') || element.getAttribute('placeholder') ||
      element.innerText || element.textContent);
  };
  const fingerprintOf = element => {
    const role = (element.getAttribute('role') || implicitRole(element))
      .slice(0, ${MAX_VISIBLE_DOM_ATTRIBUTE_VALUE_LENGTH});
    const text = clippedText(element.innerText || element.textContent);
    const name = accessibleName(element);
    return JSON.stringify([
      element.localName, role, name, text, isInteractive(element, role),
      element.matches(':disabled') ||
        element.getAttribute('aria-disabled') === 'true',
      element.getAttribute('href') || '',
      element.getAttribute('type') || '',
    ]);
  };
  state.fingerprintOf = fingerprintOf;
  const url = location.href.slice(0, ${MAX_VISIBLE_DOM_URL_LENGTH});
  const title = document.title.slice(0, ${MAX_VISIBLE_DOM_TEXT_LENGTH});
  if (url.length !== location.href.length || title.length !== document.title.length) {
    truncated = true;
  }
  const nodes = [];
  const elements = function* () {
    if (!document.documentElement) return;
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT,
    );
    let element = walker.currentNode;
    while (element) {
      yield element;
      element = walker.nextNode();
    }
  };
  const encoder = new TextEncoder();
  let snapshotBytes = encoder.encode(JSON.stringify({
    url, title, viewport, nodes: [], truncated: false,
  })).byteLength;
  let inspectedElementCount = 0;
  for (const element of elements()) {
    if (inspectedElementCount >= ${MAX_VISIBLE_DOM_INSPECTED_ELEMENTS}) {
      truncated = true;
      break;
    }
    inspectedElementCount++;
    if (nodes.length >= ${MAX_VISIBLE_DOM_NODES}) {
      truncated = true;
      break;
    }
    if (!isVisible(element)) continue;
    const rawTag = element.localName;
    const tag = rawTag.slice(0, ${MAX_VISIBLE_DOM_ATTRIBUTE_NAME_LENGTH});
    if (tag.length !== rawTag.length) truncated = true;
    const rawRole = element.getAttribute('role') || implicitRole(element);
    const role = rawRole.slice(0, ${MAX_VISIBLE_DOM_ATTRIBUTE_VALUE_LENGTH});
    if (role.length !== rawRole.length) truncated = true;
    const interactive = isInteractive(element, role);
    const text = clippedText(element.innerText || element.textContent);
    const name = accessibleName(element);
    if (!interactive) continue;
    const rect = element.getBoundingClientRect();
    const attributes = Object.create(null);
    let inspectedAttributeCount = 0;
    const credentialDescriptor = [
      element.getAttribute('type'), element.getAttribute('autocomplete'),
      element.getAttribute('id'), element.getAttribute('name'),
      element.getAttribute('placeholder'), element.getAttribute('aria-label'),
      element.getAttribute('title'),
    ].filter(Boolean).join(' ');
    for (const attribute of element.attributes) {
      if (inspectedAttributeCount >= ${MAX_VISIBLE_DOM_ATTRIBUTES}) {
        truncated = true;
        break;
      }
      inspectedAttributeCount++;
      const normalizedName = attribute.name.toLowerCase();
      if (!allowedAttributes.has(normalizedName)) continue;
      if (normalizedName === 'value' &&
          (element.localName === 'input' || element.localName === 'textarea')) {
        const inputType = (element.getAttribute('type') || 'text')
          .trim().toLowerCase();
        const valueIsSafe = element.localName === 'input' &&
          ['color', 'range', 'search'].includes(inputType) &&
          !credentialPattern.test(credentialDescriptor);
        if (!valueIsSafe) continue;
      }
      const name = attribute.name.slice(0, ${MAX_VISIBLE_DOM_ATTRIBUTE_NAME_LENGTH});
      const safeValue = ['href', 'src'].includes(normalizedName)
        ? safeUrlAttribute(attribute.value)
        : attribute.value;
      const value = safeValue.slice(0, ${MAX_VISIBLE_DOM_ATTRIBUTE_VALUE_LENGTH});
      if (name.length !== attribute.name.length || value.length !== attribute.value.length) {
        truncated = true;
      }
      if (Object.prototype.hasOwnProperty.call(attributes, name)) {
        truncated = true;
        continue;
      }
      attributes[name] = value;
    }
    const nodeId = 'node-' + generation + '-' + (nodes.length + 1);
    const node = {
      node_id: nodeId,
      tag,
      role,
      name,
      text,
      interactive,
      focused: document.activeElement === element,
      disabled: element.matches(':disabled') || element.getAttribute('aria-disabled') === 'true',
      bounding_box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      attributes,
    };
    const nodeBytes = encoder.encode(JSON.stringify(node)).byteLength + 1;
    if (snapshotBytes + nodeBytes > ${MAX_VISIBLE_DOM_SNAPSHOT_BYTES}) {
      truncated = true;
      break;
    }
    state.elements.set(nodeId, { element, fingerprint: fingerprintOf(element) });
    nodes.push(node);
    snapshotBytes += nodeBytes;
  }
  state.observer = new MutationObserver(() => { state.invalidated = true; });
  state.observer.observe(document, {
    attributes: true, childList: true, characterData: true, subtree: true,
  });
  return { url, title, viewport, nodes, truncated };
})()`;
}
/* eslint-enable max-lines-per-function, @coze-arch/max-line-per-function --
 * restore repository function-length checks */ async function isolatedWorldContext(cdp) {
    const frameTree = await cdp.send('Page.getFrameTree');
    const frameId = frameTree?.frameTree?.frame?.id;
    if (!frameId) {
        throw domCuaError('TARGET_NOT_ACTIONABLE', 'DOM CUA main frame is unavailable');
    }
    const world = await cdp.send('Page.createIsolatedWorld', {
        frameId,
        worldName: DOM_CUA_WORLD_NAME,
        grantUniveralAccess: false
    });
    if (!Number.isSafeInteger(world?.executionContextId)) {
        throw domCuaError('TARGET_NOT_ACTIONABLE', 'DOM CUA isolated world is unavailable');
    }
    return world.executionContextId;
}
async function dom_cua_viewportCenter(cdp, contextId) {
    const viewport = await evaluateDomByValue(cdp, '({ width: window.innerWidth, height: window.innerHeight })', 'viewport', contextId);
    if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
        throw domCuaError('TARGET_NOT_ACTIONABLE', 'viewport is not actionable');
    }
    return {
        x: viewport.width / QUAD_STRIDE,
        y: viewport.height / QUAD_STRIDE
    };
}
// eslint-disable-next-line complexity -- preserves explicit stale/actionability checks
async function nodeCenter(cdp, nodeId, contextId) {
    const status = await evaluateDomByValue(cdp, domStateExpression(String.raw`
    if (!state || !state.elements.has(id)) return { status: 'unknown' };
    const entry = state.elements.get(id);
    if (!entry?.element?.isConnected || state.url !== location.href) {
      return { status: 'stale' };
    }
    return {
      status: state.fingerprintOf(entry.element) === entry.fingerprint
        ? 'ok'
        : 'stale',
    };
  `, nodeId), 'DOM CUA node status', contextId);
    if (status?.status === 'unknown') {
        throw domCuaError('STALE_SNAPSHOT_REF', `Unknown DOM CUA node_id: ${nodeId}`);
    }
    if (status?.status !== 'ok') {
        throw domCuaError('STALE_SNAPSHOT_REF', `DOM CUA node_id is stale: ${nodeId}`);
    }
    const remote = evaluatedResult(await cdp.send('Runtime.evaluate', {
        expression: domStateExpression(String.raw`
      return state.elements.get(id)?.element;
    `, nodeId),
        objectGroup: DOM_CUA_OBJECT_GROUP,
        contextId,
        returnByValue: false
    }), 'DOM CUA node');
    const objectId = remote.result?.objectId;
    if (!objectId || remote.result?.subtype === 'null') {
        throw domCuaError('STALE_SNAPSHOT_REF', `DOM CUA node_id is stale: ${nodeId}`);
    }
    try {
        await cdp.send('DOM.scrollIntoViewIfNeeded', {
            objectId
        });
        const response = await cdp.send('DOM.getContentQuads', {
            objectId
        });
        const quad = response?.quads?.find((candidate)=>candidate.length === QUAD_COORDINATE_COUNT && candidate.every(Number.isFinite));
        if (!quad) {
            throw domCuaError('TARGET_NOT_ACTIONABLE', `DOM CUA node_id has no visible content quad: ${nodeId}`);
        }
        const viewport = await evaluateDomByValue(cdp, '({ width: window.innerWidth, height: window.innerHeight })', 'viewport', contextId);
        const xs = quad.filter((_value, index)=>index % QUAD_STRIDE === 0);
        const ys = quad.filter((_value, index)=>index % QUAD_STRIDE === 1);
        const left = Math.max(0, Math.min(...xs));
        const right = Math.min(viewport.width, Math.max(...xs));
        const top = Math.max(0, Math.min(...ys));
        const bottom = Math.min(viewport.height, Math.max(...ys));
        if (right <= left || bottom <= top) {
            throw domCuaError('TARGET_NOT_ACTIONABLE', `DOM CUA node_id is outside the viewport: ${nodeId}`);
        }
        const point = {
            x: (left + right) / QUAD_STRIDE,
            y: (top + bottom) / QUAD_STRIDE
        };
        const hit = await evaluateDomByValue(cdp, domStateExpression(String.raw`
        const entry = state?.elements.get(id);
        const target = entry?.element;
        const hit = document.elementFromPoint(
          ${JSON.stringify(point.x)},
          ${JSON.stringify(point.y)},
        );
        return Boolean(state.url === location.href &&
          target && state.fingerprintOf(target) === entry.fingerprint && hit &&
          (hit === target || target.contains(hit)));
      `, nodeId), 'DOM CUA hit target', contextId);
        if (!hit) {
            throw domCuaError('TARGET_NOT_ACTIONABLE', `DOM CUA node_id is obscured: ${nodeId}`);
        }
        return point;
    } finally{
        await (cdp.sendCleanup ?? cdp.send)('Runtime.releaseObjectGroup', {
            objectGroup: DOM_CUA_OBJECT_GROUP
        }).catch(()=>undefined);
    }
}
/** Performs the DOM-ref identity, visibility, geometry and hit-test checks. */ async function preflightDomCuaNode(cdp, nodeId) {
    const contextId = await isolatedWorldContext(cdp);
    await nodeCenter(cdp, nodeId, contextId);
}
/** Reads state from the exact element retained by the current DOM snapshot. */ async function readDomCuaNodeValue(cdp, nodeId) {
    const contextId = await isolatedWorldContext(cdp);
    const result = await evaluateDomByValue(cdp, domStateExpression(String.raw`
      const entry = state?.elements.get(id);
      const element = entry?.element;
      if (!element?.isConnected || state.url !== location.href) {
        return { status: 'stale' };
      }
      if (element instanceof HTMLInputElement &&
          (element.type === 'checkbox' || element.type === 'radio')) {
        return { status: 'ok', value: element.checked };
      }
      if (element instanceof HTMLSelectElement && element.multiple) {
        return {
          status: 'ok',
          value: Array.from(element.selectedOptions, option => option.value),
        };
      }
      if (element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement) {
        return { status: 'ok', value: element.value };
      }
      return { status: 'ok', value: element.textContent || '' };
    `, nodeId), 'DOM CUA node value', contextId);
    if (result?.status !== 'ok') {
        throw domCuaError('STALE_SNAPSHOT_REF', `DOM CUA node_id is stale: ${nodeId}`);
    }
    return result.value;
}
async function captureVisibleDom(cdp) {
    const contextId = await isolatedWorldContext(cdp);
    const snapshot = await evaluateDomByValue(cdp, visibleDomExpression((0,external_node_crypto_namespaceObject.randomUUID)()), 'visible DOM snapshot', contextId);
    if (!snapshot || !Array.isArray(snapshot.nodes) || typeof snapshot.truncated !== 'boolean') {
        throw domCuaError('TARGET_NOT_ACTIONABLE', 'visible DOM snapshot is invalid');
    }
    return snapshot;
}
async function executeDomCuaAction(cdp, params) {
    const { action } = params;
    if (typeof action !== 'string') {
        throw domCuaError('INVALID_REQUEST', 'DOM CUA action is required');
    }
    switch(action){
        case 'click':
        case 'double-click':
            {
                const nodeId = requiredDomString(params.nodeId, 'nodeId');
                const contextId = await isolatedWorldContext(cdp);
                const point = await nodeCenter(cdp, nodeId, contextId);
                await executeVisualCuaAction(cdp, {
                    action,
                    ...point,
                    ...action === 'click' ? {
                        button: 1
                    } : {}
                });
                return;
            }
        case 'scroll':
            {
                const deltaX = finiteDomNumber(params.x, 'x');
                const deltaY = finiteDomNumber(params.y, 'y');
                const { nodeId } = params;
                if (nodeId !== undefined && (typeof nodeId !== 'string' || !nodeId)) {
                    throw domCuaError('INVALID_REQUEST', 'nodeId must be a non-empty string');
                }
                const contextId = await isolatedWorldContext(cdp);
                const point = typeof nodeId === 'string' ? await nodeCenter(cdp, nodeId, contextId) : await dom_cua_viewportCenter(cdp, contextId);
                await executeVisualCuaAction(cdp, {
                    action: 'scroll',
                    ...point,
                    scrollX: deltaX,
                    scrollY: deltaY
                });
                return;
            }
        case 'keypress':
            await executeVisualCuaAction(cdp, {
                action,
                keys: params.keys
            });
            return;
        case 'type':
            await executeVisualCuaAction(cdp, {
                action,
                text: params.text
            });
            return;
        default:
            throw domCuaError('INVALID_REQUEST', `Unsupported DOM CUA action: ${action}`);
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/browser-step.ts
/* eslint-disable max-lines, complexity --
 * versioned browser.step orchestration */ 


const PHASE_ORDER = [
    'queue',
    'resolve-target',
    'preflight',
    'act',
    'settle',
    'observe'
];
const ACTION_PHASE_ORDER = [
    'resolve-target',
    'preflight',
    'act',
    'settle'
];
const ERROR_CODES = new Set(Object.values(src_COZE_BROWSER_ERROR_CODES));
const SENSITIVE_DETAIL_FIELDS = new Set([
    'file',
    'filepath',
    'input',
    'key',
    'keys',
    'keypress',
    'path',
    'paths',
    'pathname',
    'text',
    'value',
    'values'
]);
const REDACTED_VALUE = '[REDACTED]';
const POSIX_ABSOLUTE_PATH_PATTERN = /(^|[^/:\w])\/(?!\/)[^\s"'`<>:,;)]*/gu;
const WINDOWS_ABSOLUTE_PATH_PATTERN = /(^|[^\w])[A-Za-z]:\\[^\s"'`<>|,;)]*/gu;
const EXPLICIT_SEMANTIC_MAX_CHARS = 65536;
const ACTION_SEMANTIC_MAX_CHARS = 32768;
function publishedObservations(observations) {
    return observations.filter((observation)=>observation.refs === 'published');
}
function diagnosticObservations(observations) {
    return observations.filter((observation)=>observation.refs === 'none');
}
function browser_step_now() {
    return external_node_perf_hooks_namespaceObject.performance.timeOrigin + external_node_perf_hooks_namespaceObject.performance.now();
}
function elapsed(startedAt) {
    return Math.max(0, browser_step_now() - startedAt);
}
function safeDuration(value) {
    return Number.isFinite(value) && value >= 0 ? value : 0;
}
function isEventCursor(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
function updateEventCursor(state, value) {
    if (isEventCursor(value)) {
        state.eventCursor = Math.max(state.eventCursor, value);
    }
}
function fingerprintObservationValue(value) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    return (0,external_node_crypto_namespaceObject.createHash)('sha256').update(payload).digest('hex');
}
function isPotentiallyMutatingStepAction(action) {
    return Boolean(action && typeof action === 'object' && typeof action.name === 'string');
}
function emptyPhase(name) {
    return {
        name,
        status: 'skipped',
        durationMs: 0
    };
}
function createPhases() {
    return PHASE_ORDER.map(emptyPhase);
}
function setPhase(phases, name, status, durationMs) {
    const index = PHASE_ORDER.indexOf(name);
    // The phase name is constrained by CozeBrowserStepPhaseName and the fixed
    // PHASE_ORDER tuple above.
    // eslint-disable-next-line security/detect-object-injection -- enum indexes the fixed phase tuple
    phases[index] = {
        name,
        status,
        durationMs: safeDuration(durationMs)
    };
}
function safeDetails(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}
function effectiveError(error, signal) {
    const candidate = error;
    if (typeof candidate?.code === 'string' && ERROR_CODES.has(candidate.code)) {
        return error;
    }
    const reason = signal?.reason;
    if (typeof reason?.code === 'string' && ERROR_CODES.has(reason.code)) {
        return signal?.reason;
    }
    if (signal?.aborted) {
        return Object.assign(new Error(typeof reason?.message === 'string' ? reason.message : 'Browser request cancelled'), {
            code: src_COZE_BROWSER_ERROR_CODES.cancelled
        });
    }
    return error;
}
function sensitiveActionValues(action) {
    let values;
    switch(action.name){
        case 'fill':
        case 'type':
            values = [
                action.text
            ];
            break;
        case 'press':
            values = [
                action.key
            ];
            break;
        case 'upload':
            values = [
                action.path
            ];
            break;
        case 'keypress':
            values = [
                ...action.keys,
                action.keys.join('+')
            ];
            break;
        case 'select':
            ({ values } = action);
            break;
        default:
            values = [];
    }
    return [
        ...new Set(values.filter((value)=>value.length > 0))
    ].sort((left, right)=>right.length - left.length);
}
function redactText(value, sensitiveValues) {
    const redactedInput = sensitiveValues.reduce((result, sensitive)=>sensitive.length > 0 ? result.split(sensitive).join(REDACTED_VALUE) : result, value);
    return redactedInput.replace(WINDOWS_ABSOLUTE_PATH_PATTERN, `$1${REDACTED_VALUE}`).replace(POSIX_ABSOLUTE_PATH_PATTERN, `$1${REDACTED_VALUE}`);
}
function redactDetails(value, sensitiveValues, field) {
    if (field && SENSITIVE_DETAIL_FIELDS.has(field.toLowerCase())) {
        return REDACTED_VALUE;
    }
    if (typeof value === 'string') {
        return redactText(value, sensitiveValues);
    }
    if (Array.isArray(value)) {
        return value.map((item)=>redactDetails(item, sensitiveValues));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item])=>[
                redactText(key, sensitiveValues),
                redactDetails(item, sensitiveValues, key)
            ]));
    }
    return value;
}
function redactObservationValue(value, sensitiveValues) {
    if (typeof value === 'string') {
        return sensitiveValues.reduce((result, sensitive)=>sensitive.length > 0 ? result.split(sensitive).join(REDACTED_VALUE) : result, value);
    }
    if (Array.isArray(value)) {
        return value.map((item)=>redactObservationValue(item, sensitiveValues));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item])=>[
                key,
                redactObservationValue(item, sensitiveValues)
            ]));
    }
    return value;
}
function redactDiagnosticObservation(observation, sensitiveValues) {
    if (observation.kind === 'semantic') {
        return {
            ...observation,
            value: redactObservationValue(observation.value, sensitiveValues)
        };
    }
    return {
        ...observation,
        value: redactObservationValue(observation.value, sensitiveValues)
    };
}
function inferredErrorCode(error, phase) {
    if (typeof error.code === 'string' && ERROR_CODES.has(error.code)) {
        return error.code;
    }
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : String(error).toLowerCase();
    if (message.includes('strict mode violation')) {
        return src_COZE_BROWSER_ERROR_CODES.strictModeViolation;
    }
    if (message.includes('timed out') || message.includes('timeout')) {
        return src_COZE_BROWSER_ERROR_CODES.timeout;
    }
    if (message.includes('cancelled') || message.includes('aborted')) {
        return src_COZE_BROWSER_ERROR_CODES.cancelled;
    }
    return phase === 'act' ? src_COZE_BROWSER_ERROR_CODES.actionDispatchFailed : src_COZE_BROWSER_ERROR_CODES.internal;
}
function toStepError(error, phase, traceId, action, actionOutcome, refConsumed = false) {
    const candidate = effectiveError(error);
    const code = inferredErrorCode(candidate, phase);
    const sensitiveValues = action ? sensitiveActionValues(action) : [];
    const rawDetails = safeDetails(candidate.details);
    const details = {
        ...rawDetails ? redactDetails(rawDetails, sensitiveValues) : {},
        ...action ? {
            actionEngine: action.engine,
            actionName: action.name
        } : {},
        ...actionOutcome === 'unknown' ? {
            outcome: 'unknown-after-dispatch'
        } : {},
        ...action && refConsumed && actionOutcome === 'not-dispatched' && (phase === 'resolve-target' || phase === 'preflight') ? {
            outcome: 'not-dispatched',
            refConsumed: true
        } : {}
    };
    const policy = getCozeBrowserErrorPolicy(code, getCozeBrowserErrorPolicyVariant(details));
    const rawMessage = typeof candidate.message === 'string' ? candidate.message : String(error);
    return {
        code,
        message: redactText(rawMessage, sensitiveValues),
        ...policy,
        phase,
        traceId,
        ...Object.keys(details).length > 0 ? {
            details
        } : {}
    };
}
function phaseFromError(error, fallback) {
    const phase = error?.phase;
    return typeof phase === 'string' && PHASE_ORDER.includes(phase) ? phase : fallback;
}
function actionOutcomeFromError(error, phases) {
    const candidate = error;
    if (candidate?.actionOutcome === 'not-dispatched' || candidate?.actionOutcome === 'dispatched' || candidate?.actionOutcome === 'unknown') {
        return candidate.actionOutcome;
    }
    const details = safeDetails(candidate?.details);
    if (details?.outcome === 'unknown-after-dispatch' || details?.outcome === 'unknown' || details?.dispatchState === 'unknown') {
        return 'unknown';
    }
    const act = phases.find((item)=>item.name === 'act');
    const settle = phases.find((item)=>item.name === 'settle');
    if (act?.status === 'settled' || settle?.status === 'settled' || settle?.status === 'blocked' || settle?.status === 'busy') {
        return 'dispatched';
    }
    return act?.status === 'blocked' ? 'unknown' : 'not-dispatched';
}
function partialActionResult(error, phases) {
    const candidate = error;
    return {
        actionOutcome: actionOutcomeFromError(error, phases),
        ...candidate?.refConsumed === true ? {
            refConsumed: true
        } : {},
        ...candidate?.effects ? {
            effects: candidate.effects
        } : {},
        ...candidate?.settle ? {
            settle: candidate.settle
        } : {},
        ...candidate?.nextTab ? {
            nextTab: candidate.nextTab
        } : {},
        ...isEventCursor(candidate?.eventCursor) ? {
            eventCursor: candidate.eventCursor
        } : {},
        error
    };
}
function observationOptions(kind, refs, maxChars) {
    return {
        refs,
        ...kind === 'semantic' && maxChars !== undefined ? {
            maxChars
        } : {}
    };
}
function assertObservation(observation, expectedKind, expectedRefs, tabId) {
    const refs = expectedRefs === 'actionable' ? 'published' : 'none';
    if (observation.kind !== expectedKind || observation.refs !== refs || observation.tab.id !== tabId) {
        throw Object.assign(new Error('Browser observation is inconsistent'), {
            code: src_COZE_BROWSER_ERROR_CODES.observationInconsistent,
            details: {
                expectedKind,
                actualKind: observation.kind,
                expectedRefs: refs,
                actualRefs: observation.refs,
                expectedTabId: tabId,
                actualTabId: observation.tab.id
            }
        });
    }
}
async function captureObservation(options, state, kind, refs, maxChars) {
    const observation = await options.primitives.observe(kind, observationOptions(kind, refs, maxChars), refs === 'diagnostic' ? undefined : options.signal);
    assertObservation(observation, kind, refs, state.resultTab.id);
    updateEventCursor(state, observation.eventCursor);
    state.after.push(observation);
    return observation;
}
async function refreshEventCursor(options, state, signal) {
    try {
        updateEventCursor(state, await options.primitives.eventCursor(signal));
    } catch (error) {
        // Cursor collection is best-effort and must not replace the step outcome.
        void error;
    }
}
function browser_step_trace(options, state, phases, startedAt, error) {
    return {
        id: options.traceId,
        targetTabId: options.tab.id,
        resultTabId: state.resultTab.id,
        status: error ? error.code === src_COZE_BROWSER_ERROR_CODES.cancelled ? 'cancelled' : 'error' : 'success',
        startedAt,
        durationMs: elapsed(startedAt),
        phases
    };
}
function failureResult(options, state, phases, startedAt, error) {
    const sensitiveValues = options.step.kind === 'act' ? sensitiveActionValues(options.step.action) : [];
    const diagnosticAfter = diagnosticObservations(state.after).map((observation)=>redactDiagnosticObservation(observation, sensitiveValues));
    return {
        schemaVersion: (/* inlined export .COZE_BROWSER_STEP_SCHEMA_VERSION */1),
        ok: false,
        outcome: 'failed',
        eventCursor: state.eventCursor,
        trace: browser_step_trace(options, state, phases, startedAt, error),
        error,
        ...state.actionOutcome ? {
            actionOutcome: state.actionOutcome
        } : {},
        ...state.effects ? {
            effects: state.effects
        } : {},
        ...state.settle ? {
            settle: state.settle
        } : {},
        ...diagnosticAfter.length > 0 ? {
            after: diagnosticAfter
        } : {}
    };
}
function successResult(options, state, phases, startedAt) {
    const base = {
        schemaVersion: (/* inlined export .COZE_BROWSER_STEP_SCHEMA_VERSION */1),
        ok: true,
        eventCursor: state.eventCursor,
        trace: browser_step_trace(options, state, phases, startedAt),
        ...state.effects ? {
            effects: state.effects
        } : {},
        ...publishedObservations(state.after).length > 0 ? {
            after: publishedObservations(state.after)
        } : {}
    };
    if (options.step.kind === 'observe') {
        const [firstObservation, ...remainingObservations] = publishedObservations(state.after);
        if (!firstObservation) {
            throw new Error('Successful observe step requires an observation');
        }
        return {
            ...base,
            outcome: 'observed',
            after: [
                firstObservation,
                ...remainingObservations
            ]
        };
    }
    if (options.step.kind === 'wait') {
        return {
            ...base,
            outcome: 'matched',
            settle: {
                ...state.settle ?? {
                    durationMs: 0
                },
                status: 'settled'
            }
        };
    }
    return {
        ...base,
        outcome: 'acted',
        actionOutcome: 'dispatched',
        ...state.settle ? {
            settle: state.settle
        } : {}
    };
}
function firstBlockedActionPhase(phases) {
    return ACTION_PHASE_ORDER.find((name)=>phases.find((item)=>item.name === name)?.status === 'blocked');
}
function createActionReporter(phases) {
    let nextIndex = 0;
    let terminal = false;
    return (name, report)=>{
        const index = ACTION_PHASE_ORDER.indexOf(name);
        if (index < nextIndex || index > nextIndex) {
            throw Object.assign(new Error(`Invalid browser action phase order: ${name}`), {
                code: src_COZE_BROWSER_ERROR_CODES.internal,
                phase: name
            });
        }
        if (terminal && report.status !== 'skipped') {
            throw Object.assign(new Error(`Browser action phase ${name} must be skipped after a blocked phase`), {
                code: src_COZE_BROWSER_ERROR_CODES.internal,
                phase: name
            });
        }
        if (!terminal && report.status === 'skipped') {
            throw Object.assign(new Error(`Browser action phase ${name} cannot be skipped before a blocked phase`), {
                code: src_COZE_BROWSER_ERROR_CODES.internal,
                phase: name
            });
        }
        setPhase(phases, name, report.status, report.durationMs);
        terminal = terminal || report.status === 'blocked';
        nextIndex += 1;
    };
}
function assertSuccessfulActionPhases(phases) {
    const incomplete = ACTION_PHASE_ORDER.find((name)=>{
        const current = phases.find((item)=>item.name === name);
        return !current || (name === 'settle' ? current.status !== 'settled' && current.status !== 'busy' : current.status !== 'settled');
    });
    if (incomplete) {
        throw Object.assign(new Error(`Browser action primitive did not settle phase: ${incomplete}`), {
            code: src_COZE_BROWSER_ERROR_CODES.internal,
            phase: incomplete
        });
    }
}
async function executeObserve(options, state, phases) {
    const phaseStartedAt = browser_step_now();
    try {
        await captureObservation(options, state, options.step.kind === 'observe' ? options.step.observation : 'semantic', 'actionable', options.step.kind === 'observe' && options.step.observation === 'semantic' ? EXPLICIT_SEMANTIC_MAX_CHARS : ACTION_SEMANTIC_MAX_CHARS);
        setPhase(phases, 'observe', 'settled', elapsed(phaseStartedAt));
        return undefined;
    } catch (error) {
        setPhase(phases, 'observe', 'blocked', elapsed(phaseStartedAt));
        return toStepError(effectiveError(error, options.signal), 'observe', options.traceId);
    }
}
async function executeWait(options, state, phases) {
    if (options.step.kind !== 'wait') {
        return undefined;
    }
    const phaseStartedAt = browser_step_now();
    let waitResult;
    try {
        waitResult = await options.primitives.wait(options.step.condition, options.signal);
    } catch (error) {
        const candidate = error;
        state.settle = candidate?.settle;
        state.effects = candidate?.effects;
        if (candidate?.nextTab) {
            state.resultTab = candidate.nextTab;
        }
        updateEventCursor(state, candidate?.eventCursor);
        setPhase(phases, 'settle', 'blocked', elapsed(phaseStartedAt));
        return toStepError(effectiveError(error, options.signal), 'settle', options.traceId);
    }
    state.settle = waitResult.settle;
    state.effects = waitResult.effects;
    if (waitResult.nextTab) {
        state.resultTab = waitResult.nextTab;
    }
    updateEventCursor(state, waitResult.eventCursor);
    setPhase(phases, 'settle', waitResult.error ? 'blocked' : waitResult.settle.status, waitResult.settle.durationMs);
    if (waitResult.error) {
        return toStepError(effectiveError(waitResult.error, options.signal), 'settle', options.traceId);
    }
    if (waitResult.settle.status !== 'settled') {
        setPhase(phases, 'settle', 'blocked', waitResult.settle.durationMs);
        return toStepError(Object.assign(new Error('Browser wait did not settle'), {
            code: src_COZE_BROWSER_ERROR_CODES.timeout
        }), 'settle', options.traceId);
    }
    if (!options.step.after) {
        return undefined;
    }
    const observeStartedAt = browser_step_now();
    try {
        for (const kind of options.step.after){
            await captureObservation(options, state, kind, 'actionable', kind === 'semantic' ? EXPLICIT_SEMANTIC_MAX_CHARS : undefined);
        }
        setPhase(phases, 'observe', 'settled', elapsed(observeStartedAt));
        return undefined;
    } catch (error) {
        setPhase(phases, 'observe', 'blocked', elapsed(observeStartedAt));
        return toStepError(effectiveError(error, options.signal), 'observe', options.traceId);
    }
}
async function captureActionAfter(options, state, phases, mode) {
    if (options.step.kind !== 'act') {
        return undefined;
    }
    const diagnostic = mode !== 'configured-actionable';
    const after = mode === 'forced-diagnostic' ? 'semantic' : options.step.after ?? 'semantic';
    if (after === 'none') {
        return undefined;
    }
    const kind = after === 'dom' ? 'visible-dom' : 'semantic';
    const phaseStartedAt = browser_step_now();
    try {
        await captureObservation(options, state, kind, diagnostic ? 'diagnostic' : 'actionable', kind === 'semantic' ? ACTION_SEMANTIC_MAX_CHARS : undefined);
        setPhase(phases, 'observe', 'settled', elapsed(phaseStartedAt));
        return undefined;
    } catch (error) {
        setPhase(phases, 'observe', 'blocked', elapsed(phaseStartedAt));
        return toStepError(effectiveError(error, options.signal), 'observe', options.traceId, options.step.action, state.actionOutcome);
    }
}
async function executeAction(options, state, phases) {
    if (options.step.kind !== 'act') {
        return undefined;
    }
    const reporter = createActionReporter(phases);
    let result;
    try {
        result = await options.primitives.runAction(options.step.action, options.traceId, reporter, options.signal);
    } catch (error) {
        result = partialActionResult(error, phases);
    }
    state.actionOutcome = result.actionOutcome;
    state.effects = result.effects;
    if (result.nextTab) {
        state.resultTab = result.nextTab;
    }
    state.settle = result.settle ?? (()=>{
        const settlePhase = phases.find((item)=>item.name === 'settle');
        return settlePhase && settlePhase.status !== 'skipped' ? {
            status: settlePhase.status,
            durationMs: settlePhase.durationMs
        } : undefined;
    })();
    updateEventCursor(state, result.eventCursor);
    let actionError;
    try {
        if (!result.error) {
            assertSuccessfulActionPhases(phases);
        }
    } catch (error) {
        result.error = error;
    }
    if (result.error) {
        const errorPhase = firstBlockedActionPhase(phases) ?? phaseFromError(result.error, 'act');
        const current = phases.find((item)=>item.name === errorPhase);
        setPhase(phases, errorPhase, 'blocked', current?.durationMs ?? 0);
        actionError = toStepError(effectiveError(result.error, options.signal), errorPhase, options.traceId, options.step.action, state.actionOutcome, result.refConsumed === true && (errorPhase === 'resolve-target' || errorPhase === 'preflight'));
    } else if (result.actionOutcome !== 'dispatched') {
        const errorPhase = result.actionOutcome === 'unknown' ? 'act' : firstBlockedActionPhase(phases) ?? 'act';
        setPhase(phases, errorPhase, 'blocked', phases.find((item)=>item.name === errorPhase)?.durationMs ?? 0);
        actionError = toStepError(Object.assign(new Error('Browser action did not produce a dispatched outcome'), {
            code: src_COZE_BROWSER_ERROR_CODES.actionDispatchFailed
        }), errorPhase, options.traceId, options.step.action, result.actionOutcome);
    }
    const failedBeforeDispatch = Boolean(actionError) && state.actionOutcome === 'not-dispatched' && (actionError?.phase === 'resolve-target' || actionError?.phase === 'preflight');
    const observeMode = !actionError ? 'configured-actionable' : failedBeforeDispatch ? 'configured-diagnostic' : 'forced-diagnostic';
    const observeError = await captureActionAfter(options, state, phases, observeMode);
    return actionError ?? observeError;
}
async function executeQueuedStep(options, state, phases, queue) {
    setPhase(phases, 'queue', queue.waited ? 'busy' : 'settled', queue.durationMs);
    if (options.initialError !== undefined) {
        setPhase(phases, 'resolve-target', 'blocked', 0);
        if (options.step.kind === 'act') {
            state.actionOutcome = 'not-dispatched';
        }
        return toStepError(effectiveError(options.initialError, options.signal), 'resolve-target', options.traceId, options.step.kind === 'act' ? options.step.action : undefined, state.actionOutcome);
    }
    if (options.signal?.aborted) {
        setPhase(phases, 'resolve-target', 'blocked', 0);
        if (options.step.kind === 'act') {
            state.actionOutcome = 'not-dispatched';
        }
        return toStepError(effectiveError(options.signal.reason, options.signal), 'resolve-target', options.traceId, options.step.kind === 'act' ? options.step.action : undefined, state.actionOutcome);
    }
    if (options.step.kind === 'observe') {
        return executeObserve(options, state, phases);
    }
    if (options.step.kind === 'wait') {
        return executeWait(options, state, phases);
    }
    return executeAction(options, state, phases);
}
async function executeBrowserStep(options) {
    const startedAt = browser_step_now();
    const phases = createPhases();
    const state = {
        after: [],
        eventCursor: isEventCursor(options.eventCursor) ? options.eventCursor : 0,
        resultTab: options.tab
    };
    let error;
    const queueStartedAt = browser_step_now();
    try {
        error = await options.primitives.enqueue(async (queue)=>{
            await refreshEventCursor(options, state, options.signal);
            const stepError = await executeQueuedStep(options, state, phases, queue);
            await refreshEventCursor(options, state, undefined);
            return stepError;
        }, options.signal);
    } catch (queueError) {
        setPhase(phases, 'queue', 'blocked', elapsed(queueStartedAt));
        if (options.step.kind === 'act') {
            state.actionOutcome = 'not-dispatched';
        }
        error = toStepError(effectiveError(queueError, options.signal), 'queue', options.traceId, options.step.kind === 'act' ? options.step.action : undefined, state.actionOutcome);
        await refreshEventCursor(options, state, undefined);
    }
    return error ? failureResult(options, state, phases, startedAt, error) : successResult(options, state, phases, startedAt);
}
function createSemanticObservation(snapshot, tab, metadata) {
    return {
        kind: 'semantic',
        ...metadata,
        formatVersion: (/* inlined export .COZE_BROWSER_SNAPSHOT_FORMAT_VERSION */1),
        fingerprint: fingerprintObservationValue(snapshot),
        tab: {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            status: tab.status
        },
        value: snapshot
    };
}
function createVisibleDomObservation(snapshot, tab, metadata) {
    return {
        kind: 'visible-dom',
        ...metadata,
        formatVersion: (/* inlined export .COZE_BROWSER_DOM_SNAPSHOT_FORMAT_VERSION */1),
        fingerprint: fingerprintObservationValue(snapshot),
        tab: {
            id: tab.id,
            url: tab.url,
            title: tab.title,
            status: tab.status
        },
        value: snapshot
    };
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/browser-wait.ts
/* eslint-disable max-lines -- condition-specific polling is kept in one module */ 

const browser_wait_DEFAULT_POLL_INTERVAL_MS = 100;
function waitError(code, message, details) {
    return Object.assign(new Error(message), {
        code,
        ...getCozeBrowserErrorPolicy(code),
        ...details ? {
            details
        } : {}
    });
}
function unsupported(condition, missing) {
    return waitError('NOT_SUPPORTED', `Browser wait condition ${condition.kind} requires ${missing}`, {
        condition: condition.kind,
        missing
    });
}
function requirePrimitive(condition, name, primitive) {
    if (primitive === undefined) {
        throw unsupported(condition, name);
    }
    return primitive;
}
async function invoke(task, signal) {
    throwIfCancelled(signal);
    return raceWithCancellation(task(signal), signal);
}
function assertCursor(cursor, source) {
    if (!Number.isSafeInteger(cursor) || cursor < 0) {
        throw waitError('OBSERVATION_INCONSISTENT', `${source} returned an invalid event cursor`, {
            cursor
        });
    }
    return cursor;
}
function assertBoolean(value, source) {
    if (typeof value !== 'boolean') {
        throw waitError('OBSERVATION_INCONSISTENT', `${source} returned a non-boolean state`);
    }
    return value;
}
function stringMatches(actual, matcher) {
    return matcher.operator === 'equals' ? actual === matcher.value : actual.includes(matcher.value);
}
function countMatches(actual, matcher) {
    switch(matcher.operator){
        case 'eq':
            return actual === matcher.value;
        case 'gte':
            return actual >= matcher.value;
        case 'lte':
            return actual <= matcher.value;
        default:
            return false;
    }
}
function downloadStatusMatches(actual, expected) {
    if (expected === 'started') {
        return actual === 'awaiting-destination' || actual === 'progressing';
    }
    return actual === expected;
}
function eventProbe(options) {
    let cursor = assertCursor(options.initialCursor, 'wait condition');
    return async (signal)=>{
        const page = await invoke((currentSignal)=>options.eventsSince(cursor, currentSignal), signal);
        assertCursor(page.cursor, 'eventsSince');
        if (page.cursor < cursor || !Array.isArray(page.events)) {
            throw waitError('OBSERVATION_INCONSISTENT', 'eventsSince returned an invalid event page', {
                requestedCursor: cursor,
                returnedCursor: page.cursor
            });
        }
        if (typeof page.truncated !== 'boolean') {
            throw waitError('OBSERVATION_INCONSISTENT', 'eventsSince returned an invalid truncation marker');
        }
        if (page.truncated) {
            throw waitError('OBSERVATION_INCONSISTENT', 'Browser event history no longer covers the requested cursor', {
                condition: options.condition.kind,
                requestedCursor: cursor
            });
        }
        const matchedEvent = page.events.find((event)=>Number.isSafeInteger(event.cursor) && event.cursor > cursor && event.cursor <= page.cursor && options.matches(event));
        if (matchedEvent) {
            return {
                matched: true,
                eventCursor: page.cursor,
                ...matchedEvent.tab ? {
                    nextTab: matchedEvent.tab
                } : {}
            };
        }
        ({ cursor } = page);
        return {
            matched: false,
            eventCursor: cursor
        };
    };
}
async function navigationProbe(condition, primitives, signal) {
    if (primitives.eventsSince && (condition.since !== undefined || primitives.eventCursor !== undefined)) {
        const cursor = condition.since ?? await invoke(requirePrimitive(condition, 'eventCursor', primitives.eventCursor), signal);
        const target = await invoke(requirePrimitive(condition, 'refreshTab', primitives.refreshTab), signal);
        return eventProbe({
            condition,
            initialCursor: cursor,
            eventsSince: primitives.eventsSince,
            matches: (event)=>event.type === 'tab-navigated' && event.tabId === target.id
        });
    }
    if (condition.since !== undefined) {
        throw unsupported(condition, 'eventsSince');
    }
    const { refreshTab: refreshTabPrimitive } = primitives;
    const refreshTab = requirePrimitive(condition, 'refreshTab', refreshTabPrimitive);
    const baseline = await invoke(refreshTab, signal);
    return async (currentSignal)=>{
        const current = await invoke(refreshTab, currentSignal);
        return {
            matched: current.url !== baseline.url
        };
    };
}
async function snapshotNewTabProbe(condition, primitives, signal) {
    const listTabs = requirePrimitive(condition, 'listTabs', primitives.listTabs);
    const eventCursor = requirePrimitive(condition, 'eventCursor', primitives.eventCursor);
    const cursorBefore = assertCursor(await invoke(eventCursor, signal), 'eventCursor');
    if (cursorBefore !== condition.since) {
        throw unsupported(condition, 'eventsSince for a historical cursor');
    }
    const baseline = new Set((await invoke(listTabs, signal)).map((tab)=>tab.id));
    const cursorAfter = assertCursor(await invoke(eventCursor, signal), 'eventCursor');
    if (cursorAfter !== condition.since) {
        throw unsupported(condition, 'eventsSince for a racing cursor');
    }
    return async (currentSignal)=>{
        const tabs = await invoke(listTabs, currentSignal);
        const currentCursor = assertCursor(await invoke(eventCursor, currentSignal), 'eventCursor');
        const nextTab = tabs.find((tab)=>!baseline.has(tab.id));
        return {
            matched: currentCursor > condition.since && nextTab !== undefined,
            eventCursor: currentCursor,
            ...nextTab ? {
                nextTab
            } : {}
        };
    };
}
async function newTabProbe(condition, primitives, signal) {
    if (primitives.eventsSince) {
        return eventProbe({
            condition,
            initialCursor: condition.since,
            eventsSince: primitives.eventsSince,
            matches: (event)=>event.type === 'tab-created'
        });
    }
    return snapshotNewTabProbe(condition, primitives, signal);
}
async function snapshotDownloadProbe(condition, primitives, signal) {
    const refreshTab = requirePrimitive(condition, 'refreshTab', primitives.refreshTab);
    const listDownloads = requirePrimitive(condition, 'listDownloads', primitives.listDownloads);
    const eventCursor = requirePrimitive(condition, 'eventCursor', primitives.eventCursor);
    const target = await invoke(refreshTab, signal);
    const cursorBefore = assertCursor(await invoke(eventCursor, signal), 'eventCursor');
    if (cursorBefore !== condition.since) {
        throw unsupported(condition, 'eventsSince for a historical cursor');
    }
    const baseline = new Map((await invoke(listDownloads, signal)).filter((download)=>download.tabId === target.id).map((download)=>[
            download.id,
            download.status
        ]));
    const cursorAfter = assertCursor(await invoke(eventCursor, signal), 'eventCursor');
    if (cursorAfter !== condition.since) {
        throw unsupported(condition, 'eventsSince for a racing cursor');
    }
    return async (currentSignal)=>{
        const downloads = (await invoke(listDownloads, currentSignal)).filter((download)=>download.tabId === target.id);
        const currentCursor = assertCursor(await invoke(eventCursor, currentSignal), 'eventCursor');
        const matched = downloads.some((download)=>{
            const previousStatus = baseline.get(download.id);
            if (condition.state === 'started') {
                return previousStatus === undefined && downloadStatusMatches(download.status, condition.state);
            }
            return previousStatus !== download.status && downloadStatusMatches(download.status, condition.state);
        });
        return {
            matched: currentCursor > condition.since && matched,
            eventCursor: currentCursor
        };
    };
}
async function downloadProbe(condition, primitives, signal) {
    if (primitives.eventsSince) {
        const target = await invoke(requirePrimitive(condition, 'refreshTab', primitives.refreshTab), signal);
        return eventProbe({
            condition,
            initialCursor: condition.since,
            eventsSince: primitives.eventsSince,
            matches: (event)=>event.type === 'download-updated' && event.tabId === target.id && event.download !== undefined && downloadStatusMatches(event.download.status, condition.state)
        });
    }
    return snapshotDownloadProbe(condition, primitives, signal);
}
async function dialogProbe(condition, primitives, signal) {
    const eventsSince = requirePrimitive(condition, 'eventsSince', primitives.eventsSince);
    const target = await invoke(requirePrimitive(condition, 'refreshTab', primitives.refreshTab), signal);
    return eventProbe({
        condition,
        initialCursor: condition.since,
        eventsSince,
        matches: (event)=>event.type === `dialog-${condition.state}` && event.tabId === target.id && event.dialog?.state === condition.state
    });
}
async function createProbe(condition, primitives, signal) {
    switch(condition.kind){
        case 'url':
        case 'title':
            {
                const refreshTab = requirePrimitive(condition, 'refreshTab', primitives.refreshTab);
                return async (currentSignal)=>{
                    const tab = await invoke(refreshTab, currentSignal);
                    return {
                        matched: stringMatches(condition.kind === 'url' ? tab.url : tab.title, condition.matcher)
                    };
                };
            }
        case 'text':
            {
                const semanticText = requirePrimitive(condition, 'semanticText', primitives.semanticText);
                return async (currentSignal)=>{
                    const text = await invoke(semanticText, currentSignal);
                    if (typeof text !== 'string') {
                        throw waitError('OBSERVATION_INCONSISTENT', 'semanticText returned a non-string value');
                    }
                    const visible = text.includes(condition.value);
                    return {
                        matched: condition.state === 'visible' ? visible : !visible
                    };
                };
            }
        case 'ref-state':
            {
                const refState = requirePrimitive(condition, 'refState', primitives.refState);
                return async (currentSignal)=>({
                        matched: assertBoolean(await invoke((current)=>refState(condition.ref, condition.state, current), currentSignal), 'refState')
                    });
            }
        case 'query-count':
            {
                const queryCount = requirePrimitive(condition, 'queryCount', primitives.queryCount);
                return async (currentSignal)=>{
                    const count = await invoke((current)=>queryCount(condition.query, current), currentSignal);
                    if (!Number.isSafeInteger(count) || count < 0) {
                        throw waitError('OBSERVATION_INCONSISTENT', 'queryCount returned an invalid count', {
                            count
                        });
                    }
                    return {
                        matched: countMatches(count, condition.matcher)
                    };
                };
            }
        case 'navigation':
            return navigationProbe(condition, primitives, signal);
        case 'new-tab':
            return newTabProbe(condition, primitives, signal);
        case 'download':
            return downloadProbe(condition, primitives, signal);
        case 'dialog':
            return dialogProbe(condition, primitives, signal);
        default:
            throw waitError('INVALID_REQUEST', 'Unknown browser wait condition');
    }
}
function browser_wait_abortableDelay(durationMs, signal) {
    throwIfCancelled(signal);
    return new Promise((resolve, reject)=>{
        const timer = setTimeout(()=>{
            signal.removeEventListener('abort', abort);
            resolve();
        }, durationMs);
        const abort = ()=>{
            clearTimeout(timer);
            signal.removeEventListener('abort', abort);
            reject(cancellationError(signal));
        };
        signal.addEventListener('abort', abort, {
            once: true
        });
        if (signal.aborted) {
            abort();
        }
    });
}
async function runBrowserWait(options) {
    const pollIntervalMs = options.pollIntervalMs ?? browser_wait_DEFAULT_POLL_INTERVAL_MS;
    if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
        throw waitError('INVALID_REQUEST', 'timeoutMs must be a positive number');
    }
    if (!Number.isFinite(pollIntervalMs) || pollIntervalMs <= 0) {
        throw waitError('INVALID_REQUEST', 'pollIntervalMs must be a positive number');
    }
    const startedAt = Date.now();
    const controller = new AbortController();
    const forwardCancellation = ()=>{
        controller.abort(options.signal?.reason);
    };
    if (options.signal?.aborted) {
        forwardCancellation();
    } else {
        options.signal?.addEventListener('abort', forwardCancellation, {
            once: true
        });
    }
    const timeout = setTimeout(()=>{
        controller.abort(waitError('TIMEOUT', `Browser wait condition ${options.condition.kind} timed out`, {
            condition: options.condition.kind,
            timeoutMs: options.timeoutMs
        }));
    }, options.timeoutMs);
    try {
        throwIfCancelled(controller.signal);
        const probe = await createProbe(options.condition, options.primitives, controller.signal);
        while(true){
            const result = await probe(controller.signal);
            if (result.matched) {
                return {
                    matched: true,
                    status: 'settled',
                    durationMs: Math.max(0, Date.now() - startedAt),
                    ...result.eventCursor === undefined ? {} : {
                        eventCursor: result.eventCursor
                    },
                    ...result.nextTab ? {
                        nextTab: result.nextTab
                    } : {}
                };
            }
            await browser_wait_abortableDelay(pollIntervalMs, controller.signal);
        }
    } finally{
        clearTimeout(timeout);
        options.signal?.removeEventListener('abort', forwardCancellation);
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/ref-registry.ts

const DEFAULT_TOMBSTONE_TTL_MS = 30000;
const DEFAULT_MAX_TOMBSTONES = 4096;
const ID_ALLOCATION_ATTEMPTS = 8;
const REF_PREFIX_ID_LENGTH = 12;
function requiredString(value, field) {
    if (typeof value !== 'string' || value.length === 0) {
        throw new TypeError(`${field} must be a non-empty string`);
    }
    return value;
}
function normalizeScope(scope) {
    return Object.freeze({
        capability: requiredString(scope.capability, 'scope.capability'),
        sessionId: requiredString(scope.sessionId, 'scope.sessionId'),
        tabId: requiredString(scope.tabId, 'scope.tabId'),
        documentId: requiredString(scope.documentId, 'scope.documentId')
    });
}
function normalizeKind(kind) {
    if (kind !== 'semantic' && kind !== 'visible-dom') {
        throw new TypeError('kind must be semantic or visible-dom');
    }
    return kind;
}
function observationScopeKey(scope, kind) {
    return JSON.stringify([
        scope.capability,
        scope.sessionId,
        scope.tabId,
        kind
    ]);
}
function rawRefOf(target) {
    if (target.engine === 'playwright') {
        return requiredString(target.originalRef, 'target.originalRef');
    }
    if (target.engine === 'dom-cua') {
        return requiredString(target.originalNodeId, 'target.originalNodeId');
    }
    throw new TypeError('target.engine must be playwright or dom-cua');
}
function defaultRefPrefix(observationId) {
    const compactId = observationId.replace(/[^a-zA-Z0-9]/g, '').slice(0, REF_PREFIX_ID_LENGTH);
    const stableId = compactId || (0,external_node_crypto_namespaceObject.createHash)('sha256').update(observationId).digest('hex').slice(0, REF_PREFIX_ID_LENGTH);
    return `r${stableId}_`;
}
function freezeTarget(target) {
    const frames = target.engine === 'playwright' && target.frames ? Object.freeze(target.frames.map((frame)=>freezeLocator(frame))) : undefined;
    return Object.freeze({
        ...target,
        ...frames ? {
            frames
        } : {},
        ...target.metadata ? {
            metadata: Object.freeze({
                ...target.metadata
            })
        } : {}
    });
}
function freezeLocator(locator) {
    const copy = {
        ...locator,
        ...locator.frames ? {
            frames: locator.frames.map((frame)=>freezeLocator(frame))
        } : {}
    };
    Object.freeze(copy.frames);
    return Object.freeze(copy);
}
function staleSnapshotRef() {
    return Object.assign(new Error('Snapshot ref is stale; observe again'), {
        code: 'STALE_SNAPSHOT_REF'
    });
}
function scopeMatches(actual, expected) {
    return actual.scope.capability === expected.capability && actual.scope.sessionId === expected.sessionId && actual.scope.tabId === expected.tabId && actual.scope.documentId === expected.documentId && (expected.kind === undefined || actual.kind === expected.kind);
}
/**
 * Owns public snapshot refs and their authorization/document lifetime.
 * `begin` is side-effect free; only a successful `publish` replaces the prior
 * observation for the same authority/session/tab/kind.
 */ class RefRegistry {
    refs = new Map();
    observations = new Map();
    activeByScope = new Map();
    tombstones = new Map();
    tombstoneTtlMs;
    maxTombstones;
    now;
    createObservationId;
    constructor(options = {}){
        this.tombstoneTtlMs = options.tombstoneTtlMs ?? DEFAULT_TOMBSTONE_TTL_MS;
        this.maxTombstones = options.maxTombstones ?? DEFAULT_MAX_TOMBSTONES;
        if (!Number.isFinite(this.tombstoneTtlMs) || this.tombstoneTtlMs < 0) {
            throw new RangeError('tombstoneTtlMs must be a non-negative number');
        }
        if (!Number.isInteger(this.maxTombstones) || this.maxTombstones < 0) {
            throw new RangeError('maxTombstones must be a non-negative integer');
        }
        this.now = options.now ?? Date.now;
        this.createObservationId = options.createObservationId ?? external_node_crypto_namespaceObject.randomUUID;
    }
    begin(input) {
        this.pruneTombstones();
        const scope = normalizeScope(input.scope);
        const kind = normalizeKind(input.kind);
        const observationId = input.observationId === undefined ? this.allocateObservationId() : requiredString(input.observationId, 'observationId');
        if (this.observations.has(observationId)) {
            throw new Error(`Observation id is already registered: ${observationId}`);
        }
        const refPrefix = input.refPrefix === undefined ? defaultRefPrefix(observationId) : requiredString(input.refPrefix, 'refPrefix');
        return Object.freeze({
            scope,
            kind,
            observationId,
            refPrefix
        });
    }
    publish(input) {
        const descriptor = this.begin(input);
        const pending = [];
        const publicRefs = new Set();
        const refsByOriginal = new Map();
        for (const item of input.targets){
            const rawRef = rawRefOf(item.target);
            const suffix = item.publicSuffix === undefined ? rawRef : requiredString(item.publicSuffix, 'target.publicSuffix');
            const publicRef = `${descriptor.refPrefix}${suffix}`;
            if (publicRefs.has(publicRef) || refsByOriginal.has(rawRef)) {
                throw new Error('Published ref targets must be unique');
            }
            if (this.refs.has(publicRef) || this.tombstones.has(publicRef)) {
                throw new Error(`Public ref is already registered: ${publicRef}`);
            }
            const target = freezeTarget(item.target);
            publicRefs.add(publicRef);
            refsByOriginal.set(rawRef, publicRef);
            pending.push({
                publicRef,
                rawRef,
                target
            });
        }
        const record = {
            descriptor,
            publicRefs,
            state: 'active',
            pins: 0
        };
        const scopeKey = observationScopeKey(descriptor.scope, descriptor.kind);
        const previous = this.activeByScope.get(scopeKey);
        if (previous) {
            this.consumeRecord(previous);
        }
        this.observations.set(descriptor.observationId, record);
        this.activeByScope.set(scopeKey, record);
        for (const entry of pending){
            this.refs.set(entry.publicRef, {
                record,
                target: entry.target
            });
        }
        return Object.freeze({
            ...descriptor,
            refs: refsByOriginal
        });
    }
    resolve(publicRef, scope) {
        return this.resolveEntry(publicRef, scope).target;
    }
    pin(publicRef, scope) {
        const entry = this.resolveEntry(publicRef, scope);
        const { record } = entry;
        record.pins += 1;
        let released = false;
        return Object.freeze({
            publicRef,
            observationId: record.descriptor.observationId,
            scope: Object.freeze({
                ...record.descriptor.scope,
                kind: record.descriptor.kind
            }),
            target: entry.target,
            release: ()=>{
                if (released) {
                    return;
                }
                released = true;
                record.pins -= 1;
                if (record.state === 'consumed' && record.pins === 0) {
                    this.finalizeRecord(record);
                }
            }
        });
    }
    consumeTab(scope) {
        return this.consumeMatching(scope);
    }
    consumeNavigation(scope) {
        return this.consumeMatching(scope);
    }
    revoke(capability) {
        requiredString(capability, 'capability');
        this.pruneTombstones();
        let consumed = 0;
        for (const record of [
            ...this.observations.values()
        ]){
            if (record.descriptor.scope.capability === capability && this.consumeRecord(record)) {
                consumed += 1;
            }
        }
        return consumed;
    }
    resolveEntry(publicRef, scope) {
        this.pruneTombstones();
        if (typeof publicRef !== 'string' || publicRef.length === 0) {
            throw staleSnapshotRef();
        }
        const entry = this.refs.get(publicRef);
        if (!entry || entry.record.state !== 'active' || !scopeMatches(entry.record.descriptor, scope)) {
            throw staleSnapshotRef();
        }
        return entry;
    }
    consumeMatching(scope) {
        requiredString(scope.capability, 'scope.capability');
        requiredString(scope.sessionId, 'scope.sessionId');
        requiredString(scope.tabId, 'scope.tabId');
        this.pruneTombstones();
        let consumed = 0;
        for (const record of [
            ...this.observations.values()
        ]){
            const candidate = record.descriptor.scope;
            if (candidate.capability === scope.capability && candidate.sessionId === scope.sessionId && candidate.tabId === scope.tabId && this.consumeRecord(record)) {
                consumed += 1;
            }
        }
        return consumed;
    }
    consumeRecord(record) {
        if (record.state === 'consumed') {
            return false;
        }
        record.state = 'consumed';
        const key = observationScopeKey(record.descriptor.scope, record.descriptor.kind);
        if (this.activeByScope.get(key) === record) {
            this.activeByScope.delete(key);
        }
        for (const publicRef of record.publicRefs){
            this.addTombstone(publicRef);
        }
        if (record.pins === 0) {
            this.finalizeRecord(record);
        }
        return true;
    }
    finalizeRecord(record) {
        if (this.observations.get(record.descriptor.observationId) === record) {
            this.observations.delete(record.descriptor.observationId);
        }
        for (const publicRef of record.publicRefs){
            const entry = this.refs.get(publicRef);
            if (entry?.record === record) {
                this.refs.delete(publicRef);
            }
        }
    }
    addTombstone(publicRef) {
        if (this.tombstoneTtlMs === 0 || this.maxTombstones === 0) {
            return;
        }
        this.tombstones.delete(publicRef);
        this.tombstones.set(publicRef, this.now() + this.tombstoneTtlMs);
        while(this.tombstones.size > this.maxTombstones){
            const oldest = this.tombstones.keys().next().value;
            if (oldest === undefined) {
                break;
            }
            this.tombstones.delete(oldest);
        }
    }
    pruneTombstones() {
        const now = this.now();
        for (const [publicRef, expiresAt] of this.tombstones){
            if (expiresAt <= now) {
                this.tombstones.delete(publicRef);
            }
        }
    }
    allocateObservationId() {
        for(let attempt = 0; attempt < ID_ALLOCATION_ATTEMPTS; attempt += 1){
            const candidate = requiredString(this.createObservationId(), 'generated observationId');
            if (!this.observations.has(candidate)) {
                return candidate;
            }
        }
        throw new Error('Could not allocate a unique observation id');
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/playwright-engine.ts
/* eslint-disable max-lines -- owns engine, shared CDP, refs, queue and step lifecycles */ 
















const WRITE_METHODS = new Set([
    'tabs.new',
    'tabs.attach',
    'tabs.detach',
    'tabs.activate',
    'tabs.close',
    'tab.goto',
    'tab.back',
    'tab.forward',
    'tab.reload',
    'dialog.accept',
    'dialog.dismiss'
]);
const WORKSPACE_WRITE_METHODS = new Set([
    'tabs.new',
    'tabs.attach',
    'tabs.detach',
    'tabs.activate'
]);
const PLAYWRIGHT_COMMANDS = [
    'snapshot',
    'click',
    'hover',
    'fill',
    'type',
    'press',
    'scroll',
    'check',
    'select',
    'wait',
    'upload'
];
const DEFAULT_STEP_EXECUTION_TIMEOUT_MS = 15000;
const ACTION_STATE_POLL_INTERVAL_MS = 50;
const ACTION_STATE_TIMEOUT_MS = 1000;
const DIAGNOSTIC_TIMEOUT_MS = 1000;
const CAPABILITIES_PROBE_TIMEOUT_MS = 5000;
const MAX_RUNTIME_TIMEOUT_MS = 30000;
const DOCUMENT_WORLD_NAME = '__coze_ref_document_v1';
function playwright_engine_elapsed(startedAt) {
    return Math.max(0, external_node_perf_hooks_namespaceObject.performance.now() - startedAt);
}
function validCursor(value) {
    return Number.isSafeInteger(value) && value >= 0;
}
function playwright_engine_actionError(error, phase, actionOutcome, settle, refConsumed) {
    const target = error && (typeof error === 'object' || typeof error === 'function') ? error : Object.assign(new Error(String(error)), {
        cause: error
    });
    if (Object.isExtensible(target)) {
        Object.assign(target, {
            phase,
            actionOutcome,
            ...settle ? {
                settle
            } : {},
            ...refConsumed === true ? {
                refConsumed: true
            } : {}
        });
    }
    return target;
}
function valuesEqual(actual, expected) {
    if (Array.isArray(actual)) {
        return actual.length === expected.length && // eslint-disable-next-line security/detect-object-injection -- bounded array index from iteration
        actual.every((value, index)=>value === expected[index]);
    }
    return expected.length === 1 && actual === expected[0];
}
class PlaywrightBrowserEngine {
    kernel;
    port;
    config;
    writeQueues = new Map();
    engines = new Map();
    cdpTransports;
    refs = new RefRegistry();
    compatibilityVerified = false;
    constructor(kernel, port, config){
        this.kernel = kernel;
        this.port = port;
        this.config = config;
        this.cdpTransports = new CdpTransportPool(port, config);
        port.on('message', this.handlePortMessage);
    }
    async handle(request, signal) {
        return this.cdpTransports.run(request, async ()=>{
            if (request.method === 'browser.step') {
                return this.handleStep(request, signal);
            }
            throwIfCancelled(signal);
            if (!WRITE_METHODS.has(request.method)) {
                return this.execute(request, signal);
            }
            const preparedRequest = await this.prepareWriteRequest(request, signal);
            return this.enqueue(this.writeQueueKey(preparedRequest), async ()=>this.execute(preparedRequest, signal), signal);
        });
    }
    async prepareWriteRequest(request, signal) {
        if (WORKSPACE_WRITE_METHODS.has(request.method)) {
            return request;
        }
        const tab = await raceWithCancellation(this.selectedTab(request), signal);
        return {
            ...request,
            params: {
                ...request.params ?? {},
                tabId: tab.id
            }
        };
    }
    writeQueueKey(request) {
        if (WORKSPACE_WRITE_METHODS.has(request.method)) {
            return `${this.refAuthority(request)}:${request.sessionId}:workspace`;
        }
        return `${this.refAuthority(request)}:${request.sessionId}:${String(request.params?.tabId)}`;
    }
    async enqueue(key, task, signal) {
        const queuedAt = external_node_perf_hooks_namespaceObject.performance.now();
        const previous = this.writeQueues.get(key);
        let started = false;
        const next = (previous ?? Promise.resolve()).catch(()=>undefined).then(()=>{
            throwIfCancelled(signal);
            started = true;
            return task({
                waited: previous !== undefined,
                durationMs: playwright_engine_elapsed(queuedAt)
            });
        });
        this.writeQueues.set(key, next);
        void next.finally(()=>{
            if (this.writeQueues.get(key) === next) {
                this.writeQueues.delete(key);
            }
        }).catch(()=>undefined);
        if (!signal) {
            return next;
        }
        return new Promise((resolve, reject)=>{
            let completed = false;
            const finish = (callback)=>{
                if (completed) {
                    return;
                }
                completed = true;
                signal.removeEventListener('abort', abortWhileQueued);
                callback();
            };
            const abortWhileQueued = ()=>{
                if (!started) {
                    finish(()=>reject(cancellationError(signal)));
                }
            };
            signal.addEventListener('abort', abortWhileQueued, {
                once: true
            });
            next.then((value)=>finish(()=>resolve(value)), (error)=>finish(()=>reject(error)));
            if (signal.aborted) {
                abortWhileQueued();
            }
        });
    }
    // eslint-disable-next-line complexity -- exhaustive RPC dispatch table
    async execute(request, signal) {
        throwIfCancelled(signal);
        const params = request.params ?? {};
        switch(request.method){
            case 'status':
                return this.kernel.call(request, 'status');
            case 'capabilities':
                return this.capabilities(request, signal);
            case 'tabs.list':
            case 'tabs.new':
            case 'tabs.get':
            case 'tabs.selected':
            case 'tabs.attach':
            case 'tabs.detach':
            case 'tabs.activate':
                return this.kernel.call(request, request.method, params);
            case 'tab.screenshot':
                return this.kernel.call(request, request.method, params, signal);
            case 'tab.goto':
                {
                    const tab = await raceWithCancellation(this.selectedTab(request), signal);
                    const result = await this.kernel.call(request, request.method, params, signal);
                    this.refs.consumeNavigation(this.refTabScope(request, tab));
                    return result;
                }
            case 'tab.back':
            case 'tab.forward':
            case 'tab.reload':
                {
                    const tab = await this.selectedTab(request);
                    const result = await this.kernel.call(request, request.method, params);
                    this.refs.consumeNavigation(this.refTabScope(request, tab));
                    return result;
                }
            case 'tabs.close':
                {
                    const tab = await this.selectedTab(request);
                    this.refs.consumeTab(this.refTabScope(request, tab));
                    await this.closeEngine(request, tab.id);
                    this.cdpTransports.close(request, tab.id);
                    return this.kernel.call(request, request.method, params);
                }
            case 'dialog.accept':
            case 'dialog.dismiss':
                return handleDialog({
                    kernel: this.kernel,
                    request,
                    tab: await this.selectedTab(request)
                });
            default:
                throw new Error(`Unsupported Browser Runtime method: ${String(request.method)}`);
        }
    }
    async handleStep(request, signal) {
        if (!isCozeBrowserStepRequest(request.params)) {
            throw Object.assign(new Error('Invalid browser.step request'), {
                code: 'INVALID_REQUEST',
                category: 'request',
                recovery: 'none'
            });
        }
        const step = request.params;
        const executionTimeoutMs = step.executionTimeoutMs ?? DEFAULT_STEP_EXECUTION_TIMEOUT_MS;
        const timeoutController = new AbortController();
        const timeout = setTimeout(()=>timeoutController.abort(Object.assign(new Error('Browser step execution timed out'), {
                code: 'TIMEOUT',
                retryable: true
            })), Math.min(executionTimeoutMs, (/* inlined export .COZE_BROWSER_MAX_STEP_EXECUTION_TIMEOUT_MS */28000)));
        const executionSignal = signal ? AbortSignal.any([
            signal,
            timeoutController.signal
        ]) : timeoutController.signal;
        const executionRequest = {
            ...request,
            timeoutMs: executionTimeoutMs
        };
        try {
            return await this.runStep(executionRequest, step, executionSignal);
        } finally{
            clearTimeout(timeout);
        }
    }
    async runStep(request, step, signal) {
        let targetTab;
        let initialError;
        try {
            targetTab = await raceWithCancellation(this.selectedTab(request, step.tabId), signal);
        } catch (error) {
            initialError = error;
            targetTab = {
                id: step.tabId ?? 'unknown',
                sessionId: request.sessionId,
                url: '',
                title: '',
                status: 'unknown',
                active: false
            };
        }
        let resultTab = targetTab;
        const queueKey = `${this.refAuthority(request)}:${request.sessionId}:${targetTab.id}`;
        return executeBrowserStep({
            step,
            traceId: step.traceId,
            tab: targetTab,
            signal,
            initialError,
            primitives: {
                enqueue: (task, queueSignal)=>this.enqueue(queueKey, task, queueSignal),
                observe: (kind, options, observationSignal)=>this.observe(request, resultTab, kind, options, observationSignal),
                runAction: async (action, traceId, reportPhase, actionSignal)=>{
                    const result = await this.runStepAction(request, targetTab, action, traceId, reportPhase, actionSignal);
                    if (result.nextTab) {
                        resultTab = result.nextTab;
                    }
                    return result;
                },
                wait: async (condition, waitSignal)=>{
                    const result = await this.stepWait(request, resultTab, condition, waitSignal);
                    if (result.nextTab) {
                        resultTab = result.nextTab;
                    }
                    return result;
                },
                eventCursor: (cursorSignal)=>this.eventCursor(request, cursorSignal)
            }
        });
    }
    async capabilities(request, signal) {
        let compatibilityReason;
        if (!this.compatibilityVerified) {
            try {
                const tab = await raceWithCancellation(this.selectedTab(request), signal);
                const engine = await raceWithCancellation(this.engineFor(request, tab, signal), signal);
                await engine.domSnapshot({
                    refs: 'none',
                    maxChars: 1024,
                    timeoutMs: Math.min(this.timeout(request), CAPABILITIES_PROBE_TIMEOUT_MS),
                    signal
                });
                this.compatibilityVerified = true;
            } catch (error) {
                compatibilityReason = error instanceof Error ? error.message : String(error);
            }
        }
        return createEngineCapabilities({
            available: this.compatibilityVerified,
            commands: PLAYWRIGHT_COMMANDS,
            domCuaCommands: DOM_CUA_COMMANDS,
            visualCuaCommands: VISUAL_CUA_COMMANDS,
            ...compatibilityReason ? {
                reason: compatibilityReason
            } : {},
            electron: this.config.versions.electron,
            chromium: this.config.versions.chromium,
            playwright: this.config.manifest.playwrightRevision,
            injectedHash: this.config.manifest.injectedHash
        });
    }
    async observe(request, tab, kind, options, signal) {
        const captureSignal = signal ?? AbortSignal.timeout(DIAGNOSTIC_TIMEOUT_MS);
        const beforeDocument = await this.documentId(request, tab, captureSignal);
        const descriptor = this.refs.begin({
            scope: this.refScope(request, tab, beforeDocument),
            kind
        });
        if (kind === 'semantic') {
            const snapshotOptions = options.refs === 'actionable' ? {
                refs: 'actionable',
                refPrefix: descriptor.refPrefix,
                ...options.maxChars === undefined ? {} : {
                    maxChars: options.maxChars
                },
                timeoutMs: this.timeout(request),
                signal: captureSignal
            } : {
                refs: 'none',
                ...options.maxChars === undefined ? {} : {
                    maxChars: options.maxChars
                },
                timeoutMs: this.timeout(request),
                signal: captureSignal
            };
            const snapshot = await this.semanticSnapshotWithReconnect(request, tab, snapshotOptions);
            this.compatibilityVerified = true;
            const [afterDocument, currentTab, eventCursor] = await Promise.all([
                this.documentId(request, tab, captureSignal),
                raceWithCancellation(this.selectedTab(request, tab.id), captureSignal),
                this.eventCursor(request, captureSignal)
            ]);
            this.assertDocumentStable(beforeDocument, afterDocument);
            if (options.refs === 'diagnostic') {
                return createSemanticObservation(snapshot.text, currentTab, {
                    observationId: descriptor.observationId,
                    eventCursor,
                    refs: 'none'
                });
            }
            this.refs.publish({
                ...descriptor,
                targets: snapshot.targets.map((target)=>({
                        publicSuffix: target.ref.slice(descriptor.refPrefix.length),
                        target: {
                            engine: 'playwright',
                            originalRef: target.ref,
                            ...target.frames.length ? {
                                frames: target.frames
                            } : {}
                        }
                    }))
            });
            return createSemanticObservation(snapshot.text, currentTab, {
                observationId: descriptor.observationId,
                eventCursor,
                refs: 'published',
                refPrefix: descriptor.refPrefix
            });
        }
        const snapshot = await this.withCdpTask(request, tab, captureSignal, (cdp)=>captureVisibleDom(cdp));
        const [afterDocument, currentTab, eventCursor] = await Promise.all([
            this.documentId(request, tab, captureSignal),
            raceWithCancellation(this.selectedTab(request, tab.id), captureSignal),
            this.eventCursor(request, captureSignal)
        ]);
        this.assertDocumentStable(beforeDocument, afterDocument);
        if (options.refs === 'diagnostic') {
            return createVisibleDomObservation(this.toWireDomSnapshot(snapshot, ()=>'diagnostic'), currentTab, {
                observationId: descriptor.observationId,
                eventCursor,
                refs: 'none'
            });
        }
        const targets = snapshot.nodes.map((node, index)=>({
                publicSuffix: `n${index + 1}`,
                target: {
                    engine: 'dom-cua',
                    originalNodeId: node.node_id
                }
            }));
        const publication = this.refs.publish({
            ...descriptor,
            targets
        });
        return createVisibleDomObservation(this.toWireDomSnapshot(snapshot, (rawRef)=>publication.refs.get(rawRef) ?? rawRef), currentTab, {
            observationId: descriptor.observationId,
            eventCursor,
            refs: 'published',
            refPrefix: descriptor.refPrefix
        });
    }
    toWireDomSnapshot(snapshot, publicRef) {
        return {
            ...snapshot,
            nodes: snapshot.nodes.map((node, index)=>{
                const { node_id: rawRef, ...rest } = node;
                return {
                    ...rest,
                    ref: publicRef(rawRef, index)
                };
            })
        };
    }
    async semanticSnapshotWithReconnect(request, tab, options) {
        const snapshot = async ()=>{
            const engine = await raceWithCancellation(this.engineFor(request, tab, options.signal), options.signal);
            return engine.domSnapshot(options);
        };
        try {
            return await snapshot();
        } catch (error) {
            if (!this.isExecutionContextLost(error)) {
                throw error;
            }
            await this.closeEngine(request, tab.id);
            return snapshot();
        }
    }
    isExecutionContextLost(error) {
        const message = error instanceof Error ? error.message : String(error);
        return message.includes('Cannot find context with specified id') || message.includes('Execution context was destroyed') || message.includes('Cannot find execution context');
    }
    async runStepAction(request, tab, action, traceId, report, signal) {
        const execution = {};
        let outcome = 'not-dispatched';
        let settle;
        let settleEventCursor;
        let refConsumed = false;
        let phase = 'resolve-target';
        const reportRemaining = (failed)=>{
            const order = [
                'resolve-target',
                'preflight',
                'act',
                'settle'
            ];
            const failedIndex = order.indexOf(failed);
            for (const [index, name] of order.entries()){
                if (index < failedIndex) {
                    continue;
                }
                report(name, {
                    status: index === failedIndex ? 'blocked' : 'skipped',
                    durationMs: 0
                });
            }
        };
        try {
            const operation = await runBrowserOperation({
                kernel: this.kernel,
                request,
                signal,
                tab,
                action: action.name,
                traceId,
                task: async (operationStart)=>{
                    let startedAt = external_node_perf_hooks_namespaceObject.performance.now();
                    try {
                        if (action.engine === 'semantic') {
                            const documentId = await this.documentId(request, tab, signal);
                            execution.documentId = documentId;
                            execution.lease = this.refs.pin(action.ref, {
                                ...this.refScope(request, tab, documentId)
                            });
                            execution.target = execution.lease.target;
                        }
                        this.refs.consumeTab(this.refTabScope(request, tab));
                        refConsumed = action.engine === 'semantic';
                        report('resolve-target', {
                            status: 'settled',
                            durationMs: playwright_engine_elapsed(startedAt)
                        });
                    } catch (error) {
                        reportRemaining('resolve-target');
                        throw playwright_engine_actionError(error, 'resolve-target', outcome, undefined, refConsumed);
                    }
                    phase = 'preflight';
                    startedAt = external_node_perf_hooks_namespaceObject.performance.now();
                    try {
                        await this.preflightAction(request, tab, action, execution, signal);
                        report('preflight', {
                            status: 'settled',
                            durationMs: playwright_engine_elapsed(startedAt)
                        });
                    } catch (error) {
                        reportRemaining('preflight');
                        throw playwright_engine_actionError(error, 'preflight', outcome, undefined, refConsumed);
                    }
                    phase = 'act';
                    startedAt = external_node_perf_hooks_namespaceObject.performance.now();
                    outcome = 'unknown';
                    try {
                        await this.dispatchAction(request, tab, action, execution, signal);
                        outcome = 'dispatched';
                        report('act', {
                            status: 'settled',
                            durationMs: playwright_engine_elapsed(startedAt)
                        });
                    } catch (error) {
                        reportRemaining('act');
                        throw playwright_engine_actionError(error, 'act', outcome, undefined, refConsumed);
                    }
                    phase = 'settle';
                    startedAt = external_node_perf_hooks_namespaceObject.performance.now();
                    try {
                        const automatic = await this.settleAction(request, tab, action, execution, operationStart.eventCursor, signal);
                        settle = {
                            status: automatic.status,
                            durationMs: playwright_engine_elapsed(startedAt)
                        };
                        settleEventCursor = automatic.eventCursor;
                        report('settle', settle);
                    } catch (error) {
                        settle = {
                            status: 'blocked',
                            durationMs: playwright_engine_elapsed(startedAt)
                        };
                        report('settle', settle);
                        throw playwright_engine_actionError(error, 'settle', outcome, settle, refConsumed);
                    } finally{
                        execution.lease?.release();
                    }
                    return undefined;
                }
            });
            const nextTab = await this.resultTabAfterAction(request, tab, operation.effects, signal);
            return {
                actionOutcome: outcome,
                refConsumed,
                settle,
                nextTab,
                effects: operation.effects,
                ...operation.eventCursor === undefined && settleEventCursor === undefined ? {} : {
                    eventCursor: operation.eventCursor ?? settleEventCursor
                }
            };
        } catch (error) {
            execution.lease?.release();
            const facts = getBrowserOperationFacts(error);
            const effects = facts?.effects;
            const nextTab = await this.resultTabAfterAction(request, tab, effects, undefined).catch(()=>tab);
            return {
                actionOutcome: outcome,
                refConsumed,
                settle,
                nextTab,
                effects,
                ...facts?.eventCursor === undefined ? {} : {
                    eventCursor: facts.eventCursor
                },
                error: playwright_engine_actionError(error, phase, outcome, settle, refConsumed)
            };
        }
    }
    async preflightAction(request, tab, action, execution, signal) {
        if (action.engine === 'visual') {
            await this.withCdpTask(request, tab, signal, (cdp)=>preflightVisualCuaAction(cdp, toVisualCuaActionParams(action)));
            return;
        }
        const target = execution.target;
        if (!target) {
            throw Object.assign(new Error('Semantic target was not resolved'), {
                code: 'STALE_SNAPSHOT_REF'
            });
        }
        if (target.engine === 'dom-cua') {
            await this.withCdpTask(request, tab, signal, (cdp)=>preflightDomCuaNode(cdp, target.originalNodeId));
            return;
        }
        const engine = await this.engineFor(request, tab, signal);
        const locator = toEngineRefLocator(target.originalRef, target.frames);
        const count = await engine.locatorAction(locator, 'count', undefined, this.timeout(request), signal);
        if (count !== 1) {
            throw Object.assign(new Error(count === 0 ? 'Snapshot ref is stale; observe again' : 'Snapshot ref does not identify exactly one target'), {
                code: count === 0 ? 'STALE_SNAPSHOT_REF' : 'STRICT_MODE_VIOLATION'
            });
        }
        if (action.name !== 'upload') {
            const visible = await engine.locatorState(locator, 'visible', {
                timeoutMs: this.timeout(request),
                signal
            });
            if (!visible) {
                throw Object.assign(new Error('Snapshot ref is not visible'), {
                    code: 'TARGET_NOT_ACTIONABLE'
                });
            }
        }
    }
    async dispatchAction(request, tab, action, execution, signal) {
        if (action.engine === 'visual') {
            await this.withCdpTask(request, tab, signal, (cdp)=>executeVisualCuaAction(cdp, toVisualCuaActionParams(action)));
            return;
        }
        const target = execution.target;
        if (!target) {
            throw Object.assign(new Error('Semantic target was not resolved'), {
                code: 'STALE_SNAPSHOT_REF'
            });
        }
        if (target.engine === 'dom-cua') {
            await this.withCdpTask(request, tab, signal, async (cdp)=>{
                for (const params of toDomCuaActionParams(action, target.originalNodeId)){
                    await executeDomCuaAction(cdp, params);
                }
            });
            return;
        }
        const engine = await this.engineFor(request, tab, signal);
        const locator = toEngineRefLocator(target.originalRef, target.frames);
        if (action.name === 'upload') {
            await engine.upload(locator, [
                action.path
            ], this.timeout(request), signal);
            return;
        }
        const mapping = this.playwrightAction(action);
        await engine.locatorAction(locator, mapping.name, mapping.value, this.timeout(request), signal);
    }
    playwrightAction(action) {
        switch(action.name){
            case 'fill':
            case 'type':
                return {
                    name: action.name,
                    value: action.text
                };
            case 'press':
                return {
                    name: action.name,
                    value: action.key
                };
            case 'select':
                return {
                    name: 'select-option',
                    value: action.values
                };
            case 'scroll':
                return {
                    name: action.name,
                    value: {
                        deltaX: action.deltaX,
                        deltaY: action.deltaY
                    }
                };
            case 'click':
            case 'double-click':
            case 'hover':
            case 'check':
                return {
                    name: action.name
                };
            case 'upload':
                return {
                    name: 'click'
                };
            default:
                throw new Error('Unsupported semantic browser action');
        }
    }
    async settleAction(request, tab, action, execution, eventCursor, signal) {
        if (action.engine === 'semantic' && execution.target?.engine === 'playwright') {
            const engine = await this.engineFor(request, tab, signal);
            const locator = toEngineRefLocator(execution.target.originalRef, execution.target.frames);
            await this.pollActionState(async ()=>{
                switch(action.name){
                    case 'fill':
                        return await engine.locatorValue(locator, {
                            signal
                        }) === action.text;
                    case 'type':
                        {
                            const value = await engine.locatorValue(locator, {
                                signal
                            });
                            return typeof value === 'string' && value.includes(action.text);
                        }
                    case 'select':
                        return valuesEqual(await engine.locatorValue(locator, {
                            signal
                        }), action.values);
                    case 'check':
                        return engine.locatorState(locator, 'checked', {
                            signal
                        });
                    default:
                        return true;
                }
            }, signal);
            return this.settleFromHostEvents(request, tab, eventCursor, signal);
        }
        if (action.engine === 'semantic' && execution.target?.engine === 'dom-cua' && (action.name === 'fill' || action.name === 'type' || action.name === 'check')) {
            const domNodeId = execution.target.originalNodeId;
            const expectedText = action.name === 'fill' || action.name === 'type' ? action.text : undefined;
            await this.pollActionState(async ()=>{
                const value = await this.withCdpTask(request, tab, signal, (cdp)=>readDomCuaNodeValue(cdp, domNodeId));
                if (action.name === 'check') {
                    return value === true;
                }
                return typeof value === 'string' && expectedText !== undefined && (action.name === 'fill' ? value === expectedText : value.includes(expectedText));
            }, signal);
            return this.settleFromHostEvents(request, tab, eventCursor, signal);
        }
        return this.settleFromHostEvents(request, tab, eventCursor, signal);
    }
    settleFromHostEvents(request, tab, eventCursor, signal) {
        return settleBrowserAction({
            targetTabId: tab.id,
            eventCursor,
            signal,
            primitives: {
                eventsSince: (cursor, currentSignal)=>this.eventsSince(request, cursor, currentSignal),
                listTabs: (currentSignal)=>raceWithCancellation(this.kernel.call(request, 'tabs.list', {}, currentSignal), currentSignal)
            }
        });
    }
    async pollActionState(probe, signal) {
        const deadline = Date.now() + ACTION_STATE_TIMEOUT_MS;
        while(Date.now() <= deadline){
            throwIfCancelled(signal);
            if (await probe()) {
                return;
            }
            await this.abortableDelay(ACTION_STATE_POLL_INTERVAL_MS, signal);
        }
        throw Object.assign(new Error('Browser action state did not settle'), {
            code: 'TARGET_NOT_ACTIONABLE'
        });
    }
    abortableDelay(durationMs, signal) {
        throwIfCancelled(signal);
        return new Promise((resolve, reject)=>{
            const timer = setTimeout(()=>{
                signal?.removeEventListener('abort', abort);
                resolve();
            }, durationMs);
            const abort = ()=>{
                clearTimeout(timer);
                reject(signal?.reason);
            };
            signal?.addEventListener('abort', abort, {
                once: true
            });
        });
    }
    async stepWait(request, tab, condition, signal) {
        const result = await runBrowserWait({
            condition,
            timeoutMs: this.timeout(request),
            signal,
            primitives: {
                refreshTab: (currentSignal)=>raceWithCancellation(this.selectedTab(request, tab.id), currentSignal),
                semanticText: async (currentSignal)=>(await this.semanticSnapshotWithReconnect(request, tab, {
                        refs: 'none',
                        maxChars: 32768,
                        timeoutMs: this.timeout(request),
                        signal: currentSignal
                    })).text,
                refState: (ref, state, currentSignal)=>this.refState(request, tab, ref, state, currentSignal),
                queryCount: (query, currentSignal)=>this.queryCount(request, tab, query, currentSignal),
                listTabs: (currentSignal)=>raceWithCancellation(this.kernel.call(request, 'tabs.list'), currentSignal),
                listDownloads: (currentSignal)=>raceWithCancellation(this.kernel.call(request, 'downloads.list'), currentSignal),
                eventCursor: (currentSignal)=>this.eventCursor(request, currentSignal),
                eventsSince: (cursor, currentSignal)=>this.eventsSince(request, cursor, currentSignal)
            }
        });
        const nextTab = result.nextTab ? await raceWithCancellation(this.selectedTab(request, result.nextTab.id), signal).catch(()=>result.nextTab) : undefined;
        return {
            settle: {
                status: result.status,
                durationMs: result.durationMs
            },
            ...result.eventCursor === undefined ? {} : {
                eventCursor: result.eventCursor
            },
            ...nextTab ? {
                nextTab
            } : {}
        };
    }
    async refState(request, tab, ref, state, signal) {
        const documentId = await this.documentId(request, tab, signal);
        const target = this.refs.resolve(ref, {
            ...this.refScope(request, tab, documentId)
        });
        if (target.engine !== 'playwright') {
            if (state === 'detached') {
                try {
                    await this.withCdpTask(request, tab, signal, (cdp)=>preflightDomCuaNode(cdp, target.originalNodeId));
                    return false;
                } catch (error) {
                    if (error.code === 'STALE_SNAPSHOT_REF') {
                        return true;
                    }
                    throw error;
                }
            }
            if (state === 'attached' || state === 'visible') {
                await this.withCdpTask(request, tab, signal, (cdp)=>preflightDomCuaNode(cdp, target.originalNodeId));
                return true;
            }
            throw Object.assign(new Error(`DOM observation ref does not support ${state} state`), {
                code: 'NOT_SUPPORTED'
            });
        }
        const engine = await this.engineFor(request, tab, signal);
        return engine.locatorState(toEngineRefLocator(target.originalRef, target.frames), state, {
            timeoutMs: this.timeout(request),
            signal
        });
    }
    async queryCount(request, tab, query, signal) {
        const engine = await this.engineFor(request, tab, signal);
        const count = await engine.locatorAction(toEngineLocator(query), 'count', undefined, this.timeout(request), signal);
        if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
            throw Object.assign(new Error('Playwright locator count is invalid'), {
                code: 'OBSERVATION_INCONSISTENT'
            });
        }
        return count;
    }
    async documentId(request, tab, signal) {
        return this.withCdpTask(request, tab, signal, async (cdp)=>{
            const tree = await cdp.send('Page.getFrameTree');
            const frame = tree.frameTree?.frame;
            if (!frame?.id) {
                throw Object.assign(new Error('Main document is unavailable'), {
                    code: 'TARGET_NOT_ACTIONABLE'
                });
            }
            const world = await cdp.send('Page.createIsolatedWorld', {
                frameId: frame.id,
                worldName: DOCUMENT_WORLD_NAME,
                grantUniveralAccess: false
            });
            if (!Number.isSafeInteger(world.executionContextId)) {
                throw Object.assign(new Error('Document context is unavailable'), {
                    code: 'TARGET_NOT_ACTIONABLE'
                });
            }
            const token = await cdp.send('Runtime.evaluate', {
                contextId: world.executionContextId,
                returnByValue: true,
                expression: String.raw`(() => {
          const key = Symbol.for('coze.browser.document.identity.v1');
          globalThis[key] ||= (globalThis.crypto?.randomUUID?.() ||
            String(Date.now()) + '-' + String(Math.random()));
          return globalThis[key];
        })()`
            });
            const value = token.result?.value;
            if (token.exceptionDetails || typeof value !== 'string' || !value) {
                throw Object.assign(new Error('Document identity is unavailable'), {
                    code: 'TARGET_NOT_ACTIONABLE'
                });
            }
            return `${frame.id}:${frame.loaderId ?? ''}:${value}`;
        });
    }
    assertDocumentStable(before, after) {
        if (before !== after) {
            throw Object.assign(new Error('Document changed while capturing the browser observation'), {
                code: 'OBSERVATION_INCONSISTENT'
            });
        }
    }
    refScope(request, tab, documentId) {
        return {
            capability: this.refAuthority(request),
            sessionId: request.sessionId,
            tabId: tab.id,
            documentId
        };
    }
    refTabScope(request, tab) {
        return {
            capability: this.refAuthority(request),
            sessionId: request.sessionId,
            tabId: tab.id
        };
    }
    async eventCursor(request, signal) {
        const result = await this.kernel.call(request, 'events.cursor', {}, signal);
        return validCursor(result?.cursor) ? result.cursor : 0;
    }
    async eventsSince(request, cursor, signal) {
        return this.kernel.call(request, 'events.since', {
            since: cursor
        }, signal);
    }
    async resultTabAfterAction(request, original, effects, signal) {
        const resultId = effects?.activeTabAfter ?? effects?.createdTabs.find((tab)=>tab.active)?.id ?? (effects?.closedTabIds.includes(original.id) ? effects.createdTabs[effects.createdTabs.length - 1]?.id : original.id);
        if (!resultId) {
            return original;
        }
        const fromEffects = effects?.createdTabs.find((tab)=>tab.id === resultId);
        return raceWithCancellation(this.selectedTab(request, resultId), signal).catch(()=>fromEffects ?? original);
    }
    async selectedTab(request, tabId = typeof request.params?.tabId === 'string' ? request.params.tabId : undefined) {
        return tabId ? this.kernel.call(request, 'tabs.get', {
            tabId
        }) : this.kernel.call(request, 'tabs.selected');
    }
    async withCdpTask(request, tab, signal, task) {
        const transport = this.cdpTransports.get(request, tab);
        const sendCdp = (commandRequest, method, params, commandSignal, timeoutMs)=>{
            if (method === 'Input.setInterceptDrags' || method === 'Input.dispatchDragEvent') {
                const command = this.kernel.call(commandRequest, 'cdp.send', {
                    tabId: tab.id,
                    method,
                    params
                });
                return commandSignal ? raceWithCancellation(command, commandSignal) : command;
            }
            return transport.sendCommand(method, params, undefined, {
                ...commandSignal ? {
                    signal: commandSignal
                } : {},
                timeoutMs
            });
        };
        const cdp = {
            send: (method, params = {})=>{
                throwIfCancelled(signal);
                return sendCdp(request, method, params, signal, this.timeout(request));
            },
            sendCleanup: (method, params = {})=>{
                if (!isVisualCuaCleanupCommand(method, params)) {
                    return Promise.reject(new Error(`CDP method is not allowed for cleanup: ${method}`));
                }
                const timeoutMs = Math.max(1, cancelledCleanupTimeout(request.timeoutMs));
                return sendCdp({
                    ...request,
                    timeoutMs
                }, method, params, undefined, timeoutMs);
            },
            onEvent: (listener)=>transport.onEvent(listener)
        };
        await cdp.send('Emulation.setFocusEmulationEnabled', {
            enabled: true
        });
        return task(cdp, tab);
    }
    engineFor(request, tab, signal) {
        const key = this.engineKey(this.refAuthority(request), request.sessionId, tab.id);
        const existing = this.engines.get(key);
        if (existing) {
            return existing;
        }
        const transport = this.cdpTransports.get(request, tab);
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- trusted runtime config directory
        const created = (0,promises_namespaceObject.mkdir)(this.config.artifactsDir, {
            recursive: true
        }).then(()=>dist.CozeBrowserEngine.connect({
                transport,
                artifactsDir: this.config.artifactsDir,
                timeoutMs: this.timeout(request),
                signal
            })).catch((error)=>{
            this.engines.delete(key);
            throw error;
        });
        this.engines.set(key, created);
        return created;
    }
    async closeEngine(request, tabId) {
        const key = this.engineKey(this.refAuthority(request), request.sessionId, tabId);
        const engine = this.engines.get(key);
        this.engines.delete(key);
        await engine?.then((value)=>value.close()).catch(()=>undefined);
    }
    engineKey(capability, sessionId, tabId) {
        return `${capability}:${sessionId}:${tabId}`;
    }
    refAuthority(request) {
        return request.refAuthority ?? request.capability;
    }
    timeout(request, fallback = 15000) {
        return Math.min(Math.max(request.timeoutMs ?? fallback, 1), MAX_RUNTIME_TIMEOUT_MS);
    }
    handlePortMessage = (event)=>{
        const message = event.data;
        if (message.type === 'coze-capability-revoked' && typeof message.capability === 'string') {
            void this.revokeCapabilityAndAck(message.capability);
            return;
        }
        if (message.type === 'coze-ref-authority-revoked' && typeof message.refAuthority === 'string') {
            this.refs.revoke(message.refAuthority);
            const prefix = `${message.refAuthority}:`;
            const closing = [];
            for (const [key, engine] of this.engines){
                if (key.startsWith(prefix)) {
                    this.engines.delete(key);
                    closing.push(engine.then((value)=>value.close()).catch(()=>undefined));
                }
            }
            this.cdpTransports.revoke(message.refAuthority);
            void Promise.all(closing).finally(()=>{
                this.port.postMessage({
                    type: 'coze-ref-authority-revoked-ack',
                    refAuthority: message.refAuthority
                });
            });
            return;
        }
        if (message.type !== 'coze-cdp-closed' || typeof message.capability !== 'string' || typeof message.tabId !== 'string') {
            return;
        }
        this.compatibilityVerified = false;
        const prefix = `${message.capability}:`;
        const suffix = `:${message.tabId}`;
        for (const [key, engine] of this.engines){
            if (key.startsWith(prefix) && key.endsWith(suffix)) {
                this.engines.delete(key);
                void engine.then((value)=>value.close()).catch(()=>undefined);
            }
        }
        this.cdpTransports.forget(message.capability, message.tabId);
    };
    async revokeCapabilityAndAck(capability) {
        try {
            await this.revokeCapability(capability);
        } finally{
            this.port.postMessage({
                type: 'coze-capability-revoked-ack',
                capability
            });
        }
    }
    async revokeCapability(capability) {
        // Legacy/dev-session requests scope refs directly to the capability. BUA
        // requests use a distinct Main-issued ref authority and survive token
        // rotation until that authority expires or the browser context changes.
        this.refs.revoke(capability);
        const prefix = `${capability}:`;
        const closing = [];
        for (const [key, engine] of this.engines){
            if (!key.startsWith(prefix)) {
                continue;
            }
            this.engines.delete(key);
            closing.push(engine.then((value)=>value.close()).catch(()=>undefined));
        }
        await Promise.all(closing);
        this.cdpTransports.revoke(capability);
    }
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/runtime-worker.ts





const KERNEL_TIMEOUT_MS = 30000;
function createMessagePortKernelError(error) {
    return Object.assign(new Error(error.message), error);
}
class MessagePortKernelClient {
    port;
    pending = new Map();
    constructor(port){
        this.port = port;
        port.on('message', this.handleMessage);
        port.start?.();
    }
    call(request, method, params = {}, signal) {
        if (signal?.aborted) {
            return Promise.reject(cancellationError(signal));
        }
        const id = (0,external_node_crypto_namespaceObject.randomUUID)();
        const message = {
            type: 'kernel-request',
            id,
            capability: request.capability,
            refAuthority: request.refAuthority ?? request.capability,
            sessionId: request.sessionId,
            method,
            params
        };
        return new Promise((resolve, reject)=>{
            const cancelKernelRequest = (reason)=>{
                const cancel = {
                    type: 'kernel-cancel',
                    id,
                    capability: request.capability,
                    refAuthority: request.refAuthority ?? request.capability,
                    sessionId: request.sessionId,
                    ...reason ? {
                        reason
                    } : {}
                };
                this.port.postMessage(cancel);
            };
            const settlePending = ()=>{
                const pending = this.pending.get(id);
                if (!pending) {
                    return false;
                }
                this.pending.delete(id);
                clearTimeout(pending.timer);
                if (pending.signal && pending.handleAbort) {
                    pending.signal.removeEventListener('abort', pending.handleAbort);
                }
                return true;
            };
            const timer = setTimeout(()=>{
                if (!settlePending()) {
                    return;
                }
                cancelKernelRequest('Browser Kernel request timed out');
                reject(createMessagePortKernelError(createRpcError(src_COZE_BROWSER_ERROR_CODES.timeout, 'Browser Kernel request timed out', true)));
            }, Math.min(request.timeoutMs ?? KERNEL_TIMEOUT_MS, KERNEL_TIMEOUT_MS));
            const handleAbort = ()=>{
                if (!settlePending()) {
                    return;
                }
                const error = cancellationError(signal);
                cancelKernelRequest(error.message);
                reject(error);
            };
            this.pending.set(id, {
                resolve: (value)=>resolve(value),
                reject,
                timer,
                ...signal ? {
                    signal,
                    handleAbort
                } : {}
            });
            signal?.addEventListener('abort', handleAbort, {
                once: true
            });
            this.port.postMessage(message);
        });
    }
    handleMessage = (event)=>{
        const message = event.data;
        if (message?.type !== 'kernel-response' || typeof message.id !== 'string') {
            return;
        }
        const pending = this.pending.get(message.id);
        if (!pending) {
            return;
        }
        this.pending.delete(message.id);
        clearTimeout(pending.timer);
        if (pending.signal && pending.handleAbort) {
            pending.signal.removeEventListener('abort', pending.handleAbort);
        }
        if (message.ok === true) {
            pending.resolve(message.result);
            return;
        }
        const failure = message;
        if (!failure.error || typeof failure.error.code !== 'string' || typeof failure.error.message !== 'string' || typeof failure.error.retryable !== 'boolean') {
            pending.reject(createMessagePortKernelError(createRpcError(src_COZE_BROWSER_ERROR_CODES.internal, 'Browser Kernel returned an invalid response')));
            return;
        }
        pending.reject(createMessagePortKernelError(failure.error));
    };
}
async function startBrowserRuntimeWorker(config, kernelPort) {
    const kernel = new MessagePortKernelClient(kernelPort);
    const engine = new PlaywrightBrowserEngine(kernel, kernelPort, config);
    const gateway = new RuntimeGateway({
        socketPath: config.socketPath,
        handleRequest: (request, signal)=>engine.handle(request, signal),
        onTraceEvent: (event)=>kernelPort.postMessage(event)
    });
    await gateway.listen();
    return gateway;
}

;// CONCATENATED MODULE: ../../packages/coze-browser-runtime/src/index.ts




;// CONCATENATED MODULE: ../coze-browser/src/runtime-worker.ts

const { parentPort } = process;
if (!parentPort) {
    throw new Error('Browser Runtime must be started as an Electron UtilityProcess');
}
parentPort.on('message', (event)=>{
    const message = event.data;
    const kernelPort = event.ports?.[0];
    if (message.type !== 'browser-runtime-init' || !message.config || !kernelPort) {
        return;
    }
    void startBrowserRuntimeWorker(message.config, kernelPort).then(()=>parentPort.postMessage({
            type: 'browser-runtime-ready'
        })).catch((error)=>{
        parentPort.postMessage({
            type: 'browser-runtime-error',
            message: error instanceof Error ? error.message : String(error)
        });
    });
});

})();

module.exports = __webpack_exports__;
})()
;