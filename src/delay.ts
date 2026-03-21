import type { Controllable, PlayState } from "./types.js";

export function delay(ms: number): Controllable {
	let playState: PlayState = "idle";
	let remaining = ms;
	let startTime = 0;
	let timerId: ReturnType<typeof setTimeout> | null = null;
	let _playbackRate = 1;

	// Deferred for finished promise
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((resolve) => {
		finishedResolve = resolve;
	});

	const stateChangeCallbacks = new Set<() => void>();

	function notifyStateChange(): void {
		for (const cb of stateChangeCallbacks) {
			cb();
		}
	}

	function setPlayState(newState: PlayState): void {
		if (playState === newState) return;
		playState = newState;
		notifyStateChange();
	}

	function clearTimer(): void {
		if (timerId !== null) {
			clearTimeout(timerId);
			timerId = null;
		}
	}

	function onTimerComplete(): void {
		timerId = null;
		remaining = 0;
		setPlayState("finished");
		finishedResolve();
	}

	function startTimer(): void {
		startTime = Date.now();
		if (remaining <= 0) {
			// delay(0) or remaining exhausted: resolve on next microtask
			timerId = setTimeout(onTimerComplete, 0);
		} else {
			// Scale remaining time by playbackRate
			timerId = setTimeout(onTimerComplete, remaining / _playbackRate);
		}
	}

	const controllable: Controllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				// Reset for fresh play
				remaining = ms;
				finishedPromise = new Promise<void>((resolve) => {
					finishedResolve = resolve;
				});
				setPlayState("running");
				startTimer();
			} else if (playState === "paused") {
				setPlayState("running");
				startTimer();
			}
		},

		pause(): void {
			if (playState === "running") {
				clearTimer();
				// elapsed wall-clock time, scaled by playbackRate to get logical elapsed
				const elapsed = (Date.now() - startTime) * _playbackRate;
				remaining = Math.max(0, remaining - elapsed);
				setPlayState("paused");
			}
		},

		cancel(): void {
			clearTimer();
			if (playState !== "idle") {
				setPlayState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			clearTimer();
			remaining = 0;
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

		// ANI-13: playbackRate scales timer duration
		get playbackRate(): number {
			return _playbackRate;
		},

		set playbackRate(rate: number) {
			// Negative or zero playbackRate is meaningless for delay -- ignore
			if (rate <= 0) return;
			if (rate === _playbackRate) return;

			if (playState === "running") {
				// Recalculate remaining based on elapsed wall-clock time
				clearTimer();
				const elapsed = (Date.now() - startTime) * _playbackRate;
				remaining = Math.max(0, remaining - elapsed);
				_playbackRate = rate;
				startTimer();
			} else {
				_playbackRate = rate;
			}
		},

		// Leaf Controllable -- no steps
		get currentStep(): undefined {
			return undefined;
		},

		get stepCount(): undefined {
			return undefined;
		},
	};

	return controllable;
}
