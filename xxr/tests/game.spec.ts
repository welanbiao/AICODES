import { expect, test } from "@playwright/test";

test.describe("小小人", () => {
  test("瞄准手机发射钩爪后可爆炸并进入内部", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");
    await expect(page.getByTestId("title")).toHaveText("小小人");
    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByTestId("level-phone")).toHaveCount(0);
    await expect(page.getByTestId("btn-enter")).toBeHidden();

    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 180_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await expect(page.getByTestId("btn-fire")).toBeVisible();
    await expect(page.getByTestId("btn-move-w")).toHaveCount(0);
    await expect(page.getByTestId("joystick")).toBeVisible();
    await expect(page.getByTestId("crosshair")).toBeVisible();
    expect(await page.getByTestId("level-label").textContent()).toContain("第一关");
    expect(await page.getByTestId("level-label").textContent()).toContain("我的手机");
    expect(await page.locator(".credit").count()).toBe(0);
    expect(await page.evaluate(() => window.__XXR__?.hookOn)).toBe(false);

    const flowed = await page.evaluate(() => {
      const x = window.__XXR__;
      if (!x) return { ok: false as const, reason: "missing" };
      x.lookAtPhone?.();
      x.fire();
      const grabbed = x.getState?.()?.phase ?? x.phase;
      x.explode();
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
      return { ok: true as const, grabbed, ...state, closed, opened };
    });
    expect(flowed).toMatchObject({ ok: true, grabbed: "docked", phase: "interior", exploded: true, explodeDone: true });
    expect(flowed.opened.parts).toBeGreaterThan(40);
    expect(flowed.opened.longest).toBeGreaterThan(flowed.closed.longest * 1.6);
    await expect(page.getByTestId("joystick")).toBeVisible();

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
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 180_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");

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
    const clamped = await page.evaluate(() => window.__XXR__?.tryMove?.(400, 400, 400) ?? [400, 400, 400]);
    const limit = await page.evaluate(() => window.__XXR__?.skyLimit ?? 30);
    expect(Math.abs(clamped[0])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[1])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[2])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[0])).toBeLessThan(80);

    await page.getByTestId("btn-home").click();
    const home = await page.evaluate(() => window.__XXR__?.pos ?? [1, 1, 1]);
    expect(Math.hypot(home[0], home[1], home[2])).toBeLessThan(0.05);
  });
});
