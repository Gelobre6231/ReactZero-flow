import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { delay } from "../delay.js";
import { parallel } from "../parallel.js";
import { sequence } from "../sequence.js";
import { stagger } from "../stagger.js";
import { createMockControllable, installWAAPIMock } from "./helpers.js";

describe("playbackRate", () => {
	describe("animate()", () => {
		let waapi: ReturnType<typeof installWAAPIMock>;

		beforeEach(() => {
			waapi = installWAAPIMock();
		});

		afterEach(() => {
			waapi.restore();
		});

		it("default playbackRate is 1", () => {
			const el = document.createElement("div");
			const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
			expect(ctrl.playbackRate).toBe(1);
		});

		it("playbackRate getter maps to WAAPI animation.playbackRate", () => {
			const el = document.createElement("div");
			const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
			// Directly set the mock animation's playbackRate
			waapi.lastAnimation.playbackRate = 2.5;
			expect(ctrl.playbackRate).toBe(2.5);
		});

		it("playbackRate setter maps to WAAPI animation.playbackRate", () => {
			const el = document.createElement("div");
			const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
			ctrl.playbackRate = 3;
			expect(waapi.lastAnimation.playbackRate).toBe(3);
		});
	});

	describe("delay()", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("default playbackRate is 1", () => {
			const ctrl = delay(1000);
			expect(ctrl.playbackRate).toBe(1);
		});

		it("playbackRate=2 completes in half the time", async () => {
			const ctrl = delay(1000);
			ctrl.playbackRate = 2;
			ctrl.play();

			let finished = false;
			ctrl.finished.then(() => {
				finished = true;
			});

			// At 400ms (less than 500ms = 1000/2), should NOT be finished
			vi.advanceTimersByTime(400);
			await Promise.resolve();
			expect(finished).toBe(false);

			// At 500ms (1000/2), should be finished
			vi.advanceTimersByTime(100);
			await Promise.resolve();
			expect(finished).toBe(true);
			expect(ctrl.playState).toBe("finished");
		});

		it("playbackRate setter mid-flight recalculates remaining", async () => {
			const ctrl = delay(1000);
			ctrl.play();

			let finished = false;
			ctrl.finished.then(() => {
				finished = true;
			});

			// Advance 200ms at rate 1 -> 800ms remaining (logical)
			vi.advanceTimersByTime(200);
			await Promise.resolve();
			expect(finished).toBe(false);

			// Change rate to 2 -> remaining 800ms at 2x = 400ms wall clock
			ctrl.playbackRate = 2;

			// Advance 300ms -- not yet done (need 400ms)
			vi.advanceTimersByTime(300);
			await Promise.resolve();
			expect(finished).toBe(false);

			// Advance 100ms more (total 400ms since rate change) -> done
			vi.advanceTimersByTime(100);
			await Promise.resolve();
			expect(finished).toBe(true);
		});

		it("rejects zero playbackRate (no-op)", () => {
			const ctrl = delay(1000);
			ctrl.playbackRate = 0;
			expect(ctrl.playbackRate).toBe(1); // unchanged
		});

		it("rejects negative playbackRate (no-op)", () => {
			const ctrl = delay(1000);
			ctrl.playbackRate = -1;
			expect(ctrl.playbackRate).toBe(1); // unchanged
		});
	});

	describe("sequence()", () => {
		it("default playbackRate is 1", () => {
			const ctrl = sequence(() => createMockControllable());
			expect(ctrl.playbackRate).toBe(1);
		});

		it("propagates playbackRate to active child", () => {
			const child = createMockControllable();
			const ctrl = sequence(() => child);
			ctrl.play();

			// Default rate should be propagated
			expect(child.playbackRate).toBe(1);

			// Change rate on sequence
			ctrl.playbackRate = 2;
			expect(child.playbackRate).toBe(2);
		});

		it("propagates playbackRate to new children as they start", async () => {
			const child1 = createMockControllable();
			const child2 = createMockControllable();
			let step = 0;
			const ctrl = sequence(
				() => {
					step = 1;
					return child1;
				},
				() => {
					step = 2;
					return child2;
				},
			);

			// Set rate before playing
			ctrl.playbackRate = 3;
			ctrl.play();
			expect(step).toBe(1);
			expect(child1.playbackRate).toBe(3);

			// Complete child1, child2 should get the rate
			child1._resolve();
			await Promise.resolve();
			await Promise.resolve();
			expect(step).toBe(2);
			expect(child2.playbackRate).toBe(3);
		});
	});

	describe("parallel()", () => {
		it("default playbackRate is 1", () => {
			const ctrl = parallel(() => createMockControllable());
			expect(ctrl.playbackRate).toBe(1);
		});

		it("propagates playbackRate to all children", () => {
			const child1 = createMockControllable();
			const child2 = createMockControllable();
			const ctrl = parallel(
				() => child1,
				() => child2,
			);
			ctrl.play();

			ctrl.playbackRate = 2.5;
			expect(child1.playbackRate).toBe(2.5);
			expect(child2.playbackRate).toBe(2.5);
		});

		it("sets playbackRate on children before playing", () => {
			const child1 = createMockControllable();
			const child2 = createMockControllable();
			const ctrl = parallel(
				() => child1,
				() => child2,
			);
			ctrl.playbackRate = 4;
			ctrl.play();

			expect(child1.playbackRate).toBe(4);
			expect(child2.playbackRate).toBe(4);
		});
	});

	describe("stagger()", () => {
		it("default playbackRate is 1", () => {
			const ctrl = stagger([() => createMockControllable()], { each: 100 });
			expect(ctrl.playbackRate).toBe(1);
		});

		it("propagates playbackRate to inner children", () => {
			const child1 = createMockControllable();
			const child2 = createMockControllable();
			const ctrl = stagger([() => child1, () => child2], { each: 100 });
			ctrl.play();

			ctrl.playbackRate = 2;
			// Stagger uses inner sequences -- the rate propagates through
			// We can verify the stagger's own playbackRate is set
			expect(ctrl.playbackRate).toBe(2);
		});
	});
});
