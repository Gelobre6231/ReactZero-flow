import { useRef, useState, useCallback } from "react";
import { animate, race, delay } from "@flow/index";
import type { RaceControllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

function randomResponseTime() {
	return Math.floor(800 + Math.random() * 2200); // 800–3000ms
}

function randomTimeout() {
	return Math.floor(1500 + Math.random() * 1300); // 1500–2800ms
}

function FetchWithTimeout() {
	const { easingRef } = useGlobalEasing();
	const fetchBarRef = useRef<HTMLDivElement>(null);
	const timeoutBarRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<RaceControllable | null>(null);

	const [responseTime, setResponseTime] = useState(randomResponseTime);
	const [timeoutMs, setTimeoutMs] = useState(randomTimeout);
	const [status, setStatus] = useState<"idle" | "running" | "success" | "timeout">("idle");
	const [winner, setWinner] = useState<number | undefined>(undefined);

	const handlePlay = useCallback(() => {
		if (!fetchBarRef.current || !timeoutBarRef.current) return;

		// Fresh random durations each run
		const newResponseTime = randomResponseTime();
		const newTimeout = randomTimeout();
		setResponseTime(newResponseTime);
		setTimeoutMs(newTimeout);

		// Reset bars
		fetchBarRef.current.style.width = "0%";
		timeoutBarRef.current.style.width = "0%";
		setStatus("running");
		setWinner(undefined);

		const fetchEl = fetchBarRef.current;
		const timeoutEl = timeoutBarRef.current;

		// Visual-only: animate the timeout bar (not part of the race logic)
		const timeoutBarAnim = animate(timeoutEl, [{ width: "0%" }, { width: "100%" }], {
			duration: newTimeout,
			easing: easingRef.current,
		});
		timeoutBarAnim.play();

		const ctrl = race(
			// Step 0: The "fetch" -- a progress bar filling up
			() => animate(fetchEl, [{ width: "0%" }, { width: "100%" }], {
				duration: newResponseTime,
				easing: easingRef.current,
			}),
			// Step 1: The deadline
			() => delay(newTimeout),
		);

		controlRef.current = ctrl;
		ctrl.play();
		ctrl.finished.then(() => {
			const w = ctrl.winner;
			setWinner(w);
			setStatus(w === 0 ? "success" : "timeout");
		});
	}, []);

	const handleReset = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		if (fetchBarRef.current) fetchBarRef.current.style.width = "0%";
		if (timeoutBarRef.current) timeoutBarRef.current.style.width = "0%";
		setStatus("idle");
		setWinner(undefined);
	}, []);

	return (
		<div>
			{/* Config display */}
			<div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
				<div style={configStyle}>
					<span style={{ color: "#9898a6", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
						Response Time
					</span>
					<span style={{ color: "#3b82f6", fontWeight: 600, fontSize: "1.1rem", fontFamily: "'JetBrains Mono', monospace" }}>
						{responseTime}ms
					</span>
				</div>
				<div style={configStyle}>
					<span style={{ color: "#9898a6", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
						Timeout
					</span>
					<span style={{ color: "#ef4444", fontWeight: 600, fontSize: "1.1rem", fontFamily: "'JetBrains Mono', monospace" }}>
						{timeoutMs}ms
					</span>
				</div>
			</div>

			{/* Fetch progress */}
			<div style={{ marginBottom: 16 }}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
					<span style={{ fontSize: "0.8rem", color: "#e0e0e6" }}>API Fetch</span>
					{winner === 0 && <span style={badgeSuccess}>Success</span>}
				</div>
				<div style={trackStyle}>
					<div
						ref={fetchBarRef}
						style={{
							...barBase,
							background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
							width: "0%",
						}}
					/>
				</div>
			</div>

			{/* Timeout countdown */}
			<div style={{ marginBottom: 24 }}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
					<span style={{ fontSize: "0.8rem", color: "#e0e0e6" }}>Timeout Deadline</span>
					{winner === 1 && <span style={badgeError}>Timed Out</span>}
				</div>
				<div style={trackStyle}>
					<div
						ref={timeoutBarRef}
						style={{
							...barBase,
							background: "linear-gradient(90deg, #ef4444, #f87171)",
							width: "0%",
						}}
					/>
				</div>
			</div>

			{/* Result card */}
			{status === "success" && (
				<div style={{ ...resultCard, borderColor: "rgba(34, 197, 94, 0.4)", background: "rgba(34, 197, 94, 0.08)" }}>
					<span style={{ fontSize: "1.2rem" }}>&#x2713;</span>
					<span style={{ color: "#22c55e", fontWeight: 600 }}>Response received in {responseTime}ms</span>
				</div>
			)}
			{status === "timeout" && (
				<div style={{ ...resultCard, borderColor: "rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.08)" }}>
					<span style={{ fontSize: "1.2rem" }}>&#x2717;</span>
					<span style={{ color: "#ef4444", fontWeight: 600 }}>Request timed out after {timeoutMs}ms</span>
				</div>
			)}

			{/* Controls */}
			<div style={{ display: "flex", gap: 8, marginTop: 16 }}>
				<button type="button" className="btn btn-play" onClick={handlePlay} disabled={status === "running"}>
					{status === "idle" ? "Fetch" : "Retry"}
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

const configStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 4,
	background: "#1a1d27",
	padding: "10px 16px",
	borderRadius: 8,
	border: "1px solid #1e1e2e",
};

const trackStyle: React.CSSProperties = {
	height: 8,
	background: "#1a1d27",
	borderRadius: 4,
	overflow: "hidden",
};

const barBase: React.CSSProperties = {
	height: "100%",
	borderRadius: 4,
	transition: "none",
};

const badgeSuccess: React.CSSProperties = {
	fontSize: "0.7rem",
	fontWeight: 600,
	color: "#22c55e",
	background: "rgba(34, 197, 94, 0.1)",
	border: "1px solid rgba(34, 197, 94, 0.3)",
	padding: "2px 8px",
	borderRadius: 4,
	textTransform: "uppercase",
	letterSpacing: "0.05em",
};

const badgeError: React.CSSProperties = {
	fontSize: "0.7rem",
	fontWeight: 600,
	color: "#ef4444",
	background: "rgba(239, 68, 68, 0.1)",
	border: "1px solid rgba(239, 68, 68, 0.3)",
	padding: "2px 8px",
	borderRadius: 4,
	textTransform: "uppercase",
	letterSpacing: "0.05em",
};

const resultCard: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 10,
	padding: "12px 16px",
	borderRadius: 8,
	border: "1px solid",
};

export const code = `import { animate, race, delay } from "@reactzero/flow";

const fetchBar = document.querySelector(".fetch-bar");
const responseTime = 800 + Math.random() * 2200; // 800–3000ms
const timeout = 1500 + Math.random() * 1300;     // 1500–2800ms

const ctrl = race(
  // Step 0: simulated API fetch
  animate(fetchBar, [{ width: "0%" }, { width: "100%" }], {
    duration: responseTime,
    easing: "ease-out",
  }),
  // Step 1: timeout deadline
  delay(timeout),
);

ctrl.play();
ctrl.finished.then(() => {
  if (ctrl.winner === 0) {
    console.log("Fetch completed in time!");
  } else {
    console.log("Request timed out");
  }
});`;

export default FetchWithTimeout;
