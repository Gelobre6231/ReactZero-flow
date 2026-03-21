# Contributing to @reactzero/flow

Thanks for your interest in contributing! This document covers setup, development workflow, and guidelines.

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- npm (not yarn or pnpm)

## Setup

```bash
git clone https://github.com/motiondesignlv/ReactZero-Flow.git
cd ReactZero-Flow
npm install
```

## Development

```bash
npm run dev          # Start Storybook on port 6006
npm run build        # Build the library (tsup)
npm test             # Run unit tests (Vitest)
npm run test:e2e     # Run Playwright E2E tests
npm run check        # Lint & format check (Biome)
npm run typecheck    # TypeScript type checking
npm run docs:dev     # Start docs site locally (VitePress)
```

## Architecture

The project has two layers:

1. **Core runtime** (`src/*.ts`) -- framework-agnostic animation primitives (animate, sequence, parallel, stagger, delay, timeline, race, repeat, timeout). These have zero dependencies and work without React.

2. **React hooks** (`src/hooks/*.ts`) -- `useSequence`, `useTimeline`, `useStagger`, `useScroll`, `useViewTransition`, `useReducedMotion`. These wrap the core primitives with React lifecycle management.

## Testing

- **Unit tests** in `src/__tests__/` using Vitest + happy-dom
- **E2E tests** in `e2e/` using Playwright (Chromium, Firefox, WebKit)
- happy-dom does NOT implement WAAPI -- tests use a custom mock in `src/__tests__/helpers.ts`

```bash
npm test                    # All unit tests
npm run test:watch          # Watch mode
npm run test:e2e            # E2E (builds first)
```

## Code Style

- **Biome 2.x** for linting and formatting
- Tab indentation, double quotes, 100 char line width
- Run `npm run check:fix` to auto-fix

## Pull Request Process

1. Open an issue first to discuss the change
2. Fork and create a feature branch
3. Make your changes with tests
4. Ensure all checks pass: `npm run check && npm run typecheck && npm test && npm run build`
5. Submit a PR against `main`

## Commit Messages

Use conventional commit style:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` test changes
- `chore:` tooling/config

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
