import { annotateAnimation } from "./annotations.js";
import { decomposeTransforms, validateDecomposePosition } from "./decompose.js";
import { getModerateSpeedUp, resolvePriorityAction } from "./priority.js";
import {
	extractAnimatedProperties,
	getCompositorProperties,
	warnLayoutProperties,
} from "./properties.js";
import type { AnimateOptions, Controllable, PlayState } from "./types.js";

export function animate(
	element: Element,
	keyframes: Keyframe[] | PropertyIndexedKeyframes,
	options?: AnimateOptions,
): Controllable {
	// Separate flow-specific options from WAAPI options
	const { willChange: willChangeOpt, __perf, priority, decompose, ...wapiOptions } = options ?? {};

	// v2.0: Smart Transform Decomposition (opt-in, BEFORE WAAPI — can't change keyframes after)
	let resolvedKeyframes = keyframes;
	if (decompose) {
		validateDecomposePosition(element);
		resolvedKeyframes = decomposeTransforms(keyframes, element);
	}

	// Create WAAPI animation with fill:'forwards' for commitStyles compatibility
	const animation = element.animate(resolvedKeyframes, {
		...wapiOptions,
		fill: "forwards",
	});

	// Property analysis for performance features (use resolved keyframes post-decompose)
	const properties = extractAnimatedProperties(resolvedKeyframes);

	// Dev-only warning for layout-triggering properties (tree-shakes in production)
	warnLayoutProperties(properties);

	// Automatic will-change lifecycle for compositor properties
	const compositorProps = getCompositorProperties(properties);
	const hasWillChange =
		compositorProps.length > 0 && willChangeOpt !== false;
	if (hasWillChange) {
		(element as HTMLElement).style.willChange = compositorProps.join(", ");
	}

	// Do NOT auto-play -- Controllable.play() triggers it
	animation.pause();

	// Event callback sets
	const stateChangeCallbacks = new Set<() => void>();

	function notifyStateChange(): void {
		for (const cb of stateChangeCallbacks) {
			cb();
		}
	}

	// Map WAAPI playState to our PlayState
	function getPlayState(): PlayState {
		switch (animation.playState) {
			case "running":
				return "running";
			case "paused":
				return "paused";
			case "finished":
				return "finished";
			default:
				return "idle";
		}
	}

	// Set up commitStyles + cancel on successful finish
	// This .then() only runs when animation finishes normally (not on cancel).
	// When cancelled, WAAPI rejects the finished promise, so .then() is skipped.
	animation.finished.then(
		() => {
			animation.commitStyles();
			animation.cancel();
			if (hasWillChange) {
				(element as HTMLElement).style.willChange = "auto";
			}
		},
		() => {
			// Ignore AbortError rejection from cancel -- this is expected WAAPI behavior
		},
	);

	const controllable: Controllable = {
		play(): void {
			animation.play();
			notifyStateChange();
		},

		pause(): void {
			animation.pause();
			notifyStateChange();
		},

		cancel(): void {
			animation.cancel();
			if (hasWillChange) {
				(element as HTMLElement).style.willChange = "auto";
			}
			notifyStateChange();
		},

		finish(): void {
			animation.finish();
			notifyStateChange();
		},

		get finished(): Promise<void> {
			// WRAP (not proxy) animation.finished to always resolve.
			// Re-create wrapper each access since WAAPI re-creates the promise on replay.
			return animation.finished.then(
				() => {},
				() => {},
			);
		},

		get playState(): PlayState {
			return getPlayState();
		},

		onStateChange(callback: () => void): () => void {
			stateChangeCallbacks.add(callback);
			return () => {
				stateChangeCallbacks.delete(callback);
			};
		},

		// ANI-13: playbackRate passthrough to WAAPI Animation
		get playbackRate(): number {
			return animation.playbackRate;
		},

		set playbackRate(rate: number) {
			animation.playbackRate = rate;
		},

		// Leaf Controllable -- no steps
		get currentStep(): undefined {
			return undefined;
		},

		get stepCount(): undefined {
			return undefined;
		},
	};

	// Internal escape hatch for timeline seeking -- sets WAAPI currentTime directly
	Object.defineProperty(controllable, "_seekTo", {
		value: (ms: number) => {
			animation.currentTime = ms;
		},
		enumerable: false,
	});

	// v2.0: Priority-based degradation
	if (priority) {
		const action = resolvePriorityAction(priority);
		if (action === "skip") controllable.finish();
		else if (action === "reduce")
			controllable.playbackRate = getModerateSpeedUp();
	}

	// Performance annotations (opt-in)
	annotateAnimation(element, properties, wapiOptions.duration, controllable, __perf);

	return controllable;
}
