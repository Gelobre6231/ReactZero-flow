import { useEffect, useRef, useState } from "react";
import { FlowLogo } from "./TechGraphics";

export function Nav() {
	const navRef = useRef<HTMLElement>(null);
	const [visible, setVisible] = useState(false);
	const [scrollProgress, setScrollProgress] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			setVisible(scrollY > 300);

			const docHeight =
				document.documentElement.scrollHeight - window.innerHeight;
			setScrollProgress(docHeight > 0 ? scrollY / docHeight : 0);
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<nav
			ref={navRef}
			className={`sticky-nav${visible ? " visible" : ""}`}
		>
			<div className="container">
				<a href="#top" className="nav-brand" style={{ display: "inline-flex", alignItems: "center" }}>
					<FlowLogo size={22} showLabel={false} />
					<span style={{ marginLeft: 8 }}>flow</span>
				</a>
				<div className="nav-links">
					<a href="#why">Why</a>
					<a href="#patterns">Patterns</a>
					<a href="#performance">Performance</a>
					<a href="#sequence">Sequence</a>
					<a href="#parallel">Parallel</a>
					<a href="#stagger">Stagger</a>
					<a href="#timeline">Timeline</a>
					<a href="#scroll">Scroll</a>
					<a href="#race">Race</a>
					<a href="#repeat">Repeat</a>
					<a href="#timeout">Timeout</a>
					<a
						href="https://github.com/motiondesignlv/ReactZero-Flow"
						target="_blank"
						rel="noopener noreferrer"
						className="btn-primary"
						style={{
							padding: "6px 16px",
							fontSize: "0.85rem",
							borderRadius: "6px",
						}}
					>
						GitHub
					</a>
				</div>
			</div>
			<div
				className="nav-progress"
				style={{ width: `${scrollProgress * 100}%` }}
			/>
		</nav>
	);
}
