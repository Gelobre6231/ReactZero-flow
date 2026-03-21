import { describe, expect, it } from "vitest";
import { parallel } from "../parallel.js";
import { createMockControllable } from "./helpers.js";

describe("parallel", () => {
	it("starts all three steps simultaneously", async () => {
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const par = parallel(a, b, c);
		par.play();

		// All should have been played
		expect(a.playState).toBe("running");
		expect(b.playState).toBe("running");
		expect(c.playState).toBe("running");

		a._resolve();
		b._resolve();
		c._resolve();
		await par.finished;
	});

	it("finishes when the LAST step completes", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const par = parallel(a, b);
		par.play();

		// Complete A first
		a._resolve();
		await Promise.resolve();

		// parallel should still be running
		expect(par.playState).toBe("running");

		// Now complete B
		b._resolve();
		await par.finished;
		expect(par.playState).toBe("finished");
	});

	it("pause pauses all children", () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const par = parallel(a, b);
		par.play();

		par.pause();
		expect(a.playState).toBe("paused");
		expect(b.playState).toBe("paused");
	});

	it("cancel cancels all children", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const par = parallel(a, b);
		par.play();

		par.cancel();
		expect(a.playState).toBe("idle");
		expect(b.playState).toBe("idle");

		await expect(par.finished).resolves.toBeUndefined();
	});

	it("empty parallel finishes immediately", async () => {
		const par = parallel();
		par.play();

		await expect(par.finished).resolves.toBeUndefined();
	});

	it("onStepStart fires for all steps when play is called", async () => {
		const starts: number[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const par = parallel(a, b, c);
		par.onStepStart?.((index) => {
			starts.push(index);
		});

		par.play();

		// All steps start at once in parallel
		expect(starts).toEqual([0, 1, 2]);

		a._resolve();
		b._resolve();
		c._resolve();
		await par.finished;
	});

	it("onStepComplete fires for each step as it individually finishes", async () => {
		const completes: number[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const par = parallel(a, b, c);
		par.onStepComplete?.((index) => {
			completes.push(index);
		});

		par.play();
		expect(completes).toEqual([]);

		// Complete B first (out of order)
		b._resolve();
		await Promise.resolve();
		expect(completes).toEqual([1]);

		// Then A
		a._resolve();
		await Promise.resolve();
		expect(completes).toEqual([1, 0]);

		// Then C
		c._resolve();
		await Promise.resolve();
		expect(completes).toEqual([1, 0, 2]);
	});
});
