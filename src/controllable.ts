import type { Controllable, PlayState } from "./types.js";

interface StepEmitters {
	emitStepStart(index: number): void;
	emitStepComplete(index: number): void;
}

export interface CreateControllableOptions {
	runner: (signal: AbortSignal, emitters: StepEmitters) => Promise<void>;
	controls: {
		pause(): void;
		resume(): void;
		cancel(): void;
		setPlaybackRate?(rate: number): void;
	};
	getStepState?: () => { currentStep: number; stepCount: number };
}

export function createControllable(options: CreateControllableOptions): Controllable {
	const { runner, controls, getStepState } = options;

	let playState: PlayState = "idle";
	let abortController = new AbortController();
	let _playbackRate = 1;

	// Deferred for finished promise
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((resolve) => {
		finishedResolve = resolve;
	});

	// Event callback sets
	const stateChangeCallbacks = new Set<() => void>();
	const stepStartCallbacks = new Set<(index: number) => void>();
	const stepCompleteCallbacks = new Set<(index: number) => void>();

	function setPlayState(newState: PlayState): void {
		if (playState === newState) return;
		playState = newState;
		for (const cb of stateChangeCallbacks) {
			cb();
		}
	}

	const emitters: StepEmitters = {
		emitStepStart(index: number): void {
			for (const cb of stepStartCallbacks) {
				cb(index);
			}
		},
		emitStepComplete(index: number): void {
			for (const cb of stepCompleteCallbacks) {
				cb(index);
			}
		},
	};

	function startRunner(): void {
		runner(abortController.signal, emitters).then(
			() => {
				if (playState !== "idle") {
					setPlayState("finished");
					finishedResolve();
				}
			},
			() => {
				// Runner rejected (e.g. from abort). Resolve finished cleanly.
				if (playState !== "idle" && playState !== "finished") {
					setPlayState("idle");
					finishedResolve();
				}
			},
		);
	}

	const controllable: Controllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				// Reset abort controller for fresh run
				abortController = new AbortController();
				// Reset finished promise
				finishedPromise = new Promise<void>((resolve) => {
					finishedResolve = resolve;
				});
				setPlayState("running");
				startRunner();
			} else if (playState === "paused") {
				setPlayState("running");
				controls.resume();
			}
		},

		pause(): void {
			if (playState === "running") {
				setPlayState("paused");
				controls.pause();
			}
		},

		cancel(): void {
			try {
				abortController.abort();
				controls.cancel();
			} catch {
				// cancel() must never throw
			}
			if (playState !== "idle") {
				setPlayState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			try {
				abortController.abort();
				controls.cancel();
			} catch {
				// finish must not throw
			}
			if (playState !== "finished") {
				setPlayState("finished");
				finishedResolve();
			}
		},

		get finished(): Promise<void> {
			return finishedPromise;
		},

		get playState(): PlayState {
			return playState;
		},

		onStateChange(callback: () => void): () => void {
			stateChangeCallbacks.add(callback);
			return () => {
				stateChangeCallbacks.delete(callback);
			};
		},

		onStepStart(callback: (index: number) => void): () => void {
			stepStartCallbacks.add(callback);
			return () => {
				stepStartCallbacks.delete(callback);
			};
		},

		onStepComplete(callback: (index: number) => void): () => void {
			stepCompleteCallbacks.add(callback);
			return () => {
				stepCompleteCallbacks.delete(callback);
			};
		},

		// ANI-13: playbackRate propagation for compound Controllables
		get playbackRate(): number {
			return _playbackRate;
		},

		set playbackRate(rate: number) {
			_playbackRate = rate;
			controls.setPlaybackRate?.(rate);
		},

		get currentStep(): number | undefined {
			return getStepState?.().currentStep;
		},

		get stepCount(): number | undefined {
			return getStepState?.().stepCount;
		},
	};

	return controllable;
}
