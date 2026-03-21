// Minimal react/jsx-runtime shim for E2E testing.
// The built dist/index.js imports jsx from react/jsx-runtime for the
// ReducedMotionProvider component. This shim provides a no-op so the
// module loads in a plain browser without React.

export const jsx = () => null;
export const jsxs = () => null;
export const Fragment = Symbol("Fragment");
