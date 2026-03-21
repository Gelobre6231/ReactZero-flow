import type { Controllable, PlayState } from "../types.js";

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
}

export function createDeferred<T = void>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

export function createMockAnimation() {
	let state: string = "idle";
	const finishedDeferred = createDeferred<Animation>();
	const onfinishHandlers: Array<() => void> = [];
	const oncancelHandlers: Array<() => void> = [];

	const mockAnimation = {
		play() {
			state = "running";
		},
		pause() {
			if (state === "running" || state === "idle") state = "paused";
		},
		cancel() {
			if (state !== "idle") {
				state = "idle";
				finishedDeferred.reject(new DOMException("The operation was aborted.", "AbortError"));
				for (const h of oncancelHandlers) {
					h();
				}
			}
		},
		finish() {
			state = "finished";
			finishedDeferred.resolve(mockAnimation as unknown as Animation);
			for (const h of onfinishHandlers) {
				h();
			}
		},
		commitStyles() {
			/* no-op in tests */
		},
		get playState() {
			return state;
		},
		get finished() {
			return finishedDeferred.promise;
		},
		get ready() {
			return Promise.resolve(mockAnimation as unknown as Animation);
		},
		get pending() {
			return false;
		},
		playbackRate: 1,
		currentTime: 0,
		startTime: null as number | null,
		effect: null,
		timeline: null,
		id: "",
		replaceState: "active" as const,
		persist() {},
		reverse() {},
		updatePlaybackRate(_rate: number) {},
		addEventListener(type: string, handler: EventListener) {
			if (type === "finish") onfinishHandlers.push(handler as unknown as () => void);
			if (type === "cancel") oncancelHandlers.push(handler as unknown as () => void);
		},
		removeEventListener(type: string, handler: EventListener) {
			if (type === "finish") {
				const idx = onfinishHandlers.indexOf(handler as unknown as () => void);
				if (idx >= 0) onfinishHandlers.splice(idx, 1);
			}
			if (type === "cancel") {
				const idx = oncancelHandlers.indexOf(handler as unknown as () => void);
				if (idx >= 0) oncancelHandlers.splice(idx, 1);
			}
		},
		dispatchEvent(_event: Event) {
			return true;
		},
		onfinish: null as ((this: Animation, ev: AnimationPlaybackEvent) => void) | null,
		oncancel: null as ((this: Animation, ev: AnimationPlaybackEvent) => void) | null,
		onremove: null as ((this: Animation, ev: Event) => void) | null,
	};

	return mockAnimation;
}

/**
 * Install WAAPI mock on Element.prototype.
 * Call in beforeEach, clean up via restore() in afterEach.
 */
export function installWAAPIMock() {
	const mockAnimations: ReturnType<typeof createMockAnimation>[] = [];

	// happy-dom does NOT define Element.prototype.animate, so we must define it
	// before vi.spyOn can spy on it
	const hadAnimate = "animate" in Element.prototype;
	if (!hadAnimate) {
		Element.prototype.animate = (_keyframes?: unknown, _options?: unknown) =>
			undefined as unknown as Animation;
	}

	const spy = vi.spyOn(Element.prototype, "animate").mockImplementation(function (
		this: Element,
		_keyframes,
		_options,
	) {
		const mock = createMockAnimation();
		mockAnimations.push(mock);
		return mock as unknown as Animation;
	});

	return {
		spy,
		/** Get the most recently created mock animation */
		get lastAnimation() {
			return mockAnimations[mockAnimations.length - 1];
		},
		/** Get all mock animations created */
		get allAnimations() {
			return [...mockAnimations];
		},
		/** Restore original Element.animate */
		restore() {
			spy.mockRestore();
			if (!hadAnimate) {
				delete (Element.prototype as unknown as Record<string, unknown>).animate;
			}
		},
	};
}

/**
 * Mock Controllable for composition tests (sequence/parallel/stagger).
 * `_resolve()` manually completes the controllable from tests.
 */
export function createMockControllable(): Controllable & {
	_resolve: () => void;
	_played: boolean;
} {
	const deferred = createDeferred<void>();
	let playState: PlayState = "idle";
	let played = false;
	let _playbackRate = 1;
	const stateChangeCallbacks = new Set<() => void>();

	function notifyStateChange() {
		for (const cb of stateChangeCallbacks) {
			cb();
		}
	}

	return {
		play() {
			playState = "running";
			played = true;
			notifyStateChange();
		},
		pause() {
			playState = "paused";
			notifyStateChange();
		},
		cancel() {
			playState = "idle";
			deferred.resolve();
			notifyStateChange();
		},
		finish() {
			playState = "finished";
			deferred.resolve();
			notifyStateChange();
		},
		get finished() {
			return deferred.promise;
		},
		get playState() {
			return playState;
		},
		get playbackRate() {
			return _playbackRate;
		},
		set playbackRate(rate: number) {
			_playbackRate = rate;
		},
		onStateChange(cb: () => void) {
			stateChangeCallbacks.add(cb);
			return () => {
				stateChangeCallbacks.delete(cb);
			};
		},
		_resolve() {
			playState = "finished";
			deferred.resolve();
			notifyStateChange();
		},
		get _played() {
			return played;
		},
		get currentStep() {
			return undefined;
		},
		get stepCount() {
			return undefined;
		},
	};
}
