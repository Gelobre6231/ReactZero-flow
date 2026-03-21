import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import AccessibilityDemo, { code as a11yCode } from "../examples/composition/AccessibilityDemo";

export function AccessibilitySection() {
	return (
		<section className="section" id="accessibility">
			<div className="container">
				<SectionHeader
					label="Accessibility"
					title="Respects user preferences"
					description="prefers-reduced-motion handled automatically. Animations adapt or skip based on OS settings — no extra media queries, no manual checks, with configurable policies when you need finer control."
					index={11}
				/>
				<ExampleCard
					title="Reduced Motion Demo"
					description="Toggle reduced motion to see animations adapt in real-time"
					code={a11yCode}
				>
					<AccessibilityDemo />
				</ExampleCard>
			</div>
		</section>
	);
}
