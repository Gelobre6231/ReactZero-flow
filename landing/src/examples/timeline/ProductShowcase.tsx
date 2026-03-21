import { useRef, useCallback, useState, useEffect } from "react";
import { animate, timeline } from "@flow";
import type { TimelineControllable } from "@flow";
import { useGlobalEasing } from "../../context/EasingContext";

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
		height: 280,
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
		overflow: "hidden",
		background: "#0f1117",
		borderRadius: 8,
		marginBottom: 16,
	},
	productImage: {
		width: 120,
		height: 120,
		borderRadius: 16,
		background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: 48,
		transform: "scale(0.5)",
		opacity: 0,
	} as const,
	title: {
		fontSize: 20,
		fontWeight: 700,
		color: "#e0e0e6",
		transform: "translateX(-40px)",
		opacity: 0,
	} as const,
	price: {
		fontSize: 24,
		fontWeight: 800,
		color: "#10b981",
		transform: "scale(0)",
		opacity: 0,
	} as const,
	cta: {
		padding: "10px 28px",
		borderRadius: 8,
		border: "none",
		background: "#3b82f6",
		color: "#fff",
		fontSize: 14,
		fontWeight: 600,
		cursor: "pointer",
		opacity: 0,
	} as const,
	controls: {
		display: "flex",
		flexDirection: "column" as const,
		gap: 12,
	},
	row: {
		display: "flex",
		alignItems: "center",
		gap: 8,
	},
	slider: {
		flex: 1,
		accentColor: "#3b82f6",
	} as const,
	timeDisplay: {
		fontSize: 12,
		fontFamily: "monospace",
		color: "#9ca3af",
		minWidth: 90,
		textAlign: "right" as const,
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
	btnActive: {
		padding: "6px 14px",
		borderRadius: 6,
		border: "1px solid #3b82f6",
		background: "#1e3a5f",
		color: "#93c5fd",
		fontSize: 12,
		cursor: "pointer",
	} as const,
	labelBtn: {
		padding: "4px 10px",
		borderRadius: 4,
		border: "1px solid #374151",
		background: "transparent",
		color: "#9ca3af",
		fontSize: 11,
		cursor: "pointer",
	} as const,
	sectionLabel: {
		fontSize: 11,
		color: "#6b7280",
		textTransform: "uppercase" as const,
		letterSpacing: 1,
	},
};

export default function ProductShowcase() {
	const { easingRef } = useGlobalEasing();
	const imageRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLDivElement>(null);
	const priceRef = useRef<HTMLDivElement>(null);
	const ctaRef = useRef<HTMLButtonElement>(null);
	const tlRef = useRef<TimelineControllable | null>(null);

	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [rate, setRate] = useState(1);
	const [isPlaying, setIsPlaying] = useState(false);
	const rafRef = useRef<number | null>(null);

	const buildTimeline = useCallback(() => {
		if (!imageRef.current || !titleRef.current || !priceRef.current || !ctaRef.current) return;

		// Reset elements to initial state
		imageRef.current.style.transform = "scale(0.5)";
		imageRef.current.style.opacity = "0";
		titleRef.current.style.transform = "translateX(-40px)";
		titleRef.current.style.opacity = "0";
		priceRef.current.style.transform = "scale(0)";
		priceRef.current.style.opacity = "0";
		ctaRef.current.style.opacity = "0";

		const img = imageRef.current;
		const ttl = titleRef.current;
		const prc = priceRef.current;
		const cta = ctaRef.current;

		const tl = timeline()
			.label("image", 0)
			.add(
				() => animate(img, [
					{ transform: "scale(0.5)", opacity: 0 },
					{ transform: "scale(1)", opacity: 1 },
				], { duration: 500, easing: easingRef.current }),
				{ duration: 500 },
			)
			.label("details")
			.add(
				() => animate(ttl, [
					{ transform: "translateX(-40px)", opacity: 0 },
					{ transform: "translateX(0)", opacity: 1 },
				], { duration: 400, easing: easingRef.current }),
				{ duration: 400 },
			)
			.add(
				() => animate(prc, [
					{ transform: "scale(0)", opacity: 0 },
					{ transform: "scale(1.2)", opacity: 1 },
					{ transform: "scale(1)", opacity: 1 },
				], { duration: 500, easing: easingRef.current }),
				{ duration: 500 },
			)
			.label("cta")
			.add(
				() => animate(cta, [
					{ opacity: 0, transform: "translateY(10px)" },
					{ opacity: 1, transform: "translateY(0)" },
				], { duration: 300, easing: easingRef.current }),
				{ duration: 300 },
			)
			.build();

		tlRef.current = tl;
		setDuration(tl.duration);
		setCurrentTime(0);
	}, []);

	useEffect(() => {
		buildTimeline();
		return () => {
			tlRef.current?.cancel();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, [buildTimeline]);

	// Poll currentTime while playing
	useEffect(() => {
		if (!isPlaying) return;
		const poll = () => {
			if (tlRef.current) {
				const t = tlRef.current.currentTime;
				setCurrentTime(t);
				if (tlRef.current.playState === "finished") {
					setIsPlaying(false);
					setCurrentTime(tlRef.current.duration);
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
		if (!tlRef.current) return;
		tlRef.current.play();
		setIsPlaying(true);
	}, []);

	const handlePause = useCallback(() => {
		if (!tlRef.current) return;
		tlRef.current.pause();
		setIsPlaying(false);
	}, []);

	const handleReset = useCallback(() => {
		tlRef.current?.cancel();
		buildTimeline();
		setIsPlaying(false);
	}, [buildTimeline]);

	const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		if (!tlRef.current) return;
		const ms = Number(e.target.value);
		tlRef.current.pause();
		tlRef.current.seek(ms);
		setCurrentTime(ms);
		setIsPlaying(false);
	}, []);

	const handleRate = useCallback((newRate: number) => {
		if (!tlRef.current) return;
		tlRef.current.playbackRate = newRate;
		setRate(newRate);
	}, []);

	const handleSeekTo = useCallback((label: string) => {
		if (!tlRef.current) return;
		tlRef.current.pause();
		tlRef.current.seekTo(label);
		setCurrentTime(tlRef.current.currentTime);
		setIsPlaying(false);
	}, []);

	const formatMs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

	return (
		<div style={styles.container}>
			<div style={styles.stage}>
				<div ref={imageRef} style={styles.productImage}>
					<span role="img" aria-label="package">P</span>
				</div>
				<div ref={titleRef} style={styles.title}>Premium Widget</div>
				<div ref={priceRef} style={styles.price}>$49.99</div>
				<button ref={ctaRef} type="button" style={styles.cta}>Add to Cart</button>
			</div>

			<div style={styles.controls}>
				<div style={styles.row}>
					<input
						type="range"
						min={0}
						max={duration}
						value={currentTime}
						onChange={handleScrub}
						style={styles.slider}
					/>
					<span style={styles.timeDisplay}>
						{formatMs(currentTime)} / {formatMs(duration)}
					</span>
				</div>

				<div style={styles.row}>
					<button type="button" style={styles.btn} onClick={handlePlay}>Play</button>
					<button type="button" style={styles.btn} onClick={handlePause}>Pause</button>
					<button type="button" style={styles.btn} onClick={handleReset}>Reset</button>
					<div style={{ flex: 1 }} />
					{[0.5, 1, 2].map((r) => (
						<button
							key={r}
							type="button"
							style={r === rate ? styles.btnActive : styles.btn}
							onClick={() => handleRate(r)}
						>
							{r}x
						</button>
					))}
				</div>

				<div style={styles.row}>
					<span style={styles.sectionLabel}>Labels</span>
					{["image", "details", "cta"].map((label) => (
						<button
							key={label}
							type="button"
							style={styles.labelBtn}
							onClick={() => handleSeekTo(label)}
						>
							{label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export const code = `import { animate, timeline } from "@reactzero/animotion";

const tl = timeline()
  .label("image", 0)
  .add(
    () => animate(img, [
      { transform: "scale(0.5)", opacity: 0 },
      { transform: "scale(1)", opacity: 1 },
    ], { duration: 500, easing: "cubic-bezier(0.34,1.56,0.64,1)" }),
    { duration: 500 }
  )
  .label("details")
  .add(
    () => animate(title, [
      { transform: "translateX(-40px)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 },
    ], { duration: 400, easing: "ease-out" }),
    { duration: 400 }
  )
  .add(
    () => animate(price, [
      { transform: "scale(0)", opacity: 0 },
      { transform: "scale(1.2)", opacity: 1 },
      { transform: "scale(1)", opacity: 1 },
    ], { duration: 500, easing: "ease-out" }),
    { duration: 500 }
  )
  .label("cta")
  .add(
    () => animate(cta, [
      { opacity: 0 }, { opacity: 1 },
    ], { duration: 300, easing: "ease-out" }),
    { duration: 300 }
  )
  .build();

// Playback controls
tl.play();
tl.seek(800);           // scrub to 800ms
tl.seekTo("details");   // jump to label
tl.playbackRate = 2;    // double speed`;
