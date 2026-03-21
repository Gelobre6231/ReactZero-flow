import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	extractAnimatedProperties,
	getCompositorProperties,
	warnLayoutProperties,
} from "../properties.js";

describe("extractAnimatedProperties", () => {
	it("extracts properties from Keyframe[] format", () => {
		const keyframes: Keyframe[] = [
			{ opacity: 0, transform: "scale(0)" },
			{ opacity: 1, transform: "scale(1)" },
		];
		const result = extractAnimatedProperties(keyframes);
		expect(result).toContain("opacity");
		expect(result).toContain("transform");
		expect(result).toHaveLength(2);
	});

	it("extracts properties from PropertyIndexedKeyframes format", () => {
		const keyframes: PropertyIndexedKeyframes = {
			opacity: [0, 1],
			transform: ["translateX(0)", "translateX(100px)"],
		};
		const result = extractAnimatedProperties(keyframes);
		expect(result).toContain("opacity");
		expect(result).toContain("transform");
		expect(result).toHaveLength(2);
	});

	it("skips metadata keys (offset, easing, composite)", () => {
		const keyframes: Keyframe[] = [
			{ opacity: 0, offset: 0, easing: "ease-in", composite: "replace" },
			{ opacity: 1, offset: 1 },
		];
		const result = extractAnimatedProperties(keyframes);
		expect(result).toEqual(["opacity"]);
	});

	it("skips metadata keys in PropertyIndexedKeyframes", () => {
		const keyframes = {
			opacity: [0, 1],
			easing: ["ease-in", "ease-out"],
			composite: ["replace", "replace"],
		} as PropertyIndexedKeyframes;
		const result = extractAnimatedProperties(keyframes);
		expect(result).toEqual(["opacity"]);
	});

	it("deduplicates properties across multiple keyframes", () => {
		const keyframes: Keyframe[] = [
			{ opacity: 0 },
			{ opacity: 0.5 },
			{ opacity: 1 },
		];
		const result = extractAnimatedProperties(keyframes);
		expect(result).toEqual(["opacity"]);
	});

	it("handles empty keyframes array", () => {
		const result = extractAnimatedProperties([]);
		expect(result).toEqual([]);
	});

	it("handles empty PropertyIndexedKeyframes object", () => {
		const result = extractAnimatedProperties({} as PropertyIndexedKeyframes);
		expect(result).toEqual([]);
	});

	it("extracts layout properties", () => {
		const keyframes: Keyframe[] = [
			{ width: "0px", top: "0px" },
			{ width: "100px", top: "50px" },
		];
		const result = extractAnimatedProperties(keyframes);
		expect(result).toContain("width");
		expect(result).toContain("top");
	});
});

describe("getCompositorProperties", () => {
	it("returns compositor-tier properties", () => {
		const result = getCompositorProperties([
			"transform",
			"opacity",
			"filter",
		]);
		expect(result).toEqual(["transform", "opacity", "filter"]);
	});

	it("filters out non-compositor properties", () => {
		const result = getCompositorProperties([
			"transform",
			"width",
			"opacity",
			"color",
		]);
		expect(result).toEqual(["transform", "opacity"]);
	});

	it("returns empty array when no compositor properties", () => {
		const result = getCompositorProperties(["width", "height", "color"]);
		expect(result).toEqual([]);
	});

	it("recognizes individual transform properties", () => {
		const result = getCompositorProperties(["translate", "rotate", "scale"]);
		expect(result).toEqual(["translate", "rotate", "scale"]);
	});

	it("recognizes backdrop-filter", () => {
		const result = getCompositorProperties(["backdrop-filter"]);
		expect(result).toEqual(["backdrop-filter"]);
	});

	it("recognizes offset-distance", () => {
		const result = getCompositorProperties(["offset-distance"]);
		expect(result).toEqual(["offset-distance"]);
	});
});

describe("warnLayoutProperties", () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;
	const originalEnv = process.env.NODE_ENV;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		process.env.NODE_ENV = "development";
	});

	afterEach(() => {
		warnSpy.mockRestore();
		process.env.NODE_ENV = originalEnv;
	});

	it("warns for layout properties", () => {
		warnLayoutProperties(["width", "opacity"]);
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain("[flow]");
		expect(warnSpy.mock.calls[0][0]).toContain("width");
	});

	it("does not warn for compositor properties only", () => {
		warnLayoutProperties(["transform", "opacity", "filter"]);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("does not warn for empty properties", () => {
		warnLayoutProperties([]);
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it("includes GPU-friendly alternatives in warning", () => {
		warnLayoutProperties(["top", "left"]);
		expect(warnSpy).toHaveBeenCalledOnce();
		const msg = warnSpy.mock.calls[0][0] as string;
		expect(msg).toContain("translateY()");
		expect(msg).toContain("translateX()");
	});

	it("warns for multiple layout properties", () => {
		warnLayoutProperties(["width", "height", "padding"]);
		expect(warnSpy).toHaveBeenCalledOnce();
		const msg = warnSpy.mock.calls[0][0] as string;
		expect(msg).toContain("width");
		expect(msg).toContain("height");
		expect(msg).toContain("padding");
	});

	it("includes properties without alternatives", () => {
		warnLayoutProperties(["font-size"]);
		expect(warnSpy).toHaveBeenCalledOnce();
		const msg = warnSpy.mock.calls[0][0] as string;
		expect(msg).toContain("font-size");
	});

	it("does not warn in production", () => {
		process.env.NODE_ENV = "production";
		warnLayoutProperties(["width"]);
		expect(warnSpy).not.toHaveBeenCalled();
	});
});
