/**
 * CSS property classification for performance optimization.
 * Categorizes properties by rendering cost to enable dev warnings
 * and automatic will-change management.
 */

/** Compositor-tier properties (GPU-accelerated, no repaint/reflow) */
const COMPOSITOR_PROPERTIES = new Set([
	"opacity",
	"transform",
	"filter",
	"backdrop-filter",
	"translate",
	"rotate",
	"scale",
	"offset-distance",
]);

/** Layout-tier properties (trigger reflow — expensive) */
const LAYOUT_PROPERTIES = new Set([
	"width",
	"height",
	"min-width",
	"min-height",
	"max-width",
	"max-height",
	"top",
	"right",
	"bottom",
	"left",
	"inset",
	"margin",
	"margin-top",
	"margin-right",
	"margin-bottom",
	"margin-left",
	"padding",
	"padding-top",
	"padding-right",
	"padding-bottom",
	"padding-left",
	"border-width",
	"border-top-width",
	"border-right-width",
	"border-bottom-width",
	"border-left-width",
	"font-size",
	"line-height",
	"flex-basis",
	"gap",
]);

/** GPU-friendly alternatives for layout properties */
const ALTERNATIVES: Record<string, string> = {
	width: "transform: scaleX()",
	height: "transform: scaleY()",
	top: "transform: translateY()",
	bottom: "transform: translateY()",
	left: "transform: translateX()",
	right: "transform: translateX()",
	"margin-top": "transform: translateY()",
	"margin-left": "transform: translateX()",
};

/** WAAPI keyframe metadata keys (not CSS properties) */
const METADATA_KEYS = new Set(["offset", "easing", "composite"]);

/**
 * Extract animated CSS property names from keyframes.
 * Handles both Keyframe[] and PropertyIndexedKeyframes formats.
 */
export function extractAnimatedProperties(
	keyframes: Keyframe[] | PropertyIndexedKeyframes,
): string[] {
	const properties = new Set<string>();

	if (Array.isArray(keyframes)) {
		for (const frame of keyframes) {
			for (const key of Object.keys(frame)) {
				if (!METADATA_KEYS.has(key)) {
					properties.add(key);
				}
			}
		}
	} else {
		for (const key of Object.keys(keyframes)) {
			if (!METADATA_KEYS.has(key)) {
				properties.add(key);
			}
		}
	}

	return Array.from(properties);
}

/**
 * Filter property names to compositor-tier properties only.
 * Used by will-change management to set hints only for GPU-accelerated properties.
 */
export function getCompositorProperties(properties: string[]): string[] {
	return properties.filter((prop) => COMPOSITOR_PROPERTIES.has(prop));
}

/**
 * Warn in development when animating layout-triggering properties.
 * Suggests GPU-accelerated alternatives where available.
 * Tree-shakes completely in production builds.
 */
export function warnLayoutProperties(properties: string[]): void {
	// Skip in production (bundlers replace globalThis.__DEV__ or strip this check)
	try {
		if ((globalThis as Record<string, unknown>).process) {
			const env = ((globalThis as Record<string, unknown>).process as Record<string, Record<string, string>>).env;
			if (env?.NODE_ENV === "production") return;
		}
	} catch {
		// No process available — continue with warning
	}

	const layoutProps: string[] = [];
	for (const prop of properties) {
		if (LAYOUT_PROPERTIES.has(prop)) {
			layoutProps.push(prop);
		}
	}

	if (layoutProps.length === 0) return;

	const suggestions = layoutProps
		.map((prop) => {
			const alt = ALTERNATIVES[prop];
			return alt ? `  ${prop} → ${alt}` : `  ${prop}`;
		})
		.join("\n");

	// eslint-disable-next-line no-console
	console.warn(
		`[flow] Animating layout properties may cause jank:\n${suggestions}`,
	);
}
