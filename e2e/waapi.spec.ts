import { expect, test } from "@playwright/test";

test.describe("WAAPI Integration", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/e2e/fixtures/waapi-demo.html");
	});

	test("animate() produces real WAAPI animation that completes", async ({ page }) => {
		await page.waitForFunction(() => (window as any).__state === "finished", null, {
			timeout: 5000,
		});

		const state = await page.evaluate(() => (window as any).__state);
		expect(state).toBe("finished");
	});

	test("sequence runs steps in order and finishes", async ({ page }) => {
		await page.waitForFunction(() => (window as any).__state === "finished", null, {
			timeout: 5000,
		});

		const finalOpacity = await page.evaluate(() => (window as any).__finalOpacity);
		// After sequence, opacity should be 1 (committed from first animate step)
		expect(Number(finalOpacity)).toBe(1);
	});

	test("parallel runs both animations simultaneously", async ({ page }) => {
		await page.waitForFunction(() => (window as any).__parallelDone === true, null, {
			timeout: 5000,
		});

		const parallelDone = await page.evaluate(() => (window as any).__parallelDone);
		expect(parallelDone).toBe(true);
	});

	test("commitStyles persists final value as inline style", async ({ page }) => {
		await page.waitForFunction(
			() =>
				(window as any).__commitStylesApplied !== undefined &&
				(window as any).__state === "finished",
			null,
			{ timeout: 5000 },
		);

		// Wait a tick for commitStyles test to complete
		await page.waitForFunction(() => (window as any).__commitStylesApplied === true, null, {
			timeout: 5000,
		});

		const applied = await page.evaluate(() => (window as any).__commitStylesApplied);
		expect(applied).toBe(true);
	});

	test("all test phases complete without errors", async ({ page }) => {
		// Wait for all three test phases to complete (sequence + parallel + commitStyles)
		await page.waitForFunction(() => (window as any).__commitStylesApplied === true, null, {
			timeout: 10000,
		});

		// Verify all three phases completed successfully
		const state = await page.evaluate(() => (window as any).__state);
		const parallelDone = await page.evaluate(() => (window as any).__parallelDone);
		const commitApplied = await page.evaluate(() => (window as any).__commitStylesApplied);

		expect(state).toBe("finished");
		expect(parallelDone).toBe(true);
		expect(commitApplied).toBe(true);
	});
});
