import { useRef, useState, useCallback } from "react";
import { animate, repeat, parallel } from "@flow/index";
import type { Controllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

function PulsingNotification() {
	const { easingRef } = useGlobalEasing();
	const badgeRef = useRef<HTMLDivElement>(null);
	const bellRef = useRef<HTMLDivElement>(null);
	const controlRef = useRef<Controllable | null>(null);

	const [count, setCount] = useState(3);
	const [iterations, setIterations] = useState(5);
	const [yoyo, setYoyo] = useState(false);
	const [status, setStatus] = useState<"idle" | "running" | "finished">("idle");

	const handlePlay = useCallback(() => {
		if (!badgeRef.current || !bellRef.current) return;

		controlRef.current?.cancel();
		setCount(3);
		setStatus("running");

		const badge = badgeRef.current;
		const bell = bellRef.current;

		const ctrl = repeat(
			[
				() => parallel(
					// Badge pulse
					() => animate(badge, [
						{ transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
						{ transform: "scale(1.35)", boxShadow: "0 0 12px 4px rgba(239, 68, 68, 0.6)" },
						{ transform: "scale(1)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.4)" },
					], { duration: 600, easing: easingRef.current }),
					// Bell shake
					() => animate(bell, [
						{ transform: "rotate(0deg)" },
						{ transform: "rotate(15deg)" },
						{ transform: "rotate(-15deg)" },
						{ transform: "rotate(10deg)" },
						{ transform: "rotate(-10deg)" },
						{ transform: "rotate(0deg)" },
					], { duration: 500, easing: easingRef.current }),
				),
			],
			iterations,
			{
				yoyo,
				onRepeat: () => {
					setCount((c) => c + 1);
				},
			},
		);

		controlRef.current = ctrl;
		ctrl.play();
		ctrl.finished.then(() => {
			setStatus("finished");
		});
	}, [iterations, yoyo]);

	const handleCancel = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		if (bellRef.current) bellRef.current.style.transform = "rotate(0deg)";
		if (badgeRef.current) {
			badgeRef.current.style.transform = "scale(1)";
			badgeRef.current.style.boxShadow = "none";
		}
		setStatus("idle");
		setCount(3);
	}, []);

	return (
		<div>
			{/* Notification bell */}
			<div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
				<div style={{ position: "relative", display: "inline-block" }}>
					<div
						ref={bellRef}
						style={{
							willChange: "transform",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9898a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
							<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
						</svg>
					</div>
					<div
						ref={badgeRef}
						style={{
							position: "absolute",
							top: -4,
							right: -8,
							width: 24,
							height: 24,
							borderRadius: "50%",
							background: "#ef4444",
							color: "#fff",
							fontSize: "0.7rem",
							fontWeight: 700,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							willChange: "transform",
						}}
					>
						{count}
					</div>
				</div>
			</div>

			{/* Status */}
			<div style={{ textAlign: "center", marginBottom: 24 }}>
				<span style={{
					fontSize: "0.8rem",
					color: status === "running" ? "#3b82f6" : status === "finished" ? "#22c55e" : "#6b7280",
					fontFamily: "'JetBrains Mono', monospace",
				}}>
					{status === "running" ? "Pulsing..." : status === "finished" ? "Done" : "Ready"}
				</span>
			</div>

			{/* Config controls */}
			<div style={{ display: "flex", gap: 16, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
				<div style={configGroup}>
					<label style={labelStyle}>Count</label>
					<div style={{ display: "flex", gap: 4 }}>
						{[3, 5, 10].map((n) => (
							<button
								key={n}
								type="button"
								onClick={() => setIterations(n)}
								style={{
									...chipStyle,
									background: iterations === n ? "rgba(100, 108, 255, 0.2)" : "transparent",
									borderColor: iterations === n ? "#646cff" : "#1e1e2e",
									color: iterations === n ? "#646cff" : "#6b7280",
								}}
							>
								{n}
							</button>
						))}
					</div>
				</div>
				<div style={configGroup}>
					<label style={labelStyle}>Yoyo</label>
					<button
						type="button"
						onClick={() => setYoyo(!yoyo)}
						style={{
							...chipStyle,
							background: yoyo ? "rgba(100, 108, 255, 0.2)" : "transparent",
							borderColor: yoyo ? "#646cff" : "#1e1e2e",
							color: yoyo ? "#646cff" : "#6b7280",
							minWidth: 48,
						}}
					>
						{yoyo ? "On" : "Off"}
					</button>
				</div>
			</div>

			{/* Controls */}
			<div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
				<button type="button" className="btn btn-play" onClick={handlePlay} disabled={status === "running"}>
					Play
				</button>
				<button type="button" className="btn btn-reset" onClick={handleCancel}>
					Cancel
				</button>
			</div>
		</div>
	);
}

const configGroup: React.CSSProperties = {
	display: "flex",
	flexDirection: "column",
	gap: 6,
	alignItems: "center",
};

const labelStyle: React.CSSProperties = {
	fontSize: "0.7rem",
	color: "#9898a6",
	textTransform: "uppercase",
	letterSpacing: "0.1em",
};

const chipStyle: React.CSSProperties = {
	padding: "4px 10px",
	borderRadius: 4,
	border: "1px solid",
	fontSize: "0.75rem",
	fontWeight: 600,
	cursor: "pointer",
	fontFamily: "'JetBrains Mono', monospace",
	background: "transparent",
};

export const code = `import { animate, repeat, parallel } from "@reactzero/flow";

const badge = document.querySelector(".badge");
const bell = document.querySelector(".bell");

const ctrl = repeat(
  [
    () => parallel(
      // Badge pulses with red glow
      () => animate(badge, [
        { transform: "scale(1)", boxShadow: "0 0 0 rgba(239,68,68,0.4)" },
        { transform: "scale(1.35)", boxShadow: "0 0 12px rgba(239,68,68,0.6)" },
        { transform: "scale(1)", boxShadow: "0 0 0 rgba(239,68,68,0.4)" },
      ], { duration: 600, easing: "ease-in-out" }),
      // Bell shakes side to side
      () => animate(bell, [
        { transform: "rotate(0deg)" },
        { transform: "rotate(15deg)" },
        { transform: "rotate(-15deg)" },
        { transform: "rotate(0deg)" },
      ], { duration: 500 }),
    ),
  ],
  5,
  {
    yoyo: false,
    onRepeat: (i) => console.log(\`Pulse \${i + 1}\`),
  },
);

ctrl.play();`;

export default PulsingNotification;
