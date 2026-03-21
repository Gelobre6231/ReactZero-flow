import { createControllable } from "./controllable.js";
import { delay } from "./delay.js";
import { parallel } from "./parallel.js";
import { sequence } from "./sequence.js";
import type { AdvancedStaggerConfig, Controllable, StaggerConfig, StepDefinition } from "./types.js";

function resolveStep(step: StepDefinition): Controllable {
	return typeof step === "function" ? step() : step;
}

/**
 * Check if a config is an advanced stagger config (has grid, from, axis, or ease).
 */
function isAdvancedConfig(
	config: StaggerConfig | AdvancedStaggerConfig,
): config is AdvancedStaggerConfig {
	return "from" in config || "grid" in config || "axis" in config || "ease" in config;
}

/**
 * Resolve the origin index for distance-based delay calculation.
 */
export function resolveOriginIndex(count: number, from: AdvancedStaggerConfig["from"]): number {
	if (from === "start" || from == null) return 0;
	if (from === "end") return count - 1;
	if (from === "center") return (count - 1) / 2;
	if (from === "edges") return (count - 1) / 2;
	if (from === "random") return Math.floor(Math.random() * count);
	if (typeof from === "number") return Math.min(from, count - 1);
	return 0;
}

/**
 * Compute linear distances from an origin index.
 */
export function computeLinearDistances(count: number, origin: number): number[] {
	return Array.from({ length: count }, (_, i) => Math.abs(i - origin));
}

/**
 * Compute 2D grid distances from an origin index.
 */
export function computeGridDistances(
	count: number,
	grid: [number, number] | "auto",
	originIndex: number,
	axis?: "x" | "y",
): number[] {
	const [_rows, cols] =
		grid === "auto" ? [Math.ceil(Math.sqrt(count)), Math.ceil(Math.sqrt(count))] : grid;

	const originRow = Math.floor(originIndex / cols);
	const originCol = originIndex % cols;

	return Array.from({ length: count }, (_, i) => {
		const row = Math.floor(i / cols);
		const col = i % cols;

		const dx = Math.abs(col - originCol);
		const dy = Math.abs(row - originRow);

		if (axis === "x") return dx;
		if (axis === "y") return dy;

		return Math.sqrt(dx * dx + dy * dy);
	});
}

/**
 * Compute stagger delay offsets for advanced configurations.
 * Returns an array of delay offsets in ms, one per step.
 *
 * @example
 * const offsets = computeStaggerOffsets(10, { each: 50, ease: easeFn.easeOutQuad });
 */
export function computeStaggerOffsets(count: number, config: AdvancedStaggerConfig): number[] {
	const each = config.each ?? 50;

	if (count <= 0) return [];
	if (count === 1) return [0];

	const originIndex = resolveOriginIndex(count, config.from ?? "start");

	let distances: number[];

	if (config.grid) {
		distances = computeGridDistances(count, config.grid, originIndex, config.axis);
	} else {
		distances = computeLinearDistances(count, originIndex);
	}

	const maxDistance = Math.max(...distances);
	const normalized =
		maxDistance > 0 ? distances.map((d) => d / maxDistance) : distances.map(() => 0);

	const eased = config.ease ? normalized.map(config.ease) : normalized;

	const totalDuration = each * (count - 1);
	return eased.map((t) => t * totalDuration);
}

/**
 * Create a stagger animation that plays steps with staggered delays.
 *
 * Supports both simple config (`{ each: 50 }`) and advanced config
 * with grid, origin, and easing support.
 *
 * @example
 * // Simple: fixed 50ms delay between steps
 * stagger(steps, { each: 50 });
 *
 * // Advanced: eased delay distribution from center
 * stagger(steps, { each: 50, from: "center", ease: easeFn.easeOutCubic });
 */
export function stagger(
	steps: StepDefinition[],
	config: StaggerConfig | AdvancedStaggerConfig,
): Controllable {
	if (isAdvancedConfig(config)) {
		return buildAdvancedStagger(steps, config);
	}

	return buildSimpleStagger(steps, config);
}

function buildAdvancedStagger(
	steps: StepDefinition[],
	config: AdvancedStaggerConfig,
): Controllable {
	const offsets = computeStaggerOffsets(steps.length, config);

	return parallel(
		...steps.map(
			(step, i): StepDefinition =>
				() =>
					sequence(() => delay(offsets[i]), typeof step === "function" ? step : () => step),
		),
	);
}

function buildSimpleStagger(steps: StepDefinition[], config: StaggerConfig): Controllable {
	let innerChildren: Controllable[] = [];
	let _startedCount = 0;
	let completedCount = 0;
	let _playbackRate = 1;

	const controllable = createControllable({
		runner: async (_signal, emitters) => {
			_startedCount = 0;
			completedCount = 0;

			const resolvedSteps = steps.map(resolveStep);

			innerChildren = resolvedSteps.map((step, i) => {
				const offsetDelay = delay(config.each * i);

				const innerSeq = sequence(
					() => offsetDelay,
					() => step,
				);

				innerSeq.onStepStart?.((stepIndex) => {
					if (stepIndex === 1) {
						_startedCount++;
						emitters.emitStepStart(i);
					}
				});

				innerSeq.onStepComplete?.((stepIndex) => {
					if (stepIndex === 1) {
						completedCount++;
						emitters.emitStepComplete(i);
					}
				});

				return innerSeq;
			});

			for (const child of innerChildren) {
				child.playbackRate = _playbackRate;
				child.play();
			}

			await Promise.all(innerChildren.map((c) => c.finished));
		},
		controls: {
			pause(): void {
				for (const child of innerChildren) {
					child.pause();
				}
			},
			resume(): void {
				for (const child of innerChildren) {
					child.play();
				}
			},
			cancel(): void {
				for (const child of innerChildren) {
					child.cancel();
				}
				innerChildren = [];
			},
			setPlaybackRate(rate: number): void {
				_playbackRate = rate;
				for (const child of innerChildren) {
					child.playbackRate = rate;
				}
			},
		},
		getStepState: () => ({
			currentStep: completedCount,
			stepCount: steps.length,
		}),
	});

	return controllable;
}
