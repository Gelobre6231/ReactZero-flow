import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import OnboardingWizard, { code as onboardingCode } from "../examples/sequence/OnboardingWizard";
import ToastCascade, { code as toastCode } from "../examples/sequence/ToastCascade";
import CheckoutSteps, { code as checkoutCode } from "../examples/sequence/CheckoutSteps";

export function SequenceSection() {
	return (
		<section className="section" id="sequence">
			<div className="container">
				<SectionHeader
					label="Sequencing"
					title="Chain animations in order"
					description="One call replaces chains of await .finished promises. Each step plays after the previous completes — no manual coordination."
					index={1}
				/>
				<div className="examples-grid">
					<ExampleCard
						title="Onboarding Wizard"
						description="Multi-step form with sequential card transitions"
						code={onboardingCode}
					>
						<OnboardingWizard />
					</ExampleCard>
					<ExampleCard
						title="Toast Cascade"
						description="Notifications slide in and out in sequence"
						code={toastCode}
					>
						<ToastCascade />
					</ExampleCard>
					<ExampleCard
						title="Checkout Steps"
						description="Step-by-step checkout flow with progress indicators"
						code={checkoutCode}
					>
						<CheckoutSteps />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
