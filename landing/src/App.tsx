import { EasingPanel } from "./components/EasingPanel";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { TechFrame, DotGrid, CrossMark, FlowLogo, TypoDivider, GeoComposition } from "./components/TechGraphics";
import { WhySection } from "./sections/WhySection";
import { PhilosophySection } from "./sections/PhilosophySection";
import { QuickStartSection } from "./sections/QuickStartSection";
import { PatternsSection } from "./sections/PatternsSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { SequenceSection } from "./sections/SequenceSection";
import { ParallelSection } from "./sections/ParallelSection";
import { StaggerSection } from "./sections/StaggerSection";
import { TimelineSection } from "./sections/TimelineSection";
import { ScrollSection } from "./sections/ScrollSection";
import { RaceSection } from "./sections/RaceSection";
import { RepeatSection } from "./sections/RepeatSection";
import { TimeoutSection } from "./sections/TimeoutSection";
import { DelaySection } from "./sections/DelaySection";
import { CompositionSection } from "./sections/CompositionSection";
import { AccessibilitySection } from "./sections/AccessibilitySection";
import { ApiSection } from "./sections/ApiSection";

export function App() {
	return (
		<>
			<Nav />
			<Hero />
			<main>
				<WhySection />
				<PhilosophySection />
				<QuickStartSection />
				<PatternsSection />
				<PerformanceSection />

				<TypoDivider
					text="CHOREOGRAPH"
					subtitle="Animate"
					metadata="sequence / parallel / stagger"
					align="left"
				/>

				<SequenceSection />
				<ParallelSection />
				<StaggerSection />

				<TypoDivider
					text="ORCHESTRATE"
					subtitle="Control"
					metadata="timeline / scroll / seek"
					align="left"
				/>

				<TimelineSection />
				<ScrollSection />

				<GeoComposition
					text="COMPETE"
					label="race / repeat / timeout"
					variant="b"
				/>

				<RaceSection />
				<RepeatSection />
				<TimeoutSection />

				<TypoDivider
					text="COMPOSE"
					subtitle="Build"
					metadata="delay / nest / combine"
					align="right"
				/>

				<DelaySection />
				<CompositionSection />
				<AccessibilitySection />

				<TypoDivider
					text="CONFIGURE"
					subtitle="Adapt"
					metadata="api / options / performance"
					align="left"
				/>

				<ApiSection />
			</main>
			<div className="promo-banner">
				<img
					src={`${import.meta.env.BASE_URL}flow.jpg`}
					alt="Flow — Animation orchestration for React"
					loading="lazy"
				/>
				<span className="promo-banner-credit">
					Photo by{" "}
					<a
						href="https://www.pexels.com/photo/orchestra-performing-on-stage-5933199/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Camy Aquino
					</a>
				</span>
			</div>
			<footer className="footer">
				<div className="container">
					<TechFrame markSize={12} markOffset={-6}>
						<div className="footer-content">
							<div className="footer-brand">
								<FlowLogo size={24} showLabel={false} />
								<span className="footer-logo" style={{ marginLeft: 8 }}>flow</span>
								<span className="footer-tagline" style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: "0.7rem",
									letterSpacing: "0.05em",
								}}>
									v0.1.0 &middot; 8.7KB &middot; MIT
								</span>
							</div>
							<div className="footer-links">
								<a
									href="https://github.com/motiondesignlv/ReactZero-Flow"
									target="_blank"
									rel="noopener noreferrer"
								>
									GitHub
								</a>
								<a
									href="https://www.npmjs.com/package/@reactzero/flow"
									target="_blank"
									rel="noopener noreferrer"
								>
									npm
								</a>
							</div>
						</div>
						<div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
							<CrossMark size={8} />
							<div style={{
								flex: 1,
								height: 1,
								background: "rgba(100, 108, 255, 0.15)",
							}} />
							<span className="footer-copy">
								Built and maintained by{" "}
								<a
									href="https://github.com/motiondesignlv"
									target="_blank"
									rel="noopener noreferrer"
								>
									@motiondesignlv
								</a>
								{" "}&middot; Zero dependencies &middot; Hardware-accelerated
							</span>
							<div style={{
								flex: 1,
								height: 1,
								background: "rgba(100, 108, 255, 0.15)",
							}} />
							<CrossMark size={8} />
						</div>
						<DotGrid
							rows={3}
							cols={8}
							spacing={10}
							dotSize={1}
							style={{
								position: "absolute",
								bottom: -20,
								right: 20,
								opacity: 0.5,
							}}
						/>
					</TechFrame>
				</div>
			</footer>
		<EasingPanel />
		</>
	);
}
