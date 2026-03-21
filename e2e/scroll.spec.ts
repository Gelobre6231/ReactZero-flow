import { expect, test } from "@playwright/test";

test.describe("Scroll-linked Progress", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/e2e/fixtures/scroll-demo.html");
	});

	test("scroll progress starts at 0", async ({ page }) => {
		// Wait for initial calculation
		await page.waitForTimeout(100);

		const progress = await page.evaluate(() => (window as any).__scrollProgress);
		expect(progress).toBeCloseTo(0, 1);
	});

	test("scroll to 50% updates progress", async ({ page }) => {
		await page.evaluate(() => {
			const maxScroll =
				document.documentElement.scrollHeight - document.documentElement.clientHeight;
			window.scrollTo(0, maxScroll / 2);
		});

		// Wait for rAF to fire and update progress
		await page.waitForTimeout(300);

		const progress = await page.evaluate(() => (window as any).__scrollProgress);
		expect(progress).toBeGreaterThan(0.35);
		expect(progress).toBeLessThan(0.65);
	});

	test("scroll to bottom gives progress near 1", async ({ page }) => {
		await page.evaluate(() => {
			const maxScroll =
				document.documentElement.scrollHeight - document.documentElement.clientHeight;
			window.scrollTo(0, maxScroll);
		});

		// Wait for rAF to fire and update progress
		await page.waitForTimeout(300);

		const progress = await page.evaluate(() => (window as any).__scrollProgress);
		expect(progress).toBeGreaterThan(0.9);
	});

	test("scroll back to top resets progress", async ({ page }) => {
		// Scroll down first
		await page.evaluate(() => {
			const maxScroll =
				document.documentElement.scrollHeight - document.documentElement.clientHeight;
			window.scrollTo(0, maxScroll);
		});
		await page.waitForTimeout(300);

		// Scroll back to top
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.waitForTimeout(300);

		const progress = await page.evaluate(() => (window as any).__scrollProgress);
		expect(progress).toBeCloseTo(0, 1);
	});
});
