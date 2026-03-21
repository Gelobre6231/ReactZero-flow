import { createControllable } from "./controllable.js";
import { sequence } from "./sequence.js";
import type { Controllable, StepDefinition } from "./types.js";

export interface RepeatOptions {
	yoyo?: boolean;
	onRepeat?: (iteration: number) => void;
}

export function repeat(
	steps: StepDefinition | StepDefinition[],
	count: number,
	options?: RepeatOptions,
): Controllable {
	const stepsArray = Array.isArray(steps) ? steps : [steps];
	let activeChild: Controllable | null = null;
	let _playbackRate = 1;
	let iteration = 0;

	const controllable = createControllable({
		runner: async (signal, _emitters) => {
			for (iteration = 0; iteration < count; iteration++) {
				if (signal.aborted) return;

				// Determine step order: yoyo reverses on odd iterations
				const ordered =
					options?.yoyo && iteration % 2 === 1 ? [...stepsArray].reverse() : stepsArray;

				// Factory re-instantiation: create a fresh sequence each iteration
				// Previous iteration's sequence is already finished -- dereference for GC
				activeChild = null;

				const seq = sequence(...ordered);
				activeChild = seq;

				// Propagate current playbackRate before playing
				seq.playbackRate = _playbackRate;
				seq.play();
				await seq.finished;

				if (signal.aborted) return;

				// Notify after each iteration
				options?.onRepeat?.(iteration);
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
			currentStep: iteration,
			stepCount: count === Number.POSITIVE_INFINITY ? -1 : count,
		}),
	});

	return controllable;
}
