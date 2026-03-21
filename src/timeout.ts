import { createControllable } from "./controllable.js";
import { sequence } from "./sequence.js";
import type { StepDefinition, TimeoutControllable } from "./types.js";

export function timeout(steps: StepDefinition[], ms: number): TimeoutControllable {
	let inner: ReturnType<typeof sequence> | null = null;
	let didTimeout: boolean | undefined;
	let _playbackRate = 1;

	// Deadline timer state
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let deadlineRemaining = ms;
	let deadlineStartedAt = 0;

	let deadlineResolve: (() => void) | null = null;

	function startDeadlineTimer(): Promise<void> {
		return new Promise<void>((resolve) => {
			deadlineResolve = resolve;
			const effectiveMs = _playbackRate > 0 ? deadlineRemaining / _playbackRate : deadlineRemaining;
			deadlineStartedAt = Date.now();
			timeoutId = setTimeout(() => {
				timeoutId = null;
				resolve();
			}, effectiveMs);
		});
	}

	function clearDeadlineTimer(): void {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function pauseDeadlineTimer(): void {
		if (timeoutId !== null) {
			const elapsed = Date.now() - deadlineStartedAt;
			const effectiveElapsed = elapsed * _playbackRate;
			deadlineRemaining = Math.max(0, deadlineRemaining - effectiveElapsed);
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	function resumeDeadlineTimer(): void {
		if (deadlineRemaining > 0 && deadlineResolve) {
			const effectiveMs = _playbackRate > 0 ? deadlineRemaining / _playbackRate : deadlineRemaining;
			deadlineStartedAt = Date.now();
			timeoutId = setTimeout(() => {
				timeoutId = null;
				deadlineResolve?.();
			}, effectiveMs);
		}
	}

	const controllable = createControllable({
		runner: async (signal, _emitters) => {
			// Reset state for this run
			didTimeout = undefined;
			deadlineRemaining = ms;

			inner = sequence(...steps);
			inner.playbackRate = _playbackRate;
			inner.play();

			// Race inner completion against deadline
			const deadlinePromise = startDeadlineTimer();
			let innerCompleted = false;

			const innerDone = inner.finished.then(() => {
				innerCompleted = true;
			});

			await Promise.race([innerDone, deadlinePromise]);

			if (signal.aborted) return;

			if (innerCompleted) {
				// Inner finished before deadline
				clearDeadlineTimer();
				didTimeout = false;
			} else {
				// Deadline fired first
				didTimeout = true;
				inner.cancel();
			}
		},
		controls: {
			pause(): void {
				pauseDeadlineTimer();
				inner?.pause();
			},
			resume(): void {
				inner?.play();
				resumeDeadlineTimer();
			},
			cancel(): void {
				clearDeadlineTimer();
				inner?.cancel();
				inner = null;
			},
			setPlaybackRate(rate: number): void {
				// Recalculate deadline with new rate
				const wasRunning = timeoutId !== null;
				if (wasRunning) {
					pauseDeadlineTimer();
				}
				_playbackRate = rate;
				if (inner) {
					inner.playbackRate = rate;
				}
				if (wasRunning) {
					resumeDeadlineTimer();
				}
			},
		},
	});

	// Extend with .timedOut property using defineProperty to preserve the getter
	Object.defineProperty(controllable, "timedOut", {
		get(): boolean | undefined {
			return didTimeout;
		},
		enumerable: true,
		configurable: true,
	});

	return controllable as TimeoutControllable;
}
