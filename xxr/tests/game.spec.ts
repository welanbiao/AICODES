import { expect, test } from "@playwright/test";

test.describe("小小人", () => {
  test("第一次打开即居中显示正在进入星空", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByText("正在进入星空…")).toBeVisible();
    await expect(page.getByTestId("load-bar")).toBeVisible();
    await expect(page.getByTestId("btn-identify")).toBeHidden();
    const vp = page.viewportSize();
    const card = await page.locator("#screen-load .load-card").boundingBox();
    expect(vp && card).toBeTruthy();
    expect(Math.abs(card!.x + card!.width / 2 - vp!.width / 2)).toBeLessThan(48);
    expect(Math.abs(card!.y + card!.height / 2 - vp!.height / 2)).toBeLessThan(80);
  });

  test("瞄准手机发射钩爪后可爆炸并进入内部", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");
    await expect(page.getByTestId("title")).toHaveText("小小人");
    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByTestId("btn-identify")).toBeHidden();
    await expect(page.getByTestId("btn-home")).toBeHidden();
    await expect(page.getByTestId("level-phone")).toHaveCount(0);

    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 120_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");
    await expect.poll(async () => page.evaluate(() => !!window.__XXR__?.levelPose?.()?.phone), { timeout: 240_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => !!window.__XXR__?.levelPose?.()?.laptop), { timeout: 240_000 }).toBe(true);
    await expect(page.getByTestId("btn-enter")).toBeHidden();
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await expect(page.getByTestId("btn-fire")).toBeVisible();
    await expect(page.getByTestId("btn-recall")).toHaveCount(0);
    await expect(page.getByTestId("btn-move-w")).toHaveCount(0);
    await expect(page.getByTestId("joystick")).toBeVisible();
    await expect(page.getByTestId("crosshair")).toBeVisible();
    expect(await page.getByTestId("level-label").textContent()).toContain("手机");
    expect(await page.getByTestId("level-2-label").textContent()).toContain("20世纪电脑");
    expect(await page.getByTestId("level-3-label").textContent()).toContain("21世纪电脑");
    expect(await page.getByTestId("level-4-label").textContent()).toContain("康纳");
    expect(await page.getByTestId("level-5-label").textContent()).toContain("诺斯");
    expect(await page.locator(".credit").count()).toBe(0);
    expect(await page.evaluate(() => window.__XXR__?.hookOn)).toBe(false);

    const flowed = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x) return { ok: false as const, reason: "missing" };
      x.lookAtPhone?.();
      x.fire();
      const grabbed = x.getState?.()?.phase ?? x.phase;
      return { ok: true as const, grabbed };
    });
    expect(flowed).toMatchObject({ ok: true, grabbed: "docked" });
    await expect(page.getByTestId("joystick")).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.exploded === true), { timeout: 30_000 }).toBe(true);
    await expect(page.getByTestId("btn-explode-fps")).toBeVisible();
    await expect(page.getByTestId("btn-explode-fps")).toHaveText("动作");

    const frozenA = await page.evaluate(() => window.__XXR__?.levelPose?.() ?? null);
    await page.waitForTimeout(500);
    const frozenB = await page.evaluate(() => window.__XXR__?.levelPose?.() ?? null);
    expect(frozenA?.laptop && frozenB?.laptop).toBeTruthy();
    if (frozenA?.laptop && frozenB?.laptop) {
      const drift = Math.hypot(
        frozenB.laptop.pos[0] - frozenA.laptop.pos[0],
        frozenB.laptop.pos[1] - frozenA.laptop.pos[1],
        frozenB.laptop.pos[2] - frozenA.laptop.pos[2],
      );
      expect(drift).toBeLessThan(0.02);
      expect(Math.abs(frozenB.laptop.rotY - frozenA.laptop.rotY)).toBeLessThan(0.01);
    }
    if (frozenA && frozenB) expect(Math.abs(frozenB.spinY - frozenA.spinY)).toBeLessThan(0.01);

    const zoomed = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x?.phoneSpan || !x.pinch) return { ok: false, before: 0, after: 0 };
      const before = x.phoneSpan().longest;
      const ok = x.pinch(1.45);
      const after = x.phoneSpan().longest;
      return { ok, before, after };
    });
    expect(zoomed.ok).toBe(true);
    expect(zoomed.after).toBeGreaterThan(zoomed.before * 1.2);

    const entered = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x) return { ok: false as const, reason: "missing" };
      x.finishFold?.();
      const closed = x.phoneSpan?.() ?? { longest: 0, parts: 0, size: [0, 0, 0] };
      x.finishExplode?.();
      const opened = x.phoneSpan?.() ?? { longest: 0, parts: 0, size: [0, 0, 0] };
      x.enter?.();
      const state = x.getState?.() ?? {
        phase: x.phase,
        docked: x.docked ?? null,
        hookOn: x.hookOn ?? false,
        exploded: x.exploded,
        explodeDone: x.explodeDone ?? false,
        handState: x.handState ?? "",
        gen: 0,
      };
      return { ok: true as const, ...state, closed, opened };
    });
    expect(entered).toMatchObject({ ok: true, phase: "interior", exploded: true, explodeDone: true });
    expect(entered.opened.parts).toBeGreaterThan(40);
    expect(entered.opened.longest).toBeGreaterThan(entered.closed.longest * 1.15);
    await expect(page.getByTestId("joystick")).toBeVisible();

    const interiorZoom = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x?.pinch) return { ok: false, before: 0, after: 0 };
      const before = x.fov?.() ?? 0;
      const ok = x.pinch(1.4);
      const after = x.fov?.() ?? 0;
      return { ok, before, after };
    });
    expect(interiorZoom.ok).toBe(true);
    expect(interiorZoom.after).toBeLessThan(interiorZoom.before * 0.92);

    const yanked = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x) return { ok: false, before: [0, 0, 0] };
      return { ok: x.yankPart?.() ?? false, before: x.pos ?? [0, 0, 0] };
    });
    expect(yanked.ok).toBe(true);
    await expect.poll(async () => {
      const after = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
      return Math.hypot(after[0] - yanked.before[0], after[1] - yanked.before[1], after[2] - yanked.before[2]);
    }, { timeout: 8_000 }).toBeGreaterThan(0.25);

    await page.evaluate(() => {
      window.__XXR__?.lookAtPhone?.();
      window.__XXR__?.identify();
    });
    await expect(page.getByTestId("identify-card")).toBeVisible();
    await expect(page.getByTestId("identify-card")).toContainText(/电池|零件|螺丝|主板|屏幕|未锁定|中框|摄像|玻璃|整机|手机/);

    const fatal = pageErrors.filter((m) => !/ResizeObserver|webgl|draco|wasm/i.test(m));
    expect(fatal).toEqual([]);
  });

  test("未锁定钩爪不位移，WASD 可移动且不出星空", async ({ page }) => {
    await page.goto("/");
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 120_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("audio_4"))).toBe("音频模块");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("kipas.001_0"))).toBe("散热风扇");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("mB_0"))).toBe("主板");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("psu_2"))).toBe("电源单元");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("battery"))).toContain("电池");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Connor.013_mat_4-head_d.png_0"))).toBe("头部");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Connor.016_mat_7-led.png_0"))).toBe("太阳穴指示灯");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Connor.006_Submesh_0_4_0"))).toBe("外套");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Submesh_0_4"))).toBe("外套");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Connor.001_Submesh_0_9_0"))).toBe("衬衫");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Material_006"))).toBe("长裤");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("LTBT44OJU70I6KCKJRCD1ZWUV_Modelpart1_hair_Material012_0"))).toBe("头发");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("LTBT44OJU70I6KCKJRCD1ZWUV.007_Modelpart1_top_Material007_0"))).toBe("上衣");
    expect(await page.evaluate(() => window.__XXR__?.partName?.("Modelpart1_hands_Material003"))).toBe("双手");

    await page.evaluate(() => window.__XXR__?.setLook(0, -1.15));
    const lockedPos = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    await page.evaluate(() => window.__XXR__?.fire());
    await page.waitForTimeout(400);
    const afterMiss = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    const drift = Math.hypot(afterMiss[0] - lockedPos[0], afterMiss[1] - lockedPos[1], afterMiss[2] - lockedPos[2]);
    expect(drift).toBeLessThan(0.05);
    expect(await page.evaluate(() => window.__XXR__?.handState)).toBe("holstered");
    expect(await page.evaluate(() => window.__XXR__?.hookOn)).toBe(false);
    expect(await page.evaluate(() => window.__XXR__?.phase)).toBe("fps");

    const before = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyW");
    const after = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    const moved = Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2]);
    expect(moved).toBeGreaterThan(0.05);

    await expect.poll(async () => page.evaluate(() => window.__XXR__?.fps ?? 0)).toBeGreaterThan(1);

    await expect(page.getByTestId("btn-home")).toBeVisible();
    await page.getByTestId("btn-about").click();
    await expect(page.getByTestId("about")).toBeVisible();
    await expect(page.getByTestId("about-body")).toContainText("叩君芯");
    await expect(page.getByTestId("about")).toContainText("Lumen 64 Spark");
    await expect(page.getByTestId("about")).toContainText("iPhone 12 Teardown");
    await expect(page.getByTestId("about")).toContainText("Connor RK900");
    await expect(page.getByTestId("about")).toContainText("North");
    await page.getByTestId("btn-about-close").click();
    await expect(page.getByTestId("about")).toBeHidden();
    const clamped = await page.evaluate(() => window.__XXR__?.tryMove?.(400, 400, 400) ?? [400, 400, 400]);
    const limit = await page.evaluate(() => window.__XXR__?.skyLimit ?? 30);
    const dist = Math.hypot(clamped[0], clamped[1], clamped[2]);
    expect(dist).toBeLessThanOrEqual(limit + 0.05);
    expect(Math.abs(clamped[0])).toBeLessThan(80);
    const alongAxis = await page.evaluate(() => window.__XXR__?.tryMove?.(0, 0, 400) ?? [0, 0, 400]);
    expect(Math.hypot(alongAxis[0], alongAxis[1], alongAxis[2])).toBeLessThanOrEqual(limit + 0.05);

    await page.getByTestId("btn-home").click();
    const home = await page.evaluate(() => window.__XXR__?.pos ?? [1, 1, 1]);
    expect(Math.hypot(home[0], home[1], home[2])).toBeLessThan(0.05);

    await expect.poll(async () => page.evaluate(() => window.__XXR__?.levelsReady === true), { timeout: 420_000 }).toBe(true);
    const humanParts = await page.evaluate(() => {
      const dump = (id: string) => (window.__XXR__?.partCatalog?.(id) ?? []).map((p) => p.name);
      return { connor: dump("connor"), north: dump("north") };
    });
    for (const name of humanParts.connor) {
      expect(name).not.toBe("机内部件");
      expect(name).not.toMatch(/^Object/i);
    }
    for (const name of humanParts.north) {
      expect(name).not.toBe("机内部件");
      expect(name).not.toMatch(/^Object/i);
    }
    expect(humanParts.connor).toEqual(expect.arrayContaining(["外套", "衬衫", "长裤", "头部", "太阳穴指示灯"]));
    expect(humanParts.north).toEqual(expect.arrayContaining(["上衣", "头发", "双手", "头部"]));
  });
});
