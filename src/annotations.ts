/**
 * Performance annotations for Chrome DevTools integration.
 * Opt-in via global toggle or per-animation __perf option.
 * Creates performance.mark/measure entries visible in the Performance tab.
 */

import type { Controllable } from "./types.js";

/** Module-level state (follows reducedMotion pattern) */
let enabled = false;

/**
 * Enable or disable performance annotations globally.
 * When enabled, all animations create marks/measures visible in DevTools.
 */
export function setPerformanceAnnotations(on: boolean): void {
	enabled = on;
}

/**
 * Get the current global performance annotations setting.
 */
export function getPerformanceAnnotations(): boolean {
	return enabled;
}

/**
 * Annotate an animation with performance.mark/measure entries.
 * Called automatically by animate() when annotations are enabled.
 * Zero cost when disabled (early return before any string allocation).
 */
export function annotateAnimation(
	element: Element,
	properties: string[],
	duration: number | undefined,
	controllable: Controllable,
	perfOpt?: boolean,
): void {
	if (!(perfOpt ?? enabled)) return;
	if (
		typeof performance === "undefined" ||
		typeof performance.mark !== "function"
	)
		return;

	const id =
		(element as HTMLElement).id || element.tagName.toLowerCase();
	const props = properties.join(",");
	const startName = `flow:${id}:${props}:start`;
	const measureName = `flow:${id}:${props}`;

	try {
		performance.mark(startName, {
			detail: { element: id, properties, duration },
		});

		controllable.finished.then(() => {
			try {
				const endName = `flow:${id}:${props}:end`;
				performance.mark(endName);
				performance.measure(measureName, startName, endName);
			} catch {
				// Marks may have been cleared
			}
		});
	} catch {
		// performance.mark may not support detail option in older browsers
	}
}
