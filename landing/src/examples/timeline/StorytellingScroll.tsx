import { useRef, useCallback, useState, useEffect } from "react";
import { animate, timeline } from "@flow";
import type { TimelineControllable } from "@flow";
import { useGlobalEasing } from "../../context/EasingContext";

const ACTS = [
	{ label: "dawn", title: "Dawn", color: "#f59e0b" },
	{ label: "journey", title: "Journey", color: "#3b82f6" },
	{ label: "arrival", title: "Arrival", color: "#10b981" },
] as const;

const styles = {
	container: {
		background: "#1a1b23",
		borderRadius: 12,
		padding: 24,
		fontFamily: "system-ui, sans-serif",
		color: "#e0e0e6",
		maxWidth: 480,
	} as const,
	stage: {
		position: "relative" as const,
		height: 260,
		background: "#0f1117",
		borderRadius: 8,
		marginBottom: 16,
		overflow: "hidden",
	},
	sky: {
		position: "absolute" as const,
		inset: 0,
		background: "#0f1117",
		transition: "none",
	},
	sun: {
		position: "absolute" as const,
		width: 50,
		height: 50,
		borderRadius: "50%",
		background: "#f59e0b",
		left: "50%",
		marginLeft: -25,
		bottom: -50,
		boxShadow: "0 0 30px rgba(245, 158, 11, 0.5)",
		opacity: 0,
	},
	path: {
		position: "absolute" as const,
		bottom: 60,
		left: 40,
		width: 0,
		height: 3,
		background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
		borderRadius: 2,
	},
	destination: {
		position: "absolute" as const,
		right: 40,
		bottom: 40,
		width: 60,
		height: 80,
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		justifyContent: "flex-end",
		opacity: 0,
		transform: "scale(0.5)",
	},
	building: {
		width: 40,
		height: 60,
		background: "linear-gradient(180deg, #10b981, #059669)",
		borderRadius: "4px 4px 0 0",
		position: "relative" as const,
	},
	buildingWindow: {
		position: "absolute" as const,
		width: 8,
		height: 8,
		background: "#fef3c7",
		borderRadius: 1,
	},
	flag: {
		width: 20,
		height: 14,
		background: "#10b981",
		position: "absolute" as const,
		top: -18,
		right: -5,
		borderRadius: "0 2px 2px 0",
	},
	actTitle: {
		position: "absolute" as const,
		top: 16,
		left: 20,
		fontSize: 22,
		fontWeight: 700,
		opacity: 0,
	},
	progressBar: {
		height: 4,
		background: "#1f2937",
		borderRadius: 2,
		overflow: "hidden",
		marginBottom: 12,
	},
	progressFill: {
		height: "100%",
		borderRadius: 2,
		background: "linear-gradient(90deg, #f59e0b, #3b82f6, #10b981)",
		transition: "width 60ms linear",
	},
	controls: {
		display: "flex",
		flexDirection: "column" as const,
		gap: 10,
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 8,
	},
	btn: {
		padding: "6px 14px",
		borderRadius: 6,
		border: "1px solid #374151",
		background: "#1f2937",
		color: "#e0e0e6",
		fontSize: 12,
		cursor: "pointer",
	} as const,
	labelBtn: {
		padding: "6px 16px",
		borderRadius: 6,
		border: "1px solid #374151",
		background: "transparent",
		color: "#9ca3af",
		fontSize: 12,
		cursor: "pointer",
		flex: 1,
		textAlign: "center" as const,
	} as const,
	labelBtnActive: {
		padding: "6px 16px",
		borderRadius: 6,
		border: "1px solid #f59e0b",
		background: "#1f2937",
		color: "#fbbf24",
		fontSize: 12,
		cursor: "pointer",
		flex: 1,
		textAlign: "center" as const,
	} as const,
	sectionLabel: {
		fontSize: 11,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: 1,
		marginRight: 4,
	},
};

export default function StorytellingScroll() {
	const { easingRef } = useGlobalEasing();
	const skyRef = useRef<HTMLDivElement>(null);
	const sunRef = useRef<HTMLDivElement>(null);
	const pathRef = useRef<HTMLDivElement>(null);
	const destRef = useRef<HTMLDivElement>(null);
	const titleRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
	const tlRef = useRef<TimelineControllable | null>(null);

	const [progress, setProgress] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [activeAct, setActiveAct] = useState<string | null>(null);
	const rafRef = useRef<number | null>(null);

	const buildTimeline = useCallback(() => {
		const sky = skyRef.current;
		const sun = sunRef.current;
		const path = pathRef.current;
		const dest = destRef.current;
		const [t0, t1, t2] = titleRefs.current;
		if (!sky || !sun || !path || !dest || !t0 || !t1 || !t2) return;

		// Reset
		sun.style.bottom = "-50px";
		sun.style.opacity = "0";
		sky.style.background = "#0f1117";
		path.style.width = "0";
		dest.style.opacity = "0";
		dest.style.transform = "scale(0.5)";
		for (const t of [t0, t1, t2]) {
			t.style.opacity = "0";
		}

		const tl = timeline()
			// Act 1: Dawn
			.label("dawn", 0)
			.add(
				() => animate(t0, [
					{ opacity: 0 }, { opacity: 1, offset: 0.2 },
					{ opacity: 1, offset: 0.8 }, { opacity: 0 },
				], { duration: 1200 }),
				{ duration: 1200 },
			)
			.add(
				() => animate(sun, [
					{ bottom: "-50px", opacity: 0 },
					{ bottom: "120px", opacity: 1 },
				], { duration: 1200, easing: "ease-out" }),
				{ at: 0, duration: 1200 },
			)
			.add(
				() => animate(sky, [
					{ background: "#0f1117" },
					{ background: "#1e1b4b" },
					{ background: "#312e81" },
				], { duration: 1200 }),
				{ at: 0, duration: 1200 },
			)

			// Act 2: Journey
			.label("journey")
			.add(
				() => animate(t1, [
					{ opacity: 0 }, { opacity: 1, offset: 0.2 },
					{ opacity: 1, offset: 0.8 }, { opacity: 0 },
				], { duration: 1200 }),
				{ duration: 1200 },
			)
			.add(
				() => animate(path, [
					{ width: "0px" },
					{ width: "320px" },
				], { duration: 1200, easing: "ease-in-out" }),
				{ after: "journey", duration: 1200 },
			)
			.add(
				() => animate(sky, [
					{ background: "#312e81" },
					{ background: "#1e3a5f" },
				], { duration: 1200 }),
				{ after: "journey", duration: 1200 },
			)

			// Act 3: Arrival
			.label("arrival")
			.add(
				() => animate(t2, [
					{ opacity: 0 }, { opacity: 1, offset: 0.2 },
					{ opacity: 1, offset: 0.8 }, { opacity: 0 },
				], { duration: 1200 }),
				{ duration: 1200 },
			)
			.add(
				() => animate(dest, [
					{ opacity: 0, transform: "scale(0.5) translateY(20px)" },
					{ opacity: 1, transform: "scale(1) translateY(0)" },
				], { duration: 800, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),
				{ after: "arrival", duration: 800 },
			)
			.add(
				() => animate(sky, [
					{ background: "#1e3a5f" },
					{ background: "#064e3b" },
				], { duration: 1200 }),
				{ after: "arrival", duration: 1200 },
			)
			.build();

		tlRef.current = tl;
		setProgress(0);
	}, []);

	useEffect(() => {
		buildTimeline();
		return () => {
			tlRef.current?.cancel();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [buildTimeline]);

	useEffect(() => {
		if (!isPlaying) return;
		const poll = () => {
			if (tlRef.current) {
				const d = tlRef.current.duration;
				const t = tlRef.current.currentTime;
				setProgress(d > 0 ? t / d : 0);
				if (tlRef.current.playState === "finished") {
					setIsPlaying(false);
					setProgress(1);
					return;
				}
			}
			rafRef.current = requestAnimationFrame(poll);
		};
		rafRef.current = requestAnimationFrame(poll);
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [isPlaying]);

	const handlePlay = useCallback(() => {
		tlRef.current?.play();
		setIsPlaying(true);
		setActiveAct(null);
	}, []);

	const handlePause = useCallback(() => {
		tlRef.current?.pause();
		setIsPlaying(false);
	}, []);

	const handleReset = useCallback(() => {
		tlRef.current?.cancel();
		buildTimeline();
		setIsPlaying(false);
		setActiveAct(null);
	}, [buildTimeline]);

	const handleSeekTo = useCallback((label: string) => {
		if (!tlRef.current) return;
		tlRef.current.pause();
		tlRef.current.seekTo(label);
		const d = tlRef.current.duration;
		setProgress(d > 0 ? tlRef.current.currentTime / d : 0);
		setIsPlaying(false);
		setActiveAct(label);
	}, []);

	return (
		<div style={styles.container}>
			<div style={styles.stage}>
				<div ref={skyRef} style={styles.sky} />
				<div ref={sunRef} style={styles.sun} />
				<div ref={pathRef} style={styles.path} />
				<div ref={destRef} style={styles.destination}>
					<div style={styles.building}>
						<div style={{ ...styles.buildingWindow, top: 8, left: 6 }} />
						<div style={{ ...styles.buildingWindow, top: 8, right: 6 }} />
						<div style={{ ...styles.buildingWindow, top: 22, left: 6 }} />
						<div style={{ ...styles.buildingWindow, top: 22, right: 6 }} />
						<div style={{ ...styles.buildingWindow, top: 36, left: 6 }} />
						<div style={{ ...styles.buildingWindow, top: 36, right: 6 }} />
						<div style={styles.flag} />
					</div>
				</div>

				{ACTS.map((act, i) => (
					<div
						key={act.label}
						ref={(el) => { titleRefs.current[i] = el; }}
						style={{ ...styles.actTitle, color: act.color }}
					>
						Act {i + 1}: {act.title}
					</div>
				))}
			</div>

			<div style={styles.progressBar}>
				<div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
			</div>

			<div style={styles.controls}>
				<div style={styles.row}>
					<button type="button" style={styles.btn} onClick={handlePlay}>Play</button>
					<button type="button" style={styles.btn} onClick={handlePause}>Pause</button>
					<button type="button" style={styles.btn} onClick={handleReset}>Reset</button>
				</div>

				<div style={styles.row}>
					<span style={styles.sectionLabel}>Acts</span>
					{ACTS.map((act) => (
						<button
							key={act.label}
							type="button"
							style={activeAct === act.label ? styles.labelBtnActive : styles.labelBtn}
							onClick={() => handleSeekTo(act.label)}
						>
							{act.title}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export const code = `import { animate, timeline } from "@reactzero/animotion";

const tl = timeline()
  .label("dawn", 0)
  .add(
    () => animate(sun, [
      { bottom: "-50px", opacity: 0 },
      { bottom: "120px", opacity: 1 },
    ], { duration: 1200, easing: "ease-out" }),
    { duration: 1200 }
  )
  .label("journey")
  .add(
    () => animate(path, [
      { width: "0px" }, { width: "320px" },
    ], { duration: 1200, easing: "ease-in-out" }),
    { after: "journey", duration: 1200 }
  )
  .label("arrival")
  .add(
    () => animate(dest, [
      { opacity: 0, transform: "scale(0.5)" },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: 800 }),
    { after: "arrival", duration: 800 }
  )
  .build();

// Named label navigation
tl.seekTo("dawn");      // jump to act 1
tl.seekTo("journey");   // jump to act 2
tl.seekTo("arrival");   // jump to act 3
tl.play();               // play from current position`;
