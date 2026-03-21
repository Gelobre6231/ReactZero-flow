# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-15

### Added

- Core primitives: `animate()`, `sequence()`, `parallel()`, `stagger()`, `delay()`
- Composition operators: `race()`, `repeat()`, `timeout()`
- Seekable timeline with labels: `timeline()`
- Event steps: `waitForEvent()`, `waitForIntersection()`, `waitFor()`
- React hooks: `useSequence`, `useTimeline`, `useStagger`, `useScroll`, `useViewTransition`, `useReducedMotion`
- Reduced motion policy system (skip/reduce/crossfade/respect)
- `ReducedMotionProvider` context
- Playback control on all Controllables (play/pause/cancel/finish/playbackRate)
- VitePress documentation site
- Storybook interactive demos
- 268 unit tests + 48 E2E tests
- CI/CD with GitHub Actions
