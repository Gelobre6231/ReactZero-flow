import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import ProductShowcase, { code as productCode } from "../examples/timeline/ProductShowcase";
import StorytellingScroll, { code as storyCode } from "../examples/timeline/StorytellingScroll";

export function TimelineSection() {
	return (
		<section className="section" id="timeline">
			<div className="container">
				<SectionHeader
					label="Timeline"
					title="Scrub, seek, control"
					description="One playhead across many elements — something the Web Animations API doesn't offer natively. Scrub to any point, jump to named labels, and adjust speed from a single control."
					index={4}
				/>
				<div className="examples-grid examples-grid-2">
					<ExampleCard
						title="Product Showcase"
						description="Seekable timeline with scrubber, labels, and playback rate"
						code={productCode}
					>
						<ProductShowcase />
					</ExampleCard>
					<ExampleCard
						title="Storytelling Scroll"
						description="Three-act timeline with animated scene transitions"
						code={storyCode}
					>
						<StorytellingScroll />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
