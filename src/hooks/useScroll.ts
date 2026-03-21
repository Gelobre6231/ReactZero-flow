import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

declare global {
	interface ScrollTimelineOptions {
		source?: Element | null;
		axis?: "block" | "inline" | "x" | "y";
	}
	class ScrollTimeline extends AnimationTimeline {
		constructor(options?: ScrollTimelineOptions);
		readonly source: Element | null;
		readonly axis: string;
	}
}

/**
 * Check if the browser supports native ScrollTimeline API.
 */
function supportsScrollTimeline(): boolean {
	try {
		return typeof ScrollTimeline !== "undefined";
	} catch {
		return false;
	}
}

export interface UseScrollOptions {
	/** Scroll container element ref (default: document.documentElement) */
	source?: React.RefObject<Element | null>;
	/** Element to track for progress calculation (intersection-based) */
	target?: React.RefObject<Element | null>;
	/** Scroll axis (default: 'block') */
	axis?: "block" | "inline";
	/** Scroll range offsets [start, end] in CSS format */
	offset?: [string, string];
}

export interface UseScrollReturn {
	/** Reactive scroll progress from 0 to 1 */
	progress: number;
	/** Imperatively scroll the container to a normalized position (0-1) */
	scrollTo: (position: number) => void;
	/** Ref to attach to the target element */
	ref: React.RefObject<Element | null>;
}

/**
 * React hook that provides reactive scroll progress (0-1) driven by scroll position.
 *
 * Uses native ScrollTimeline when available (progressive enhancement),
 * falling back to IntersectionObserver + scroll listener.
 *
 * @example
 * const { progress, ref } = useScroll();
 * // progress updates reactively as user scrolls
 *
 * @example
 * const { progress, ref } = useScroll({ target: elementRef });
 * // progress tracks the target element's visibility in viewport
 */
export function useScroll(options: UseScrollOptions = {}): UseScrollReturn {
	const prefersReducedMotion = useReducedMotion();
	const targetRef = useRef<Element | null>(null);
	const [progress, setProgress] = useState(0);
	const rafIdRef = useRef<number | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);

	const { source, target, axis = "block" } = options;

	// Determine the effective ref: user-provided target or our internal ref
	const effectiveRef = target ?? targetRef;

	const scrollTo = useCallback(
		(position: number) => {
			const clamped = Math.max(0, Math.min(1, position));
			const container = source?.current ?? document.documentElement;
			const isInline = axis === "inline";
			const maxScroll = isInline
				? container.scrollWidth - container.clientWidth
				: container.scrollHeight - container.clientHeight;
			const scrollTarget = clamped * maxScroll;

			const scrollElement = container === document.documentElement ? window : container;
			if (isInline) {
				scrollElement.scrollTo({ left: scrollTarget, behavior: "instant" });
			} else {
				scrollElement.scrollTo({ top: scrollTarget, behavior: "instant" });
			}
		},
		[source, axis],
	);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const container = source?.current ?? document.documentElement;
		const isInline = axis === "inline";
		const useTarget = effectiveRef.current != null;

		// Native ScrollTimeline path for container-level tracking
		// (target-element tracking is not compatible with basic ScrollTimeline)
		if (!useTarget && supportsScrollTimeline()) {
			return setupNativeScrollTimeline(container, isInline);
		}

		// Fallback: IO + scroll listener + rAF
		return setupLegacyScrollTracking(container, isInline, useTarget);

		function setupNativeScrollTimeline(
			scrollContainer: Element,
			inline: boolean,
		): () => void {
			const scrollTimeline = new ScrollTimeline({
				source: scrollContainer,
				axis: inline ? "inline" : "block",
			});

			// Create a proxy element to track scroll progress via WAAPI
			const proxy = document.createElement("div");
			const animation = proxy.animate(
				[{ opacity: 0 }, { opacity: 1 }],
				{ timeline: scrollTimeline, fill: "both" } as KeyframeAnimationOptions,
			);

			function pollProgress() {
				const ct = animation.currentTime;
				if (ct != null) {
					// ScrollTimeline currentTime can be a number (ms) or CSSUnitValue (percent)
					const raw = typeof ct === "number"
						? ct / 100
						: ((ct as unknown as { value: number }).value ?? 0) / 100;
					const clamped = Math.max(0, Math.min(1, raw));
					if (prefersReducedMotion) {
						setProgress(clamped >= 0.5 ? 1 : 0);
					} else {
						setProgress(clamped);
					}
				}
				rafIdRef.current = requestAnimationFrame(pollProgress);
			}

			rafIdRef.current = requestAnimationFrame(pollProgress);

			return () => {
				animation.cancel();
				if (rafIdRef.current != null) {
					cancelAnimationFrame(rafIdRef.current);
					rafIdRef.current = null;
				}
			};
		}

		function setupLegacyScrollTracking(
			scrollContainer: Element,
			inline: boolean,
			trackTarget: boolean,
		): () => void {
			function calculateContainerProgress(): number {
				const scrollPos = inline ? scrollContainer.scrollLeft : scrollContainer.scrollTop;
				const maxScroll = inline
					? scrollContainer.scrollWidth - scrollContainer.clientWidth
					: scrollContainer.scrollHeight - scrollContainer.clientHeight;
				if (maxScroll <= 0) return 0;
				return Math.max(0, Math.min(1, scrollPos / maxScroll));
			}

			function calculateTargetProgress(): number {
				const el = effectiveRef.current;
				if (!el) return 0;

				const rect = el.getBoundingClientRect();
				const viewportSize = inline ? window.innerWidth : window.innerHeight;
				const elementPos = inline ? rect.left : rect.top;
				const elementSize = inline ? rect.width : rect.height;
				const totalTravel = viewportSize + elementSize;
				const currentPos = viewportSize - elementPos;
				return Math.max(0, Math.min(1, currentPos / totalTravel));
			}

			function updateProgress() {
				const raw = trackTarget ? calculateTargetProgress() : calculateContainerProgress();
				if (prefersReducedMotion) {
					setProgress(raw >= 0.5 ? 1 : 0);
				} else {
					setProgress(raw);
				}
			}

			function onScroll() {
				if (rafIdRef.current != null) return;
				rafIdRef.current = requestAnimationFrame(() => {
					rafIdRef.current = null;
					updateProgress();
				});
			}

			const scrollTarget = scrollContainer === document.documentElement ? window : scrollContainer;

			if (trackTarget) {
				const io = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (entry.isIntersecting) {
								scrollTarget.addEventListener("scroll", onScroll, { passive: true });
								updateProgress();
							} else {
								scrollTarget.removeEventListener("scroll", onScroll);
								const rect = entry.boundingClientRect;
								const viewportSize = inline ? window.innerWidth : window.innerHeight;
								const elementPos = inline ? rect.left : rect.top;
								if (elementPos >= viewportSize) {
									setProgress(0);
								} else {
									setProgress(1);
								}
							}
						}
					},
					{ threshold: [0, 0.01, 0.99, 1] },
				);

				if (effectiveRef.current) {
					io.observe(effectiveRef.current);
				}
				observerRef.current = io;

				cleanupRef.current = () => {
					io.disconnect();
					scrollTarget.removeEventListener("scroll", onScroll);
					if (rafIdRef.current != null) {
						cancelAnimationFrame(rafIdRef.current);
						rafIdRef.current = null;
					}
				};
			} else {
				scrollTarget.addEventListener("scroll", onScroll, { passive: true });
				updateProgress();

				cleanupRef.current = () => {
					scrollTarget.removeEventListener("scroll", onScroll);
					if (rafIdRef.current != null) {
						cancelAnimationFrame(rafIdRef.current);
						rafIdRef.current = null;
					}
				};
			}

			return () => {
				cleanupRef.current?.();
				cleanupRef.current = null;
				observerRef.current = null;
			};
		}
	}, [source, axis, effectiveRef, prefersReducedMotion]);

	return {
		progress,
		scrollTo,
		ref: effectiveRef,
	};
}
