import { useRef, useCallback } from "react";
import { animate, stagger } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const ROWS = 3;
const COLS = 4;
const TOTAL = ROWS * COLS;

const photoColors = [
	"#3b82f6", "#6366f1", "#8b5cf6", "#a855f7",
	"#ec4899", "#f43f5e", "#f59e0b", "#f97316",
	"#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
];

export default function PhotoGallery() {
	const { easingRef } = useGlobalEasing();
	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	const handlePlay = useCallback(() => {
		const els = cardRefs.current.filter(Boolean) as HTMLDivElement[];
		if (els.length === 0) return;

		ctrlRef.current?.cancel();

		for (const el of els) {
			el.style.opacity = "0";
			el.style.transform = "";
		}

		const ctrl = stagger(
			els.map(
				(el) => () =>
					animate(
						el,
						[
							{
								opacity: 0,
								transform: "scale(0) rotate(-15deg)",
							},
							{
								opacity: 1,
								transform: "scale(1) rotate(0deg)",
							},
						],
						{
							duration: 400,
							easing: easingRef.current,
						},
					),
			),
			{ each: 80 },
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
					gridTemplateColumns: `repeat(${COLS}, 1fr)`,
					gap: 12,
					marginBottom: 20,
					maxWidth: 420,
				}}
			>
				{Array.from({ length: TOTAL }, (_, i) => (
					<div
						key={i}
						ref={(el) => {
							cardRefs.current[i] = el;
						}}
						style={{
							opacity: 0,
							aspectRatio: "1",
							borderRadius: 10,
							background: `linear-gradient(135deg, ${photoColors[i]}, ${photoColors[i]}cc)`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "0.75rem",
							fontWeight: 600,
							color: "rgba(255,255,255,0.7)",
							boxShadow: `0 4px 16px ${photoColors[i]}33`,
						}}
					>
						{i + 1}
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

export const code = `import { animate, stagger } from "@reactzero/animotion";

// 4x3 grid of cards cascade in with stagger
const ctrl = stagger(
  cards.map(card => () =>
    animate(card, [
      { opacity: 0, transform: "scale(0) rotate(-15deg)" },
      { opacity: 1, transform: "scale(1) rotate(0deg)" },
    ], {
      duration: 400,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    })
  ),
  { each: 80 }
);

ctrl.play();`;
