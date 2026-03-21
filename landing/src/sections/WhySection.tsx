import { SectionHeader } from "../components/SectionHeader";

const comparisonRows = [
	{ feature: "Zero re-renders", flow: true, declarative: false, imperative: false, css: true },
	{ feature: "Composable sequencing", flow: true, declarative: false, imperative: true, css: false },
	{ feature: "Seekable timelines", flow: true, declarative: false, imperative: true, css: false },
	{ feature: "True cancellation", flow: true, declarative: false, imperative: true, css: false },
	{ feature: "React hooks API", flow: true, declarative: true, imperative: false, css: false },
	{ feature: "Adaptive degradation", flow: true, declarative: false, imperative: false, css: false },
	{ feature: "Under 10KB gzipped", flow: true, declarative: false, imperative: false, css: true },
	{ feature: "Zero dependencies", flow: true, declarative: false, imperative: false, css: true },
];

const differentiators = [
	{
		color: "#3b82f6",
		title: "No React re-renders",
		desc: "Animations run on the browser's compositor thread via WAAPI. Your component state stays untouched.",
	},
	{
		color: "#10b981",
		title: "Deterministic sequencing",
		desc: "sequence(), parallel(), and stagger() compose into predictable chains. No race conditions, no timing hacks.",
	},
	{
		color: "#8b5cf6",
		title: "Built-in performance degradation",
		desc: "The only animation library with adaptive performance. Automatically adjusts based on device capability and frame rate.",
	},
	{
		color: "#f59e0b",
		title: "True cancellation model",
		desc: "finished promises always resolve, never reject. Cancel any animation cleanly without try/catch boilerplate.",
	},
];

function Check() {
	return <span className="why-grid-check">&#10003;</span>;
}

function Dash() {
	return <span className="why-grid-dash">&#8212;</span>;
}

export function WhySection() {
	return (
		<section className="section" id="why">
			<div className="container">
				<SectionHeader
					label="Why Flow"
					title="Built different"
					description="Declarative libraries trade control for convenience. Imperative libraries trade bundle size for power. Flow gives you both in under 10KB."
				/>

				{/* Comparison Grid */}
				<div className="why-grid">
					{/* Headers */}
					<div className="why-grid-cell">
						<div className="why-grid-header" style={{ color: "var(--color-accent)" }}>Flow</div>
					</div>
					<div className="why-grid-cell">
						<div className="why-grid-header" style={{ color: "var(--color-text-dim)" }}>Declarative libs</div>
					</div>
					<div className="why-grid-cell">
						<div className="why-grid-header" style={{ color: "var(--color-text-dim)" }}>Imperative libs</div>
					</div>
					<div className="why-grid-cell">
						<div className="why-grid-header" style={{ color: "var(--color-text-dim)" }}>CSS only</div>
					</div>

					{/* Rows */}
					{comparisonRows.map((row) => (
						<>
							<div key={`flow-${row.feature}`} className="why-grid-cell why-grid-item">
								{row.flow ? <Check /> : <Dash />}{row.feature}
							</div>
							<div key={`decl-${row.feature}`} className="why-grid-cell why-grid-item">
								{row.declarative ? <Check /> : <Dash />}{row.feature}
							</div>
							<div key={`imp-${row.feature}`} className="why-grid-cell why-grid-item">
								{row.imperative ? <Check /> : <Dash />}{row.feature}
							</div>
							<div key={`css-${row.feature}`} className="why-grid-cell why-grid-item">
								{row.css ? <Check /> : <Dash />}{row.feature}
							</div>
						</>
					))}
				</div>

				{/* Differentiators */}
				<div className="why-differentiators">
					{differentiators.map((d) => (
						<div key={d.title} className="why-diff-card">
							<div
								className="why-diff-icon"
								style={{ background: `${d.color}15`, color: d.color }}
							>
								&#9654;
							</div>
							<div>
								<div className="why-diff-title">{d.title}</div>
								<div className="why-diff-desc">{d.desc}</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
