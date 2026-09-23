(function () {
  const SAVE_KEY = "zongcai-lu-yanci-v2";
  const $ = (sel) => document.querySelector(sel);

  const SPRITE_LU = "img/sprite_lu.png";
  const STAND_BG = "img/bg_elevator.png";
  const PLACE_BG = {
    "电梯间": "img/bg_elevator.png",
    "茶水间": "img/bg_office.png",
    "基层办公区": "img/bg_office.png",
    "你的工位": "img/bg_office.png",
    "工位": "img/bg_office.png",
    "打印室": "img/bg_office.png",
    "大会议室": "img/bg_office.png",
    "会议室": "img/bg_office.png",
    "总裁办走廊": "img/bg_office.png",
    "楼下餐厅": "img/bg_office.png",
    "工位 → 楼下餐厅": "img/bg_office.png",
    "项目群": "img/bg_office.png",
    "公司楼下": "img/bg_office.png",
    "地铁": "img/bg_office.png",
    "滨湾": "img/bg_office.png",
    "购物中心": "img/bg_office.png",
    "办公室夜灯": "img/bg_night.png",
    "他的办公室": "img/bg_night.png",
    "天台": "img/bg_night.png",
    "地下车库": "img/bg_night.png",
    "落地窗前": "img/bg_night.png"
  };
  const END_CG = {
    perfect: "img/cg_ending.png",
    salvage: "img/cg_rain.png",
    bankrupt: "img/cg_meeting.png",
    collapse: "img/cg_night.png"
  };

  const LOOKS = ["a", "b", "c"];
  const defaultPlayer = () => ({
    name: "苏晚",
    age: "23",
    look: "a",
    appearance: "肩发黑发，眼睛很亮，笑起来有点锋。",
    personality: "直爽有活力，不惯着人，被靠近时会先愣一下再顶回去。"
  });
  const defaultState = () => ({
    sceneId: "title",
    affection: 0,
    daysLeft: 100,
    calendarDay: 1,
    lastDelta: 0,
    lastNote: "",
    lowStreak: 0,
    graceActive: false,
    graceUsed: false,
    flags: {},
    history: [],
    ended: null,
    epilogue: false,
    player: defaultPlayer(),
    sysOpen: false,
    phoneFab: null,
    clockEnd: 0,
    sysSeen: "",
    questJudge: "doing",
    questKey: "",
    alert: 0,
    rumor: 0,
    trust: 0,
    pendingEcho: "",
    inbox: { seen: {}, replies: {}, extra: {} },
    live: null,
    storyLog: [],
    lastYouAct: "",
    clockMin: 18 * 60 + 47,
    lastCg: "",
    money: 1284.6,
    bag: [],
    shopCart: [],
    shopOrders: [],
    shopCoupon: 5,
    wxCity: "binjiang",
    ledger: [
      { name: "地铁通勤", delta: -6 },
      { name: "便利店", delta: -13.5 },
      { name: "午饭", delta: -28 },
      { name: "咖啡", delta: -18 }
    ]
  });

  let state = defaultState();
  let simMode = null;
  let draft = defaultPlayer();
  let apiEnterMode = "new";
  let advBeats = [];
  let advIndex = 0;
  let plotReady = false;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function vibeOf(text) {
    const s = String(text || "");
    if (/冷静|克制|冷淡|淡漠|高冷/.test(s)) return "cool";
    if (/温|软|礼貌|温柔|好说话/.test(s)) return "soft";
    return "lively";
  }
  function pname() { return (state.player && state.player.name) || "你"; }

  function systemTone() {
    const d = state.daysLeft;
    const a = state.affection;
    if (d <= 10) {
      if (a < 30) return "warn";
      if (a < 70) return "urgent";
      return "final";
    }
    if (d <= 30) {
      if (a < 30) return "warn";
      if (a < 70) return "serious";
      return "encourage";
    }
    if (d <= 60) {
      if (a < 30) return "push";
      if (a < 70) return "remind";
      return "soft";
    }
    if (a >= 70) return "soft";
    return "normal";
  }

  function toneLine() {
    const t = systemTone();
    const d = state.daysLeft;
    const n = pname();
    const map = {
      warn: `还剩${d}天。你在攻略${n}，不是在裁员。`,
      urgent: `只剩${d}天了。${n}还没有被你拿下。`,
      final: `快到了。还剩${d}天，别在终点把${n}吓跑。`,
      serious: `倒计时${d}天。认真攻略。`,
      encourage: `${n}没有在远离你。${d}天，够用。`,
      push: `你在浪费攻略时间。`,
      remind: `提醒：你要追的是${n}，不是一份文件。`,
      soft: `……这次还算像在追人。`,
      normal: null
    };
    return map[t] || null;
  }

  function sceneById(id) {
    if (id === "live") {
      if (!state.live) state.live = localContinue({});
      return Object.assign({
        id: "live",
        jump: 0,
        play: "dualTrack",
        questGate: true
      }, state.live);
    }
    return window.ZC_SCENES.find((s) => s.id === id);
  }

  function checkEndingAfterJump() {
    if (state.lowStreak >= 3) return "collapse";
    if (state.affection >= 100 && state.daysLeft > 0) return "perfect";
    if (state.daysLeft <= 0) {
      if (state.affection >= 100) return "perfect";
      if (!state.graceUsed && state.affection >= 80) return "grace";
      if (state.graceUsed && state.affection >= 80 && state.affection < 100) return "salvage";
      return "bankrupt";
    }
    return null;
  }

  function applyJump(days) {
    skipDays(days);
  }

  function noteLowDay() {
    if (state.affection <= -20) state.lowStreak += 1;
    else state.lowStreak = 0;
  }

  function skipDays(days) {
    const n = Number(days) || 0;
    if (n <= 0) return;
    state.daysLeft = Math.max(0, state.daysLeft - n);
    state.calendarDay += n;
    state.clockMin = 9 * 60;
    for (let i = 0; i < n; i++) noteLowDay();
  }

  function advanceStoryClock(mins) {
    let add = Math.max(0, parseInt(mins, 10) || 0);
    if (!add) return;
    let t = (state.clockMin || 0) + add;
    while (t >= 24 * 60) {
      t -= 24 * 60;
      state.daysLeft = Math.max(0, state.daysLeft - 1);
      state.calendarDay += 1;
      noteLowDay();
    }
    state.clockMin = t;
  }

  function estimateMinutes(choice, scene) {
    const t = String((choice && choice.text) || "") + " " + String((scene && (scene.place || scene.title)) || "");
    if (/吃饭|晚餐|午餐|餐厅/.test(t)) return 50;
    if (/加班/.test(t)) return 90;
    if (/开会|会议/.test(t)) return 55;
    if (/雨|伞|楼下/.test(t)) return 25;
    if (/车库|开车/.test(t)) return 20;
    if (/地铁|通勤/.test(t)) return 35;
    if (/咖啡|水|茶/.test(t)) return 12;
    if (/手机|档案|锁屏|推送/.test(t)) return 6;
    if (/走|离开|回工位|下班/.test(t)) return 18;
    if (/点头|应声|鞠躬|看他|停在/.test(t)) return 8;
    return 15;
  }

  function renderClock() {
    const daysEl = $("#clock-days");
    if (!daysEl) return;
    const pad = (n) => String(n).padStart(2, "0");
    const total = Math.max(0, state.clockMin || 0);
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    daysEl.textContent = String(Math.max(0, state.daysLeft));
    $("#clock-h").textContent = pad(h);
    $("#clock-m").textContent = pad(m);
    $("#clock-s").textContent = "00";
    const advTime = $("#adv-time");
    if (advTime) advTime.textContent = pad(h) + ":" + pad(m);
    const box = $("#hud-clock");
    if (box) box.classList.toggle("is-warn", state.daysLeft <= 10);
  }

  function fillSysChat(scene) {
    const box = $("#sys-chat");
    if (!box) return;
    const lines = (scene && scene.sys && scene.sys.length) ? scene.sys.slice() : [];
    const extra = toneLine();
    if (extra) lines.push({ who: "sys", text: extra });
    if (!lines.length) {
      box.innerHTML = `<p class="sys-empty">当前没有系统通讯。</p>`;
      return;
    }
    box.innerHTML = lines.map((m) => {
      const lu = m.who === "lu";
      return `<div class="sys-row ${lu ? "lu" : "sys"}"><span>${lu ? "陆晏辞" : "系统"}</span><p>${fill(m.text)}</p></div>`;
    }).join("");
  }

  function openSysModal() {
    fillSysChat(sceneById(state.sceneId));
    $("#sys-modal").classList.remove("hidden");
    state.sysOpen = true;
  }

  function closeSysModal() {
    $("#sys-modal").classList.add("hidden");
    state.sysOpen = false;
    if (plotReady) {
      unlockSheet();
      paintAdvTip();
    }
  }

  let draftDelta = 0;

  function previewAff() {
    return clamp(state.affection - (state.lastDelta || 0) + draftDelta, -40, 100);
  }

  function paintAffModal() {
    const now = $("#aff-now");
    const oldEl = $("#aff-old");
    const newEl = $("#aff-new");
    const lead = $("#aff-lead");
    const range = $("#aff-range");
    if (now) now.textContent = String(previewAff());
    if (oldEl) oldEl.textContent = ((state.lastDelta || 0) > 0 ? "+" : "") + (state.lastDelta || 0);
    if (newEl) newEl.textContent = (draftDelta > 0 ? "+" : "") + draftDelta;
    if (range) range.value = String(draftDelta);
    if (lead) {
      lead.textContent = state.history.length
        ? ("上一轮：" + (state.lastNote || "系统判定") + "。只能改这一段的加减，不能一次拉满。")
        : "还没有判定。先做一轮行动，再来改上一段。";
    }
  }

  function syncAffModal() {
    draftDelta = clamp(state.lastDelta || 0, -8, 8);
    paintAffModal();
  }

  function openAffModal() {
    syncAffModal();
    $("#aff-modal").classList.remove("hidden");
  }

  function closeAffModal() {
    $("#aff-modal").classList.add("hidden");
    save();
  }

  function taskStatus(task) {
    const nowId = state.sceneId;
    const reached = sceneReached(task.scene);
    const idx = sceneIndex(task.scene);
    const here = nowId === task.scene;
    if (task.id === "dinner") {
      if (state.flags && state.flags.ateTogether) return "ok";
      if (here && state.questJudge === "fail") return "fail";
      if (here || /晚餐|吃饭/.test(state.questKey || "") || nowId === "live") return "doing";
      return reached ? "doing" : "lock";
    }
    if (nowId === "live") {
      const beat = (state.history || []).length;
      if (idx >= 0 && beat > idx + 1) return "ok";
      if (idx >= 0 && beat >= idx) return "doing";
      return "lock";
    }
    if (idx >= 0 && sceneIndex(nowId) > idx) return "ok";
    if (here) return state.questJudge === "fail" ? "fail" : "doing";
    return reached ? "doing" : "lock";
  }

  function openTaskModal() {
    const box = $("#task-list");
    const modal = $("#task-modal");
    if (!box || !modal) return;
    const label = { lock: "未开始", doing: "进行中", ok: "完成", fail: "失败" };
    box.innerHTML = (window.ZC_TASKS || []).map((t) => {
      const st = taskStatus(t);
      return `<li class="${st}"><span>${t.name}</span><i>${label[st] || "未开始"}</i></li>`;
    }).join("");
    modal.classList.remove("hidden");
  }

  function closeTaskModal() {
    const modal = $("#task-modal");
    if (modal) modal.classList.add("hidden");
  }

  function commitLastDelta() {
    if (!state.history.length) {
      closeAffModal();
      return;
    }
    const next = clamp(draftDelta, -8, 8);
    const old = state.lastDelta || 0;
    state.affection = clamp(state.affection - old + next, -40, 100);
    state.lastDelta = next;
    const h = state.history[state.history.length - 1];
    if (h) h.delta = next;
    renderHud();
    closeAffModal();
    toast("已改上一段判定");
  }

  function setAffection(next) {
    const n = clamp(next, -40, 100);
    state.lastDelta = n - state.affection;
    state.affection = n;
    renderHud();
  }

  const BRIEF_STEPS = [
    "你并不知道<b>系统</b>的存在<br>所以只需要按心意行动",
    "当然，你可以选择刻意给他<b>添堵</b>",
    "如果您觉得系统判定加减好感不合理<br>可以点击最上方的“<b>介入判定</b>”进行修改",
    "但您需要注意的是，只能修改<b>上一轮</b>的变化"
  ];
  let briefStep = 0;

  function paintBrief() {
    const el = $("#brief-text");
    if (!el) return;
    el.innerHTML = BRIEF_STEPS[briefStep] || BRIEF_STEPS[0];
    $("#brief-step").textContent = (briefStep + 1) + " / " + BRIEF_STEPS.length;
    $("#brief-ok").textContent = briefStep >= BRIEF_STEPS.length - 1 ? "开始" : "下一步";
  }

  function showBrief() {
    const el = $("#brief-modal");
    if (!el) return;
    briefStep = 0;
    paintBrief();
    el.classList.remove("hidden");
  }

  function stepBrief() {
    if (briefStep < BRIEF_STEPS.length - 1) {
      briefStep += 1;
      paintBrief();
      return;
    }
    closeBrief();
  }

  function closeBrief() {
    const el = $("#brief-modal");
    if (el) el.classList.add("hidden");
    state.flags.briefed = true;
    save();
  }

  function lockSheet() {
    plotReady = false;
    $("#sheet").classList.add("is-locked");
    const next = $("#adv-next");
    next.textContent = "▾";
    next.classList.remove("is-idle");
  }

  function unlockSheet() {
    plotReady = true;
    $("#sheet").classList.remove("is-locked");
    const next = $("#adv-next");
    next.textContent = "▾";
    next.classList.add("is-idle");
  }

  function buildBeats(scene) {
    const beats = [];
    if (state.pendingEcho) {
      beats.push({ kind: "act", who: "余波", text: fill(state.pendingEcho) });
      state.pendingEcho = "";
    }
    if (scene.nar) beats.push({ kind: "nar", who: "旁白", text: fill(scene.nar) });
    if (scene.act) beats.push({ kind: "act", who: "动作", text: fill(scene.act) });
    if (scene.line) beats.push({ kind: "line", who: "陆晏辞", text: fill(scene.line) });
    return beats;
  }

  const PLAY_TIPS = [
    "点对话框或立绘继续。",
    "点顶部「介入判定」，只能改上一轮。",
    "选项是动作。想添堵，也可以自己写一句。",
    "他话少不代表没在听。短句往往已经是上限。",
    "任务要真的去做才会成功，口头答应不算。",
    "讯息可以当微信回。他回得慢、回得短。",
    "未知号码不会好好解释自己是谁。",
    "晏辞总部 68 层。你在裙楼 7F。",
    "专梯直达总裁层。你进不去。",
    "系统只他能看见。你看不见那套面板。",
    "好感不会一次拉满。每一轮反应都会留下余波。",
    "即达用的是钱包余额，不是别的平台。",
    "地图上的地点没有字，名字写在标注里。"
  ];

  function paintAdvTip() {
    const el = $("#adv-tip");
    if (!el) return;
    const scene = sceneById(state.sceneId);
    const tips = PLAY_TIPS.slice();
    if (scene && scene.id === "hint_phone") tips.unshift("右下角手机在亮。先点开档案。");
    if (plotReady) tips.unshift("选一个动作，或自己写一句。");
    if (state.lastDelta) {
      const d = state.lastDelta;
      tips.unshift("上一轮判定 " + (d > 0 ? "+" : "") + d + "。觉得不对就点顶部改。");
    }
    const key = (advIndex || 0) + (state.calendarDay || 1) * 3 + String(state.sceneId || "").length;
    el.textContent = tips[Math.abs(key) % tips.length];
  }

  function showBeat() {
    const box = $("#adv");
    const dots = $("#adv-step");
    if (!advBeats.length) {
      box.className = "adv kind-nar";
      $("#adv-who").textContent = "旁白";
      $("#adv-text").textContent = "";
      dots.innerHTML = "";
      paintAdvTip();
      return;
    }
    const idx = Math.min(advIndex, advBeats.length - 1);
    const beat = advBeats[idx];
    box.className = "adv kind-" + beat.kind;
    $("#adv-who").textContent = beat.who;
    $("#adv-text").textContent = beat.kind === "line" ? `“${beat.text}”` : beat.text;
    dots.innerHTML = advBeats.map((_, i) => `<i class="${i === idx ? "on" : ""}"></i>`).join("");
    paintAdvTip();
  }

  function finishPlot() {
    const scene = sceneById(state.sceneId);
    if (!simMode && scene && scene.sys && scene.sys.length && state.sysSeen !== scene.id) {
      fillSysChat(scene);
      openSysModal();
      state.sysSeen = scene.id;
      plotReady = true;
      return;
    }
    unlockSheet();
    paintAdvTip();
  }

  function advanceAdv() {
    if ($("#brief-modal") && !$("#brief-modal").classList.contains("hidden")) return;
    if ($("#sys-modal") && !$("#sys-modal").classList.contains("hidden")) return;
    if ($("#aff-modal") && !$("#aff-modal").classList.contains("hidden")) return;
    if ($("#log-modal") && !$("#log-modal").classList.contains("hidden")) return;
    if (plotReady && !$("#sheet").classList.contains("is-locked")) return;
    if (advIndex < advBeats.length - 1) {
      advIndex += 1;
      showBeat();
      return;
    }
    finishPlot();
  }

  function startAdv(scene) {
    advBeats = buildBeats(scene);
    rememberScene(scene, advBeats);
    advIndex = 0;
    lockSheet();
    showBeat();
    if (/^(good|bad)$/.test(simMode || "") || !advBeats.length) finishPlot();
  }

  function showJudgeStamp(kind) {
    const el = $("#judge-stamp");
    if (!el) return;
    const map = { ok: "判定 · 成功", fail: "判定 · 失败", doing: "判定 · 进行中" };
    el.textContent = map[kind] || map.doing;
    el.className = "judge-stamp " + (kind === "ok" || kind === "fail" ? kind : "doing");
    clearTimeout(showJudgeStamp._t);
    showJudgeStamp._t = setTimeout(() => el.classList.add("hidden"), 1400);
  }

  function applyQuestJudge(scene, choice) {
    if (!scene || !scene.quest) return;
    let judge = state.questJudge || "doing";
    if (choice.judge === "ok" || choice.judge === "fail" || choice.judge === "doing") {
      judge = choice.judge;
    } else if (scene.questGate) {
      const aff = Number(choice.aff) || 0;
      if (aff >= 2) judge = "ok";
      else if (aff <= -2) judge = "fail";
    }
    if (/晚餐|吃饭/.test(hudQuestText(scene)) && scene.id !== "lunch") {
      judge = "doing";
    }
    state.questJudge = judge;
    if (judge === "ok" || judge === "fail") showJudgeStamp(judge);
  }

  function hudQuestText(scene) {
    if (scene && scene.id === "live") return fill(scene.quest || state.questKey || "邀请{name}共进晚餐");
    const persist = /^(meet1|hint_phone|tea|desk|coffee|overtime|file|rain|meeting)$/;
    if (scene && persist.test(scene.id)) return "邀请{name}共进晚餐";
    return (scene && scene.quest) || "";
  }

  function save() {
    if (simMode) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      state = Object.assign(defaultState(), parsed);
      if (!state.player) state.player = defaultPlayer();
      if (!state.flags) state.flags = {};
      const infoIds = ["card_lu", "card_you", "card_company", "map_company", "map_city"];
      if (infoIds.indexOf(state.sceneId) !== -1) {
        state.sceneId = "hint_phone";
        state.flags.phoneHint = true;
      }
      if (!state.inbox) state.inbox = { seen: {}, replies: {}, extra: {} };
      if (!state.inbox.seen) state.inbox.seen = {};
      if (!state.inbox.replies) state.inbox.replies = {};
      if (!state.inbox.extra) state.inbox.extra = {};
      state.alert = clamp(Number(state.alert) || 0, 0, 100);
      state.rumor = clamp(Number(state.rumor) || 0, 0, 100);
      state.trust = clamp(Number(state.trust) || 0, 0, 100);
      if (!Array.isArray(state.storyLog)) state.storyLog = [];
      if (!/^img\/bg_/.test(state.lastCg || "")) state.lastCg = "";
      if (state.clockMin == null) state.clockMin = 18 * 60 + 47;
      if (state.money == null) state.money = 1284.6;
      if (!state.bag) state.bag = [];
      if (!state.shopCart) state.shopCart = [];
      if (!state.shopOrders) state.shopOrders = [];
      if (state.shopCoupon == null) state.shopCoupon = 5;
      if (!state.wxCity) state.wxCity = "binjiang";
      if (!state.ledger) state.ledger = [];
      return true;
    } catch (_) {
      return false;
    }
  }

  function toast(text) {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1600);
  }

  function showScreen(name) {
    document.querySelectorAll(".screen").forEach((n) => n.classList.add("hidden"));
    if (name) {
      const el = $(`#screen-${name}`);
      if (el) el.classList.remove("hidden");
    }
  }

  function renderHud() {
    $("#hud-name").textContent = pname();
    $("#stat-aff").textContent = String(state.affection);
    $("#heart-fx").classList.toggle("hidden", state.affection > -20);
    const d = $("#stat-delta");
    if (state.lastDelta > 0) {
      d.textContent = `+${state.lastDelta}`;
      d.className = "delta up";
    } else if (state.lastDelta < 0) {
      d.textContent = String(state.lastDelta);
      d.className = "delta down";
    } else {
      d.textContent = "";
      d.className = "delta";
    }
    const scene = sceneById(state.sceneId);
    const quest = $("#hud-quest");
    const judge = $("#hud-judge");
    const q = hudQuestText(scene);
    if (q) quest.textContent = fill(q);
    else quest.textContent = "暂无任务";
    const j = state.questJudge || "doing";
    const label = j === "ok" ? "成功" : j === "fail" ? "失败" : "进行中";
    judge.textContent = label;
    judge.className = "hud-judge " + (j === "ok" || j === "fail" ? j : "doing");
    quest.className = "hud-quest";
    const bar = $("#hud-aff-bar");
    if (bar) bar.style.width = clamp(state.affection, 0, 100) + "%";
    renderClock();
  }

  function fill(text) {
    if (!text) return "";
    const p = state.player || {};
    return String(text)
      .replace(/\{name\}/g, pname())
      .replace(/\{age\}/g, p.age || "23")
      .replace(/\{appearance\}/g, p.appearance || "—")
      .replace(/\{personality\}/g, p.personality || "—");
  }

  function tutorialDone() {
    const f = state.flags || {};
    return !!(f.seenLuCard && f.seenIdentity && f.seenCorp && f.seenMapDesk && f.seenMapTower);
  }

  function padChoices(list) {
    const seeds = [
      { text: "停在原地看他。", aff: 0, judge: "doing" },
      { text: "点头应一声。", aff: 1, judge: "doing" },
      { text: "当没听见，让他站着。", aff: -2, judge: "fail", flags: { wary: true } }
    ];
    const out = (list || []).slice(0, 3).map((c) => Object.assign({}, c));
    let i = 0;
    while (out.length < 3 && i < 9) {
      const s = seeds[i++ % seeds.length];
      if (out.some((c) => c.text === s.text)) continue;
      out.push(Object.assign({ next: "live" }, s));
    }
    return out.map((c) => Object.assign({ next: c.next || "live" }, c));
  }

  function hintChoices() {
    if (tutorialDone()) {
      return padChoices([
        { text: "把手机收回口袋。", aff: 0, next: "live", note: "看完档案", judge: "ok" },
        { text: "再点开手机确认一眼。", aff: 0, next: "__phone", note: "打开手机", judge: "doing" },
        { text: "抬脚离开电梯厅。", aff: 0, next: "live", note: "离开", judge: "doing" }
      ]);
    }
    if (!state.flags.seenLuCard) {
      return padChoices([
        { text: "拿出手机查看。", aff: 0, next: "__phone", note: "打开系统档案", judge: "doing" },
        { text: "先看锁屏通知。", aff: 0, next: "__phone", note: "打开系统档案", judge: "doing" },
        { text: "把手机握在手里。", aff: 0, next: "__phone", note: "打开系统档案", judge: "doing" }
      ]);
    }
    return padChoices([
      { text: "继续翻看手机。", aff: 0, next: "__phone", note: "继续教程", judge: "doing" },
      { text: "回到桌面再点一遍。", aff: 0, next: "__phone", note: "继续教程", judge: "doing" },
      { text: "打开刚才那条推送。", aff: 0, next: "__phone", note: "继续教程", judge: "doing" }
    ]);
  }

  function sceneChoices(scene) {
    if (scene.id === "hint_phone") return hintChoices();
    return padChoices(scene.choices || []);
  }

  function renderGame() {
    const scene = sceneById(state.sceneId);
    if (!scene) return;
    showScreen(null);
    $("#game-root").classList.remove("hidden");
    const qKey = hudQuestText(scene);
    if (qKey && qKey !== state.questKey) {
      state.questKey = qKey;
      state.questJudge = "doing";
    }
    if (/晚餐|吃饭/.test(qKey) && scene.id !== "lunch" && (state.questJudge === "ok" || state.questJudge === "fail")) {
      state.questJudge = "doing";
    }
    renderHud();
    if (scene.id === "hint_phone") state.flags.phoneHint = true;

    applySceneCg(scene);

    $("#free-input").value = "";
    $("#sys-modal").classList.add("hidden");
    state.sysOpen = false;
    fillSysChat(scene);

    const box = $("#choices");
    box.innerHTML = "";
    sceneChoices(scene).forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.innerHTML = fill(c.text) + (c.hint ? `<span class="hint">${fill(c.hint)}</span>` : "");
      btn.addEventListener("click", () => pick(c));
      box.appendChild(btn);
    });
    startAdv(scene);
    updatePhoneChrome();
    save();
  }

  function goEnding(id) {
    state.ended = id;
    const ed = window.ZC_ENDINGS[id];
    $("#game-root").classList.add("hidden");
    showScreen("ending");
    $("#ending-cg").src = END_CG[id] || "img/cg_ending.png";
    $("#ending-title").textContent = ed.title;
    let body = ed.body;
    if (id === "bankrupt") {
      if (state.affection >= 60) body = ed.bodyWarm;
      else if (state.affection >= 30) body = ed.bodyMute;
      else body = ed.bodyCold;
    }
    $("#ending-body").textContent = fill(body);
    const used = 100 - state.daysLeft;
    const events = state.history.length
      ? state.history.map((h) => `<li>第${h.day}天「${h.title}」${h.delta > 0 ? "+" : ""}${h.delta}：${fill(h.note)}</li>`).join("")
      : "<li>没有留下可回顾的关键事件。</li>";
    $("#settle-box").innerHTML = `
      <p>他攻略${pname()}共 ${used} 天　最终好感：${state.affection}/100　剩余：${state.daysLeft}天</p>
      <ul>${events}</ul>
    `;
    $("#btn-epilogue").classList.toggle("hidden", id !== "perfect");
    save();
  }

  function crowdOf(scene) {
    const id = (scene && scene.id) || "";
    const place = String((scene && scene.place) || "");
    if (id === "live") {
      if (/工位|会议|餐厅|大堂|咖啡/.test(place)) return "public";
      if (/茶水|加班|车库|天台|夜/.test(place)) return "private";
      return "semi";
    }
    if (/^(desk|coffee|meeting|lunch|cover|fever|file|rain)$/.test(id)) return "public";
    if (/^(tea|overtime|track|night|almost|pressure|ten|eve|finale|last_day)$/.test(id)) return "private";
    return "semi";
  }

  function choiceByJudge(opts, judge) {
    const list = opts || [];
    return list.find((c) => c.judge === judge) || list[1] || list[0] || null;
  }

  function classifyFree(text) {
    const s = String(text || "").trim();
    if (/滚|变态|恶心|骚扰|报警|有病吧|去死/.test(s)) return "hostility";
    if (/跟踪|监视|盯梢|你跟踪|干什么|谁让你|为什么找我|你谁/.test(s)) return "probe";
    if (/吻|抱住|牵手|喜欢你|我爱你|亲他|亲上去/.test(s)) return "intimacy";
    if (/走了|先走|回工位|去开会|离开|转身/.test(s)) return "leave";
    if (/沉默|不说话|低头|看手机|假装没看见/.test(s)) return "silence";
    if (/报告|文件|表格|数据|客户|项目|周报|合同/.test(s)) return "work";
    if (/谢谢|辛苦|好喝|正好|收下了/.test(s)) return "thanks";
    if (/(不要|不用|没必要|不必了|不用了|拒绝|躲开|不接|不跟|摇头)/.test(s) && !/不好意思打扰/.test(s)) return "refuse";
    if (/接过|拿过|收下|点头|跟上|跟着|坐下|打开|喝一口|上车|留下/.test(s)) return "accept";
    return "deflect";
  }

  function localJudge(scene, text) {
    const kind = classifyFree(text);
    const play = (scene && scene.play) || "";
    const crowd = crowdOf(scene);
    const table = {
      hostility: { aff: -5, alert: 10, rumor: crowd === "public" ? 8 : 2, trust: -4, judge: "fail", feel: "被冒犯，想拉开距离" },
      probe: { aff: play === "misread" ? -8 : -4, alert: 16, rumor: crowd === "public" ? 6 : 2, trust: -2, judge: "fail", feel: "这不像偶遇" },
      refuse: { aff: -3, alert: 8, rumor: crowd === "public" ? 4 : 0, trust: 0, judge: "fail", feel: "奇怪，不想接" },
      leave: { aff: -2, alert: 4, rumor: 2, trust: 0, judge: "fail", feel: "先离开比较安全" },
      silence: { aff: -1, alert: 3, rumor: 0, trust: 0, judge: "doing", feel: "不知道该怎么接" },
      deflect: { aff: 0, alert: 2, rumor: 0, trust: 0, judge: "doing", feel: "先应付过去" },
      work: { aff: 1, alert: 0, rumor: crowd === "public" ? 2 : 0, trust: 2, judge: "doing", feel: "当工作处理更安心" },
      thanks: { aff: 2, alert: -2, rumor: crowd === "public" ? 3 : 0, trust: 4, judge: "ok", feel: "态度差，但帮到了" },
      accept: { aff: play === "tsundereFeed" ? 4 : 3, alert: -3, rumor: crowd === "public" ? 5 : 0, trust: 6, judge: "ok", feel: "他在做，只是嘴硬" },
      intimacy: { aff: crowd === "public" ? 1 : 4, alert: crowd === "public" ? 8 : 2, rumor: crowd === "public" ? 14 : 2, trust: 2, judge: "doing", feel: "越界了，全场都看见" }
    };
    const row = Object.assign({ kind }, table[kind] || table.deflect);
    if (play === "tsundereFeed" && kind === "accept") row.aff = 4;
    if (play === "workplaceCover" && (kind === "accept" || kind === "thanks")) row.aff = Math.max(row.aff, 3);
    if (play === "misread" && kind === "accept") row.aff = 2;
    if (play === "misread" && kind === "probe") row.aff = -8;
    row.echo = buildEcho(scene, row);
    return row;
  }

  function buildEcho(scene, row) {
    const crowd = crowdOf(scene);
    const kind = row.kind || "";
    if (kind === "hostility") return "他被顶得耳根一僵，像在董事会上当众挨训。下一秒系统又把他钉在原地。";
    if (kind === "probe") return "他张了张嘴，没能解释。系统弹窗正在骂他。";
    if (kind === "refuse") return "他的手顿了半秒，收回去。像被退货的人。";
    if (kind === "leave") return "他想跟，系统却只许他继续开口。他只能站在原处，难看极了。";
    if (kind === "silence") return "空气空了一拍。他的下一句更短，也更像吃瘪。";
    if (kind === "work") return "他把话题按回文件上。像刚才什么都没额外发生。";
    if (kind === "thanks" || kind === "accept") {
      if ((scene && scene.play) === "tsundereFeed") return "东西已经在你手里。他早走了半步，没回头。";
      if (crowd === "public") return "隔间有人把椅子转回来。键盘声故意敲得更响。";
      return "他办完就走。桌上多了一件不该出现的东西。";
    }
    if (kind === "intimacy") {
      return crowd === "public" ? "全层安静了一秒。有人假装喝水。" : "他耳根没有动，只把视线挪开。";
    }
    if (crowd === "public" && (row.rumor || 0) >= 4) return "有人侧目，又很快低下头。";
    return "";
  }

  function collectApiText(msg) {
    if (!msg) return "";
    if (typeof msg === "string") return msg;
    return [msg.reasoning_content, msg.reasoning, msg.thinking, msg.content]
      .filter(Boolean)
      .join("\n");
  }

  function stripThink(s) {
    return String(s || "")
      .replace(/<think>[\s\S]*?<\/think>/gi, "\n")
      .replace(/```(?:json)?/gi, "")
      .trim();
  }

  function extractJsonObjects(s) {
    const out = [];
    let depth = 0;
    let start = -1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "{") {
        if (depth === 0) start = i;
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        if (depth === 0 && start >= 0) {
          try { out.push(JSON.parse(s.slice(start, i + 1))); } catch (_) {}
          start = -1;
        }
        if (depth < 0) depth = 0;
      }
    }
    return out;
  }

  function harvestPlot(text) {
    const t = String(text || "");
    const grab = (keys) => {
      const re = new RegExp("(?:" + keys + ")\\s*[:：]\\s*[「“\"']?([^\\n」”\"']+)", "i");
      const m = t.match(re);
      return m ? String(m[1] || "").trim() : "";
    };
    return {
      nar: grab("旁白|nar"),
      act: grab("动作|act"),
      line: grab("陆晏辞|台词|line")
    };
  }

  function parseJudgeJson(raw) {
    const full = stripThink(collectApiText(raw));
    const objs = extractJsonObjects(full);
    if (!objs.length) {
      const h = harvestPlot(full);
      return h.nar || h.act || h.line ? h : null;
    }
    const scored = objs.find((o) => o && o.nar) || objs.find((o) => o && (o.act || o.line || o.choices)) || objs[0];
    const h = harvestPlot(full);
    if (scored && !scored.nar && h.nar) scored.nar = h.nar;
    if (scored && !scored.act && h.act) scored.act = h.act;
    if (scored && !scored.line && h.line) scored.line = h.line;
    return scored;
  }

  function scrubLeak(s) {
    return String(s || "")
      .replace(/系统[^。！？\n]{0,24}[。！？]?/g, "")
      .replace(/好感度?[^。！？\n]{0,16}[。！？]?/g, "")
      .replace(/攻略[^。！？\n]{0,16}[。！？]?/g, "")
      .replace(/任务面板|嘴毒|被钉住|不许走/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function sanitizeVisible(src) {
    const out = src && typeof src === "object" ? src : {};
    out.nar = scrubLeak(out.nar);
    out.act = scrubLeak(out.act);
    out.line = scrubLeak(out.line);
    return out;
  }

  function rememberScene(scene, beats) {
    if (!state.storyLog) state.storyLog = [];
    const rows = (beats || []).filter((b) => b && b.text);
    if (!rows.length && !state.lastYouAct) return;
    const sig = ((scene && scene.title) || "") + "|" + rows.map((b) => b.text).join("|");
    const last = state.storyLog[state.storyLog.length - 1];
    const lastSig = last ? (last.title || "") + "|" + (last.beats || []).map((b) => b.text).join("|") : "";
    if (sig && sig === lastSig) return;
    state.storyLog.push({
      day: state.calendarDay,
      clock: typeof storyClock === "function" ? storyClock() : "",
      place: (scene && scene.place) || "",
      title: (scene && scene.title) || "",
      you: state.lastYouAct || "",
      beats: rows.map((b) => ({ kind: b.kind, who: b.who, text: b.text }))
    });
    if (state.storyLog.length > 48) state.storyLog = state.storyLog.slice(-48);
    state.lastYouAct = "";
  }

  function openLogModal() {
    const box = $("#log-list");
    const logs = state.storyLog || [];
    if (!logs.length) {
      box.innerHTML = "<p class=\"log-empty\">还没有可回顾的段落。往下走几轮就会出现。</p>";
    } else {
      box.innerHTML = logs.map((row) => {
        const head = `第${row.day || 1}天 ${row.clock || ""} · ${row.place || ""}${row.title ? " · " + row.title : ""}`;
        const you = row.you ? `<p class="you">你：${fill(row.you)}</p>` : "";
        const body = (row.beats || []).map((b) => {
          const who = b.kind === "line" ? "陆晏辞" : (b.who || "旁白");
          const text = b.kind === "line" ? `“${b.text}”` : b.text;
          return `<p class="kind-${b.kind || "nar"}">${who}　${fill(text)}</p>`;
        }).join("");
        return `<article class="log-item"><p class="meta">${head}</p>${you}${body}</article>`;
      }).join("");
    }
    $("#log-modal").classList.remove("hidden");
    requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  }

  function closeLogModal() {
    const el = $("#log-modal");
    if (el) el.classList.add("hidden");
  }

  async function apiJudge(scene, text) {
    if (!window.ZC_API || !window.ZC_API.isReady || !window.ZC_API.isReady()) return null;
    const sys = [
      "你判定女主对陆晏辞的当场行动。只输出一个JSON对象。",
      "陆晏辞：36岁总裁，话少，冷脸，被系统逼着跟女主说话，容易吃瘪。嘴上只有顺路/随便/别多想/放着/走/吃。绝不解释，绝不讨好。",
      "女主：基层员工，不知道系统。好感只看她此刻感受：莫名其妙扣分，感到被关心才加。添堵、当没看见、顶回去都该让他当场难看。",
      "公开场合（工位/会议/餐厅）接住关心会积议论；盘问跟踪会抬警惕。",
      "echo必须是一句可见余波：他被噎住、同事侧目、手里的东西。禁止写系统。禁止心理活动，禁止他解释。",
      "字段：kind(accept|thanks|refuse|probe|hostility|work|deflect|silence|leave|intimacy), aff(-8到6整数), alert(-6到20), rumor(0到15), trust(-6到15), feel(不超过12字), echo(一句), judge(ok|fail|doing)"
    ].join("");
    const user = [
      "场景：" + (scene.id || "") + "／" + (scene.title || "") + "／任务" + fill(scene.quest || "无"),
      "他刚才：" + fill(scene.act || "") + "／「" + fill(scene.line || "") + "」",
      "场合：" + crowdOf(scene),
      "当前好感" + state.affection + " 警惕" + (state.alert || 0) + " 议论" + (state.rumor || 0) + " 靠谱" + (state.trust || 0),
      "女主动作：「" + text + "」"
    ].join("\n");
    try {
      const msg = await window.ZC_API.complete([
        { role: "system", content: sys },
        { role: "user", content: user }
      ], { max_tokens: 220, temperature: 0.2, timeout: 9000 });
      const parsed = parseJudgeJson(msg);
      if (!parsed || !parsed.kind) return null;
      const kind = String(parsed.kind);
      return {
        kind,
        aff: clamp(parseInt(parsed.aff, 10) || 0, -8, 6),
        alert: clamp(parseInt(parsed.alert, 10) || 0, -6, 20),
        rumor: clamp(parseInt(parsed.rumor, 10) || 0, 0, 15),
        trust: clamp(parseInt(parsed.trust, 10) || 0, -6, 15),
        judge: /^(ok|fail|doing)$/.test(parsed.judge) ? parsed.judge : "doing",
        feel: String(parsed.feel || "").slice(0, 18),
        echo: String(parsed.echo || buildEcho(scene, { kind, rumor: parsed.rumor })).slice(0, 48)
      };
    } catch (_) {
      return null;
    }
  }

  function applyConsequences(scene, choice) {
    const crowd = crowdOf(scene);
    let aff = Number(choice.aff) || 0;
    let alertD = Number(choice.alert) || 0;
    let rumorD = Number(choice.rumor) || 0;
    let trustD = Number(choice.trust) || 0;
    const flags = choice.flags || {};
    if (flags.wary) alertD += 8;
    if (flags.suspicious) alertD += 14;
    if (flags.sawKindness) trustD += 8;
    if (flags.embarrassed) rumorD += 10;
    if (flags.ateTogether || flags.rainUmbrella) rumorD += 4;
    if (crowd === "public") rumorD += aff >= 2 ? 5 : (aff <= -2 ? 7 : 3);
    if (state.alert >= 50 && aff > 0) aff -= 1;
    if (state.alert >= 70 && flags.suspicious) aff -= 2;
    if (state.trust >= 40 && flags.sawKindness) aff += 1;
    if (state.rumor >= 50 && crowd === "public" && aff > 0) aff -= 1;
    const vibe = vibeOf(state.player && state.player.personality);
    if (vibe === "soft" && flags.sawKindness) aff += 1;
    if (vibe === "cool" && (flags.suspicious || flags.wary)) aff -= 1;
    if (vibe === "lively" && aff < 0) aff += 1;
    if (choice.flags && choice.flags.sawKindness && state.flags.sawKindness) aff += 1;
    if (state.graceActive) aff = Math.round(aff * 1.5);
    const prevRumor = state.rumor || 0;
    const prevAlert = state.alert || 0;
    state.affection = clamp(state.affection + aff, -40, 100);
    state.lastDelta = aff;
    state.alert = clamp(prevAlert + alertD, 0, 100);
    state.rumor = clamp(prevRumor + rumorD, 0, 100);
    state.trust = clamp((state.trust || 0) + trustD, 0, 100);
    if (choice.echo) {
      state.pendingEcho = choice.echo;
    } else if (!choice.free && crowd === "public") {
      if (prevRumor < 25 && state.rumor >= 25) state.pendingEcho = "隔间方向有目光扫过来，又很快收回。";
      else if (prevRumor < 50 && state.rumor >= 50) state.pendingEcho = "茶水间有人压低声音：陆总又下来了。";
    }
    return aff;
  }

  function hasRipple(tag) {
    return !!(state.flags && state.flags["ripple_" + tag]);
  }

  function markRipple(tag) {
    if (!state.flags) state.flags = {};
    state.flags["ripple_" + tag] = true;
  }

  function pushInboxLine(threadId, who, text, tag) {
    if (hasRipple(tag)) return;
    markRipple(tag);
    if (!state.inbox) state.inbox = { seen: {}, replies: {}, extra: {} };
    if (!state.inbox.extra) state.inbox.extra = {};
    const extra = state.inbox.extra[threadId] || [];
    extra.push({ who: who, text: text, after: state.sceneId || "hint_phone", tag: "ripple:" + tag });
    state.inbox.extra[threadId] = extra;
  }

  function rippleApps(prev) {
    const rumor = state.rumor || 0;
    const alert = state.alert || 0;
    const trust = state.trust || 0;
    const drop = Number(state.lastDelta) || 0;
    if ((prev.rumor || 0) < 25 && rumor >= 25) {
      pushInboxLine("chen", "them", "陆总今天是不是又下来了？工位这边气氛好怪。", "rumor25");
    }
    if ((prev.rumor || 0) < 50 && rumor >= 50) {
      pushInboxLine("chen", "them", "茶水间都在传你。你小心点，别被卷进去。", "rumor50");
    }
    if ((prev.alert || 0) < 40 && alert >= 40) {
      pushInboxLine("unknown", "them", "别多想。", "alert40");
    }
    if ((prev.trust || 0) < 40 && trust >= 40) {
      pushInboxLine("unknown", "them", "中午有空。", "trust40");
    }
    if (drop <= -3) {
      pushInboxLine("chen", "them", "你脸色不太对？要不要先撤。", "drop_" + (state.sceneId || "x"));
    }
    if (state.daysLeft <= 30) {
      pushInboxLine("hr", "them", "【内部】近期跨层会议加密。非对口勿停留。", "corp30");
    }
    if (state.affection < 0) {
      pushInboxLine("hr", "them", "【行政】今晚裙楼提早关灯。加班走侧门。", "affneg");
    }
  }

  function pick(choice) {
    return pickAsync(choice);
  }

  function nextScriptScene(currentId) {
    const list = window.ZC_SCENES || [];
    const i = list.findIndex((s) => s.id === currentId);
    if (currentId === "live") {
      const beat = Math.min((state.history || []).length, list.length - 1);
      return list[Math.max(2, beat)] || list.find((s) => s.id === "tea");
    }
    const next = i >= 0 ? list[i + 1] : null;
    if (next && !/^(clear|epilogue|last_day)$/.test(next.id)) return next;
    return list.find((s) => s.id === "tea") || list[0];
  }

  function stayPlace() {
    const cur = sceneById(state.sceneId) || {};
    return cur.place || (state.live && state.live.place) || "基层办公区";
  }

  function localContinue(choice) {
    const src = nextScriptScene(state.sceneId) || {};
    const here = stayPlace();
    const same = src.place === here;
    const choices = padChoices((src.choices || []).map((c) => Object.assign({}, c, { next: "live" })));
    return {
      title: same ? (src.title || "继续") : "还没走",
      place: here,
      quest: src.quest || state.questKey || "邀请{name}共进晚餐",
      nar: same ? (src.nar || "他还站在原处。像有下一句没说完，又像在等你先动。") : "他还站在原处。像有下一句没说完，又像在等你先动。",
      act: same ? (src.act || "喉结动了一下，重新看向你") : "喉结动了一下，重新看向你",
      line: same ? (src.line || "还在？") : "还在？",
      sys: src.sys || [
        { who: "sys", text: "不许换地方。必须再跟{name}说一句，而且要被她接住。" },
        { who: "lu", text: "……知道了。" },
        { who: "sys", text: "你刚才已经吃瘪了。再来。禁止用「顺路」交差。" }
      ],
      choices,
      jump: 0,
      mins: estimateMinutes(choice, src)
    };
  }

  function normalizeLive(raw, fallback) {
    const src = raw && typeof raw === "object" ? raw : {};
    const fb = fallback || localContinue({});
    const sys = Array.isArray(src.sys) ? src.sys.slice(0, 4).map((row) => ({
      who: row && row.who === "lu" ? "lu" : "sys",
      text: String((row && row.text) || "").slice(0, 80)
    })).filter((row) => row.text) : fb.sys;
    const choices = padChoices((Array.isArray(src.choices) ? src.choices : []).map((c) => ({
      text: String((c && c.text) || "").slice(0, 22),
      aff: clamp(parseInt(c && c.aff, 10) || 0, -8, 6),
      judge: /^(ok|fail|doing)$/.test(c && c.judge) ? c.judge : "doing",
      note: String((c && c.note) || (c && c.text) || "").slice(0, 18),
      flags: (c && c.flags) || {},
      next: "live"
    })).filter((c) => c.text));
    const jumped = Number(src.jump) >= 1;
    sanitizeVisible(src);
    sanitizeVisible(fb);
    return {
      title: String(src.title || fb.title).slice(0, 16),
      place: jumped && src.place ? String(src.place).slice(0, 12) : String(fb.place || stayPlace()).slice(0, 12),
      quest: String(src.quest || fb.quest).slice(0, 24),
      nar: String(src.nar || fb.nar).slice(0, 220),
      act: String(src.act || fb.act).slice(0, 80),
      line: String(src.line || fb.line).slice(0, 40),
      sys: sys.length ? sys : fb.sys,
      choices,
      jump: jumped ? 1 : 0,
      mins: clamp(parseInt(src.mins, 10) || fallback.mins || 15, 5, 180)
    };
  }

  async function apiContinue(choice) {
    const fallback = localContinue(choice);
    if (simMode || !window.ZC_API || !window.ZC_API.isReady || !window.ZC_API.isReady()) {
      return fallback;
    }
    const scene = sceneById(state.sceneId) || {};
    const here = stayPlace();
    const sys = [
      "你是文字恋爱游戏编剧。先想清楚这一幕，再只输出一个JSON对象，不要markdown。",
      "默认必须留在当前地点，place原样写「" + here + "」。禁止换茶水间/餐厅/车库/天台来换场。只有隔夜才允许改place并把jump设为1。",
      "玩家不知道系统存在。nar、act、line 必须是旁观者能看懂的完整一幕：他为什么出现、做了什么、说了什么。禁止在这三字段写系统、任务、好感、攻略、被钉住。",
      "陆晏辞对外是正常人：36岁高冷总裁，话少、冷脸，但句子完整，像开会时的口吻。不要只丢单字命令。act必须写清可见动作。",
      "系统只存在于sys字段，用来逼他开口、让他吃瘪。不许他只放东西就走。",
      "选项必须是女主此刻能做的动作，正好3个：接住、冷淡、添堵。每条不超过16字。禁止心情描写当选项。添堵aff为负。",
      "mins是这一轮动作花费的分钟数，5到180。短对话约8-15。隔夜才把 jump 设为1。",
      "字段：title, place, quest, nar, act, line, sys([{who:sys|lu,text}]), choices([{text,aff,judge,note}]), mins, jump(0或1)"
    ].join("");
    const user = [
      "女主：" + pname() + "，" + (state.player && state.player.age || "23") + "岁，" + (state.player && state.player.personality || ""),
      "当前地点（必须沿用）：" + here,
      "刚才动作：" + String(choice.text || "").replace(/<[^>]+>/g, ""),
      "上一句他：" + fill(scene.line || "……"),
      "好感" + state.affection + " 警惕" + (state.alert || 0) + " 议论" + (state.rumor || 0) + " 靠谱" + (state.trust || 0) + " 剩余" + state.daysLeft + "天",
      "当前任务：" + fill(scene.quest || "邀请{name}共进晚餐"),
      "判定余波：" + (choice.echo || state.pendingEcho || "无"),
      "这一轮让他继续站在原地开口，并且吃瘪。"
    ].join("\n");
    try {
      const msg = await window.ZC_API.complete([
        { role: "system", content: sys },
        { role: "user", content: user }
      ], { max_tokens: 1600, temperature: 0.7, timeout: 28000 });
      const parsed = parseJudgeJson(msg);
      if (!parsed || (!parsed.nar && !parsed.act && !parsed.line)) return fallback;
      return normalizeLive(parsed, fallback);
    } catch (_) {
      return fallback;
    }
  }

  let picking = false;

  async function pickAsync(choice) {
    if (picking) return;
    if (choice.next === "__phone") {
      openPhone();
      return;
    }
    picking = true;
    const scene = sceneById(state.sceneId);
    const prev = {
      rumor: state.rumor || 0,
      alert: state.alert || 0,
      trust: state.trust || 0
    };
    try {
      const delta = applyConsequences(scene, choice);
      Object.assign(state.flags, choice.flags || {});
      applyQuestJudge(scene, choice);
      state.lastYouAct = String(choice.text || "").replace(/<[^>]+>/g, "").slice(0, 24);
      state.lastNote = String(choice.note || choice.text || "").replace(/<[^>]+>/g, "").slice(0, 36);
      renderHud();
      state.history.push({
        day: state.calendarDay,
        title: scene.title,
        delta,
        note: choice.note || String(choice.text || "").replace(/<[^>]+>/g, "").slice(0, 28)
      });

      const currentId = state.sceneId;
      if (choice.ending) {
        applyJump(choice.jump || 0);
        rippleApps(prev);
        goEnding(choice.ending);
        return;
      }

      const scripted = /^(meet1|last_day|clear|epilogue)$/.test(currentId) && choice.next && choice.next !== "live" && choice.next !== "__phone";
      advanceStoryClock(estimateMinutes(choice, scene));
      rippleApps(prev);

      if (state.affection >= 100 && !state.epilogue && currentId !== "clear" && currentId !== "epilogue") {
        state.sceneId = "clear";
        toast("他对你的好感已满");
        renderGame();
        return;
      }

      const forced = checkEndingAfterJump();
      if (forced === "grace") {
        state.graceUsed = true;
        state.graceActive = true;
        state.daysLeft = 0;
        state.sceneId = "last_day";
        toast("系统给了他最后一天");
        renderGame();
        return;
      }
      if (forced && forced !== "grace") {
        goEnding(forced);
        return;
      }

      state.graceActive = false;

      if (scripted) {
        state.sceneId = choice.next;
        renderGame();
        return;
      }

      toast("生成后续…");
      const live = await apiContinue(choice);
      advanceStoryClock(live.mins || estimateMinutes(choice, scene));
      if (Number(live.jump) >= 1) skipDays(live.jump);
      if (choice.echo) state.pendingEcho = choice.echo;
      state.live = live;
      state.sceneId = "live";
      renderGame();
    } finally {
      picking = false;
    }
  }

  async function submitFree() {
    const input = $("#free-input");
    const btn = input && input.form ? input.form.querySelector("button") : null;
    const text = (input.value || "").trim();
    if (!text) {
      toast("先写一个动作");
      return;
    }
    const scene = sceneById(state.sceneId);
    const opts = sceneChoices(scene);
    if (!opts.length) return;
    input.value = "";
    if (btn) btn.disabled = true;
    let row = null;
    try {
      row = await apiJudge(scene, text);
    } catch (_) {
      row = null;
    }
    if (!row) row = localJudge(scene, text);
    if (btn) btn.disabled = false;
    const fallback = choiceByJudge(opts, row.judge) || opts[1] || opts[0];
    const flags = Object.assign({}, fallback.flags || {});
    if (row.kind === "probe" || row.kind === "hostility") flags.suspicious = true;
    if (row.kind === "refuse" || row.kind === "leave") flags.wary = true;
    if ((row.kind === "accept" || row.kind === "thanks") && row.aff >= 2) flags.sawKindness = true;
    pick({
      text,
      aff: row.aff,
      alert: row.alert,
      rumor: row.rumor,
      trust: row.trust,
      echo: row.echo,
      free: true,
      next: fallback.next,
      ending: fallback.ending,
      jump: fallback.jump,
      flags,
      judge: row.judge,
      note: (row.feel || "自由行动") + "：" + text.slice(0, 16)
    });
  }

  function startNew() {
    const player = Object.assign(defaultPlayer(), state.player || draft);
    state = defaultState();
    state.player = player;
    state.sceneId = "meet1";
    state.lastDelta = 0;
    $("#phone-os").classList.add("hidden");
    $("#phone-fab").classList.remove("hidden");
    renderGame();
    showBrief();
  }

  async function testApiAndEnter() {
    const status = $("#api-status");
    const btn = $("#btn-api-test");
    const key = $("#api-key").value;
    const model = $("#api-model").value;
    status.className = "api-status";
    status.textContent = "正在测试 DeepSeek…";
    btn.disabled = true;
    try {
      await window.ZC_API.test(key, model);
      status.className = "api-status ok";
      status.textContent = "测试通过，正在进入。";
      toast("DeepSeek 已接通");
      if (apiEnterMode === "continue") enterLoadedGame();
      else startNew();
    } catch (err) {
      status.className = "api-status err";
      status.textContent = (err && err.message) || "测试失败";
    } finally {
      btn.disabled = false;
    }
  }

  function continueGame() {
    if (!load() || !sceneById(state.sceneId)) {
      toast("没有可读的进度");
      return;
    }
    if (!window.ZC_API.isReady()) {
      const saved = window.ZC_API.load();
      $("#api-key").value = saved.key || "";
      $("#api-model").value = saved.model || "deepseek-v4-flash";
      $("#api-status").textContent = "继续游戏前请先测通 DeepSeek";
      $("#api-status").className = "api-status";
      apiEnterMode = "continue";
      showScreen("api");
      return;
    }
    enterLoadedGame();
  }

  function enterLoadedGame() {
    if (state.ended) {
      goEnding(state.ended);
      return;
    }
    renderGame();
    if (!state.flags.briefed) showBrief();
  }

  function fillSetup() {
    $("#player-name").value = draft.name || "苏晚";
    $("#player-age").value = draft.age || "23";
    $("#player-look-text").value = draft.appearance || "";
    $("#player-nature").value = draft.personality || "";
    const idx = Math.max(0, LOOKS.indexOf(draft.look));
    setLookIndex(idx);
  }

  function readSetup() {
    const name = ($("#player-name").value || "").trim().slice(0, 8) || "苏晚";
    let age = String($("#player-age").value || "23").replace(/\D/g, "");
    const n = clamp(parseInt(age || "23", 10), 18, 35);
    draft.name = name;
    draft.age = String(n);
    draft.appearance = ($("#player-look-text").value || "").trim().slice(0, 80);
    draft.personality = ($("#player-nature").value || "").trim().slice(0, 80);
    draft.look = LOOKS[lookIndex] || "a";
  }

  let lookIndex = 0;

  function setLookIndex(i) {
    const n = LOOKS.length;
    lookIndex = ((i % n) + n) % n;
    draft.look = LOOKS[lookIndex];
    const cards = document.querySelectorAll(".cf-card");
    cards.forEach((card, idx) => {
      let d = idx - lookIndex;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      const x = d * 102;
      const ry = d * -40;
      const z = d === 0 ? 70 : -42;
      const s = d === 0 ? 1 : 0.84;
      const b = d === 0 ? 1 : 0.58;
      card.style.transform = `translateX(${x}px) rotateY(${ry}deg) translateZ(${z}px) scale(${s})`;
      card.style.filter = `brightness(${b})`;
      card.style.zIndex = String(5 - Math.abs(d));
      card.classList.toggle("is-center", d === 0);
    });
    const dots = $("#cf-dots");
    if (dots && !dots.childElementCount) {
      LOOKS.forEach((_, idx) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "cf-dot";
        b.addEventListener("click", () => setLookIndex(idx));
        dots.appendChild(b);
      });
    }
    document.querySelectorAll(".cf-dot").forEach((dot, idx) => {
      dot.classList.toggle("on", idx === lookIndex);
    });
  }

  function bindCoverflow() {
    const stage = $("#cf-stage");
    if (!stage) return;
    $("#cf-prev").addEventListener("click", () => setLookIndex(lookIndex - 1));
    $("#cf-next").addEventListener("click", () => setLookIndex(lookIndex + 1));
    document.querySelectorAll(".cf-card").forEach((card, idx) => {
      card.addEventListener("click", () => setLookIndex(idx));
    });
    let x0 = 0;
    let dragging = false;
    stage.addEventListener("pointerdown", (e) => {
      dragging = true;
      x0 = e.clientX;
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - x0;
      if (dx > 36) setLookIndex(lookIndex - 1);
      else if (dx < -36) setLookIndex(lookIndex + 1);
    });
    stage.addEventListener("pointercancel", () => { dragging = false; });
  }

  let mapTab = "company";
  let mapSpot = null;
  let mapInside = null;
  let mapLu = {};
  let inboxThread = null;
  let inboxBusy = false;
  let currentPhoneApp = null;
  let corpPage = "home";
  let corpDeep = false;
  let shopPage = "home";
  let shopCat = "全部";
  let shopQuery = "";
  let shopItemId = "";
  let shopPayMode = "cart";
  let wxPage = "now";

  function storyTod() {
    const h = Math.floor((state.clockMin || 0) / 60) % 24;
    if (h < 11) return "morning";
    if (h < 17) return "noon";
    return "evening";
  }

  function storyClock() {
    const pad = (n) => String(n).padStart(2, "0");
    const total = Math.max(0, state.clockMin || 0);
    return pad(Math.floor(total / 60) % 24) + ":" + pad(total % 60);
  }

  function todLabel() {
    return { morning: "早上", noon: "下午", evening: "晚上" }[storyTod()] || "下午";
  }

  function applyPhoneTod() {
    const tod = storyTod();
    const frame = document.querySelector(".pos-frame");
    if (frame) {
      frame.classList.remove("is-morning", "is-noon", "is-evening");
      frame.classList.add("is-" + tod);
    }
    const wall = $("#pos-wall");
    if (wall) wall.src = `img/wall_${tod}.png`;
    const clock = storyClock();
    const timeEl = $("#pos-clock");
    const big = $("#pos-big-clock");
    if (timeEl) timeEl.textContent = clock;
    if (big) big.textContent = clock;
    const dateEl = $("#pos-home-date");
    if (dateEl) dateEl.textContent = `第${state.calendarDay}天 · ${todLabel()}`;
    const ret = $("#pos-home-btn");
    if (ret) {
      const inApp = !$("#pos-app").classList.contains("hidden");
      ret.textContent = inApp ? "返回桌面" : "返回游戏";
    }
  }

  function updatePhoneChrome() {
    const guideUnread = !!(state.flags.phoneHint && !tutorialDone());
    const msgUnread = inboxHasUnread();
    const unread = guideUnread || msgUnread;
    const fab = $("#phone-fab");
    fab.classList.toggle("has-unread", unread);
    $("#phone-fab-badge").classList.toggle("hidden", !unread);
    $("#phone-nudge").classList.toggle("hidden", !guideUnread);
    $("#pos-dot-dossier").classList.toggle("hidden", !(state.flags.phoneHint && !state.flags.seenLuCard));
    $("#pos-dot-inbox").classList.toggle("hidden", !msgUnread);
    $("#pos-home-name").textContent = pname();
    const p = state.player || {};
    $("#pos-home-sub").textContent = `${p.age || "23"}岁 · 晏辞集团基层`;
    applyPhoneTod();
    if ($("#phone-os").classList.contains("hidden")) {
      $("#phone-fab").classList.remove("hidden");
    }
    applyFabPos();
    updateCoach();
    highlightGuideApps();
  }

  function applyFabPos() {
    const fab = $("#phone-fab");
    const pos = state.phoneFab;
    if (pos && pos.left != null) {
      fab.style.left = `${pos.left}px`;
      fab.style.top = `${pos.top}px`;
      fab.style.right = "auto";
      fab.classList.toggle("is-left", pos.left < 80);
    }
  }

  function plateOf(scene) {
    const place = String((scene && scene.place) || "");
    if (PLACE_BG[place]) return PLACE_BG[place];
    if (/电梯/.test(place)) return "img/bg_elevator.png";
    if (/夜|天台|总裁办|他的办公|车库/.test(place)) return "img/bg_night.png";
    return "img/bg_office.png";
  }

  function setGameCg(src) {
    const cg = $("#cg");
    const sprite = $("#sprite-lu");
    if (sprite && !/sprite_lu\.png/.test(sprite.getAttribute("src") || "")) {
      sprite.src = SPRITE_LU;
    }
    if (!cg || !src) return;
    $("#game-root").classList.remove("is-photo");
    if (src === state.lastCg) return;
    const swap = !!state.lastCg;
    const apply = () => {
      cg.src = src;
      state.lastCg = src;
      cg.classList.remove("is-fading");
    };
    if (swap) {
      cg.classList.add("is-fading");
      window.setTimeout(apply, 220);
    } else {
      apply();
    }
  }

  function applySceneCg(scene) {
    setGameCg(plateOf(scene) || state.lastCg || STAND_BG);
    const sprite = $("#sprite-lu");
    if (sprite) sprite.classList.toggle("hidden", !!(scene && scene.luVisible === false));
  }

  function restoreSceneCg() {
    applySceneCg(sceneById(state.sceneId));
  }

  function coachCopy() {
    const f = state.flags || {};
    if (!f.phoneHint) return "";
    if (!f.seenLuCard) return "打开<b>档案</b>。";
    if (!f.seenIdentity) return "再看<b>身份</b>。";
    if (!f.seenCorp) return "打开<b>集团</b>。";
    if (!f.seenMapDesk) return "地图点<b>裙楼</b>。";
    if (!f.seenMapTower) return "城市页点<b>晏辞大厦</b>。";
    return "看完了。<b>收起手机</b>。";
  }

  function updateCoach() {
    const el = $("#pos-coach");
    const phoneOpen = !$("#phone-os").classList.contains("hidden");
    if (!phoneOpen || !state.flags.phoneHint || currentPhoneApp === "inbox" || currentPhoneApp === "maps") {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    el.innerHTML = coachCopy();
    el.classList.toggle("is-top", !$("#pos-app").classList.contains("hidden"));
  }

  function highlightGuideApps() {
    const f = state.flags || {};
    const target = !f.seenLuCard ? "dossier"
      : !f.seenIdentity ? "identity"
      : !f.seenCorp ? "corp"
      : (!f.seenMapDesk || !f.seenMapTower) ? "maps"
      : "";
    document.querySelectorAll(".pos-app").forEach((btn) => {
      btn.classList.toggle("is-guide", !!target && btn.getAttribute("data-app") === target);
    });
  }

  function openPhone() {
    $("#phone-os").classList.remove("hidden");
    $("#phone-fab").classList.add("hidden");
    showPhoneHome();
    updatePhoneChrome();
  }

  function closePhone() {
    $("#phone-os").classList.add("hidden");
    $("#phone-fab").classList.remove("hidden");
    restoreSceneCg();
    if (state.sceneId === "hint_phone") renderGame();
    else updatePhoneChrome();
  }

  function showPhoneHome() {
    currentPhoneApp = null;
    inboxThread = null;
    $("#pos-home").classList.remove("hidden");
    $("#pos-app").classList.add("hidden");
    updatePhoneChrome();
  }

  function openApp(id) {
    currentPhoneApp = id;
    if (id === "inbox") inboxThread = null;
    $("#pos-home").classList.add("hidden");
    $("#pos-app").classList.remove("hidden");
    $("#pos-back").textContent = "返回桌面";
    const titles = {
      dossier: "档案",
      identity: "身份",
      corp: "晏辞集团",
      maps: "地图",
      shop: "即达",
      inbox: "讯息",
      cal: "日历",
      weather: "天气",
      wallet: "钱包",
      sys: "系统"
    };
    $("#pos-app-title").textContent = titles[id] || "应用";
    if (id === "dossier" && state.flags.phoneHint) {
      state.flags.seenLuCard = true;
    }
    if (id === "identity") {
      state.flags.seenIdentity = true;
    }
    if (id === "corp") {
      state.flags.seenCorp = true;
      corpDeep = false;
    }
    if (id === "maps") {
      if (!state.flags.seenMapDesk) mapTab = "company";
      else if (!state.flags.seenMapTower) mapTab = "city";
      mapSpot = null;
      mapInside = null;
    }
    if (id === "shop") {
      shopPage = "home";
      shopCat = "全部";
      shopQuery = "";
      shopItemId = "";
    }
    if (id === "weather") {
      wxPage = "now";
    }
    renderPhoneApp(id);
    updatePhoneChrome();
    save();
  }

  function paras(lines) {
    return (lines || []).map((t) => `<p>${fill(t)}</p>`).join("");
  }

  function rollSpotLu(spot) {
    const set = {};
    (spot.insides || []).forEach((inn) => {
      const p = inn.lu != null ? inn.lu : (spot.lu != null ? spot.lu : 0.2);
      set[inn.id] = Math.random() < p;
    });
    mapLu[spot.id] = set;
    return set;
  }

  function localMapBeat(inn, luHere) {
    const name = inn.name || "这里";
    if (luHere) {
      return {
        title: name,
        place: name,
        quest: state.questKey || "邀请{name}共进晚餐",
        nar: "你走到" + name + "。陆晏辞站在不远处，像是刚停步。",
        act: "看了你一眼，没解释",
        line: "顺路。",
        sys: [
          { who: "sys", text: "偶遇。别像查勤。" },
          { who: "lu", text: "……知道了。" }
        ],
        choices: padChoices([
          { text: "点头走过。", aff: 1, judge: "doing" },
          { text: "停下来看他。", aff: 0, judge: "doing" },
          { text: "当没看见。", aff: -1, judge: "doing", flags: { wary: true } }
        ]),
        jump: 0,
        mins: 8
      };
    }
    return {
      title: name,
      place: name,
      quest: state.questKey || "邀请{name}共进晚餐",
      nar: name + "此刻很普通。没有人特意等你。",
      act: "风从通道里过来",
      line: "",
      sys: [
        { who: "sys", text: "他不在。别空转。" },
        { who: "lu", text: "……" }
      ],
      choices: padChoices([
        { text: "再看一眼四周。", aff: 0, judge: "doing" },
        { text: "拿出手机。", aff: 0, next: "__phone", judge: "doing" },
        { text: "离开这里。", aff: 0, judge: "doing" }
      ]),
      jump: 0,
      mins: 6
    };
  }

  async function apiMapBeat(inn, luHere) {
    const fallback = localMapBeat(inn, luHere);
    if (simMode || !window.ZC_API || !window.ZC_API.isReady || !window.ZC_API.isReady()) return fallback;
    const sys = [
      "你是文字恋爱游戏编剧。只输出JSON。",
      "地点：" + (inn.name || "") + "。陆晏辞" + (luHere ? "在场，系统逼他开口，并让他吃瘪。" : "不在。"),
      "在场时他对外是正常人：话少、句子完整，必须有可见动作和一句完整台词。不在场就写普通路过，不要硬塞他。",
      "nar/act/line 禁止出现系统。女主是基层员工。选项3个动作。mins 5-20。",
      "字段：title, place, nar, act, line, sys([{who:sys|lu,text}]), choices([{text,aff,judge,note}]), mins"
    ].join("");
    try {
      const msg = await window.ZC_API.complete([
        { role: "system", content: sys },
        { role: "user", content: "好感" + state.affection + " 剩余" + state.daysLeft + "天。写这一遇。" }
      ], { max_tokens: 900, temperature: 0.75, timeout: 20000 });
      const parsed = parseJudgeJson(msg);
      if (!parsed || (!parsed.nar && !parsed.act && !parsed.line)) return fallback;
      return normalizeLive(parsed, fallback);
    } catch (_) {
      return fallback;
    }
  }

  async function travelInside(spot, inn) {
    const luMap = mapLu[spot.id] || rollSpotLu(spot);
    const luHere = !!luMap[inn.id];
    mapInside = inn.id;
    closePhone();
    applySceneCg({ place: inn.name, cg: inn.cg });
    advanceStoryClock(inn.mins || 10);
    toast(luHere ? "他在这里。" : "到了。");
    const live = await apiMapBeat(inn, luHere);
    state.live = live;
    state.sceneId = "live";
    renderGame();
  }

  function renderInteractiveMap(body) {
    const maps = window.ZC_MAPS || {};
    const key = mapTab === "city" ? "city" : "company";
    const pack = maps[key];
    if (!pack) return;
    body.classList.add("is-map");
    if (mapSpot) {
      const spot = (pack.spots || []).find((s) => s.id === mapSpot) || pack.spots[0];
      if (!mapLu[spot.id]) rollSpotLu(spot);
      const luMap = mapLu[spot.id] || {};
      const ox = spot.x != null ? spot.x : 50;
      const oy = spot.y != null ? spot.y : 50;
      const goes = (spot.insides || []).map((inn) => {
        const here = luMap[inn.id] ? " lu" : "";
        return `<button type="button" class="imap-go${here}" data-in="${inn.id}">前往${inn.name}${luMap[inn.id] ? " · 他在" : ""}</button>`;
      }).join("");
      body.innerHTML = `
        <div class="imap">
          <button type="button" class="imap-back" id="imap-back">返回总图</button>
          <div class="imap-stage is-zoom">
            <div class="imap-frame">
              <img src="${pack.img}" alt="" style="transform-origin:${ox}% ${oy}%;transform:scale(2.4)">
            </div>
          </div>
          <div class="imap-info">
            <b>${spot.name}</b>
            <p>${mapSpotText(spot)}</p>
            <div class="imap-goes">${goes || "<p>这里没有可进入的点。</p>"}</div>
          </div>
        </div>`;
      const back = $("#imap-back");
      if (back) {
        back.addEventListener("click", () => {
          mapSpot = null;
          mapInside = null;
          renderPhoneApp("maps");
        });
      }
      body.querySelectorAll("[data-in]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const inn = (spot.insides || []).find((x) => x.id === btn.getAttribute("data-in"));
          if (inn) travelInside(spot, inn);
        });
      });
      return;
    }
    const f = state.flags || {};
    const questId = key === "company" ? "desk" : "tower";
    const needQuest = (key === "company" && !f.seenMapDesk) || (key === "city" && !f.seenMapTower);
    const pins = (pack.spots || []).map((s) => {
      const guide = needQuest && s.quest === questId;
      return `<button type="button" class="imap-pin${guide ? " is-guide" : ""}" data-spot="${s.id}" style="left:${s.x}%;top:${s.y}%"><i></i><span>${s.name}</span></button>`;
    }).join("");
    body.innerHTML = `
      <div class="imap">
        <div class="pos-tabs">
          <button type="button" data-map="company" class="${key === "company" ? "on" : ""}">总部</button>
          <button type="button" data-map="city" class="${key === "city" ? "on" : ""}">滨江</button>
        </div>
        <div class="imap-stage">
          <div class="imap-frame">
            <img src="${pack.img}" alt="">
            ${pins}
          </div>
        </div>
        <div class="imap-info" id="imap-info"><b>${pack.title}</b><p>${mapLead()}</p></div>
      </div>`;
    body.querySelectorAll("[data-map]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mapTab = btn.getAttribute("data-map");
        mapSpot = null;
        mapInside = null;
        renderPhoneApp("maps");
      });
    });
    body.querySelectorAll(".imap-pin").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-spot");
        const spot = (pack.spots || []).find((s) => s.id === id);
        if (!spot) return;
        mapSpot = spot.id;
        mapInside = null;
        if (spot.quest === "desk") state.flags.seenMapDesk = true;
        if (spot.quest === "tower") state.flags.seenMapTower = true;
        rollSpotLu(spot);
        save();
        renderPhoneApp("maps");
      });
    });
  }

  function sceneIndex(id) {
    return (window.ZC_SCENES || []).findIndex((s) => s.id === id);
  }

  function sceneReached(id) {
    if (!id || id === "start") return true;
    if (id === "hint_phone") return !!state.flags.phoneHint;
    const now = sceneIndex(state.sceneId);
    const need = sceneIndex(id);
    if (need < 0) return false;
    return now >= need;
  }

  function inboxThreads() {
    return (window.ZC_INBOX || []).filter((t) => sceneReached(t.after));
  }

  function inboxLines(thread) {
    const extra = ((state.inbox && state.inbox.extra) || {})[thread.id] || [];
    const items = [];
    (thread.lines || []).forEach((line, i) => {
      const after = line.after || thread.after;
      if (!sceneReached(after)) return;
      items.push({ who: line.who, text: line.text, _k: sceneIndex(after) * 100 + i });
    });
    extra.forEach((line, i) => {
      const after = line.after || thread.after;
      items.push({
        who: line.who,
        text: line.text,
        pending: !!line.pending,
        _k: sceneIndex(after) * 100 + 50 + i
      });
    });
    items.sort((a, b) => a._k - b._k);
    return items;
  }

  function inboxPreview(thread) {
    const lines = inboxLines(thread);
    const last = lines[lines.length - 1];
    if (!last) return "暂无消息";
    if (last.who === "missed") return last.text;
    if (last.who === "me") return "我：" + fill(last.text);
    return fill(last.text);
  }

  function inboxPending(thread) {
    return (thread.replies || []).find((pack) => {
      const key = thread.id + ":" + pack.after;
      if ((state.inbox.replies || {})[key]) return false;
      if (!sceneReached(pack.after)) return false;
      if (pack.until && sceneReached(pack.until)) return false;
      return true;
    }) || null;
  }

  function inboxUnreadCount(thread) {
    const seen = ((state.inbox && state.inbox.seen) || {})[thread.id] || 0;
    const n = inboxLines(thread).length;
    const pending = inboxPending(thread) ? 1 : 0;
    return Math.max(0, n - seen) + (seen >= n ? pending : 0);
  }

  function inboxHasUnread() {
    if (!state.flags.phoneHint) return false;
    return inboxThreads().some((t) => inboxUnreadCount(t) > 0);
  }

  function markInboxRead(thread) {
    if (!state.inbox.seen) state.inbox.seen = {};
    state.inbox.seen[thread.id] = inboxLines(thread).length;
    save();
  }

  function sendInboxReply(thread, pack, opt) {
    const text = opt && opt.text;
    if (!text) return;
    sendInboxMessage(thread, text, { skip: !!opt.skip, aff: opt.aff, canned: opt.reply, packAfter: pack && pack.after });
  }

  async function sendInboxMessage(thread, text, meta) {
    if (inboxBusy) return;
    const info = meta || {};
    const after = info.packAfter || thread.after || state.sceneId;
    if (info.packAfter) {
      state.inbox.replies[thread.id + ":" + info.packAfter] = text;
    }
    const extra = state.inbox.extra[thread.id] || [];
    if (!info.skip) extra.push({ who: "me", text, after });
    state.inbox.extra[thread.id] = extra;
    if (info.aff) {
      setAffection(state.affection + Number(info.aff));
      state.lastNote = "回复：" + String(text).slice(0, 16);
      state.history.push({
        day: state.calendarDay,
        title: "讯息",
        delta: state.lastDelta,
        note: state.lastNote
      });
    }
    markInboxRead(thread);
    renderPhoneApp("inbox");
    if (info.skip) {
      updatePhoneChrome();
      return;
    }
    if (thread.ai) {
      inboxBusy = true;
      extra.push({ who: "them", text: "正在输入…", after, pending: true });
      state.inbox.extra[thread.id] = extra;
      renderPhoneApp("inbox");
      try {
        let reply = await apiInboxReply(thread, text);
        if (isBlankSms(reply) && info.canned) reply = info.canned;
        extra.pop();
        extra.push({ who: "them", text: reply, after });
        state.inbox.extra[thread.id] = extra;
        if (thread.persona === "lu") {
          const hit = /哪位|你谁|陆总/.test(text);
          if (hit && !info.aff) {
            setAffection(state.affection + 1);
            state.lastNote = "回复未知号码";
            state.history.push({
              day: state.calendarDay,
              title: "讯息",
              delta: state.lastDelta,
              note: state.lastNote
            });
          }
        }
      } finally {
        inboxBusy = false;
      }
      markInboxRead(thread);
      renderPhoneApp("inbox");
    } else if (info.canned) {
      extra.push({ who: "them", text: info.canned, after });
      state.inbox.extra[thread.id] = extra;
      renderPhoneApp("inbox");
    }
    updatePhoneChrome();
    save();
  }

  function isBlankSms(t) {
    return !String(t || "").trim() || /^[.…。，,？?！!\s「」""“”]+$/.test(String(t).trim());
  }

  function cleanSms(raw, thread) {
    let t = String(raw || "")
      .replace(/^["「“]|["」”]$/g, "")
      .replace(/^(陆晏辞|未知号码|陈予|系统)\s*[:：]\s*/, "")
      .trim();
    t = t.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
    const max = thread.persona === "chen" ? 36 : 24;
    return t.slice(0, max);
  }

  function localInboxReply(thread, playerText, used) {
    const t = String(playerText || "");
    const taken = used || {};
    const pick = (arr) => arr.find((x) => x && !taken[x]) || arr[0];
    if (thread.persona === "chen") {
      if (/陆|总裁|下来|工位/.test(t)) return pick(["他真的来咱们层了？你没事吧。", "裙楼都在看你。先别回太长。"]);
      if (/没事|没有|还好/.test(t)) return pick(["那就好。你还是小心点。", "行。回头茶水间说。"]);
      if (/有病|烦|滚/.test(t)) return pick(["……你别在工位上骂。先避一避。", "我懂你烦。先别硬刚。"]);
      if (/\?|？|谁|什么|怎么/.test(t)) return pick(["我看着也奇怪。你先别声张。", "我也不清楚。你别自己去问。"]);
      return pick(["回头茶水间说。别在工位回太长。", "嗯我在。你先忙。", "收到。有事喊我。"]);
    }
    if (/哪位|你谁|谁啊|什么人/.test(t)) return pick(["公司内部。", "别追问号码。", "不是骚扰。"]);
    if (/陆总|陆晏辞|总裁/.test(t)) return pick(["别在短信里喊。", "先工作。", "不是时候。"]);
    if (/有病|神经病|滚|烦不烦/.test(t)) return pick(["先把气消了。", "看到了。", "回头当面说。"]);
    if (/谢谢|谢了|感谢/.test(t)) return pick(["不必。", "嗯。", "收到。"]);
    if (/吃饭|晚饭|中午|午餐/.test(t)) return pick(["十二点。楼下。", "到了发我。", "别迟到。"]);
    if (/好的|嗯|哦|行/.test(t)) return pick(["嗯。", "知道了。", "去忙。"]);
    if (/\?|？/.test(t)) return pick(["不是骚扰。", "回头说。", "先把眼前的做完。"]);
    return pick(["看到了。", "在忙。", "别多想。", "先工作。", "回头说。"]);
  }

  async function apiInboxReply(thread, playerText) {
    const recentThem = inboxLines(thread)
      .filter((l) => l.who === "them" && !l.pending)
      .map((l) => fill(l.text));
    const used = {};
    recentThem.forEach((line) => { used[line] = true; });
    const lastThem = recentThem[recentThem.length - 1] || "";
    const local = () => localInboxReply(thread, playerText, used);
    if (!window.ZC_API || !window.ZC_API.isReady || !window.ZC_API.isReady()) return local();

    const hist = inboxLines(thread)
      .filter((l) => !l.pending)
      .slice(-8)
      .map((l) => {
        const who = l.who === "me" ? pname() : thread.name;
        return who + "：" + fill(l.text);
      })
      .join("\n");
    const lu = [
      "你是陆晏辞，36岁总裁，正在用未知号码给基层员工发短信。",
      "只输出一条短信正文。不要引号，不要解释，不要角色名，不要系统、攻略、好感这些词。",
      "必须针对对方刚刚那句话作答，接住内容，禁止答非所问。",
      "禁止只回省略号、句号、问号。禁止回复与上一句完全相同。",
      "话少、冷、不讨好。8到22个汉字。可以生硬，但不能敷衍。",
      "对方问你是谁：可以说公司内部，或让对方别追问，不能再只回省略号。",
      "对方骂你：回一句人话，短也可以。"
    ].join("");
    const chen = [
      "你是晏辞集团基层同事陈予。只输出一条微信正文，不要引号。",
      "必须针对对方刚发的那句回答。禁止复制上一句。10到28字。",
      "口语、八卦、关心同事。不要写系统或攻略。"
    ].join("");
    const sys = thread.persona === "chen" ? chen : lu;
    const user = [
      "当前场景：" + (state.sceneId || ""),
      "近期对话：",
      hist || "（空）",
      "上一句你发过：" + (lastThem || "无"),
      pname() + "刚刚对你说：「" + playerText + "」",
      "现在立刻回她这一句。必须和「" + playerText + "」有关。"
    ].join("\n");

    async function once(temperature) {
      const msg = await window.ZC_API.complete([
        { role: "system", content: sys },
        { role: "user", content: user }
      ], { max_tokens: 80, temperature: temperature, timeout: 14000 });
      return cleanSms(stripThink(collectApiText(msg)), thread);
    }

    try {
      let t = await once(0.7);
      if (!t || isBlankSms(t) || t === lastThem) t = await once(0.95);
      if (!t || isBlankSms(t) || t === lastThem) t = local();
      return t;
    } catch (_) {
      return local();
    }
  }

  function renderInbox(body) {
    const threads = inboxThreads();
    if (!threads.length) {
      body.classList.remove("is-chat");
      body.innerHTML = `<div class="pos-copy"><p class="kicker">INBOX</p><h3>讯息</h3><p>还没有人给你发消息。</p></div>`;
      return;
    }
    if (inboxThread) {
      const thread = threads.find((t) => t.id === inboxThread) || (window.ZC_INBOX || []).find((t) => t.id === inboxThread);
      if (thread) {
        renderInboxChat(body, thread);
        return;
      }
      inboxThread = null;
    }
    body.classList.remove("is-chat");
    body.classList.add("is-inbox");
    const rows = threads.map((t) => {
      const unread = inboxUnreadCount(t);
      const tone = t.tone || "sys";
      return `<button type="button" class="im-row${unread ? " is-unread" : ""}" data-thread="${t.id}">
        <i class="im-ava tone-${tone}">${t.avatar || "讯"}</i>
        <span class="im-meta">
          <b>${t.name}</b>
          <em>${inboxPreview(t)}</em>
        </span>
        <small>${t.time || ""}</small>
        ${unread ? `<i class="im-badge">${unread > 9 ? "9+" : unread}</i>` : ""}
      </button>`;
    }).join("");
    body.innerHTML = `<div class="im-list">${rows}</div>`;
    body.querySelectorAll("[data-thread]").forEach((btn) => {
      btn.addEventListener("click", () => {
        inboxThread = btn.getAttribute("data-thread");
        renderPhoneApp("inbox");
      });
    });
  }

  function renderInboxChat(body, thread) {
    markInboxRead(thread);
    $("#pos-app-title").textContent = thread.name;
    $("#pos-back").textContent = "返回";
    body.classList.add("is-chat");
    const lines = inboxLines(thread);
    const log = lines.map((line) => {
      if (line.who === "missed") return `<div class="im-missed">${fill(line.text)}</div>`;
      const side = line.who === "me" ? "me" : "them";
      const pending = line.pending ? " is-pending" : "";
      return `<div class="im-b ${side}${pending}"><p>${fill(line.text)}</p></div>`;
    }).join("");
    const pack = inboxPending(thread);
    const chips = pack
      ? `<div class="im-replies">${pack.options.map((opt, i) => `<button type="button" data-opt="${i}"${inboxBusy ? " disabled" : ""}>${opt.text}</button>`).join("")}</div>`
      : "";
    const composer = thread.ai
      ? `<form class="im-compose" id="im-compose"><input id="im-input" type="text" maxlength="40" autocomplete="off" placeholder="回复…" ${inboxBusy ? "disabled" : ""}><button type="submit"${inboxBusy ? " disabled" : ""}>发送</button></form>`
      : "";
    body.innerHTML = `<div class="im-chat"><div class="im-log" id="im-log">${log || `<div class="im-missed">还没有消息</div>`}</div>${chips}${composer}</div>`;
    const logEl = $("#im-log");
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
    if (pack) {
      body.querySelectorAll(".im-replies [data-opt]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const opt = pack.options[Number(btn.getAttribute("data-opt"))];
          if (opt) sendInboxReply(thread, pack, opt);
        });
      });
    }
    const form = $("#im-compose");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = $("#im-input");
        const text = (input.value || "").trim();
        if (!text) return;
        input.value = "";
        sendInboxMessage(thread, text, { packAfter: pack ? pack.after : thread.after });
      });
    }
    updatePhoneChrome();
  }

  function dossierProgress() {
    const bits = [];
    const a = state.affection;
    if (a >= 70) bits.push("系统备忘：攻略不再像任务。他对你停得更久。");
    else if (a >= 30) bits.push("系统备忘：你的反应开始让他失控。");
    else if (a < 0) bits.push("系统备忘：好感在掉。他执行得很差。");
    else bits.push("系统备忘：攻略刚开始。你仍把他当遥远的总裁。");
    if (state.lastNote) {
      const d = state.lastDelta || 0;
      bits.push("上一轮判定：" + state.lastNote + "（" + (d > 0 ? "+" : "") + d + "）");
    }
    return bits.join(" ");
  }

  function identityRipple() {
    const bits = [];
    if (state.rumor >= 40) bits.push("裙楼开始拿你当话题。");
    if (state.trust >= 40) bits.push("你开始能猜到他下一句会有多短。");
    if ((state.lastDelta || 0) < 0) bits.push("刚才那一下，你没惯着他。");
    return bits.map((t) => `<p>${t}</p>`).join("");
  }

  function corpRipple() {
    const bits = [];
    if (state.daysLeft <= 30) bits.push("财务室开会变多。你不知道为什么。");
    if (state.affection < 0) bits.push("楼层灯关得更早。像有人在赶进度。");
    if (state.affection >= 80) bits.push("顶层行程开始对你开放一角。");
    return bits.map((t) => `<p>${t}</p>`).join("");
  }

  function notesCopy(scene) {
    const bits = [];
    if (state.lastNote) {
      const d = state.lastDelta || 0;
      bits.push("上一轮：" + state.lastNote + "（" + (d > 0 ? "+" : "") + d + "）");
    }
    if (state.rumor >= 50) bits.push("裙楼在传：陆总总往你工位走。");
    else if (state.rumor >= 25) bits.push("隔间有人侧目。键盘敲得特别响。");
    if (state.alert >= 40) bits.push("他出现的时机太准。你有点发紧。");
    if (state.trust >= 40) bits.push("你开始能猜到他停顿的意思。");
    if ((state.lastDelta || 0) < 0) bits.push("刚才那一下，他像被噎住，没解释。");
    const q = hudQuestText(scene);
    if (q) {
      const j = state.questJudge === "ok" ? "成功" : state.questJudge === "fail" ? "失败" : "进行中";
      bits.push("手头：" + fill(q) + " · " + j);
    }
    return bits.join(" ") || "暂无备忘。";
  }

  function sysRipple() {
    const d = state.lastDelta || 0;
    const note = String(state.lastNote || "—").replace(/<[^>]+>/g, "").slice(0, 18);
    return { delta: d > 0 ? "+" + d : String(d || "0"), note };
  }

  function mapLead() {
    if (state.rumor >= 50) return "裙楼开始把你和他放在同一句话里。";
    if (state.alert >= 40) return "他出现的时机太准。地点对不上。";
    if (state.trust >= 40) return "有些地方，他开始为你停下。";
    return "点地点名字，进去看。";
  }

  function mapSpotText(spot) {
    let t = fill(spot.text);
    if (spot.id === "desk" && state.rumor >= 25) t += " 隔间有人侧目。";
    if (spot.id === "tea" && state.trust >= 20) t += " 他开始知道你会来这里。";
    if (spot.id === "ceo" && state.affection >= 40) t += " 专梯偶尔会对你停一下。";
    if (spot.id === "garage" && state.flags && (state.flags.rainUmbrella || state.flags.ateTogether)) t += " 那台黑车接过你。";
    if (spot.id === "river" && state.affection >= 50) t += " 江岸那条线，开始和你的重叠。";
    return t;
  }

  function renderCorpLanding(body) {
    const d = (window.ZC_PHONE || {}).corp || {};
    const facts = (d.facts || []).map((row) => `<span><i>${row[0]}</i><b>${row[1]}</b></span>`).join("");
    body.innerHTML = `<article class="pos-card"><img src="${d.img || "img/corp_day.png"}" alt=""><div class="pos-copy"><p class="kicker">${d.kicker || "YANCI GROUP"}</p><h3>${d.name || "晏辞集团"}</h3>${paras(d.lines)}<div class="pos-stats">${facts}</div><button type="button" class="corp-enter" id="corp-enter">进入公司详细资料</button></div></article>`;
    const btn = $("#corp-enter");
    if (btn) {
      btn.addEventListener("click", () => {
        corpDeep = true;
        corpPage = "home";
        renderPhoneApp("corp");
      });
    }
  }

  function renderCorpSite(body) {
    const site = window.ZC_CORP_SITE || {};
    const pages = site.pages || {};
    if (!pages[corpPage]) corpPage = "home";
    const page = pages[corpPage] || { kicker: "YANCI", title: "晏辞集团", body: [] };
    const nav = (site.nav || []).map((row) => {
      const id = row[0];
      const lab = row[1];
      return `<button type="button" data-page="${id}" class="${id === corpPage ? "on" : ""}">${lab}</button>`;
    }).join("");
    const extra = corpRipple();
    const d = (window.ZC_PHONE || {}).corp || {};
    const facts = corpPage === "home"
      ? `<div class="corp-facts">${(d.facts || []).map((row) => `<span><i>${row[0]}</i><b>${row[1]}</b></span>`).join("")}</div>`
      : "";
    body.innerHTML = `<div class="corp-site">
      <nav class="corp-nav">${nav}</nav>
      <article class="corp-page">
        <p class="kicker">${page.kicker || ""}</p>
        <h3>${page.title || ""}</h3>
        ${(page.body || []).map((t) => `<p>${t}</p>`).join("")}
        ${facts}
        ${extra}
      </article>
    </div>`;
    const go = (id) => {
      if (!id || !pages[id]) return;
      corpPage = id;
      renderPhoneApp("corp");
    };
    body.querySelectorAll("[data-page]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        go(el.getAttribute("data-page"));
      });
    });
  }

  function wxIcon(kind, hour) {
    if (kind === "rain") return "🌧️";
    if (kind === "fog") return "🌫️";
    if (kind === "cloud") return "☁️";
    if (hour != null && (hour < 6 || hour >= 19)) return "🌙";
    if (kind === "sun") return "☀️";
    return "🌤️";
  }

  function wxKind(hour, rain) {
    if (rain) return "rain";
    if (hour >= 17 && hour < 20) return "fog";
    if (hour < 6 || hour >= 20) return "cloud";
    if (hour >= 11 && hour < 16) return "sun";
    return "cloud";
  }

  function wxText(kind) {
    return { rain: "小雨", fog: "薄雾", sun: "晴", cloud: "多云" }[kind] || "多云";
  }

  function wxHourTemp(hour, base) {
    const curve = [16,15,15,14,14,15,16,18,20,22,24,26,27,28,28,27,26,24,22,21,20,19,18,17];
    return base - 22 + curve[hour % 24];
  }

  function wxPack() {
    const cities = window.ZC_WX_CITIES || [];
    const city = cities.find((c) => c.id === state.wxCity) || cities[0] || { id: "binjiang", name: "滨江", sub: "CBD", shift: 0, wind: 2, wet: 0 };
    const day = state.calendarDay || 1;
    const h = Math.floor((state.clockMin || 0) / 60) % 24;
    const m = (state.clockMin || 0) % 60;
    const rain = day % 9 === 0;
    const drift = ((day * 7) % 5) - 2;
    const base = 22 + drift + (city.shift || 0);
    const kind = wxKind(h, rain);
    const now = wxHourTemp(h, base) - (m > 40 ? 0 : 0);
    const hi = wxHourTemp(14, base);
    const lo = wxHourTemp(5, base);
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const hr = (h + i) % 24;
      const k = wxKind(hr, rain && hr >= 10 && hr <= 18);
      hours.push({
        lab: i === 0 ? "现在" : String(hr).padStart(2, "0") + "时",
        t: wxHourTemp(hr, base),
        icon: wxIcon(k, hr),
        pop: rain ? (hr >= 10 && hr <= 18 ? 60 : 20) : (hr >= 16 && hr <= 19 ? 15 : 5)
      });
    }
    const week = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const days = [];
    for (let i = 0; i < 10; i++) {
      const d = day + i;
      const r = d % 9 === 0;
      const b = 22 + (((d * 7) % 5) - 2) + (city.shift || 0);
      const k = r ? "rain" : (i === 0 ? kind : (d % 4 === 0 ? "cloud" : "sun"));
      days.push({
        lab: i === 0 ? "今天" : i === 1 ? "明天" : week[(d + 2) % 7],
        icon: wxIcon(k, 14),
        lo: wxHourTemp(5, b),
        hi: wxHourTemp(14, b),
        pop: r ? 70 : 10
      });
    }
    const aqi = 38 + ((day * 13) % 52);
    const aqiLab = aqi <= 50 ? "优" : aqi <= 100 ? "良" : "轻度";
    const wet = Math.max(38, Math.min(88, 56 + (city.wet || 0) + (rain ? 18 : 0) + (h >= 17 ? 8 : 0)));
    const uv = h >= 10 && h <= 15 && kind === "sun" ? 8 : h >= 9 && h <= 16 ? 4 : 1;
    const vis = kind === "fog" ? 3.2 : rain ? 6.4 : 18.0;
    const feel = now + (wet > 70 ? 1 : kind === "sun" ? 2 : -1);
    const alert = rain
      ? "滨江今日有小雨。通勤带伞。即达配送会慢一点。"
      : kind === "fog"
        ? "江面有轻雾，能见度偏差。下班过江岸注意。"
        : "";
    return { city, h, now, hi, lo, kind, hours, days, aqi, aqiLab, wet, uv, vis, feel, rain, wind: city.wind || 2, alert };
  }

  function renderWeather(body) {
    body.classList.add("is-wx");
    const w = wxPack();
    $("#pos-app-title").textContent = "天气";
    if (wxPage === "cities") {
      const rows = (window.ZC_WX_CITIES || []).map((c) => {
        const on = c.id === w.city.id ? " on" : "";
        const t = w.now + (c.shift || 0) - (w.city.shift || 0);
        return `<button type="button" class="wx-city${on}" data-city="${c.id}"><span><b>${c.name}</b><em>${c.sub}</em></span><strong>${t}°</strong></button>`;
      }).join("");
      body.innerHTML = `<div class="wx-app wx-list">
        <p class="wx-list-lab">我的城市</p>
        ${rows}
      </div>`;
      body.querySelectorAll("[data-city]").forEach((el) => {
        el.addEventListener("click", () => {
          state.wxCity = el.getAttribute("data-city");
          wxPage = "now";
          save();
          renderPhoneApp("weather");
        });
      });
      $("#pos-back").textContent = "返回";
      return;
    }
    const hours = w.hours.map((x) => `<span><i>${x.lab}</i><em>${x.icon}</em><b>${x.t}°</b><small>${x.pop}%</small></span>`).join("");
    const loMin = Math.min.apply(null, w.days.map((d) => d.lo));
    const hiMax = Math.max.apply(null, w.days.map((d) => d.hi));
    const span = Math.max(1, hiMax - loMin);
    const days = w.days.map((d) => {
      const left = ((d.lo - loMin) / span) * 100;
      const width = ((d.hi - d.lo) / span) * 100;
      return `<div class="wx-day"><b>${d.lab}</b><em>${d.icon}</em><small>${d.pop}%</small><span class="wx-lo">${d.lo}°</span><div class="wx-bar"><i style="left:${left}%;width:${Math.max(width, 12)}%"></i></div><span class="wx-hi">${d.hi}°</span></div>`;
    }).join("");
    body.innerHTML = `<div class="wx-app wx-${w.kind}">
      <button type="button" class="wx-hero" data-wx="cities">
        <em>${w.city.name}</em>
        <b>${w.now}°</b>
        <span>${wxText(w.kind)}</span>
        <p>最高 ${w.hi}°　最低 ${w.lo}°</p>
      </button>
      ${w.alert ? `<div class="wx-alert">${w.alert}</div>` : ""}
      <section class="wx-card">
        <p class="wx-k">逐时预报</p>
        <div class="wx-hours">${hours}</div>
      </section>
      <section class="wx-card">
        <p class="wx-k">10日预报</p>
        <div class="wx-days">${days}</div>
      </section>
      <div class="wx-grid">
        <section class="wx-card"><p class="wx-k">空气质量</p><b>${w.aqi}</b><span>${w.aqiLab}</span><p>滨江城区颗粒物偏低。</p></section>
        <section class="wx-card"><p class="wx-k">体感</p><b>${w.feel}°</b><p>湿度 ${w.wet}% 时体感会偏${w.feel >= w.now ? "热" : "凉"}。</p></section>
        <section class="wx-card"><p class="wx-k">湿度</p><b>${w.wet}%</b><p>${w.kind === "fog" ? "江岸水汽偏重。" : "体感尚可。"}</p></section>
        <section class="wx-card"><p class="wx-k">风速</p><b>${w.wind}级</b><span>东北风</span><p>${w.city.id === "hq" ? "高空风比地面大。" : "地面风不大。"}</p></section>
        <section class="wx-card"><p class="wx-k">紫外线</p><b>${w.uv}</b><span>${w.uv >= 7 ? "很强" : w.uv >= 3 ? "中等" : "弱"}</span></section>
        <section class="wx-card"><p class="wx-k">能见度</p><b>${w.vis}</b><span>公里</span></section>
        <section class="wx-card"><p class="wx-k">日出</p><b>05:48</b><p>日落 18:21</p></section>
        <section class="wx-card"><p class="wx-k">气压</p><b>1012</b><span>百帕</span></section>
      </div>
    </div>`;
    const citiesBtn = body.querySelector("[data-wx=cities]");
    if (citiesBtn) {
      citiesBtn.addEventListener("click", () => {
        wxPage = "cities";
        renderPhoneApp("weather");
      });
    }
    $("#pos-back").textContent = "返回桌面";
  }

  function shopById(id) {
    return (window.ZC_SHOP || []).find((x) => x.id === id);
  }

  function storeById(id) {
    return (window.ZC_STORES || []).find((x) => x.id === id);
  }

  function moneyNow() {
    return Number(state.money != null ? state.money : 1284.6);
  }

  function cartLines() {
    return (state.shopCart || []).map((row) => {
      const it = shopById(row.id);
      return it ? { it, qty: row.qty || 1 } : null;
    }).filter(Boolean);
  }

  function cartCount() {
    return cartLines().reduce((n, r) => n + r.qty, 0);
  }

  function cartSum() {
    return Math.round(cartLines().reduce((n, r) => n + r.it.price * r.qty, 0) * 100) / 100;
  }

  function setCartQty(id, qty) {
    const n = Math.max(0, qty | 0);
    state.shopCart = (state.shopCart || []).filter((r) => r.id !== id);
    if (n) state.shopCart.push({ id, qty: n });
  }

  function addCart(id, n) {
    const cur = (state.shopCart || []).find((r) => r.id === id);
    setCartQty(id, (cur ? cur.qty : 0) + (n || 1));
  }

  function couponOff(sum) {
    const c = Number(state.shopCoupon) || 0;
    if (c > 0 && sum >= 20) return c;
    return 0;
  }

  function orderStatus(order) {
    const sameDay = (order.day || 1) === (state.calendarDay || 1);
    const passed = sameDay ? Math.max(0, (state.clockMin || 0) - (order.at || 0)) : 999;
    return passed >= (order.eta || 30) ? "done" : "ship";
  }

  function shopTabBar() {
    const n = cartCount();
    const page = shopPage === "item" || shopPage === "pay" ? "home" : shopPage;
    return `<nav class="jd-tabs">
      <button type="button" data-jd="home" class="${page === "home" ? "on" : ""}">首页</button>
      <button type="button" data-jd="cart" class="${shopPage === "cart" ? "on" : ""}">购物车${n ? `<i>${n}</i>` : ""}</button>
      <button type="button" data-jd="orders" class="${shopPage === "orders" ? "on" : ""}">订单</button>
      <button type="button" data-jd="me" class="${shopPage === "me" ? "on" : ""}">我的</button>
    </nav>`;
  }

  function bindShopNav(body) {
    body.querySelectorAll("[data-jd]").forEach((el) => {
      el.addEventListener("click", () => {
        const p = el.getAttribute("data-jd");
        if (p === "item") {
          shopItemId = el.getAttribute("data-id");
          shopPage = "item";
        } else if (p === "add") {
          addCart(el.getAttribute("data-id"), 1);
          toast("已加入购物车");
          save();
        } else if (p === "cat") {
          shopCat = el.getAttribute("data-cat") || "全部";
          shopPage = "home";
        } else if (p === "pay") {
          shopPayMode = el.getAttribute("data-mode") || "cart";
          shopPage = "pay";
        } else if (p === "qty") {
          const id = el.getAttribute("data-id");
          const d = Number(el.getAttribute("data-d")) || 0;
          const cur = (state.shopCart || []).find((r) => r.id === id);
          setCartQty(id, (cur ? cur.qty : 0) + d);
          save();
        } else {
          shopPage = p;
        }
        renderPhoneApp("shop");
      });
    });
    const search = body.querySelector("#jd-search");
    if (search) {
      search.value = shopQuery;
      search.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        shopQuery = search.value.trim();
        renderPhoneApp("shop");
      });
      search.addEventListener("search", () => {
        shopQuery = search.value.trim();
        renderPhoneApp("shop");
      });
    }
    const pay = body.querySelector("#jd-confirm");
    if (pay) pay.addEventListener("click", confirmShopPay);
  }

  function confirmShopPay() {
    let lines = [];
    if (shopPayMode === "cart") lines = cartLines();
    else {
      const it = shopById(shopPayMode);
      if (it) lines = [{ it, qty: 1 }];
    }
    if (!lines.length) {
      toast("还没选商品");
      return;
    }
    const sum = Math.round(lines.reduce((n, r) => n + r.it.price * r.qty, 0) * 100) / 100;
    const off = couponOff(sum);
    const pay = Math.round((sum - off) * 100) / 100;
    const money = moneyNow();
    if (money < pay) {
      toast("钱包余额不够");
      return;
    }
    state.money = Math.round((money - pay) * 100) / 100;
    if (off) state.shopCoupon = 0;
    lines.forEach((r) => {
      for (let i = 0; i < r.qty; i++) state.bag = (state.bag || []).concat([r.it.id]);
    });
    const eta = Math.max.apply(null, lines.map((r) => r.it.eta || 30));
    state.shopOrders = [{
      id: "o" + Date.now(),
      items: lines.map((r) => ({ id: r.it.id, name: r.it.name, qty: r.qty, price: r.it.price })),
      total: pay,
      at: state.clockMin || 0,
      day: state.calendarDay || 1,
      eta
    }].concat(state.shopOrders || []).slice(0, 20);
    state.ledger = [{ name: "即达 · " + lines[0].it.name, delta: -pay }].concat(state.ledger || []).slice(0, 20);
    if (shopPayMode === "cart") state.shopCart = [];
    toast("已下单 · 预计 " + eta + " 分钟送达");
    shopPage = "orders";
    save();
    renderPhoneApp("shop");
  }

  function renderShop(body) {
    body.classList.add("is-jd");
    const money = moneyNow();
    const titles = { home: "即达", item: "商品", cart: "购物车", orders: "订单", me: "我的", pay: "结算" };
    $("#pos-app-title").textContent = titles[shopPage] || "即达";
    $("#pos-back").textContent = shopPage === "home" ? "返回桌面" : "返回";
    let html = "";
    if (shopPage === "item") {
      const it = shopById(shopItemId) || (window.ZC_SHOP || [])[0];
      const st = storeById(it.store);
      html = `<div class="jd-app">
        <div class="jd-detail">
          <div class="jd-hero">${it.emoji || "🛒"}</div>
          <div class="jd-dbody">
            <p class="jd-price">¥<b>${it.price}</b></p>
            <h3>${it.name}</h3>
            <p class="jd-meta">${st ? st.name : "即达"} · 月售 ${it.sold} · ${it.eta}分钟达</p>
            <p class="jd-desc">${it.desc || ""}</p>
            <div class="jd-addr"><span>送至</span><b>晏辞集团裙楼 7F · 工位</b></div>
          </div>
        </div>
        <div class="jd-buybar">
          <button type="button" data-jd="add" data-id="${it.id}">加入购物车</button>
          <button type="button" class="on" data-jd="pay" data-mode="${it.id}">立即购买</button>
        </div>
      </div>`;
    } else if (shopPage === "cart") {
      const lines = cartLines();
      const sum = cartSum();
      const rows = lines.map((r) => `<div class="jd-line">
        <i>${r.it.emoji || "🛒"}</i>
        <div><b>${r.it.name}</b><em>¥${r.it.price}</em></div>
        <span class="jd-step">
          <button type="button" data-jd="qty" data-id="${r.it.id}" data-d="-1">−</button>
          <em>${r.qty}</em>
          <button type="button" data-jd="qty" data-id="${r.it.id}" data-d="1">+</button>
        </span>
      </div>`).join("") || `<p class="jd-empty">购物车是空的</p>`;
      html = `<div class="jd-app">
        <div class="jd-pad">${rows}</div>
        <div class="jd-buybar">
          <p>合计 <b>¥${sum.toFixed(2)}</b></p>
          <button type="button" class="on" data-jd="pay" data-mode="cart">去结算</button>
        </div>
        ${shopTabBar()}
      </div>`;
    } else if (shopPage === "pay") {
      let lines = shopPayMode === "cart" ? cartLines() : [];
      if (shopPayMode !== "cart") {
        const it = shopById(shopPayMode);
        if (it) lines = [{ it, qty: 1 }];
      }
      const sum = Math.round(lines.reduce((n, r) => n + r.it.price * r.qty, 0) * 100) / 100;
      const off = couponOff(sum);
      const pay = Math.round((sum - off) * 100) / 100;
      const eta = lines.length ? Math.max.apply(null, lines.map((r) => r.it.eta || 30)) : 30;
      const goods = lines.map((r) => `<div class="jd-line"><i>${r.it.emoji}</i><div><b>${r.it.name}</b><em>x${r.qty}</em></div><span>¥${(r.it.price * r.qty).toFixed(2)}</span></div>`).join("");
      html = `<div class="jd-app">
        <div class="jd-pad">
          <div class="jd-block"><span>收货地址</span><b>晏辞集团裙楼 7F · ${pname()}的工位</b></div>
          <div class="jd-block"><span>预计送达</span><b>${eta} 分钟内</b></div>
          ${goods}
          <div class="jd-bill">
            <p><span>商品金额</span><em>¥${sum.toFixed(2)}</em></p>
            <p><span>配送费</span><em>免配送费</em></p>
            <p><span>优惠券</span><em>${off ? "−¥" + off.toFixed(2) : "无可用"}</em></p>
            <p class="sum"><span>实付</span><b>¥${pay.toFixed(2)}</b></p>
          </div>
          <div class="jd-block"><span>支付方式</span><b>钱包　余额 ${money.toFixed(2)}</b></div>
        </div>
        <div class="jd-buybar">
          <p>实付 <b>¥${pay.toFixed(2)}</b></p>
          <button type="button" class="on" id="jd-confirm">确认支付</button>
        </div>
      </div>`;
    } else if (shopPage === "orders") {
      const rows = (state.shopOrders || []).map((o) => {
        const st = orderStatus(o);
        const names = (o.items || []).map((x) => x.name + " x" + x.qty).join("、");
        return `<div class="jd-order">
          <header><em>即达配送</em><b class="${st}">${st === "done" ? "已送达" : "配送中"}</b></header>
          <p>${names}</p>
          <footer><span>实付 ¥${Number(o.total).toFixed(2)}</span><em>${st === "done" ? "感谢购买" : "预计 " + o.eta + " 分钟"}</em></footer>
        </div>`;
      }).join("") || `<p class="jd-empty">还没有订单</p>`;
      html = `<div class="jd-app"><div class="jd-pad">${rows}</div>${shopTabBar()}</div>`;
    } else if (shopPage === "me") {
      html = `<div class="jd-app">
        <div class="jd-pad">
          <div class="jd-me">
            <b>${pname()}</b>
            <em>晏辞集团基层 · 裙楼 7F</em>
          </div>
          <div class="jd-block"><span>收货地址</span><b>裙楼 7F · 工位</b></div>
          <div class="jd-block"><span>钱包余额</span><b>¥${money.toFixed(2)}</b></div>
          <div class="jd-block"><span>优惠券</span><b>${state.shopCoupon ? "新人立减 ¥" + Number(state.shopCoupon).toFixed(0) : "暂无可用"}</b></div>
          <div class="jd-block"><span>已购件数</span><b>${(state.bag || []).length}</b></div>
        </div>
        ${shopTabBar()}
      </div>`;
    } else {
      const q = shopQuery.toLowerCase();
      const list = (window.ZC_SHOP || []).filter((it) => {
        if (shopCat !== "全部" && it.tag !== shopCat) return false;
        if (q && (it.name + it.tag + it.desc).indexOf(q) < 0) return false;
        return true;
      });
      const cats = (window.ZC_SHOP_CATS || []).map((c) => `<button type="button" class="${c === shopCat ? "on" : ""}" data-jd="cat" data-cat="${c}">${c}</button>`).join("");
      const stores = (window.ZC_STORES || []).map((s) => `<div class="jd-store"><div><b>${s.name}</b><em>评分 ${s.score} · ${s.eta}分钟 · 月售 ${s.month}</em></div><span>${s.tag}</span></div>`).join("");
      const goods = list.map((it) => `<div class="jd-item">
        <button type="button" class="jd-item-main" data-jd="item" data-id="${it.id}">
          <i>${it.emoji || "🛒"}</i>
          <div><b>${it.name}</b><em>月售 ${it.sold} · ${it.eta}分钟达</em><strong>¥${it.price}</strong></div>
        </button>
        <button type="button" class="jd-plus" data-jd="add" data-id="${it.id}">+</button>
      </div>`).join("") || `<p class="jd-empty">没有找到相关商品</p>`;
      html = `<div class="jd-app">
        <div class="jd-head">
          <p class="jd-loc">送至 裙楼 7F · 工位</p>
          <input id="jd-search" type="search" placeholder="搜咖啡、便当、日用…" autocomplete="off">
          <div class="jd-banner">新客满 20 减 ${Number(state.shopCoupon) || 0} 元 · 钱包支付</div>
          <div class="jd-cats">${cats}</div>
        </div>
        <div class="jd-pad">
          <p class="jd-sec">附近商家</p>
          ${stores}
          <p class="jd-sec">为你推荐</p>
          ${goods}
        </div>
        ${shopTabBar()}
      </div>`;
    }
    body.innerHTML = html;
    bindShopNav(body);
  }

  function renderPhoneApp(id) {
    const body = $("#pos-app-body");
    body.classList.remove("is-map", "is-chat", "is-inbox", "is-life", "is-wx", "is-jd");
    const P = window.ZC_PHONE || {};
    const look = (state.player && state.player.look) || "a";
    if (id === "dossier") {
      if (!state.flags.phoneHint) {
        body.innerHTML = `<div class="pos-copy"><p class="kicker">LOCKED</p><h3>档案未解锁</h3><p>电梯里的震动还没停下。等这次偶遇结束，系统才会把档案推过来。</p></div>`;
        return;
      }
      const d = P.dossier;
      const stats = (d.stats || []).map((row) => `<span><i>${row[0]}</i><b>${row[1]}</b></span>`).join("");
      const extra = dossierProgress();
      body.innerHTML = `<article class="pos-card"><img src="${d.img}" alt=""><div class="pos-copy"><p class="kicker">${d.kicker}</p><h3>${d.name}</h3>${paras(d.lines)}<div class="pos-stats">${stats}</div>${extra ? `<div class="pos-facts"><p>${extra}</p></div>` : ""}</div></article>`;
      return;
    }
    if (id === "identity") {
      const d = P.identity;
      const extra = identityRipple();
      body.innerHTML = `<article class="pos-card"><img class="photo" src="img/heroine_${look}.png" alt=""><div class="pos-copy"><p class="kicker">${d.kicker}</p><h3>${pname()}</h3>${paras(d.lines)}${extra}</div></article>`;
      return;
    }
    if (id === "corp") {
      if (!corpDeep) renderCorpLanding(body);
      else renderCorpSite(body);
      return;
    }
    if (id === "maps") {
      renderInteractiveMap(body);
      return;
    }
    if (id === "inbox") {
      renderInbox(body);
      return;
    }
    if (id === "cal") {
      body.classList.add("is-life");
      const today = ((state.calendarDay - 1) % 30) + 1;
      const lead = (today + 6) % 7;
      const cells = [];
      for (let i = 0; i < lead; i++) cells.push("<i class=\"mute\"></i>");
      for (let d = 1; d <= 30; d++) cells.push(`<i class="${d === today ? "on" : ""}">${d}</i>`);
      body.innerHTML = `<div class="cal-app">
        <div class="cal-head"><b>本月</b><span>第 ${state.calendarDay} 天</span></div>
        <div class="cal-week"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
        <div class="cal-grid">${cells.join("")}</div>
        <div class="cal-event"><em>倒计时</em><b>还剩 ${state.daysLeft} 天</b></div>
      </div>`;
      return;
    }
    if (id === "weather") {
      renderWeather(body);
      return;
    }
    if (id === "wallet") {
      body.classList.add("is-life");
      const money = Number(state.money != null ? state.money : 1284.6);
      const rows = (state.ledger || []).slice(0, 8).map((r) => {
        const n = Number(r.delta) || 0;
        return `<div><span>${r.name}</span><em>${n > 0 ? "+" : ""}${n.toFixed(2)}</em></div>`;
      }).join("");
      body.innerHTML = `<div class="pay-app">
        <div class="pay-card"><em>余额</em><b>${money.toFixed(2)}</b></div>
        <div class="pay-list">${rows || "<div><span>暂无记录</span><em>0.00</em></div>"}</div>
      </div>`;
      return;
    }
    if (id === "shop") {
      renderShop(body);
      return;
    }
    if (id === "sys") {
      body.classList.add("is-life");
      const log = sysRipple();
      body.innerHTML = `<div class="sys-app">
        <p class="sys-kicker">未登记推送</p>
        <h3>本机误收</h3>
        <div class="sys-list">
          <div><span>对象</span><b>陆晏辞</b></div>
          <div><span>时限</span><b>${state.daysLeft} 日</b></div>
          <div><span>上次</span><b>${log.delta}</b></div>
          <div><span>摘录</span><em>${log.note}</em></div>
        </div>
        <p class="sys-foot">其余字段无读取权限。</p>
      </div>`;
      return;
    }
    body.innerHTML = "";
  }

  function bindPhone() {
    const fab = $("#phone-fab");
    const device = $("#device");
    document.querySelectorAll(".pos-app").forEach((btn) => {
      btn.addEventListener("click", () => openApp(btn.getAttribute("data-app")));
    });
    $("#pos-back").addEventListener("click", () => {
      if (currentPhoneApp === "inbox" && inboxThread) {
        inboxThread = null;
        $("#pos-app-title").textContent = "讯息";
        $("#pos-back").textContent = "返回桌面";
        renderPhoneApp("inbox");
        updatePhoneChrome();
        return;
      }
      if (currentPhoneApp === "maps" && mapSpot) {
        mapSpot = null;
        mapInside = null;
        renderPhoneApp("maps");
        return;
      }
      if (currentPhoneApp === "corp" && corpDeep) {
        corpDeep = false;
        renderPhoneApp("corp");
        return;
      }
      if (currentPhoneApp === "weather" && wxPage !== "now") {
        wxPage = "now";
        renderPhoneApp("weather");
        return;
      }
      if (currentPhoneApp === "shop" && shopPage !== "home") {
        shopPage = "home";
        $("#pos-app-title").textContent = "即达";
        $("#pos-back").textContent = "返回桌面";
        renderPhoneApp("shop");
        return;
      }
      currentPhoneApp = null;
      showPhoneHome();
    });
    $("#pos-home-btn").addEventListener("click", () => {
      if (!$("#pos-app").classList.contains("hidden")) showPhoneHome();
      else closePhone();
    });

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let grabX = 0;
    let grabY = 0;
    function localPt(e) {
      const p = e.touches ? e.touches[0] : e;
      const r = device.getBoundingClientRect();
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function onStart(e) {
      const p = localPt(e);
      const rect = fab.getBoundingClientRect();
      const dr = device.getBoundingClientRect();
      grabX = p.x - (rect.left - dr.left);
      grabY = p.y - (rect.top - dr.top);
      startX = p.x;
      startY = p.y;
      dragging = true;
      moved = false;
      fab.classList.add("is-dragging");
      if (e.cancelable) e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      const p = localPt(e);
      if (Math.abs(p.x - startX) > 4 || Math.abs(p.y - startY) > 4) moved = true;
      const maxX = Math.max(4, device.clientWidth - fab.offsetWidth - 4);
      const maxY = Math.max(4, device.clientHeight - fab.offsetHeight - 4);
      const left = Math.max(4, Math.min(maxX, p.x - grabX));
      const top = Math.max(4, Math.min(maxY, p.y - grabY));
      fab.style.right = "auto";
      fab.style.left = `${left}px`;
      fab.style.top = `${top}px`;
      fab.classList.toggle("is-left", left < 80);
      if (e.cancelable) e.preventDefault();
    }
    function onEnd() {
      if (!dragging) return;
      dragging = false;
      fab.classList.remove("is-dragging");
      if (moved) {
        state.phoneFab = {
          left: parseFloat(fab.style.left) || 0,
          top: parseFloat(fab.style.top) || 0
        };
        save();
      } else {
        openPhone();
      }
    }
    fab.addEventListener("mousedown", onStart);
    fab.addEventListener("touchstart", onStart, { passive: false });
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
  }

  function bind() {
    $("#btn-start").addEventListener("click", () => {
      draft = defaultPlayer();
      showScreen("setup");
      fillSetup();
    });
    $("#btn-continue").addEventListener("click", continueGame);
    $("#btn-setup-back").addEventListener("click", () => showScreen("title"));
    $("#btn-setup-go").addEventListener("click", () => {
      readSetup();
      state.player = Object.assign({}, draft);
      apiEnterMode = "new";
      const saved = window.ZC_API.load();
      $("#api-key").value = saved.key || "";
      $("#api-model").value = saved.model || "deepseek-v4-flash";
      $("#api-status").textContent = "";
      $("#api-status").className = "api-status";
      showScreen("api");
    });
    $("#btn-api-back").addEventListener("click", () => {
      showScreen(apiEnterMode === "continue" ? "title" : "setup");
    });
    $("#btn-api-test").addEventListener("click", () => testApiAndEnter());
    bindCoverflow();
    bindPhone();
    $("#btn-menu").addEventListener("click", () => {
      $("#phone-os").classList.add("hidden");
      $("#phone-fab").classList.remove("hidden");
      $("#game-root").classList.add("hidden");
      showScreen("menu");
    });
    $("#btn-resume").addEventListener("click", () => renderGame());
    const btnLog = $("#btn-log");
    if (btnLog) btnLog.addEventListener("click", () => openLogModal());
    const advLog = $("#btn-adv-log");
    if (advLog) {
      advLog.addEventListener("click", (e) => {
        e.stopPropagation();
        openLogModal();
      });
    }
    const logOk = $("#log-ok");
    if (logOk) logOk.addEventListener("click", () => closeLogModal());
    const logModal = $("#log-modal");
    if (logModal) {
      logModal.addEventListener("click", (e) => {
        if (e.target.id === "log-modal") closeLogModal();
      });
    }
    $("#btn-save").addEventListener("click", () => { save(); toast("进度已保存"); });
    $("#btn-panel").addEventListener("click", () => {
      toast(`${pname()} · ${state.player.age || ""}岁 · 好感${state.affection}/100`);
    });
    $("#btn-restart").addEventListener("click", () => {
      const keep = state.player;
      state = defaultState();
      state.player = keep;
      save();
      $("#game-root").classList.add("hidden");
      showScreen("title");
    });
    $("#btn-ending-home").addEventListener("click", () => {
      $("#game-root").classList.add("hidden");
      showScreen("title");
    });
    $("#btn-epilogue").addEventListener("click", () => {
      state.ended = null;
      state.epilogue = true;
      state.sceneId = "epilogue";
      renderGame();
    });
    $("#free-say").addEventListener("submit", (e) => {
      e.preventDefault();
      if ($("#sheet").classList.contains("is-locked")) return;
      submitFree();
    });
    $("#btn-sys-open") && $("#btn-sys-open").addEventListener("click", () => openSysModal());
    $("#sys-ok").addEventListener("click", () => closeSysModal());
    $("#sys-modal").addEventListener("click", (e) => {
      if (e.target.id === "sys-modal") closeSysModal();
    });
    const hudBoard = $("#btn-hud-board");
    if (hudBoard) {
      hudBoard.addEventListener("click", (e) => {
        e.stopPropagation();
        openAffModal();
      });
    }
    const taskBtn = $("#btn-hud-task");
    if (taskBtn) {
      taskBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openTaskModal();
      });
    }
    const taskOk = $("#task-ok");
    if (taskOk) taskOk.addEventListener("click", () => closeTaskModal());
    const taskModal = $("#task-modal");
    if (taskModal) {
      taskModal.addEventListener("click", (e) => {
        if (e.target.id === "task-modal") closeTaskModal();
      });
    }
    $("#aff-ok").addEventListener("click", () => commitLastDelta());
    $("#aff-modal").addEventListener("click", (e) => {
      if (e.target.id === "aff-modal") closeAffModal();
    });
    $("#aff-range").addEventListener("input", () => {
      draftDelta = clamp(parseInt($("#aff-range").value, 10) || 0, -8, 8);
      paintAffModal();
    });
    document.querySelectorAll("[data-delta]").forEach((btn) => {
      btn.addEventListener("click", () => {
        draftDelta = clamp(draftDelta + Number(btn.getAttribute("data-delta")), -8, 8);
        paintAffModal();
      });
    });
    const briefOk = $("#brief-ok");
    if (briefOk) briefOk.addEventListener("click", () => stepBrief());
    $("#game-root").addEventListener("click", (e) => {
      if (e.target.closest("#sys-modal, #aff-modal, #brief-modal, #task-modal, #log-modal, #phone-os, .hud, #phone-fab, #sheet, .menu-btn, .adv-log")) return;
      advanceAdv();
    });
  }

  function hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const p = JSON.parse(raw);
      return p && p.sceneId && p.sceneId !== "title";
    } catch (_) {
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    $("#btn-continue").classList.toggle("hidden", !hasSave());
    const sim = new URLSearchParams(location.search).get("sim");
    if (sim) {
      simMode = sim;
      startNew();
      if (sim !== "brief") autoplay(sim);
      return;
    }
    showScreen("title");
  });

  function autoplay(mode) {
    let guard = 0;
    while (guard++ < 40 && !state.ended) {
      const scene = sceneById(state.sceneId);
      if (!scene || !scene.choices || !scene.choices.length) break;
      let choice = scene.choices[0];
      if (mode === "good") {
        choice = scene.choices.slice().sort((a, b) => (b.aff || 0) - (a.aff || 0))[0];
      } else if (mode === "bad") {
        choice = scene.choices.slice().sort((a, b) => (a.aff || 0) - (b.aff || 0))[0];
      }
      pick(choice);
    }
    document.title = `SIM ${mode} end=${state.ended || state.sceneId} aff=${state.affection} days=${state.daysLeft}`;
  }
})();
