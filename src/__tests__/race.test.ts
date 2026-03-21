import { describe, expect, it } from "vitest";
import { race } from "../race.js";
import { createMockControllable } from "./helpers.js";

/** Flush multiple microtask rounds for deeply nested promise chains */
async function flush(rounds = 8): Promise<void> {
	for (let i = 0; i < rounds; i++) {
		await Promise.resolve();
	}
}

describe("race()", () => {
	it("all children start playing on play()", () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const child3 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
			() => child3,
		);

		ctrl.play();

		expect(child1._played).toBe(true);
		expect(child2._played).toBe(true);
		expect(child3._played).toBe(true);
		expect(child1.playState).toBe("running");
		expect(child2.playState).toBe("running");
		expect(child3.playState).toBe("running");
	});

	it("first child to finish wins, others cancelled", async () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const child3 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
			() => child3,
		);

		ctrl.play();

		// Child 2 finishes first
		child2._resolve();
		await flush();

		// Losers should be cancelled
		expect(child1.playState).toBe("idle");
		expect(child3.playState).toBe("idle");
	});

	it("winner property returns winning index (0-based)", async () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const child3 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
			() => child3,
		);

		ctrl.play();

		child2._resolve();
		await flush();

		expect(ctrl.winner).toBe(1);
	});

	it("winner is undefined before completion", () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		expect(ctrl.winner).toBeUndefined();

		ctrl.play();
		expect(ctrl.winner).toBeUndefined();
	});

	it("settled flag: second child finishing after first does NOT change winner", async () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		ctrl.play();

		// Child 1 finishes first
		child1._resolve();
		await flush();

		expect(ctrl.winner).toBe(0);

		// Child 2 also finishes (it was cancelled, but its .then may still fire)
		child2._resolve();
		await flush();

		// Winner should NOT have changed
		expect(ctrl.winner).toBe(0);
	});

	it("pause() pauses all children", () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		ctrl.play();
		ctrl.pause();

		expect(child1.playState).toBe("paused");
		expect(child2.playState).toBe("paused");
	});

	it("cancel() cancels all children", () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		ctrl.play();
		ctrl.cancel();

		expect(child1.playState).toBe("idle");
		expect(child2.playState).toBe("idle");
	});

	it("playbackRate propagates to all children", () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		ctrl.play();
		ctrl.playbackRate = 2.5;

		expect(child1.playbackRate).toBe(2.5);
		expect(child2.playbackRate).toBe(2.5);
	});

	it("race with single child: that child wins immediately", async () => {
		const child = createMockControllable();
		const ctrl = race(() => child);

		ctrl.play();
		child._resolve();
		await flush();

		expect(ctrl.winner).toBe(0);
		expect(ctrl.playState).toBe("finished");
	});

	it("finished promise resolves when winner is determined", async () => {
		const child1 = createMockControllable();
		const child2 = createMockControllable();
		const ctrl = race(
			() => child1,
			() => child2,
		);

		ctrl.play();

		let finished = false;
		ctrl.finished.then(() => {
			finished = true;
		});

		child1._resolve();
		await flush();

		expect(finished).toBe(true);
	});
});
