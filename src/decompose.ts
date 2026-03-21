/**
 * Smart Transform Decomposition — converts layout property keyframes
 * to GPU-friendly transform equivalents.
 */

/** WAAPI keyframe metadata keys (not CSS properties) */
const METADATA_KEYS = new Set(["offset", "easing", "composite"]);

/** Layout properties that can be decomposed to transforms */
const DECOMPOSABLE = new Set([
	"left",
	"top",
	"right",
	"bottom",
	"width",
	"height",
]);

/**
 * Parse a numeric CSS value like "100px" or "-50%".
 * Returns null for complex values like calc().
 */
function parseNumericValue(
	value: string,
): { value: number; unit: string } | null {
	const match = /^(-?\d+(?:\.\d+)?)\s*(px|%|em|rem|vw|vh|vmin|vmax)?$/.exec(
		String(value),
	);
	if (!match) return null;
	return { value: Number(match[1]), unit: match[2] || "px" };
}

/**
 * Decompose a single keyframe object, converting layout props to transforms.
 */
function decomposeKeyframe(
	frame: Keyframe,
	computedStyle: CSSStyleDeclaration,
): Keyframe {
	const newFrame: Record<string, unknown> = {};
	const transforms: string[] = [];

	for (const [key, value] of Object.entries(frame)) {
		if (METADATA_KEYS.has(key)) {
			newFrame[key] = value;
			continue;
		}

		if (!DECOMPOSABLE.has(key)) {
			// Preserve existing transform for merging
			if (key === "transform") {
				transforms.push(String(value));
			} else {
				newFrame[key] = value;
			}
			continue;
		}

		const parsed = parseNumericValue(String(value));
		if (!parsed) {
			// Can't parse (calc(), etc.) — pass through unchanged
			newFrame[key] = value;
			continue;
		}

		switch (key) {
			case "left":
				transforms.push(`translateX(${parsed.value}${parsed.unit})`);
				break;
			case "top":
				transforms.push(`translateY(${parsed.value}${parsed.unit})`);
				break;
			case "right":
				transforms.push(`translateX(${-parsed.value}${parsed.unit})`);
				break;
			case "bottom":
				transforms.push(`translateY(${-parsed.value}${parsed.unit})`);
				break;
			case "width": {
				const currentWidth = Number.parseFloat(computedStyle.width);
				if (currentWidth > 0) {
					transforms.push(`scaleX(${parsed.value / currentWidth})`);
				} else {
					newFrame[key] = value; // zero width — pass through
				}
				break;
			}
			case "height": {
				const currentHeight = Number.parseFloat(computedStyle.height);
				if (currentHeight > 0) {
					transforms.push(`scaleY(${parsed.value / currentHeight})`);
				} else {
					newFrame[key] = value; // zero height — pass through
				}
				break;
			}
		}
	}

	if (transforms.length > 0) {
		newFrame.transform = transforms.join(" ");
	}

	return newFrame as Keyframe;
}

/**
 * Convert layout property keyframes to GPU-friendly transform equivalents.
 *
 * Supported conversions:
 *   left   → translateX(value)
 *   top    → translateY(value)
 *   right  → translateX(-value)
 *   bottom → translateY(-value)
 *   width  → scaleX(targetWidth / computedWidth)
 *   height → scaleY(targetHeight / computedHeight)
 *
 * Non-layout properties pass through unchanged. Returns new keyframes.
 */
export function decomposeTransforms(
	keyframes: Keyframe[] | PropertyIndexedKeyframes,
	element: Element,
): Keyframe[] | PropertyIndexedKeyframes {
	const computedStyle = getComputedStyle(element);

	// Handle Keyframe[] format
	if (Array.isArray(keyframes)) {
		return keyframes.map((frame) => decomposeKeyframe(frame, computedStyle));
	}

	// Handle PropertyIndexedKeyframes format — convert to Keyframe[], decompose, convert back
	// This is simpler than trying to decompose property-indexed format directly
	// since transforms merge multiple properties into one.
	const keys = Object.keys(keyframes).filter((k) => !METADATA_KEYS.has(k));
	const hasDecomposable = keys.some((k) => DECOMPOSABLE.has(k));
	if (!hasDecomposable) return keyframes;

	// Determine number of keyframes from the longest array
	const record = keyframes as Record<string, unknown>;
	let maxLen = 0;
	for (const key of keys) {
		const val = record[key];
		if (Array.isArray(val) && val.length > maxLen) {
			maxLen = val.length;
		}
	}
	if (maxLen === 0) return keyframes;

	// Build Keyframe[] from PropertyIndexedKeyframes
	const frameArray: Keyframe[] = [];
	for (let i = 0; i < maxLen; i++) {
		const frame: Record<string, unknown> = {};
		for (const key of Object.keys(keyframes)) {
			const val = record[key];
			if (Array.isArray(val)) {
				frame[key] = val[i] ?? val[val.length - 1];
			} else {
				frame[key] = val;
			}
		}
		frameArray.push(frame as Keyframe);
	}

	return frameArray.map((frame) => decomposeKeyframe(frame, computedStyle));
}

/**
 * Check if an element's position allows transform decomposition.
 * Returns true for relative, absolute, fixed, or sticky.
 * Dev warning if position is static.
 */
export function validateDecomposePosition(element: Element): boolean {
	try {
		const position = getComputedStyle(element).position;
		if (position === "static") {
			try {
				if ((globalThis as Record<string, unknown>).process) {
					const env = (
						(globalThis as Record<string, unknown>).process as Record<
							string,
							Record<string, string>
						>
					).env;
					if (env?.NODE_ENV === "production") return false;
				}
			} catch {
				// continue
			}
			// eslint-disable-next-line no-console
			console.warn(
				"[flow] decompose: element has position:static. Transform translations require position:relative, absolute, or fixed.",
			);
			return false;
		}
		return true;
	} catch {
		return true; // SSR safety — assume valid
	}
}
