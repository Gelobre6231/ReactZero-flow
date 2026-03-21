import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "../hooks/useReducedMotion.js";

type ChangeListener = (e: { matches: boolean }) => void;

function createMockMatchMedia(matches: boolean) {
	const listeners: ChangeListener[] = [];
	const mql = {
		matches,
		media: "(prefers-reduced-motion: reduce)",
		addEventListener: vi.fn((_event: string, handler: ChangeListener) => {
			listeners.push(handler);
		}),
		removeEventListener: vi.fn((_event: string, handler: ChangeListener) => {
			const idx = listeners.indexOf(handler);
			if (idx >= 0) listeners.splice(idx, 1);
		}),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
		onchange: null,
	};

	return {
		fn: vi.fn().mockReturnValue(mql),
		mql,
		triggerChange(newMatches: boolean) {
			mql.matches = newMatches;
			for (const l of listeners) {
				l({ matches: newMatches });
			}
		},
	};
}

describe("useReducedMotion", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns false when prefers-reduced-motion is not set", () => {
		const mock = createMockMatchMedia(false);
		vi.stubGlobal("matchMedia", mock.fn);

		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);

		vi.unstubAllGlobals();
	});

	it("returns true when prefers-reduced-motion matches", () => {
		const mock = createMockMatchMedia(true);
		vi.stubGlobal("matchMedia", mock.fn);

		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(true);

		vi.unstubAllGlobals();
	});

	it("updates when media query changes", () => {
		const mock = createMockMatchMedia(false);
		vi.stubGlobal("matchMedia", mock.fn);

		const { result } = renderHook(() => useReducedMotion());
		expect(result.current).toBe(false);

		act(() => {
			mock.triggerChange(true);
		});

		expect(result.current).toBe(true);

		act(() => {
			mock.triggerChange(false);
		});

		expect(result.current).toBe(false);

		vi.unstubAllGlobals();
	});

	it("cleans up listener on unmount", () => {
		const mock = createMockMatchMedia(false);
		vi.stubGlobal("matchMedia", mock.fn);

		const { unmount } = renderHook(() => useReducedMotion());
		expect(mock.mql.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

		unmount();

		expect(mock.mql.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));

		vi.unstubAllGlobals();
	});
});
