import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { race } from "../race.js";
import { getReducedMotionPolicy, setReducedMotionPolicy } from "../reducedMotion.js";
import { repeat } from "../repeat.js";
import { sequence } from "../sequence.js";
import { timeout } from "../timeout.js";
import { waitForEvent } from "../waitForEvent.js";
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

describe("integration: Phase 2 composition", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
	});

	afterEach(() => {
		waapi.restore();
	});

	it("nested sequences: outer finishes after all 4 animations in sequence", async () => {
		const el = document.createElement("div");
		const kf1 = [{ opacity: 0 }, { opacity: 1 }];
		const kf2 = [{ transform: "translateX(0)" }, { transform: "translateX(100px)" }];
		const kf3 = [{ transform: "scale(1)" }, { transform: "scale(2)" }];
		const kf4 = [{ opacity: 1 }, { opacity: 0 }];

		const outer = sequence(
			() => animate(el, kf1, { duration: 100 }),
			() =>
				sequence(
					() => animate(el, kf2, { duration: 100 }),
					() => animate(el, kf3, { duration: 100 }),
				),
			() => animate(el, kf4, { duration: 100 }),
		);

		outer.play();
		await flush();

		// Step 0: first animate
		expect(waapi.allAnimations).toHaveLength(1);
		waapi.allAnimations[0].finish();
		await flush();

		// Step 1a: inner sequence step 0
		expect(waapi.allAnimations).toHaveLength(2);
		waapi.allAnimations[1].finish();
		await flush();

		// Step 1b: inner sequence step 1
		expect(waapi.allAnimations).toHaveLength(3);
		waapi.allAnimations[2].finish();
		await flush(20); // deep nesting needs more flushes

		// Step 2: last animate
		expect(waapi.allAnimations).toHaveLength(4);
		waapi.allAnimations[3].finish();
		await flush(20);

		expect(outer.playState).toBe("finished");
	});

	it("event step in sequence: second animation starts only after event fires", async () => {
		const el = document.createElement("div");
		const kf1 = [{ opacity: 0 }, { opacity: 1 }];
		const kf2 = [{ transform: "translateX(0)" }, { transform: "translateX(100px)" }];
		const target = new EventTarget();

		const seq = sequence(
			() => animate(el, kf1, { duration: 100 }),
			() => waitForEvent(target, "click"),
			() => animate(el, kf2, { duration: 100 }),
		);

		seq.play();
		await flush();

		// First animation is running
		expect(waapi.allAnimations).toHaveLength(1);
		waapi.allAnimations[0].finish();
		await flush();

		// Event step is waiting -- no new animation yet
		expect(waapi.allAnimations).toHaveLength(1);

		// Dispatch the event
		target.dispatchEvent(new Event("click"));
		await flush();

		// Second animation should now be running
		expect(waapi.allAnimations).toHaveLength(2);
		waapi.allAnimations[1].finish();
		await flush();

		expect(seq.playState).toBe("finished");
	});

	it("race with animate + waitForEvent: event wins, animation cancelled", async () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];
		const target = new EventTarget();

		const r = race(
			() => waitForEvent(target, "click"),
			() => animate(el, kf, { duration: 5000 }),
		);

		r.play();
		await flush();

		// Animation is running
		expect(waapi.allAnimations).toHaveLength(1);

		// Event fires -- waitForEvent wins
		target.dispatchEvent(new Event("click"));
		await flush();

		expect(r.playState).toBe("finished");
		expect(r.winner).toBe(0); // waitForEvent was index 0
		// The WAAPI animation should have been cancelled
		expect(waapi.allAnimations[0].playState).toBe("idle");
	});

	it("repeat with factory re-instantiation: factory called fresh each iteration", async () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];
		let callCount = 0;

		const step = () => {
			callCount++;
			return animate(el, kf, { duration: 100 });
		};

		const rep = repeat(step, 3);
		rep.play();
		await flush();

		// Iteration 0
		expect(callCount).toBe(1);
		waapi.allAnimations[0].finish();
		await flush();

		// Iteration 1
		expect(callCount).toBe(2);
		waapi.allAnimations[1].finish();
		await flush();

		// Iteration 2
		expect(callCount).toBe(3);
		waapi.allAnimations[2].finish();
		await flush();

		expect(rep.playState).toBe("finished");
	});

	it("timeout wrapping slow animation: timedOut is true, inner cancelled", async () => {
		vi.useFakeTimers();

		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const t = timeout([() => animate(el, kf, { duration: 10000 })], 100);

		t.play();
		await flush();

		// Animation is running
		expect(waapi.allAnimations).toHaveLength(1);

		// Advance past deadline
		await vi.advanceTimersByTimeAsync(150);
		await flush();

		expect(t.timedOut).toBe(true);
		expect(t.playState).toBe("finished");
		// Inner animation should have been cancelled
		expect(waapi.allAnimations[0].playState).toBe("idle");

		vi.useRealTimers();
	});

	it("playbackRate propagation through nested sequence", async () => {
		const el = document.createElement("div");
		const kf1 = [{ opacity: 0 }, { opacity: 1 }];
		const kf2 = [{ transform: "translateX(0)" }, { transform: "translateX(100px)" }];

		const seq = sequence(
			() => animate(el, kf1, { duration: 100 }),
			() => animate(el, kf2, { duration: 100 }),
		);

		seq.play();
		await flush();

		// First animation is running
		expect(waapi.allAnimations).toHaveLength(1);

		// Set playbackRate on sequence
		seq.playbackRate = 2;

		// Active child (WAAPI animation) should have rate 2
		expect(waapi.allAnimations[0].playbackRate).toBe(2);

		// Complete first, advance to second
		waapi.allAnimations[0].finish();
		await flush();

		expect(waapi.allAnimations).toHaveLength(2);
		// New child should also get rate 2 (propagated on play)
		expect(waapi.allAnimations[1].playbackRate).toBe(2);

		waapi.allAnimations[1].finish();
		await flush();

		expect(seq.playState).toBe("finished");
	});

	it("reduced motion skip mode: sequence finishes instantly", async () => {
		// Save original policy
		const originalPolicy = getReducedMotionPolicy();

		// Mock matchMedia to return prefers-reduced-motion: reduce
		const matchMediaSpy = vi.spyOn(window, "matchMedia").mockReturnValue({
			matches: true,
			media: "(prefers-reduced-motion: reduce)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		});

		setReducedMotionPolicy("skip");

		// Verify policy is set and shouldApplyReducedMotion detects the condition
		expect(getReducedMotionPolicy()).toBe("skip");

		// wrapWithPolicy applies the skip policy at animation creation time
		const { wrapWithPolicy } = await import("../reducedMotion.js");
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];
		const wrappedFactory = wrapWithPolicy(
			() => animate(el, kf, { duration: 1000 }),
			kf,
			{ duration: 1000 },
			el,
		);
		const ctrl = wrappedFactory();
		// With skip mode and prefers-reduced-motion: reduce, the animation finishes instantly
		expect(ctrl.playState).toBe("finished");

		// Clean up
		setReducedMotionPolicy(originalPolicy);
		matchMediaSpy.mockRestore();
	});
});

describe("integration: Phase 2 barrel exports", () => {
	it("all Phase 2 runtime exports are accessible from index", async () => {
		const exports = await import("../index.js");

		// Core runtime (Phase 1)
		expect(typeof exports.animate).toBe("function");
		expect(typeof exports.delay).toBe("function");
		expect(typeof exports.sequence).toBe("function");
		expect(typeof exports.parallel).toBe("function");
		expect(typeof exports.stagger).toBe("function");

		// Phase 2: Event steps
		expect(typeof exports.waitForEvent).toBe("function");
		expect(typeof exports.waitForIntersection).toBe("function");
		expect(typeof exports.waitFor).toBe("function");

		// Phase 2: Composition operators
		expect(typeof exports.race).toBe("function");
		expect(typeof exports.repeat).toBe("function");
		expect(typeof exports.timeout).toBe("function");

		// Phase 2: Timeline
		expect(typeof exports.timeline).toBe("function");

		// Phase 2: Reduced motion
		expect(typeof exports.setReducedMotionPolicy).toBe("function");
		expect(typeof exports.getReducedMotionPolicy).toBe("function");
		expect(typeof exports.crossfadeKeyframes).toBe("function");
		expect(typeof exports.wrapWithPolicy).toBe("function");
		expect(typeof exports.applyReducedMotion).toBe("function");
		expect(typeof exports.shouldApplyReducedMotion).toBe("function");

		// React hooks
		expect(typeof exports.useTimeline).toBe("function");
		expect(typeof exports.useStagger).toBe("function");
		expect(typeof exports.ReducedMotionProvider).toBe("function");
		expect(typeof exports.useReducedMotionPolicy).toBe("function");
		expect(typeof exports.useReducedMotion).toBe("function");
		expect(typeof exports.useSequence).toBe("function");
	});
});
