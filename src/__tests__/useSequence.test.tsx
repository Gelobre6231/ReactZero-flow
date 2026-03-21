import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSequence } from "../hooks/useSequence.js";
import type { StepDefinition } from "../types.js";
import { createMockControllable } from "./helpers.js";

// Mock useReducedMotion -- default to false (no reduced motion)
vi.mock("../hooks/useReducedMotion.js", () => ({
	useReducedMotion: vi.fn(() => false),
}));

// Get the mock reference so tests can change the return value
import { useReducedMotion } from "../hooks/useReducedMotion.js";

const mockedUseReducedMotion = vi.mocked(useReducedMotion);

describe("useSequence", () => {
	beforeEach(() => {
		mockedUseReducedMotion.mockReturnValue(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns play/pause/cancel/state with idle initial state", () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps));

		expect(result.current.state).toBe("idle");
		expect(typeof result.current.play).toBe("function");
		expect(typeof result.current.pause).toBe("function");
		expect(typeof result.current.cancel).toBe("function");
	});

	it("play() transitions state to running", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps));

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");
	});

	it("finishes after all steps complete", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps));

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");

		await act(async () => {
			mock._resolve();
			// Multiple flushes for promise chain through sequence -> createControllable
			for (let i = 0; i < 8; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("finished");
	});

	it("pause and resume", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps));

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");

		act(() => {
			result.current.pause();
		});

		expect(result.current.state).toBe("paused");

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");
	});

	it("cancel returns to idle", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps));

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");

		await act(async () => {
			result.current.cancel();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("idle");
	});

	it("unmount cancels the sequence", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { unmount } = renderHook(() => useSequence(steps));

		// The useEffect cleanup calls seq.cancel() on unmount.
		// Since seq is a createControllable wrapper, its cancel() calls
		// controls.cancel() which calls activeChild?.cancel(), which is our mock.
		// But the sequence hasn't started, so no child is active yet.
		// Verify unmount doesn't throw (cleanup runs safely).
		unmount();

		// After unmount with a playing sequence:
		const mock2 = createMockControllable();
		const steps2: StepDefinition[] = [() => mock2];

		const { result: result2, unmount: unmount2 } = renderHook(() => useSequence(steps2));

		await act(async () => {
			result2.current.play();
			await Promise.resolve();
		});

		expect(result2.current.state).toBe("running");

		// Unmount while running -- should cancel
		await act(async () => {
			unmount2();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// The mock's cancel should have been called by the sequence's cleanup
		expect(mock2.playState).toBe("idle");
	});

	it("works in React Strict Mode", async () => {
		const mocks = [createMockControllable(), createMockControllable()];
		let callCount = 0;
		const factory: StepDefinition = () => {
			const m = mocks[callCount] ?? createMockControllable();
			callCount++;
			return m;
		};

		const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;

		const { result } = renderHook(() => useSequence([factory]), { wrapper });

		// Should not throw, should be in idle state
		expect(result.current.state).toBe("idle");

		// Should be able to play without errors
		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");
	});

	it("autoPlay starts playing on mount", async () => {
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		let _hookResult: ReturnType<typeof useSequence> | undefined;

		await act(async () => {
			const { result } = renderHook(() => useSequence(steps, { autoPlay: true }));
			_hookResult = result.current;
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// The mock should have been played
		expect(mock.playState).toBe("running");
	});

	it("reduced motion skip: finish instead of play on the sequence", async () => {
		mockedUseReducedMotion.mockReturnValue(true);
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps, { reducedMotion: "skip" }));

		// play() with reduced motion should call seq.finish()
		// This finishes the sequence controllable, which aborts+cancels internally
		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// The sequence should be finished (finish() was called on it)
		expect(result.current.state).toBe("finished");
	});

	it("reduced motion reduce: plays at high speed instead of skipping", async () => {
		mockedUseReducedMotion.mockReturnValue(true);
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		const { result } = renderHook(() => useSequence(steps, { reducedMotion: "reduce" }));

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// 'reduce' now plays at high playbackRate instead of skipping
		expect(result.current.state).toBe("running");
	});

	it("autoPlay with reduced motion skip finishes immediately", async () => {
		mockedUseReducedMotion.mockReturnValue(true);
		const mock = createMockControllable();
		const steps: StepDefinition[] = [() => mock];

		await act(async () => {
			renderHook(() => useSequence(steps, { autoPlay: true, reducedMotion: "skip" }));
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// With explicit 'skip' policy and OS preference, the sequence finishes immediately
		expect(mock.playState).not.toBe("running");
	});
});
