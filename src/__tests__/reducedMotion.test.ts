import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	applyReducedMotion,
	crossfadeKeyframes,
	getReducedMotionPolicy,
	getReducePlaybackRate,
	setReducedMotionPolicy,
	shouldApplyReducedMotion,
	wrapWithPolicy,
} from "../reducedMotion.js";
import { createMockControllable, installWAAPIMock } from "./helpers.js";

// Mock matchMedia for controlling prefers-reduced-motion
let matchMediaMatches = false;

beforeEach(() => {
	matchMediaMatches = false;
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: query.includes("prefers-reduced-motion") && matchMediaMatches,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn(),
		})),
	);
	// Reset global policy and reduce rate between tests
	setReducedMotionPolicy("respect", { reduceRate: 5 });
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("setReducedMotionPolicy / getReducedMotionPolicy", () => {
	it("default policy is 'respect'", () => {
		expect(getReducedMotionPolicy()).toBe("respect");
	});

	it("sets the global policy", () => {
		setReducedMotionPolicy("skip");
		expect(getReducedMotionPolicy()).toBe("skip");

		setReducedMotionPolicy("reduce");
		expect(getReducedMotionPolicy()).toBe("reduce");

		setReducedMotionPolicy("crossfade");
		expect(getReducedMotionPolicy()).toBe("crossfade");
	});

	it("sets the reduce playback rate via options", () => {
		setReducedMotionPolicy("reduce", { reduceRate: 10 });
		expect(getReducePlaybackRate()).toBe(10);
	});

	it("default reduce playback rate is 5", () => {
		expect(getReducePlaybackRate()).toBe(5);
	});
});

describe("shouldApplyReducedMotion", () => {
	it("returns false when policy is 'respect' (even with OS preference)", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("respect");
		expect(shouldApplyReducedMotion()).toBe(false);
	});

	it("returns false when matchMedia does not match (even with policy set)", () => {
		matchMediaMatches = false;
		setReducedMotionPolicy("skip");
		expect(shouldApplyReducedMotion()).toBe(false);
	});

	it("returns true when matchMedia matches AND policy is not 'respect'", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("skip");
		expect(shouldApplyReducedMotion()).toBe(true);
	});

	it("returns true for all non-respect policies when OS preference set", () => {
		matchMediaMatches = true;

		setReducedMotionPolicy("reduce");
		expect(shouldApplyReducedMotion()).toBe(true);

		setReducedMotionPolicy("crossfade");
		expect(shouldApplyReducedMotion()).toBe(true);
	});
});

describe("crossfadeKeyframes", () => {
	it("strips transform properties from Keyframe[] and keeps opacity", () => {
		const input: Keyframe[] = [
			{ transform: "translateX(0px)", opacity: 0 },
			{ transform: "translateX(100px)", opacity: 1 },
		];
		const result = crossfadeKeyframes(input) as Keyframe[];

		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ opacity: 0 });
		expect(result[1]).toEqual({ opacity: 1 });
	});

	it("generates opacity fade when no opacity in source Keyframe[]", () => {
		const input: Keyframe[] = [{ transform: "scale(0)" }, { transform: "scale(1)" }];
		const result = crossfadeKeyframes(input) as Keyframe[];

		expect(result).toEqual([{ opacity: 0 }, { opacity: 1 }]);
	});

	it("strips multiple motion properties", () => {
		const input: Keyframe[] = [
			{ transform: "rotate(0)", top: "0px", left: "0px", opacity: 0.5 },
			{ transform: "rotate(360deg)", top: "100px", left: "100px", opacity: 1 },
		];
		const result = crossfadeKeyframes(input) as Keyframe[];

		expect(result[0]).toEqual({ opacity: 0.5 });
		expect(result[1]).toEqual({ opacity: 1 });
	});

	it("preserves offset/easing/composite in Keyframe[]", () => {
		const input: Keyframe[] = [
			{ transform: "translateX(0)", opacity: 0, offset: 0, easing: "ease-in" },
			{ transform: "translateX(100px)", opacity: 1, offset: 1 },
		];
		const result = crossfadeKeyframes(input) as Keyframe[];

		expect(result[0]).toEqual({ opacity: 0, offset: 0, easing: "ease-in" });
		expect(result[1]).toEqual({ opacity: 1, offset: 1 });
	});

	it("handles PropertyIndexedKeyframes format with opacity", () => {
		const input: PropertyIndexedKeyframes = {
			transform: ["translateX(0)", "translateX(100px)"],
			opacity: ["0", "1"],
		};
		const result = crossfadeKeyframes(input) as PropertyIndexedKeyframes;

		expect(result.transform).toBeUndefined();
		expect(result.opacity).toEqual(["0", "1"]);
	});

	it("generates opacity for PropertyIndexedKeyframes when none exists", () => {
		const input: PropertyIndexedKeyframes = {
			transform: ["scale(0)", "scale(1)"],
		};
		const result = crossfadeKeyframes(input) as PropertyIndexedKeyframes;

		expect(result.transform).toBeUndefined();
		expect(result.opacity).toEqual(["0", "1"]);
	});
});

describe("applyReducedMotion", () => {
	it("with 'skip' calls finish() on the controllable", () => {
		const mock = createMockControllable();
		mock.play();
		applyReducedMotion(mock, "skip");
		expect(mock.playState).toBe("finished");
	});

	it("with 'reduce' sets playbackRate on the controllable", () => {
		const mock = createMockControllable();
		applyReducedMotion(mock, "reduce");
		expect(mock.playbackRate).toBe(5);
	});

	it("with 'reduce' uses custom reduceRate", () => {
		setReducedMotionPolicy("reduce", { reduceRate: 10 });
		const mock = createMockControllable();
		applyReducedMotion(mock, "reduce");
		expect(mock.playbackRate).toBe(10);
	});

	it("with 'respect' does nothing", () => {
		const mock = createMockControllable();
		applyReducedMotion(mock, "respect");
		expect(mock.playState).toBe("idle");
		expect(mock.playbackRate).toBe(1);
	});

	it("with 'crossfade' is a no-op (warns)", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const mock = createMockControllable();
		mock.play();
		applyReducedMotion(mock, "crossfade");
		// Should NOT finish or change playbackRate
		expect(mock.playState).toBe("running");
		expect(mock.playbackRate).toBe(1);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("crossfade"));
		warnSpy.mockRestore();
	});
});

describe("wrapWithPolicy", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
	});

	afterEach(() => {
		waapi.restore();
	});

	it("with 'crossfade': transforms keyframes and creates animate() with opacity-only keyframes", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("crossfade");

		const el = document.createElement("div");
		const originalKeyframes: Keyframe[] = [
			{ transform: "translateX(0)" },
			{ transform: "translateX(100px)" },
		];
		const opts = { duration: 300 };
		const originalStepFn = vi.fn(() => {
			throw new Error("should not be called");
		});

		const wrapped = wrapWithPolicy(originalStepFn, originalKeyframes, opts, el);
		const ctrl = wrapped();

		// The original step function should NOT have been called
		expect(originalStepFn).not.toHaveBeenCalled();

		// A new animate() call should have been made with opacity-only keyframes
		expect(waapi.spy).toHaveBeenCalledWith(
			[{ opacity: 0 }, { opacity: 1 }],
			expect.objectContaining({ duration: 300, fill: "forwards" }),
		);

		// Should return a valid controllable
		expect(ctrl.playState).toBeDefined();
	});

	it("with 'skip': calls finish() on created controllable", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("skip");

		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);
		const el = document.createElement("div");
		const keyframes: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

		const wrapped = wrapWithPolicy(stepFn, keyframes, { duration: 300 }, el);
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalled();
		expect(ctrl.playState).toBe("finished");
	});

	it("with 'reduce': sets playbackRate on created controllable", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("reduce");

		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);
		const el = document.createElement("div");
		const keyframes: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

		const wrapped = wrapWithPolicy(stepFn, keyframes, { duration: 300 }, el);
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalled();
		expect(ctrl.playbackRate).toBe(5);
	});

	it("with 'respect': returns original step unchanged", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("respect");

		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);
		const el = document.createElement("div");
		const keyframes: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

		const wrapped = wrapWithPolicy(stepFn, keyframes, { duration: 300 }, el);
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalled();
		expect(ctrl).toBe(mock);
		expect(ctrl.playbackRate).toBe(1); // unchanged
	});

	it("when prefers-reduced-motion NOT set: returns original step regardless of policy", () => {
		matchMediaMatches = false;
		setReducedMotionPolicy("crossfade");

		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);
		const el = document.createElement("div");
		const keyframes: Keyframe[] = [
			{ transform: "translateX(0)" },
			{ transform: "translateX(100px)" },
		];

		const wrapped = wrapWithPolicy(stepFn, keyframes, { duration: 300 }, el);
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalled();
		expect(ctrl).toBe(mock);
	});

	it("with 'reduce' uses custom reduceRate", () => {
		matchMediaMatches = true;
		setReducedMotionPolicy("reduce", { reduceRate: 8 });

		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);
		const el = document.createElement("div");
		const keyframes: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

		const wrapped = wrapWithPolicy(stepFn, keyframes, { duration: 300 }, el);
		const ctrl = wrapped();

		expect(ctrl.playbackRate).toBe(8);
	});
});
