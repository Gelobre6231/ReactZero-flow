import { forwardRef, useRef, useEffect } from "react";
import type { CSSProperties } from "react";
import { animate, stagger, parallel, repeat } from "@flow/index";
import type { Controllable } from "@flow/index";

/* ═══════════════════════════════════════════════════════════
   REGISTRATION MARK — ┌ ┐ └ ┘ corner brackets
   ═══════════════════════════════════════════════════════════ */
interface RegistrationMarkProps {
	position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
	size?: number;
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const RegistrationMark = forwardRef<HTMLDivElement, RegistrationMarkProps>(
	({ position, size = 16, color = "rgba(100, 108, 255, 0.4)", style, className }, ref) => {
		const borderWidth = 1;
		const borderStyle: CSSProperties = {
			position: "absolute",
			width: size,
			height: size,
			...style,
		};

		switch (position) {
			case "top-left":
				borderStyle.top = 0;
				borderStyle.left = 0;
				borderStyle.borderTop = `${borderWidth}px solid ${color}`;
				borderStyle.borderLeft = `${borderWidth}px solid ${color}`;
				break;
			case "top-right":
				borderStyle.top = 0;
				borderStyle.right = 0;
				borderStyle.borderTop = `${borderWidth}px solid ${color}`;
				borderStyle.borderRight = `${borderWidth}px solid ${color}`;
				break;
			case "bottom-left":
				borderStyle.bottom = 0;
				borderStyle.left = 0;
				borderStyle.borderBottom = `${borderWidth}px solid ${color}`;
				borderStyle.borderLeft = `${borderWidth}px solid ${color}`;
				break;
			case "bottom-right":
				borderStyle.bottom = 0;
				borderStyle.right = 0;
				borderStyle.borderBottom = `${borderWidth}px solid ${color}`;
				borderStyle.borderRight = `${borderWidth}px solid ${color}`;
				break;
		}

		return <div ref={ref} className={className} style={borderStyle} />;
	},
);

/* ═══════════════════════════════════════════════════════════
   CROSS MARK — + shaped grid anchor
   ═══════════════════════════════════════════════════════════ */
interface CrossMarkProps {
	size?: number;
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const CrossMark = forwardRef<SVGSVGElement, CrossMarkProps>(
	({ size = 8, color = "rgba(100, 108, 255, 0.35)", style, className }, ref) => (
		<svg
			ref={ref}
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			style={{ display: "block", ...style }}
			className={className}
		>
			<line
				x1={size / 2}
				y1={0}
				x2={size / 2}
				y2={size}
				stroke={color}
				strokeWidth={1}
			/>
			<line
				x1={0}
				y1={size / 2}
				x2={size}
				y2={size / 2}
				stroke={color}
				strokeWidth={1}
			/>
		</svg>
	),
);

/* ═══════════════════════════════════════════════════════════
   DOT GRID — background texture pattern
   ═══════════════════════════════════════════════════════════ */
interface DotGridProps {
	rows?: number;
	cols?: number;
	spacing?: number;
	dotSize?: number;
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const DotGrid = forwardRef<SVGSVGElement, DotGridProps>(
	(
		{
			rows = 5,
			cols = 5,
			spacing = 12,
			dotSize = 1.5,
			color = "rgba(100, 108, 255, 0.2)",
			style,
			className,
		},
		ref,
	) => {
		const w = (cols - 1) * spacing + dotSize * 2;
		const h = (rows - 1) * spacing + dotSize * 2;
		const dots: JSX.Element[] = [];

		for (let r = 0; r < rows; r++) {
			for (let c = 0; c < cols; c++) {
				dots.push(
					<circle
						key={`${r}-${c}`}
						cx={dotSize + c * spacing}
						cy={dotSize + r * spacing}
						r={dotSize}
						fill={color}
					/>,
				);
			}
		}

		return (
			<svg
				ref={ref}
				width={w}
				height={h}
				viewBox={`0 0 ${w} ${h}`}
				style={{ display: "block", ...style }}
				className={className}
			>
				{dots}
			</svg>
		);
	},
);

/* ═══════════════════════════════════════════════════════════
   MEASURE LINE — ←── label ──→ dimension annotation
   ═══════════════════════════════════════════════════════════ */
interface MeasureLineProps {
	width?: number;
	label: string;
	direction?: "h" | "v";
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const MeasureLine = forwardRef<SVGSVGElement, MeasureLineProps>(
	(
		{
			width = 120,
			label,
			direction = "h",
			color = "rgba(100, 108, 255, 0.3)",
			style,
			className,
		},
		ref,
	) => {
		const endCap = 4;
		const fontSize = 9;

		if (direction === "v") {
			return (
				<svg
					ref={ref}
					width={20}
					height={width}
					viewBox={`0 0 20 ${width}`}
					style={{ display: "block", ...style }}
					className={className}
				>
					<line x1={10} y1={0} x2={10} y2={width} stroke={color} strokeWidth={1} />
					<line x1={10 - endCap} y1={0} x2={10 + endCap} y2={0} stroke={color} strokeWidth={1} />
					<line x1={10 - endCap} y1={width} x2={10 + endCap} y2={width} stroke={color} strokeWidth={1} />
					<text
						x={10}
						y={width / 2}
						fill={color}
						fontSize={fontSize}
						fontFamily="'JetBrains Mono', monospace"
						textAnchor="middle"
						dominantBaseline="middle"
						transform={`rotate(-90, 10, ${width / 2})`}
					>
						{label}
					</text>
				</svg>
			);
		}

		return (
			<svg
				ref={ref}
				width={width}
				height={16}
				viewBox={`0 0 ${width} 16`}
				style={{ display: "block", ...style }}
				className={className}
			>
				<line x1={0} y1={8} x2={width} y2={8} stroke={color} strokeWidth={1} />
				<line x1={0} y1={8 - endCap} x2={0} y2={8 + endCap} stroke={color} strokeWidth={1} />
				<line x1={width} y1={8 - endCap} x2={width} y2={8 + endCap} stroke={color} strokeWidth={1} />
				<text
					x={width / 2}
					y={8}
					fill={color}
					fontSize={fontSize}
					fontFamily="'JetBrains Mono', monospace"
					textAnchor="middle"
					dominantBaseline="middle"
				>
					<tspan dy="-6">{label}</tspan>
				</text>
			</svg>
		);
	},
);

/* ═══════════════════════════════════════════════════════════
   TECH FRAME — wraps children with 4 registration marks
   ═══════════════════════════════════════════════════════════ */
interface TechFrameProps {
	children: React.ReactNode;
	markSize?: number;
	markColor?: string;
	markOffset?: number;
	style?: CSSProperties;
	className?: string;
}

export const TechFrame = forwardRef<HTMLDivElement, TechFrameProps>(
	({ children, markSize = 14, markColor, markOffset = -4, style, className }, ref) => (
		<div
			ref={ref}
			style={{ position: "relative", ...style }}
			className={className}
		>
			<RegistrationMark
				position="top-left"
				size={markSize}
				color={markColor}
				style={{ top: markOffset, left: markOffset }}
			/>
			<RegistrationMark
				position="top-right"
				size={markSize}
				color={markColor}
				style={{ top: markOffset, right: markOffset }}
			/>
			<RegistrationMark
				position="bottom-left"
				size={markSize}
				color={markColor}
				style={{ bottom: markOffset, left: markOffset }}
			/>
			<RegistrationMark
				position="bottom-right"
				size={markSize}
				color={markColor}
				style={{ bottom: markOffset, right: markOffset }}
			/>
			{children}
		</div>
	),
);

/* ═══════════════════════════════════════════════════════════
   DIAGONAL HATCH — ////// pattern fill
   ═══════════════════════════════════════════════════════════ */
interface DiagonalHatchProps {
	width?: number;
	height?: number;
	spacing?: number;
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const DiagonalHatch = forwardRef<SVGSVGElement, DiagonalHatchProps>(
	(
		{
			width = 60,
			height = 60,
			spacing = 6,
			color = "rgba(100, 108, 255, 0.12)",
			style,
			className,
		},
		ref,
	) => {
		const id = `hatch-${Math.random().toString(36).slice(2, 8)}`;
		return (
			<svg
				ref={ref}
				width={width}
				height={height}
				viewBox={`0 0 ${width} ${height}`}
				style={{ display: "block", ...style }}
				className={className}
			>
				<defs>
					<pattern
						id={id}
						width={spacing}
						height={spacing}
						patternUnits="userSpaceOnUse"
						patternTransform="rotate(45)"
					>
						<line
							x1={0}
							y1={0}
							x2={0}
							y2={spacing}
							stroke={color}
							strokeWidth={1}
						/>
					</pattern>
				</defs>
				<rect width={width} height={height} fill={`url(#${id})`} />
			</svg>
		);
	},
);

/* ═══════════════════════════════════════════════════════════
   FLOW LOGO — geometric construction-style mark
   ═══════════════════════════════════════════════════════════ */
interface FlowLogoProps {
	size?: number;
	showLabel?: boolean;
	showVersion?: boolean;
	color?: string;
	style?: CSSProperties;
	className?: string;
}

export const FlowLogo = forwardRef<HTMLDivElement, FlowLogoProps>(
	(
		{
			size = 40,
			showLabel = true,
			showVersion = false,
			color = "#646cff",
			style,
			className,
		},
		ref,
	) => {
		const triSize = size * 0.3;
		return (
			<div
				ref={ref}
				style={{
					display: "inline-flex",
					alignItems: "center",
					gap: size * 0.35,
					...style,
				}}
				className={className}
			>
				<div style={{ position: "relative", display: "flex", alignItems: "center" }}>
					{/* Square frame */}
					<svg
						width={size}
						height={size}
						viewBox={`0 0 ${size} ${size}`}
						style={{ display: "block" }}
					>
						<rect
							x={0.5}
							y={0.5}
							width={size - 1}
							height={size - 1}
							fill="none"
							stroke={color}
							strokeWidth={1}
							opacity={0.6}
						/>
						{/* Play triangle */}
						<polygon
							points={`${size * 0.35},${size * 0.25} ${size * 0.75},${size * 0.5} ${size * 0.35},${size * 0.75}`}
							fill={color}
						/>
						{/* Grid dot bottom-center */}
						<circle
							cx={size * 0.5}
							cy={size + 6}
							r={2}
							fill={color}
							opacity={0.5}
						/>
					</svg>
					{/* Horizontal rule extending right */}
					<div
						style={{
							width: size * 0.4,
							height: 1,
							background: color,
							opacity: 0.4,
							marginLeft: 0,
						}}
					/>
				</div>
				{showLabel && (
					<div style={{ display: "flex", flexDirection: "column" }}>
						<span
							style={{
								fontFamily: "'Space Grotesk', sans-serif",
								fontWeight: 700,
								fontSize: size * 0.55,
								color: "#fff",
								letterSpacing: "-0.04em",
								lineHeight: 1,
							}}
						>
							flow
						</span>
						{showVersion && (
							<span
								style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: size * 0.22,
									color: "rgba(100, 108, 255, 0.5)",
									letterSpacing: "0.05em",
									marginTop: 2,
								}}
							>
								v0.1.0
							</span>
						)}
					</div>
				)}
			</div>
		);
	},
);

/* ═══════════════════════════════════════════════════════════
   GLOW LINE — Traveling light pulse along SVG line
   Inspired by SVG Glow line animation (codepen.io/wouterXD)
   ═══════════════════════════════════════════════════════════ */
interface GlowLineProps {
	/** Auto-play looping duration (ignored when scrollDriven=true) */
	duration?: number;
	color?: string;
	dashSize?: number;
	/** When true, pulse position is driven by scroll position */
	scrollDriven?: boolean;
	style?: CSSProperties;
	className?: string;
}

export function GlowLine({
	duration = 3000,
	color = "#646cff",
	dashSize = 40,
	scrollDriven = false,
	style,
	className,
}: GlowLineProps) {
	const glowRef = useRef<SVGLineElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const ctrlRef = useRef<Controllable | null>(null);
	const rafRef = useRef<number | null>(null);
	const filterId = useRef(`glow-${Math.random().toString(36).slice(2, 8)}`).current;
	const totalLen = 1000;

	useEffect(() => {
		const glow = glowRef.current;
		const svg = svgRef.current;
		if (!glow) return;

		if (scrollDriven && svg) {
			// Scroll-driven mode: map element viewport progress to strokeDashoffset
			function updateScrollPosition() {
				const rect = svg!.getBoundingClientRect();
				const vh = window.innerHeight;
				const totalTravel = vh + rect.height;
				const currentPos = vh - rect.top;
				const progress = Math.max(0, Math.min(1, currentPos / totalTravel));
				const offset = totalLen - progress * (totalLen + dashSize);
				glow!.setAttribute("stroke-dashoffset", String(offset));
			}

			function onScroll() {
				if (rafRef.current != null) return;
				rafRef.current = requestAnimationFrame(() => {
					rafRef.current = null;
					updateScrollPosition();
				});
			}

			window.addEventListener("scroll", onScroll, { passive: true });
			updateScrollPosition();

			return () => {
				window.removeEventListener("scroll", onScroll);
				if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
			};
		}

		// Default: auto-play looping mode
		const ctrl = repeat(
			() =>
				animate(
					glow,
					[
						{ strokeDashoffset: totalLen },
						{ strokeDashoffset: -dashSize },
					],
					{ duration, easing: "linear" },
				),
			Infinity,
		);
		ctrlRef.current = ctrl;
		ctrl.play();

		return () => {
			ctrl.cancel();
		};
	}, [duration, dashSize, scrollDriven]);

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${totalLen} 6`}
			preserveAspectRatio="none"
			width="100%"
			height="6"
			style={{ display: "block", ...style }}
			className={className}
		>
			<defs>
				<filter id={filterId} x="-20%" y="-200%" width="140%" height="500%">
					<feGaussianBlur stdDeviation="3" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>
			{/* Base line — subtle static */}
			<line
				x1={0}
				y1={3}
				x2={totalLen}
				y2={3}
				stroke={color}
				strokeWidth={1}
				opacity={0.08}
			/>
			{/* Glow line — animated traveling pulse */}
			<line
				ref={glowRef}
				x1={0}
				y1={3}
				x2={totalLen}
				y2={3}
				stroke={color}
				strokeWidth={2}
				opacity={0.6}
				strokeDasharray={`${dashSize} ${totalLen}`}
				strokeDashoffset={totalLen}
				strokeLinecap="round"
				filter={`url(#${filterId})`}
			/>
		</svg>
	);
}

/* ═══════════════════════════════════════════════════════════
   SIDE RAIL — Techy edge decorations in page margins
   Vertical lines, labeled rectangles, squares, monospace text
   ═══════════════════════════════════════════════════════════ */
interface SideRailProps {
	side: "left" | "right";
	/** Labels to show — allows variation between placements */
	labels?: [string, string];
	style?: CSSProperties;
}

function SideRail({
	side,
	labels,
	style,
}: SideRailProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const elementsRef = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	const isLeft = side === "left";
	const [labelA, labelB] = labels ?? (isLeft ? ["SYS.04", "GRID"] : ["REF", "ALIGN"]);

	useEffect(() => {
		const container = containerRef.current;
		const elements = elementsRef.current.filter(Boolean) as HTMLElement[];
		if (!container || elements.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					observer.disconnect();
					ctrlRef.current?.cancel();

					const ctrl = stagger(
						elements.map(
							(el) => () =>
								animate(
									el,
									[
										{ opacity: 0, transform: "translateY(8px)" },
										{ opacity: 1, transform: "translateY(0)" },
									],
									{ duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
								),
						),
						{ each: 80 },
					);
					ctrlRef.current = ctrl;
					ctrl.play();
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(container);

		return () => {
			observer.disconnect();
			ctrlRef.current?.cancel();
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="side-rail"
			style={{
				position: "absolute",
				top: 12,
				bottom: 12,
				[isLeft ? "left" : "right"]: 0,
				width: "calc((100vw - 1200px) / 2 - 24px)",
				minWidth: 40,
				display: "flex",
				flexDirection: "column",
				alignItems: isLeft ? "flex-end" : "flex-start",
				gap: 12,
				pointerEvents: "none",
				paddingTop: 8,
				...style,
			}}
		>
			{/* Vertical dashed line */}
			<div
				ref={(el) => { elementsRef.current[0] = el; }}
				style={{
					width: 1,
					height: 60,
					borderLeft: "1px dashed rgba(100, 108, 255, 0.12)",
					opacity: 0,
				}}
			/>

			{/* Small labeled rectangle (outline) */}
			<div
				ref={(el) => { elementsRef.current[1] = el; }}
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					opacity: 0,
				}}
			>
				<div style={{
					width: 14,
					height: 14,
					border: "1px solid rgba(100, 108, 255, 0.2)",
				}} />
				<span style={{
					fontFamily: "'JetBrains Mono', monospace",
					fontSize: "0.5rem",
					color: "rgba(100, 108, 255, 0.25)",
					letterSpacing: "0.1em",
					textTransform: "uppercase",
				}}>
					{labelA}
				</span>
			</div>

			{/* CrossMark */}
			<div ref={(el) => { elementsRef.current[2] = el; }} style={{ opacity: 0 }}>
				<CrossMark size={6} />
			</div>

			{/* Nested squares — outline + filled */}
			<div
				ref={(el) => { elementsRef.current[3] = el; }}
				style={{
					position: "relative",
					width: 18,
					height: 18,
					opacity: 0,
				}}
			>
				<div style={{
					width: 18,
					height: 18,
					border: "1px solid rgba(100, 108, 255, 0.15)",
				}} />
				<div style={{
					position: "absolute",
					bottom: -3,
					[isLeft ? "right" : "left"]: -3,
					width: 7,
					height: 7,
					background: "rgba(100, 108, 255, 0.12)",
				}} />
			</div>

			{/* Thin vertical line */}
			<div
				ref={(el) => { elementsRef.current[4] = el; }}
				style={{
					width: 1,
					height: 30,
					background: "rgba(100, 108, 255, 0.08)",
					opacity: 0,
				}}
			/>

			{/* Vertical monospace label */}
			<div
				ref={(el) => { elementsRef.current[5] = el; }}
				style={{
					fontFamily: "'JetBrains Mono', monospace",
					fontSize: "0.45rem",
					color: "rgba(100, 108, 255, 0.18)",
					letterSpacing: "0.15em",
					writingMode: "vertical-lr",
					opacity: 0,
				}}
			>
				{labelB}
			</div>

			{/* Final crossmark */}
			<div ref={(el) => { elementsRef.current[6] = el; }} style={{ opacity: 0 }}>
				<CrossMark size={5} />
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════
   TYPO DIVIDER — Oversized cropped text between sections
   Swiss poster style: giant outline text + metadata + geometry
   ═══════════════════════════════════════════════════════════ */
interface TypoDividerProps {
	text: string;
	subtitle?: string;
	metadata?: string;
	align?: "left" | "right";
	cropBottom?: boolean;
	style?: CSSProperties;
}

export function TypoDivider({
	text,
	subtitle,
	metadata,
	align = "left",
	cropBottom = true,
	style,
}: TypoDividerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const lettersRef = useRef<(SVGTextElement | null)[]>([]);
	const lineRef = useRef<HTMLDivElement>(null);
	const metaRef = useRef<HTMLDivElement>(null);
	const ctrlRef = useRef<Controllable | null>(null);
	const pulseNodesRef = useRef<SVGTextElement[]>([]);

	// Position letters after font loads, start pulse, animate line/meta on scroll
	useEffect(() => {
		const container = containerRef.current;
		const svg = svgRef.current;
		if (!container || !svg) return;
		let observer: IntersectionObserver | null = null;

		document.fonts.ready.then(() => {
			const letters = lettersRef.current.filter(Boolean) as SVGTextElement[];
			if (letters.length === 0) return;

			// Measure with temporary full-word text element
			const ns = "http://www.w3.org/2000/svg";
			const measureEl = document.createElementNS(ns, "text");
			measureEl.style.fontFamily = "'Space Grotesk', sans-serif";
			measureEl.style.fontSize = "60px";
			measureEl.style.fontWeight = "600";
			measureEl.style.letterSpacing = "0.35em";
			measureEl.style.visibility = "hidden";
			measureEl.textContent = text;
			svg.appendChild(measureEl);

			for (let i = 0; i < letters.length; i++) {
				try {
					const pos = measureEl.getStartPositionOfChar(i);
					letters[i].setAttribute("x", String(pos.x));
					letters[i].setAttribute("y", String(pos.y));
				} catch {
					let x = 0;
					for (let j = 0; j < i; j++) {
						x += letters[j].getComputedTextLength() + (0.35 * 60);
					}
					letters[i].setAttribute("x", String(x));
				}
			}

			const bbox = measureEl.getBBox();
			const pad = 20;
			svg.setAttribute("viewBox",
				`${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
			);
			svg.removeChild(measureEl);

			// Create traveling pulse clones — feathered via gaussian blur filter
			const filterId = svg.querySelector("filter")?.id || "";
			letters.forEach((letter, i) => {
				const pulse = letter.cloneNode(true) as SVGTextElement;
				pulse.setAttribute("stroke", "rgba(100, 108, 255, 0.7)");
				pulse.setAttribute("stroke-width", "1.5");
				pulse.setAttribute("opacity", "0.18");
				if (filterId) pulse.setAttribute("filter", `url(#${filterId})`);
				pulse.style.strokeDasharray = "50 4950";
				pulse.style.strokeDashoffset = "0";
				pulse.style.animation = "strokeTravelPulse 24s ease-in-out infinite";
				pulse.style.animationDelay = `${i * -2.2}s`;
				svg.appendChild(pulse);
				pulseNodesRef.current.push(pulse);
			});

			// Animate only line + metadata on scroll
			const line = lineRef.current;
			const meta = metaRef.current;
			if (line || meta) {
				observer = new IntersectionObserver(
					(entries) => {
						if (entries[0].isIntersecting) {
							observer?.disconnect();
							ctrlRef.current?.cancel();
							const ctrl = parallel(
								...(line
									? [
											() =>
												animate(
													line,
													[
														{ transform: "scaleX(0)", opacity: 0 },
														{ transform: "scaleX(1)", opacity: 1 },
													],
													{ duration: 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
												),
										]
									: []),
								...(meta
									? [
											() =>
												animate(
													meta,
													[
														{ opacity: 0, transform: "translateY(8px)" },
														{ opacity: 1, transform: "translateY(0)" },
													],
													{ duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
												),
										]
									: []),
							);
							ctrlRef.current = ctrl;
							ctrl.play();
						}
					},
					{ threshold: 0.2 },
				);
				observer.observe(container);
			}
		});

		return () => {
			observer?.disconnect();
			ctrlRef.current?.cancel();
			pulseNodesRef.current.forEach((n) => n.remove());
			pulseNodesRef.current = [];
		};
	}, []);

	const isRight = align === "right";

	return (
		<div
			ref={containerRef}
			className="typo-divider"
			style={{
				position: "relative",
				overflow: "hidden",
				padding: "60px 0",
				...style,
			}}
		>
			{/* Techy side-rail decorations in page margins */}
			<SideRail side="left" labels={["SYS.04", "GRID"]} />
			<SideRail side="right" labels={["REF", "FLOW"]} />

			{/* Decorative outline text — always visible, subtle pulse */}
			<div
				style={{
					padding: "0 24px",
					display: "flex",
					justifyContent: isRight ? "flex-end" : "flex-start",
					overflow: "visible",
				}}
			>
				<svg
					ref={svgRef}
					viewBox="0 0 2000 120"
					preserveAspectRatio={isRight ? "xMaxYMid meet" : "xMinYMid meet"}
					style={{
						width: "100%",
						height: "auto",
						overflow: "visible",
					}}
				>
					<defs>
						<filter id={`pulse-glow-${text}`} x="-20%" y="-20%" width="140%" height="140%">
							<feGaussianBlur stdDeviation="3" />
						</filter>
					</defs>
					{text.split("").map((char, i) => (
						<text
							key={`${char}-${i}`}
							ref={(el) => { lettersRef.current[i] = el; }}
							dominantBaseline="hanging"
							style={{
								fontFamily: "'Space Grotesk', sans-serif",
								fontSize: "60px",
								fontWeight: 600,
								letterSpacing: "0.35em",
							}}
							fill="none"
							stroke="rgba(100, 108, 255, 0.45)"
							strokeWidth="0.8"
							opacity="0.6"
						>
							{char === " " ? "\u00A0" : char}
						</text>
					))}
				</svg>
			</div>

			{/* Glow line — full width */}
			<GlowLine scrollDriven style={{ marginTop: 12 }} />

			{/* Metadata row — inside container for alignment */}
			<div className="container">
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						marginTop: 12,
						flexDirection: isRight ? "row-reverse" : "row",
					}}
				>
					{/* Geometric squares */}
					<div style={{ display: "flex", gap: 4, alignItems: "center" }}>
						<div style={{
							width: 8,
							height: 8,
							border: "1px solid rgba(100, 108, 255, 0.3)",
						}} />
						<div style={{
							width: 4,
							height: 4,
							background: "rgba(100, 108, 255, 0.3)",
						}} />
					</div>

					{/* Extending line */}
					<div
						ref={lineRef}
						style={{
							flex: 1,
							maxWidth: 200,
							height: 1,
							background: "rgba(100, 108, 255, 0.15)",
							transformOrigin: isRight ? "right" : "left",
							opacity: 0,
						}}
					/>

					{/* Metadata */}
					{(subtitle || metadata) && (
						<div ref={metaRef} style={{ opacity: 0, textAlign: isRight ? "right" : "left" }}>
							{subtitle && (
								<div style={{
									fontFamily: "'Space Grotesk', sans-serif",
									fontSize: "0.8rem",
									fontWeight: 600,
									color: "rgba(255, 255, 255, 0.5)",
									letterSpacing: "0.1em",
									textTransform: "uppercase",
								}}>
									{subtitle}
								</div>
							)}
							{metadata && (
								<div style={{
									fontFamily: "'JetBrains Mono', monospace",
									fontSize: "0.65rem",
									color: "rgba(100, 108, 255, 0.35)",
									letterSpacing: "0.05em",
									marginTop: 2,
								}}>
									{metadata}
								</div>
							)}
						</div>
					)}

					<CrossMark size={8} />
				</div>
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════════════
   GEO COMPOSITION — Squares, lines, outline text arrangement
   Swiss technical/constructivist layout element
   ═══════════════════════════════════════════════════════════ */
interface GeoCompositionProps {
	text: string;
	label?: string;
	variant?: "a" | "b";
	style?: CSSProperties;
}

export function GeoComposition({
	text,
	label,
	variant = "a",
	style,
}: GeoCompositionProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const ctrlRef = useRef<Controllable | null>(null);
	const squaresRef = useRef<(HTMLDivElement | null)[]>([]);
	const svgRef = useRef<SVGSVGElement>(null);
	const lettersRef = useRef<(SVGTextElement | null)[]>([]);
	const lineHRef = useRef<HTMLDivElement>(null);
	const lineVRef = useRef<HTMLDivElement>(null);
	const pulseNodesRef = useRef<SVGTextElement[]>([]);

	// Position letters after font loads, start pulse, animate geometry on scroll
	useEffect(() => {
		const container = containerRef.current;
		const svg = svgRef.current;
		if (!container) return;
		let observer: IntersectionObserver | null = null;

		document.fonts.ready.then(() => {
			// Position and measure SVG text
			if (svg) {
				const letters = lettersRef.current.filter(Boolean) as SVGTextElement[];
				if (letters.length > 0) {
					const ns = "http://www.w3.org/2000/svg";
					const measureEl = document.createElementNS(ns, "text");
					measureEl.style.fontFamily = "'Space Grotesk', sans-serif";
					measureEl.style.fontSize = "60px";
					measureEl.style.fontWeight = "600";
					measureEl.style.letterSpacing = "0.35em";
					measureEl.style.visibility = "hidden";
					measureEl.textContent = text;
					svg.appendChild(measureEl);

					for (let i = 0; i < letters.length; i++) {
						try {
							const pos = measureEl.getStartPositionOfChar(i);
							letters[i].setAttribute("x", String(pos.x));
							letters[i].setAttribute("y", String(pos.y));
						} catch {
							let x = 0;
							for (let j = 0; j < i; j++) {
								x += letters[j].getComputedTextLength() + (0.35 * 60);
							}
							letters[i].setAttribute("x", String(x));
						}
					}

					const bbox = measureEl.getBBox();
					const pad = 20;
					svg.setAttribute("viewBox",
						`${bbox.x - pad} ${bbox.y - pad} ${bbox.width + pad * 2} ${bbox.height + pad * 2}`
					);
					svg.removeChild(measureEl);

					// Create traveling pulse clones immediately
					letters.forEach((letter, i) => {
						const pulse = letter.cloneNode(true) as SVGTextElement;
						pulse.setAttribute("stroke", "rgba(100, 108, 255, 0.5)");
						pulse.setAttribute("stroke-width", "1");
						pulse.setAttribute("opacity", "0.12");
						pulse.style.strokeDasharray = "30 4970";
						pulse.style.strokeDashoffset = "0";
						pulse.style.animation = "strokeTravelPulse 24s ease-in-out infinite";
						pulse.style.animationDelay = `${i * -2.2}s`;
						svg.appendChild(pulse);
						pulseNodesRef.current.push(pulse);
					});
				}
			}

			// Animate geometry on scroll
			const squares = squaresRef.current.filter(Boolean) as HTMLDivElement[];
			const lineH = lineHRef.current;
			const lineV = lineVRef.current;

			if (squares.length > 0 || lineH || lineV) {
				observer = new IntersectionObserver(
					(entries) => {
						if (entries[0].isIntersecting) {
							observer?.disconnect();
							ctrlRef.current?.cancel();
							const ctrl = parallel(
								...(squares.length > 0
									? [
											() =>
												stagger(
													squares.map(
														(sq) => () =>
															animate(
																sq,
																[
																	{ opacity: 0, transform: "scale(0)" },
																	{ opacity: 1, transform: "scale(1)" },
																],
																{ duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
															),
													),
													{ each: 80 },
												),
										]
									: []),
								...(lineH
									? [
											() =>
												animate(
													lineH,
													[
														{ transform: "scaleX(0)" },
														{ transform: "scaleX(1)" },
													],
													{ duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
												),
										]
									: []),
								...(lineV
									? [
											() =>
												animate(
													lineV,
													[
														{ transform: "scaleY(0)" },
														{ transform: "scaleY(1)" },
													],
													{ duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
												),
										]
									: []),
							);
							ctrlRef.current = ctrl;
							ctrl.play();
						}
					},
					{ threshold: 0.3 },
				);
				observer.observe(container);
			}
		});

		return () => {
			observer?.disconnect();
			ctrlRef.current?.cancel();
			pulseNodesRef.current.forEach((n) => n.remove());
			pulseNodesRef.current = [];
		};
	}, []);

	if (variant === "b") {
		return (
			<div
				ref={containerRef}
				className="geo-composition"
				style={{
					padding: "48px 0",
					position: "relative",
					overflow: "hidden",
					...style,
				}}
			>
				{/* Techy side-rail decorations in page margins */}
				<SideRail side="left" labels={["MOD.02", "SYNC"]} />
				<SideRail side="right" labels={["SEQ", "RACE"]} />

				{/* Decorative outline text — always visible, subtle pulse */}
				<div
					style={{
						padding: "0 24px",
						display: "flex",
						justifyContent: "flex-end",
						overflow: "visible",
					}}
				>
					<svg
						ref={svgRef}
						viewBox="0 0 2000 120"
						preserveAspectRatio="xMaxYMid meet"
						style={{
							width: "100%",
							height: "auto",
							overflow: "visible",
						}}
					>
						<defs>
							<filter id={`pulse-glow-${text}`} x="-20%" y="-20%" width="140%" height="140%">
								<feGaussianBlur stdDeviation="3" />
							</filter>
						</defs>
						{text.split("").map((char, i) => (
							<text
								key={`${char}-${i}`}
								ref={(el) => { lettersRef.current[i] = el; }}
								dominantBaseline="hanging"
								style={{
									fontFamily: "'Space Grotesk', sans-serif",
									fontSize: "60px",
									fontWeight: 600,
									letterSpacing: "0.35em",
								}}
								fill="none"
								stroke="rgba(100, 108, 255, 0.45)"
								strokeWidth="0.8"
								opacity="0.6"
							>
								{char === " " ? "\u00A0" : char}
							</text>
						))}
					</svg>
				</div>

				{/* Glow line — full width */}
				<GlowLine scrollDriven style={{ marginTop: 8 }} />

				{/* Geometric elements + label — inside container */}
				<div className="container">
					<div style={{
						display: "flex",
						alignItems: "flex-end",
						gap: 24,
						justifyContent: "flex-end",
						marginTop: 12,
					}}>
						{/* Vertical line */}
						<div
							ref={lineVRef}
							style={{
								width: 1,
								height: 80,
								background: "rgba(100, 108, 255, 0.15)",
								transformOrigin: "bottom",
							}}
						/>

						{/* Stacked squares */}
						<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
							{[24, 16, 10].map((size, i) => (
								<div
									key={size}
									ref={(el) => { squaresRef.current[i] = el; }}
									style={{
										width: size,
										height: size,
										border: `1px solid rgba(100, 108, 255, ${0.25 - i * 0.05})`,
										opacity: 0,
										alignSelf: "flex-end",
									}}
								/>
							))}
						</div>

						{/* Horizontal line */}
						<div
							ref={lineHRef}
							style={{
								width: 60,
								height: 1,
								background: "rgba(100, 108, 255, 0.15)",
								transformOrigin: "left",
								marginBottom: 12,
							}}
						/>

						<CrossMark size={8} />
					</div>

					{label && (
						<div style={{
							textAlign: "right",
							fontFamily: "'JetBrains Mono', monospace",
							fontSize: "0.6rem",
							color: "rgba(100, 108, 255, 0.3)",
							letterSpacing: "0.1em",
							marginTop: 8,
							textTransform: "uppercase",
						}}>
							{label}
						</div>
					)}
				</div>
			</div>
		);
	}

	// Variant A: left-aligned with horizontal emphasis
	return (
		<div
			ref={containerRef}
			className="geo-composition"
			style={{
				padding: "48px 0",
				position: "relative",
				overflow: "hidden",
				...style,
			}}
		>
			{/* Techy side-rail decorations in page margins */}
			<SideRail side="left" labels={["MOD.02", "SYNC"]} />
			<SideRail side="right" labels={["SEQ", "RACE"]} />

			{/* Giant outline text — SVG stroke-draw animation */}
			<div
				style={{
					padding: "0 24px",
					overflow: "visible",
				}}
			>
				<svg
					ref={svgRef}
					viewBox="0 0 2000 120"
					preserveAspectRatio="xMinYMid meet"
					style={{
						width: "100%",
						height: "auto",
						overflow: "visible",
					}}
				>
					<defs>
						<filter id={`geo-text-glow-${text}`} x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="2" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>
					{text.split("").map((char, i) => (
						<text
							key={`${char}-${i}`}
							ref={(el) => { lettersRef.current[i] = el; }}
							dominantBaseline="hanging"
							style={{
								fontFamily: "'Space Grotesk', sans-serif",
								fontSize: "60px",
								fontWeight: 600,
								letterSpacing: "0.35em",
							}}
							fill="none"
							stroke="rgba(100, 108, 255, 0.45)"
							strokeWidth="0.8"
							opacity="0.6"
						>
							{char === " " ? "\u00A0" : char}
						</text>
					))}
				</svg>
			</div>

			{/* Glow line — full width */}
			<GlowLine scrollDriven style={{ marginTop: 8 }} />

			{/* Geometric elements + label — inside container */}
			<div className="container">
				<div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12 }}>
					{/* Geometric squares row */}
					<div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
						{[28, 18, 10].map((size, i) => (
							<div
								key={size}
								ref={(el) => { squaresRef.current[i] = el; }}
								style={{
									width: size,
									height: size,
									border: `1px solid rgba(100, 108, 255, ${0.3 - i * 0.06})`,
									opacity: 0,
								}}
							/>
						))}
					</div>

					{/* Horizontal line */}
					<div
						ref={lineHRef}
						style={{
							width: 80,
							height: 1,
							background: "rgba(100, 108, 255, 0.15)",
							transformOrigin: "left",
						}}
					/>

					<CrossMark size={8} />
				</div>

				{label && (
					<div style={{
						fontFamily: "'JetBrains Mono', monospace",
						fontSize: "0.6rem",
						color: "rgba(100, 108, 255, 0.3)",
						letterSpacing: "0.1em",
						marginTop: 8,
						marginLeft: 76,
						textTransform: "uppercase",
					}}>
						{label}
					</div>
				)}
			</div>
		</div>
	);
}
