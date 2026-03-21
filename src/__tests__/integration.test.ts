import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { delay } from "../delay.js";
import { parallel } from "../parallel.js";
import { sequence } from "../sequence.js";
import { stagger } from "../stagger.js";
import { installWAAPIMock } from "./helpers.js";

/**
 * Flush multiple rounds of microtasks.
 * The async chain through animate's wrapped finished promise,
 * commitStyles, and createControllable's runner.then() requires
 * several microtask flushes per step transition.
 */
async function flush(rounds = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve();
	}
}

describe("integration: composition", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
	});

	afterEach(() => {
		waapi.restore();
	});

	it("sequence of animate calls runs in order with commitStyles", async () => {
		const el = document.createElement("div");
		const kf1 = [{ opacity: 0 }, { opacity: 1 }];
		const kf2 = [{ transform: "translateX(0)" }, { transform: "translateX(100px)" }];

		const seq = sequence(
			() => animate(el, kf1, { duration: 100 }),
			() => animate(el, kf2, { duration: 100 }),
		);

		seq.play();
		await flush();

		// First animation should be running
		expect(waapi.allAnimations).toHaveLength(1);
		const firstAnim = waapi.allAnimations[0];

		// Complete first animation
		firstAnim.finish();
		await flush();

		// Second animation should now be running
		expect(waapi.allAnimations).toHaveLength(2);
		const secondAnim = waapi.allAnimations[1];

		// Complete second animation
		secondAnim.finish();
		await flush();

		expect(seq.playState).toBe("finished");
	});

	it("parallel with different completion times", async () => {
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const par = parallel(
			() => animate(el1, kf, { duration: 100 }),
			() => animate(el2, kf, { duration: 200 }),
		);

		par.play();
		await flush();

		// Both animations should be created simultaneously
		expect(waapi.allAnimations).toHaveLength(2);

		// Finish first, parallel should still be running
		waapi.allAnimations[0].finish();
		await flush();
		expect(par.playState).toBe("running");

		// Finish second, parallel should complete
		waapi.allAnimations[1].finish();
		await flush();

		expect(par.playState).toBe("finished");
	});

	it("stagger with offset timing", async () => {
		vi.useFakeTimers();
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const el3 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const stag = stagger(
			[
				() => animate(el1, kf, { duration: 100 }),
				() => animate(el2, kf, { duration: 100 }),
				() => animate(el3, kf, { duration: 100 }),
			],
			{ each: 50 },
		);

		stag.play();
		await flush();

		// First animation starts immediately (delay(0))
		await vi.advanceTimersByTimeAsync(1);
		await flush();
		expect(waapi.allAnimations.length).toBeGreaterThanOrEqual(1);

		// After 50ms, second animation should start
		await vi.advanceTimersByTimeAsync(50);
		await flush();
		expect(waapi.allAnimations.length).toBeGreaterThanOrEqual(2);

		// After another 50ms, third animation should start
		await vi.advanceTimersByTimeAsync(50);
		await flush();
		expect(waapi.allAnimations.length).toBe(3);

		// Finish all animations
		for (const anim of waapi.allAnimations) {
			anim.finish();
		}
		await vi.advanceTimersByTimeAsync(0);
		await flush();

		expect(stag.playState).toBe("finished");

		vi.useRealTimers();
	});

	it("nested composition: sequence containing parallel", async () => {
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const el3 = document.createElement("div");
		const el4 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const seq = sequence(
			() => animate(el1, kf, { duration: 100 }),
			() =>
				parallel(
					() => animate(el2, kf, { duration: 100 }),
					() => animate(el3, kf, { duration: 100 }),
				),
			() => animate(el4, kf, { duration: 100 }),
		);

		seq.play();
		await flush();

		// Step 0: first animate
		expect(waapi.allAnimations).toHaveLength(1);
		waapi.allAnimations[0].finish();
		await flush();

		// Step 1: parallel (2 animations)
		expect(waapi.allAnimations).toHaveLength(3);
		waapi.allAnimations[1].finish();
		waapi.allAnimations[2].finish();
		await flush();

		// Step 2: last animate
		expect(waapi.allAnimations).toHaveLength(4);
		waapi.allAnimations[3].finish();
		await flush();

		expect(seq.playState).toBe("finished");
	});

	it("cancel cascades to all leaf animations", async () => {
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const par = parallel(
			() => animate(el1, kf, { duration: 100 }),
			() => animate(el2, kf, { duration: 200 }),
		);

		par.play();
		await flush();

		expect(waapi.allAnimations).toHaveLength(2);

		par.cancel();
		await flush();

		expect(par.playState).toBe("idle");
		// Both leaf animations should be cancelled (state = idle)
		for (const anim of waapi.allAnimations) {
			expect(anim.playState).toBe("idle");
		}
	});

	it("sequence with delay gap between animations", async () => {
		vi.useFakeTimers();
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const seq = sequence(
			() => animate(el, kf, { duration: 100 }),
			() => delay(100),
			() => animate(el, kf, { duration: 100 }),
		);

		seq.play();
		await flush();

		// First animation starts
		expect(waapi.allAnimations).toHaveLength(1);
		waapi.allAnimations[0].finish();
		await flush();

		// Now in delay phase -- no new animation yet
		expect(waapi.allAnimations).toHaveLength(1);

		// Advance past the delay
		await vi.advanceTimersByTimeAsync(100);
		await flush();

		// Second animation should now be active
		expect(waapi.allAnimations).toHaveLength(2);

		waapi.allAnimations[1].finish();
		await flush();

		expect(seq.playState).toBe("finished");

		vi.useRealTimers();
	});

	it("step events on sequence with correct indices", async () => {
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const el3 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const seq = sequence(
			() => animate(el1, kf, { duration: 100 }),
			() => animate(el2, kf, { duration: 100 }),
			() => animate(el3, kf, { duration: 100 }),
		);

		const starts: number[] = [];
		const completes: number[] = [];

		seq.onStepStart?.((index) => {
			starts.push(index);
		});
		seq.onStepComplete?.((index) => {
			completes.push(index);
		});

		seq.play();
		await flush();

		expect(starts).toEqual([0]);

		waapi.allAnimations[0].finish();
		await flush();

		expect(completes).toEqual([0]);
		expect(starts).toEqual([0, 1]);

		waapi.allAnimations[1].finish();
		await flush();

		expect(completes).toEqual([0, 1]);
		expect(starts).toEqual([0, 1, 2]);

		waapi.allAnimations[2].finish();
		await flush();

		expect(completes).toEqual([0, 1, 2]);
		expect(seq.playState).toBe("finished");
	});

	it("inspectable state: currentStep and stepCount", async () => {
		const el1 = document.createElement("div");
		const el2 = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const seq = sequence(
			() => animate(el1, kf, { duration: 100 }),
			() => animate(el2, kf, { duration: 100 }),
		);

		expect(seq.stepCount).toBe(2);

		seq.play();
		await flush();

		expect(seq.currentStep).toBe(0);

		waapi.allAnimations[0].finish();
		await flush();

		expect(seq.currentStep).toBe(1);

		waapi.allAnimations[1].finish();
		await flush();

		expect(seq.playState).toBe("finished");
	});
});
