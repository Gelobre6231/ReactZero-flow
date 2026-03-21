import type { Controllable, PlayState } from "./types.js";

/**
 * Intersection step: resolves when the element enters the viewport.
 * Returns a leaf Controllable (like delay -- manual state management).
 *
 * Pause gate pattern: if intersection happens during pause, stores `intersected = true`
 * and resolves on the next play() call (resume).
 */
export function waitForIntersection(
	element: Element,
	options?: IntersectionObserverInit,
): Controllable {
	let playState: PlayState = "idle";
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((r) => {
		finishedResolve = r;
	});
	let observer: IntersectionObserver | null = null;
	let intersected = false;
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

	function cleanup(): void {
		if (observer) {
			observer.disconnect();
			observer = null;
		}
	}

	const controllable: Controllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				// Reset for fresh play
				finishedPromise = new Promise<void>((r) => {
					finishedResolve = r;
				});
				intersected = false;
				setState("running");
				observer = new IntersectionObserver((entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							cleanup();
							intersected = true;
							if (playState === "running") {
								setState("finished");
								finishedResolve();
							}
							// If paused, intersected flag will trigger resolve on resume
							break;
						}
					}
				}, options);
				observer.observe(element);
			} else if (playState === "paused") {
				setState("running");
				// If intersection happened during pause, resolve immediately
				if (intersected) {
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
			cleanup();
			if (playState !== "idle") {
				setState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			cleanup();
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

		// playbackRate stored for interface conformance -- no effect on intersection timing
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
