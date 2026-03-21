import { describe, it, expect, afterEach, vi } from "vitest";
import {
	getPressure,
	setPressure,
	onPressureChange,
	resolvePriorityAction,
	getModerateSpeedUp,
	setModerateSpeedUp,
	applyPriority,
	wrapWithPriority,
} from "../priority.js";
import { createMockControllable } from "./helpers.js";

// Reset module-level state after each test
afterEach(() => {
	setPressure("none");
	setModerateSpeedUp(2);
});

describe("getPressure / setPressure", () => {
	it("default pressure is 'none'", () => {
		expect(getPressure()).toBe("none");
	});

	it("sets pressure to 'moderate'", () => {
		setPressure("moderate");
		expect(getPressure()).toBe("moderate");
	});

	it("sets pressure to 'critical'", () => {
		setPressure("critical");
		expect(getPressure()).toBe("critical");
	});

	it("sets pressure back to 'none'", () => {
		setPressure("critical");
		setPressure("none");
		expect(getPressure()).toBe("none");
	});
});

describe("onPressureChange", () => {
	it("fires callback when pressure changes", () => {
		const callback = vi.fn();
		onPressureChange(callback);

		setPressure("moderate");
		expect(callback).toHaveBeenCalledWith("moderate");
		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("fires callback on multiple pressure changes", () => {
		const callback = vi.fn();
		onPressureChange(callback);

		setPressure("moderate");
		setPressure("critical");
		setPressure("none");

		expect(callback).toHaveBeenCalledTimes(3);
		expect(callback).toHaveBeenNthCalledWith(1, "moderate");
		expect(callback).toHaveBeenNthCalledWith(2, "critical");
		expect(callback).toHaveBeenNthCalledWith(3, "none");
	});

	it("does NOT fire callback when pressure set to same value", () => {
		const callback = vi.fn();
		onPressureChange(callback);

		setPressure("moderate");
		setPressure("moderate");
		setPressure("moderate");

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it("unsubscribe prevents future callbacks", () => {
		const callback = vi.fn();
		const unsub = onPressureChange(callback);

		setPressure("moderate");
		expect(callback).toHaveBeenCalledTimes(1);

		unsub();

		setPressure("critical");
		expect(callback).toHaveBeenCalledTimes(1); // not called again
	});

	it("supports multiple subscribers", () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();
		const callback3 = vi.fn();

		onPressureChange(callback1);
		onPressureChange(callback2);
		onPressureChange(callback3);

		setPressure("critical");

		expect(callback1).toHaveBeenCalledWith("critical");
		expect(callback2).toHaveBeenCalledWith("critical");
		expect(callback3).toHaveBeenCalledWith("critical");
	});

	it("multiple subscribers can unsubscribe independently", () => {
		const callback1 = vi.fn();
		const callback2 = vi.fn();
		const callback3 = vi.fn();

		const unsub1 = onPressureChange(callback1);
		onPressureChange(callback2);
		const unsub3 = onPressureChange(callback3);

		unsub1();
		unsub3();

		setPressure("moderate");

		expect(callback1).not.toHaveBeenCalled();
		expect(callback2).toHaveBeenCalledWith("moderate");
		expect(callback3).not.toHaveBeenCalled();
	});
});

describe("getModerateSpeedUp / setModerateSpeedUp", () => {
	it("default moderate speed-up is 2", () => {
		expect(getModerateSpeedUp()).toBe(2);
	});

	it("sets custom moderate speed-up", () => {
		setModerateSpeedUp(4);
		expect(getModerateSpeedUp()).toBe(4);
	});

	it("sets moderate speed-up to decimal value", () => {
		setModerateSpeedUp(2.5);
		expect(getModerateSpeedUp()).toBe(2.5);
	});

	it("sets moderate speed-up to 1 (no speed-up)", () => {
		setModerateSpeedUp(1);
		expect(getModerateSpeedUp()).toBe(1);
	});
});

describe("resolvePriorityAction - 3x3 matrix", () => {
	describe("pressure=none (all priorities → run)", () => {
		it("critical → run", () => {
			setPressure("none");
			expect(resolvePriorityAction("critical")).toBe("run");
		});

		it("normal → run", () => {
			setPressure("none");
			expect(resolvePriorityAction("normal")).toBe("run");
		});

		it("decorative → run", () => {
			setPressure("none");
			expect(resolvePriorityAction("decorative")).toBe("run");
		});
	});

	describe("pressure=moderate", () => {
		it("critical → run", () => {
			setPressure("moderate");
			expect(resolvePriorityAction("critical")).toBe("run");
		});

		it("normal → run", () => {
			setPressure("moderate");
			expect(resolvePriorityAction("normal")).toBe("run");
		});

		it("decorative → skip", () => {
			setPressure("moderate");
			expect(resolvePriorityAction("decorative")).toBe("skip");
		});
	});

	describe("pressure=critical", () => {
		it("critical → run", () => {
			setPressure("critical");
			expect(resolvePriorityAction("critical")).toBe("run");
		});

		it("normal → reduce", () => {
			setPressure("critical");
			expect(resolvePriorityAction("normal")).toBe("reduce");
		});

		it("decorative → skip", () => {
			setPressure("critical");
			expect(resolvePriorityAction("decorative")).toBe("skip");
		});
	});
});

describe("applyPriority", () => {
	it("with 'run' action: does nothing (no-op)", () => {
		setPressure("none"); // all priorities resolve to "run"
		const mock = createMockControllable();
		mock.play();

		applyPriority(mock, "critical");

		expect(mock.playState).toBe("running");
		expect(mock.playbackRate).toBe(1);
	});

	it("with 'skip' action: calls finish()", () => {
		setPressure("moderate"); // decorative resolves to "skip"
		const mock = createMockControllable();
		mock.play();

		applyPriority(mock, "decorative");

		expect(mock.playState).toBe("finished");
	});

	it("with 'reduce' action: sets playbackRate to moderateSpeedUp", () => {
		setPressure("critical"); // normal resolves to "reduce"
		const mock = createMockControllable();

		applyPriority(mock, "normal");

		expect(mock.playbackRate).toBe(2); // default moderateSpeedUp
	});

	it("with 'reduce' action: uses custom moderateSpeedUp", () => {
		setModerateSpeedUp(3.5);
		setPressure("critical"); // normal resolves to "reduce"
		const mock = createMockControllable();

		applyPriority(mock, "normal");

		expect(mock.playbackRate).toBe(3.5);
	});

	it("does not affect finished controllable", () => {
		setPressure("moderate");
		const mock = createMockControllable();
		mock.finish();

		applyPriority(mock, "decorative");

		expect(mock.playState).toBe("finished");
	});
});

describe("wrapWithPriority", () => {
	it("wraps factory and applies priority on call", () => {
		setPressure("critical");
		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);

		const wrapped = wrapWithPriority(stepFn, "normal");
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalledTimes(1);
		expect(ctrl).toBe(mock);
		expect(ctrl.playbackRate).toBe(2); // reduced
	});

	it("with 'run' action: returns unmodified controllable", () => {
		setPressure("none");
		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);

		const wrapped = wrapWithPriority(stepFn, "critical");
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalledTimes(1);
		expect(ctrl).toBe(mock);
		expect(ctrl.playState).toBe("idle");
		expect(ctrl.playbackRate).toBe(1);
	});

	it("with 'skip' action: finishes controllable", () => {
		setPressure("critical");
		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);

		const wrapped = wrapWithPriority(stepFn, "decorative");
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalledTimes(1);
		expect(ctrl).toBe(mock);
		expect(ctrl.playState).toBe("finished");
	});

	it("with 'reduce' action: sets custom playbackRate", () => {
		setModerateSpeedUp(5);
		setPressure("critical");
		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);

		const wrapped = wrapWithPriority(stepFn, "normal");
		const ctrl = wrapped();

		expect(stepFn).toHaveBeenCalledTimes(1);
		expect(ctrl.playbackRate).toBe(5);
	});

	it("can be called multiple times with updated pressure", () => {
		const mock1 = createMockControllable();
		const mock2 = createMockControllable();
		const stepFn = vi
			.fn()
			.mockReturnValueOnce(mock1)
			.mockReturnValueOnce(mock2);

		const wrapped = wrapWithPriority(stepFn, "decorative");

		setPressure("none");
		const ctrl1 = wrapped();
		expect(ctrl1.playState).toBe("idle"); // run action

		setPressure("moderate");
		const ctrl2 = wrapped();
		expect(ctrl2.playState).toBe("finished"); // skip action

		expect(stepFn).toHaveBeenCalledTimes(2);
	});

	it("respects pressure changes between wrapping and calling", () => {
		const mock = createMockControllable();
		const stepFn = vi.fn(() => mock);

		setPressure("none");
		const wrapped = wrapWithPriority(stepFn, "decorative");

		setPressure("critical"); // change pressure before calling
		const ctrl = wrapped();

		expect(ctrl.playState).toBe("finished"); // skip at critical pressure
	});
});
