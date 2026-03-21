import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stagger } from "../stagger.js";
import { createMockControllable } from "./helpers.js";

describe("stagger", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts steps with each=50ms offset apart", async () => {
		const startOrder: string[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		// Track when each step is played
		const origPlayA = a.play.bind(a);
		a.play = () => {
			startOrder.push("A");
			origPlayA();
		};
		const origPlayB = b.play.bind(b);
		b.play = () => {
			startOrder.push("B");
			origPlayB();
		};
		const origPlayC = c.play.bind(c);
		c.play = () => {
			startOrder.push("C");
			origPlayC();
		};

		const stg = stagger([a, b, c], { each: 50 });
		stg.play();

		// A should start immediately (delay(0))
		await vi.advanceTimersByTimeAsync(0);
		expect(startOrder).toContain("A");

		// B should start at 50ms
		await vi.advanceTimersByTimeAsync(50);
		expect(startOrder).toContain("B");

		// C should start at 100ms
		await vi.advanceTimersByTimeAsync(50);
		expect(startOrder).toContain("C");

		// Resolve all to clean up
		a._resolve();
		b._resolve();
		c._resolve();
		await vi.advanceTimersByTimeAsync(0);
		await stg.finished;
	});

	it("cancel cancels all children", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const stg = stagger([a, b], { each: 50 });
		stg.play();

		stg.cancel();

		await expect(stg.finished).resolves.toBeUndefined();
	});

	it("pause pauses all active children", async () => {
		const a = createMockControllable();
		const b = createMockControllable();

		const stg = stagger([a, b], { each: 50 });
		stg.play();

		// Advance so A is running
		await vi.advanceTimersByTimeAsync(0);

		stg.pause();
		expect(stg.playState).toBe("paused");

		// Resolve all to clean up
		stg.cancel();
		await stg.finished;
	});

	it("onStepStart fires for each step as its delay elapses", async () => {
		const starts: number[] = [];
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const stg = stagger([a, b, c], { each: 50 });
		stg.onStepStart?.((index) => {
			starts.push(index);
		});

		stg.play();

		// A starts immediately (delay(0))
		await vi.advanceTimersByTimeAsync(0);
		expect(starts).toContain(0);

		// B starts at 50ms
		await vi.advanceTimersByTimeAsync(50);
		expect(starts).toContain(1);

		// C starts at 100ms
		await vi.advanceTimersByTimeAsync(50);
		expect(starts).toContain(2);

		// Clean up
		a._resolve();
		b._resolve();
		c._resolve();
		await vi.advanceTimersByTimeAsync(0);
		await stg.finished;
	});

	it("stepCount equals the number of original steps", () => {
		const a = createMockControllable();
		const b = createMockControllable();
		const c = createMockControllable();

		const stg = stagger([a, b, c], { each: 50 });
		expect(stg.stepCount).toBe(3);
	});
});
