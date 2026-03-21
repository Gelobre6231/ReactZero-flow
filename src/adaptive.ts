import { detectDeviceTier, getDeviceTier, setDeviceTier } from "./deviceTier.js";
import {
	configureFrameMonitor,
	startFrameMonitor,
	stopFrameMonitor,
} from "./frameMonitor.js";
import { setModerateSpeedUp, setPressure } from "./priority.js";
import type { AdaptivePerformanceConfig } from "./types.js";

// Module-level state
let adaptiveEnabled = false;

/**
 * Enable adaptive performance system.
 *
 * 1. Detects device tier (or uses provided tier)
 * 2. Sets initial pressure based on tier
 * 3. Configures and starts frame rate monitoring
 *
 * All v2.0 performance features are inert until this is called.
 */
export function enableAdaptivePerformance(
	config?: AdaptivePerformanceConfig,
): void {
	if (adaptiveEnabled) return; // idempotent
	adaptiveEnabled = true;

	// 1. Determine device tier
	if (config?.tier) {
		setDeviceTier(config.tier);
	} else {
		detectDeviceTier();
	}

	const tier = getDeviceTier()!;

	// 2. Set initial pressure based on tier
	if (tier === "low") {
		setPressure("moderate");
	}

	// 3. Configure speed-up multiplier
	if (config?.moderateSpeedUp != null) {
		setModerateSpeedUp(config.moderateSpeedUp);
	}

	// 4. Configure frame monitor
	if (config?.frameMonitor) {
		configureFrameMonitor(config.frameMonitor);
	}

	// More sensitive thresholds for medium-tier devices (if not explicitly configured)
	if (tier === "medium" && !config?.frameMonitor?.degradeBelow) {
		configureFrameMonitor({ degradeBelow: 50 });
	}

	// 5. Start frame monitoring
	startFrameMonitor();
}

/**
 * Disable adaptive performance. Stops monitoring, resets pressure to "none".
 */
export function disableAdaptivePerformance(): void {
	if (!adaptiveEnabled) return;
	adaptiveEnabled = false;
	stopFrameMonitor();
	setPressure("none");
}

/**
 * Check if adaptive performance is currently enabled.
 */
export function isAdaptivePerformanceEnabled(): boolean {
	return adaptiveEnabled;
}
