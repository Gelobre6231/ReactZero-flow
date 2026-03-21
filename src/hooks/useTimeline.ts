import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
	applyReducedMotion,
	getReducedMotionPolicy,
	shouldApplyReducedMotion,
} from "../reducedMotion.js";
import type { TimelineBuilder, TimelineControllable } from "../timeline.js";
import { timeline } from "../timeline.js";
import type { PlayState, ReducedMotionPolicy } from "../types.js";
import { useReducedMotion } from "./useReducedMotion.js";

export interface UseTimelineOptions {
	autoPlay?: boolean;
	reducedMotion?: ReducedMotionPolicy;
}

export interface UseTimelineReturn {
	play(): void;
	pause(): void;
	cancel(): void;
	finish(): void;
	seek(timeMs: number): void;
	progress(normalized: number): void;
	seekTo(label: string): void;
	state: PlayState;
	currentTime: number;
	duration: number;
	playbackRate: number;
	setPlaybackRate(rate: number): void;
}

/**
 * React hook that creates and manages a timeline lifecycle.
 * Provides declarative timeline building with seek/progress/seekTo controls.
 *
 * @example
 * const { play, seek, state } = useTimeline((tl) => {
 *   tl.add(() => animate(el, kf1, opts1), { at: 0, duration: 300 })
 *     .label('midpoint')
 *     .add(() => animate(el2, kf2, opts2), { after: 'midpoint', offset: 100, duration: 500 });
 * });
 */
export function useTimeline(
	builder: (tl: TimelineBuilder) => void,
	options?: UseTimelineOptions,
): UseTimelineReturn {
	const controllableRef = useRef<TimelineControllable | null>(null);
	const prefersReducedMotion = useReducedMotion();

	// Resolve effective policy
	const policyRef = useRef<ReducedMotionPolicy | null>(null);
	policyRef.current = resolveTimelinePolicy(prefersReducedMotion, options?.reducedMotion);

	// Build and manage timeline lifecycle
	useEffect(() => {
		const tl = timeline();
		builder(tl);
		const ctrl = tl.build();
		controllableRef.current = ctrl;

		if (options?.autoPlay) {
			const policy = policyRef.current;
			if (policy) {
				applyTimelinePolicy(ctrl, policy);
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

	// Expose reactive state via useSyncExternalStore
	const state = useSyncExternalStore(
		(callback) => controllableRef.current?.onStateChange(callback) ?? (() => {}),
		() => controllableRef.current?.playState ?? ("idle" as PlayState),
		() => "idle" as PlayState,
	);

	// Return stable function references
	const controls = useMemo(
		() => ({
			play: () => {
				const ctrl = controllableRef.current;
				if (!ctrl) return;
				const policy = policyRef.current;
				if (policy) {
					applyTimelinePolicy(ctrl, policy);
				} else {
					ctrl.play();
				}
			},
			pause: () => controllableRef.current?.pause(),
			cancel: () => controllableRef.current?.cancel(),
			finish: () => controllableRef.current?.finish(),
			seek: (timeMs: number) => controllableRef.current?.seek(timeMs),
			progress: (normalized: number) => controllableRef.current?.progress(normalized),
			seekTo: (label: string) => controllableRef.current?.seekTo(label),
			setPlaybackRate: (rate: number) => {
				if (controllableRef.current) {
					controllableRef.current.playbackRate = rate;
				}
			},
		}),
		[],
	);

	return {
		...controls,
		state,
		get currentTime() {
			return controllableRef.current?.currentTime ?? 0;
		},
		get duration() {
			return controllableRef.current?.duration ?? 0;
		},
		get playbackRate() {
			return controllableRef.current?.playbackRate ?? 1;
		},
	};
}

function resolveTimelinePolicy(
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

function applyTimelinePolicy(ctrl: TimelineControllable, policy: ReducedMotionPolicy): void {
	switch (policy) {
		case "skip":
			ctrl.finish();
			break;
		case "reduce":
			applyReducedMotion(ctrl, "reduce");
			ctrl.play();
			break;
		case "crossfade":
			// Timeline-level crossfade falls back to skip
			ctrl.finish();
			break;
		case "respect":
			ctrl.play();
			break;
	}
}
