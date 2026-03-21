import { useRef, useState, useCallback } from "react";
import { animate, race } from "@flow/index";
import type { RaceControllable } from "@flow/types";
import { useGlobalEasing } from "../../context/EasingContext";

interface Racer {
	name: string;
	color: string;
	colorLight: string;
	duration: number;
}

function randomDuration() {
	return Math.floor(1000 + Math.random() * 2000);
}

function createRacers(): Racer[] {
	return [
		{ name: "Alpha", color: "#3b82f6", colorLight: "#60a5fa", duration: randomDuration() },
		{ name: "Beta", color: "#ec4899", colorLight: "#f472b6", duration: randomDuration() },
		{ name: "Gamma", color: "#10b981", colorLight: "#34d399", duration: randomDuration() },
	];
}

function CompetingAnimations() {
	const { easingRef } = useGlobalEasing();
	const barRefs = useRef<(HTMLDivElement | null)[]>([]);
	const controlRef = useRef<RaceControllable | null>(null);

	const [racers, setRacers] = useState<Racer[]>(createRacers);
	const [status, setStatus] = useState<"idle" | "running" | "finished">("idle");
	const [winner, setWinner] = useState<number | undefined>(undefined);

	const handleRace = useCallback(() => {
		const newRacers = createRacers();
		setRacers(newRacers);
		setStatus("running");
		setWinner(undefined);

		// Reset bar widths
		for (const bar of barRefs.current) {
			if (bar) bar.style.width = "0%";
		}

		// Small delay to let React render the reset
		requestAnimationFrame(() => {
			const steps = newRacers.map((racer, i) => {
				return () => {
					const el = barRefs.current[i]!;
					return animate(el, [{ width: "0%" }, { width: "100%" }], {
						duration: racer.duration,
						easing: easingRef.current,
					});
				};
			});

			const ctrl = race(...steps);
			controlRef.current = ctrl;
			ctrl.play();

			ctrl.finished.then(() => {
				const w = ctrl.winner;
				setWinner(w);
				setStatus("finished");
			});
		});
	}, []);

	const handleReset = useCallback(() => {
		controlRef.current?.cancel();
		controlRef.current = null;
		for (const bar of barRefs.current) {
			if (bar) bar.style.width = "0%";
		}
		setStatus("idle");
		setWinner(undefined);
	}, []);

	return (
		<div>
			{/* Racer bars */}
			<div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
				{racers.map((racer, i) => (
					<div key={racer.name}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<div style={{
									width: 8,
									height: 8,
									borderRadius: "50%",
									background: racer.color,
									opacity: status === "finished" && winner !== i ? 0.3 : 1,
								}} />
								<span style={{
									fontSize: "0.85rem",
									fontWeight: 600,
									color: status === "finished" && winner !== i ? "#6b7280" : "#e0e0e6",
								}}>
									{racer.name}
								</span>
								<span style={{
									fontSize: "0.7rem",
									color: "#6b7280",
									fontFamily: "'JetBrains Mono', monospace",
								}}>
									{racer.duration}ms
								</span>
							</div>
							{status === "finished" && winner === i && (
								<span style={{
									fontSize: "0.65rem",
									fontWeight: 700,
									color: "#f59e0b",
									background: "rgba(245, 158, 11, 0.12)",
									border: "1px solid rgba(245, 158, 11, 0.3)",
									padding: "2px 8px",
									borderRadius: 4,
									textTransform: "uppercase",
									letterSpacing: "0.08em",
								}}>
									Winner!
								</span>
							)}
						</div>
						<div style={{
							height: 10,
							background: "#1a1d27",
							borderRadius: 6,
							overflow: "hidden",
							border: status === "finished" && winner === i
								? `1px solid ${racer.color}`
								: "1px solid transparent",
							boxShadow: status === "finished" && winner === i
								? `0 0 12px ${racer.color}40, inset 0 0 8px ${racer.color}15`
								: "none",
						}}>
							<div
								ref={(el) => { barRefs.current[i] = el; }}
								style={{
									height: "100%",
									borderRadius: 6,
									background: `linear-gradient(90deg, ${racer.color}, ${racer.colorLight})`,
									width: "0%",
									opacity: status === "finished" && winner !== i ? 0.3 : 1,
								}}
							/>
						</div>
					</div>
				))}
			</div>

			{/* Controls */}
			<div style={{ display: "flex", gap: 8 }}>
				<button type="button" className="btn btn-play" onClick={handleRace} disabled={status === "running"}>
					{status === "idle" ? "Start Race" : "Race Again"}
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

export const code = `import { animate, race } from "@reactzero/flow";

const bars = document.querySelectorAll(".race-bar");
const durations = [1200, 2100, 1700]; // random speeds

const ctrl = race(
  animate(bars[0], [{ width: "0%" }, { width: "100%" }], {
    duration: durations[0],
  }),
  animate(bars[1], [{ width: "0%" }, { width: "100%" }], {
    duration: durations[1],
  }),
  animate(bars[2], [{ width: "0%" }, { width: "100%" }], {
    duration: durations[2],
  }),
);

ctrl.play();
ctrl.finished.then(() => {
  console.log(\`Winner: bar \${ctrl.winner}\`);
  // Losers are automatically cancelled
});`;

export default CompetingAnimations;
