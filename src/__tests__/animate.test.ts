import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { installWAAPIMock } from "./helpers.js";

describe("animate", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
	});

	afterEach(() => {
		waapi.restore();
	});

	it("returns a Controllable with initial playState 'paused' (WAAPI paused at creation)", () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		// After creation, animation is paused (not auto-playing)
		expect(ctrl.playState).toBe("paused");
	});

	it("play() starts the animation", () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		const playSpy = vi.spyOn(waapi.lastAnimation, "play");

		ctrl.play();
		expect(playSpy).toHaveBeenCalled();
		expect(ctrl.playState).toBe("running");
	});

	it("pause() pauses the animation", () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		ctrl.play();

		const pauseSpy = vi.spyOn(waapi.lastAnimation, "pause");
		ctrl.pause();
		expect(pauseSpy).toHaveBeenCalled();
		expect(ctrl.playState).toBe("paused");
	});

	it("cancel() cancels without throwing", () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		ctrl.play();

		expect(() => ctrl.cancel()).not.toThrow();
		expect(ctrl.playState).toBe("idle");
	});

	it("finished resolves after animation completes", async () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		ctrl.play();

		waapi.lastAnimation.finish();

		await expect(ctrl.finished).resolves.toBeUndefined();
	});

	it("finished resolves cleanly after cancel (no AbortError rejection)", async () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		ctrl.play();

		ctrl.cancel();

		// Should resolve, not reject
		await expect(ctrl.finished).resolves.toBeUndefined();
	});

	it("commitStyles is called on finish", async () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		const commitSpy = vi.spyOn(waapi.lastAnimation, "commitStyles");

		ctrl.play();
		waapi.lastAnimation.finish();

		// Wait for the .then() handler to run
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(commitSpy).toHaveBeenCalled();
	});

	it("animation.cancel() is called after commitStyles on finish (release pattern)", async () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		const callOrder: string[] = [];

		vi.spyOn(waapi.lastAnimation, "commitStyles").mockImplementation(() => {
			callOrder.push("commitStyles");
		});
		vi.spyOn(waapi.lastAnimation, "cancel").mockImplementation(() => {
			callOrder.push("cancel");
		});

		ctrl.play();
		waapi.lastAnimation.finish();

		// Wait for the .then() handler to run
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(callOrder).toEqual(["commitStyles", "cancel"]);
	});

	it("cancel() does NOT call commitStyles", async () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		const commitSpy = vi.spyOn(waapi.lastAnimation, "commitStyles");

		ctrl.play();
		ctrl.cancel();

		// Wait for any potential .then() handlers
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(commitSpy).not.toHaveBeenCalled();
	});

	it("onStateChange callback is called on state transitions", () => {
		const el = document.createElement("div");
		const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);
		const states: string[] = [];

		ctrl.onStateChange(() => {
			states.push(ctrl.playState);
		});

		ctrl.play();
		ctrl.pause();
		ctrl.cancel();

		expect(states).toContain("running");
		expect(states).toContain("paused");
		expect(states).toContain("idle");
	});

	it("passes options to Element.animate with fill forced to forwards", () => {
		const el = document.createElement("div");
		animate(el, [{ opacity: 0 }, { opacity: 1 }], {
			duration: 300,
			easing: "ease-in",
		});

		expect(waapi.spy).toHaveBeenCalledWith(
			[{ opacity: 0 }, { opacity: 1 }],
			expect.objectContaining({
				duration: 300,
				easing: "ease-in",
				fill: "forwards",
			}),
		);
	});
});
