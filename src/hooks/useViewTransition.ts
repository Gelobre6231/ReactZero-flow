import { useCallback, useRef } from "react";
import { getReducedMotionPolicy, shouldApplyReducedMotion } from "../reducedMotion.js";
import { useReducedMotion } from "./useReducedMotion.js";

// ViewTransition and Document.startViewTransition are available in TypeScript 5.9+ DOM lib.
// No global augmentation needed.

export interface UseViewTransitionReturn {
	/** Start a view transition. Returns the ViewTransition object, or undefined if unsupported. */
	startTransition: (updateCallback: () => void | Promise<void>) => ViewTransition | undefined;
	/** The ready promise of the current transition, or undefined if none active. */
	ready: Promise<void> | undefined;
	/** The finished promise of the current transition, or undefined if none active. */
	finished: Promise<void> | undefined;
	/** Skip the current transition's animation (DOM update still applies). */
	skipTransition: () => void;
	/** Whether the View Transition API is supported in the current environment. */
	isSupported: boolean;
}

/**
 * React hook wrapping the View Transition API for same-document SPA transitions.
 *
 * This is a standalone hook (NOT a Controllable) because View Transitions have
 * a fundamentally different lifecycle (snapshot -> update DOM -> animate pseudo-elements)
 * that does not map to play/pause/cancel.
 *
 * @example
 * const { startTransition, isSupported } = useViewTransition();
 * startTransition(() => {
 *   setPage('next');
 * });
 *
 * @example
 * // With reduced motion (skip policy auto-skips animation)
 * const { startTransition } = useViewTransition();
 * startTransition(() => setState(newState));
 */
export function useViewTransition(): UseViewTransitionReturn {
	const prefersReducedMotion = useReducedMotion();
	const transitionRef = useRef<ViewTransition | null>(null);

	const isSupported =
		typeof document !== "undefined" && typeof document.startViewTransition === "function";

	const startTransition = useCallback(
		(updateCallback: () => void | Promise<void>): ViewTransition | undefined => {
			// Graceful fallback: no API support -- just call the callback directly
			if (!isSupported) {
				updateCallback();
				return undefined;
			}

			const vt = document.startViewTransition!(updateCallback);
			transitionRef.current = vt;

			// Reduced motion: auto-skip animation when 'skip' policy is active
			if (prefersReducedMotion && shouldApplyReducedMotion()) {
				const policy = getReducedMotionPolicy();
				if (policy === "skip") {
					vt.skipTransition();
				}
			}

			// Clean up ref when transition finishes
			vt.finished
				.then(() => {
					if (transitionRef.current === vt) {
						transitionRef.current = null;
					}
				})
				.catch(() => {
					// Transition was skipped or errored -- still clean up
					if (transitionRef.current === vt) {
						transitionRef.current = null;
					}
				});

			return vt;
		},
		[isSupported, prefersReducedMotion],
	);

	const skipTransition = useCallback(() => {
		transitionRef.current?.skipTransition();
	}, []);

	return {
		startTransition,
		get ready() {
			return transitionRef.current?.ready;
		},
		get finished() {
			return transitionRef.current?.finished;
		},
		skipTransition,
		isSupported,
	};
}
