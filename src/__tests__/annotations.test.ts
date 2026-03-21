import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	annotateAnimation,
	getPerformanceAnnotations,
	setPerformanceAnnotations,
} from "../annotations.js";
import { createMockControllable } from "./helpers.js";

describe("performance annotations", () => {
	let markSpy: ReturnType<typeof vi.fn>;
	let measureSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		markSpy = vi.fn();
		measureSpy = vi.fn();
		vi.stubGlobal("performance", {
			mark: markSpy,
			measure: measureSpy,
		});
		setPerformanceAnnotations(false);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("is disabled by default", () => {
		expect(getPerformanceAnnotations()).toBe(false);
	});

	it("can be enabled globally", () => {
		setPerformanceAnnotations(true);
		expect(getPerformanceAnnotations()).toBe(true);
	});

	it("does not create marks when disabled", () => {
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity"], 300, ctrl);
		expect(markSpy).not.toHaveBeenCalled();
	});

	it("creates start mark when enabled globally", () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity"], 300, ctrl);
		expect(markSpy).toHaveBeenCalledOnce();
		expect(markSpy.mock.calls[0][0]).toBe("flow:div:opacity:start");
	});

	it("creates start mark with __perf override", () => {
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["transform"], 200, ctrl, true);
		expect(markSpy).toHaveBeenCalledOnce();
		expect(markSpy.mock.calls[0][0]).toBe("flow:div:transform:start");
	});

	it("respects __perf: false when globally enabled", () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity"], 300, ctrl, false);
		expect(markSpy).not.toHaveBeenCalled();
	});

	it("includes detail in start mark", () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity", "transform"], 500, ctrl);
		expect(markSpy.mock.calls[0][1]).toEqual({
			detail: {
				element: "div",
				properties: ["opacity", "transform"],
				duration: 500,
			},
		});
	});

	it("uses element ID when available", () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		el.id = "my-box";
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity"], 300, ctrl);
		expect(markSpy.mock.calls[0][0]).toBe("flow:my-box:opacity:start");
	});

	it("creates end mark and measure on finish", async () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["opacity"], 300, ctrl);

		ctrl._resolve();
		await new Promise((r) => setTimeout(r, 0));

		// End mark
		expect(markSpy).toHaveBeenCalledTimes(2);
		expect(markSpy.mock.calls[1][0]).toBe("flow:div:opacity:end");

		// Measure
		expect(measureSpy).toHaveBeenCalledOnce();
		expect(measureSpy.mock.calls[0][0]).toBe("flow:div:opacity");
		expect(measureSpy.mock.calls[0][1]).toBe("flow:div:opacity:start");
		expect(measureSpy.mock.calls[0][2]).toBe("flow:div:opacity:end");
	});

	it("handles multiple properties in mark names", () => {
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		annotateAnimation(el, ["transform", "opacity", "filter"], 300, ctrl);
		expect(markSpy.mock.calls[0][0]).toBe(
			"flow:div:transform,opacity,filter:start",
		);
	});

	it("does not throw when performance API unavailable", () => {
		vi.stubGlobal("performance", undefined);
		setPerformanceAnnotations(true);
		const el = document.createElement("div");
		const ctrl = createMockControllable();
		expect(() =>
			annotateAnimation(el, ["opacity"], 300, ctrl),
		).not.toThrow();
	});
});
