import { useRef, useState, useCallback } from "react";
import { animate, timeout, delay } from "@flow/index";
import type { TimeoutControllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

function AutoDismissToast() {
	const { easingRef } = useGlobalEasing();
	const toastRef = useRef<HTMLDivElement>(null);
	const progressRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<TimeoutControllable | null>(null);

	const [deadlineMs, setDeadlineMs] = useState(3000);
	const [status, setStatus] = useState<"idle" | "showing" | "completed" | "timedOut">("idle");

	const handlePlay = useCallback(() => {
		if (!toastRef.current || !progressRef.current) return;

		controlRef.current?.cancel();
		setStatus("showing");

		const toast = toastRef.current;
		const progress = progressRef.current;

		// Reset styles
		toast.style.transform = "translateX(120%)";
		toast.style.opacity = "0";
		toast.style.background = "#1a1d27";
		toast.style.borderColor = "#1e1e2e";
		progress.style.width = "100%";
		progress.style.background = "#3b82f6";

		// The "content" animation:
		//  1. Slide toast in
		//  2. Wait (simulating user reading)
		//  3. Slide toast out
		const animationDuration = 4000; // total content time

		const ctrl = timeout(
			[
				// Slide in
				() => animate(toast, [
					{ transform: "translateX(120%)", opacity: 0 },
					{ transform: "translateX(0)", opacity: 1 },
				], { duration: 400, easing: easingRef.current }),
				// Wait while "reading"
				() => delay(animationDuration - 800),
				// Slide out
				() => animate(toast, [
					{ transform: "translateX(0)", opacity: 1 },
					{ transform: "translateX(120%)", opacity: 0 },
				], { duration: 400, easing: easingRef.current }),
			],
			deadlineMs,
		);

		controlRef.current = ctrl;

		// Animate the progress bar independently (visual timer for the deadline)
		animate(progress, [
			{ width: "100%" },
			{ width: "0%" },
		], { duration: deadlineMs, easing: easingRef.current }).play();

		ctrl.play();
		ctrl.finished.then(() => {
			if (ctrl.timedOut) {
				setStatus("timedOut");
				// Shake the toast and turn it red
				toast.style.background = "rgba(239, 68, 68, 0.1)";
				toast.style.borderColor = "rgba(239, 68, 68, 0.4)";
				toast.style.transform = "translateX(0)";
				toast.style.opacity = "1";

				const shakeAnim = animate(toast, [
					{ transform: "translateX(0)" },
					{ transform: "translateX(-8px)" },
					{ transform: "translateX(8px)" },
					{ transform: "translateX(-6px)" },
					{ transform: "translateX(6px)" },
					{ transform: "translateX(0)" },
				], { duration: 400, easing: easingRef.current });
				shakeAnim.play();
			} else {
				setStatus("completed");
				toast.style.background = "rgba(34, 197, 94, 0.1)";
				toast.style.borderColor = "rgba(34, 197, 94, 0.4)";
			}
		});
	}, [deadlineMs]);

	const handleReset = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		if (toastRef.current) {
			toastRef.current.style.transform = "translateX(120%)";
			toastRef.current.style.opacity = "0";
			toastRef.current.style.background = "#1a1d27";
			toastRef.current.style.borderColor = "#1e1e2e";
		}
		if (progressRef.current) {
			progressRef.current.style.width = "100%";
		}
		setStatus("idle");
	}, []);

	return (
		<div>
			{/* Timeout slider */}
			<div style={{ marginBottom: 20 }}>
				<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
					<span style={{ fontSize: "0.75rem", color: "#9898a6", textTransform: "uppercase", letterSpacing: "0.1em" }}>
						Deadline
					</span>
					<span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
						{deadlineMs}ms
					</span>
				</div>
				<input
					type="range"
					min={1000}
					max={5000}
					step={500}
					value={deadlineMs}
					onChange={(e) => setDeadlineMs(Number(e.target.value))}
					disabled={status === "showing"}
					style={{
						width: "100%",
						accentColor: "#f59e0b",
						height: 4,
					}}
				/>
				<div style={{ display: "flex", justifyContent: "space-between" }}>
					<span style={{ fontSize: "0.65rem", color: "#6b7280" }}>1s</span>
					<span style={{ fontSize: "0.65rem", color: "#6b7280" }}>5s</span>
				</div>
			</div>

			{/* Toast area */}
			<div style={{
				minHeight: 100,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				marginBottom: 20,
				position: "relative",
				overflow: "hidden",
				borderRadius: 8,
				background: "#12121a",
				border: "1px solid #1e1e2e",
			}}>
				{status === "idle" && (
					<span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Toast will appear here</span>
				)}
				<div
					ref={toastRef}
					style={{
						position: "absolute",
						right: 12,
						top: "50%",
						marginTop: -32,
						width: 260,
						background: "#1a1d27",
						border: "1px solid #1e1e2e",
						borderRadius: 8,
						padding: "12px 16px",
						transform: "translateX(120%)",
						opacity: 0,
						overflow: "hidden",
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
						<span style={{ fontSize: "0.9rem" }}>
							{status === "timedOut" ? "\u26A0" : status === "completed" ? "\u2713" : "\u2139"}
						</span>
						<span style={{
							fontSize: "0.8rem",
							fontWeight: 600,
							color: status === "timedOut" ? "#ef4444" : status === "completed" ? "#22c55e" : "#e0e0e6",
						}}>
							{status === "timedOut" ? "Auto-dismissed!" : status === "completed" ? "Completed!" : "Notification"}
						</span>
					</div>
					<p style={{ fontSize: "0.75rem", color: "#9898a6", margin: 0 }}>
						{status === "timedOut"
							? "Toast exceeded deadline"
							: "This is a toast message with a progress countdown."}
					</p>
					{/* Progress bar */}
					<div style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: 3,
						background: "#12121a",
					}}>
						<div
							ref={progressRef}
							style={{
								height: "100%",
								width: "100%",
								background: "#3b82f6",
								borderRadius: "0 0 0 8px",
							}}
						/>
					</div>
				</div>
			</div>

			{/* Result badge */}
			{status === "completed" && (
				<div style={{ textAlign: "center", marginBottom: 12 }}>
					<span style={{
						fontSize: "0.7rem",
						fontWeight: 600,
						color: "#22c55e",
						background: "rgba(34, 197, 94, 0.1)",
						border: "1px solid rgba(34, 197, 94, 0.3)",
						padding: "4px 10px",
						borderRadius: 4,
					}}>
						Completed before deadline
					</span>
				</div>
			)}
			{status === "timedOut" && (
				<div style={{ textAlign: "center", marginBottom: 12 }}>
					<span style={{
						fontSize: "0.7rem",
						fontWeight: 600,
						color: "#ef4444",
						background: "rgba(239, 68, 68, 0.1)",
						border: "1px solid rgba(239, 68, 68, 0.3)",
						padding: "4px 10px",
						borderRadius: 4,
					}}>
						Timed out at {deadlineMs}ms
					</span>
				</div>
			)}

			{/* Controls */}
			<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
				<button type="button" className="btn btn-play" onClick={handlePlay} disabled={status === "showing"}>
					{status === "idle" ? "Show Toast" : "Retry"}
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

export const code = `import { animate, timeout, delay } from "@reactzero/flow";

const toast = document.querySelector(".toast");

const ctrl = timeout(
  [
    // Slide in
    () => animate(toast, [
      { transform: "translateX(120%)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 },
    ], { duration: 400, easing: "ease-out" }),
    // Wait while user reads
    () => delay(3200),
    // Slide out
    () => animate(toast, [
      { transform: "translateX(0)", opacity: 1 },
      { transform: "translateX(120%)", opacity: 0 },
    ], { duration: 400 }),
  ],
  3000, // deadline: auto-dismiss after 3s
);

ctrl.play();
ctrl.finished.then(() => {
  if (ctrl.timedOut) {
    console.log("Toast auto-dismissed (timed out)");
  } else {
    console.log("Toast animation completed normally");
  }
});`;

export default AutoDismissToast;
