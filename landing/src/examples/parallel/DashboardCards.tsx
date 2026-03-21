import { useRef, useCallback } from "react";
import { animate, parallel } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const cards = [
	{
		label: "Revenue",
		value: "$48.2K",
		change: "+12.5%",
		color: "#3b82f6",
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<path
					d="M10 2L2 10h6v8h4v-8h6L10 2z"
					fill="currentColor"
					transform="rotate(180 10 10)"
				/>
			</svg>
		),
		transform: "translateX(-40px)",
	},
	{
		label: "Users",
		value: "2,847",
		change: "+8.1%",
		color: "#10b981",
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<circle cx="10" cy="7" r="4" fill="currentColor" />
				<path
					d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7"
					stroke="currentColor"
					strokeWidth="2"
					fill="none"
				/>
			</svg>
		),
		transform: "translateY(40px)",
	},
	{
		label: "Orders",
		value: "1,394",
		change: "+23.7%",
		color: "#ec4899",
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
				<path d="M7 5V3a3 3 0 016 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
			</svg>
		),
		transform: "translateX(40px)",
	},
	{
		label: "Growth",
		value: "34.2%",
		change: "+4.3%",
		color: "#8b5cf6",
		icon: (
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
				<polyline
					points="3,15 7,9 11,12 17,4"
					stroke="currentColor"
					strokeWidth="2"
					fill="none"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
		transform: "scale(0.5)",
	},
];

export default function DashboardCards() {
	const { easingRef } = useGlobalEasing();
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	const handlePlay = useCallback(() => {
		const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
		if (els.length === 0) return;

		ctrlRef.current?.cancel();

		for (const el of els) {
			el.style.opacity = "0";
		}

		const ctrl = parallel(
			...els.map(
				(el, i) => () =>
					animate(
						el,
						[
							{ opacity: 0, transform: cards[i].transform },
							{ opacity: 1, transform: "translateX(0) translateY(0) scale(1)" },
						],
						{ duration: 600, easing: easingRef.current },
					),
			),
		);

		ctrlRef.current = ctrl;
		ctrl.play();
	}, []);

	const handleReset = useCallback(() => {
		ctrlRef.current?.cancel();
		const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
		for (const el of els) {
			el.style.opacity = "0";
			el.style.transform = "";
		}
	}, []);

	return (
		<div>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					gap: 16,
					marginBottom: 20,
				}}
			>
				{cards.map((card, i) => (
					<div
						key={card.label}
						ref={(el) => {
							cardRefs.current[i] = el;
						}}
						style={{
							opacity: 0,
							background: "#1a1d27",
							border: "1px solid #1e1e2e",
							borderRadius: 12,
							padding: "20px 18px",
							display: "flex",
							flexDirection: "column",
							gap: 12,
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<span
								style={{
									fontSize: "0.8rem",
									color: "#9898a6",
									fontWeight: 500,
								}}
							>
								{card.label}
							</span>
							<span
								style={{
									color: card.color,
									width: 32,
									height: 32,
									borderRadius: 8,
									background: `${card.color}18`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{card.icon}
							</span>
						</div>
						<div
							style={{
								fontSize: "1.5rem",
								fontWeight: 700,
								color: "#fff",
								letterSpacing: "-0.02em",
							}}
						>
							{card.value}
						</div>
						<div
							style={{
								fontSize: "0.75rem",
								color: "#10b981",
								fontWeight: 600,
							}}
						>
							{card.change} this month
						</div>
					</div>
				))}
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

// 4 stat cards animate in simultaneously from different directions
const ctrl = parallel(
  () => animate(revenue, [
    { opacity: 0, transform: "translateX(-40px)" },
    { opacity: 1, transform: "translateX(0)" },
  ], { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),

  () => animate(users, [
    { opacity: 0, transform: "translateY(40px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),

  () => animate(orders, [
    { opacity: 0, transform: "translateX(40px)" },
    { opacity: 1, transform: "translateX(0)" },
  ], { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),

  () => animate(growth, [
    { opacity: 0, transform: "scale(0.5)" },
    { opacity: 1, transform: "scale(1)" },
  ], { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" }),
);

ctrl.play();`;
