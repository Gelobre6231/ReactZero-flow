import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sequence } from "../sequence.js";
import { createMockControllable, installWAAPIMock } from "./helpers.js";

describe("nested sequences", () => {
	it("basic nesting: inner sequence steps execute in correct order within outer", async () => {
		const order: string[] = [];
		const mocks: ReturnType<typeof createMockControllable>[] = [];

		const makeStep = (name: string) => () => {
			order.push(name);
			const m = createMockControllable();
			mocks.push(m);
			return m;
		};

		// outer: step1 -> inner(step2 -> step3) -> step4
		const ctrl = sequence(
			makeStep("step1"),
			() => sequence(makeStep("step2"), makeStep("step3")),
			makeStep("step4"),
		);

		ctrl.play();

		// step1 starts
		expect(order).toEqual(["step1"]);
		mocks[0]._resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		// Inner sequence starts, step2 plays
		expect(order).toEqual(["step1", "step2"]);
		mocks[1]._resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		// step3 plays
		expect(order).toEqual(["step1", "step2", "step3"]);
		mocks[2]._resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		// step4 plays
		expect(order).toEqual(["step1", "step2", "step3", "step4"]);
		mocks[3]._resolve();
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();

		expect(ctrl.playState).toBe("finished");
	});

	it("playbackRate propagation to grandchildren", () => {
		const grandchild = createMockControllable();

		const inner = sequence(() => grandchild);
		const outer = sequence(() => inner);

		outer.play();

		// Set rate on outer
		outer.playbackRate = 2;

		// Rate should propagate: outer -> inner -> grandchild
		expect(grandchild.playbackRate).toBe(2);
	});

	it("pause propagation: pause outer pauses inner and grandchild", () => {
		const grandchild = createMockControllable();

		const inner = sequence(() => grandchild);
		const outer = sequence(() => inner);

		outer.play();
		expect(grandchild.playState).toBe("running");

		outer.pause();
		expect(grandchild.playState).toBe("paused");
	});

	it("cancel propagation: cancel outer cancels inner and grandchild", () => {
		const grandchild = createMockControllable();

		const inner = sequence(() => grandchild);
		const outer = sequence(() => inner);

		outer.play();
		expect(grandchild.playState).toBe("running");

		outer.cancel();
		expect(grandchild.playState).toBe("idle");
	});

	it("triple nesting: deeply nested sequence completes correctly", async () => {
		const deepChild = createMockControllable();

		const level3 = () => sequence(() => deepChild);
		const level2 = () => sequence(level3);
		const level1 = sequence(level2);

		level1.play();
		expect(deepChild.playState).toBe("running");

		// Access finished AFTER play() so we get the active promise
		let finished = false;
		level1.finished.then(() => {
			finished = true;
		});

		deepChild._resolve();
		// Many flushes needed for triple-nested promise chains:
		// deepChild.finished -> level3 runner -> level3 createControllable.then ->
		// level2 step resolve -> level2 runner -> level2 createControllable.then ->
		// level1 step resolve -> level1 runner -> level1 createControllable.then
		for (let i = 0; i < 20; i++) {
			await Promise.resolve();
		}

		expect(finished).toBe(true);
		expect(level1.playState).toBe("finished");
	});

	it("nested sequence finished promise: outer resolves only after all inner sequences complete", async () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();

		const inner = sequence(
			() => child1,
			() => child2,
		);
		const outer = sequence(() => inner);

		let outerFinished = false;
		outer.play();
		outer.finished.then(() => {
			outerFinished = true;
		});

		// Complete child1 -- outer should NOT be finished yet
		child1._resolve();
		for (let i = 0; i < 8; i++) {
			await Promise.resolve();
		}
		expect(outerFinished).toBe(false);

		// Complete child2 -- now outer should finish
		child2._resolve();
		for (let i = 0; i < 8; i++) {
			await Promise.resolve();
		}
		expect(outerFinished).toBe(true);
	});

	describe("with WAAPI animations", () => {
		let waapi: ReturnType<typeof installWAAPIMock>;

		beforeEach(() => {
			waapi = installWAAPIMock();
		});

		afterEach(() => {
			waapi.restore();
		});

		it("playbackRate propagates to WAAPI grandchild via nested sequences", async () => {
			const { animate } = await import("../animate.js");
			const el = document.createElement("div");

			const inner = () =>
				sequence(() => animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }));
			const outer = sequence(inner);

			outer.play();

			// The WAAPI animation should exist
			expect(waapi.allAnimations.length).toBe(1);

			// Set rate on outer
			outer.playbackRate = 3;

			// Rate should propagate through nested sequences to the WAAPI animation
			expect(waapi.lastAnimation.playbackRate).toBe(3);
		});
	});
});
