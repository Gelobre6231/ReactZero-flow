/**
 * CSS easing string presets for WAAPI animate() options.
 * All values are valid CSS <easing-function> strings.
 *
 * @example
 * import { easing } from "@reactzero/flow";
 * animate(el, keyframes, { easing: easing.easeOutCubic });
 */
export const easing = {
	// Basic
	linear: "linear",
	ease: "ease",
	easeIn: "ease-in",
	easeOut: "ease-out",
	easeInOut: "ease-in-out",

	// Sine
	easeInSine: "cubic-bezier(0.12, 0, 0.39, 0)",
	easeOutSine: "cubic-bezier(0.61, 1, 0.88, 1)",
	easeInOutSine: "cubic-bezier(0.37, 0, 0.63, 1)",

	// Quad
	easeInQuad: "cubic-bezier(0.11, 0, 0.5, 0)",
	easeOutQuad: "cubic-bezier(0.5, 1, 0.89, 1)",
	easeInOutQuad: "cubic-bezier(0.45, 0, 0.55, 1)",

	// Cubic
	easeInCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
	easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
	easeInOutCubic: "cubic-bezier(0.65, 0, 0.35, 1)",

	// Quart
	easeInQuart: "cubic-bezier(0.5, 0, 0.75, 0)",
	easeOutQuart: "cubic-bezier(0.25, 1, 0.5, 1)",
	easeInOutQuart: "cubic-bezier(0.76, 0, 0.24, 1)",

	// Expo
	easeInExpo: "cubic-bezier(0.7, 0, 0.84, 0)",
	easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
	easeInOutExpo: "cubic-bezier(0.87, 0, 0.13, 1)",

	// Circ
	easeInCirc: "cubic-bezier(0.55, 0, 1, 0.45)",
	easeOutCirc: "cubic-bezier(0, 0.55, 0.45, 1)",
	easeInOutCirc: "cubic-bezier(0.85, 0, 0.15, 1)",

	// Back (overshoots)
	easeInBack: "cubic-bezier(0.36, 0, 0.66, -0.56)",
	easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",
	easeInOutBack: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",

	// Aliases
	spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

/** Type for CSS easing string preset keys */
export type EasingPreset = keyof typeof easing;

/**
 * Mathematical easing functions (t: 0-1 → 0-1) for stagger delay
 * distribution, timeline progress, and other programmatic uses.
 *
 * @example
 * import { easeFn } from "@reactzero/flow";
 * stagger(steps, { each: 50, ease: easeFn.easeOutCubic });
 */
export const easeFn = {
	linear: (t: number): number => t,

	// Sine
	easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
	easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
	easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

	// Quad
	easeInQuad: (t: number): number => t * t,
	easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
	easeInOutQuad: (t: number): number =>
		t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,

	// Cubic
	easeInCubic: (t: number): number => t * t * t,
	easeOutCubic: (t: number): number => 1 - (1 - t) ** 3,
	easeInOutCubic: (t: number): number =>
		t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,

	// Quart
	easeInQuart: (t: number): number => t * t * t * t,
	easeOutQuart: (t: number): number => 1 - (1 - t) ** 4,
	easeInOutQuart: (t: number): number =>
		t < 0.5 ? 8 * t * t * t * t : 1 - (-2 * t + 2) ** 4 / 2,

	// Expo
	easeInExpo: (t: number): number =>
		t === 0 ? 0 : 2 ** (10 * t - 10),
	easeOutExpo: (t: number): number =>
		t === 1 ? 1 : 1 - 2 ** (-10 * t),
	easeInOutExpo: (t: number): number =>
		t === 0 ? 0
		: t === 1 ? 1
		: t < 0.5 ? 2 ** (20 * t - 10) / 2
		: (2 - 2 ** (-20 * t + 10)) / 2,

	// Circ
	easeInCirc: (t: number): number => 1 - Math.sqrt(1 - t ** 2),
	easeOutCirc: (t: number): number => Math.sqrt(1 - (t - 1) ** 2),
	easeInOutCirc: (t: number): number =>
		t < 0.5
			? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
			: (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2,

	// Back (overshoots)
	easeInBack: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return c3 * t * t * t - c1 * t * t;
	},
	easeOutBack: (t: number): number => {
		const c1 = 1.70158;
		const c3 = c1 + 1;
		return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
	},
	easeInOutBack: (t: number): number => {
		const c1 = 1.70158;
		const c2 = c1 * 1.525;
		return t < 0.5
			? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
			: ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
	},

	// Elastic
	easeInElastic: (t: number): number => {
		if (t === 0 || t === 1) return t;
		return -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
	},
	easeOutElastic: (t: number): number => {
		if (t === 0 || t === 1) return t;
		return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
	},
	easeInOutElastic: (t: number): number => {
		if (t === 0 || t === 1) return t;
		const c5 = (2 * Math.PI) / 4.5;
		return t < 0.5
			? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
			: (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
	},

	// Bounce
	easeOutBounce: (t: number): number => {
		const n1 = 7.5625;
		const d1 = 2.75;
		if (t < 1 / d1) return n1 * t * t;
		if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
		if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
		return n1 * (t -= 2.625 / d1) * t + 0.984375;
	},
	easeInBounce: (t: number): number => 1 - easeFn.easeOutBounce(1 - t),
	easeInOutBounce: (t: number): number =>
		t < 0.5
			? (1 - easeFn.easeOutBounce(1 - 2 * t)) / 2
			: (1 + easeFn.easeOutBounce(2 * t - 1)) / 2,
} as const;

/** Type for easing function preset keys */
export type EaseFnPreset = keyof typeof easeFn;

/** Type for an easing function (0-1 input → 0-1 output) */
export type EaseFn = (t: number) => number;

/**
 * Build a CSS cubic-bezier() easing string from control points.
 *
 * @example
 * animate(el, keyframes, { easing: cubicBezier(0.4, 0, 0.2, 1) });
 */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): string {
	return `cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`;
}

/**
 * Build a CSS steps() easing string.
 *
 * @example
 * animate(el, keyframes, { easing: steps(4) });
 * animate(el, keyframes, { easing: steps(8, "start") });
 */
export function steps(count: number, position?: "start" | "end"): string {
	return position ? `steps(${count}, ${position})` : `steps(${count})`;
}

/**
 * Sample a math easing function into a CSS linear() string.
 * Enables elastic, bounce, and custom curves on the compositor thread.
 *
 * @param fn - Math easing function (0-1 input, 0-1 output)
 * @param points - Number of sample points (default: 40)
 * @returns CSS linear() easing string
 *
 * @example
 * animate(el, keyframes, { easing: linearEasing(easeFn.easeOutElastic) });
 * animate(el, keyframes, { easing: linearEasing(easeFn.easeOutBounce, 60) });
 */
export function linearEasing(fn: EaseFn, points = 40): string {
	const values: string[] = [];
	for (let i = 0; i <= points; i++) {
		const t = i / points;
		values.push(fn(t).toFixed(4));
	}
	return `linear(${values.join(", ")})`;
}

/**
 * Check if the browser supports CSS linear() easing function.
 * Use to conditionally apply linearEasing() strings.
 *
 * @example
 * if (supportsLinearEasing()) {
 *   animate(el, kf, { easing: linearEasing(easeFn.easeOutElastic) });
 * }
 */
export function supportsLinearEasing(): boolean {
	try {
		return CSS.supports("animation-timing-function", "linear(0, 1)");
	} catch {
		return false;
	}
}
