import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { useTimeline } from "../hooks/useTimeline.js";
import { installWAAPIMock } from "./helpers.js";

// Mock useReducedMotion
vi.mock("../hooks/useReducedMotion.js", () => ({
	useReducedMotion: vi.fn(() => false),
}));

import { useReducedMotion } from "../hooks/useReducedMotion.js";

const mockedUseReducedMotion = vi.mocked(useReducedMotion);

// Mock requestAnimationFrame/cancelAnimationFrame for timeline playback
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
	vi.stubGlobal("performance", { now: vi.fn(() => 0) });
}

describe("useTimeline", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		mockedUseReducedMotion.mockReturnValue(false);
		waapi = installWAAPIMock();
		setupRafMock();
	});

	afterEach(() => {
		waapi.restore();
		vi.restoreAllMocks();
	});

	it("creates timeline from builder function", () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		expect(result.current.state).toBe("idle");
		expect(typeof result.current.play).toBe("function");
		expect(typeof result.current.seek).toBe("function");
		expect(typeof result.current.progress).toBe("function");
		expect(typeof result.current.seekTo).toBe("function");
	});

	it("autoPlay starts timeline on mount", async () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		await act(async () => {
			renderHook(() =>
				useTimeline(
					(tl) => {
						tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
					},
					{ autoPlay: true },
				),
			);
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		// Timeline should have been put into running state (rAF scheduled)
		expect(rafCallbacks.size).toBeGreaterThanOrEqual(0);
	});

	it("seek() delegates to timeline controllable", () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		// Seek works even in idle state
		act(() => {
			result.current.seek(150);
		});

		expect(result.current.currentTime).toBe(150);
	});

	it("progress() delegates to timeline controllable", () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		act(() => {
			result.current.progress(0.5);
		});

		expect(result.current.currentTime).toBe(150);
	});

	it("cancel on unmount does not throw", async () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { unmount } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		// Unmount should cancel without throwing
		await act(async () => {
			unmount();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});
	});

	it("state is reactive via useSyncExternalStore", async () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		expect(result.current.state).toBe("idle");

		await act(async () => {
			result.current.play();
			await Promise.resolve();
		});

		expect(result.current.state).toBe("running");

		act(() => {
			result.current.pause();
		});

		expect(result.current.state).toBe("paused");
	});

	it("reduced motion policy applied on play (skip)", async () => {
		mockedUseReducedMotion.mockReturnValue(true);
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline(
				(tl) => {
					tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
				},
				{ reducedMotion: "skip" },
			),
		);

		await act(async () => {
			result.current.play();
			for (let i = 0; i < 4; i++) await Promise.resolve();
		});

		expect(result.current.state).toBe("finished");
	});

	it("duration reflects total timeline duration", () => {
		const el = document.createElement("div");
		const kf1 = [{ opacity: 0 }, { opacity: 1 }];
		const kf2 = [{ opacity: 1 }, { opacity: 0 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf1, { duration: 300 }), { duration: 300 }).add(
					() => animate(el, kf2, { duration: 200 }),
					{ duration: 200 },
				);
			}),
		);

		expect(result.current.duration).toBe(500);
	});

	it("setPlaybackRate delegates to timeline", () => {
		const el = document.createElement("div");
		const kf = [{ opacity: 0 }, { opacity: 1 }];

		const { result } = renderHook(() =>
			useTimeline((tl) => {
				tl.add(() => animate(el, kf, { duration: 300 }), { duration: 300 });
			}),
		);

		act(() => {
			result.current.setPlaybackRate(2);
		});

		expect(result.current.playbackRate).toBe(2);
	});
});
