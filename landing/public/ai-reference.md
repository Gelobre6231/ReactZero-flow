# @reactzero/flow -- Comprehensive AI Reference

> Zero-dependency animation orchestration for React, powered by the Web Animations API (WAAPI).
> Package: `@reactzero/flow` | Version: 0.1.0 | Bundle: ~8.7KB gzipped, 5.26KB brotli
> ESM-only | Peer dep: `react >= 18.0.0` | License: MIT

```bash
npm install @reactzero/flow
```

All imports come from a single entry point:

```ts
import { animate, sequence, parallel, useSequence, easing } from "@reactzero/flow";
```

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Core Primitives](#core-primitives)
3. [Event Steps](#event-steps)
4. [React Hooks](#react-hooks)
5. [Reduced Motion & Accessibility](#reduced-motion--accessibility)
6. [Easing Reference](#easing-reference)
7. [Type Exports](#type-exports)
8. [Animation Optimization Guidelines](#animation-optimization-guidelines)
9. [Composition Patterns & Recipes](#composition-patterns--recipes)
10. [Troubleshooting & Common Issues](#troubleshooting--common-issues)
11. [Bundle & Package Information](#bundle--package-information)

---

## Core Concepts

### The Web Animations API (WAAPI)

Flow is built entirely on the browser's native [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API). WAAPI runs animations on the compositor thread, enabling hardware-accelerated performance for `transform` and `opacity` properties without JavaScript per-frame work.

Flow wraps `Element.animate()` to provide:
- A consistent `Controllable` interface across all animation types
- Automatic style persistence via the commitStyles pattern
- Composition primitives (sequence, parallel, stagger, timeline, etc.)

### The commitStyles + cancel Pattern

Flow uses `commitStyles()` + `cancel()` instead of `fill: "forwards"`:

```ts
// What Flow does internally when an animation finishes:
animation.commitStyles(); // Copies final computed values to element.style
animation.cancel();       // Releases the Animation object for garbage collection
```

**Why this matters:**
- `fill: "forwards"` keeps the Animation object alive indefinitely, preventing GC
- `commitStyles()` persists final values as inline styles, then `cancel()` frees the animation
- Final styles survive as inline styles -- no visual flash, no memory leak
- If you re-animate the same properties, the new animation takes over the inline styles

### The Controllable Interface

Every primitive in Flow returns a `Controllable` -- the universal animation control interface:

```ts
interface Controllable {
  // Lifecycle control
  play(): void;        // Start or resume playback
  pause(): void;       // Pause at current position
  cancel(): void;      // Stop and reset to idle (resolves finished)
  finish(): void;      // Jump to end state (resolves finished)

  // State
  readonly finished: Promise<void>;  // Resolves when done -- NEVER rejects
  readonly playState: PlayState;     // "idle" | "running" | "paused" | "finished"

  // Speed control
  playbackRate: number;  // Read/write, defaults to 1. Propagates to children.

  // Observation
  onStateChange(callback: () => void): () => void;  // Returns unsubscribe fn

  // Compound-only (sequence, parallel, stagger, etc.)
  onStepStart?(callback: (index: number) => void): () => void;
  onStepComplete?(callback: (index: number) => void): () => void;
  readonly currentStep?: number;   // 0-based index of active step
  readonly stepCount?: number;     // Total number of steps
}
```

**Critical behavior: `finished` never rejects.** When you call `cancel()`, the `finished` promise still resolves (not rejects). This means `await controllable.finished` will always succeed -- no try/catch needed for cancellation.

### StepDefinition: Controllable | (() => Controllable)

Steps can be passed as either pre-created Controllables or factory functions:

```ts
type StepDefinition = Controllable | (() => Controllable);
```

**Always prefer factory functions** (`() => Controllable`):
- Defers creation until the step actually runs
- Enables replay (fresh animation on each play)
- Allows garbage collection of completed animations
- Required for `repeat()` to create fresh sequences per iteration

```ts
// GOOD: Factory function -- deferred creation, supports replay
sequence(
  () => animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }),
  () => delay(200),
  () => animate(el, [{ transform: "translateY(0)" }, { transform: "translateY(-10px)" }], { duration: 400 }),
);

// AVOID: Pre-created -- stale state on replay
const step1 = animate(el, keyframes, opts);
sequence(step1, step2); // step1 won't reset on second play()
```

### The Composition Model

Flow's power comes from composable nesting. Every Controllable can be nested inside any other:

```ts
// Sequence of parallel groups with staggered elements
sequence(
  () => parallel(
    () => animate(header, fadeIn, { duration: 300 }),
    () => stagger(listItems.map(item =>
      () => animate(item, slideUp, { duration: 250 })
    ), { each: 50 }),
  ),
  () => delay(200),
  () => animate(footer, fadeIn, { duration: 300 }),
);
```

**Propagation rules:**
- `playbackRate` cascades from parent to all active children
- `cancel()` propagates down to all active children
- `pause()` propagates down to all active children
- `finished` on the parent resolves when the entire composition completes

---

## Core Primitives

### animate(element, keyframes, options?)

Wraps `Element.animate()` with the Controllable interface and commitStyles pattern.

```ts
function animate(
  element: Element,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options?: AnimateOptions,
): Controllable;
```

**AnimateOptions:**

```ts
interface AnimateOptions {
  duration?: number;                          // ms, default varies by browser
  easing?: string;                            // CSS easing string
  delay?: number;                             // ms delay before start
  iterations?: number;                        // repeat count (default 1)
  direction?: PlaybackDirection;              // "normal" | "reverse" | "alternate" | "alternate-reverse"
  composite?: CompositeOperation;             // "replace" | "add" | "accumulate"
  iterationComposite?: IterationCompositeOperation;
  // NOTE: fill is intentionally excluded -- forced to "forwards" internally for commitStyles
}
```

**Behavior:**
- Created in paused state -- call `play()` to start
- On finish: calls `commitStyles()` then `cancel()` on the WAAPI animation
- `finished` promise always resolves (cancel rejection is caught internally)

**Examples:**

```ts
// Fade in
const fadeIn = animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
fadeIn.play();

// Slide up with easing
animate(el, [
  { transform: "translateY(20px)", opacity: 0 },
  { transform: "translateY(0)", opacity: 1 },
], { duration: 500, easing: easing.easeOutCubic });

// Multi-property with PropertyIndexedKeyframes
animate(el, {
  opacity: [0, 1],
  transform: ["scale(0.8)", "scale(1)"],
}, { duration: 400 });

// With delay and iterations
animate(el, [
  { transform: "rotate(0deg)" },
  { transform: "rotate(360deg)" },
], { duration: 1000, iterations: 3, delay: 200 });
```

---

### sequence(...steps)

Runs steps one after another. Each step waits for the previous one's `finished` promise.

```ts
function sequence(...steps: StepDefinition[]): Controllable;
```

**Behavior:**
- Steps execute in order, each waiting for the previous to finish
- `pause()` pauses the currently active child
- `cancel()` cancels the currently active child and stops iteration
- `playbackRate` propagates to the active child

**Examples:**

```ts
// Basic sequence
const entrance = sequence(
  () => animate(el1, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }),
  () => delay(100),
  () => animate(el2, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }),
);
entrance.play();
await entrance.finished;

// Multi-step form wizard animation
sequence(
  () => animate(step1, [{ transform: "translateX(0)" }, { transform: "translateX(-100%)" }], { duration: 400 }),
  () => animate(step2, [{ transform: "translateX(100%)" }, { transform: "translateX(0)" }], { duration: 400 }),
);

// With event gates (wait for user interaction)
sequence(
  () => animate(tooltip, fadeIn, { duration: 200 }),
  () => waitForEvent(closeBtn, "click"),
  () => animate(tooltip, fadeOut, { duration: 200 }),
);
```

---

### parallel(...steps)

Runs all steps simultaneously. Finishes when the slowest child completes.

```ts
function parallel(...steps: StepDefinition[]): Controllable;
```

**Behavior:**
- All steps start at the same time
- Finishes when ALL children have completed (Promise.all)
- `pause()` pauses all children
- `cancel()` cancels all children
- `playbackRate` propagates to all children

**Examples:**

```ts
// Coordinated entrance
const entrance = parallel(
  () => animate(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 600 }),
  () => animate(title, [
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 500 }),
  () => animate(subtitle, [
    { opacity: 0, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 400 }),
);
entrance.play();

// Different durations -- parallel waits for the longest
parallel(
  () => animate(fast, fadeIn, { duration: 200 }),
  () => animate(slow, slideIn, { duration: 800 }), // parallel finishes after 800ms
);
```

---

### stagger(steps, config)

Parallel execution with staggered start delays between steps.

```ts
function stagger(
  steps: StepDefinition[],
  config: StaggerConfig | AdvancedStaggerConfig,
): Controllable;
```

**Simple config:**

```ts
interface StaggerConfig {
  each: number; // Fixed ms delay between each step's start
}
```

**Advanced config:**

```ts
interface AdvancedStaggerConfig {
  each?: number;       // ms between steps (default 50)
  from?: "start" | "center" | "end" | "edges" | "random" | number;
  grid?: [number, number] | "auto";  // [rows, cols] for 2D stagger
  axis?: "x" | "y";    // Restrict distance calc to one axis (grid only)
  ease?: (t: number) => number;  // Easing for delay distribution
}
```

**Internal composition:** Stagger is built on top of parallel and sequence:
`parallel(sequence(delay(offset[0]), step[0]), sequence(delay(offset[1]), step[1]), ...)`

**Examples:**

```ts
// Simple: fixed 80ms delay between items
const listEntrance = stagger(
  items.map(item => () =>
    animate(item, [
      { opacity: 0, transform: "translateY(20px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 400, easing: easing.easeOutCubic })
  ),
  { each: 80 },
);
listEntrance.play();

// Advanced: from center with easing
stagger(
  items.map(item => () =>
    animate(item, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
  ),
  { each: 60, from: "center", ease: easeFn.easeOutQuad },
);

// Grid stagger: 2D distance-based delays
stagger(
  gridCells.map(cell => () =>
    animate(cell, [{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 300 })
  ),
  { each: 40, from: "center", grid: [4, 6] },
);

// Auto-detect grid dimensions
stagger(steps, { each: 30, grid: "auto", from: "center", axis: "x" });
```

**Helper export:**

```ts
// Get raw delay offsets for custom use
import { computeStaggerOffsets } from "@reactzero/flow";
const offsets = computeStaggerOffsets(10, { each: 50, from: "center", ease: easeFn.easeOutCubic });
// Returns: number[] of ms offsets, one per step
```

---

### delay(ms)

Time-based pause step. Useful as a gap in sequences.

```ts
function delay(ms: number): Controllable;
```

**Behavior:**
- `playbackRate` scales the timer duration (e.g., rate 2 = half the wait time)
- Negative or zero `playbackRate` is ignored (timer doesn't reverse)
- `delay(0)` resolves on next microtask

**Examples:**

```ts
// Gap in a sequence
sequence(
  () => animate(el, fadeIn, { duration: 300 }),
  () => delay(500),  // Wait 500ms
  () => animate(el, slideUp, { duration: 400 }),
);

// Standalone delay
const wait = delay(1000);
wait.play();
await wait.finished; // Resolves after 1 second
```

---

### timeline(options?)

Seekable, time-driven choreography with a virtual playhead. **This is a separate primitive from `sequence()`**.

```ts
function timeline(options?: {
  playbackRate?: number;
  easing?: EaseFn;         // Mathematical easing function for progress curve
}): TimelineBuilder;
```

**Key differences from sequence:**
| | sequence() | timeline() |
|---|---|---|
| Execution model | async/await chain | rAF-driven virtual playhead |
| Seeking | Not supported | `seek()`, `progress()`, `seekTo()` |
| Event steps | Supported | Not supported |
| Use case | Sequential flows, user interaction gates | Scrubbing, choreography, synchronized motion |

**TimelineBuilder API:**

```ts
interface TimelineBuilder {
  add(step: StepDefinition, position?: TimelineAddOptions): TimelineBuilder;
  label(name: string, position?: number): TimelineBuilder;
  build(): TimelineControllable;
}

interface TimelineAddOptions {
  duration: number;      // REQUIRED: explicit duration in ms
  at?: number;           // Absolute ms position
  after?: string;        // Relative to a named label
  offset?: number;       // ms offset from resolved position
}
```

**TimelineControllable** (extends Controllable):

```ts
interface TimelineControllable extends Controllable {
  readonly currentTime: number;          // Current playhead position in ms
  readonly duration: number;             // Total timeline duration in ms
  seek(timeMs: number): void;            // Scrub to absolute ms position
  progress(normalized: number): void;    // Scrub to 0-1 position
  seekTo(label: string): void;           // Jump to named label
}
```

**Examples:**

```ts
// Basic timeline with overlapping animations
const tl = timeline()
  .add(() => animate(el1, fadeIn), { duration: 300, at: 0 })
  .add(() => animate(el2, slideUp), { duration: 500, at: 200 }) // starts 200ms in (overlaps)
  .label("midpoint")
  .add(() => animate(el3, scaleIn), { duration: 400, after: "midpoint", offset: 100 })
  .build();

tl.play();                 // rAF-driven playback
tl.seek(500);              // Scrub to 500ms
tl.progress(0.5);          // Scrub to 50%
tl.seekTo("midpoint");     // Jump to label

// Timeline with easing curve
const tl = timeline({ easing: easeFn.easeInOutCubic })
  .add(() => animate(el, kf), { duration: 600, at: 0 })
  .build();

// Interactive scrubber
const tl = timeline()
  .add(/* steps */)
  .build();
rangeInput.addEventListener("input", (e) => {
  tl.progress(e.target.value / 100);
});
```

**Important:** Timeline children must specify `duration` explicitly. Labels can be placed at any cursor position and referenced by later steps with `after`.

---

### race(...steps)

First child to finish wins; all others are cancelled.

```ts
function race(...steps: StepDefinition[]): RaceControllable;
```

**RaceControllable** (extends Controllable):

```ts
interface RaceControllable extends Controllable {
  readonly winner?: number;  // 0-based index of winning child (undefined before completion)
}
```

**Examples:**

```ts
// Animation with timeout
const result = race(
  () => animate(el, complexAnimation, { duration: 2000 }),
  () => delay(1000), // 1-second deadline
);
result.play();
await result.finished;
console.log(result.winner); // 0 = animation finished, 1 = timeout fired

// Competing user interactions
const action = race(
  () => waitForEvent(acceptBtn, "click"),
  () => waitForEvent(rejectBtn, "click"),
  () => delay(30000), // 30-second auto-dismiss
);
action.play();
await action.finished;
if (action.winner === 0) { /* accepted */ }
else if (action.winner === 1) { /* rejected */ }
else { /* timed out */ }
```

---

### repeat(steps, count, options?)

Repeat steps N times or infinitely.

```ts
function repeat(
  steps: StepDefinition | StepDefinition[],
  count: number,
  options?: RepeatOptions,
): Controllable;

interface RepeatOptions {
  yoyo?: boolean;                        // Reverse step order on odd iterations
  onRepeat?: (iteration: number) => void; // Callback after each iteration
}
```

**Behavior:**
- If `steps` is an array, it's wrapped in `sequence()` internally
- A fresh sequence is created each iteration (previous one is GC'd)
- `count: Infinity` for endless loops -- cancel to stop
- `yoyo: true` reverses the step array on odd iterations (ping-pong effect)
- `stepCount` is -1 when count is Infinity

**Examples:**

```ts
// Pulse 3 times
const pulse = repeat(
  () => animate(el, [
    { transform: "scale(1)" },
    { transform: "scale(1.1)" },
    { transform: "scale(1)" },
  ], { duration: 600 }),
  3,
);
pulse.play();

// Infinite yoyo
const breathing = repeat(
  () => animate(el, [
    { opacity: 0.5 },
    { opacity: 1 },
  ], { duration: 1500, easing: easing.easeInOutSine }),
  Infinity,
  { yoyo: true },
);
breathing.play();
// Later: breathing.cancel();

// With iteration callback
repeat(steps, 5, {
  onRepeat: (i) => console.log(`Completed iteration ${i}`),
});
```

---

### timeout(steps, ms)

Race inner steps against a deadline timer. Auto-cancels if the deadline fires first.

```ts
function timeout(steps: StepDefinition[], ms: number): TimeoutControllable;
```

**TimeoutControllable** (extends Controllable):

```ts
interface TimeoutControllable extends Controllable {
  readonly timedOut?: boolean;  // true if deadline fired, false if inner completed, undefined before completion
}
```

**Behavior:**
- Steps are wrapped in `sequence()` internally
- The deadline timer respects `playbackRate`
- If inner completes first: `timedOut === false`, deadline is cleared
- If deadline fires first: `timedOut === true`, inner sequence is cancelled

**Examples:**

```ts
// Auto-dismiss toast after 5 seconds
const toast = timeout(
  [
    () => animate(toastEl, slideIn, { duration: 300 }),
    () => waitForEvent(closeBtn, "click"),  // Wait for manual close
    () => animate(toastEl, slideOut, { duration: 300 }),
  ],
  5000,
);
toast.play();
await toast.finished;
if (toast.timedOut) {
  // Auto-dismissed -- animate out
  animate(toastEl, slideOut, { duration: 300 }).play();
}

// Loading with maximum wait time
const loader = timeout(
  [() => waitFor(fetchData)],
  10000, // 10 second max
);
loader.play();
await loader.finished;
if (loader.timedOut) {
  showError("Request took too long");
}
```

---

## Event Steps

Event steps are leaf Controllables that resolve based on external events. They implement a **pause gate pattern**: if the event fires while the step is paused, the resolution is deferred until resume.

### waitForEvent(target, eventName, options?)

Resolves when the target dispatches the specified DOM event.

```ts
function waitForEvent(
  target: EventTarget,
  eventName: string,
  options?: WaitForEventOptions,
): Controllable;

interface WaitForEventOptions {
  filter?: (e: Event) => boolean;  // Only resolve if filter returns true
}
```

**Behavior:**
- Listener registered on `play()`, removed on `cancel()`
- Uses `{ once: true }` -- only the first matching event resolves
- `playbackRate` is stored for interface conformance but has no effect on event timing
- `cancel()` removes the listener and resolves `finished`

**Examples:**

```ts
// Wait for click
sequence(
  () => animate(el, showAnimation, { duration: 300 }),
  () => waitForEvent(el, "click"),
  () => animate(el, hideAnimation, { duration: 300 }),
);

// With filter
waitForEvent(document, "keydown", {
  filter: (e) => (e as KeyboardEvent).key === "Enter",
});
```

---

### waitForIntersection(element, options?)

Resolves when the element enters the viewport using IntersectionObserver.

```ts
function waitForIntersection(
  element: Element,
  options?: IntersectionObserverInit,
): Controllable;
```

**Examples:**

```ts
// Scroll-triggered animation
sequence(
  () => waitForIntersection(section),
  () => stagger(
    sectionItems.map(item => () =>
      animate(item, fadeInUp, { duration: 400 })
    ),
    { each: 60 },
  ),
);

// With threshold
waitForIntersection(el, { threshold: 0.5 }); // 50% visible
```

---

### waitFor(promiseOrFactory)

Wraps an arbitrary Promise (or factory) as a Controllable step.

```ts
function waitFor(
  promiseOrFactory: Promise<void> | (() => Promise<void>),
): Controllable;
```

**Behavior:**
- If argument is a function, calls it on `play()` (lazy/deferred)
- If argument is a direct Promise, uses it immediately
- `cancel()` cannot cancel the user's promise -- it just stops waiting
- `playbackRate` is stored for interface conformance but has no effect

**Examples:**

```ts
// Wait for data fetch
sequence(
  () => animate(spinner, fadeIn, { duration: 200 }),
  () => waitFor(() => fetchUserData(userId)),
  () => animate(spinner, fadeOut, { duration: 200 }),
  () => animate(content, fadeIn, { duration: 300 }),
);

// With existing promise
const loaded = imageElement.decode();
waitFor(loaded);
```

---

## React Hooks

All hooks use `useSyncExternalStore` for reactive state updates without unnecessary re-renders. Steps are captured at mount time (empty dependency array) to ensure stable animation references.

### useSequence(steps, options?)

Manages a sequence lifecycle with React.

```ts
function useSequence(
  steps: StepDefinition[],
  options?: UseSequenceOptions,
): UseSequenceReturn;

interface UseSequenceOptions {
  autoPlay?: boolean;                    // Auto-play on mount
  reducedMotion?: ReducedMotionPolicy;   // Per-hook policy override
}

interface UseSequenceReturn {
  play(): void;
  pause(): void;
  cancel(): void;
  state: PlayState;   // Reactive -- triggers re-render on change
}
```

**Behavior:**
- Sequence is created once in `useEffect` with empty deps (steps captured at mount)
- `cancel()` called automatically on unmount (cleanup)
- `state` is reactive via `useSyncExternalStore`
- `reducedMotion` option takes priority over global policy
- Crossfade falls back to skip at the sequence level (no access to individual keyframes)

**Examples:**

```tsx
function EntranceAnimation() {
  const el1 = useRef<HTMLDivElement>(null);
  const el2 = useRef<HTMLDivElement>(null);

  const { play, state } = useSequence([
    () => animate(el1.current!, fadeIn, { duration: 300 }),
    () => delay(100),
    () => animate(el2.current!, slideUp, { duration: 400 }),
  ], { autoPlay: true });

  return (
    <div>
      <div ref={el1}>Hello</div>
      <div ref={el2}>World</div>
      <p>State: {state}</p>
      <button onClick={play}>Replay</button>
    </div>
  );
}
```

---

### useTimeline(builder, options?)

Manages a timeline lifecycle with seeking controls.

```ts
function useTimeline(
  builder: (tl: TimelineBuilder) => void,
  options?: UseTimelineOptions,
): UseTimelineReturn;

interface UseTimelineOptions {
  autoPlay?: boolean;
  reducedMotion?: ReducedMotionPolicy;
}

interface UseTimelineReturn {
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  seek(timeMs: number): void;
  progress(normalized: number): void;
  seekTo(label: string): void;
  state: PlayState;
  currentTime: number;       // Getter -- reads from ref
  duration: number;          // Getter -- reads from ref
  playbackRate: number;      // Getter -- reads from ref
  setPlaybackRate(rate: number): void;
}
```

**Examples:**

```tsx
function TimelineScrubber() {
  const el1 = useRef<HTMLDivElement>(null);
  const el2 = useRef<HTMLDivElement>(null);

  const { play, pause, seek, progress, state, currentTime, duration } = useTimeline((tl) => {
    tl.add(() => animate(el1.current!, fadeIn), { duration: 300, at: 0 })
      .label("middle")
      .add(() => animate(el2.current!, slideUp), { duration: 500, after: "middle" })
      .build();
  });

  return (
    <div>
      <div ref={el1} />
      <div ref={el2} />
      <input
        type="range"
        min={0}
        max={100}
        onChange={(e) => progress(Number(e.target.value) / 100)}
      />
      <p>{Math.round(currentTime)}ms / {duration}ms</p>
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
    </div>
  );
}
```

---

### useStagger(steps, config, options?)

Manages a stagger lifecycle with React. Supports both simple and advanced configs.

```ts
function useStagger(
  steps: StepDefinition[],
  config: StaggerConfig | AdvancedStaggerConfig,
  options?: UseStaggerOptions,
): UseStaggerReturn;

interface UseStaggerOptions {
  autoPlay?: boolean;
  reducedMotion?: ReducedMotionPolicy;
}

interface UseStaggerReturn {
  play(): void;
  pause(): void;
  cancel(): void;
  state: PlayState;
}
```

**Examples:**

```tsx
function ListEntrance() {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const { play, state } = useStagger(
    itemRefs.current.map((ref) => () =>
      animate(ref!, [
        { opacity: 0, transform: "translateX(-20px)" },
        { opacity: 1, transform: "translateX(0)" },
      ], { duration: 300, easing: easing.easeOutCubic })
    ),
    { each: 60, from: "start" },
    { autoPlay: true },
  );

  return (
    <ul>
      {items.map((item, i) => (
        <li key={item.id} ref={(el) => { itemRefs.current[i] = el; }}>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
```

---

### useScroll(options?)

Reactive scroll progress tracking (0-1).

```ts
function useScroll(options?: UseScrollOptions): UseScrollReturn;

interface UseScrollOptions {
  source?: React.RefObject<Element | null>;  // Scroll container (default: documentElement)
  target?: React.RefObject<Element | null>;  // Element to track visibility
  axis?: "block" | "inline";                 // Scroll axis (default: "block")
  offset?: [string, string];                 // Scroll range offsets
}

interface UseScrollReturn {
  progress: number;                          // Reactive 0-1 value
  scrollTo: (position: number) => void;      // Scroll to normalized position
  ref: React.RefObject<Element | null>;      // Attach to target element
}
```

**Two modes:**
1. **Container tracking** (no `target`): Progress based on scroll position of the container
2. **Target tracking** (with `target` or using `ref`): Progress based on element visibility in viewport

**Behavior:**
- Uses IntersectionObserver + scroll listener (native ScrollTimeline is a future enhancement)
- Reduced motion: snaps progress to 0 or 1 (no smooth transitions)
- rAF-throttled scroll updates

**Examples:**

```tsx
// Page scroll progress bar
function ScrollProgress() {
  const { progress } = useScroll();
  return <div style={{ width: `${progress * 100}%`, height: 3, background: "blue" }} />;
}

// Track element visibility
function RevealOnScroll() {
  const { progress, ref } = useScroll();
  return (
    <div ref={ref} style={{ opacity: progress }}>
      Fades in as you scroll
    </div>
  );
}

// Horizontal scroll container
function HorizontalScroller() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { progress } = useScroll({ source: containerRef, axis: "inline" });
  return <div ref={containerRef} style={{ overflowX: "auto" }}>...</div>;
}
```

---

### useViewTransition()

Wraps the View Transition API for same-document SPA transitions. **This is NOT a Controllable** -- View Transitions have a fundamentally different lifecycle (snapshot -> update DOM -> animate pseudo-elements).

```ts
function useViewTransition(): UseViewTransitionReturn;

interface UseViewTransitionReturn {
  startTransition: (updateCallback: () => void | Promise<void>) => ViewTransition | undefined;
  ready: Promise<void> | undefined;       // Current transition's ready promise
  finished: Promise<void> | undefined;    // Current transition's finished promise
  skipTransition: () => void;             // Skip animation (DOM update still applies)
  isSupported: boolean;                   // Whether the API is available
}
```

**Behavior:**
- Graceful fallback: if API is unsupported, just calls the callback directly
- Reduced motion: auto-skips the animation when "skip" policy is active
- Ref cleanup when transition finishes

**Examples:**

```tsx
function PageTransition() {
  const { startTransition, isSupported } = useViewTransition();
  const [page, setPage] = useState("home");

  const navigateTo = (newPage: string) => {
    startTransition(() => {
      setPage(newPage);
    });
  };

  return (
    <div>
      <nav>
        <button onClick={() => navigateTo("home")}>Home</button>
        <button onClick={() => navigateTo("about")}>About</button>
      </nav>
      {page === "home" ? <HomePage /> : <AboutPage />}
    </div>
  );
}
```

---

### useReducedMotion()

Reactive tracking of the user's `prefers-reduced-motion` OS setting.

```ts
function useReducedMotion(): boolean;
```

**Behavior:**
- Returns `true` when `prefers-reduced-motion: reduce` is active
- Reactive: triggers re-render when the setting changes
- SSR-safe: returns `false` on the server
- Uses `useSyncExternalStore` with `matchMedia`

**Examples:**

```tsx
function AnimatedComponent() {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      // Skip or simplify animation
      el.style.opacity = "1";
    } else {
      animate(el, fadeIn, { duration: 300 }).play();
    }
  }, [prefersReduced]);
}
```

---

### useReducedMotionPolicy()

Reads the current policy from the nearest `ReducedMotionProvider`.

```ts
function useReducedMotionPolicy(): ReducedMotionPolicy;
// Returns "respect" if no provider is present
```

---

## Reduced Motion & Accessibility

Flow provides a policy system that respects the user's OS `prefers-reduced-motion` setting while giving developers control over the response.

### Policy System Overview

Four policies control how animations respond to reduced motion:

| Policy | Behavior | When to use |
|--------|----------|-------------|
| `"respect"` | No change (default) | Animations are fine as-is |
| `"skip"` | `finish()` -- jumps to end state instantly | Purely decorative motion |
| `"reduce"` | Speeds up by `reduceRate` (default 5x) | Motion conveys meaning but can be faster |
| `"crossfade"` | Strips motion, keeps opacity fades only | Key transitions that need visual feedback |

**Two conditions must be true for policies to take effect:**
1. User's OS setting: `prefers-reduced-motion: reduce`
2. Developer policy is NOT `"respect"`

### setReducedMotionPolicy(policy, options?)

Sets the global policy. Affects all new animations.

```ts
function setReducedMotionPolicy(
  policy: ReducedMotionPolicy,
  options?: { reduceRate?: number },  // Default: 5
): void;
```

```ts
// At app startup
setReducedMotionPolicy("reduce", { reduceRate: 3 });
```

### getReducedMotionPolicy() / getReducePlaybackRate()

Read current global settings.

```ts
function getReducedMotionPolicy(): ReducedMotionPolicy;
function getReducePlaybackRate(): number;
```

### shouldApplyReducedMotion()

Returns `true` when both conditions are met (OS preference active + policy != "respect").

```ts
function shouldApplyReducedMotion(): boolean;
```

### applyReducedMotion(controllable, policy?)

Apply a policy to an **existing** Controllable.

```ts
function applyReducedMotion(controllable: Controllable, policy?: ReducedMotionPolicy): void;
```

- `"skip"` -> calls `finish()`
- `"reduce"` -> sets `playbackRate` to `reducePlaybackRate`
- `"crossfade"` -> **logs warning and no-ops** (must use `wrapWithPolicy` instead)

### wrapWithPolicy(stepFn, keyframes, options, element)

Wraps a step factory with reduced motion awareness. **This is the only way to enable crossfade** because keyframes must be transformed BEFORE `animate()` creates the WAAPI animation.

```ts
function wrapWithPolicy(
  stepFn: () => Controllable,
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
  options: AnimateOptions,
  element: Element,
): () => Controllable;
```

**Example:**

```ts
const kf = [
  { transform: "translateX(-100%)", opacity: 0 },
  { transform: "translateX(0)", opacity: 1 },
];
const opts = { duration: 500 };

// Without wrapWithPolicy: no crossfade support
sequence(() => animate(el, kf, opts));

// With wrapWithPolicy: crossfade strips transform, keeps opacity
sequence(wrapWithPolicy(
  () => animate(el, kf, opts),
  kf, opts, el,
));
```

### crossfadeKeyframes(keyframes)

Strips all motion properties (transform, left, top, width, etc.), keeping only `opacity`. If no opacity exists in the original keyframes, generates `[{ opacity: 0 }, { opacity: 1 }]`.

```ts
function crossfadeKeyframes(
  keyframes: Keyframe[] | PropertyIndexedKeyframes,
): Keyframe[] | PropertyIndexedKeyframes;
```

### ReducedMotionProvider

React context provider for declarative policy configuration.

```tsx
interface ReducedMotionProviderProps {
  policy: ReducedMotionPolicy;
  reduceRate?: number;
  children: ReactNode;
}
```

```tsx
// At app root
<ReducedMotionProvider policy="reduce" reduceRate={3}>
  <App />
</ReducedMotionProvider>
```

**Behavior:**
- Sets global policy on mount/update via `setReducedMotionPolicy()`
- Resets to `"respect"` on unmount
- Provides policy value to `useReducedMotionPolicy()` descendants

### Best Practices for Accessible Animation

1. **Always test with reduced motion enabled** (OS-level setting or browser DevTools)
2. **Use `wrapWithPolicy()` for crossfade** -- `applyReducedMotion()` cannot retrofit crossfade
3. **Prefer `"reduce"` over `"skip"`** when motion conveys meaning (e.g., page transitions)
4. **Critical info should not depend on animation** -- content must be accessible without motion
5. **At hook level**, the `reducedMotion` option overrides the global policy per-component:
   ```tsx
   useSequence(steps, { reducedMotion: "skip" }); // This sequence always skips
   ```

---

## Easing Reference

### easing -- CSS String Presets

For use with `animate()` options. All values are valid CSS `<easing-function>` strings.

```ts
import { easing } from "@reactzero/flow";
animate(el, keyframes, { easing: easing.easeOutCubic });
```

| Category | Presets |
|----------|---------|
| **Basic** | `linear`, `ease`, `easeIn`, `easeOut`, `easeInOut` |
| **Sine** | `easeInSine`, `easeOutSine`, `easeInOutSine` |
| **Quad** | `easeInQuad`, `easeOutQuad`, `easeInOutQuad` |
| **Cubic** | `easeInCubic`, `easeOutCubic`, `easeInOutCubic` |
| **Quart** | `easeInQuart`, `easeOutQuart`, `easeInOutQuart` |
| **Expo** | `easeInExpo`, `easeOutExpo`, `easeInOutExpo` |
| **Circ** | `easeInCirc`, `easeOutCirc`, `easeInOutCirc` |
| **Back** | `easeInBack`, `easeOutBack`, `easeInOutBack` |
| **Alias** | `spring` (same as `easeOutBack`) |

Common choices:
- **UI transitions**: `easeOutCubic` (fast start, gentle stop)
- **Entrances**: `easeOutQuart` or `easeOutExpo` (dramatic deceleration)
- **Exits**: `easeInCubic` (gentle start, fast end)
- **Bouncy/playful**: `spring` / `easeOutBack` (overshoots target)

### easeFn -- Mathematical Functions

For use with stagger `ease`, timeline `easing`, and programmatic calculations. Functions take `t: 0-1` and return `0-1`.

```ts
import { easeFn } from "@reactzero/flow";
stagger(steps, { each: 50, ease: easeFn.easeOutCubic });
timeline({ easing: easeFn.easeInOutQuad });
```

Includes everything in `easing` plus:
- **Elastic**: `easeInElastic`, `easeOutElastic`, `easeInOutElastic`
- **Bounce**: `easeInBounce`, `easeOutBounce`, `easeInOutBounce`

(Elastic and bounce cannot be expressed as CSS cubic-bezier, so they're only available as math functions.)

### cubicBezier(x1, y1, x2, y2)

Build a custom CSS `cubic-bezier()` string.

```ts
import { cubicBezier } from "@reactzero/flow";
animate(el, kf, { easing: cubicBezier(0.4, 0, 0.2, 1) });
// Returns: "cubic-bezier(0.4, 0, 0.2, 1)"
```

### steps(count, position?)

Build a CSS `steps()` string for step-wise animation.

```ts
import { steps } from "@reactzero/flow";
animate(el, kf, { easing: steps(4) });        // "steps(4)"
animate(el, kf, { easing: steps(8, "start") }); // "steps(8, start)"
```

---

## Type Exports

Flow exports 23 types for full TypeScript support:

```ts
// Core interfaces
import type {
  Controllable,
  PlayState,
  AnimateOptions,
  StepDefinition,
  StaggerConfig,
  AdvancedStaggerConfig,
  ReducedMotionPolicy,
  TimelinePositionOptions,
} from "@reactzero/flow";

// Extended controllables
import type {
  RaceControllable,
  TimeoutControllable,
  TimelineControllable,
} from "@reactzero/flow";

// Composition options
import type {
  RepeatOptions,
  WaitForEventOptions,
} from "@reactzero/flow";

// Hook types
import type {
  UseSequenceOptions,
  UseSequenceReturn,
  UseTimelineOptions,
  UseTimelineReturn,
  UseStaggerOptions,
  UseStaggerReturn,
  UseScrollOptions,
  UseScrollReturn,
  UseViewTransitionReturn,
  ReducedMotionProviderProps,
} from "@reactzero/flow";

// Easing types
import type {
  EaseFn,
  EaseFnPreset,
  EasingPreset,
} from "@reactzero/flow";
```

---

## Animation Optimization Guidelines

### 1. Animate compositor-only properties

The browser can animate `opacity` and `transform` on the GPU compositor thread without triggering layout or paint:

```ts
// FAST: compositor-only (GPU-accelerated)
animate(el, [
  { opacity: 0, transform: "translateY(20px) scale(0.9)" },
  { opacity: 1, transform: "translateY(0) scale(1)" },
], { duration: 300 });

// SLOW: triggers layout recalculation every frame
animate(el, [
  { width: "0px", height: "0px" },
  { width: "200px", height: "150px" },
], { duration: 300 });
```

**Properties to prefer:** `opacity`, `transform` (translate, scale, rotate, skew)
**Properties to avoid:** `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`, `font-size`

### 2. Use factory functions for replay

```ts
// GOOD: fresh animation on each play
sequence(() => animate(el, kf, opts));

// BAD: stale WAAPI animation on replay
const step = animate(el, kf, opts);
sequence(step);
```

### 3. Clean up infinite animations

```tsx
useEffect(() => {
  const ctrl = repeat(() => animate(el, pulse), Infinity);
  ctrl.play();
  return () => ctrl.cancel(); // Critical for cleanup
}, []);
```

### 4. Use playbackRate for speed control

Instead of recreating animations at different durations, adjust `playbackRate`:

```ts
ctrl.playbackRate = 2;   // 2x speed
ctrl.playbackRate = 0.5; // Half speed
```

### 5. commitStyles creates inline styles

After an animation finishes, `commitStyles()` writes the final values as inline styles. If you re-animate the same properties, the new animation overrides them. But if you need a clean state, clear the inline styles manually:

```ts
el.style.transform = "";
el.style.opacity = "";
```

### 6. Keep durations appropriate

- **Micro-interactions** (button hover, toggle): 100-200ms
- **UI transitions** (modal, dropdown): 200-400ms
- **Page transitions**: 300-600ms
- **Attention/storytelling**: 600-1500ms
- **Loading/ambient**: 1500ms+

### 7. Avoid `will-change` with WAAPI

The browser already optimizes WAAPI animations. Adding `will-change: transform` creates a new compositing layer prematurely, increasing memory usage. Let the browser handle optimization.

---

## Composition Patterns & Recipes

### Orchestrated Page Entrance

```ts
const pageEntrance = sequence(
  // Phase 1: Background and header appear together
  () => parallel(
    () => animate(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400 }),
    () => animate(header, [
      { opacity: 0, transform: "translateY(-20px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 500, easing: easing.easeOutCubic }),
  ),
  // Phase 2: Stagger content items
  () => stagger(
    contentItems.map(item => () =>
      animate(item, [
        { opacity: 0, transform: "translateY(30px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 400, easing: easing.easeOutCubic })
    ),
    { each: 60 },
  ),
  // Phase 3: Footer fades in
  () => animate(footer, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }),
);
pageEntrance.play();
```

### Modal with Backdrop

```ts
function showModal() {
  const entrance = parallel(
    () => animate(backdrop, [{ opacity: 0 }, { opacity: 0.5 }], { duration: 250 }),
    () => sequence(
      () => delay(100), // Slight delay for the modal content
      () => animate(modal, [
        { opacity: 0, transform: "scale(0.95) translateY(10px)" },
        { opacity: 1, transform: "scale(1) translateY(0)" },
      ], { duration: 300, easing: easing.easeOutCubic }),
    ),
  );
  entrance.play();
}

function hideModal() {
  const exit = parallel(
    () => animate(modal, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.95)" },
    ], { duration: 200 }),
    () => sequence(
      () => delay(100),
      () => animate(backdrop, [{ opacity: 0.5 }, { opacity: 0 }], { duration: 200 }),
    ),
  );
  exit.play();
}
```

### Scroll-Triggered Stagger

```ts
sequence(
  () => waitForIntersection(sectionEl, { threshold: 0.2 }),
  () => stagger(
    cards.map(card => () =>
      animate(card, [
        { opacity: 0, transform: "translateY(40px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 500, easing: easing.easeOutQuart })
    ),
    { each: 80, from: "start" },
  ),
);
```

### Interactive Timeline Scrubber

```tsx
function ProductShowcase() {
  const { progress, pause, play, state } = useTimeline((tl) => {
    tl.add(() => animate(product, rotateKf), { duration: 1000, at: 0 })
      .label("features")
      .add(() => animate(feature1, fadeIn), { duration: 300, after: "features" })
      .add(() => animate(feature2, fadeIn), { duration: 300, after: "features", offset: 200 })
      .build();
  });

  return (
    <input type="range" min={0} max={100}
      onInput={(e) => { pause(); progress(Number(e.target.value) / 100); }}
      onMouseUp={() => play()}
    />
  );
}
```

### Race: User Action vs Timeout

```ts
const decision = race(
  () => waitForEvent(confirmBtn, "click"),
  () => waitForEvent(cancelBtn, "click"),
  () => delay(15000), // 15-second auto-timeout
);
decision.play();
await decision.finished;

switch (decision.winner) {
  case 0: handleConfirm(); break;
  case 1: handleCancel(); break;
  case 2: handleTimeout(); break;
}
```

### Infinite Loop with Yoyo

```ts
const breathe = repeat(
  () => animate(el, [
    { transform: "scale(1)", opacity: 0.7 },
    { transform: "scale(1.05)", opacity: 1 },
  ], { duration: 2000, easing: easing.easeInOutSine }),
  Infinity,
  { yoyo: true },
);
breathe.play();
// Cancel on cleanup: breathe.cancel();
```

### Crossfade with Reduced Motion

```ts
const kf = [
  { transform: "translateX(-100%)", opacity: 0 },
  { transform: "translateX(0)", opacity: 1 },
];
const opts = { duration: 500, easing: easing.easeOutCubic };

// When reduced motion is active + crossfade policy:
// - transforms are stripped
// - only opacity [0, 1] animates
const step = wrapWithPolicy(
  () => animate(el, kf, opts),
  kf, opts, el,
);

sequence(step).play();
```

---

## Troubleshooting & Common Issues

### "Animation doesn't play"

**Cause:** Controllables start in `"idle"` state. You must call `play()`.

```ts
const ctrl = animate(el, kf, opts);
ctrl.play(); // Don't forget this!
```

For hooks, use `autoPlay: true`:
```tsx
useSequence(steps, { autoPlay: true });
```

### "Animation resets / styles disappear after finishing"

**Cause:** This is the commitStyles pattern working correctly. The final styles are written as inline styles on the element. If React re-renders the component and doesn't preserve those inline styles, they'll be lost.

**Solution:** Either:
- Use React state to reflect the final visual state
- Ensure the element's style prop doesn't override the committed values
- Use `animate()` only for transient effects, and set final state via React

### "finished promise never resolves"

**Cause:** You're accessing `finished` BEFORE calling `play()`. The `play()` method resets the finished promise, so any reference obtained before `play()` will be stale.

```ts
// WRONG:
const done = ctrl.finished;
ctrl.play();
await done; // Stale promise

// RIGHT:
ctrl.play();
await ctrl.finished; // Fresh promise
```

### "playbackRate doesn't affect delay()"

**Expected behavior:** Negative or zero `playbackRate` values are ignored for `delay()` (timers can't run backwards). Positive values scale the duration -- rate of 2 means the delay completes in half the time.

### "crossfade policy doesn't work"

**Cause:** `crossfadeKeyframes()` must be applied BEFORE `animate()` creates the WAAPI animation. WAAPI cannot change keyframes after creation.

**Solution:** Use `wrapWithPolicy()` at animation creation time:

```ts
// WRONG: applyReducedMotion cannot apply crossfade after creation
const ctrl = animate(el, kf, opts);
applyReducedMotion(ctrl, "crossfade"); // Logs warning, does nothing

// RIGHT: wrapWithPolicy transforms keyframes before animate()
const step = wrapWithPolicy(() => animate(el, kf, opts), kf, opts, el);
```

At the sequence/stagger/timeline level, crossfade falls back to skip (no access to individual step keyframes).

### "Timeline children don't seek correctly"

**Cause:** Timeline children must be initialized via `play()` then `pause()` before WAAPI will accept `currentTime` manipulation. The timeline's `build()` handles this internally on first seek/play.

**Solution:** Ensure you call `.build()` and that the steps are `animate()` calls (delay and event steps are no-ops during seek).

### "Sequence steps run out of order"

**Cause:** Passing pre-created Controllables instead of factory functions. Pre-created controllables may have already finished or have stale state.

```ts
// WRONG: pre-created, possibly stale
const a = animate(el1, kf1, opts);
const b = animate(el2, kf2, opts);
sequence(a, b);

// RIGHT: factory functions, fresh on each run
sequence(
  () => animate(el1, kf1, opts),
  () => animate(el2, kf2, opts),
);
```

### "Memory leak with repeat(Infinity)"

**Not a leak:** `repeat()` creates fresh sequences each iteration and dereferences previous ones for GC. However, you must cancel the repeat on cleanup:

```tsx
useEffect(() => {
  const ctrl = repeat(() => animate(el, kf, opts), Infinity);
  ctrl.play();
  return () => ctrl.cancel(); // Stops the loop and cleans up
}, []);
```

Hooks (`useSequence`, `useStagger`, `useTimeline`) handle cleanup automatically on unmount.

### "useSequence steps don't update when props change"

**By design:** Steps are captured at mount time (empty dependency array). This prevents animation recreation on every render. If you need dynamic steps, cancel and recreate:

```tsx
useEffect(() => {
  const ctrl = sequence(...dynamicSteps);
  ctrl.play();
  return () => ctrl.cancel();
}, [dynamicSteps]); // Re-create when steps change
```

### "Timeline label not found" error

**Cause:** Labels must be defined before they can be referenced with `after`:

```ts
// WRONG: "intro" referenced before definition
timeline()
  .add(step, { after: "intro", duration: 300 }) // Error!
  .label("intro")

// RIGHT: define label first
timeline()
  .label("intro")
  .add(step, { after: "intro", duration: 300 })
```

### "Timeline add() throws 'must specify duration'"

**By design:** Timeline entries require explicit `duration` because the timeline needs to know entry boundaries for seeking. Unlike sequence (which waits for finished), timeline must calculate positions upfront.

```ts
// WRONG:
tl.add(step); // Error: must specify duration

// RIGHT:
tl.add(step, { duration: 300 });
```

---

## Bundle & Package Information

| Property | Value |
|----------|-------|
| Package | `@reactzero/flow` |
| Version | 0.1.0 |
| Module format | ESM-only (`"type": "module"`) |
| Entry point | `@reactzero/flow` (single entry) |
| Exports | 50 (27 value + 23 type) |
| Raw size | ~51KB |
| Gzipped | ~8.7KB |
| Brotli | ~5.26KB |
| Dependencies | 0 (zero dependencies) |
| Peer dependency | `react >= 18.0.0` |
| Tree-shakeable | Yes |
| Browser support | Chrome 75+, Firefox 75+, Safari 13.1+, Edge 79+ |
| TypeScript | Full type definitions included |

### Complete Value Exports (27)

Core: `animate`, `sequence`, `parallel`, `stagger`, `delay`, `timeline`, `race`, `repeat`, `timeout`
Event steps: `waitFor`, `waitForEvent`, `waitForIntersection`
Stagger helper: `computeStaggerOffsets`
Hooks: `useSequence`, `useTimeline`, `useStagger`, `useScroll`, `useViewTransition`, `useReducedMotion`, `useReducedMotionPolicy`
Provider: `ReducedMotionProvider`
Reduced motion: `setReducedMotionPolicy`, `getReducedMotionPolicy`, `getReducePlaybackRate`, `shouldApplyReducedMotion`, `applyReducedMotion`, `wrapWithPolicy`, `crossfadeKeyframes`
Easing: `easing`, `easeFn`, `cubicBezier`, `steps`
