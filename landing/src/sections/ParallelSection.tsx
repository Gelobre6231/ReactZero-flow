import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import DashboardCards, { code as dashboardCode } from "../examples/parallel/DashboardCards";
import HeroEntrance, { code as heroCode } from "../examples/parallel/HeroEntrance";

export function ParallelSection() {
	return (
		<section className="section" id="parallel">
			<div className="container">
				<SectionHeader
					label="Parallel"
					title="Run animations simultaneously"
					description="Start multiple animations together and know exactly when they all finish. One controllable group instead of Promise.all boilerplate."
					index={2}
				/>
				<div className="examples-grid examples-grid-2">
					<ExampleCard
						title="Dashboard Cards"
						description="Stats cards animate in from different directions at once"
						code={dashboardCode}
					>
						<DashboardCards />
					</ExampleCard>
					<ExampleCard
						title="Hero Entrance"
						description="Background, title, subtitle, and CTA animate simultaneously"
						code={heroCode}
					>
						<HeroEntrance />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
