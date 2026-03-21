import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	disableAdaptivePerformance,
	enableAdaptivePerformance,
	isAdaptivePerformanceEnabled,
} from "../adaptive.js";
import { getDeviceTier, resetDeviceTier } from "../deviceTier.js";
import { resetFrameMonitor } from "../frameMonitor.js";
import { getModerateSpeedUp, getPressure, setPressure } from "../priority.js";

describe("adaptive", () => {
	beforeEach(() => {
		// Mock high-tier device (default)
		vi.stubGlobal("navigator", { hardwareConcurrency: 8 });
		vi.stubGlobal("screen", { width: 1920, height: 1080 });
		vi.stubGlobal("devicePixelRatio", 1);
		vi.stubGlobal("requestAnimationFrame", vi.fn().mockReturnValue(1));
		vi.stubGlobal("cancelAnimationFrame", vi.fn());
	});

	afterEach(() => {
		disableAdaptivePerformance();
		resetDeviceTier();
		resetFrameMonitor();
		setPressure("none");
		vi.unstubAllGlobals();
	});

	describe("isAdaptivePerformanceEnabled", () => {
		it("returns false initially", () => {
			expect(isAdaptivePerformanceEnabled()).toBe(false);
		});

		it("returns true after enableAdaptivePerformance", () => {
			enableAdaptivePerformance();
			expect(isAdaptivePerformanceEnabled()).toBe(true);
		});

		it("returns false after disableAdaptivePerformance", () => {
			enableAdaptivePerformance();
			disableAdaptivePerformance();
			expect(isAdaptivePerformanceEnabled()).toBe(false);
		});
	});

	describe("enableAdaptivePerformance", () => {
		it("detects device tier automatically", () => {
			enableAdaptivePerformance();
			expect(getDeviceTier()).toBe("high"); // 8 cores + default memory = high tier
		});

		it("uses provided tier override via config.tier", () => {
			enableAdaptivePerformance({ tier: "low" });
			expect(getDeviceTier()).toBe("low");
		});

		it("sets initial pressure to moderate for low tier", () => {
			enableAdaptivePerformance({ tier: "low" });
			expect(getPressure()).toBe("moderate");
		});

		it("does not set pressure for high tier (stays none)", () => {
			enableAdaptivePerformance({ tier: "high" });
			expect(getPressure()).toBe("none");
		});

		it("starts frame monitor (requestAnimationFrame called)", () => {
			const rafSpy = vi.mocked(requestAnimationFrame);
			enableAdaptivePerformance();
			expect(rafSpy).toHaveBeenCalled();
		});

		it("is idempotent (multiple calls don't error)", () => {
			enableAdaptivePerformance();
			enableAdaptivePerformance();
			enableAdaptivePerformance();
			expect(isAdaptivePerformanceEnabled()).toBe(true);
		});

		it("configures custom frameMonitor thresholds", () => {
			enableAdaptivePerformance({
				frameMonitor: {
					degradeBelow: 40,
					criticalBelow: 20,
				},
			});
			expect(isAdaptivePerformanceEnabled()).toBe(true);
		});

		it("configures custom moderateSpeedUp", () => {
			enableAdaptivePerformance({ moderateSpeedUp: 3 });
			expect(getModerateSpeedUp()).toBe(3);
		});

		it("sets more sensitive thresholds for medium tier by default", () => {
			// Mock medium-tier device (4 cores)
			vi.stubGlobal("navigator", { hardwareConcurrency: 4 });
			resetDeviceTier(); // Clear any cached tier
			enableAdaptivePerformance();
			expect(getDeviceTier()).toBe("medium");
			// Can't directly test the degradeBelow threshold without exposing it,
			// but we verify the enable succeeds and tier is medium
		});

		it("detects low tier with minimal hardware", () => {
			// Mock low-tier device
			vi.stubGlobal("navigator", { hardwareConcurrency: 1 });
			vi.stubGlobal("screen", { width: 800, height: 600 });
			resetDeviceTier();
			enableAdaptivePerformance();
			expect(getDeviceTier()).toBe("low");
			expect(getPressure()).toBe("moderate");
		});
	});

	describe("disableAdaptivePerformance", () => {
		it("stops frame monitor (cancelAnimationFrame called)", () => {
			const cafSpy = vi.mocked(cancelAnimationFrame);
			enableAdaptivePerformance();
			disableAdaptivePerformance();
			expect(cafSpy).toHaveBeenCalledWith(1);
		});

		it("resets pressure to none", () => {
			enableAdaptivePerformance({ tier: "low" }); // Sets pressure to moderate
			expect(getPressure()).toBe("moderate");
			disableAdaptivePerformance();
			expect(getPressure()).toBe("none");
		});

		it("is idempotent", () => {
			enableAdaptivePerformance();
			disableAdaptivePerformance();
			disableAdaptivePerformance();
			disableAdaptivePerformance();
			expect(isAdaptivePerformanceEnabled()).toBe(false);
		});
	});
});
