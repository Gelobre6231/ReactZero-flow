import { createControllable } from "./controllable.js";
import type { Controllable, RaceControllable, StepDefinition } from "./types.js";

function resolveStep(step: StepDefinition): Controllable {
	return typeof step === "function" ? step() : step;
}

export function race(...steps: StepDefinition[]): RaceControllable {
	let resolvedChildren: Controllable[] = [];
	let winnerIndex: number | undefined;
	let _playbackRate = 1;

	const controllable = createControllable({
		runner: async (_signal, emitters) => {
			resolvedChildren = steps.map(resolveStep);
			let settled = false;

			// Propagate playbackRate and start all children
			for (let i = 0; i < resolvedChildren.length; i++) {
				resolvedChildren[i].playbackRate = _playbackRate;
				emitters.emitStepStart(i);
				resolvedChildren[i].play();
			}

			// Race: first to finish wins
			await Promise.race(
				resolvedChildren.map((child, i) =>
					child.finished.then(() => {
						if (settled) return;
						settled = true;
						winnerIndex = i;
						emitters.emitStepComplete(i);
					}),
				),
			);

			// Cancel losers
			for (let i = 0; i < resolvedChildren.length; i++) {
				if (i !== winnerIndex) {
					resolvedChildren[i].cancel();
				}
			}
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
			currentStep: winnerIndex ?? 0,
			stepCount: steps.length,
		}),
	});

	// Extend with .winner property using defineProperty to preserve the getter
	Object.defineProperty(controllable, "winner", {
		get(): number | undefined {
			return winnerIndex;
		},
		enumerable: true,
		configurable: true,
	});

	return controllable as RaceControllable;
}
