import { describe, expect, it, vi } from "vitest";
import {
	cubicBezier,
	easing,
	easeFn,
	linearEasing,
	steps,
	supportsLinearEasing,
} from "../easing.js";

describe("easing (CSS string presets)", () => {
	it("exports basic CSS easing keywords", () => {
		expect(easing.linear).toBe("linear");
		expect(easing.ease).toBe("ease");
		expect(easing.easeIn).toBe("ease-in");
		expect(easing.easeOut).toBe("ease-out");
		expect(easing.easeInOut).toBe("ease-in-out");
	});

	it("exports cubic-bezier strings for named curves", () => {
		expect(easing.easeInSine).toMatch(/^cubic-bezier\(/);
		expect(easing.easeOutCubic).toMatch(/^cubic-bezier\(/);
		expect(easing.easeInOutQuart).toMatch(/^cubic-bezier\(/);
		expect(easing.easeInBack).toMatch(/^cubic-bezier\(/);
		expect(easing.easeOutBack).toMatch(/^cubic-bezier\(/);
	});

	it("spring is an alias for easeOutBack", () => {
		expect(easing.spring).toBe(easing.easeOutBack);
	});

	it("all presets are strings", () => {
		for (const [key, value] of Object.entries(easing)) {
			expect(typeof value).toBe("string");
		}
	});

	it("has all expected families", () => {
		const families = ["Sine", "Quad", "Cubic", "Quart", "Expo", "Circ", "Back"];
		for (const family of families) {
			expect(easing).toHaveProperty(`easeIn${family}`);
			expect(easing).toHaveProperty(`easeOut${family}`);
			expect(easing).toHaveProperty(`easeInOut${family}`);
		}
	});
});

describe("easeFn (mathematical easing functions)", () => {
	it("linear returns input unchanged", () => {
		expect(easeFn.linear(0)).toBe(0);
		expect(easeFn.linear(0.5)).toBe(0.5);
		expect(easeFn.linear(1)).toBe(1);
	});

	it("all functions return 0 for t=0", () => {
		for (const [key, fn] of Object.entries(easeFn)) {
			expect(fn(0)).toBeCloseTo(0, 5);
		}
	});

	it("all functions return 1 for t=1", () => {
		for (const [key, fn] of Object.entries(easeFn)) {
			expect(fn(1)).toBeCloseTo(1, 5);
		}
	});

	it("easeIn functions start slow (value at 0.25 < 0.25)", () => {
		expect(easeFn.easeInQuad(0.25)).toBeLessThan(0.25);
		expect(easeFn.easeInCubic(0.25)).toBeLessThan(0.25);
		expect(easeFn.easeInQuart(0.25)).toBeLessThan(0.25);
		expect(easeFn.easeInExpo(0.25)).toBeLessThan(0.25);
	});

	it("easeOut functions start fast (value at 0.25 > 0.25)", () => {
		expect(easeFn.easeOutQuad(0.25)).toBeGreaterThan(0.25);
		expect(easeFn.easeOutCubic(0.25)).toBeGreaterThan(0.25);
		expect(easeFn.easeOutQuart(0.25)).toBeGreaterThan(0.25);
	});

	it("easeInOut functions pass through ~0.5 at t=0.5", () => {
		expect(easeFn.easeInOutSine(0.5)).toBeCloseTo(0.5, 1);
		expect(easeFn.easeInOutQuad(0.5)).toBeCloseTo(0.5, 1);
		expect(easeFn.easeInOutCubic(0.5)).toBeCloseTo(0.5, 1);
		expect(easeFn.easeInOutQuart(0.5)).toBeCloseTo(0.5, 1);
		expect(easeFn.easeInOutExpo(0.5)).toBeCloseTo(0.5, 1);
		expect(easeFn.easeInOutCirc(0.5)).toBeCloseTo(0.5, 1);
	});

	it("easeOutBack overshoots (returns > 1 before settling)", () => {
		// easeOutBack should overshoot around t=0.5-0.7
		const peak = easeFn.easeOutBack(0.5);
		expect(peak).toBeGreaterThan(1);
	});

	it("easeOutElastic oscillates (returns > 1 before settling)", () => {
		// Elastic overshoot happens early; check a range of values
		const values = Array.from({ length: 20 }, (_, i) => easeFn.easeOutElastic((i + 1) / 20));
		const hasOvershoot = values.some((v) => v > 1);
		expect(hasOvershoot).toBe(true);
	});

	it("easeOutBounce stays within 0-1 range", () => {
		for (let t = 0; t <= 1; t += 0.05) {
			const v = easeFn.easeOutBounce(t);
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThanOrEqual(1.001); // small float tolerance
		}
	});

	it("easeInBounce is the mirror of easeOutBounce", () => {
		expect(easeFn.easeInBounce(0.3)).toBeCloseTo(
			1 - easeFn.easeOutBounce(0.7),
			10,
		);
	});

	it("all functions are callable with any 0-1 input", () => {
		for (const [key, fn] of Object.entries(easeFn)) {
			// Should not throw
			expect(() => fn(0)).not.toThrow();
			expect(() => fn(0.5)).not.toThrow();
			expect(() => fn(1)).not.toThrow();
		}
	});
});

describe("cubicBezier()", () => {
	it("returns a cubic-bezier() CSS string", () => {
		expect(cubicBezier(0.4, 0, 0.2, 1)).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
	});

	it("handles negative values (overshoot)", () => {
		expect(cubicBezier(0.34, 1.56, 0.64, 1)).toBe(
			"cubic-bezier(0.34, 1.56, 0.64, 1)",
		);
	});
});

describe("steps()", () => {
	it("returns a steps() CSS string", () => {
		expect(steps(4)).toBe("steps(4)");
	});

	it("accepts a position parameter", () => {
		expect(steps(4, "start")).toBe("steps(4, start)");
		expect(steps(8, "end")).toBe("steps(8, end)");
	});
});

describe("linearEasing()", () => {
	it("returns a linear() CSS string", () => {
		const result = linearEasing(easeFn.linear);
		expect(result).toMatch(/^linear\(/);
		expect(result).toMatch(/\)$/);
	});

	it("generates default 41 sample points (0 through 40)", () => {
		const result = linearEasing(easeFn.linear);
		const values = result.slice(7, -1).split(", ");
		expect(values).toHaveLength(41);
	});

	it("accepts custom points parameter", () => {
		const result = linearEasing(easeFn.linear, 10);
		const values = result.slice(7, -1).split(", ");
		expect(values).toHaveLength(11); // 0 through 10
	});

	it("starts at 0 and ends at 1 for standard functions", () => {
		const result = linearEasing(easeFn.easeOutCubic);
		const values = result.slice(7, -1).split(", ").map(Number);
		expect(values[0]).toBeCloseTo(0, 4);
		expect(values[values.length - 1]).toBeCloseTo(1, 4);
	});

	it("produces overshoot values for elastic easing", () => {
		const result = linearEasing(easeFn.easeOutElastic);
		const values = result.slice(7, -1).split(", ").map(Number);
		const hasOvershoot = values.some((v) => v > 1);
		expect(hasOvershoot).toBe(true);
	});

	it("produces values in [0,1] range for bounce easing", () => {
		const result = linearEasing(easeFn.easeOutBounce);
		const values = result.slice(7, -1).split(", ").map(Number);
		for (const v of values) {
			expect(v).toBeGreaterThanOrEqual(-0.001);
			expect(v).toBeLessThanOrEqual(1.001);
		}
	});

	it("formats values to 4 decimal places", () => {
		const result = linearEasing(easeFn.easeInQuad, 5);
		const values = result.slice(7, -1).split(", ");
		for (const v of values) {
			expect(v).toMatch(/^-?\d+\.\d{4}$/);
		}
	});

	it("works with custom easing function", () => {
		const customFn = (t: number) => t * t * t;
		const result = linearEasing(customFn, 4);
		const values = result.slice(7, -1).split(", ").map(Number);
		expect(values[0]).toBeCloseTo(0, 4); // (0/4)^3 = 0
		expect(values[2]).toBeCloseTo(0.125, 4); // (2/4)^3 = 0.125
		expect(values[4]).toBeCloseTo(1, 4); // (4/4)^3 = 1
	});
});

describe("supportsLinearEasing()", () => {
	it("returns a boolean", () => {
		const result = supportsLinearEasing();
		expect(typeof result).toBe("boolean");
	});

	it("returns false when CSS global is unavailable", () => {
		const originalCSS = globalThis.CSS;
		vi.stubGlobal("CSS", undefined);
		expect(supportsLinearEasing()).toBe(false);
		vi.stubGlobal("CSS", originalCSS);
	});
});
