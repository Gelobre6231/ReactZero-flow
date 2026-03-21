import { animate } from "./animate.js";
import type { AnimateOptions, Controllable, ReducedMotionPolicy } from "./types.js";

// Module-level state
let globalPolicy: ReducedMotionPolicy = "respect";
let reducePlaybackRate = 5;

/**
 * Set the global reduced motion policy.
 * This affects all new animations when the user's OS prefers reduced motion.
 */
export function setReducedMotionPolicy(
	policy: ReducedMotionPolicy,
	options?: { reduceRate?: number },
): void {
	globalPolicy = policy;
	if (options?.reduceRate != null) {
		reducePlaybackRate = options.reduceRate;
	}
}

/**
 * Get the current global reduced motion policy.
 */
export function getReducedMotionPolicy(): ReducedMotionPolicy {
	return globalPolicy;
}

/**
 * Get the current reduce playback rate multiplier.
 */
export function getReducePlaybackRate(): number {
	return reducePlaybackRate;
}

/**
 * Check if reduced motion should be applied.
 * Returns true when BOTH conditions are met:
 * 1. The user's OS setting is prefers-reduced-motion: reduce
 * 2. The developer has configured a policy other than 'respect'
 */
export function shouldApplyReducedMotion(): boolean {
	if (globalPolicy === "respect") return false;
	try {
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	} catch {
		// SSR or no window -- assume no reduced motion
		return false;
	}
}

/**
 * Strip all motion properties from keyframes, keeping only opacity.
 * If no opacity was in the original keyframes, generates a [0, 1] crossfade.
 */
export function crossfadeKeyframes(
	keyframes: Keyframe[] | PropertyIndexedKeyframes,
): Keyframe[] | PropertyIndexedKeyframes {
	// Handle PropertyIndexedKeyframes format (object with arrays)
	if (!Array.isArray(keyframes)) {
		const result: Record<string, unknown> = {};
		let hasOpacity = false;

		for (const key of Object.keys(keyframes)) {
			if (key === "offset" || key === "easing" || key === "composite") {
				// Preserve non-property keys
				result[key] = (keyframes as Record<string, unknown>)[key];
			} else if (key === "opacity") {
				result.opacity = (keyframes as Record<string, unknown>).opacity;
				hasOpacity = true;
			}
			// Strip all motion properties (don't copy them)
		}

		if (!hasOpacity) {
			result.opacity = ["0", "1"];
		}

		return result as PropertyIndexedKeyframes;
	}

	// Handle Keyframe[] format (array of objects)
	let hasOpacity = false;
	const result: Keyframe[] = keyframes.map((frame) => {
		const newFrame: Keyframe = {};
		for (const key of Object.keys(frame)) {
			if (key === "offset" || key === "easing" || key === "composite") {
				(newFrame as Record<string, unknown>)[key] = (frame as Record<string, unknown>)[key];
			} else if (key === "opacity") {
				newFrame.opacity = frame.opacity;
				hasOpacity = true;
			}
			// Strip motion properties
		}
		return newFrame;
	});

	if (!hasOpacity) {
		return [{ opacity: 0 }, { opacity: 1 }];
	}

	return result;
}

/**
 * Apply a reduced motion policy to an EXISTING controllable.
 * Note: 'crossfade' mode cannot be applied post-creation -- it logs a warning
 * and falls back to no-op. Crossfade must be applied at creation time via wrapWithPolicy().
 */
export function applyReducedMotion(controllable: Controllable, policy?: ReducedMotionPolicy): void {
	const effectivePolicy = policy ?? globalPolicy;

	switch (effectivePolicy) {
		case "skip":
			controllable.finish();
			break;
		case "reduce":
			controllable.playbackRate = reducePlaybackRate;
			break;
		case "crossfade":
			// Crossfade cannot be applied to an existing controllable -- keyframes are already set.
			// This is a no-op; for proper crossfade, use wrapWithPolicy() at animation creation time.
			if (typeof console !== "undefined") {
				// eslint-disable-next-line no-console
				console.warn(
					"applyReducedMotion: 'crossfade' mode must be applied at animation creation time via wrapWithPolicy(). Ignoring for existing controllable.",
				);
			}
			break;
		case "respect":
			// No-op
			break;
	}
}

/**
 * Wrap a step factory function with reduced motion policy awareness.
 * This is the KEY function that wires crossfade into the animation creation pipeline.
 *
 * When policy is 'crossfade' and reduced motion is active, the keyframes are
 * transformed via crossfadeKeyframes() BEFORE animate() is called, so the
 * WAAPI animation is created with opacity-only keyframes from the start.
 */
export function wrapWithPolicy(
	stepFn: () => Controllable,
	keyframes: Keyframe[] | PropertyIndexedKeyframes,
	options: AnimateOptions,
	element: Element,
): () => Controllable {
	return () => {
		if (!shouldApplyReducedMotion()) {
			return stepFn();
		}

		const policy = globalPolicy;

		switch (policy) {
			case "crossfade": {
				const transformedKeyframes = crossfadeKeyframes(keyframes);
				return animate(element, transformedKeyframes, options);
			}
			case "skip": {
				const ctrl = stepFn();
				ctrl.finish();
				return ctrl;
			}
			case "reduce": {
				const ctrl = stepFn();
				ctrl.playbackRate = reducePlaybackRate;
				return ctrl;
			}
			default:
				// 'respect' -- shouldn't reach here since shouldApplyReducedMotion returns false
				return stepFn();
		}
	};
}
