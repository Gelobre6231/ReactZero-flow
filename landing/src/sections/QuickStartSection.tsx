import { SectionHeader } from "../components/SectionHeader";
import { CodeBlock } from "../components/CodeBlock";

const basicCode = `import { animate } from "@reactzero/flow";

animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });`;

const sequenceCode = `import { sequence, stagger, animate, delay } from "@reactzero/flow";

sequence(
  () => animate(header, fadeIn, { duration: 400 }),
  () => stagger(
    items.map(el => () => animate(el, slideUp, { duration: 300 })),
    { each: 50 }
  ),
  () => delay(200),
  () => animate(cta, fadeIn, { duration: 300 }),
);`;

const hookCode = `import { useSequence, animate } from "@reactzero/flow";
import { useRef } from "react";

function App() {
  const box = useRef<HTMLDivElement>(null);
  const { play, pause, cancel, state } = useSequence([
    () => animate(box.current!, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }),
    () => animate(box.current!, [{ transform: "scale(0.8)" }, { transform: "scale(1)" }], { duration: 200 }),
  ]);

  return (
    <div>
      <div ref={box} />
      <button onClick={play}>Play</button>
      <p>{state}</p>
    </div>
  );
}`;

const snippets = [
	{ title: "Basic animation", badge: "2 lines", code: basicCode, language: "tsx" },
	{ title: "Compose a sequence", badge: "choreography", code: sequenceCode, language: "tsx" },
	{ title: "React hook", badge: "reactive state", code: hookCode, language: "tsx" },
];

export function QuickStartSection() {
	return (
		<section className="section" id="quickstart">
			<div className="container">
				<SectionHeader
					label="Quick Start"
					title="Get started in 30 seconds"
					description="Install, import, animate. Every primitive returns a Controllable with play, pause, cancel, and a finished promise."
				/>

				<div className="quickstart-grid">
					{snippets.map((s) => (
						<div key={s.title} className="quickstart-card">
							<div className="quickstart-card-header">
								<span className="quickstart-card-title">{s.title}</span>
								<span className="quickstart-card-badge">{s.badge}</span>
							</div>
							<CodeBlock code={s.code} language={s.language} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
