import { useRef, useState, useCallback, useEffect } from "react";
import { animate, repeat } from "@flow/index";
import type { Controllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

function LoadingSpinner() {
	const { easingRef } = useGlobalEasing();
	const ringRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<Controllable | null>(null);

	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState(1);

	const start = useCallback(() => {
		if (!ringRef.current) return;
		controlRef.current?.cancel();

		const el = ringRef.current;

		const ctrl = repeat(
			() => animate(el, [
				{ transform: "rotate(0deg)" },
				{ transform: "rotate(360deg)" },
			], { duration: 1000, easing: easingRef.current }),
			Infinity,
		);

		controlRef.current = ctrl;
		ctrl.playbackRate = speed;
		ctrl.play();
		setPlaying(true);
	}, [speed]);

	const togglePause = useCallback(() => {
		const ctrl = controlRef.current;
		if (!ctrl) return;

		if (ctrl.playState === "running") {
			ctrl.pause();
			setPlaying(false);
		} else {
			ctrl.play();
			setPlaying(true);
		}
	}, []);

	const handleSpeedChange = useCallback((newSpeed: number) => {
		setSpeed(newSpeed);
		if (controlRef.current) {
			controlRef.current.playbackRate = newSpeed;
		}
	}, []);

	const handleStop = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		if (ringRef.current) ringRef.current.style.transform = "rotate(0deg)";
		setPlaying(false);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			controlRef.current?.cancel();
		};
	}, []);

	return (
		<div>
			{/* Spinner ring */}
			<div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
				<div
					ref={ringRef}
					style={{
						width: 64,
						height: 64,
						borderRadius: "50%",
						border: "4px solid #1a1d27",
						borderTopColor: "#8b5cf6",
						borderRightColor: "#8b5cf680",
						willChange: "transform",
					}}
				/>
			</div>

			{/* Status */}
			<div style={{ textAlign: "center", marginBottom: 24 }}>
				<span style={{
					fontSize: "0.75rem",
					fontFamily: "'JetBrains Mono', monospace",
					color: playing ? "#8b5cf6" : "#6b7280",
					letterSpacing: "0.05em",
				}}>
					{playing ? `Spinning at ${speed}x` : controlRef.current ? "Paused" : "Stopped"}
				</span>
			</div>

			{/* Speed controls */}
			<div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
				<span style={{ fontSize: "0.7rem", color: "#9898a6", alignSelf: "center", marginRight: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
					Speed
				</span>
				{[0.5, 1, 2].map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => handleSpeedChange(s)}
						style={{
							padding: "4px 12px",
							borderRadius: 4,
							border: "1px solid",
							fontSize: "0.75rem",
							fontWeight: 600,
							cursor: "pointer",
							fontFamily: "'JetBrains Mono', monospace",
							background: speed === s ? "rgba(139, 92, 246, 0.2)" : "transparent",
							borderColor: speed === s ? "#8b5cf6" : "#1e1e2e",
							color: speed === s ? "#8b5cf6" : "#6b7280",
						}}
					>
						{s}x
					</button>
				))}
			</div>

			{/* Play/Pause/Stop controls */}
			<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
				{!controlRef.current ? (
					<button type="button" className="btn btn-play" onClick={start}>
						Start
					</button>
				) : (
					<button type="button" className="btn btn-play" onClick={togglePause}>
						{playing ? "Pause" : "Resume"}
					</button>
				)}
				<button type="button" className="btn btn-reset" onClick={handleStop}>
					Stop
				</button>
			</div>
		</div>
	);
}

export const code = `import { animate, repeat } from "@reactzero/flow";

const ring = document.querySelector(".spinner-ring");

const spinner = repeat(
  () => animate(ring, [
    { transform: "rotate(0deg)" },
    { transform: "rotate(360deg)" },
  ], { duration: 1000, easing: "linear" }),
  Infinity,
);

spinner.play();

// Pause/resume
spinner.pause();
spinner.play();

// Change speed
spinner.playbackRate = 2; // 2x speed`;

export default LoadingSpinner;
