import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
	configureFrameMonitor,
	startFrameMonitor,
	stopFrameMonitor,
	getFrameRate,
	onFrameRateChange,
	resetFrameMonitor,
} from "../frameMonitor.js";
import { getPressure, setPressure } from "../priority.js";

describe("frameMonitor", () => {
	let rafCallback: ((now: number) => void) | null = null;
	let rafId = 0;
	let canceledIds: number[] = [];

	beforeEach(() => {
		rafCallback = null;
		rafId = 0;
		canceledIds = [];
		vi.stubGlobal("requestAnimationFrame", (cb: (now: number) => void) => {
			rafCallback = cb;
			return ++rafId;
		});
		vi.stubGlobal("cancelAnimationFrame", (id: number) => {
			canceledIds.push(id);
		});
	});

	afterEach(() => {
		resetFrameMonitor();
		setPressure("none");
		vi.unstubAllGlobals();
	});

	describe("configureFrameMonitor", () => {
		it("sets degradeBelow threshold", () => {
			configureFrameMonitor({ degradeBelow: 50 });
			startFrameMonitor();

			// Simulate frames at 48fps (below new threshold)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 48; // ~20.83ms per frame
			}

			// Should set moderate pressure since 48 < 50
			expect(getPressure()).toBe("moderate");
		});

		it("sets criticalBelow threshold", () => {
			configureFrameMonitor({ criticalBelow: 25 });
			startFrameMonitor();

			// Simulate frames at 20fps (below new threshold)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 20; // 50ms per frame
			}

			// Should set critical pressure since 20 < 25
			expect(getPressure()).toBe("critical");
		});

		it("sets windowSize", () => {
			configureFrameMonitor({ windowSize: 5 });
			startFrameMonitor();

			const callback = vi.fn();
			onFrameRateChange(callback);

			// With windowSize=5, need to trigger a FPS change
			// Start at 60fps
			let t = 0;
			for (let i = 0; i < 6; i++) {
				rafCallback?.(t);
				t += 1000 / 60;
			}

			// Now change to 30fps to trigger callback
			for (let i = 0; i < 6; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(callback).toHaveBeenCalledWith(30);
		});
	});

	describe("startFrameMonitor / stopFrameMonitor", () => {
		it("startFrameMonitor calls requestAnimationFrame", () => {
			expect(rafCallback).toBeNull();
			startFrameMonitor();
			expect(rafCallback).not.toBeNull();
			expect(rafId).toBe(1);
		});

		it("stopFrameMonitor calls cancelAnimationFrame", () => {
			startFrameMonitor();
			const id = rafId;
			stopFrameMonitor();
			expect(canceledIds).toContain(id);
		});

		it("multiple startFrameMonitor calls are idempotent", () => {
			startFrameMonitor();
			const firstId = rafId;
			startFrameMonitor();
			expect(rafId).toBe(firstId); // Should not schedule another rAF
		});

		it("multiple stopFrameMonitor calls are safe", () => {
			startFrameMonitor();
			stopFrameMonitor();
			const cancelCount = canceledIds.length;
			stopFrameMonitor();
			// Second stop should not call cancelAnimationFrame again
			expect(canceledIds.length).toBe(cancelCount);
		});

		it("stopFrameMonitor clears frame times", () => {
			startFrameMonitor();

			// Generate some frame data
			let t = 0;
			for (let i = 0; i < 5; i++) {
				rafCallback?.(t);
				t += 1000 / 60;
			}

			stopFrameMonitor();

			// After stop, starting again should reset to 60fps
			startFrameMonitor();
			expect(getFrameRate()).toBe(60);
		});
	});

	describe("getFrameRate", () => {
		it("returns 60 initially", () => {
			expect(getFrameRate()).toBe(60);
		});

		it("returns 60 after startFrameMonitor before any frames", () => {
			startFrameMonitor();
			expect(getFrameRate()).toBe(60);
		});

		it("returns calculated FPS after frames are processed at 60fps", () => {
			startFrameMonitor();

			// Simulate 60fps frames
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 60; // 16.67ms per frame
			}

			expect(getFrameRate()).toBe(60);
		});

		it("returns calculated FPS after frames are processed at 30fps", () => {
			startFrameMonitor();

			// Simulate 30fps frames
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30; // 33.33ms per frame
			}

			expect(getFrameRate()).toBe(30);
		});

		it("returns calculated FPS after frames are processed at 20fps", () => {
			startFrameMonitor();

			// Simulate 20fps frames
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 20; // 50ms per frame
			}

			expect(getFrameRate()).toBe(20);
		});

		it("requires at least 3 frames for meaningful calculation", () => {
			startFrameMonitor();

			// Only 2 frames
			rafCallback?.(0);
			rafCallback?.(16.67);

			// Should still be initial value
			expect(getFrameRate()).toBe(60);

			// Third frame triggers calculation
			rafCallback?.(33.33);
			expect(getFrameRate()).toBe(60);
		});
	});

	describe("onFrameRateChange", () => {
		it("fires callback when FPS changes", () => {
			const callback = vi.fn();
			onFrameRateChange(callback);

			startFrameMonitor();

			// Start at 60fps
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 60;
			}

			expect(callback).not.toHaveBeenCalled(); // 60 -> 60 is not a change

			// Now drop to 30fps
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(callback).toHaveBeenCalledWith(30);
		});

		it("returns unsubscribe function", () => {
			const callback = vi.fn();
			const unsubscribe = onFrameRateChange(callback);
			expect(typeof unsubscribe).toBe("function");
		});

		it("unsubscribe prevents further callbacks", () => {
			const callback = vi.fn();
			const unsubscribe = onFrameRateChange(callback);

			startFrameMonitor();

			// Generate frames at 30fps
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(callback).toHaveBeenCalledTimes(1);
			callback.mockClear();

			unsubscribe();

			// Now change to 20fps
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 20;
			}

			expect(callback).not.toHaveBeenCalled();
		});

		it("supports multiple subscribers", () => {
			const cb1 = vi.fn();
			const cb2 = vi.fn();
			onFrameRateChange(cb1);
			onFrameRateChange(cb2);

			startFrameMonitor();

			// Drop to 30fps
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(cb1).toHaveBeenCalledWith(30);
			expect(cb2).toHaveBeenCalledWith(30);
		});
	});

	describe("Pressure integration", () => {
		it("sets pressure to moderate when FPS drops below degradeBelow (45)", () => {
			startFrameMonitor();

			// Simulate 40fps (below default degradeBelow=45)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 40;
			}

			expect(getPressure()).toBe("moderate");
		});

		it("sets pressure to critical when FPS drops below criticalBelow (30)", () => {
			startFrameMonitor();

			// Simulate 25fps (below default criticalBelow=30)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 25;
			}

			expect(getPressure()).toBe("critical");
		});

		it("restores pressure to none when FPS recovers above degradeBelow", () => {
			startFrameMonitor();

			// Drop to 25fps (critical)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 25;
			}

			expect(getPressure()).toBe("critical");

			// Recover to 55fps (above degradeBelow=45)
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 55;
			}

			expect(getPressure()).toBe("none");
		});

		it("does not change pressure if FPS stays in same zone", () => {
			const callback = vi.fn();
			onFrameRateChange(callback);

			startFrameMonitor();

			// Start at 40fps (moderate)
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 40;
			}

			expect(getPressure()).toBe("moderate");

			// Move to 42fps (still moderate)
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 42;
			}

			expect(getPressure()).toBe("moderate");
		});

		it("ignores unreasonably large deltas (tab backgrounded)", () => {
			startFrameMonitor();

			// Normal frames
			let t = 0;
			for (let i = 0; i < 5; i++) {
				rafCallback?.(t);
				t += 1000 / 60;
			}

			// Simulate tab being backgrounded (huge gap)
			rafCallback?.(t);
			t += 5000; // 5 second gap
			rafCallback?.(t);

			// Should still report 60fps, not affected by the huge delta
			expect(getFrameRate()).toBe(60);
		});
	});

	describe("resetFrameMonitor", () => {
		it("stops monitoring", () => {
			startFrameMonitor();
			resetFrameMonitor();
			expect(canceledIds.length).toBeGreaterThan(0);
		});

		it("resets FPS to 60", () => {
			startFrameMonitor();

			// Drop to 30fps
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(getFrameRate()).toBe(30);

			resetFrameMonitor();
			expect(getFrameRate()).toBe(60);
		});

		it("resets degradeBelow to default (45)", () => {
			configureFrameMonitor({ degradeBelow: 50 });
			resetFrameMonitor();

			// After reset, should use default threshold
			startFrameMonitor();

			// 48fps should not trigger moderate with default degradeBelow=45
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 48;
			}

			expect(getPressure()).toBe("none");
		});

		it("resets criticalBelow to default (30)", () => {
			configureFrameMonitor({ criticalBelow: 25 });
			resetFrameMonitor();

			// After reset, should use default threshold
			startFrameMonitor();

			// 28fps is below default criticalBelow=30, so should trigger critical
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 28;
			}

			expect(getPressure()).toBe("critical"); // 28 < 30, so critical

			// Reset and try with 35fps (above criticalBelow=30 but below degradeBelow=45)
			resetFrameMonitor();
			setPressure("none");
			startFrameMonitor();

			t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 35;
			}

			expect(getPressure()).toBe("moderate"); // 35 is between 30 and 45
		});

		it("resets windowSize to default (10)", () => {
			configureFrameMonitor({ windowSize: 5 });
			resetFrameMonitor();
			// Window size is internal, but we can verify it doesn't crash
			startFrameMonitor();
			let t = 0;
			for (let i = 0; i < 15; i++) {
				rafCallback?.(t);
				t += 1000 / 60;
			}
			expect(getFrameRate()).toBe(60);
		});

		it("clears all callbacks", () => {
			const callback = vi.fn();
			onFrameRateChange(callback);
			resetFrameMonitor();

			startFrameMonitor();

			// Generate FPS change
			let t = 0;
			for (let i = 0; i < 12; i++) {
				rafCallback?.(t);
				t += 1000 / 30;
			}

			expect(callback).not.toHaveBeenCalled();
		});
	});
});
