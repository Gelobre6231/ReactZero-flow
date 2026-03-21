import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import ProgressBar, { code as progressCode } from "../examples/scroll/ProgressBar";
import ParallaxHero, { code as parallaxCode } from "../examples/scroll/ParallaxHero";
import RevealOnScroll, { code as revealCode } from "../examples/scroll/RevealOnScroll";

export function ScrollSection() {
	return (
		<section className="section" id="scroll">
			<div className="container">
				<SectionHeader
					label="Scroll"
					title="Scroll-driven animations"
					description="Scroll progress as a single reactive value. Drive parallax, reveals, and progress indicators with one hook — no manual IntersectionObserver or scroll listener wiring."
					index={5}
				/>
				<div className="examples-grid">
					<ExampleCard
						title="Progress Bar"
						description="Sticky bar showing scroll percentage in real-time"
						code={progressCode}
					>
						<ProgressBar />
					</ExampleCard>
					<ExampleCard
						title="Parallax Landscape"
						description="Night scene with layers moving at different speeds"
						code={parallaxCode}
					>
						<ParallaxHero />
					</ExampleCard>
					<ExampleCard
						title="Reveal on Scroll"
						description="Elements animate in as they enter the viewport"
						code={revealCode}
					>
						<RevealOnScroll />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
