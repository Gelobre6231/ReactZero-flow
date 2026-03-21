import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import PageTransition, { code as pageCode } from "../examples/composition/PageTransition";
import ModalWithBackdrop, { code as modalCode } from "../examples/composition/ModalWithBackdrop";

export function CompositionSection() {
	return (
		<section className="section" id="composition">
			<div className="container">
				<SectionHeader
					label="Composition"
					title="Combine everything"
					description="Nest primitives freely — sequence(parallel(...), stagger(...)) just works. Complex choreography from simple building blocks, with one play/pause/cancel for the whole tree."
					index={10}
				/>
				<div className="examples-grid">
					<ExampleCard
						title="Page Transition"
						description="Full-page transition composing all primitives together"
						code={pageCode}
					>
						<PageTransition />
					</ExampleCard>
					<ExampleCard
						title="Modal with Backdrop"
						description="Coordinated modal and backdrop entrance/exit"
						code={modalCode}
					>
						<ModalWithBackdrop />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
