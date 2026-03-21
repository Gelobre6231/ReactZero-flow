import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock useReducedMotion
vi.mock("../hooks/useReducedMotion.js", () => ({
	useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from "../hooks/useReducedMotion.js";
import { useScroll } from "../hooks/useScroll.js";

const mockedUseReducedMotion = vi.mocked(useReducedMotion);

// Track rAF callbacks
let rafCallbacks: Map<number, FrameRequestCallback>;
let nextRafId: number;

function setupRafMock() {
	rafCallbacks = new Map();
	nextRafId = 1;
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		const id = nextRafId++;
		rafCallbacks.set(id, cb);
		return id;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => {
		rafCallbacks.delete(id);
	});
}

function flushRaf() {
	const cbs = [...rafCallbacks.entries()];
	rafCallbacks.clear();
	for (const [, cb] of cbs) {
		cb(performance.now());
	}
}

// Mock IntersectionObserver
type IOCallback = (entries: IntersectionObserverEntry[]) => void;

let ioInstances: Array<{
	callback: IOCallback;
	elements: Set<Element>;
	options?: IntersectionObserverInit;
	observe: ReturnType<typeof vi.fn>;
	unobserve: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
}>;

function setupIOMock() {
	ioInstances = [];

	class MockIntersectionObserver {
		callback: IOCallback;
		elements = new Set<Element>();
		options?: IntersectionObserverInit;
		root = null;
		rootMargin = "0px";
		thresholds = [0];
		observe = vi.fn((el: Element) => {
			this.elements.add(el);
		});
		unobserve = vi.fn((el: Element) => {
			this.elements.delete(el);
		});
		disconnect = vi.fn(() => {
			this.elements.clear();
		});
		takeRecords = vi.fn(() => []);

		constructor(callback: IOCallback, options?: IntersectionObserverInit) {
			this.callback = callback;
			this.options = options;
			ioInstances.push(this);
		}
	}

	vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

function triggerIO(
	entryOverrides: Partial<IntersectionObserverEntry> & { target: Element; isIntersecting: boolean },
) {
	for (const io of ioInstances) {
		if (io.elements.has(entryOverrides.target)) {
			io.callback([
				{
					boundingClientRect: entryOverrides.target.getBoundingClientRect(),
					intersectionRatio: entryOverrides.isIntersecting ? 1 : 0,
					intersectionRect: {} as DOMRectReadOnly,
					isIntersecting: entryOverrides.isIntersecting,
					rootBounds: null,
					target: entryOverrides.target,
					time: 0,
					...entryOverrides,
				},
			]);
		}
	}
}

// Mock scroll properties on an element
function mockScrollProperties(
	el: Element,
	scrollTop: number,
	scrollHeight: number,
	clientHeight: number,
) {
	Object.defineProperty(el, "scrollTop", { value: scrollTop, configurable: true });
	Object.defineProperty(el, "scrollHeight", { value: scrollHeight, configurable: true });
	Object.defineProperty(el, "clientHeight", { value: clientHeight, configurable: true });
}

describe("useScroll", () => {
	beforeEach(() => {
		mockedUseReducedMotion.mockReturnValue(false);
		setupRafMock();
		setupIOMock();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns initial progress of 0", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);
		const { result } = renderHook(() => useScroll());
		expect(result.current.progress).toBe(0);
	});

	it("returns scrollTo function and ref", () => {
		const { result } = renderHook(() => useScroll());
		expect(typeof result.current.scrollTo).toBe("function");
		expect(result.current.ref).toBeDefined();
		expect(result.current.ref.current).toBeNull();
	});

	it("updates progress on scroll events", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);

		const { result } = renderHook(() => useScroll());
		expect(result.current.progress).toBe(0);

		// Simulate scroll
		act(() => {
			mockScrollProperties(document.documentElement, 250, 1000, 500);
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(0.5);
	});

	it("calculates progress correctly at full scroll", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);

		const { result } = renderHook(() => useScroll());

		act(() => {
			mockScrollProperties(document.documentElement, 500, 1000, 500);
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(1);
	});

	it("cleans up scroll listener and rAF on unmount", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);

		const removeListenerSpy = vi.spyOn(window, "removeEventListener");
		const { unmount } = renderHook(() => useScroll());

		unmount();

		expect(removeListenerSpy).toHaveBeenCalledWith("scroll", expect.any(Function));
	});

	it("scrollTo scrolls container to correct position", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const { result } = renderHook(() => useScroll());

		act(() => {
			result.current.scrollTo(0.5);
		});

		expect(scrollToSpy).toHaveBeenCalledWith({ top: 250, behavior: "instant" });
	});

	it("scrollTo clamps values to 0-1 range", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);
		const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

		const { result } = renderHook(() => useScroll());

		act(() => {
			result.current.scrollTo(2);
		});
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 500, behavior: "instant" });

		act(() => {
			result.current.scrollTo(-1);
		});
		expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
	});

	it("reduced motion: progress snaps to 0 or 1", () => {
		mockedUseReducedMotion.mockReturnValue(true);
		mockScrollProperties(document.documentElement, 0, 1000, 500);

		const { result } = renderHook(() => useScroll());

		// Scroll to 30% (below 50%) -- should snap to 0
		act(() => {
			mockScrollProperties(document.documentElement, 150, 1000, 500);
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(0);

		// Scroll to 60% (above 50%) -- should snap to 1
		act(() => {
			mockScrollProperties(document.documentElement, 300, 1000, 500);
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(1);
	});

	it("handles zero max scroll (no scrollable content)", () => {
		mockScrollProperties(document.documentElement, 0, 500, 500);

		const { result } = renderHook(() => useScroll());

		act(() => {
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(0);
	});

	it("throttles scroll updates through rAF", () => {
		mockScrollProperties(document.documentElement, 0, 1000, 500);

		renderHook(() => useScroll());

		// Trigger multiple scroll events
		act(() => {
			window.dispatchEvent(new Event("scroll"));
			window.dispatchEvent(new Event("scroll"));
			window.dispatchEvent(new Event("scroll"));
		});

		// Only one rAF should be pending (coalesced)
		expect(rafCallbacks.size).toBe(1);
	});

	it("uses IntersectionObserver when target ref is populated", () => {
		const targetEl = document.createElement("div");
		const targetRefObj = { current: targetEl };

		renderHook(() => useScroll({ target: targetRefObj }));

		expect(ioInstances.length).toBe(1);
		expect(ioInstances[0].elements.has(targetEl)).toBe(true);
	});

	it("disconnects IntersectionObserver on unmount", () => {
		const targetEl = document.createElement("div");
		const targetRefObj = { current: targetEl };

		const { unmount } = renderHook(() => useScroll({ target: targetRefObj }));

		const disconnectSpy = ioInstances[0].disconnect;
		unmount();

		expect(disconnectSpy).toHaveBeenCalled();
	});

	it("supports inline axis for horizontal scroll", () => {
		Object.defineProperty(document.documentElement, "scrollLeft", {
			value: 0,
			configurable: true,
		});
		Object.defineProperty(document.documentElement, "scrollWidth", {
			value: 2000,
			configurable: true,
		});
		Object.defineProperty(document.documentElement, "clientWidth", {
			value: 1000,
			configurable: true,
		});

		const { result } = renderHook(() => useScroll({ axis: "inline" }));

		act(() => {
			Object.defineProperty(document.documentElement, "scrollLeft", {
				value: 500,
				configurable: true,
			});
			window.dispatchEvent(new Event("scroll"));
			flushRaf();
		});

		expect(result.current.progress).toBe(0.5);
	});
});
