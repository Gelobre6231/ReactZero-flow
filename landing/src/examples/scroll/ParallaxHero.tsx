import { useRef } from "react";
import { useScroll } from "@flow";

/* ── Accent shapes: rings (border-only) + dots (solid + glow) ── */
const ACCENTS = [
	{ x: 8, y: 18, size: 16, color: "#646cff", ring: true },
	{ x: 88, y: 12, size: 6, color: "#ec4899", ring: false },
	{ x: 14, y: 72, size: 12, color: "#3b82f6", ring: true },
	{ x: 82, y: 68, size: 4, color: "#f59e0b", ring: false },
	{ x: 45, y: 8, size: 20, color: "#10b981", ring: true },
	{ x: 55, y: 82, size: 8, color: "#8b5cf6", ring: false },
];

const styles = {
	container: {
		background: "#12121a",
		borderRadius: 12,
		padding: 24,
		fontFamily: "'Inter', system-ui, sans-serif",
		color: "#e0e0e6",
		maxWidth: 480,
	} as const,
	scrollArea: {
		position: "relative" as const,
		height: 320,
		overflow: "auto",
		borderRadius: 8,
	},
	viewport: {
		position: "sticky" as const,
		top: 0,
		height: 320,
		overflow: "hidden",
		background:
			"linear-gradient(180deg, #0a0a0f 0%, #0d0d18 50%, #12121a 100%)",
	},
	layer: {
		position: "absolute" as const,
		inset: 0,
		willChange: "transform" as const,
	},
	/* ── Orbs ── */
	orb: {
		position: "absolute" as const,
		borderRadius: "50%",
		filter: "blur(40px)",
	},
	/* ── Typography shared ── */
	textCenter: {
		position: "absolute" as const,
		inset: 0,
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		justifyContent: "center",
		pointerEvents: "none" as const,
	},
	headingBase: {
		fontSize: 96,
		fontWeight: 800,
		letterSpacing: "-0.04em",
		lineHeight: 1,
		margin: 0,
		fontFamily: "'Inter', system-ui, sans-serif",
		userSelect: "none" as const,
	},
	/* ── Scroll hint ── */
	scrollHint: {
		position: "absolute" as const,
		bottom: 16,
		left: "50%",
		transform: "translateX(-50%)",
		fontSize: 11,
		color: "rgba(255,255,255,0.25)",
		display: "flex",
		flexDirection: "column" as const,
		alignItems: "center",
		gap: 4,
		zIndex: 10,
		letterSpacing: "0.1em",
		textTransform: "uppercase" as const,
	},
	scrollArrow: {
		width: 10,
		height: 10,
		border: "1.5px solid rgba(255,255,255,0.25)",
		borderTop: "none",
		borderLeft: "none",
		transform: "rotate(45deg)",
	},
	scrollSpacer: {
		height: 700,
		pointerEvents: "none" as const,
	},
};

export default function ParallaxHero() {
	const scrollRef = useRef<HTMLDivElement>(null);
	const { progress } = useScroll({ source: scrollRef });

	// Four layers, each moving at a different speed
	const orbY = progress * -20;
	const outlineY = progress * -60;
	const solidY = progress * -120;
	const accentY = progress * -180;

	return (
		<div style={styles.container}>
			<div ref={scrollRef} style={styles.scrollArea}>
				<div style={styles.viewport}>
					{/* Layer 1 — Background orbs (barely moves) */}
					<div
						style={{
							...styles.layer,
							transform: `translateY(${orbY}px)`,
							opacity: 0.25 - progress * 0.2,
						}}
					>
						<div
							style={{
								...styles.orb,
								width: 180,
								height: 180,
								left: "10%",
								top: "15%",
								background:
									"radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)",
							}}
						/>
						<div
							style={{
								...styles.orb,
								width: 150,
								height: 150,
								left: "65%",
								top: "55%",
								background:
									"radial-gradient(circle, rgba(20,184,166,0.35), transparent 70%)",
							}}
						/>
						<div
							style={{
								...styles.orb,
								width: 130,
								height: 130,
								left: "75%",
								top: "10%",
								background:
									"radial-gradient(circle, rgba(236,72,153,0.3), transparent 70%)",
							}}
						/>
					</div>

					{/* Layer 2 — Outline "DEPTH" (slow drift) */}
					<div
						style={{
							...styles.layer,
							transform: `translateY(${outlineY}px)`,
							filter: `blur(${progress * 6}px)`,
						}}
					>
						<div style={styles.textCenter}>
							<h2
								style={{
									...styles.headingBase,
									color: "transparent",
									WebkitTextStroke: "1.5px rgba(100,108,255,0.3)",
									opacity: 0.15,
								}}
							>
								DEPTH
							</h2>
						</div>
					</div>

					{/* Layer 3 — Solid "DEPTH" + subtitle (medium-fast) */}
					<div
						style={{
							...styles.layer,
							transform: `translateY(${solidY}px) scale(${1 - progress * 0.04})`,
						}}
					>
						<div style={styles.textCenter}>
							<h2
								style={{
									...styles.headingBase,
									background:
										"linear-gradient(135deg, #fff 0%, #646cff 50%, #8b5cf6 100%)",
									WebkitBackgroundClip: "text",
									WebkitTextFillColor: "transparent",
									backgroundClip: "text",
									textShadow: "none",
								}}
							>
								DEPTH
							</h2>
							{/* Glow behind the text (can't use text-shadow with background-clip) */}
							<div
								style={{
									position: "absolute",
									inset: 0,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									zIndex: -1,
								}}
							>
								<div
									style={{
										fontSize: 96,
										fontWeight: 800,
										letterSpacing: "-0.04em",
										lineHeight: 1,
										color: "rgba(100,108,255,0.15)",
										filter: "blur(20px)",
										fontFamily: "'Inter', system-ui, sans-serif",
										userSelect: "none",
									}}
								>
									DEPTH
								</div>
							</div>
							<span
								style={{
									fontSize: 12,
									color: `rgba(255,255,255,${0.3 - progress * 0.25})`,
									letterSpacing: "0.2em",
									textTransform: "uppercase",
									marginTop: 12,
								}}
							>
								scroll to explore
							</span>
						</div>
					</div>

					{/* Layer 4 — Geometric accents (fastest) */}
					<div
						style={{
							...styles.layer,
							transform: `translateY(${accentY}px)`,
						}}
					>
						{ACCENTS.map((a, i) => (
							<div
								key={i}
								style={{
									position: "absolute",
									left: `${a.x}%`,
									top: `${a.y}%`,
									width: a.size,
									height: a.size,
									borderRadius: "50%",
									opacity: i % 2 === 0 ? progress : 1 - progress,
									...(a.ring
										? {
												border: `1.5px solid ${a.color}`,
												boxShadow: `0 0 8px ${a.color}40`,
											}
										: {
												background: a.color,
												boxShadow: `0 0 12px ${a.color}60`,
											}),
								}}
							/>
						))}
					</div>

					{/* Scroll hint */}
					{progress < 0.05 && (
						<div style={styles.scrollHint}>
							<span>Scroll</span>
							<div style={styles.scrollArrow} />
						</div>
					)}
				</div>

				<div style={styles.scrollSpacer} />
			</div>
		</div>
	);
}

export const code = `import { useScroll } from "@reactzero/animotion";

function TypographicParallax() {
  const scrollRef = useRef(null);
  const { progress } = useScroll({
    source: scrollRef,
  });

  // Four layers — closer = faster
  const orbY = progress * -20;       // background glow
  const outlineY = progress * -60;   // ghost text
  const solidY = progress * -120;    // main text
  const accentY = progress * -180;   // floating shapes

  return (
    <div ref={scrollRef} style={{ height: 320, overflow: "auto" }}>
      <div style={{ position: "sticky", top: 0, height: 320 }}>
        {/* Background orbs — barely move, fade out */}
        <div style={{
          transform: \`translateY(\${orbY}px)\`,
          opacity: 0.25 - progress * 0.2,
        }}>
          {/* Blurred gradient orbs */}
        </div>

        {/* Outline text — slow drift, blurs away */}
        <div style={{
          transform: \`translateY(\${outlineY}px)\`,
          filter: \`blur(\${progress * 6}px)\`,
        }}>
          <h2 style={{ WebkitTextStroke: "1.5px rgba(100,108,255,0.3)" }}>
            DEPTH
          </h2>
        </div>

        {/* Solid gradient text — medium speed, slight scale */}
        <div style={{
          transform: \`translateY(\${solidY}px) scale(\${1 - progress * 0.04})\`,
        }}>
          <h2 style={{
            background: "linear-gradient(135deg, #fff, #646cff, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            DEPTH
          </h2>
        </div>

        {/* Accent shapes — fastest layer */}
        <div style={{ transform: \`translateY(\${accentY}px)\` }}>
          {/* Rings and dots with alternating fade */}
        </div>
      </div>
      <div style={{ height: 700 }} />
    </div>
  );
}`;
