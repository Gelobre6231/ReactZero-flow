import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay } from "../delay.js";

describe("delay", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("delay(100) finishes after 100ms", async () => {
		const d = delay(100);
		d.play();
		expect(d.playState).toBe("running");

		vi.advanceTimersByTime(100);

		await vi.waitFor(() => {
			expect(d.playState).toBe("finished");
		});
	});

	it("delay can be paused and resumed", async () => {
		const d = delay(200);
		d.play();
		expect(d.playState).toBe("running");

		// Advance 50ms, then pause
		vi.advanceTimersByTime(50);
		d.pause();
		expect(d.playState).toBe("paused");

		// Advance time while paused - should NOT finish
		vi.advanceTimersByTime(500);
		expect(d.playState).toBe("paused");

		// Resume
		d.play();
		expect(d.playState).toBe("running");

		// Remaining 150ms
		vi.advanceTimersByTime(150);

		await vi.waitFor(() => {
			expect(d.playState).toBe("finished");
		});
	});

	it("delay can be cancelled (resolves finished, clears timer)", async () => {
		const d = delay(100);
		d.play();
		expect(d.playState).toBe("running");

		d.cancel();
		expect(d.playState).toBe("idle");

		// finished should resolve, not reject
		await expect(d.finished).resolves.toBeUndefined();
	});

	it("delay(0) finishes on next tick", async () => {
		const d = delay(0);
		d.play();
		expect(d.playState).toBe("running");

		vi.advanceTimersByTime(0);

		await vi.waitFor(() => {
			expect(d.playState).toBe("finished");
		});
	});

	it("onStateChange callback fires on transitions", () => {
		const d = delay(100);
		const states: string[] = [];

		d.onStateChange(() => {
			states.push(d.playState);
		});

		d.play();
		d.pause();
		d.cancel();

		expect(states).toContain("running");
		expect(states).toContain("paused");
		expect(states).toContain("idle");
	});

	it("finish() completes delay immediately", async () => {
		const d = delay(1000);
		d.play();
		expect(d.playState).toBe("running");

		d.finish();
		expect(d.playState).toBe("finished");

		await expect(d.finished).resolves.toBeUndefined();
	});

	it("currentStep and stepCount are undefined (leaf)", () => {
		const d = delay(100);
		expect(d.currentStep).toBeUndefined();
		expect(d.stepCount).toBeUndefined();
	});
});
