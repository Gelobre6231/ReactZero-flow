import { setPressure } from "./priority.js";
import type { FrameMonitorConfig } from "./types.js";

// Module-level state
let monitoring = false;
let rafId: number | null = null;
let lastTimestamp = 0;
let frameTimes: number[] = [];
let windowSize = 10;
let degradeBelow = 45;
let criticalBelow = 30;
let currentFps = 60;

const fpsCallbacks = new Set<(fps: number) => void>();

/**
 * Configure frame monitor thresholds.
 */
export function configureFrameMonitor(config: FrameMonitorConfig): void {
	if (config.degradeBelow != null) degradeBelow = config.degradeBelow;
	if (config.criticalBelow != null) criticalBelow = config.criticalBelow;
	if (config.windowSize != null) windowSize = config.windowSize;
}

function updatePressureFromFps(fps: number): void {
	if (fps < criticalBelow) {
		setPressure("critical");
	} else if (fps < degradeBelow) {
		setPressure("moderate");
	} else {
		setPressure("none");
	}
}

function tick(now: number): void {
	if (!monitoring) return;

	if (lastTimestamp > 0) {
		const delta = now - lastTimestamp;
		// Ignore unreasonable deltas (tab was backgrounded, etc.)
		if (delta > 0 && delta < 500) {
			frameTimes.push(delta);
			if (frameTimes.length > windowSize) {
				frameTimes.shift();
			}

			// Minimum 3 frames for a meaningful average
			if (frameTimes.length >= 3) {
				const avgDelta =
					frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
				const newFps = Math.round(1000 / avgDelta);

				if (newFps !== currentFps) {
					currentFps = newFps;
					for (const cb of fpsCallbacks) {
						cb(currentFps);
					}
					updatePressureFromFps(currentFps);
				}
			}
		}
	}

	lastTimestamp = now;
	rafId = requestAnimationFrame(tick);
}

/**
 * Start monitoring frame rate via rAF loop.
 */
export function startFrameMonitor(): void {
	if (monitoring) return;
	monitoring = true;
	lastTimestamp = 0;
	frameTimes = [];
	currentFps = 60;
	rafId = requestAnimationFrame(tick);
}

/**
 * Stop monitoring frame rate and release rAF.
 */
export function stopFrameMonitor(): void {
	monitoring = false;
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
	lastTimestamp = 0;
	frameTimes = [];
}

/**
 * Get current estimated FPS (rolling average).
 */
export function getFrameRate(): number {
	return currentFps;
}

/**
 * Subscribe to FPS changes. Returns unsubscribe function.
 */
export function onFrameRateChange(callback: (fps: number) => void): () => void {
	fpsCallbacks.add(callback);
	return () => {
		fpsCallbacks.delete(callback);
	};
}

/**
 * Reset all monitor state (for testing).
 */
export function resetFrameMonitor(): void {
	stopFrameMonitor();
	currentFps = 60;
	degradeBelow = 45;
	criticalBelow = 30;
	windowSize = 10;
	fpsCallbacks.clear();
}
