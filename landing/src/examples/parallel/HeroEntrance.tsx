import { useRef, useCallback } from "react";
import { animate, parallel } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

export default function HeroEntrance() {
	const { easingRef } = useGlobalEasing();
	const circleRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLDivElement>(null);
	const subtitleRef = useRef<HTMLDivElement>(null);
	const ctaRef = useRef<HTMLButtonElement>(null);
	const ctrlRef = useRef<Controllable | null>(null);

	const handlePlay = useCallback(() => {
		const circle = circleRef.current;
		const title = titleRef.current;
		const subtitle = subtitleRef.current;
		const cta = ctaRef.current;
		if (!circle || !title || !subtitle || !cta) return;

		ctrlRef.current?.cancel();

		circle.style.opacity = "0";
		title.style.opacity = "0";
		subtitle.style.opacity = "0";
		cta.style.opacity = "0";

		const ctrl = parallel(
			// Background circle expands from center
			() =>
				animate(
					circle,
					[
						{ opacity: 0, transform: "scale(0)" },
						{ opacity: 0.15, transform: "scale(1)" },
					],
					{ duration: 800, easing: easingRef.current },
				),
			// Title slides down with fade
			() =>
				animate(
					title,
					[
						{ opacity: 0, transform: "translateY(-30px)" },
						{ opacity: 1, transform: "translateY(0)" },
					],
					{ duration: 700, easing: easingRef.current },
				),
			// Subtitle slides up with fade
			() =>
				animate(
					subtitle,
					[
						{ opacity: 0, transform: "translateY(20px)" },
						{ opacity: 1, transform: "translateY(0)" },
					],
					{ duration: 600, easing: easingRef.current },
				),
			// CTA button scales with bounce
			() =>
				animate(
					cta,
					[
						{ opacity: 0, transform: "scale(0)" },
						{ opacity: 1, transform: "scale(1)" },
					],
					{ duration: 500, easing: easingRef.current },
				),
		);

		ctrlRef.current = ctrl;
		ctrl.play();
	}, []);

	const handleReset = useCallback(() => {
		ctrlRef.current?.cancel();
		const els = [circleRef, titleRef, subtitleRef, ctaRef];
		for (const ref of els) {
			if (ref.current) {
				ref.current.style.opacity = "0";
				ref.current.style.transform = "";
			}
		}
	}, []);

	return (
		<div>
			<div
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: 240,
					overflow: "hidden",
					borderRadius: 12,
					background: "#12121a",
					padding: "40px 24px",
					marginBottom: 20,
				}}
			>
				{/* Background circle */}
				<div
					ref={circleRef}
					style={{
						position: "absolute",
						width: 320,
						height: 320,
						borderRadius: "50%",
						background: "radial-gradient(circle, #646cff 0%, transparent 70%)",
						opacity: 0,
						pointerEvents: "none",
					}}
				/>

				{/* Title */}
				<div
					ref={titleRef}
					style={{
						position: "relative",
						fontSize: "1.6rem",
						fontWeight: 700,
						color: "#fff",
						textAlign: "center",
						opacity: 0,
						marginBottom: 8,
					}}
				>
					Build something amazing
				</div>

				{/* Subtitle */}
				<div
					ref={subtitleRef}
					style={{
						position: "relative",
						fontSize: "0.9rem",
						color: "#9898a6",
						textAlign: "center",
						opacity: 0,
						marginBottom: 24,
						maxWidth: 300,
					}}
				>
					All elements animate at once with different durations and easings
				</div>

				{/* CTA Button */}
				<button
					ref={ctaRef}
					type="button"
					style={{
						position: "relative",
						background: "#646cff",
						color: "#fff",
						border: "none",
						borderRadius: 8,
						padding: "10px 28px",
						fontSize: "0.85rem",
						fontWeight: 600,
						cursor: "default",
						opacity: 0,
						fontFamily: "inherit",
					}}
				>
					Get Started
				</button>
			</div>
			<div style={{ display: "flex", gap: 8 }}>
				<button type="button" className="btn btn-play" onClick={handlePlay}>
					Play
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

export const code = `import { animate, parallel } from "@reactzero/animotion";

// All elements start simultaneously with different durations
const ctrl = parallel(
  // Background circle expands from center
  () => animate(circle, [
    { opacity: 0, transform: "scale(0)" },
    { opacity: 0.15, transform: "scale(1)" },
  ], { duration: 800, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),

  // Title slides down
  () => animate(title, [
    { opacity: 0, transform: "translateY(-30px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 700, easing: "ease-out" }),

  // Subtitle slides up
  () => animate(subtitle, [
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 600, easing: "ease-out" }),

  // CTA scales with bounce easing
  () => animate(cta, [
    { opacity: 0, transform: "scale(0)" },
    { opacity: 1, transform: "scale(1)" },
  ], { duration: 500, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),
);

ctrl.play();`;
