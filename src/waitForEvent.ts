import type { Controllable, PlayState } from "./types.js";

export interface WaitForEventOptions {
	/** Optional filter function -- event only resolves step if filter returns true */
	filter?: (e: Event) => boolean;
}

/**
 * Event step: resolves when the target dispatches the specified event.
 * Returns a leaf Controllable (like delay -- manual state management).
 *
 * Pause gate pattern: if the event fires during pause, stores `eventReceived = true`
 * and resolves on the next play() call (resume).
 */
export function waitForEvent(
	target: EventTarget,
	eventName: string,
	options?: WaitForEventOptions,
): Controllable {
	let playState: PlayState = "idle";
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((r) => {
		finishedResolve = r;
	});
	let listenerAC: AbortController | null = null;
	let eventReceived = false;
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

	const controllable: Controllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				// Reset for fresh play
				finishedPromise = new Promise<void>((r) => {
					finishedResolve = r;
				});
				eventReceived = false;
				setState("running");
				listenerAC = new AbortController();
				target.addEventListener(
					eventName,
					(e: Event) => {
						if (options?.filter && !options.filter(e)) return;
						eventReceived = true;
						if (playState === "running") {
							setState("finished");
							finishedResolve();
						}
						// If paused, eventReceived flag will trigger resolve on resume
					},
					{ signal: listenerAC.signal, once: true },
				);
			} else if (playState === "paused") {
				setState("running");
				// If event fired during pause, resolve immediately
				if (eventReceived) {
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
			listenerAC?.abort();
			listenerAC = null;
			if (playState !== "idle") {
				setState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			listenerAC?.abort();
			listenerAC = null;
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

		// playbackRate stored for interface conformance -- no effect on event timing
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
