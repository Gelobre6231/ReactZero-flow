import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import FetchWithTimeout, { code as fetchCode } from "../examples/race/FetchWithTimeout";
import CompetingAnimations, { code as competingCode } from "../examples/race/CompetingAnimations";

export function RaceSection() {
	return (
		<section className="section" id="race">
			<div className="container">
				<SectionHeader
					label="Race"
					title="First one wins"
					description="Run animations in competition with race(). The first to finish wins and the rest cancel automatically — timeouts, fallbacks, and deadline patterns in one primitive."
					index={6}
				/>
				<div className="examples-grid examples-grid-2">
					<ExampleCard
						title="Fetch with Timeout"
						description="Race a simulated API call against a timeout deadline"
						code={fetchCode}
					>
						<FetchWithTimeout />
					</ExampleCard>
					<ExampleCard
						title="Competing Animations"
						description="Three bars race to completion with random durations"
						code={competingCode}
					>
						<CompetingAnimations />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
