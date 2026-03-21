import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { decomposeTransforms, validateDecomposePosition } from "../decompose";

describe("decomposeTransforms - Keyframe[] format", () => {
	let mockElement: HTMLElement;

	beforeEach(() => {
		mockElement = document.createElement("div");
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("converts left to translateX", () => {
		const input: Keyframe[] = [{ left: "0px" }, { left: "100px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(0px)" },
			{ transform: "translateX(100px)" },
		]);
	});

	it("converts top to translateY", () => {
		const input: Keyframe[] = [{ top: "0px" }, { top: "50px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateY(0px)" },
			{ transform: "translateY(50px)" },
		]);
	});

	it("converts right to negative translateX", () => {
		const input: Keyframe[] = [{ right: "50px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ transform: "translateX(-50px)" }]);
	});

	it("converts bottom to negative translateY", () => {
		const input: Keyframe[] = [{ bottom: "30px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ transform: "translateY(-30px)" }]);
	});

	it("converts width to scaleX relative to computed width", () => {
		// computedWidth = 200px, target = 400px → scaleX(2)
		const input: Keyframe[] = [{ width: "400px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ transform: "scaleX(2)" }]);
	});

	it("converts height to scaleY relative to computed height", () => {
		// computedHeight = 100px, target = 200px → scaleY(2)
		const input: Keyframe[] = [{ height: "200px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ transform: "scaleY(2)" }]);
	});

	it("preserves non-layout properties", () => {
		const input: Keyframe[] = [
			{ left: "10px", opacity: 0 },
			{ left: "100px", opacity: 1, color: "red" },
		];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(10px)", opacity: 0 },
			{ transform: "translateX(100px)", opacity: 1, color: "red" },
		]);
	});

	it("preserves existing transform", () => {
		const input: Keyframe[] = [
			{ left: "10px", transform: "rotate(45deg)" },
		];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		// Order depends on object property iteration order
		expect(result[0]).toHaveProperty("transform");
		expect(result[0].transform).toContain("translateX(10px)");
		expect(result[0].transform).toContain("rotate(45deg)");
	});

	it("preserves metadata keys (offset, easing, composite)", () => {
		const input: Keyframe[] = [
			{ left: "0px", offset: 0, easing: "ease-in" },
			{ left: "100px", offset: 1, composite: "add" },
		];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(0px)", offset: 0, easing: "ease-in" },
			{ transform: "translateX(100px)", offset: 1, composite: "add" },
		]);
	});

	it("handles multiple layout properties in one keyframe", () => {
		const input: Keyframe[] = [
			{ left: "10px", top: "20px", width: "400px" },
		];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(10px) translateY(20px) scaleX(2)" },
		]);
	});

	it("returns new array without mutating input", () => {
		const input: Keyframe[] = [{ left: "0px" }, { left: "100px" }];
		const inputCopy = JSON.parse(JSON.stringify(input));
		const result = decomposeTransforms(input, mockElement);

		expect(result).not.toBe(input);
		expect(input).toEqual(inputCopy);
	});

	it("handles percentage values", () => {
		const input: Keyframe[] = [{ left: "50%" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ transform: "translateX(50%)" }]);
	});

	it("handles negative values", () => {
		const input: Keyframe[] = [{ left: "-25px", top: "-10px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(-25px) translateY(-10px)" },
		]);
	});

	it("handles decimal values", () => {
		const input: Keyframe[] = [{ left: "12.5px", width: "300px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(12.5px) scaleX(1.5)" },
		]);
	});
});

describe("decomposeTransforms - PropertyIndexedKeyframes format", () => {
	let mockElement: HTMLElement;

	beforeEach(() => {
		mockElement = document.createElement("div");
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("converts left array to Keyframe[] with translateX", () => {
		const input: PropertyIndexedKeyframes = { left: ["0px", "100px"] };
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(Array.isArray(result)).toBe(true);
		expect(result).toEqual([
			{ transform: "translateX(0px)" },
			{ transform: "translateX(100px)" },
		]);
	});

	it("preserves non-layout properties in PropertyIndexed format", () => {
		const input: PropertyIndexedKeyframes = {
			left: ["0px", "100px"],
			opacity: [0, 1],
		};
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(0px)", opacity: 0 },
			{ transform: "translateX(100px)", opacity: 1 },
		]);
	});

	it("returns original if no decomposable properties", () => {
		const input: PropertyIndexedKeyframes = {
			opacity: [0, 1],
			color: ["red", "blue"],
		};
		const result = decomposeTransforms(input, mockElement);

		expect(result).toBe(input);
	});

	it("handles mixed array and scalar values", () => {
		const input: PropertyIndexedKeyframes = {
			left: ["0px", "100px"],
			easing: "ease-in-out",
		};
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([
			{ transform: "translateX(0px)", easing: "ease-in-out" },
			{ transform: "translateX(100px)", easing: "ease-in-out" },
		]);
	});
});

describe("validateDecomposePosition", () => {
	let mockElement: HTMLElement;

	beforeEach(() => {
		mockElement = document.createElement("div");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns true for position: relative", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		expect(validateDecomposePosition(mockElement)).toBe(true);
	});

	it("returns true for position: absolute", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			position: "absolute",
		} as unknown as CSSStyleDeclaration);

		expect(validateDecomposePosition(mockElement)).toBe(true);
	});

	it("returns true for position: fixed", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			position: "fixed",
		} as unknown as CSSStyleDeclaration);

		expect(validateDecomposePosition(mockElement)).toBe(true);
	});

	it("returns true for position: sticky", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			position: "sticky",
		} as unknown as CSSStyleDeclaration);

		expect(validateDecomposePosition(mockElement)).toBe(true);
	});

	it("returns false and warns for position: static", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			position: "static",
		} as unknown as CSSStyleDeclaration);
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = validateDecomposePosition(mockElement);

		expect(result).toBe(false);
		expect(warnSpy).toHaveBeenCalledWith(
			"[flow] decompose: element has position:static. Transform translations require position:relative, absolute, or fixed.",
		);
	});
});

describe("decomposeTransforms - edge cases", () => {
	let mockElement: HTMLElement;

	beforeEach(() => {
		mockElement = document.createElement("div");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("passes width through unchanged for zero-width element", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "0px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		const input: Keyframe[] = [{ width: "200px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ width: "200px" }]);
	});

	it("passes height through unchanged for zero-height element", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "0px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		const input: Keyframe[] = [{ height: "100px" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ height: "100px" }]);
	});

	it("passes calc() values through unchanged", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		const input: Keyframe[] = [{ left: "calc(100% - 50px)" }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ left: "calc(100% - 50px)" }]);
	});

	it("returns empty array for empty keyframes", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		const input: Keyframe[] = [];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([]);
	});

	it("handles keyframes with no decomposable properties", () => {
		vi.spyOn(window, "getComputedStyle").mockReturnValue({
			width: "200px",
			height: "100px",
			position: "relative",
		} as unknown as CSSStyleDeclaration);

		const input: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
		const result = decomposeTransforms(input, mockElement) as Keyframe[];

		expect(result).toEqual([{ opacity: 0 }, { opacity: 1 }]);
	});
});
