import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// Define subscribe outside component to prevent resubscription on every render
function subscribe(callback: () => void): () => void {
	const mql = window.matchMedia(QUERY);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
	return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
	return false; // Assume no reduced motion on server
}

export function useReducedMotion(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
