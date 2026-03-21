import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStagger } from "../hooks/useStagger.js";
import { computeStaggerOffsets } from "../stagger.js";
import type { StepDefinition } from "../types.js";
import { createMockControllable } from "./helpers.js";

// Mock useReducedMotion
vi.mock("../hooks/useReducedMotion.js", () => ({
	useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from "../hooks/useReducedMotion.js";

const mockedUseReducedMotion = vi.mocked(useReducedMotion);

describe("computeStaggerOffsets", () => {
	it("basic config with from: 'start' produces increasing delays", () => {
		const offsets = computeStaggerOffsets(4, { each: 100, from: "start" });

		// from start: distances are [0, 1, 2, 3], max=3, normalized [0, 1/3, 2/3, 1]
		// total = 100 * 3 = 300, offsets = [0, 100, 200, 300]
		expect(offsets).toEqual([0, 100, 200, 300]);
	});

	it("from: 'end' reverses delay order", () => {
		const offsets = computeStaggerOffsets(4, { each: 100, from: "end" });

		// from end (index 3): distances are [3, 2, 1, 0], normalized [1, 2/3, 1/3, 0]
		// total = 300, offsets = [300, 200, 100, 0]
		expect(offsets).toEqual([300, 200, 100, 0]);
	});

	it("from: 'center' spreads from middle", () => {
		const offsets = computeStaggerOffsets(5, { each: 100, from: "center" });

		// center = 2 (index), distances = [2, 1, 0, 1, 2], max=2, normalized [1, 0.5, 0, 0.5, 1]
		// total = 100 * 4 = 400, offsets = [400, 200, 0, 200, 400]
		expect(offsets).toEqual([400, 200, 0, 200, 400]);
	});

	it("grid config computes 2D euclidean distances", () => {
		// 2x3 grid (2 rows, 3 cols) with 6 items, from start (0,0)
		const offsets = computeStaggerOffsets(6, {
			each: 100,
			from: "start",
			grid: [2, 3],
		});

		// Grid layout:
		// [0](0,0) [1](0,1) [2](0,2)
		// [3](1,0) [4](1,1) [5](1,2)
		// Distances from (0,0): [0, 1, 2, 1, sqrt(2), sqrt(5)]
		// max = sqrt(5) ~= 2.236
		// normalized, then * 100 * 5 = 500
		expect(offsets[0]).toBe(0); // origin
		expect(offsets[1]).toBeGreaterThan(0); // adjacent
		expect(offsets[2]).toBeGreaterThan(offsets[1]); // farther
		expect(offsets[5]).toBe(500); // farthest corner (max distance)
	});

	it("axis='x' restricts to column distance only", () => {
		const offsets = computeStaggerOffsets(6, {
			each: 100,
			from: "start",
			grid: [2, 3],
			axis: "x",
		});

		// axis=x: only column distance matters
		// Distances: [0, 1, 2, 0, 1, 2] (row distance ignored)
		// max = 2, normalized [0, 0.5, 1, 0, 0.5, 1]
		// total = 100 * 5 = 500
		expect(offsets[0]).toBe(0);
		expect(offsets[3]).toBe(0); // Same column as origin
		expect(offsets[1]).toEqual(offsets[4]); // Same column distance
		expect(offsets[2]).toEqual(offsets[5]); // Same column distance
	});

	it("axis='y' restricts to row distance only", () => {
		const offsets = computeStaggerOffsets(6, {
			each: 100,
			from: "start",
			grid: [2, 3],
			axis: "y",
		});

		// axis=y: only row distance matters
		// Distances: [0, 0, 0, 1, 1, 1] (col distance ignored)
		// max = 1, normalized [0, 0, 0, 1, 1, 1]
		// total = 500
		expect(offsets[0]).toBe(0);
		expect(offsets[1]).toBe(0);
		expect(offsets[2]).toBe(0);
		expect(offsets[3]).toBe(500);
		expect(offsets[4]).toBe(500);
		expect(offsets[5]).toBe(500);
	});

	it("ease function applied to normalized distances", () => {
		// Quadratic ease: t => t * t
		const offsets = computeStaggerOffsets(4, {
			each: 100,
			from: "start",
			ease: (t) => t * t,
		});

		// Linear distances [0, 1, 2, 3], normalized [0, 1/3, 2/3, 1]
		// Eased: [0, 1/9, 4/9, 1]
		// total = 300
		// offsets: [0, 300/9 = 33.33, 1200/9 = 133.33, 300]
		expect(offsets[0]).toBe(0);
		expect(offsets[1]).toBeCloseTo(100 / 3, 1); // ~33.33 (eased)
		expect(offsets[2]).toBeCloseTo(400 / 3, 1); // ~133.33 (eased)
		expect(offsets[3]).toBe(300);
	});

	it("single item returns [0]", () => {
		const offsets = computeStaggerOffsets(1, { each: 100, from: "start" });
		expect(offsets).toEqual([0]);
	});

	it("empty returns []", () => {
		const offsets = computeStaggerOffsets(0, { each: 100, from: "start" });
		expect(offsets).toEqual([]);
	});

	it("from: numeric index", () => {
		const offsets = computeStaggerOffsets(5, { each: 100, from: 1 });

		// origin = 1, distances = [1, 0, 1, 2, 3], max=3
		// normalized [1/3, 0, 1/3, 2/3, 1]
		// total = 400
		expect(offsets[1]).toBe(0); // origin
		expect(offsets[0]).toBeCloseTo(400 / 3, 1);
		expect(offsets[4]).toBe(400); // farthest
	});
});

describe("useStagger", () => {
	beforeEach(() => {
		mockedUseReducedMotion.mockReturnValue(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("basic config (just each) creates staggered animations", async () => {
		const mocks = [createMockControllable(), createMockControllable(), createMockControllable()];
		const steps: StepDefinition[] = mocks.map((m) => () => m);

		const { result } = renderHook(() => useStagger(steps, { each: 100 }));

		expect(result.current.state).toBe("idle");

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("running");
	});

	it("cancel on unmount does not throw", async () => {
		const mocks = [createMockControllable(), createMockControllable()];
		const steps: StepDefinition[] = mocks.map((m) => () => m);

		const { unmount } = renderHook(() => useStagger(steps, { each: 50 }));

		// Unmount should not throw
		await act(async () => {
			unmount();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});
	});

	it("state is reactive", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useStagger(steps, { each: 50 }));

		expect(result.current.state).toBe("idle");

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("running");

		act(() => {
			result.current.pause();
		});

		expect(result.current.state).toBe("paused");
	});

	it("advanced config with from: 'center' works", async () => {
		const mocks = [
			createMockControllable(),
			createMockControllable(),
			createMockControllable(),
			createMockControllable(),
			createMockControllable(),
		];
		const steps: StepDefinition[] = mocks.map((m) => () => m);

		const { result } = renderHook(() => useStagger(steps, { each: 100, from: "center" }));

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("running");
	});

	it("reduced motion policy: skip finishes immediately", async () => {
		mockedUseReducedMotion.mockReturnValue(true);
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() =>
			useStagger(steps, { each: 100 }, { reducedMotion: "skip" }),
		);

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("finished");
	});
});
