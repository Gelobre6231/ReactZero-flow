import { expect, test } from "@playwright/test";

test.describe("View Transition API", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/e2e/fixtures/vt-demo.html");
	});

	test("detects View Transition API support correctly", async ({ page }) => {
		const supported = await page.evaluate(() => (window as any).__vtSupported);

		// All modern browser engines should report a boolean
		expect(typeof supported).toBe("boolean");
	});

	test("view transition completes and updates DOM", async ({ page }) => {
		const supported = await page.evaluate(() => (window as any).__vtSupported);

		const trigger = page.locator("#trigger");
		await trigger.click();

		await page.waitForFunction(() => (window as any).__vtFinished === true, null, {
			timeout: 5000,
		});

		const content = await page.locator("#content").textContent();
		expect(content).toBe("After");

		// If API is supported, native transition was used (no fallback)
		// If not, fallback was used
		const fallbackUsed = await page.evaluate(() => (window as any).__vtFallbackUsed);
		if (supported) {
			expect(fallbackUsed).toBe(false);
		} else {
			expect(fallbackUsed).toBe(true);
		}
	});

	test("DOM updates correctly regardless of API support", async ({ page }) => {
		const trigger = page.locator("#trigger");
		await trigger.click();

		await page.waitForFunction(() => (window as any).__vtFinished === true, null, {
			timeout: 5000,
		});

		// Content must update regardless of whether native VT or fallback was used
		const content = await page.locator("#content").textContent();
		expect(content).toBe("After");
	});

	test("initial content is displayed before transition", async ({ page }) => {
		const content = await page.locator("#content").textContent();
		expect(content).toBe("Before");
	});
});
