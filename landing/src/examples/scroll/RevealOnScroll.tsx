import { useRef } from "react";
import { useScroll } from "@flow";

const CARDS = [
	{
		title: "Design System",
		description: "Consistent, reusable components built on a solid foundation of design tokens.",
		color: "#3b82f6",
		icon: "DS",
		threshold: 0.08,
	},
	{
		title: "Performance",
		description: "Hardware-accelerated animations running on the compositor thread via WAAPI.",
		color: "#10b981",
		icon: "FP",
		threshold: 0.22,
	},
	{
		title: "Accessibility",
		description: "Reduced motion support baked in. Respects prefers-reduced-motion by default.",
		color: "#8b5cf6",
		icon: "A11y",
		threshold: 0.38,
	},
	{
		title: "Composition",
		description: "Sequence, parallel, stagger, and timeline -- infinite nesting, zero complexity.",
		color: "#ec4899",
		icon: "Fn",
		threshold: 0.54,
	},
	{
		title: "Developer Experience",
		description: "TypeScript-first API with full IntelliSense. Hooks that feel natural in React.",
		color: "#f59e0b",
		icon: "DX",
		threshold: 0.70,
	},
];

const styles = {
	container: {
		background: "#1a1b23",
		borderRadius: 12,
		padding: 24,
		fontFamily: "system-ui, sans-serif",
		color: "#e0e0e6",
		maxWidth: 480,
	} as const,
	scrollArea: {
		position: "relative" as const,
		height: 340,
		overflow: "auto",
		borderRadius: 8,
		background: "#0f1117",
	},
	scrollContent: {
		padding: "60px 20px",
		display: "flex",
		flexDirection: "column" as const,
		gap: 24,
	},
	card: {
		background: "#1a1b23",
		borderRadius: 10,
		padding: 20,
		border: "1px solid #1f2937",
		display: "flex",
		gap: 16,
		alignItems: "flex-start",
		willChange: "transform, opacity",
	},
	cardIcon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: 14,
		fontWeight: 800,
		color: "#fff",
		flexShrink: 0,
	},
	cardContent: {
		flex: 1,
		minWidth: 0,
	},
	cardTitle: {
		fontSize: 15,
		fontWeight: 700,
		color: "#e0e0e6",
		marginBottom: 4,
	},
	cardDesc: {
		fontSize: 13,
		lineHeight: 1.5,
		color: "#6b7280",
	},
	indicator: {
		position: "sticky" as const,
		top: 0,
		left: 0,
		right: 0,
		padding: "8px 16px",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		background: "rgba(15, 17, 23, 0.9)",
		backdropFilter: "blur(8px)",
		zIndex: 10,
		borderBottom: "1px solid #1f2937",
	},
	indicatorDots: {
		display: "flex",
		gap: 6,
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: "50%",
		background: "#1f2937",
		transition: "background 200ms, transform 200ms",
	},
	dotActive: {
		width: 8,
		height: 8,
		borderRadius: "50%",
		transition: "background 200ms, transform 200ms",
		transform: "scale(1.3)",
	},
	progressText: {
		fontSize: 11,
		fontFamily: "monospace",
		color: "#4b5563",
	},
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export default function RevealOnScroll() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const { progress } = useScroll({ source: scrollRef });

	// Calculate visibility for each card based on scroll progress
	const cardStates = CARDS.map((card) => {
		// Each card transitions over a 15% scroll range starting at its threshold
		const transitionRange = 0.15;
		const visibility = clamp(
			(progress - card.threshold) / transitionRange,
			0,
			1,
		);
		return {
			opacity: visibility,
			translateY: (1 - visibility) * 30,
			visible: visibility > 0,
		};
	});

	const visibleCount = cardStates.filter((s) => s.opacity > 0.5).length;

	return (
		<div style={styles.container}>
			<div ref={scrollRef} style={styles.scrollArea}>
				<div style={styles.indicator}>
					<div style={styles.indicatorDots}>
						{CARDS.map((card, i) => (
							<div
								key={card.title}
								style={
									cardStates[i].opacity > 0.5
										? { ...styles.dotActive, background: card.color }
										: styles.dot
								}
							/>
						))}
					</div>
					<span style={styles.progressText}>
						{visibleCount}/{CARDS.length} revealed
					</span>
				</div>

				<div style={styles.scrollContent}>
					{CARDS.map((card, i) => {
						const state = cardStates[i];
						return (
							<div
								key={card.title}
								style={{
									...styles.card,
									opacity: state.opacity,
									transform: `translateY(${state.translateY}px)`,
									borderColor: state.visible
										? `${card.color}30`
										: "#1f2937",
								}}
							>
								<div
									style={{
										...styles.cardIcon,
										background: `linear-gradient(135deg, ${card.color}, ${card.color}99)`,
									}}
								>
									{card.icon}
								</div>
								<div style={styles.cardContent}>
									<div style={styles.cardTitle}>{card.title}</div>
									<div style={styles.cardDesc}>{card.description}</div>
								</div>
							</div>
						);
					})}

					{/* Extra space at end so all cards can scroll into view */}
					<div style={{ height: 120 }} />
				</div>
			</div>
		</div>
	);
}

export const code = `import { useScroll } from "@reactzero/animotion";

function RevealOnScroll() {
  const scrollRef = useRef(null);
  const { progress } = useScroll({
    source: scrollRef,
  });

  const cards = [
    { title: "Design System", threshold: 0.08 },
    { title: "Performance",   threshold: 0.22 },
    { title: "Accessibility", threshold: 0.38 },
    { title: "Composition",   threshold: 0.54 },
    { title: "Developer DX",  threshold: 0.70 },
  ];

  return (
    <div ref={scrollRef} style={{ height: 340, overflow: "auto" }}>
      {cards.map((card) => {
        const visibility = clamp(
          (progress - card.threshold) / 0.15, 0, 1
        );
        return (
          <div
            key={card.title}
            style={{
              opacity: visibility,
              transform: \`translateY(\${(1 - visibility) * 30}px)\`,
            }}
          >
            {card.title}
          </div>
        );
      })}
    </div>
  );
}`;
