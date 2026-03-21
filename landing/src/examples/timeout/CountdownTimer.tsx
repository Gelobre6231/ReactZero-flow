import { useRef, useState, useCallback, useEffect } from "react";
import { animate, timeout } from "@flow/index";
import type { TimeoutControllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

function CountdownTimer() {
	const { easingRef } = useGlobalEasing();
	const barRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<TimeoutControllable | null>(null);
	const rafRef = useRef<number>(0);

	const [animDuration, setAnimDuration] = useState(5000);
	const [deadline, setDeadline] = useState(3000);
	const [status, setStatus] = useState<"idle" | "running" | "completed" | "timedOut">("idle");
	const [countdown, setCountdown] = useState(0);

	// Countdown display timer
	const startCountdown = useCallback((ms: number) => {
		const startTime = Date.now();
		const endTime = startTime + ms;

		const tick = () => {
			const remaining = Math.max(0, endTime - Date.now());
			setCountdown(remaining);
			if (remaining > 0) {
				rafRef.current = requestAnimationFrame(tick);
			}
		};
		rafRef.current = requestAnimationFrame(tick);
	}, []);

	const handlePlay = useCallback(() => {
		if (!barRef.current) return;

		controlRef.current?.cancel();
		cancelAnimationFrame(rafRef.current);
		setStatus("running");

		const bar = barRef.current;
		bar.style.width = "100%";
		bar.style.background = "linear-gradient(90deg, #3b82f6, #60a5fa)";

		const ctrl = timeout(
			[
				// Main animation: shrink the bar from 100% to 0%
				() => animate(bar, [
					{ width: "100%" },
					{ width: "0%" },
				], { duration: animDuration, easing: easingRef.current }),
			],
			deadline,
		);

		controlRef.current = ctrl;
		ctrl.play();

		// Start the visual countdown using the smaller of the two
		startCountdown(Math.min(animDuration, deadline));

		ctrl.finished.then(() => {
			cancelAnimationFrame(rafRef.current);
			if (ctrl.timedOut) {
				setStatus("timedOut");
				setCountdown(0);
				// Flash the bar red
				bar.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
			} else {
				setStatus("completed");
				setCountdown(0);
				bar.style.background = "linear-gradient(90deg, #22c55e, #4ade80)";
			}
		});
	}, [animDuration, deadline, startCountdown]);

	const handleReset = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		cancelAnimationFrame(rafRef.current);
		if (barRef.current) {
			barRef.current.style.width = "100%";
			barRef.current.style.background = "linear-gradient(90deg, #3b82f6, #60a5fa)";
		}
		setStatus("idle");
		setCountdown(0);
	}, []);

	useEffect(() => {
		return () => {
			controlRef.current?.cancel();
			cancelAnimationFrame(rafRef.current);
		};
	}, []);

	const displayTime = status === "running"
		? (countdown / 1000).toFixed(1)
		: status === "idle"
			? (Math.min(animDuration, deadline) / 1000).toFixed(1)
			: "0.0";

	return (
		<div>
			{/* Countdown display */}
			<div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
				<div style={{
					position: "relative",
					width: 120,
					height: 120,
					borderRadius: "50%",
					background: "#1a1d27",
					border: `3px solid ${
						status === "timedOut" ? "#ef4444"
						: status === "completed" ? "#22c55e"
						: status === "running" ? "#3b82f6"
						: "#1e1e2e"
					}`,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: status === "running"
						? "0 0 20px rgba(59, 130, 246, 0.2)"
						: status === "timedOut"
							? "0 0 20px rgba(239, 68, 68, 0.2)"
							: "none",
				}}>
					<span style={{
						fontSize: "2rem",
						fontWeight: 700,
						fontFamily: "'JetBrains Mono', monospace",
						color: status === "timedOut" ? "#ef4444"
							: status === "completed" ? "#22c55e"
							: "#e0e0e6",
						lineHeight: 1,
					}}>
						{displayTime}
					</span>
					<span style={{ fontSize: "0.6rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
						seconds
					</span>
				</div>
			</div>

			{/* Progress bar */}
			<div style={{
				height: 6,
				background: "#1a1d27",
				borderRadius: 3,
				overflow: "hidden",
				marginBottom: 24,
			}}>
				<div
					ref={barRef}
					style={{
						height: "100%",
						width: "100%",
						background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
						borderRadius: 3,
					}}
				/>
			</div>

			{/* Result */}
			{status === "completed" && (
				<div style={{ textAlign: "center", marginBottom: 16 }}>
					<span style={{
						fontSize: "0.75rem",
						fontWeight: 600,
						color: "#22c55e",
						background: "rgba(34, 197, 94, 0.1)",
						border: "1px solid rgba(34, 197, 94, 0.3)",
						padding: "4px 12px",
						borderRadius: 4,
					}}>
						Completed in time!
					</span>
				</div>
			)}
			{status === "timedOut" && (
				<div style={{ textAlign: "center", marginBottom: 16 }}>
					<span style={{
						fontSize: "0.75rem",
						fontWeight: 600,
						color: "#ef4444",
						background: "rgba(239, 68, 68, 0.1)",
						border: "1px solid rgba(239, 68, 68, 0.3)",
						padding: "4px 12px",
						borderRadius: 4,
					}}>
						Timed out!
					</span>
				</div>
			)}

			{/* Config */}
			<div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
				<div style={{ flex: 1 }}>
					<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
						<span style={sliderLabel}>Animation</span>
						<span style={{ ...sliderValue, color: "#3b82f6" }}>{animDuration}ms</span>
					</div>
					<input
						type="range"
						min={1000}
						max={8000}
						step={500}
						value={animDuration}
						onChange={(e) => setAnimDuration(Number(e.target.value))}
						disabled={status === "running"}
						style={{ width: "100%", accentColor: "#3b82f6", height: 4 }}
					/>
				</div>
				<div style={{ flex: 1 }}>
					<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
						<span style={sliderLabel}>Deadline</span>
						<span style={{ ...sliderValue, color: "#f59e0b" }}>{deadline}ms</span>
					</div>
					<input
						type="range"
						min={1000}
						max={8000}
						step={500}
						value={deadline}
						onChange={(e) => setDeadline(Number(e.target.value))}
						disabled={status === "running"}
						style={{ width: "100%", accentColor: "#f59e0b", height: 4 }}
					/>
				</div>
			</div>

			{/* Hint */}
			<div style={{ textAlign: "center", marginBottom: 16 }}>
				<span style={{ fontSize: "0.7rem", color: "#6b7280" }}>
					{animDuration <= deadline
						? "Animation will complete before deadline"
						: "Deadline will fire before animation finishes"}
				</span>
			</div>

			{/* Controls */}
			<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
				<button type="button" className="btn btn-play" onClick={handlePlay} disabled={status === "running"}>
					{status === "idle" ? "Start" : "Retry"}
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

const sliderLabel: React.CSSProperties = {
	fontSize: "0.7rem",
	color: "#9898a6",
	textTransform: "uppercase",
	letterSpacing: "0.1em",
};

const sliderValue: React.CSSProperties = {
	fontSize: "0.75rem",
	fontWeight: 600,
	fontFamily: "'JetBrains Mono', monospace",
};

export const code = `import { animate, timeout } from "@reactzero/flow";

const bar = document.querySelector(".countdown-bar");

const ctrl = timeout(
  [
    // Animation: shrink bar from 100% to 0%
    animate(bar, [
      { width: "100%" },
      { width: "0%" },
    ], { duration: 5000, easing: "linear" }),
  ],
  3000, // deadline: 3 seconds
);

ctrl.play();
ctrl.finished.then(() => {
  if (ctrl.timedOut) {
    console.log("Timed out! Animation was cancelled.");
  } else {
    console.log("Completed in time!");
  }
});`;

export default CountdownTimer;
