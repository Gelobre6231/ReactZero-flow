import { SectionHeader } from "../components/SectionHeader";

const principles = [
	{
		title: "Composition over configuration",
		desc: "Build complex choreography by combining simple primitives. sequence(), parallel(), and stagger() nest inside each other infinitely.",
	},
	{
		title: "Animations are interruptible",
		desc: "Every animation can be paused, cancelled, or reversed at any point. No fire-and-forget. No orphaned animations.",
	},
	{
		title: "Performance is first-class",
		desc: "Automatic will-change, compositor property detection, dev warnings for layout-triggering properties, and adaptive degradation.",
	},
	{
		title: "Predictable, not magical",
		desc: "finished always resolves. playState is always accurate. No hidden state machines, no surprising side effects.",
	},
	{
		title: "Everything is controllable",
		desc: "Every primitive returns the same Controllable interface: play, pause, cancel, finish, finished, playState, playbackRate.",
	},
];

export function PhilosophySection() {
	return (
		<section className="section" id="philosophy">
			<div className="container">
				<SectionHeader
					label="Design Philosophy"
					title="Principles, not opinions"
					description="Every API decision in Flow follows from five core principles. Understanding them makes the entire library predictable."
				/>

				<div className="philosophy-grid">
					{principles.map((p, i) => (
						<div key={p.title} className="philosophy-card">
							<div className="philosophy-card-number">
								{String(i + 1).padStart(2, "0")}
							</div>
							<div className="philosophy-card-title">{p.title}</div>
							<div className="philosophy-card-desc">{p.desc}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
