import type { DeviceTier } from "./types.js";

// Module-level state
let cachedTier: DeviceTier | null = null;
let manualOverride: DeviceTier | null = null;

/**
 * Compute hardware capability score from available browser APIs.
 *
 * Scoring:
 * - hardwareConcurrency: >=8 → +2, >=4 → +1, <4 → 0
 * - deviceMemory (Chrome/Edge only): >=8 → +2, >=4 → +1, unavailable → +1 (assume medium)
 * - screen resolution * DPR: >=2M pixels → +1, <1M → -1
 *
 * Total range: -1 to 5. Thresholds: >=4 → "high", >=2 → "medium", <2 → "low"
 */
function computeScore(): number {
	let score = 0;

	// CPU cores (universally supported)
	try {
		const cores = navigator.hardwareConcurrency ?? 4;
		if (cores >= 8) score += 2;
		else if (cores >= 4) score += 1;
	} catch {
		score += 1; // SSR safety — assume medium
	}

	// Device memory (Chrome/Edge only, undefined elsewhere)
	try {
		const mem = (navigator as unknown as Record<string, number>).deviceMemory;
		if (mem != null) {
			if (mem >= 8) score += 2;
			else if (mem >= 4) score += 1;
		} else {
			score += 1; // unknown = assume medium
		}
	} catch {
		score += 1;
	}

	// Screen resolution signal
	try {
		const pixels =
			screen.width * screen.height * (window.devicePixelRatio ?? 1);
		if (pixels >= 2_000_000) score += 1;
		else if (pixels < 1_000_000) score -= 1;
	} catch {
		// no adjustment
	}

	return score;
}

function scoreToTier(score: number): DeviceTier {
	if (score >= 4) return "high";
	if (score >= 2) return "medium";
	return "low";
}

/**
 * Detect device capability tier using available browser APIs.
 * Result is cached for the session.
 */
export function detectDeviceTier(): DeviceTier {
	if (cachedTier !== null) return cachedTier;
	const score = computeScore();
	cachedTier = scoreToTier(score);
	return cachedTier;
}

/**
 * Get the current device tier (cached from last detection, or manual override).
 * Returns null if neither detect nor set has been called.
 */
export function getDeviceTier(): DeviceTier | null {
	return manualOverride ?? cachedTier;
}

/**
 * Manually override the detected device tier.
 * Takes priority over auto-detection. Pass null to clear override.
 */
export function setDeviceTier(tier: DeviceTier | null): void {
	manualOverride = tier;
}

/**
 * Reset cached detection (for testing).
 */
export function resetDeviceTier(): void {
	cachedTier = null;
	manualOverride = null;
}
