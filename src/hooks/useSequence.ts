import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
	getReducedMotionPolicy,
	getReducePlaybackRate,
	shouldApplyReducedMotion,
} from "../reducedMotion.js";
import { sequence } from "../sequence.js";
import type { Controllable, PlayState, ReducedMotionPolicy, StepDefinition } from "../types.js";
import { useReducedMotion } from "./useReducedMotion.js";

export interface UseSequenceOptions {
	autoPlay?: boolean;
	reducedMotion?: ReducedMotionPolicy;
}

export interface UseSequenceReturn {
	play(): void;
	pause(): void;
	cancel(): void;
	state: PlayState;
}

/**
 * Resolve the effective reduced motion policy.
 * Per-sequence option takes priority, then global policy.
 */
function resolvePolicy(
	prefersReducedMotion: boolean,
	localOverride?: ReducedMotionPolicy,
): ReducedMotionPolicy | null {
	// Must have OS-level preference for any policy to apply
	if (!prefersReducedMotion) return null;

	// Local override takes priority over global
	if (localOverride != null) {
		return localOverride === "respect" ? null : localOverride;
	}

	// Fall back to global policy check
	if (shouldApplyReducedMotion()) {
		return getReducedMotionPolicy();
	}

	return null;
}

/**
 * Apply the resolved policy to a controllable.
 * For sequences, crossfade falls back to skip (sequences don't have access to individual keyframes).
 */
function applyPolicyToControllable(controllable: Controllable, policy: ReducedMotionPolicy): void {
	switch (policy) {
		case "skip":
			controllable.finish();
			break;
		case "reduce":
			controllable.playbackRate = getReducePlaybackRate();
			controllable.play();
			break;
		case "crossfade":
			// Sequences don't have access to individual step keyframes.
			// Fall back to skip behavior. For proper crossfade, users should
			// use wrapWithPolicy() on their animate() calls within step definitions.
			controllable.finish();
			break;
		case "respect":
			controllable.play();
			break;
	}
}

export function useSequence(
	steps: StepDefinition[],
	options?: UseSequenceOptions,
): UseSequenceReturn {
	const controllableRef = useRef<Controllable | null>(null);
	const prefersReducedMotion = useReducedMotion();

	// Store reduced motion state in a ref so stable callbacks can read the latest value
	const reducedMotionRef = useRef<ReducedMotionPolicy | null>(null);
	reducedMotionRef.current = resolvePolicy(prefersReducedMotion, options?.reducedMotion);

	// Build the sequence in useEffect (not during render).
	// Intentionally empty deps: steps and autoPlay are captured at mount time only.
	useEffect(() => {
		const seq = sequence(...steps);
		controllableRef.current = seq;

		if (options?.autoPlay) {
			const policy = reducedMotionRef.current;
			if (policy) {
				applyPolicyToControllable(seq, policy);
			} else {
				seq.play();
			}
		}

		return () => {
			seq.cancel(); // Full cleanup
			controllableRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Expose reactive state via useSyncExternalStore
	const state = useSyncExternalStore(
		(callback) => controllableRef.current?.onStateChange(callback) ?? (() => {}),
		() => controllableRef.current?.playState ?? ("idle" as PlayState),
		() => "idle" as PlayState, // server snapshot
	);

	// Return stable function references
	const controls = useMemo(
		() => ({
			play: () => {
				const policy = reducedMotionRef.current;
				const ctrl = controllableRef.current;
				if (policy && ctrl) {
					applyPolicyToControllable(ctrl, policy);
				} else {
					controllableRef.current?.play();
				}
			},
			pause: () => controllableRef.current?.pause(),
			cancel: () => controllableRef.current?.cancel(),
		}),
		[],
	);

	return {
		...controls,
		state,
	};
}
