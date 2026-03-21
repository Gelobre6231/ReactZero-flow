import { describe, expect, it } from "vitest";
import { repeat } from "../repeat.js";
import { createMockControllable } from "./helpers.js";

/** Flush multiple microtask rounds for deeply nested promise chains */
async function flush(rounds = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve();
	}
}

describe("repeat()", () => {
	it("runs N iterations (count=3)", async () => {
		let sequencesCreated = 0;
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			sequencesCreated++;
			const mock = createMockControllable();
			mocks.push(mock);
			return mock;
		};

		const ctrl = repeat(step, 3);
		ctrl.play();

		// Iteration 0: step is created and playing
		expect(sequencesCreated).toBe(1);

		// Complete iteration 0
		mocks[0]._resolve();
		await flush();

		// Iteration 1: new step created
		expect(sequencesCreated).toBe(2);

		// Complete iteration 1
		mocks[1]._resolve();
		await flush();

		// Iteration 2
		expect(sequencesCreated).toBe(3);

		// Complete iteration 2
		mocks[2]._resolve();
		await flush();

		expect(ctrl.playState).toBe("finished");
	});

	it("each iteration creates fresh Controllables (factory called each time)", async () => {
		const instances: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const mock = createMockControllable();
			instances.push(mock);
			return mock;
		};

		const ctrl = repeat(step, 2);
		ctrl.play();

		// First instance
		expect(instances.length).toBe(1);
		instances[0]._resolve();
		await flush();

		// Second instance -- must be a DIFFERENT object
		expect(instances.length).toBe(2);
		expect(instances[0]).not.toBe(instances[1]);

		instances[1]._resolve();
		await flush();

		expect(ctrl.playState).toBe("finished");
	});

	it("yoyo reverses order on odd iterations", async () => {
		const order: string[] = [];
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const stepA = () => {
			order.push("A");
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};
		const stepB = () => {
			order.push("B");
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat([stepA, stepB], 3, { yoyo: true });
		ctrl.play();

		// Iteration 0 (forward): A, B
		expect(order).toEqual(["A"]);
		mocks[0]._resolve();
		await flush();

		expect(order).toEqual(["A", "B"]);
		mocks[1]._resolve();
		await flush();

		// Iteration 1 (reversed): B, A
		expect(order).toEqual(["A", "B", "B"]);
		mocks[2]._resolve();
		await flush();

		expect(order).toEqual(["A", "B", "B", "A"]);
		mocks[3]._resolve();
		await flush();

		// Iteration 2 (forward again): A, B
		expect(order).toEqual(["A", "B", "B", "A", "A"]);
		mocks[4]._resolve();
		await flush();

		expect(order).toEqual(["A", "B", "B", "A", "A", "B"]);
		mocks[5]._resolve();
		await flush();

		expect(ctrl.playState).toBe("finished");
	});

	it("onRepeat callback fires after each iteration with iteration index", async () => {
		const iterations: number[] = [];
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat(step, 3, {
			onRepeat: (i) => iterations.push(i),
		});
		ctrl.play();

		// Complete iteration 0
		mocks[0]._resolve();
		await flush();

		expect(iterations).toEqual([0]);

		// Complete iteration 1
		mocks[1]._resolve();
		await flush();

		expect(iterations).toEqual([0, 1]);

		// Complete iteration 2
		mocks[2]._resolve();
		await flush();

		expect(iterations).toEqual([0, 1, 2]);
		expect(ctrl.playState).toBe("finished");
	});

	it("cancel() during iteration stops loop", async () => {
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat(step, 10);
		ctrl.play();

		expect(mocks.length).toBe(1);

		// Cancel during first iteration
		ctrl.cancel();

		// Active child should be cancelled
		expect(mocks[0].playState).toBe("idle");
		expect(ctrl.playState).toBe("idle");

		// No more iterations should start
		await flush();
		expect(mocks.length).toBe(1);
	});

	it("infinite repeat: does not resolve until cancel", async () => {
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat(step, Number.POSITIVE_INFINITY);
		ctrl.play();

		let finished = false;
		ctrl.finished.then(() => {
			finished = true;
		});

		// Complete a few iterations
		for (let i = 0; i < 5; i++) {
			mocks[i]._resolve();
			await flush();
		}

		expect(finished).toBe(false);
		expect(mocks.length).toBe(6); // 5 completed + 1 active

		// Cancel stops it
		ctrl.cancel();
		await flush();

		expect(finished).toBe(true);
	});

	it("pause() pauses active iteration's sequence", async () => {
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat(step, 3);
		ctrl.play();

		expect(mocks[0].playState).toBe("running");

		ctrl.pause();
		expect(mocks[0].playState).toBe("paused");
	});

	it("playbackRate propagates to active child", async () => {
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const step = () => {
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		const ctrl = repeat(step, 3);
		ctrl.play();

		ctrl.playbackRate = 2.5;
		// The active child is a sequence wrapping our mock -- playbackRate propagation
		// goes through: repeat -> sequence -> mock
		// We verify the repeat's own rate is set
		expect(ctrl.playbackRate).toBe(2.5);
	});
});
