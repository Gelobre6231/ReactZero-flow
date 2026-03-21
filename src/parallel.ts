import { createControllable } from "./controllable.js";
import type { Controllable, StepDefinition } from "./types.js";

function resolveStep(step: StepDefinition): Controllable {
	return typeof step === "function" ? step() : step;
}

export function parallel(...steps: StepDefinition[]): Controllable {
	let resolvedChildren: Controllable[] = [];
	let completedCount = 0;
	let _playbackRate = 1;

	const controllable = createControllable({
		runner: async (_signal, emitters) => {
			resolvedChildren = steps.map(resolveStep);
			completedCount = 0;

			// Track individual step completions
			const completionPromises = resolvedChildren.map((child, i) => {
				// Propagate current playbackRate before playing
				child.playbackRate = _playbackRate;
				emitters.emitStepStart(i);
				child.play();
				return child.finished.then(() => {
					completedCount++;
					emitters.emitStepComplete(i);
				});
			});

			await Promise.all(completionPromises);
		},
		controls: {
			pause(): void {
				for (const child of resolvedChildren) {
					child.pause();
				}
			},
			resume(): void {
				for (const child of resolvedChildren) {
					child.play();
				}
			},
			cancel(): void {
				for (const child of resolvedChildren) {
					child.cancel();
				}
				resolvedChildren = [];
			},
			setPlaybackRate(rate: number): void {
				_playbackRate = rate;
				for (const child of resolvedChildren) {
					child.playbackRate = rate;
				}
			},
		},
		getStepState: () => ({
			currentStep: completedCount,
			stepCount: steps.length,
		}),
	});

	return controllable;
}
