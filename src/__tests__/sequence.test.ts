import { describe, expect, it } from "vitest";
import { sequence } from "../sequence.js";
import { createMockControllable } from "./helpers.js";

describe("sequence", () => {
	it("runs steps A, B, C in order", async () => {
		const order: string[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		// Track when each step's play is called
		const origPlayA = a.play.bind(a);
		a.play = () => {
			order.push("A");
			origPlayA();
		};
		const origPlayB = b.play.bind(b);
		b.play = () => {
			order.push("B");
			origPlayB();
		};
		const origPlayC = c.play.bind(c);
		c.play = () => {
			order.push("C");
			origPlayC();
		};

		const seq = sequence(a, b, c);
		seq.play();

		// Only A should be playing
		expect(order).toEqual(["A"]);

		// Complete A
		a._resolve();
		await Promise.resolve(); // flush microtask

		expect(order).toEqual(["A", "B"]);

		// Complete B
		b._resolve();
		await Promise.resolve();

		expect(order).toEqual(["A", "B", "C"]);

		// Complete C
		c._resolve();
		await seq.finished;

		expect(order).toEqual(["A", "B", "C"]);
	});

	it("resolves finished when all steps complete", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const seq = sequence(a, b);
		seq.play();

		a._resolve();
		await Promise.resolve();

		b._resolve();
		await expect(seq.finished).resolves.toBeUndefined();
	});

	it("pause pauses the current step; resume continues", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const seq = sequence(a, b);
		seq.play();

		// Pause while A is running
		seq.pause();
		expect(a.playState).toBe("paused");
		expect(seq.playState).toBe("paused");

		// Resume
		seq.play();
		expect(a.playState).toBe("running");
		expect(seq.playState).toBe("running");

		// Complete rest
		a._resolve();
		await Promise.resolve();
		b._resolve();
		await seq.finished;
	});

	it("cancel cancels current step and does not run remaining", async () => {
		const a = createMockControllable();
		const b = createMockControllable();
		const bPlayCalled = { value: false };

		const origPlayB = b.play.bind(b);
		b.play = () => {
			bPlayCalled.value = true;
			origPlayB();
		};

		const seq = sequence(a, b);
		seq.play();

		seq.cancel();
		expect(a.playState).toBe("idle"); // a was cancelled

		await expect(seq.finished).resolves.toBeUndefined();
		expect(bPlayCalled.value).toBe(false); // b was never started
	});

	it("empty sequence finishes immediately", async () => {
		const seq = sequence();
		seq.play();

		await expect(seq.finished).resolves.toBeUndefined();
	});

	it("works with lazy factory functions", async () => {
		const a = createMockControllable();
		const factoryCalled = { value: false };

		const seq = sequence(() => {
			factoryCalled.value = true;
			return a;
		});

		expect(factoryCalled.value).toBe(false);
		seq.play();
		expect(factoryCalled.value).toBe(true);

		a._resolve();
		await seq.finished;
	});

	it("works with mix of Controllable and factory functions", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const seq = sequence(a, () => b);
		seq.play();

		a._resolve();
		await Promise.resolve();

		b._resolve();
		await seq.finished;
	});

	it("onStepStart fires before each step plays (with correct index)", async () => {
		const starts: number[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const seq = sequence(a, b, c);
		seq.onStepStart?.((index) => {
			starts.push(index);
		});

		seq.play();
		expect(starts).toEqual([0]);

		a._resolve();
		await Promise.resolve();
		expect(starts).toEqual([0, 1]);

		b._resolve();
		await Promise.resolve();
		expect(starts).toEqual([0, 1, 2]);

		c._resolve();
		await seq.finished;
	});

	it("onStepComplete fires after each step finishes (with correct index)", async () => {
		const completes: number[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const seq = sequence(a, b, c);
		seq.onStepComplete?.((index) => {
			completes.push(index);
		});

		seq.play();
		expect(completes).toEqual([]);

		a._resolve();
		await Promise.resolve();
		expect(completes).toEqual([0]);

		b._resolve();
		await Promise.resolve();
		expect(completes).toEqual([0, 1]);

		c._resolve();
		await Promise.resolve();
		// Need an extra tick for the last stepComplete to propagate
		await Promise.resolve();
		expect(completes).toEqual([0, 1, 2]);
	});

	it("currentStep reflects the currently running step index", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const seq = sequence(a, b);
		seq.play();
		expect(seq.currentStep).toBe(0);

		a._resolve();
		await Promise.resolve();
		expect(seq.currentStep).toBe(1);

		b._resolve();
		await seq.finished;
	});

	it("stepCount equals the total number of steps", () => {
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const seq = sequence(a, b, c);
		expect(seq.stepCount).toBe(3);
	});
});
