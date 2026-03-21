import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import ChoreographedEntrance, { code as choreographedCode } from "../examples/delay/ChoreographedEntrance";

export function DelaySection() {
	return (
		<section className="section" id="delay">
			<div className="container">
				<SectionHeader
					label="Delay"
					title="Precise timing control"
					description="Add breathing room between steps. A lightweight controllable wait that respects playback rate and slots into any composition — not just a raw setTimeout wrapper."
					index={9}
				/>
				<ExampleCard
					title="Choreographed Entrance"
					description="Complex page entrance mixing delay with parallel, stagger, and sequence"
					code={choreographedCode}
				>
					<ChoreographedEntrance />
				</ExampleCard>
			</div>
		</section>
	);
}
