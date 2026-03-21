import { expect, test } from "@playwright/test";

test.describe("Reduced Motion", () => {
	test("animations play normally without reduced motion preference", async ({ page }) => {
		await page.goto("/e2e/fixtures/reduced-motion-demo.html");

		await page.waitForFunction(() => (window as any).__state !== "checking", null, {
			timeout: 5000,
		});

		const state = await page.evaluate(() => (window as any).__state);
		expect(state).toBe("animated");

		const reducedMotion = await page.evaluate(() => (window as any).__reducedMotion);
		expect(reducedMotion).toBe(false);
	});

	test("reduced motion preference is detected", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/e2e/fixtures/reduced-motion-demo.html");

		await page.waitForFunction(() => (window as any).__state !== "checking", null, {
			timeout: 5000,
		});

		const reducedMotion = await page.evaluate(() => (window as any).__reducedMotion);
		expect(reducedMotion).toBe(true);
	});

	test("animations are skipped with reduced motion preference", async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto("/e2e/fixtures/reduced-motion-demo.html");

		await page.waitForFunction(() => (window as any).__state !== "checking", null, {
			timeout: 5000,
		});

		const state = await page.evaluate(() => (window as any).__state);
		expect(state).toBe("skipped");

		// Verify final state is applied directly (no animation)
		const box = page.locator("#box");
		const opacity = await box.evaluate((el) => getComputedStyle(el).opacity);
		expect(opacity).toBe("1");
	});
});
