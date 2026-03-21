import { useRef, useEffect } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { CodeBlock } from "../components/CodeBlock";

declare const Prism: { highlightElement(el: Element): void };

const adaptiveCode = `import { enableAdaptivePerformance, animate } from "@reactzero/flow";

// One line to enable everything: device detection, FPS monitoring, priority system
enableAdaptivePerformance();

// Tag animations by importance
animate(el, fadeIn, { duration: 300, priority: "critical" });    // always runs
animate(el, shimmer, { duration: 500, priority: "decorative" }); // skipped under load`;

const testingCode = `// Instant animation for tests — no timers needed
await animate(el, keyframes, { duration: 0 }).finished;

// Or use the finished promise for async assertions
const ctrl = sequence(
  () => animate(el, fadeIn, { duration: 0 }),
  () => animate(el, slideUp, { duration: 0 }),
);
ctrl.play();
await ctrl.finished;
expect(el.style.opacity).toBe("1");`;

const devtoolsCode = `import { setPerformanceAnnotations } from "@reactzero/flow";

// Enable globally — all animate() calls create DevTools entries
setPerformanceAnnotations(true);

// Or per-animation
animate(el, keyframes, { duration: 300, __perf: true });
// Creates: performance.mark("flow:el:transform,opacity:start")
//          performance.measure("flow:el:transform,opacity")`;

const stats = [
	{ value: "0", label: "React re-renders" },
	{ value: "~8KB", label: "Brotli compressed" },
	{ value: "GPU", label: "Accelerated" },
	{ value: "0", label: "Dependencies" },
];

const features = [
	{
		color: "#f59e0b",
		title: "Adaptive Performance",
		content: adaptiveCode,
		isCode: true,
	},
	{
		color: "#10b981",
		title: "Testing Animations",
		content: testingCode,
		isCode: true,
	},
	{
		color: "#8b5cf6",
		title: "Priority Matrix",
		desc: true,
	},
	{
		color: "#3b82f6",
		title: "DevTools Integration",
		content: devtoolsCode,
		isCode: true,
	},
];

function PriorityMatrix() {
	return (
		<div style={{ padding: "16px 18px" }}>
			<div style={{
				display: "grid",
				gridTemplateColumns: "100px 1fr 1fr 1fr",
				gap: "1px",
				background: "var(--color-border)",
				borderRadius: 8,
				overflow: "hidden",
				fontSize: "0.72rem",
				fontFamily: "'JetBrains Mono', monospace",
			}}>
				{/* Header */}
				<div style={{ background: "#12121a", padding: "10px 12px", color: "var(--color-text-dim)" }}>
					pressure
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#ef4444", textAlign: "center" }}>
					critical
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#f59e0b", textAlign: "center" }}>
					normal
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#6b7280", textAlign: "center" }}>
					decorative
				</div>

				{/* None */}
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "var(--color-text-muted)" }}>
					none
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>

				{/* Moderate */}
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#f59e0b" }}>
					moderate
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>
				<div style={{ background: "#12121a", padding: "10px 12px", color: "#ef4444", textAlign: "center" }}>
					skip
				</div>

				{/* Critical */}
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#ef4444" }}>
					critical
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#10b981", textAlign: "center" }}>
					run
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#f59e0b", textAlign: "center" }}>
					reduce
				</div>
				<div style={{ background: "var(--color-surface)", padding: "10px 12px", color: "#ef4444", textAlign: "center" }}>
					skip
				</div>
			</div>
			<p style={{
				fontSize: "0.75rem",
				color: "var(--color-text-dim)",
				marginTop: 12,
				lineHeight: 1.5,
			}}>
				When FPS drops below thresholds, decorative animations skip instantly and normal
				animations speed up. Critical animations always run at full quality.
			</p>
		</div>
	);
}

function HighlightedPre({ code, language = "tsx" }: { code: string; language?: string }) {
	const codeRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (codeRef.current && typeof Prism !== "undefined") {
			Prism.highlightElement(codeRef.current);
		}
	}, [code]);

	return (
		<pre style={{
			padding: "14px 18px",
			margin: 0,
			fontSize: "0.72rem",
			lineHeight: 1.65,
			background: "transparent",
			overflow: "auto",
			maxHeight: 320,
		}}>
			<code ref={codeRef} className={`language-${language}`}>
				{code.trim()}
			</code>
		</pre>
	);
}

export function PerformanceSection() {
	return (
		<section className="section" id="performance">
			<div className="container">
				<SectionHeader
					label="Performance"
					title="Fast by default, adaptive under pressure"
					description="Zero React re-renders, GPU-accelerated rendering, automatic will-change management, and the only animation library with built-in adaptive degradation."
				/>

				{/* Stats Row */}
				<div className="stats-row">
					{stats.map((s) => (
						<div key={s.label} className="stat-cell">
							<div className="stat-value">{s.value}</div>
							<div className="stat-label">{s.label}</div>
						</div>
					))}
				</div>

				{/* Feature Cards */}
				<div className="perf-features">
					{features.map((f) => (
						<div key={f.title} className="perf-feature">
							<div className="perf-feature-header">
								<div className="perf-feature-dot" style={{ background: f.color }} />
								<span className="perf-feature-title">{f.title}</span>
							</div>
							{f.desc ? (
								<PriorityMatrix />
							) : f.isCode ? (
								<HighlightedPre code={f.content!} />
							) : null}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
