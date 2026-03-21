import { useRef, useCallback } from "react";
import { animate, stagger } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const ROWS = 4;
const COLS = 6;
const TOTAL = ROWS * COLS;

function tileColor(row: number, col: number): string {
	// Gradient-like color variation across the grid
	const hueStart = 220; // blue
	const hueEnd = 320; // pink
	const t = (row * COLS + col) / (TOTAL - 1);
	const hue = hueStart + (hueEnd - hueStart) * t;
	return `hsl(${hue}, 70%, 55%)`;
}

export default function GridReveal() {
	const { easingRef } = useGlobalEasing();
	const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	const handlePlay = useCallback(() => {
		const els = tileRefs.current.filter(Boolean) as HTMLDivElement[];
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
							{ opacity: 0, transform: "scale(0)" },
							{ opacity: 1, transform: "scale(1)" },
						],
						{
							duration: 350,
							easing: easingRef.current,
						},
					),
			),
			{ each: 40 },
		);

		ctrlRef.current = ctrl;
		ctrl.play();
	}, []);

	const handleReset = useCallback(() => {
		ctrlRef.current?.cancel();
		const els = tileRefs.current.filter(Boolean) as HTMLDivElement[];
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
					gap: 8,
					marginBottom: 20,
					maxWidth: 360,
				}}
			>
				{Array.from({ length: TOTAL }, (_, i) => {
					const row = Math.floor(i / COLS);
					const col = i % COLS;
					const color = tileColor(row, col);

					return (
						<div
							key={i}
							ref={(el) => {
								tileRefs.current[i] = el;
							}}
							style={{
								opacity: 0,
								aspectRatio: "1",
								borderRadius: 6,
								background: color,
								boxShadow: `0 2px 12px ${color}44`,
							}}
						/>
					);
				})}
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

// 6x4 grid of colored tiles ripple in from top-left
const ctrl = stagger(
  tiles.map(tile => () =>
    animate(tile, [
      { opacity: 0, transform: "scale(0)" },
      { opacity: 1, transform: "scale(1)" },
    ], {
      duration: 350,
      easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    })
  ),
  { each: 40 }
);

ctrl.play();`;
