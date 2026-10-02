(function () {
  const $ = (sel) => document.querySelector(sel);
  let host = null;
  let view = "desk";
  let job = "";
  let dodgeKind = "";
  let holdBusy = false;
  let timers = [];
  let raf = 0;
  let locking = false;

  function st() {
    return host.getState();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function ensureShift() {
    const s = st();
    if (!s.shift || s.shift.day !== s.calendarDay) {
      s.shift = { day: s.calendarDay, jobs: {}, jobsDone: 0, heat: 0, interrupts: 0 };
    }
    return s.shift;
  }

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    holdBusy = false;
  }

  function later(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function root() {
    return $("#shift-root");
  }

  function setCg(src) {
    const img = $("#cg");
    if (img && src) img.src = src;
  }

  function rumbar() {
    const s = st();
    const r = clamp(s.rumor || 0, 0, 100);
    const a = clamp(s.alert || 0, 0, 100);
    return `<div class="sh-meters">
      <span>议论 <i style="width:${r}%"></i></span>
      <span>警惕 <i style="width:${a}%"></i></span>
    </div>`;
  }

  function heatText() {
    const h = ensureShift().heat || 0;
    if (h >= 3) return "他已经到这层了";
    if (h >= 2) return "专梯在往裙楼走";
    if (h >= 1) return "有人说他下楼了";
    return "总裁层很安静";
  }

  function jobDone(id) {
    return !!(ensureShift().jobs || {})[id];
  }

  function paintDesk() {
    view = "desk";
    locking = false;
    clearTimers();
    setCg("img/cg_office.png");
    const sh = ensureShift();
    const left = ["sheet", "print", "meet"].filter((id) => !jobDone(id)).length;
    root().innerHTML = `
      <section class="sh-desk">
        <header class="sh-head">
          <p class="sh-kicker">裙楼 7F</p>
          <h2>你的工位</h2>
          <p class="sh-heat">${heatText()}</p>
        </header>
        ${rumbar()}
        <p class="sh-lead">先把活做完。他要是下来，整排都会看。</p>
        <div class="sh-jobs">
          <button type="button" class="sh-job ${jobDone("sheet") ? "is-done" : ""}" data-job="sheet" ${jobDone("sheet") ? "disabled" : ""}>
            <em>必须</em><b>改节点表</b><span>${jobDone("sheet") ? "已交" : "找出第三列错格"}</span>
          </button>
          <button type="button" class="sh-job ${jobDone("print") ? "is-done" : ""}" data-job="print" ${jobDone("print") ? "disabled" : ""}>
            <em>事务</em><b>送印</b><span>${jobDone("print") ? "已取" : "卡纸要及时清"}</span>
          </button>
          <button type="button" class="sh-job ${jobDone("meet") ? "is-done" : ""}" data-job="meet" ${jobDone("meet") ? "disabled" : ""}>
            <em>会前</em><b>核对数据</b><span>${jobDone("meet") ? "已核" : "被点名就点对那一格"}</span>
          </button>
        </div>
        <div class="sh-actions">
          <button type="button" class="sh-btn" id="sh-leave" ${left ? "" : ""}>${left ? "先下班" : "下班走电梯"}</button>
          <button type="button" class="sh-btn ghost" id="sh-talk">听对话</button>
        </div>
      </section>`;
  }

  function startSheet() {
    view = "sheet";
    job = "sheet";
    setCg("img/cg_office.png");
    const rows = [
      ["A3节点", "12", "14", "18"],
      ["B1复核", "9", "9", "11"],
      ["C2验收", "7", "8", "6"],
      ["D4签字", "4", "5", "5"],
      ["合计", "32", "36", "40"]
    ];
    const err = { r: 2, c: 3, wrong: "6", right: "8" };
    rows[err.r][err.c] = err.wrong;
    const body = rows.map((row, ri) => `<tr>${row.map((cell, ci) => {
      const head = ci === 0;
      return `<t${head ? "h" : "d"} ${head ? "" : `data-r="${ri}" data-c="${ci}"`}>${cell}</t${head ? "h" : "d"}>`;
    }).join("")}</tr>`).join("");
    root().innerHTML = `
      <section class="sh-play">
        <header class="sh-play-head">
          <button type="button" class="sh-back" id="sh-back">回工位</button>
          <p>本周节点表</p>
        </header>
        <p class="sh-hint">第三列有一格对不上。点出错格。</p>
        <table class="sh-table" id="sh-table">
          <thead><tr><th>项目</th><th>一列</th><th>二列</th><th>三列</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
        <div id="sh-fix" class="sh-fix hidden"></div>
      </section>`;
    const table = $("#sh-table");
    table.addEventListener("click", (e) => {
      const td = e.target.closest("td");
      if (!td) return;
      const r = Number(td.dataset.r);
      const c = Number(td.dataset.c);
      if (r === err.r && c === err.c) {
        td.classList.add("is-hit");
        const box = $("#sh-fix");
        box.classList.remove("hidden");
        box.innerHTML = `<p>更正第三列</p><div class="sh-chips">
          <button type="button" data-ok="0">7</button>
          <button type="button" data-ok="1">${err.right}</button>
          <button type="button" data-ok="0">9</button>
        </div>`;
        box.addEventListener("click", (ev) => {
          const btn = ev.target.closest("button");
          if (!btn) return;
          finishJob("sheet", btn.dataset.ok === "1");
        }, { once: true });
      } else {
        td.classList.add("is-miss");
        host.toast("这格没问题");
        later(() => td.classList.remove("is-miss"), 400);
      }
    });
  }

  function startPrint() {
    view = "print";
    job = "print";
    setCg("img/cg_print.png");
    let wave = 0;
    let locked = false;
    root().innerHTML = `
      <section class="sh-play">
        <header class="sh-play-head">
          <button type="button" class="sh-back" id="sh-back">回工位</button>
          <p>打印室</p>
        </header>
        <p class="sh-hint" id="sh-print-hint">点送印。红区出现时立刻清卡。</p>
        <div class="sh-printer">
          <div class="sh-printer-body"><i></i><b>7F-P2</b></div>
          <div class="sh-bar"><em id="sh-pbar"></em></div>
          <p class="sh-pstat" id="sh-pstat">待送 1 / 2</p>
        </div>
        <div class="sh-actions">
          <button type="button" class="sh-btn" id="sh-send">送印</button>
          <button type="button" class="sh-btn danger hidden" id="sh-jam">清卡</button>
        </div>
      </section>`;
    const bar = $("#sh-pbar");
    const send = $("#sh-send");
    const jam = $("#sh-jam");
    const stat = $("#sh-pstat");
    const hint = $("#sh-print-hint");
    function runWave() {
      if (locked) return;
      locked = true;
      send.disabled = true;
      jam.classList.add("hidden");
      let t0 = performance.now();
      let hit = false;
      let windowOn = false;
      const windowAt = 520;
      const windowEnd = 980;
      function tick(now) {
        const p = clamp((now - t0) / 1600, 0, 1);
        bar.style.width = (p * 100) + "%";
        const inWin = (now - t0) > windowAt && (now - t0) < windowEnd;
        if (inWin && !windowOn) {
          windowOn = true;
          jam.classList.remove("hidden");
          hint.textContent = "卡了。现在清。";
          bar.parentNode.classList.add("is-hot");
        }
        if (!inWin && windowOn && !hit) {
          windowOn = false;
          jam.classList.add("hidden");
          bar.parentNode.classList.remove("is-hot");
        }
        if (p < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        locked = false;
        send.disabled = false;
        jam.classList.add("hidden");
        bar.parentNode.classList.remove("is-hot");
        if (!hit) {
          host.toast("卡纸没清，重来");
          host.bump("alert", 2);
          bar.style.width = "0";
          return;
        }
        wave += 1;
        if (wave >= 2) {
          finishJob("print", true);
          return;
        }
        stat.textContent = "待送 2 / 2";
        hint.textContent = "还有一叠。";
        bar.style.width = "0";
      }
      jam.onclick = () => {
        if (!windowOn || hit) return;
        hit = true;
        jam.classList.add("hidden");
        hint.textContent = "卡已清。";
      };
      raf = requestAnimationFrame(tick);
    }
    send.addEventListener("click", runWave);
  }

  function startMeet() {
    view = "meet";
    job = "meet";
    setCg("img/cg_meeting.png");
    const answer = "29";
    let left = 9;
    root().innerHTML = `
      <section class="sh-play">
        <header class="sh-play-head">
          <button type="button" class="sh-back" id="sh-back">回工位</button>
          <p>会前核对</p>
        </header>
        <p class="sh-hint">有人会问第三列合计。表上没有合计，自己加。</p>
        <table class="sh-table mini">
          <thead><tr><th>项目</th><th>一列</th><th>二列</th><th>三列</th></tr></thead>
          <tbody>
            <tr><th>A3</th><td>12</td><td>14</td><td>18</td></tr>
            <tr><th>B1</th><td>9</td><td>9</td><td>11</td></tr>
          </tbody>
        </table>
        <div class="sh-ask" id="sh-ask">
          <p>陆总点到基层。第三列合计是多少？</p>
          <em id="sh-timer">9</em>
          <div class="sh-chips">
            <button type="button" data-v="29">29</button>
            <button type="button" data-v="40">40</button>
            <button type="button" data-v="18">18</button>
            <button type="button" data-v="21">21</button>
          </div>
        </div>
      </section>`;
    const tick = () => {
      left -= 1;
      const el = $("#sh-timer");
      if (el) el.textContent = String(Math.max(0, left));
      if (left <= 0) {
        finishJob("meet", false);
        return;
      }
      later(tick, 1000);
    };
    later(tick, 1000);
    $("#sh-ask").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      finishJob("meet", btn.dataset.v === answer);
    });
  }

  function finishJob(id, ok) {
    if (locking) return;
    locking = true;
    clearTimers();
    const sh = ensureShift();
    sh.jobs[id] = true;
    sh.jobsDone = (sh.jobsDone || 0) + 1;
    sh.heat = clamp((sh.heat || 0) + 1, 0, 3);
    host.addMins(ok ? 22 : 28);
    if (ok) host.bump("trust", 2);
    else {
      host.bump("alert", 3);
      host.bump("rumor", 2);
      host.toast(id === "meet" ? "你迟疑了一拍，有人侧目。" : "这活做毛了。");
    }
    if (ok) host.toast(id === "sheet" ? "表交了。" : id === "print" ? "印好了。" : "数对上了。");
    host.save();
    host.renderHud();
    locking = false;
    if (shouldInterrupt()) startDodge(pickDodge());
    else paintDesk();
  }

  function shouldInterrupt() {
    const sh = ensureShift();
    if (sh.interrupts >= 2) return false;
    if (sh.jobsDone >= 2) return true;
    return sh.jobsDone === 1 && sh.heat >= 1;
  }

  function pickDodge() {
    const id = (host.doingTask() || {}).id || "";
    if (id === "water" || id === "coffee") return "eyes";
    if (id === "phone" || id === "dinner") return "lift";
    if (job === "print") return "hall";
    if (job === "meet") return "eyes";
    return ["eyes", "hall", "lift"][ensureShift().interrupts % 3];
  }

  function startDodge(kind) {
    dodgeKind = kind;
    view = "dodge";
    clearTimers();
    ensureShift().interrupts += 1;
    if (kind === "lift") startLift();
    else if (kind === "hall") startHall();
    else startEyes();
  }

  function startEyes() {
    setCg("img/cg_office.png");
    let danger = 22;
    root().innerHTML = `
      <section class="sh-dodge">
        <p class="sh-kicker">隔间</p>
        <h2>他停在过道</h2>
        <p class="sh-lead">整排都感觉到了。低头改表，别跟他对上。</p>
        <div class="sh-sight"><em id="sh-sight"></em></div>
        <p class="sh-heat" id="sh-dstat">同事视线</p>
        <button type="button" class="sh-hold" id="sh-hold">按住 · 低头改表</button>
        <button type="button" class="sh-btn ghost" id="sh-flee">起身去茶水间</button>
      </section>`;
    const bar = $("#sh-sight");
    const hold = $("#sh-hold");
    hold.addEventListener("pointerdown", (e) => {
      holdBusy = true;
      hold.classList.add("is-on");
      e.preventDefault();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => {
      hold.addEventListener(ev, () => {
        holdBusy = false;
        hold.classList.remove("is-on");
      });
    });
    $("#sh-flee").addEventListener("click", () => endDodge(true, "eyes-leave"));
    let last = performance.now();
    function tick(now) {
      const dt = now - last;
      last = now;
      danger += holdBusy ? -dt * 0.012 : dt * 0.028;
      danger = clamp(danger, 0, 100);
      bar.style.width = danger + "%";
      bar.parentNode.classList.toggle("is-hot", danger > 70);
      if (danger >= 100) {
        endDodge(false, "eyes");
        return;
      }
      if (now - (tick.t0 || (tick.t0 = now)) > 4600 && danger < 86) {
        endDodge(true, "eyes");
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function startHall() {
    setCg("img/cg_corridor.png");
    let danger = 8;
    root().innerHTML = `
      <section class="sh-dodge hall">
        <p class="sh-kicker">走廊</p>
        <h2>别跟他并排</h2>
        <p class="sh-lead">他从转角过来。先闪进一间屋，别让整层看见。</p>
        <div class="sh-hall">
          <i class="sh-him" id="sh-him"></i>
          <button type="button" class="sh-hide" data-hide="print" style="left:8%;top:58%">打印室</button>
          <button type="button" class="sh-hide" data-hide="tea" style="left:38%;top:28%">茶水间</button>
          <button type="button" class="sh-hide" data-hide="corner" style="left:68%;top:62%">拐角</button>
        </div>
        <div class="sh-sight"><em id="sh-sight"></em></div>
      </section>`;
    const him = $("#sh-him");
    const bar = $("#sh-sight");
    root().querySelector(".sh-hall").addEventListener("click", (e) => {
      const btn = e.target.closest(".sh-hide");
      if (!btn) return;
      endDodge(true, "hall");
    });
    let last = performance.now();
    function tick(now) {
      const dt = now - last;
      last = now;
      danger += dt * 0.032;
      danger = clamp(danger, 0, 100);
      bar.style.width = danger + "%";
      him.style.top = (12 + danger * 0.55) + "%";
      if (danger >= 100) {
        endDodge(false, "hall");
        return;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
  }

  function startLift() {
    setCg("img/bg_elevator.png");
    let closed = false;
    let done = false;
    root().innerHTML = `
      <section class="sh-dodge lift">
        <p class="sh-kicker">电梯</p>
        <h2>门还开着</h2>
        <p class="sh-lead">他伸手要进。下滑出去，别跟总裁关在一格里。</p>
        <div class="sh-lift">
          <div class="sh-door left" id="sh-dl"></div>
          <div class="sh-door right" id="sh-dr"></div>
          <div class="sh-sil"></div>
        </div>
        <div class="sh-swipe" id="sh-swipe">下滑离开</div>
        <button type="button" class="sh-btn" id="sh-side">侧身挤出去</button>
      </section>`;
    later(() => {
      $("#sh-dl").classList.add("shut");
      $("#sh-dr").classList.add("shut");
    }, 40);
    later(() => {
      closed = true;
      if (!done) endDodge(false, "lift");
    }, 2100);
    function escape() {
      if (done || closed) return;
      done = true;
      endDodge(true, "lift");
    }
    $("#sh-side").addEventListener("click", escape);
    const zone = $("#sh-swipe");
    let y0 = 0;
    zone.addEventListener("pointerdown", (e) => { y0 = e.clientY; zone.setPointerCapture(e.pointerId); });
    zone.addEventListener("pointerup", (e) => {
      if (e.clientY - y0 > 56) escape();
    });
  }

  function endDodge(ok, tag) {
    clearTimers();
    const sh = ensureShift();
    if (ok) {
      host.bump("alert", tag === "eyes-leave" ? 1 : -1);
      host.toast(tag === "lift" ? "你出了电梯。他被关在里面。" : tag === "hall" ? "你闪进去时，有人只看见他一个人。" : "你没抬头。他停了两秒，走了。");
    } else {
      host.bump("rumor", tag === "hall" ? 8 : 5);
      host.bump("alert", 6);
      host.toast(tag === "lift" ? "门关上了。只剩你们两个。" : "整排都看见了。");
    }
    host.save();
    host.renderHud();
    showResult(ok, tag);
  }

  function showResult(ok, tag) {
    view = "result";
    const copy = ok ? {
      lift: "门在身后合上。厅里的人当没看见你刚才那一下。",
      hall: "打印室门缝里，他从走廊走过去，没停。",
      eyes: "表格上的数字重新清晰。隔间口已经空了。",
      "eyes-leave": "茶水间没有人。你听见他在你工位那边停过。"
    }[tag] : {
      lift: "电梯里很静。他站得偏近，像有话，又没说。",
      hall: "他和你停在同一段走廊。背后有椅子转过来。",
      eyes: "他把手里的杯子搁在你隔板上。没有人敢先敲键盘。"
    }[tag];
    root().innerHTML = `
      <section class="sh-result">
        <p class="sh-kicker">${ok ? "躲开了" : "被看见了"}</p>
        <p class="sh-lead">${copy}</p>
        <div class="sh-actions">
          <button type="button" class="sh-btn" id="sh-back-desk">回工位</button>
          <button type="button" class="sh-btn ghost" id="sh-talk-now">${ok ? "当没发生" : "他要说话"}</button>
        </div>
      </section>`;
    $("#sh-back-desk").addEventListener("click", () => paintDesk());
    $("#sh-talk-now").addEventListener("click", () => host.enterTalk(tag, ok));
  }

  function tryLeave() {
    const sh = ensureShift();
    if (!jobDone("sheet")) {
      host.toast("节点表还没改完，走不了。");
      return;
    }
    host.addMins(12);
    if (sh.interrupts < 2) startDodge("lift");
    else {
      host.toast("你出了裙楼。今天先到这里。");
      paintDesk();
    }
  }

  function openDesk(why) {
    if (!host) return;
    ensureShift();
    if (why === "meet1" || why === "back") ensureShift().heat = 1;
    const el = root();
    if (!el) return;
    el.classList.remove("hidden");
    $("#game-root").classList.add("is-shift");
    paintDesk();
    host.save();
  }

  function closeDesk() {
    clearTimers();
    const el = root();
    if (el) {
      el.classList.add("hidden");
      el.innerHTML = "";
    }
    const g = $("#game-root");
    if (g) g.classList.remove("is-shift");
    view = "desk";
  }

  function onClick(e) {
    const t = e.target;
    if (t.closest("#sh-back") && view !== "desk") {
      paintDesk();
      return;
    }
    const jobBtn = t.closest("[data-job]");
    if (jobBtn && view === "desk") {
      const id = jobBtn.dataset.job;
      if (id === "sheet") startSheet();
      if (id === "print") startPrint();
      if (id === "meet") startMeet();
      return;
    }
    if (t.id === "sh-leave") tryLeave();
    if (t.id === "sh-talk") host.backToTalk();
  }

  function bind() {
    const el = root();
    if (!el || el.dataset.bound) return;
    el.dataset.bound = "1";
    el.addEventListener("click", onClick);
  }

  window.ZC_SHIFT = {
    init(h) {
      host = h;
      bind();
    },
    openDesk,
    closeDesk,
    isOpen() {
      const el = root();
      return !!(el && !el.classList.contains("hidden"));
    }
  };
})();
