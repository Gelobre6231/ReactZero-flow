export type PlayState = "idle" | "running" | "paused" | "finished";

export interface Controllable {
	play(): void;
	pause(): void;
	cancel(): void;
	finish(): void;
	readonly finished: Promise<void>;
	readonly playState: PlayState;

	// ANI-13: Time scaling -- read/write, defaults to 1
	playbackRate: number;

	// Event callbacks for devtools/Studio integration (ANI-24)
	onStateChange(callback: () => void): () => void; // returns unsubscribe
	onStepStart?(callback: (index: number) => void): () => void; // compound only
	onStepComplete?(callback: (index: number) => void): () => void; // compound only

	// Inspectable state for devtools (ANI-24) -- compound Controllables only
	readonly currentStep?: number; // current step index (0-based), undefined for leaf
	readonly stepCount?: number; // total steps, undefined for leaf
}

/** ANI-11: Extended Controllable for race() -- exposes winning child index */
export interface RaceControllable extends Controllable {
	readonly winner?: number;
}

/** ANI-11: Extended Controllable for timeout() -- exposes whether timeout fired */
export interface TimeoutControllable extends Controllable {
	readonly timedOut?: boolean;
}

export interface AnimateOptions {
	duration?: number;
	easing?: string;
	delay?: number;
	iterations?: number;
	direction?: PlaybackDirection;
	composite?: CompositeOperation;
	iterationComposite?: IterationCompositeOperation;
	// NOTE: fill is intentionally excluded -- we force fill: 'forwards' internally
	// for the commitStyles pattern

	/** Disable automatic will-change management (default: true when compositor properties detected) */
	willChange?: boolean;
	/** Enable performance.mark/measure annotations for this animation */
	__perf?: boolean;
	/** v2.0: Animation priority for adaptive degradation (default: "normal") */
	priority?: AnimationPriority;
	/** v2.0: Convert layout properties to compositor transforms (opt-in) */
	decompose?: boolean;
}

/** A step is either a pre-created Controllable or a lazy factory function */
export type StepDefinition = Controllable | (() => Controllable);

/** Stagger configuration -- Phase 1 supports fixed delay only */
export interface StaggerConfig {
	/** Fixed ms delay between each step's start */
	each: number;
}

/** Advanced stagger configuration with grid, origin, and easing support */
export interface AdvancedStaggerConfig {
	/** ms between each step's start */
	each?: number;
	/** Origin point for distance-based delay calculation */
	from?: "start" | "center" | "end" | "edges" | "random" | number;
	/** Grid dimensions for 2D stagger -- [rows, cols] or 'auto' to detect from DOM */
	grid?: [number, number] | "auto";
	/** Restrict distance calculation to one axis (grid mode only) */
	axis?: "x" | "y";
	/** Easing function applied to delay distribution (0-1 normalized) */
	ease?: (t: number) => number;
}

/** ANI-16: Reduced motion policy modes */
export type ReducedMotionPolicy = "skip" | "reduce" | "crossfade" | "respect";

/** v2.0: Animation priority levels for adaptive performance */
export type AnimationPriority = "critical" | "normal" | "decorative";

/** v2.0: Device capability tier */
export type DeviceTier = "high" | "medium" | "low";

/** v2.0: System pressure level */
export type PressureLevel = "none" | "moderate" | "critical";

/** v2.0: Frame monitor configuration */
export interface FrameMonitorConfig {
	/** FPS below which decorative animations are skipped (default: 45) */
	degradeBelow?: number;
	/** FPS below which normal animations are also reduced (default: 30) */
	criticalBelow?: number;
	/** Number of frames in rolling window (default: 10) */
	windowSize?: number;
}

/** v2.0: Adaptive performance configuration */
export interface AdaptivePerformanceConfig {
	/** Frame monitor thresholds */
	frameMonitor?: FrameMonitorConfig;
	/** Manual tier override (auto-detected if omitted) */
	tier?: DeviceTier;
	/** Playback rate multiplier applied to "normal" animations under critical pressure (default: 2) */
	moderateSpeedUp?: number;
}

/** ANI-12: Timeline positioning options for explicit offset objects */
export interface TimelinePositionOptions {
	/** Absolute ms position in timeline */
	at?: number;
	/** Position relative to a named label */
	after?: string;
	/** ms offset from the resolved position (combined with 'after') */
	offset?: number;
}
