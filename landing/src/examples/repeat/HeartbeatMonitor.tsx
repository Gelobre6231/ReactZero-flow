import { useRef, useState, useCallback, useEffect } from "react";
import { animate, repeat } from "@flow/index";
import type { Controllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

const BASE_DURATION = 800; // ms per beat at 75 BPM

function HeartbeatMonitor() {
	const { easingRef } = useGlobalEasing();
	const heartRef = useRef<HTMLDivElement>(null);
	const pulseRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<Controllable | null>(null);

	const [playing, setPlaying] = useState(false);
	const [iteration, setIteration] = useState(0);
	const [bpm, setBpm] = useState(75);
	const [speed, setSpeed] = useState(1);

	const start = useCallback(() => {
		if (!heartRef.current || !pulseRef.current) return;
		controlRef.current?.cancel();
		setIteration(0);

		const heart = heartRef.current;
		const pulse = pulseRef.current;

		const ctrl = repeat(
			() => animate(heart, [
				{ transform: "scale(1)" },
				{ transform: "scale(1.25)" },
				{ transform: "scale(1)" },
				{ transform: "scale(1.15)" },
				{ transform: "scale(1)" },
			], { duration: BASE_DURATION, easing: easingRef.current }),
			Infinity,
			{
				yoyo: true,
				onRepeat: (i) => {
					setIteration(i + 1);
					// Flash the pulse ring
					if (pulse) {
						pulse.style.opacity = "1";
						pulse.style.transform = "scale(1)";
						requestAnimationFrame(() => {
							pulse.style.transition = "all 0.4s ease-out";
							pulse.style.opacity = "0";
							pulse.style.transform = "scale(2)";
							setTimeout(() => {
								pulse.style.transition = "none";
							}, 400);
						});
					}
				},
			},
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

	const handleStop = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		if (heartRef.current) heartRef.current.style.transform = "scale(1)";
		setPlaying(false);
		setIteration(0);
	}, []);

	const handleSpeedChange = useCallback((newSpeed: number) => {
		setSpeed(newSpeed);
		const newBpm = Math.round(75 * newSpeed);
		setBpm(newBpm);
		if (controlRef.current) {
			controlRef.current.playbackRate = newSpeed;
		}
	}, []);

	useEffect(() => {
		return () => {
			controlRef.current?.cancel();
		};
	}, []);

	return (
		<div>
			{/* Heart display */}
			<div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
				<div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
					{/* Pulse ring */}
					<div
						ref={pulseRef}
						style={{
							position: "absolute",
							inset: 0,
							borderRadius: "50%",
							border: "2px solid #ef4444",
							opacity: 0,
							transform: "scale(1)",
							pointerEvents: "none",
						}}
					/>
					{/* Heart */}
					<div
						ref={heartRef}
						style={{
							willChange: "transform",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							filter: playing ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))" : "none",
						}}
					>
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
						</svg>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 24 }}>
				<div style={statBox}>
					<span style={statLabel}>BPM</span>
					<span style={{ ...statValue, color: "#ef4444" }}>{bpm}</span>
				</div>
				<div style={statBox}>
					<span style={statLabel}>Beats</span>
					<span style={{ ...statValue, color: "#8b5cf6" }}>{iteration}</span>
				</div>
				<div style={statBox}>
					<span style={statLabel}>Speed</span>
					<span style={{ ...statValue, color: "#3b82f6" }}>{speed}x</span>
				</div>
			</div>

			{/* BPM speed presets */}
			<div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
				{[
					{ label: "Resting", speed: 0.8 },
					{ label: "Normal", speed: 1 },
					{ label: "Elevated", speed: 1.5 },
					{ label: "Active", speed: 2 },
				].map((preset) => (
					<button
						key={preset.label}
						type="button"
						onClick={() => handleSpeedChange(preset.speed)}
						style={{
							padding: "4px 10px",
							borderRadius: 4,
							border: "1px solid",
							fontSize: "0.7rem",
							fontWeight: 600,
							cursor: "pointer",
							background: speed === preset.speed ? "rgba(239, 68, 68, 0.15)" : "transparent",
							borderColor: speed === preset.speed ? "rgba(239, 68, 68, 0.4)" : "#1e1e2e",
							color: speed === preset.speed ? "#ef4444" : "#6b7280",
						}}
					>
						{preset.label}
					</button>
				))}
			</div>

			{/* Controls */}
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

const statBox: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	gap: 4,
	background: "#1a1d27",
	padding: "8px 16px",
	borderRadius: 8,
	border: "1px solid #1e1e2e",
	minWidth: 64,
};

const statLabel: React.CSSProperties = {
	fontSize: "0.65rem",
	color: "#9898a6",
	textTransform: "uppercase",
	letterSpacing: "0.1em",
};

const statValue: React.CSSProperties = {
	fontSize: "1.1rem",
	fontWeight: 700,
	fontFamily: "'JetBrains Mono', monospace",
};

export const code = `import { animate, repeat } from "@reactzero/flow";

const heart = document.querySelector(".heart");

const heartbeat = repeat(
  () => animate(heart, [
    { transform: "scale(1)" },
    { transform: "scale(1.25)" },
    { transform: "scale(1)" },
    { transform: "scale(1.15)" },
    { transform: "scale(1)" },
  ], { duration: 800, easing: "ease-in-out" }),
  Infinity,
  {
    yoyo: true,
    onRepeat: (iteration) => {
      console.log(\`Beat \${iteration + 1}\`);
    },
  },
);

heartbeat.play();

// Change heart rate
heartbeat.playbackRate = 1.5; // faster
heartbeat.playbackRate = 0.8; // slower

// Pause/resume
heartbeat.pause();
heartbeat.play();`;

export default HeartbeatMonitor;
