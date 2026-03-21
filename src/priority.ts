import type { AnimationPriority, Controllable, PressureLevel } from "./types.js";

// Module-level state (follows reducedMotion.ts pattern)
let currentPressure: PressureLevel = "none";
let moderateSpeedUp = 2;
const pressureCallbacks = new Set<(level: PressureLevel) => void>();

/**
 * Get the current animation pressure level.
 */
export function getPressure(): PressureLevel {
	return currentPressure;
}

/**
 * Set the animation pressure level.
 * Typically called by frameMonitor or deviceTier, not directly by users.
 */
export function setPressure(level: PressureLevel): void {
	if (currentPressure === level) return;
	currentPressure = level;
	for (const cb of pressureCallbacks) {
		cb(level);
	}
}

/**
 * Get the moderate speed-up multiplier.
 */
export function getModerateSpeedUp(): number {
	return moderateSpeedUp;
}

/**
 * Set the moderate speed-up multiplier for reduced animations.
 */
export function setModerateSpeedUp(rate: number): void {
	moderateSpeedUp = rate;
}

/**
 * Subscribe to pressure changes. Returns unsubscribe function.
 */
export function onPressureChange(callback: (level: PressureLevel) => void): () => void {
	pressureCallbacks.add(callback);
	return () => {
		pressureCallbacks.delete(callback);
	};
}

/**
 * Determine what action to take for a given priority at current pressure.
 *
 * Matrix:
 *   pressure=none:     all → run
 *   pressure=moderate:  critical/normal → run, decorative → skip
 *   pressure=critical:  critical → run, normal → reduce, decorative → skip
 */
export function resolvePriorityAction(
	priority: AnimationPriority,
): "run" | "reduce" | "skip" {
	if (currentPressure === "none") return "run";

	if (priority === "critical") return "run";

	if (priority === "decorative") return "skip";

	// priority === "normal"
	if (currentPressure === "critical") return "reduce";
	return "run";
}

/**
 * Apply priority-based action to a Controllable.
 * - "run": no-op (play normally)
 * - "reduce": set playbackRate to moderateSpeedUp
 * - "skip": call finish() immediately
 */
export function applyPriority(
	controllable: Controllable,
	priority: AnimationPriority,
): void {
	const action = resolvePriorityAction(priority);
	switch (action) {
		case "skip":
			controllable.finish();
			break;
		case "reduce":
			controllable.playbackRate = moderateSpeedUp;
			break;
		case "run":
			break;
	}
}

/**
 * Wrap a step factory function with priority awareness.
 * Mirrors wrapWithPolicy() from reducedMotion.ts.
 */
export function wrapWithPriority(
	stepFn: () => Controllable,
	priority: AnimationPriority,
): () => Controllable {
	return () => {
		const ctrl = stepFn();
		applyPriority(ctrl, priority);
		return ctrl;
	};
}
