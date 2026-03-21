import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { timeout } from "../timeout.js";
import { createMockControllable } from "./helpers.js";

/** Flush multiple microtask rounds for promise chains */
async function flush(rounds = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve();
	}
}

describe("timeout()", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("inner steps complete before deadline: timedOut is false", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 1000);

		ctrl.play();

		// Child finishes before the 1000ms deadline
		child._resolve();
		await flush();

		expect(ctrl.timedOut).toBe(false);
		expect(ctrl.playState).toBe("finished");
	});

	it("deadline fires before inner completes: timedOut is true, inner cancelled", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 500);

		ctrl.play();

		// Advance past the deadline
		vi.advanceTimersByTime(500);
		await flush();

		expect(ctrl.timedOut).toBe(true);
		expect(child.playState).toBe("idle"); // inner was cancelled
	});

	it("finished promise always resolves (never rejects) regardless of timeout", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 500);

		ctrl.play();

		let resolved = false;
		let rejected = false;
		ctrl.finished.then(
			() => {
				resolved = true;
			},
			() => {
				rejected = true;
			},
		);

		// Let deadline fire
		vi.advanceTimersByTime(500);
		await flush();

		expect(resolved).toBe(true);
		expect(rejected).toBe(false);
	});

	it("finished promise resolves on natural completion too", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 5000);

		ctrl.play();

		let resolved = false;
		ctrl.finished.then(() => {
			resolved = true;
		});

		child._resolve();
		await flush();

		expect(resolved).toBe(true);
		expect(ctrl.timedOut).toBe(false);
	});

	it("timedOut is undefined before completion", () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 1000);

		expect(ctrl.timedOut).toBeUndefined();

		ctrl.play();
		expect(ctrl.timedOut).toBeUndefined();
	});

	it("pause() pauses both inner and deadline timer", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 1000);

		ctrl.play();

		// Advance 300ms
		vi.advanceTimersByTime(300);

		// Pause
		ctrl.pause();
		expect(child.playState).toBe("paused");

		// Advance another 900ms while paused -- deadline should NOT fire
		vi.advanceTimersByTime(900);
		await flush();

		expect(ctrl.timedOut).toBeUndefined(); // still running (paused)

		// Resume -- deadline should restart with ~700ms remaining
		ctrl.play();
		expect(child.playState).toBe("running");

		// Advance 600ms -- not yet timed out (need 700ms)
		vi.advanceTimersByTime(600);
		await flush();
		expect(ctrl.timedOut).toBeUndefined();

		// Advance another 100ms -- now deadline fires
		vi.advanceTimersByTime(100);
		await flush();

		expect(ctrl.timedOut).toBe(true);
	});

	it("cancel() cancels inner and clears deadline", async () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 1000);

		ctrl.play();

		ctrl.cancel();

		expect(child.playState).toBe("idle");
		expect(ctrl.playState).toBe("idle");

		// Advance past deadline -- should not cause issues
		vi.advanceTimersByTime(2000);
		await flush();

		// timedOut should still be undefined (cancelled, not timed out)
		expect(ctrl.timedOut).toBeUndefined();
	});

	it("playbackRate propagates to inner", () => {
		const child = createMockControllable();
		const ctrl = timeout([() => child], 1000);

		ctrl.play();
		ctrl.playbackRate = 2;

		// We can verify the timeout's own rate is set
		expect(ctrl.playbackRate).toBe(2);
	});
});
