# @reactzero/flow -- AI Reference

Zero-dependency animation orchestration for React, powered by WAAPI. ESM-only, <10KB gzipped.

```bash
npm install @reactzero/flow
```

## Core Functions

### animate(element, keyframes, options?) -> Controllable
WAAPI wrapper with commitStyles pattern. Persists final state to inline styles. Automatic `will-change` management for compositor properties.
Options: `{ duration, easing, delay, iterations, direction, composite, iterationComposite, willChange, __perf, priority, decompose }`.
```ts
animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 })
animate(el, kf, { duration: 300, willChange: false }) // opt out of will-change
animate(el, kf, { duration: 300, __perf: true }) // enable DevTools annotations
animate(el, kf, { duration: 300, priority: "decorative" }) // adaptive degradation
animate(el, [{ left: "0px" }, { left: "100px" }], { duration: 300, decompose: true }) // layout→transform
```

### sequence(...steps) -> Controllable
Run steps one after another. Each waits for previous `finished`.
```ts
sequence(() => animate(el, kf1, o1), () => delay(100), () => animate(el, kf2, o2))
```

### parallel(...steps) -> Controllable
Run all steps simultaneously. Finishes when slowest completes.

### stagger(steps, config) -> Controllable
Parallel with staggered start delays. Config: `{ each: number }`.

### delay(ms) -> Controllable
Time-based pause step.

### timeline(options?) -> TimelineBuilder
Seekable position-based choreography. Builder API: `.add(step, { at, after, offset, duration })`, `.label(name)`, `.build()`.

Returns `TimelineControllable` with: `seek(ms)`, `progress(0-1)`, `seekTo(label)`, `currentTime`, `duration`.

### race(...steps) -> RaceControllable
First to finish wins, rest cancelled. `winner` property = winning index.

### repeat(steps, count, options?) -> Controllable
Repeat N times or Infinity. Options: `{ yoyo: boolean, onRepeat: fn }`.

### timeout(steps, ms) -> TimeoutControllable
Cancel if exceeding deadline. `timedOut` property after completion.

## Event Steps

### waitForEvent(target, eventName, options?) -> Controllable
Wait for DOM event. Options: `{ filter: (e) => boolean }`.

### waitForIntersection(element, options?) -> Controllable
Wait for element to enter viewport via IntersectionObserver.

### waitFor(promiseOrFactory) -> Controllable
Wrap a Promise as a step.

## React Hooks

### useSequence(steps, options?) -> { play, pause, cancel, state }
Options: `{ autoPlay, reducedMotion }`. State: `"idle" | "running" | "paused" | "finished"`.

### useTimeline(builder, options?) -> { play, pause, cancel, finish, seek, progress, seekTo, state, currentTime, duration, playbackRate, setPlaybackRate }

### useStagger(steps, config, options?) -> { play, pause, cancel, state }
Config: `{ each, from, grid, axis, ease }`.

### useScroll(options?) -> { progress, scrollTo, ref }
Options: `{ source, target, axis, offset }`. Progress: 0-1 reactive number.
Uses native ScrollTimeline when available (Chrome 115+), falls back to IO + scroll listener.

### useViewTransition() -> { startTransition, ready, finished, skipTransition, isSupported }
Same-document only. NOT a Controllable. Falls back to instant update if unsupported.

### useReducedMotion() -> boolean
Reactive `prefers-reduced-motion` tracking.

## Reduced Motion

### setReducedMotionPolicy(policy, options?)
Global: `"skip" | "reduce" | "crossfade" | "respect"`. Options: `{ reduceRate: number }`.

### ReducedMotionProvider
React context: `<ReducedMotionProvider policy="skip" reduceRate={5}>`.

### wrapWithPolicy(stepFn, keyframes, options, element) -> () => Controllable
Wraps step factory with crossfade support.

## Performance

### extractAnimatedProperties(keyframes) -> string[]
Extract CSS property names from keyframes (both Keyframe[] and PropertyIndexedKeyframes formats).
```ts
extractAnimatedProperties([{ opacity: 0 }, { opacity: 1 }]) // ["opacity"]
```

### getCompositorProperties(properties) -> string[]
Filter to compositor-tier properties only (transform, opacity, filter, etc.).
```ts
getCompositorProperties(["transform", "width", "opacity"]) // ["transform", "opacity"]
```

### linearEasing(fn, points?) -> string
Sample math easing function into CSS `linear()` string. Enables elastic/bounce on compositor.
```ts
animate(el, kf, { easing: linearEasing(easeFn.easeOutElastic) })
animate(el, kf, { easing: linearEasing(easeFn.easeOutBounce, 60) })
```

### supportsLinearEasing() -> boolean
Check if browser supports CSS `linear()` easing function. Chrome 113+, Safari 17.2+.

### setPerformanceAnnotations(enabled)
Enable/disable DevTools performance annotations globally. Creates `performance.mark/measure` entries.
```ts
setPerformanceAnnotations(true)
// All subsequent animate() calls create marks: flow:element:props:start/end
```

### getPerformanceAnnotations() -> boolean
Get current annotation setting.

### annotateAnimation(element, properties, duration, controllable, perf?)
Low-level annotation API. Called automatically by `animate()` when enabled.

## Adaptive Performance (v2.0)

### enableAdaptivePerformance(config?) -> void
Single opt-in entry point. Detects device tier, starts frame monitoring, enables priority-based degradation.
```ts
enableAdaptivePerformance()
enableAdaptivePerformance({ tier: "low", frameMonitor: { degradeBelow: 50 }, moderateSpeedUp: 3 })
```

### disableAdaptivePerformance() -> void
Stop monitoring, reset pressure to "none".

### isAdaptivePerformanceEnabled() -> boolean

### Animation Priority
Set per-animation: `{ priority: "critical" | "normal" | "decorative" }`. Default: `"normal"`.

Priority matrix (pressure x priority):
- pressure=none: all run normally
- pressure=moderate: decorative=skip, normal/critical=run
- pressure=critical: decorative=skip, normal=reduce (faster playback), critical=run

```ts
animate(el, kf, { duration: 300, priority: "decorative" })
wrapWithPriority(() => animate(el, kf, opts), "decorative") // wrap any step factory
```

### getPressure() -> "none" | "moderate" | "critical"
### setPressure(level)
### onPressureChange(callback) -> () => void
### resolvePriorityAction(priority) -> "run" | "reduce" | "skip"
### applyPriority(controllable, priority) -> void
### wrapWithPriority(stepFn, priority) -> () => Controllable
### getModerateSpeedUp() / setModerateSpeedUp(rate)
Default speed-up multiplier: 2.

### Device Tier Detection
```ts
detectDeviceTier() // -> "high" | "medium" | "low"
getDeviceTier()    // cached result or override
setDeviceTier("low") // manual override
```
Uses `navigator.hardwareConcurrency`, `navigator.deviceMemory`, screen resolution. Cached per session.

### Frame Rate Monitor
rAF-based FPS measurement with rolling window. Only runs when enabled via `enableAdaptivePerformance()`.
```ts
configureFrameMonitor({ degradeBelow: 45, criticalBelow: 30, windowSize: 10 })
startFrameMonitor()
getFrameRate() // current FPS
onFrameRateChange(fps => console.log(fps)) // subscribe
stopFrameMonitor()
```
Automatically updates pressure when FPS crosses thresholds.

### Smart Transform Decomposition
Opt-in layout-to-transform conversion: `{ decompose: true }`.
```ts
animate(el, [{ left: "0px" }, { left: "100px" }], { duration: 300, decompose: true })
// Becomes: [{ transform: "translateX(0px)" }, { transform: "translateX(100px)" }]
```
Conversions: `left->translateX`, `top->translateY`, `right->translateX(-)`, `bottom->translateY(-)`, `width->scaleX`, `height->scaleY`.
Element needs `position: relative/absolute/fixed` (warns if static).

```ts
decomposeTransforms(keyframes, element) // low-level utility
validateDecomposePosition(element) // true if position allows transforms
```

## Controllable Interface

All primitives return this:
```ts
interface Controllable {
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  readonly finished: Promise<void>; // Always resolves, never rejects
  readonly playState: "idle" | "running" | "paused" | "finished";
  playbackRate: number;
}
```

## Key Patterns

- **StepDefinition**: `Controllable | (() => Controllable)` -- factory functions recommended for replay
- **commitStyles**: animate() calls commitStyles() + cancel() on finish (no fill:"forwards")
- **finished never rejects**: cancel() resolves finished (no AbortError)
- **Composition**: any Controllable nests inside any other
- **playbackRate propagation**: setting rate on compound propagates to active children
- **will-change**: animate() auto-sets will-change for compositor properties, removes after finish/cancel
- **dev warnings**: warnLayoutProperties() warns for width/height/top/left with GPU alternatives
- **adaptive performance**: opt-in via enableAdaptivePerformance(). Priority system degrades decorative animations under pressure
- **decompose**: opt-in layout→transform conversion in animate() options

## Bundle

- ESM-only (`type: "module"`)
- Single entry: `@reactzero/flow`
- Peer dep: `react >= 18.0.0`
- ~8KB brotli
- 78 exports (50 value + 28 type)
