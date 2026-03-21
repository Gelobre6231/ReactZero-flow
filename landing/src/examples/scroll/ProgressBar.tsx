import { useRef } from "react";
import { useScroll } from "@flow";

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
		height: 300,
		overflow: "auto",
		borderRadius: 8,
		background: "#0f1117",
	},
	progressTrack: {
		position: "sticky" as const,
		top: 0,
		left: 0,
		right: 0,
		height: 4,
		background: "#1f2937",
		zIndex: 10,
	},
	progressFill: {
		height: "100%",
		background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
		borderRadius: "0 2px 2px 0",
		transition: "width 60ms linear",
	},
	percentBadge: {
		position: "sticky" as const,
		top: 12,
		float: "right" as const,
		marginRight: 12,
		padding: "4px 10px",
		borderRadius: 12,
		background: "rgba(59, 130, 246, 0.15)",
		color: "#93c5fd",
		fontSize: 12,
		fontFamily: "monospace",
		fontWeight: 600,
		zIndex: 10,
		backdropFilter: "blur(8px)",
	},
	content: {
		padding: "32px 20px 20px",
		clear: "both" as const,
	},
	heading: {
		fontSize: 18,
		fontWeight: 700,
		color: "#e0e0e6",
		marginBottom: 16,
	},
	paragraph: {
		fontSize: 14,
		lineHeight: 1.7,
		color: "#9ca3af",
		marginBottom: 16,
	},
	divider: {
		height: 1,
		background: "#1f2937",
		margin: "20px 0",
	},
	subheading: {
		fontSize: 15,
		fontWeight: 600,
		color: "#c4b5fd",
		marginBottom: 12,
	},
	listItem: {
		fontSize: 14,
		lineHeight: 1.8,
		color: "#9ca3af",
		paddingLeft: 16,
		position: "relative" as const,
	},
};

const CONTENT_SECTIONS = [
	{
		heading: "Getting Started with Animations",
		text: "Modern web animations bring interfaces to life. With the Web Animations API, we can create performant, hardware-accelerated animations directly from JavaScript without relying on CSS transitions for complex sequences.",
	},
	{
		heading: "Why Sequencing Matters",
		text: "Individual animations are straightforward, but real UI polish comes from orchestrating multiple animations together. A modal that fades in while its backdrop blurs, content that staggers into view card by card, or a page transition that coordinates dozens of elements -- these all require sequencing.",
	},
	{
		heading: "The Composition Model",
		text: "Think of animations as building blocks. A single animate() call is an atom. Sequence them for serial playback, run them in parallel for synchronized motion, or stagger them for rhythmic cascades. These primitives compose infinitely.",
	},
	{
		heading: "Timeline Control",
		text: "For the most precise choreography, timelines let you place animations at exact millisecond positions. Scrub through them with a slider, jump to named labels, or drive them from scroll position. Full creative control.",
	},
];

export default function ProgressBar() {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const { progress } = useScroll({ source: scrollContainerRef });
	const percent = Math.round(progress * 100);

	return (
		<div style={styles.container}>
			<div ref={scrollContainerRef} style={styles.scrollArea}>
				<div style={styles.progressTrack}>
					<div style={{ ...styles.progressFill, width: `${percent}%` }} />
				</div>

				<div style={styles.percentBadge}>{percent}%</div>

				<div style={styles.content}>
					{CONTENT_SECTIONS.map((section, i) => (
						<div key={section.heading}>
							{i > 0 && <div style={styles.divider} />}
							<div style={styles.subheading}>{section.heading}</div>
							<p style={styles.paragraph}>{section.text}</p>
						</div>
					))}

					<div style={styles.divider} />
					<div style={styles.subheading}>Key Features</div>
					{[
						"Zero dependencies -- just React and the Web Animations API",
						"Composable primitives: sequence, parallel, stagger, timeline",
						"Full playback control: play, pause, cancel, finish, seek",
						"Scroll-driven animations with useScroll hook",
						"Accessible by default with reduced motion support",
					].map((item) => (
						<div key={item} style={styles.listItem}>
							- {item}
						</div>
					))}

					<div style={{ height: 40 }} />
				</div>
			</div>
		</div>
	);
}

export const code = `import { useScroll } from "@reactzero/animotion";

function ScrollProgress() {
  const containerRef = useRef(null);
  const { progress } = useScroll({
    source: containerRef,
  });

  return (
    <div ref={containerRef} style={{ height: 300, overflow: "auto" }}>
      <div style={{
        position: "sticky", top: 0,
        height: 4, background: "#1f2937",
      }}>
        <div style={{
          height: "100%",
          width: \`\${progress * 100}%\`,
          background: "#3b82f6",
        }} />
      </div>

      <p>{Math.round(progress * 100)}%</p>
      {/* scrollable content */}
    </div>
  );
}`;
