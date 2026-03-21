import type { EaseFn } from "./easing.js";
import type { Controllable, PlayState, StepDefinition, TimelinePositionOptions } from "./types.js";

/** A single entry in the timeline's flat sorted array */
interface TimelineEntry {
	step: StepDefinition;
	resolved?: Controllable;
	startMs: number;
	endMs: number;
	label?: string;
}

/** Extended Controllable with seeking capabilities */
export interface TimelineControllable extends Controllable {
	readonly currentTime: number;
	readonly duration: number;
	seek(timeMs: number): void;
	progress(normalized: number): void;
	seekTo(label: string): void;
}

/** Position options for timeline.add() -- duration is required */
export interface TimelineAddOptions extends TimelinePositionOptions {
	duration: number;
}

/** Builder interface returned by timeline() */
export interface TimelineBuilder {
	add(step: StepDefinition, position?: TimelineAddOptions): TimelineBuilder;
	label(name: string, position?: number): TimelineBuilder;
	build(): TimelineControllable;
}

/**
 * Resolve absolute start position from position options.
 */
function resolvePosition(
	options: TimelineAddOptions | undefined,
	labels: Map<string, number>,
	cursor: number,
): number {
	if (!options) return cursor;

	if (options.at != null) {
		return options.at;
	}

	if (options.after != null) {
		const labelMs = labels.get(options.after);
		if (labelMs == null) {
			throw new Error(
				`Timeline label "${options.after}" not found. Define it with .label() before referencing it.`,
			);
		}
		return labelMs + (options.offset ?? 0);
	}

	return cursor;
}

/**
 * Resolve a step definition to a Controllable instance.
 */
function resolveStep(step: StepDefinition): Controllable {
	return typeof step === "function" ? step() : step;
}

/**
 * Seek a child to a specific time using the internal _seekTo method if available,
 * or falling back to direct currentTime manipulation on delay controllables.
 */
function seekChild(child: Controllable, ms: number): void {
	// _seekTo is a non-enumerable internal method
	const seekFn = (child as any)._seekTo;
	if (typeof seekFn === "function") {
		(seekFn as (ms: number) => void)(ms);
	}
	// For non-animate children (delay, etc.), seeking is a no-op --
	// timeline only seeks animate() children via _seekTo
}

/**
 * Create the seekable timeline Controllable.
 */
function createTimelineControllable(
	entries: TimelineEntry[],
	labels: Map<string, number>,
	totalDuration: number,
	options?: { playbackRate?: number; easing?: EaseFn },
): TimelineControllable {
	let playState: PlayState = "idle";
	let _currentTime = 0;
	let _rawElapsed = 0; // linear elapsed time (before easing)
	let _playbackRate = options?.playbackRate ?? 1;
	const _easing = options?.easing;
	let rafId: number | null = null;
	let lastTimestamp = 0;
	let resolved = false;

	// Deferred for finished promise
	let finishedResolve: () => void;
	let finishedPromise = new Promise<void>((resolve) => {
		finishedResolve = resolve;
	});

	// State change callbacks
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

	/**
	 * Resolve all lazy step factories and initialize children.
	 * Children are played then immediately paused so WAAPI has an active animation
	 * that can accept currentTime manipulation via _seekTo.
	 */
	function resolveAllEntries(): void {
		if (resolved) return;
		for (const entry of entries) {
			if (!entry.resolved) {
				entry.resolved = resolveStep(entry.step);
				// Initialize: play then immediately pause to create the WAAPI animation
				entry.resolved.play();
				entry.resolved.pause();
			}
		}
		resolved = true;
	}

	/**
	 * Position all children based on the current playhead time.
	 */
	function seekToTime(timeMs: number): void {
		for (const entry of entries) {
			if (!entry.resolved) continue;

			if (timeMs < entry.startMs) {
				// Before this entry: position child at its start
				seekChild(entry.resolved, 0);
			} else if (timeMs >= entry.endMs) {
				// Past this entry: position child at its end
				seekChild(entry.resolved, entry.endMs - entry.startMs);
			} else {
				// Within this entry: position at relative offset
				seekChild(entry.resolved, timeMs - entry.startMs);
			}
		}
	}

	/**
	 * Finalize all children -- commit styles for animate() children.
	 */
	function finalizeChildren(): void {
		for (const entry of entries) {
			if (entry.resolved) {
				try {
					entry.resolved.finish();
				} catch {
					// finish must not throw
				}
			}
		}
	}

	/**
	 * Cancel/cleanup all children.
	 */
	function cancelChildren(): void {
		for (const entry of entries) {
			if (entry.resolved) {
				try {
					entry.resolved.cancel();
				} catch {
					// cancel must not throw
				}
			}
		}
	}

	function cancelRaf(): void {
		if (rafId != null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function resetFinishedPromise(): void {
		finishedPromise = new Promise<void>((resolve) => {
			finishedResolve = resolve;
		});
	}

	/**
	 * The rAF-driven playback tick.
	 */
	/**
	 * Apply easing to convert raw elapsed time to eased currentTime.
	 */
	function applyEasing(rawMs: number): number {
		if (!_easing || totalDuration === 0) return rawMs;
		const rawProgress = Math.max(0, Math.min(rawMs / totalDuration, 1));
		return _easing(rawProgress) * totalDuration;
	}

	function tick(now: number): void {
		if (playState !== "running") return;

		const delta = (now - lastTimestamp) * _playbackRate;
		lastTimestamp = now;
		_rawElapsed += delta;

		// Check for completion (forward playback)
		if (_rawElapsed >= totalDuration) {
			_rawElapsed = totalDuration;
			_currentTime = totalDuration;
			seekToTime(_currentTime);
			cancelRaf();
			setPlayState("finished");
			finishedResolve();
			return;
		}

		// Check for completion (negative playbackRate -- reverse playback)
		if (_rawElapsed <= 0) {
			_rawElapsed = 0;
			_currentTime = 0;
			seekToTime(0);
			cancelRaf();
			setPlayState("finished");
			finishedResolve();
			return;
		}

		_currentTime = applyEasing(_rawElapsed);
		seekToTime(_currentTime);
		rafId = requestAnimationFrame(tick);
	}

	const controllable: TimelineControllable = {
		play(): void {
			if (playState === "idle" || playState === "finished") {
				resolveAllEntries();
				// Reset from start on fresh play
				if (playState === "idle" || playState === "finished") {
					_rawElapsed = _playbackRate >= 0 ? 0 : totalDuration;
					_currentTime = _playbackRate >= 0 ? 0 : totalDuration;
				}
				resetFinishedPromise();
				setPlayState("running");
				lastTimestamp = performance.now();
				rafId = requestAnimationFrame(tick);
			} else if (playState === "paused") {
				setPlayState("running");
				lastTimestamp = performance.now();
				rafId = requestAnimationFrame(tick);
			}
		},

		pause(): void {
			if (playState === "running") {
				cancelRaf();
				setPlayState("paused");
			}
		},

		cancel(): void {
			cancelRaf();
			cancelChildren();
			if (playState !== "idle") {
				_currentTime = 0;
				_rawElapsed = 0;
				resolved = false;
				setPlayState("idle");
				finishedResolve();
			}
		},

		finish(): void {
			cancelRaf();
			if (playState !== "finished") {
				resolveAllEntries();
				_currentTime = totalDuration;
				seekToTime(totalDuration);
				finalizeChildren();
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

		// Timeline currentTime -- read-only externally, set via seek()
		get currentTime(): number {
			return _currentTime;
		},

		get duration(): number {
			return totalDuration;
		},

		/**
		 * Seek to an absolute time position. Works in any state (idle, paused, running).
		 * This is the primary scrubbing API.
		 */
		seek(timeMs: number): void {
			resolveAllEntries();
			_currentTime = Math.max(0, Math.min(timeMs, totalDuration));
			seekToTime(_currentTime);
		},

		/**
		 * Seek to a normalized position (0-1).
		 */
		progress(normalized: number): void {
			const easedMs = _easing
				? _easing(Math.max(0, Math.min(normalized, 1))) * totalDuration
				: normalized * totalDuration;
			this.seek(easedMs);
		},

		/**
		 * Seek to a named label position.
		 */
		seekTo(label: string): void {
			const labelMs = labels.get(label);
			if (labelMs == null) {
				throw new Error(
					`Timeline label "${label}" not found. Available labels: ${[...labels.keys()].join(", ") || "none"}`,
				);
			}
			this.seek(labelMs);
		},

		// playbackRate -- affects rAF delta calculation
		get playbackRate(): number {
			return _playbackRate;
		},

		set playbackRate(rate: number) {
			_playbackRate = rate;
			// If currently playing, next tick automatically uses new rate
		},

		// Timeline is not a compound step in the sequence sense
		get currentStep(): undefined {
			return undefined;
		},

		get stepCount(): undefined {
			return undefined;
		},
	};

	return controllable;
}

/**
 * Create a timeline builder for precise time-based choreography with seeking.
 *
 * Timeline is a SEPARATE primitive from sequence:
 * - sequence() = async/await chain, supports event steps, no seeking
 * - timeline() = time-driven, seekable, rAF playback, no event steps
 *
 * @example
 * const tl = timeline()
 *   .add(() => animate(el1, keyframes1), { duration: 300 })
 *   .add(() => animate(el2, keyframes2), { at: 200, duration: 500 })
 *   .label('midpoint')
 *   .add(() => animate(el3, keyframes3), { after: 'midpoint', offset: 100, duration: 200 })
 *   .build();
 *
 * tl.play();          // rAF-driven playback
 * tl.seek(500);       // scrub to 500ms
 * tl.progress(0.5);   // scrub to 50%
 * tl.seekTo('midpoint'); // jump to label
 */
export function timeline(options?: { playbackRate?: number; easing?: EaseFn }): TimelineBuilder {
	const entries: TimelineEntry[] = [];
	const labels = new Map<string, number>();
	let cursor = 0;

	const builder = {
		/**
		 * Add a step to the timeline at a specified position.
		 * Duration must be provided explicitly.
		 */
		add(step: StepDefinition, position?: TimelineAddOptions) {
			if (!position?.duration) {
				throw new Error(
					"Timeline entries must specify duration explicitly. Use { duration: ms } in position options.",
				);
			}
			const startMs = resolvePosition(position, labels, cursor);
			const duration = position.duration;
			const endMs = startMs + duration;
			entries.push({ step, startMs, endMs });
			cursor = endMs;
			return builder;
		},

		/**
		 * Create a named position in the timeline for seekTo() references.
		 */
		label(name: string, position?: number) {
			labels.set(name, position ?? cursor);
			return builder;
		},

		/**
		 * Build the timeline and return a seekable Controllable.
		 */
		build(): TimelineControllable {
			// Sort entries by start time for consistent iteration
			entries.sort((a, b) => a.startMs - b.startMs);
			const totalDuration = entries.length > 0 ? Math.max(...entries.map((e) => e.endMs)) : 0;
			return createTimelineControllable(entries, labels, totalDuration, options);
		},
	};

	return builder;
}
