import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { animate } from "../animate.js";
import { installWAAPIMock } from "./helpers.js";

describe("will-change lifecycle", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
	});

	afterEach(() => {
		waapi.restore();
	});

	it("sets will-change for transform property", () => {
		const el = document.createElement("div");
		animate(
			el,
			[{ transform: "scale(0)" }, { transform: "scale(1)" }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("transform");
	});

	it("sets will-change for opacity property", () => {
		const el = document.createElement("div");
		animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
		expect(el.style.willChange).toBe("opacity");
	});

	it("sets will-change for multiple compositor properties", () => {
		const el = document.createElement("div");
		animate(
			el,
			[
				{ transform: "scale(0)", opacity: 0 },
				{ transform: "scale(1)", opacity: 1 },
			],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("transform, opacity");
	});

	it("does not set will-change for layout properties", () => {
		const el = document.createElement("div");
		animate(
			el,
			[{ width: "0px" }, { width: "100px" }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("");
	});

	it("removes will-change after animation finishes", async () => {
		const el = document.createElement("div");
		const ctrl = animate(
			el,
			[{ opacity: 0 }, { opacity: 1 }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("opacity");

		ctrl.play();
		const finished = ctrl.finished;

		// Finish the WAAPI animation mock
		waapi.lastAnimation.finish();
		await finished;

		// will-change should be cleaned up
		await new Promise((r) => setTimeout(r, 0));
		expect(el.style.willChange).toBe("auto");
	});

	it("removes will-change on cancel", () => {
		const el = document.createElement("div");
		const ctrl = animate(
			el,
			[{ transform: "translateX(0)" }, { transform: "translateX(100px)" }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("transform");

		ctrl.cancel();
		expect(el.style.willChange).toBe("auto");
	});

	it("respects willChange: false opt-out", () => {
		const el = document.createElement("div");
		animate(
			el,
			[{ opacity: 0 }, { opacity: 1 }],
			{ duration: 300, willChange: false },
		);
		expect(el.style.willChange).toBe("");
	});

	it("does not set will-change for non-compositor-only animations", () => {
		const el = document.createElement("div");
		animate(
			el,
			[{ color: "red" }, { color: "blue" }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("");
	});

	it("sets will-change for filter property", () => {
		const el = document.createElement("div");
		animate(
			el,
			[{ filter: "blur(0px)" }, { filter: "blur(10px)" }],
			{ duration: 300 },
		);
		expect(el.style.willChange).toBe("filter");
	});

	it("handles mixed compositor and layout properties", () => {
		const el = document.createElement("div");
		animate(
			el,
			[
				{ transform: "scale(1)", width: "100px" },
				{ transform: "scale(2)", width: "200px" },
			],
			{ duration: 300 },
		);
		// Only compositor properties in will-change
		expect(el.style.willChange).toBe("transform");
	});
});
