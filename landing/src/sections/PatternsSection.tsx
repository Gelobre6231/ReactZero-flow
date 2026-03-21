import { SectionHeader } from "../components/SectionHeader";
import { CodeBlock } from "../components/CodeBlock";

const patterns = [
	{
		label: "PATTERN 01",
		labelColor: "#3b82f6",
		title: "Page enter animation",
		desc: "Stagger elements on mount with a sequenced entrance. The most common animation pattern in production apps.",
		code: `// Sequenced page entrance with staggered list items
const ctrl = sequence(
  () => animate(header, [
    { opacity: 0, transform: "translateY(-20px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 400 }),
  () => stagger(
    items.map(el => () => animate(el, [
      { opacity: 0, transform: "translateY(15px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 300 })),
    { each: 50 },
  ),
);
ctrl.play();`,
	},
	{
		label: "PATTERN 02",
		labelColor: "#10b981",
		title: "Interruptible hover",
		desc: "Cancel and reverse on mouse leave. No orphaned animations, no competing transitions.",
		code: `let current: Controllable | null = null;

el.addEventListener("mouseenter", () => {
  current?.cancel();
  current = animate(el, [
    { transform: "scale(1)" },
    { transform: "scale(1.05)" },
  ], { duration: 200 });
  current.play();
});

el.addEventListener("mouseleave", () => {
  current?.cancel();
  current = animate(el, [
    { transform: el.style.transform || "scale(1.05)" },
    { transform: "scale(1)" },
  ], { duration: 150 });
  current.play();
});`,
	},
	{
		label: "PATTERN 03",
		labelColor: "#8b5cf6",
		title: "Async loading UI",
		desc: "Wait for data to load, then animate results in. Combines promises with animation steps seamlessly.",
		code: `import { sequence, waitFor, stagger, animate } from "@reactzero/flow";

const ctrl = sequence(
  // Show spinner
  () => animate(spinner, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }),
  // Wait for API response
  () => waitFor(fetchData()),
  // Hide spinner
  () => animate(spinner, [{ opacity: 1 }, { opacity: 0 }], { duration: 150 }),
  // Stagger results in
  () => stagger(
    results.map(el => () => animate(el, [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 250 })),
    { each: 40 },
  ),
);
ctrl.play();`,
	},
	{
		label: "PATTERN 04",
		labelColor: "#f59e0b",
		title: "Modal open / close",
		desc: "Parallel backdrop + content animation with clean cancel on close.",
		code: `function openModal() {
  return parallel(
    () => animate(backdrop, [
      { opacity: 0 }, { opacity: 1 },
    ], { duration: 200 }),
    () => animate(dialog, [
      { opacity: 0, transform: "scale(0.95) translateY(10px)" },
      { opacity: 1, transform: "scale(1) translateY(0)" },
    ], { duration: 300, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
  );
}

function closeModal() {
  return parallel(
    () => animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 150 }),
    () => animate(dialog, [
      { opacity: 1, transform: "scale(1)" },
      { opacity: 0, transform: "scale(0.95)" },
    ], { duration: 200 }),
  );
}`,
	},
];

export function PatternsSection() {
	return (
		<section className="section" id="patterns">
			<div className="container">
				<SectionHeader
					label="Common Patterns"
					title="Copy, paste, ship"
					description="Real-world patterns you can use today. Each one demonstrates a core composition technique."
				/>

				<div className="patterns-grid">
					{patterns.map((p) => (
						<div key={p.title} className="pattern-card">
							<div className="pattern-card-header">
								<div className="pattern-card-label" style={{ color: p.labelColor }}>
									{p.label}
								</div>
								<div className="pattern-card-title">{p.title}</div>
								<div className="pattern-card-desc">{p.desc}</div>
							</div>
							<CodeBlock code={p.code} language="tsx" />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
