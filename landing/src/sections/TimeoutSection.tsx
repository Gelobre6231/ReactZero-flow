import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import AutoDismissToast, { code as toastCode } from "../examples/timeout/AutoDismissToast";
import CountdownTimer, { code as countdownCode } from "../examples/timeout/CountdownTimer";

export function TimeoutSection() {
	return (
		<section className="section" id="timeout">
			<div className="container">
				<SectionHeader
					label="Timeout"
					title="Timed delays as steps"
					description="Insert pauses and deadlines into any composition. Unlike setTimeout, it's controllable — pause, cancel, and track it like any other animation step."
					index={8}
				/>
				<div className="examples-grid examples-grid-2">
					<ExampleCard
						title="Auto-Dismiss Toast"
						description="Toast notification that auto-dismisses after a timeout"
						code={toastCode}
					>
						<AutoDismissToast />
					</ExampleCard>
					<ExampleCard
						title="Countdown Timer"
						description="Visual countdown with timeout-driven progression"
						code={countdownCode}
					>
						<CountdownTimer />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
