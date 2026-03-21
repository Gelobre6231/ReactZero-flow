// Minimal React shim for E2E testing of core (non-React) library functions.
// The built dist/index.js imports React at the top level because it includes
// React hooks. This shim provides no-op implementations so the module loads
// in a plain browser without React installed.

const noop = () => {};
const noopRef = () => ({ current: null });

export const createContext = (defaultValue) => ({
	Provider: noop,
	Consumer: noop,
	_currentValue: defaultValue,
});
export const useEffect = noop;
export const useContext = (ctx) => ctx._currentValue;
export const useSyncExternalStore = () => undefined;
export const useRef = noopRef;
export const useMemo = (fn) => fn();
export const useState = (init) => [typeof init === "function" ? init() : init, noop];
export const useCallback = (fn) => fn;
