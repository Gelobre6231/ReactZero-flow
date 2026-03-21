import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock useReducedMotion
vi.mock("../hooks/useReducedMotion.js", () => ({
	useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { useViewTransition } from "../hooks/useViewTransition.js";
import { setReducedMotionPolicy } from "../reducedMotion.js";

const mockedUseReducedMotion = vi.mocked(useReducedMotion);

function createMockViewTransition() {
	let readyResolve!: () => void;
	let finishedResolve!: () => void;
	const readyPromise = new Promise<void>((resolve) => {
		readyResolve = resolve;
	});
	const finishedPromise = new Promise<void>((resolve) => {
		finishedResolve = resolve;
	});

	const vt = {
		ready: readyPromise,
		finished: finishedPromise,
		updateCallbackDone: Promise.resolve(),
		skipTransition: vi.fn(),
		_resolveReady: readyResolve,
		_resolveFinished: finishedResolve,
	};
	return vt;
}

describe("useViewTransition", () => {
	let originalStartViewTransition: typeof document.startViewTransition;

	beforeEach(() => {
		mockedUseReducedMotion.mockReturnValue(false);
		originalStartViewTransition = document.startViewTransition;
	});

	afterEach(() => {
		document.startViewTransition = originalStartViewTransition;
		vi.restoreAllMocks();
		// Reset global policy
		setReducedMotionPolicy("respect");
	});

	it("isSupported is true when API exists", () => {
		document.startViewTransition = vi.fn(() =>
			createMockViewTransition(),
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());
		expect(result.current.isSupported).toBe(true);
	});

	it("isSupported is false when API does not exist", () => {
		delete (document as Record<string, unknown>).startViewTransition;

		const { result } = renderHook(() => useViewTransition());
		expect(result.current.isSupported).toBe(false);
	});

	it("startTransition calls document.startViewTransition with callback", () => {
		const mockVT = createMockViewTransition();
		const startVT = vi.fn(() => mockVT);
		document.startViewTransition = startVT as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		const callback = vi.fn();
		act(() => {
			result.current.startTransition(callback);
		});

		expect(startVT).toHaveBeenCalledWith(callback);
	});

	it("startTransition returns the ViewTransition object", () => {
		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		let returnedVT: unknown;
		act(() => {
			returnedVT = result.current.startTransition(vi.fn());
		});

		expect(returnedVT).toBe(mockVT);
	});

	it("graceful fallback: when API not supported, callback is invoked directly", () => {
		delete (document as Record<string, unknown>).startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		const callback = vi.fn();
		let returned: unknown;
		act(() => {
			returned = result.current.startTransition(callback);
		});

		expect(callback).toHaveBeenCalledOnce();
		expect(returned).toBeUndefined();
	});

	it("skipTransition calls ViewTransition.skipTransition()", () => {
		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		act(() => {
			result.current.startTransition(vi.fn());
		});

		act(() => {
			result.current.skipTransition();
		});

		expect(mockVT.skipTransition).toHaveBeenCalledOnce();
	});

	it("reduced motion skip policy auto-skips transition", () => {
		mockedUseReducedMotion.mockReturnValue(true);
		setReducedMotionPolicy("skip");

		// Mock matchMedia for shouldApplyReducedMotion
		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => ({
				matches: true,
				media: "",
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
				onchange: null,
			})),
		);

		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		act(() => {
			result.current.startTransition(vi.fn());
		});

		expect(mockVT.skipTransition).toHaveBeenCalledOnce();

		vi.unstubAllGlobals();
	});

	it("reduced motion reduce policy does NOT skip transition", () => {
		mockedUseReducedMotion.mockReturnValue(true);
		setReducedMotionPolicy("reduce");

		vi.stubGlobal(
			"matchMedia",
			vi.fn(() => ({
				matches: true,
				media: "",
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				addListener: vi.fn(),
				removeListener: vi.fn(),
				dispatchEvent: vi.fn(),
				onchange: null,
			})),
		);

		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		act(() => {
			result.current.startTransition(vi.fn());
		});

		expect(mockVT.skipTransition).not.toHaveBeenCalled();

		vi.unstubAllGlobals();
	});

	it("ready and finished return ViewTransition promises when active", () => {
		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		// Before transition: undefined
		expect(result.current.ready).toBeUndefined();
		expect(result.current.finished).toBeUndefined();

		act(() => {
			result.current.startTransition(vi.fn());
		});

		// After transition: promises present
		expect(result.current.ready).toBe(mockVT.ready);
		expect(result.current.finished).toBe(mockVT.finished);
	});

	it("SSR safety: isSupported is false and startTransition calls callback directly", () => {
		// Simulate no startViewTransition (SSR/old browser)
		delete (document as Record<string, unknown>).startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		expect(result.current.isSupported).toBe(false);
		const callback = vi.fn();

		act(() => {
			result.current.startTransition(callback);
		});

		expect(callback).toHaveBeenCalledOnce();
	});

	it("cleans up transitionRef after finished resolves", async () => {
		const mockVT = createMockViewTransition();
		document.startViewTransition = vi.fn(
			() => mockVT,
		) as unknown as typeof document.startViewTransition;

		const { result } = renderHook(() => useViewTransition());

		act(() => {
			result.current.startTransition(vi.fn());
		});

		expect(result.current.finished).toBeDefined();

		// Resolve the finished promise
		await act(async () => {
			mockVT._resolveFinished();
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(result.current.ready).toBeUndefined();
		expect(result.current.finished).toBeUndefined();
	});
});
