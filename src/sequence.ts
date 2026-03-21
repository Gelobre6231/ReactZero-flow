import { createControllable } from "./controllable.js";
import type { Controllable, StepDefinition } from "./types.js";

function resolveStep(step: StepDefinition): Controllable {
	return typeof step === "function" ? step() : step;
}

export function sequence(...steps: StepDefinition[]): Controllable {
	let currentStepIndex = 0;
	let activeChild: Controllable | null = null;
	let _playbackRate = 1;

	const controllable = createControllable({
		runner: async (signal, emitters) => {
			for (let i = 0; i < steps.length; i++) {
				if (signal.aborted) return;

				currentStepIndex = i;
				const child = resolveStep(steps[i]);
				activeChild = child;

				// Propagate current playbackRate to new child before playing
				child.playbackRate = _playbackRate;

				emitters.emitStepStart(i);
				child.play();
				await child.finished;

				if (signal.aborted) return;
				emitters.emitStepComplete(i);
			}
			activeChild = null;
		},
		controls: {
			pause(): void {
				activeChild?.pause();
			},
			resume(): void {
				activeChild?.play();
			},
			cancel(): void {
				activeChild?.cancel();
				activeChild = null;
			},
			setPlaybackRate(rate: number): void {
				_playbackRate = rate;
				if (activeChild) {
					activeChild.playbackRate = rate;
				}
			},
		},
		getStepState: () => ({
			currentStep: currentStepIndex,
			stepCount: steps.length,
		}),
	});

	return controllable;
}
