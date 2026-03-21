import { SectionHeader } from "../components/SectionHeader";
import { ExampleCard } from "../components/ExampleCard";
import PhotoGallery, { code as galleryCode } from "../examples/stagger/PhotoGallery";
import NavMenuItems, { code as navCode } from "../examples/stagger/NavMenuItems";
import GridReveal, { code as gridCode } from "../examples/stagger/GridReveal";

export function StaggerSection() {
	return (
		<section className="section" id="stagger">
			<div className="container">
				<SectionHeader
					label="Stagger"
					title="Cascade with timed offsets"
					description="Animate lists and grids without calculating delays per item. Define the animation, set the gap — stagger handles the offset math and creates ripple effects automatically."
					index={3}
				/>
				<div className="examples-grid">
					<ExampleCard
						title="Photo Gallery"
						description="Grid of photos cascade in with staggered scale and rotation"
						code={galleryCode}
					>
						<PhotoGallery />
					</ExampleCard>
					<ExampleCard
						title="Nav Menu Items"
						description="Menu items slide in with staggered delay"
						code={navCode}
					>
						<NavMenuItems />
					</ExampleCard>
					<ExampleCard
						title="Grid Reveal"
						description="Colored tiles scale in with cascading stagger"
						code={gridCode}
					>
						<GridReveal />
					</ExampleCard>
				</div>
			</div>
		</section>
	);
}
