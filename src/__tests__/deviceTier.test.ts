import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import {
	detectDeviceTier,
	getDeviceTier,
	setDeviceTier,
	resetDeviceTier,
} from "../deviceTier.js";

describe("deviceTier", () => {
	afterEach(() => {
		resetDeviceTier();
		vi.unstubAllGlobals();
	});

	describe("detectDeviceTier", () => {
		it("returns 'high' for 8+ cores and 8+ GB memory", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+2) + memory(+2) + screen(0) = 4 → "high"
			expect(detectDeviceTier()).toBe("high");
		});

		it("returns 'high' for 16 cores and 16 GB memory with high DPR", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 16,
				deviceMemory: 16,
			});
			vi.stubGlobal("screen", { width: 2560, height: 1440 });
			vi.stubGlobal("window", { devicePixelRatio: 2 });

			// Score: cores(+2) + memory(+2) + screen(+1) = 5 → "high"
			expect(detectDeviceTier()).toBe("high");
		});

		it("returns 'medium' for 4 cores without deviceMemory", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				// deviceMemory is undefined (Firefox/Safari)
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+1) + memory(+1 for undefined) + screen(0) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("returns 'medium' for 4 cores and 4 GB memory", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				deviceMemory: 4,
			});
			vi.stubGlobal("screen", { width: 1366, height: 768 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+1) + memory(+1) + screen(0) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("returns 'low' for 2 cores and low memory", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
				deviceMemory: 2,
			});
			vi.stubGlobal("screen", { width: 1024, height: 768 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(0) + memory(0) + screen(-1) = -1 → "low"
			expect(detectDeviceTier()).toBe("low");
		});

		it("returns 'low' for 2 cores without deviceMemory and low resolution", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
			});
			vi.stubGlobal("screen", { width: 800, height: 600 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(0) + memory(+1 for undefined) + screen(-1) = 0 → "low"
			expect(detectDeviceTier()).toBe("low");
		});

		it("caches result across multiple calls", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			const firstCall = detectDeviceTier();
			expect(firstCall).toBe("high");

			// Change navigator to simulate low-end device
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
				deviceMemory: 2,
			});

			// Should still return cached "high" result
			const secondCall = detectDeviceTier();
			expect(secondCall).toBe("high");
		});

		it("handles missing navigator gracefully (SSR)", () => {
			// Stub navigator with undefined hardwareConcurrency to simulate SSR
			vi.stubGlobal("navigator", {
				hardwareConcurrency: undefined,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+1, undefined ?? 4 → 4) + memory(+1 for undefined) + screen(0) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("handles missing deviceMemory (returns medium-ish)", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 6,
				// deviceMemory explicitly undefined
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+1) + memory(+1 for undefined) + screen(0) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("factors in high screen resolution with DPR", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				deviceMemory: 4,
			});
			vi.stubGlobal("screen", { width: 2560, height: 1440 });
			vi.stubGlobal("window", { devicePixelRatio: 2 });

			// Score: cores(+1) + memory(+1) + screen(+1, 2560*1440*2 = 7.3M) = 3 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("factors in low screen resolution penalty", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				deviceMemory: 4,
			});
			vi.stubGlobal("screen", { width: 800, height: 600 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			// Score: cores(+1) + memory(+1) + screen(-1, 800*600 = 480K) = 1 → "low"
			expect(detectDeviceTier()).toBe("low");
		});

		it("handles missing screen gracefully", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				deviceMemory: 4,
			});
			// Stub screen with throwing getter to simulate missing screen
			vi.stubGlobal("screen", {
				get width() {
					throw new Error("screen not available");
				},
				get height() {
					throw new Error("screen not available");
				},
			});

			// Score: cores(+1) + memory(+1) + screen(0, error) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});

		it("handles missing devicePixelRatio gracefully", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 4,
				deviceMemory: 4,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: undefined });

			// Score: cores(+1) + memory(+1) + screen(0, DPR defaults to 1) = 2 → "medium"
			expect(detectDeviceTier()).toBe("medium");
		});
	});

	describe("getDeviceTier", () => {
		it("returns null before detection", () => {
			expect(getDeviceTier()).toBeNull();
		});

		it("returns cached tier after detection", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("high");
		});

		it("returns manual override when set", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
				deviceMemory: 2,
			});
			vi.stubGlobal("screen", { width: 1024, height: 768 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("low");

			setDeviceTier("high");
			expect(getDeviceTier()).toBe("high");
		});
	});

	describe("setDeviceTier", () => {
		it("manual override takes priority over detection", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
				deviceMemory: 2,
			});
			vi.stubGlobal("screen", { width: 1024, height: 768 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("low");

			setDeviceTier("high");
			expect(getDeviceTier()).toBe("high");
			expect(detectDeviceTier()).toBe("low"); // Detection still returns cached low
		});

		it("pass null to clear override", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			setDeviceTier("low");
			expect(getDeviceTier()).toBe("low");

			setDeviceTier(null);
			expect(getDeviceTier()).toBe("high"); // Returns to cached detection
		});

		it("override persists across multiple getDeviceTier calls", () => {
			setDeviceTier("medium");

			expect(getDeviceTier()).toBe("medium");
			expect(getDeviceTier()).toBe("medium");
			expect(getDeviceTier()).toBe("medium");
		});
	});

	describe("resetDeviceTier", () => {
		it("clears cached tier for re-detection", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("high");

			resetDeviceTier();
			expect(getDeviceTier()).toBeNull();
		});

		it("clears manual override", () => {
			setDeviceTier("low");
			expect(getDeviceTier()).toBe("low");

			resetDeviceTier();
			expect(getDeviceTier()).toBeNull();
		});

		it("allows fresh detection after reset", () => {
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 8,
				deviceMemory: 8,
			});
			vi.stubGlobal("screen", { width: 1920, height: 1080 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("high");

			resetDeviceTier();
			vi.unstubAllGlobals();

			// Simulate low-end device
			vi.stubGlobal("navigator", {
				hardwareConcurrency: 2,
				deviceMemory: 2,
			});
			vi.stubGlobal("screen", { width: 800, height: 600 });
			vi.stubGlobal("window", { devicePixelRatio: 1 });

			detectDeviceTier();
			expect(getDeviceTier()).toBe("low");
		});
	});
});
