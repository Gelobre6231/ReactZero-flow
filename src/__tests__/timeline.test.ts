import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate } from "../animate.js";
import { timeline } from "../timeline.js";
import { installWAAPIMock } from "./helpers.js";

// ── rAF + performance.now mock infrastructure ──────────────────────────
let rafCallbacks: Map<number, FrameRequestCallback>;
let rafIdCounter: number;
let mockNow: number;

function setupRafMock() {
	rafCallbacks = new Map();
	rafIdCounter = 0;
	mockNow = 0;

	vi.stubGlobal(
		"requestAnimationFrame",
		vi.fn((cb: FrameRequestCallback) => {
			const id = ++rafIdCounter;
			rafCallbacks.set(id, cb);
			return id;
		}),
	);

	vi.stubGlobal(
		"cancelAnimationFrame",
		vi.fn((id: number) => {
			rafCallbacks.delete(id);
		}),
	);

	vi.stubGlobal("performance", {
		now: vi.fn(() => mockNow),
	});
}

/**
 * Advance the mock clock by `ms` and fire all pending rAF callbacks.
 * This simulates one rAF frame at the new timestamp.
 */
function advanceFrame(ms: number) {
	mockNow += ms;
	// Snapshot current callbacks (tick may schedule new ones)
	const callbacks = [...rafCallbacks.entries()];
	for (const [id, cb] of callbacks) {
		rafCallbacks.delete(id);
		cb(mockNow);
	}
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("timeline", () => {
	let waapi: ReturnType<typeof installWAAPIMock>;

	beforeEach(() => {
		waapi = installWAAPIMock();
		setupRafMock();
	});

	afterEach(() => {
		waapi.restore();
		vi.restoreAllMocks();
	});

	// ── Builder API ────────────────────────────────────────────────────

	describe("builder API", () => {
		it("add() with { at: 0, duration: 300 } positions entry at 0ms", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			expect(tl.duration).toBe(300);
		});

		it("add() with { at: 500, duration: 200 } positions entry at 500ms", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 500, duration: 200 })
				.build();

			// Total duration = 500 + 200 = 700
			expect(tl.duration).toBe(700);
		});

		it("add() without explicit position auto-advances cursor (sequential by default)", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { duration: 300 })
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { duration: 200 })
				.build();

			// Sequential: 0-300, then 300-500
			expect(tl.duration).toBe(500);
		});

		it("add() with { after: 'intro', offset: 100, duration: 200 } positions relative to label", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.label("intro")
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), {
					after: "intro",
					offset: 100,
					duration: 200,
				})
				.build();

			// 'intro' label is at cursor=300, then offset=100, so entry starts at 400
			// Total = 400 + 200 = 600
			expect(tl.duration).toBe(600);
		});

		it("label() creates named position at current cursor", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.label("midpoint")
				.build();

			// Seek to label should work -- label is at cursor=300
			tl.seekTo("midpoint");
			expect(tl.currentTime).toBe(300);
		});

		it("label('name', 1000) creates named position at explicit ms", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 2000 })
				.label("custom", 1000)
				.build();

			tl.seekTo("custom");
			expect(tl.currentTime).toBe(1000);
		});

		it("build() returns a Controllable with seek/progress/currentTime/duration", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			expect(typeof tl.seek).toBe("function");
			expect(typeof tl.progress).toBe("function");
			expect(typeof tl.seekTo).toBe("function");
			expect(typeof tl.currentTime).toBe("number");
			expect(typeof tl.duration).toBe("number");
			expect(typeof tl.play).toBe("function");
			expect(typeof tl.pause).toBe("function");
			expect(typeof tl.cancel).toBe("function");
			expect(typeof tl.finish).toBe("function");
			expect(tl.playState).toBe("idle");
		});

		it("build() computes total duration as max(entry.endMs)", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 100, duration: 500 })
				.build();

			// max(300, 600) = 600
			expect(tl.duration).toBe(600);
		});

		it("throws when label not found in 'after' reference", () => {
			const el = document.createElement("div");
			expect(() => {
				timeline().add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), {
					after: "nonexistent",
					duration: 300,
				});
			}).toThrow(/nonexistent/);
		});

		it("throws when duration not provided", () => {
			const el = document.createElement("div");
			expect(() => {
				(timeline() as any).add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]));
			}).toThrow(/duration/i);
		});

		it("supports chained builder calls", () => {
			const el = document.createElement("div");
			const builder = timeline();
			const result = builder
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { duration: 300 })
				.label("a")
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { duration: 200 });

			expect(typeof result.build).toBe("function");
		});

		it("empty timeline has duration 0", () => {
			const tl = timeline().build();
			expect(tl.duration).toBe(0);
		});
	});

	// ── Seeking ────────────────────────────────────────────────────────

	describe("seeking", () => {
		it("seek(0) sets all children to their start state", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { at: 300, duration: 200 })
				.build();

			tl.seek(0);

			// Both WAAPI animations should have been created
			const anims = waapi.allAnimations;
			expect(anims.length).toBe(2);
			// First entry: at time 0, it spans 0-300, so child currentTime = 0
			expect(anims[0].currentTime).toBe(0);
			// Second entry: at time 0, before its start (300ms), so child currentTime = 0
			expect(anims[1].currentTime).toBe(0);
		});

		it("seek(duration) sets all children to their end state", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { at: 300, duration: 200 })
				.build();

			tl.seek(500); // total duration = 500

			const anims = waapi.allAnimations;
			// First: past endMs (300), child at 300 (its full duration)
			expect(anims[0].currentTime).toBe(300);
			// Second: past endMs (500), child at 200 (its full duration)
			expect(anims[1].currentTime).toBe(200);
		});

		it("seek(midpoint) positions overlapping children correctly", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 400 })
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { at: 200, duration: 400 })
				.build();

			// Duration = max(400, 600) = 600
			tl.seek(300);

			const anims = waapi.allAnimations;
			// First: spans 0-400, at time 300 -> relative 300
			expect(anims[0].currentTime).toBe(300);
			// Second: spans 200-600, at time 300 -> relative 100
			expect(anims[1].currentTime).toBe(100);
		});

		it("entry before seek time: child currentTime = 0", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 500, duration: 300 })
				.build();

			tl.seek(100); // before entry start at 500

			const anims = waapi.allAnimations;
			expect(anims[0].currentTime).toBe(0);
		});

		it("entry spanning seek time: child at relative offset", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 200, duration: 600 })
				.build();

			tl.seek(500); // within entry (200-800), relative = 300

			const anims = waapi.allAnimations;
			expect(anims[0].currentTime).toBe(300);
		});

		it("entry after seek time: child at its end", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 200 })
				.build();

			tl.seek(300); // past entry end (200)

			const anims = waapi.allAnimations;
			expect(anims[0].currentTime).toBe(200); // full duration
		});

		it("progress(0.5) equivalent to seek(duration * 0.5)", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.progress(0.5);

			expect(tl.currentTime).toBe(500);
			const anims = waapi.allAnimations;
			expect(anims[0].currentTime).toBe(500);
		});

		it("seekTo('label') seeks to labeled position", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.label("halfway", 500)
				.build();

			tl.seekTo("halfway");

			expect(tl.currentTime).toBe(500);
		});

		it("seekTo('nonexistent') throws", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			expect(() => tl.seekTo("nonexistent")).toThrow(/nonexistent/);
		});

		it("backward seeking works: seek(500) then seek(200) repositions children", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 400 })
				.add(() => animate(el, [{ opacity: 1 }, { opacity: 0 }]), { at: 200, duration: 400 })
				.build();

			// Forward seek
			tl.seek(500);
			const anims = waapi.allAnimations;
			// First: past end (400), at 400
			expect(anims[0].currentTime).toBe(400);
			// Second: spans 200-600, at 500 -> relative 300
			expect(anims[1].currentTime).toBe(300);

			// Backward seek
			tl.seek(200);
			// First: spans 0-400, at 200 -> relative 200
			expect(anims[0].currentTime).toBe(200);
			// Second: spans 200-600, at 200 -> relative 0 (at entry start boundary)
			expect(anims[1].currentTime).toBe(0);
		});

		it("seek clamps to [0, duration]", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			tl.seek(-100);
			expect(tl.currentTime).toBe(0);

			tl.seek(1000);
			expect(tl.currentTime).toBe(300);
		});

		it("seek works in any state (idle, paused, running)", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			// Idle state
			tl.seek(100);
			expect(tl.currentTime).toBe(100);

			// Start playing, then pause
			tl.play();
			tl.pause();
			tl.seek(200);
			expect(tl.currentTime).toBe(200);
		});
	});

	// ── _seekTo on animate.ts ──────────────────────────────────────────

	describe("_seekTo on animate()", () => {
		it("_seekTo is non-enumerable on animate() Controllable", () => {
			const el = document.createElement("div");
			const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);

			// Should not show up in Object.keys / for-in
			expect(Object.keys(ctrl)).not.toContain("_seekTo");

			// But should be accessible
			expect(typeof (ctrl as any)._seekTo).toBe("function");
		});

		it("_seekTo sets WAAPI Animation.currentTime directly", () => {
			const el = document.createElement("div");
			const ctrl = animate(el, [{ opacity: 0 }, { opacity: 1 }]);

			(ctrl as any)._seekTo(150);

			expect(waapi.lastAnimation.currentTime).toBe(150);
		});
	});

	// ── Playback ───────────────────────────────────────────────────────

	describe("playback", () => {
		it("play() starts rAF loop and advances currentTime", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			expect(tl.playState).toBe("running");

			// Advance 100ms
			advanceFrame(100);

			expect(tl.currentTime).toBe(100);
		});

		it("play() after pause() resumes from paused position", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(200);
			expect(tl.currentTime).toBe(200);

			tl.pause();
			expect(tl.playState).toBe("paused");
			expect(tl.currentTime).toBe(200);

			// Resume
			tl.play();
			expect(tl.playState).toBe("running");

			advanceFrame(100);
			expect(tl.currentTime).toBe(300);
		});

		it("playback completes when currentTime reaches duration, state becomes finished", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 500 })
				.build();

			tl.play();

			// Advance past duration
			advanceFrame(600);

			expect(tl.playState).toBe("finished");
			expect(tl.currentTime).toBe(500);
		});

		it("pause() stops rAF loop and preserves currentTime", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(300);

			tl.pause();

			// Further frames should not change currentTime
			advanceFrame(100);
			expect(tl.currentTime).toBe(300);
			expect(tl.playState).toBe("paused");
		});

		it("cancel() stops playback, resets state to idle, resolves finished", async () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(200);

			let resolved = false;
			tl.finished.then(() => {
				resolved = true;
			});

			tl.cancel();

			expect(tl.playState).toBe("idle");
			expect(tl.currentTime).toBe(0);

			// finished resolves
			await Promise.resolve();
			expect(resolved).toBe(true);
		});

		it("finish() jumps to end and resolves finished", async () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(200);

			let resolved = false;
			tl.finished.then(() => {
				resolved = true;
			});

			tl.finish();

			expect(tl.playState).toBe("finished");
			expect(tl.currentTime).toBe(1000);

			await Promise.resolve();
			expect(resolved).toBe(true);
		});

		it("onStateChange fires on state transitions", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			const states: string[] = [];
			tl.onStateChange(() => {
				states.push(tl.playState);
			});

			tl.play();
			tl.pause();
			tl.cancel();

			expect(states).toEqual(["running", "paused", "idle"]);
		});

		it("children are initialized with play()+pause() on first play", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 300 })
				.build();

			// Before play, no animations created
			expect(waapi.allAnimations.length).toBe(0);

			tl.play();

			// After play, animation created, played, and paused for initialization
			expect(waapi.allAnimations.length).toBe(1);
		});
	});

	// ── playbackRate ───────────────────────────────────────────────────

	describe("playbackRate", () => {
		it("playbackRate=2 doubles playback speed", () => {
			const el = document.createElement("div");
			const tl = timeline({ playbackRate: 2 })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(100); // 100ms wall time * 2 = 200ms timeline time

			expect(tl.currentTime).toBe(200);
		});

		it("playbackRate=0.5 halves playback speed", () => {
			const el = document.createElement("div");
			const tl = timeline({ playbackRate: 0.5 })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(100); // 100ms wall time * 0.5 = 50ms timeline time

			expect(tl.currentTime).toBe(50);
		});

		it("changing playbackRate mid-play takes effect on next tick", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 2000 })
				.build();

			tl.play();
			advanceFrame(100); // 100ms at rate 1 = 100ms
			expect(tl.currentTime).toBe(100);

			tl.playbackRate = 2;

			advanceFrame(100); // 100ms at rate 2 = 200ms
			expect(tl.currentTime).toBe(300);
		});

		it("playbackRate getter returns current rate", () => {
			const tl = timeline({ playbackRate: 3 }).build();
			expect(tl.playbackRate).toBe(3);

			tl.playbackRate = 1.5;
			expect(tl.playbackRate).toBe(1.5);
		});

		it("default playbackRate is 1", () => {
			const tl = timeline().build();
			expect(tl.playbackRate).toBe(1);
		});
	});

	// ── Edge cases ─────────────────────────────────────────────────────

	describe("edge cases", () => {
		it("overlapping entries are both seeked correctly", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 500 })
				.add(
					() => animate(el, [{ transform: "translateX(0)" }, { transform: "translateX(100px)" }]),
					{
						at: 200,
						duration: 500,
					},
				)
				.build();

			// At t=400: first entry (0-500) relative 400, second entry (200-700) relative 200
			tl.seek(400);
			const anims = waapi.allAnimations;
			expect(anims[0].currentTime).toBe(400);
			expect(anims[1].currentTime).toBe(200);
		});

		it("factory step functions are called lazily on first play/seek", () => {
			const factory = vi.fn(() => {
				const el = document.createElement("div");
				return animate(el, [{ opacity: 0 }, { opacity: 1 }]);
			});

			const tl = timeline().add(factory, { at: 0, duration: 300 }).build();

			// Factory not called yet
			expect(factory).not.toHaveBeenCalled();

			// Seek triggers resolution
			tl.seek(100);
			expect(factory).toHaveBeenCalledOnce();
		});

		it("multiple seek calls reuse resolved entries (no re-creation)", () => {
			const factory = vi.fn(() => {
				const el = document.createElement("div");
				return animate(el, [{ opacity: 0 }, { opacity: 1 }]);
			});

			const tl = timeline().add(factory, { at: 0, duration: 300 }).build();

			tl.seek(100);
			tl.seek(200);
			tl.seek(50);

			// Factory called only once
			expect(factory).toHaveBeenCalledOnce();
		});

		it("finished promise resolves on natural completion", async () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 200 })
				.build();

			let resolved = false;
			tl.play();
			tl.finished.then(() => {
				resolved = true;
			});

			advanceFrame(300); // past duration
			await Promise.resolve();

			expect(resolved).toBe(true);
		});

		it("currentStep and stepCount are undefined (timeline is not a compound step)", () => {
			const tl = timeline().build();
			expect(tl.currentStep).toBeUndefined();
			expect(tl.stepCount).toBeUndefined();
		});
	});

	// ── Easing ──────────────────────────────────────────────────────────

	describe("easing", () => {
		it("easing option applies to rAF playback progression", () => {
			const el = document.createElement("div");
			// Quadratic ease: playhead accelerates
			const tl = timeline({ easing: (t: number) => t * t })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			// At 500ms raw elapsed, quadratic easing gives (0.5)^2 = 0.25 of total = 250ms
			advanceFrame(500);
			expect(tl.currentTime).toBeCloseTo(250, 0);
		});

		it("easing option does not affect total duration", () => {
			const el = document.createElement("div");
			const tl = timeline({ easing: (t: number) => t * t })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			expect(tl.duration).toBe(1000);
		});

		it("eased timeline still completes at full duration", async () => {
			const el = document.createElement("div");
			const tl = timeline({ easing: (t: number) => t * t })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			let resolved = false;
			tl.play();
			tl.finished.then(() => {
				resolved = true;
			});

			advanceFrame(1000);
			await Promise.resolve();
			expect(resolved).toBe(true);
			expect(tl.playState).toBe("finished");
		});

		it("progress() applies easing to normalized input", () => {
			const el = document.createElement("div");
			const tl = timeline({ easing: (t: number) => t * t })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			// progress(0.5) with quadratic easing -> 0.5^2 = 0.25 -> 250ms
			tl.progress(0.5);
			expect(tl.currentTime).toBeCloseTo(250, 0);
		});

		it("no easing option defaults to linear playback", () => {
			const el = document.createElement("div");
			const tl = timeline()
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(500);
			expect(tl.currentTime).toBe(500);
		});

		it("easing works with easeOut-style curve (starts fast, ends slow)", () => {
			const el = document.createElement("div");
			// easeOut: fast start
			const easeOut = (t: number) => 1 - (1 - t) ** 3;
			const tl = timeline({ easing: easeOut })
				.add(() => animate(el, [{ opacity: 0 }, { opacity: 1 }]), { at: 0, duration: 1000 })
				.build();

			tl.play();
			advanceFrame(250);
			// At raw 250ms (25% of 1000), easeOutCubic(0.25) = 1-(0.75)^3 ≈ 0.578 -> ~578ms
			expect(tl.currentTime).toBeGreaterThan(250);
			expect(tl.currentTime).toBeCloseTo(578, -1);
		});
	});
});
