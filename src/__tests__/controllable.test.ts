import { describe, expect, it } from "vitest";
import { createControllable } from "../controllable.js";

describe("createControllable", () => {
	it("transitions from idle -> running -> finished", async () => {
		const controllable = createControllable({
			runner: async () => {
				// Simulate work
			},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		expect(controllable.playState).toBe("idle");
		controllable.play();
		expect(controllable.playState).toBe("running");
		await controllable.finished;
		expect(controllable.playState).toBe("finished");
	});

	it("supports pause/resume cycle", async () => {
		let pauseResolve: (() => void) | null = null;
		let isPaused = false;

		const controllable = createControllable({
			runner: async (_signal) => {
				// Wait while paused
				await new Promise<void>((resolve) => {
					if (isPaused) {
						pauseResolve = resolve;
					} else {
						resolve();
					}
				});
			},
			controls: {
				pause() {
					isPaused = true;
				},
				resume() {
					isPaused = false;
					if (pauseResolve) {
						pauseResolve();
						pauseResolve = null;
					}
				},
				cancel() {},
			},
		});

		controllable.play();
		expect(controllable.playState).toBe("running");

		controllable.pause();
		expect(controllable.playState).toBe("paused");

		controllable.play(); // resume
		expect(controllable.playState).toBe("running");

		await controllable.finished;
		expect(controllable.playState).toBe("finished");
	});

	it("cancel resolves finished without error", async () => {
		const controllable = createControllable({
			runner: async (signal) => {
				await new Promise<void>((resolve) => {
					signal.addEventListener("abort", () => resolve());
				});
			},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		controllable.play();
		controllable.cancel();

		// finished should resolve, not reject
		await expect(controllable.finished).resolves.toBeUndefined();
		expect(controllable.playState).toBe("idle");
	});

	it("cancel while paused works", async () => {
		const controllable = createControllable({
			runner: async (signal) => {
				await new Promise<void>((resolve) => {
					signal.addEventListener("abort", () => resolve());
				});
			},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		controllable.play();
		controllable.pause();
		expect(controllable.playState).toBe("paused");

		controllable.cancel();
		await expect(controllable.finished).resolves.toBeUndefined();
		expect(controllable.playState).toBe("idle");
	});

	it("onStateChange fires on each state transition", () => {
		const states: string[] = [];
		const controllable = createControllable({
			runner: async () => {},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		controllable.onStateChange(() => {
			states.push(controllable.playState);
		});

		controllable.play();
		controllable.pause();
		controllable.cancel();

		expect(states).toContain("running");
		expect(states).toContain("paused");
		expect(states).toContain("idle");
	});

	it("onStepStart/onStepComplete callbacks are called when emitters fire", async () => {
		const stepStarts: number[] = [];
		const stepCompletes: number[] = [];

		const controllable = createControllable({
			runner: async (_signal, emitters) => {
				emitters.emitStepStart(0);
				emitters.emitStepComplete(0);
				emitters.emitStepStart(1);
				emitters.emitStepComplete(1);
			},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		controllable.onStepStart?.((index) => {
			stepStarts.push(index);
		});
		controllable.onStepComplete?.((index) => {
			stepCompletes.push(index);
		});

		controllable.play();
		await controllable.finished;

		expect(stepStarts).toEqual([0, 1]);
		expect(stepCompletes).toEqual([0, 1]);
	});

	it("currentStep and stepCount are readable when getStepState is provided", () => {
		let step = 0;
		const controllable = createControllable({
			runner: async () => {},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
			getStepState: () => ({ currentStep: step, stepCount: 3 }),
		});

		expect(controllable.currentStep).toBe(0);
		expect(controllable.stepCount).toBe(3);

		step = 2;
		expect(controllable.currentStep).toBe(2);
		expect(controllable.stepCount).toBe(3);
	});

	it("currentStep and stepCount are undefined when getStepState is not provided", () => {
		const controllable = createControllable({
			runner: async () => {},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		expect(controllable.currentStep).toBeUndefined();
		expect(controllable.stepCount).toBeUndefined();
	});

	it("unsubscribe functions work for all event callbacks", () => {
		const states: string[] = [];
		const controllable = createControllable({
			runner: async () => {},
			controls: {
				pause() {},
				resume() {},
				cancel() {},
			},
		});

		const unsub = controllable.onStateChange(() => {
			states.push(controllable.playState);
		});

		controllable.play();
		expect(states).toEqual(["running"]);

		unsub(); // unsubscribe
		controllable.cancel();
		expect(states).toEqual(["running"]); // no new entries after unsub
	});
});
