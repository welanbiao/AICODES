import { expect, test } from "@playwright/test";

test.describe("小小人", () => {
  test("启动后直接进入星空，面对第一关手机", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");
    await expect(page.getByTestId("title")).toHaveText("小小人");
    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByTestId("level-phone")).toHaveCount(0);
    await expect(page.getByTestId("btn-enter")).toHaveCount(0);

    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 180_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await expect(page.getByTestId("btn-fire")).toBeVisible();
    await expect(page.getByTestId("crosshair")).toBeVisible();
    expect(await page.getByTestId("level-label").textContent()).toContain("第一关");
    expect(await page.getByTestId("level-label").textContent()).toContain("我的手机");

    await page.evaluate(() => window.__XXR__?.explode());
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.exploded)).toBe(true);

    await page.evaluate(() => window.__XXR__?.lookAtPhone?.());
    await page.waitForTimeout(200);
    await page.getByTestId("btn-identify").click();
    await expect(page.getByTestId("identify-card")).toBeVisible();
    await expect(page.getByTestId("identify-card")).toContainText(/电池|零件|螺丝|主板|屏幕|未锁定|中框|摄像|玻璃|整机/);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId("title")).toHaveCount(1);

    const fatal = pageErrors.filter((m) => !/ResizeObserver|webgl|draco|wasm/i.test(m));
    expect(fatal).toEqual([]);
  });

  test("键盘 WASD 会移动且不会走出星空边界", async ({ page }) => {
    await page.goto("/");
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.ready === true), { timeout: 180_000 }).toBe(true);
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase)).toBe("fps");

    const before = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    await page.keyboard.down("KeyW");
    await page.waitForTimeout(500);
    await page.keyboard.up("KeyW");
    const after = await page.evaluate(() => window.__XXR__?.pos ?? [0, 0, 0]);
    const moved = Math.hypot(after[0] - before[0], after[1] - before[1], after[2] - before[2]);
    expect(moved).toBeGreaterThan(0.05);

    const fps = await page.evaluate(() => window.__XXR__?.fps ?? 0);
    expect(fps).toBeGreaterThan(1);

    await expect(page.getByTestId("btn-home")).toBeVisible();
    const clamped = await page.evaluate(() => window.__XXR__?.tryMove?.(400, 400, 400) ?? [400, 400, 400]);
    const limit = await page.evaluate(() => window.__XXR__?.skyLimit ?? 30);
    expect(Math.abs(clamped[0])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[1])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[2])).toBeLessThanOrEqual(limit + 2);
    expect(Math.abs(clamped[0])).toBeLessThan(80);
  });
});
