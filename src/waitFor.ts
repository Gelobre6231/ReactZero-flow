import type { Controllable, PlayState } from "./types.js";

/**
 * Promise step: wraps an arbitrary Promise (or factory) as a Controllable.
 * Returns a leaf Controllable (like delay -- manual state management).
 *
 * If argument is a function, calls it on play() to get the promise (lazy).
 * If argument is a direct Promise, uses it immediately.
 *
 * Pause gate pattern: if the promise resolves during pause, stores `completed = true`
 * and resolves on the next play() call (resume).
 *
 * Note: cancel() cannot actually cancel the user's promise -- it just stops waiting for it.
 */
export function waitFor(promiseOrFactory: Promise<void> | (() => Promise<void>)): Controllable {
	let playState: PlayState = "idle";
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((r) => {
		finishedResolve = r;
	});
	let abortController: AbortController | null = null;
	let completed = false;
	let _playbackRate = 1;

	const stateCallbacks = new Set<() => void>();

	function notify(): void {
		for (const cb of stateCallbacks) {
			cb();
		}
	}

	function setState(s: PlayState): void {
		if (playState !== s) {
			playState = s;
			notify();
		}
	}

	function startWaiting(): void {
		abortController = new AbortController();
		const signal = abortController.signal;

		// Get the promise (call factory if function, use directly if promise)
		const userPromise =
			typeof promiseOrFactory === "function" ? promiseOrFactory() : promiseOrFactory;

		// Race user promise against abort
		const abortPromise = new Promise<"aborted">((resolve) => {
			signal.addEventListener("abort", () => resolve("aborted"), {
				once: true,
			});
		});

		Promise.race([userPromise.then(() => "completed" as const), abortPromise]).then((result) => {
			if (result === "aborted") return;

			completed = true;
			if (playState === "running") {
				setState("finished");
				finishedResolve();
			}
			// If paused, completed flag will trigger resolve on resume
		});
	}

	const controllable: Controllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				// Reset for fresh play
				finishedPromise = new Promise<void>((r) => {
					finishedResolve = r;
				});
				completed = false;
				setState("running");
				startWaiting();
			} else if (playState === "paused") {
				setState("running");
				// If promise resolved during pause, resolve immediately
				if (completed) {
					setState("finished");
					finishedResolve();
				}
			}
		},

		pause(): void {
			if (playState === "running") {
				setState("paused");
			}
		},

		cancel(): void {
			abortController?.abort();
			abortController = null;
			if (playState !== "idle") {
				setState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			abortController?.abort();
			abortController = null;
			if (playState !== "finished") {
				setState("finished");
				finishedResolve();
			}
		},

		get finished(): Promise<void> {
			return finishedPromise;
		},

		get playState(): PlayState {
			return playState;
		},

		// playbackRate stored for interface conformance -- no effect on promise timing
		get playbackRate(): number {
			return _playbackRate;
		},

		set playbackRate(rate: number) {
			_playbackRate = rate;
		},

		onStateChange(cb: () => void): () => void {
			stateCallbacks.add(cb);
			return () => {
				stateCallbacks.delete(cb);
			};
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
