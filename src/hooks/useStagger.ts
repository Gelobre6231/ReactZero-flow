import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
	getReducedMotionPolicy,
	getReducePlaybackRate,
	shouldApplyReducedMotion,
} from "../reducedMotion.js";
import { stagger } from "../stagger.js";
import type {
	AdvancedStaggerConfig,
	Controllable,
	PlayState,
	ReducedMotionPolicy,
	StaggerConfig,
	StepDefinition,
} from "../types.js";
import { useReducedMotion } from "./useReducedMotion.js";

export interface UseStaggerOptions {
	autoPlay?: boolean;
	reducedMotion?: ReducedMotionPolicy;
}

export interface UseStaggerReturn {
	play(): void;
	pause(): void;
	cancel(): void;
	state: PlayState;
}

/**
 * React hook for stagger with grid/axis/from/easing support.
 * Delegates to the core stagger() which handles both simple and advanced configs.
 */
export function useStagger(
	steps: StepDefinition[],
	config: StaggerConfig | AdvancedStaggerConfig,
	options?: UseStaggerOptions,
): UseStaggerReturn {
	const controllableRef = useRef<Controllable | null>(null);
	const prefersReducedMotion = useReducedMotion();

	const policyRef = useRef<ReducedMotionPolicy | null>(null);
	policyRef.current = resolveStaggerPolicy(prefersReducedMotion, options?.reducedMotion);

	useEffect(() => {
		const ctrl = stagger(steps, config);

		controllableRef.current = ctrl;

		if (options?.autoPlay) {
			const policy = policyRef.current;
			if (policy) {
				applyStaggerPolicy(ctrl, policy);
			} else {
				ctrl.play();
			}
		}

		return () => {
			ctrl.cancel();
			controllableRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const state = useSyncExternalStore(
		(callback) => controllableRef.current?.onStateChange(callback) ?? (() => {}),
		() => controllableRef.current?.playState ?? ("idle" as PlayState),
		() => "idle" as PlayState,
	);

	const controls = useMemo(
		() => ({
			play: () => {
				const ctrl = controllableRef.current;
				if (!ctrl) return;
				const policy = policyRef.current;
				if (policy) {
					applyStaggerPolicy(ctrl, policy);
				} else {
					ctrl.play();
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

function resolveStaggerPolicy(
	prefersReducedMotion: boolean,
	localOverride?: ReducedMotionPolicy,
): ReducedMotionPolicy | null {
	if (!prefersReducedMotion) return null;

	if (localOverride != null) {
		return localOverride === "respect" ? null : localOverride;
	}

	if (shouldApplyReducedMotion()) {
		return getReducedMotionPolicy();
	}

	return null;
}

function applyStaggerPolicy(ctrl: Controllable, policy: ReducedMotionPolicy): void {
	switch (policy) {
		case "skip":
			ctrl.finish();
			break;
		case "reduce":
			ctrl.playbackRate = getReducePlaybackRate();
			ctrl.play();
			break;
		case "crossfade":
			ctrl.finish();
			break;
		case "respect":
			ctrl.play();
			break;
	}
}
