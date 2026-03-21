import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import PulsingNotification, { code as pulsingCode } from "../examples/repeat/PulsingNotification";
import LoadingSpinner, { code as spinnerCode } from "../examples/repeat/LoadingSpinner";
import HeartbeatMonitor, { code as heartbeatCode } from "../examples/repeat/HeartbeatMonitor";

export function RepeatSection() {
	return (
		<section className="section" id="repeat">
			<div className="container">
				<SectionHeader
					label="Repeat"
					title="Loop and yoyo"
					description="Wrap any animation or composition in repeat(). Finite counts, infinite loops, yoyo — without re-implementing iteration logic or managing animation lifecycle manually."
					index={7}
				/>
				<div className="examples-grid">
					<ExampleCard
						title="Pulsing Notification"
						description="Badge pulse with configurable repeat count and yoyo"
						code={pulsingCode}
					>
						<PulsingNotification />
					</ExampleCard>
					<ExampleCard
						title="Loading Spinner"
						description="Infinite rotation with play/pause and speed controls"
						code={spinnerCode}
					>
						<LoadingSpinner />
					</ExampleCard>
					<ExampleCard
						title="Heartbeat Monitor"
						description="Repeating heartbeat with BPM display and speed presets"
						code={heartbeatCode}
					>
						<HeartbeatMonitor />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
