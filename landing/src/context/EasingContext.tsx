import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

const DEFAULT_EASING = "cubic-bezier(0.93, 0, 0.08, 1)";

interface EasingContextValue {
	easing: string;
	setEasing: (easing: string) => void;
	easingRef: React.RefObject<string>;
}

const EasingContext = createContext<EasingContextValue>({
	easing: DEFAULT_EASING,
	setEasing: () => {},
	easingRef: { current: DEFAULT_EASING },
});

export function EasingProvider({ children }: { children: ReactNode }) {
	const [easing, setEasingState] = useState(DEFAULT_EASING);
	const easingRef = useRef(DEFAULT_EASING);

	const setEasing = useCallback((value: string) => {
		easingRef.current = value;
		setEasingState(value);
	}, []);

	return (
		<EasingContext.Provider value={{ easing, setEasing, easingRef }}>
			{children}
		</EasingContext.Provider>
	);
}

export function useGlobalEasing() {
	return useContext(EasingContext);
}

export { DEFAULT_EASING };
