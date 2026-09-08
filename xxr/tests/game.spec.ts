import { expect, test } from "@playwright/test";

test.describe("小小人", () => {
  test("首页可选关卡并进入我的手机", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");
    await expect(page.getByTestId("title")).toHaveText("小小人");
    await expect(page.getByTestId("level-phone")).toBeVisible();
    await expect(page.getByTestId("level-laptop")).toBeDisabled();
    await expect(page.getByTestId("level-earbuds")).toBeDisabled();

    await page.getByTestId("level-phone").click();
    await expect(page.getByTestId("loading")).toBeVisible();
    await expect(page.getByTestId("btn-enter")).toBeVisible({ timeout: 120_000 });
    await expect(page.locator("#view")).toBeVisible();

    await page.getByTestId("btn-explode").click();
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.exploded)).toBe(true);

    await page.getByTestId("btn-enter").click();
    await expect.poll(async () => page.evaluate(() => window.__XXR__?.phase), { timeout: 15_000 }).toBe("fps");
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await expect(page.getByTestId("btn-fire")).toBeVisible();
    await expect(page.getByTestId("crosshair")).toBeVisible();

    await page.getByTestId("btn-identify").click();
    await expect(page.getByTestId("identify-card")).toBeVisible();
    await expect(page.getByTestId("identify-card")).toContainText(/电池|零件|螺丝|主板|屏幕/);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("btn-identify")).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.getByTestId("title")).toHaveCount(1);

    const fatal = pageErrors.filter((m) => !/ResizeObserver|webgl/i.test(m));
    expect(fatal).toEqual([]);
  });

  test("键盘 WASD 会改变相机位置", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("level-phone").click();
    await expect(page.getByTestId("btn-enter")).toBeVisible({ timeout: 120_000 });
    await page.getByTestId("btn-enter").click();
    await expect(page.getByTestId("btn-identify")).toBeVisible({ timeout: 8_000 });

    const before = await page.evaluate(() => window.__XXR__?.phase);
    expect(before).toBe("fps");

    await page.keyboard.down("KeyW");
    await page.waitForTimeout(400);
    await page.keyboard.up("KeyW");
    const fps = await page.evaluate(() => window.__XXR__?.fps ?? 0);
    expect(fps).toBeGreaterThan(1);
  });
});
