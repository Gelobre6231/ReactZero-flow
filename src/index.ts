// v2.0: Adaptive performance coordinator
export {
	disableAdaptivePerformance,
	enableAdaptivePerformance,
	isAdaptivePerformanceEnabled,
} from "./adaptive.js";
export { animate } from "./animate.js";
// Performance annotations
export {
	annotateAnimation,
	getPerformanceAnnotations,
	setPerformanceAnnotations,
} from "./annotations.js";
// v2.0: Smart transform decomposition
export { decomposeTransforms, validateDecomposePosition } from "./decompose.js";
export { delay } from "./delay.js";
// v2.0: Device tier detection
export {
	detectDeviceTier,
	getDeviceTier,
	resetDeviceTier,
	setDeviceTier,
} from "./deviceTier.js";
// Easing presets, functions, and helpers
export type { EaseFn, EaseFnPreset, EasingPreset } from "./easing.js";
export { cubicBezier, easeFn, easing, linearEasing, steps, supportsLinearEasing } from "./easing.js";
// v2.0: Frame rate monitoring
export {
	configureFrameMonitor,
	getFrameRate,
	onFrameRateChange,
	resetFrameMonitor,
	startFrameMonitor,
	stopFrameMonitor,
} from "./frameMonitor.js";
// React hooks
export type { ReducedMotionProviderProps } from "./hooks/ReducedMotionProvider.js";
export { ReducedMotionProvider, useReducedMotionPolicy } from "./hooks/ReducedMotionProvider.js";
export { useReducedMotion } from "./hooks/useReducedMotion.js";
// Scroll-driven animation (ANI-03-01)
export type { UseScrollOptions, UseScrollReturn } from "./hooks/useScroll.js";
export { useScroll } from "./hooks/useScroll.js";
export type { UseSequenceOptions, UseSequenceReturn } from "./hooks/useSequence.js";
export { useSequence } from "./hooks/useSequence.js";
export type { UseStaggerOptions, UseStaggerReturn } from "./hooks/useStagger.js";
export { useStagger } from "./hooks/useStagger.js";
export type { UseTimelineOptions, UseTimelineReturn } from "./hooks/useTimeline.js";
export { useTimeline } from "./hooks/useTimeline.js";
// View Transition API (ANI-03-01)
export type { UseViewTransitionReturn } from "./hooks/useViewTransition.js";
export { useViewTransition } from "./hooks/useViewTransition.js";
export { parallel } from "./parallel.js";
// v2.0: Priority system
export {
	applyPriority,
	getModerateSpeedUp,
	getPressure,
	onPressureChange,
	resolvePriorityAction,
	setModerateSpeedUp,
	setPressure,
	wrapWithPriority,
} from "./priority.js";
// Performance utilities
export { extractAnimatedProperties, getCompositorProperties } from "./properties.js";
// Composition operators (ANI-11, ANI-14)
export { race } from "./race.js";
// Reduced motion policy (ANI-16)
export {
	applyReducedMotion,
	crossfadeKeyframes,
	getReducedMotionPolicy,
	getReducePlaybackRate,
	setReducedMotionPolicy,
	shouldApplyReducedMotion,
	wrapWithPolicy,
} from "./reducedMotion.js";
export type { RepeatOptions } from "./repeat.js";
export { repeat } from "./repeat.js";
export { sequence } from "./sequence.js";
export { computeStaggerOffsets, stagger } from "./stagger.js";
// Timeline (ANI-12)
export type { TimelineControllable } from "./timeline.js";
export { timeline } from "./timeline.js";
export { timeout } from "./timeout.js";
export type {
	AdaptivePerformanceConfig,
	AdvancedStaggerConfig,
	AnimateOptions,
	AnimationPriority,
	Controllable,
	DeviceTier,
	FrameMonitorConfig,
	PlayState,
	PressureLevel,
	RaceControllable,
	ReducedMotionPolicy,
	StaggerConfig,
	StepDefinition,
	TimelinePositionOptions,
	TimeoutControllable,
} from "./types.js";
// Event steps (ANI-10)
export { waitFor } from "./waitFor.js";
export type { WaitForEventOptions } from "./waitForEvent.js";
export { waitForEvent } from "./waitForEvent.js";
export { waitForIntersection } from "./waitForIntersection.js";
