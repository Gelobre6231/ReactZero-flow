import { createContext, type ReactNode, useContext, useEffect } from "react";
import { setReducedMotionPolicy } from "../reducedMotion.js";
import type { ReducedMotionPolicy } from "../types.js";

interface ReducedMotionContextValue {
	policy: ReducedMotionPolicy;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
	policy: "respect",
});

export interface ReducedMotionProviderProps {
	policy: ReducedMotionPolicy;
	reduceRate?: number;
	children: ReactNode;
}

/**
 * React context provider that wraps the core setReducedMotionPolicy API.
 * Sets the global policy on mount/update and resets to 'respect' on unmount.
 */
export function ReducedMotionProvider({
	policy,
	reduceRate,
	children,
}: ReducedMotionProviderProps): ReactNode {
	useEffect(() => {
		setReducedMotionPolicy(policy, { reduceRate });
		return () => {
			setReducedMotionPolicy("respect");
		};
	}, [policy, reduceRate]);

	return (
		<ReducedMotionContext.Provider value={{ policy }}>{children}</ReducedMotionContext.Provider>
	);
}

/**
 * Read the current reduced motion policy from the nearest ReducedMotionProvider.
 * Returns 'respect' if no provider is present.
 */
export function useReducedMotionPolicy(): ReducedMotionPolicy {
	return useContext(ReducedMotionContext).policy;
}
