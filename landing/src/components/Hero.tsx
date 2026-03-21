import { useRef, useEffect, useCallback, useState } from "react";
import {
	animate,
	sequence,
	parallel,
	stagger,
	delay,
	repeat,
} from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../context/EasingContext";
import { FlowLogo, CrossMark, RegistrationMark } from "./TechGraphics";

export function Hero() {
	const { easingRef } = useGlobalEasing();
	const logoRef = useRef<HTMLDivElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const taglineRef = useRef<HTMLParagraphElement>(null);
	const badgeRef = useRef<HTMLDivElement>(null);
	const installRef = useRef<HTMLDivElement>(null);
	const ctasRef = useRef<HTMLDivElement>(null);
	const visualRef = useRef<HTMLDivElement>(null);
	const [copied, setCopied] = useState(false);
	const ctrlRef = useRef<Controllable | null>(null);

	const runEntrance = useCallback(() => {
		const els = {
			logo: logoRef.current,
			title: titleRef.current,
			tagline: taglineRef.current,
			badge: badgeRef.current,
			install: installRef.current,
			ctas: ctasRef.current,
			visual: visualRef.current,
		};
		if (Object.values(els).some((el) => !el)) return;

		ctrlRef.current?.cancel();

		const ctrl = sequence(
			() =>
				parallel(
					() =>
						animate(
							els.logo!,
							[
								{ opacity: 0, transform: "translateY(-20px)" },
								{ opacity: 1, transform: "translateY(0)" },
							],
							{ duration: 500, easing: easingRef.current },
						),
					() =>
						animate(
							els.badge!,
							[
								{ opacity: 0, transform: "scale(0.8)" },
								{ opacity: 1, transform: "scale(1)" },
							],
							{ duration: 400, easing: easingRef.current },
						),
				),
			() =>
				animate(
					els.title!,
					[
						{ opacity: 0, transform: "translateY(20px)" },
						{ opacity: 1, transform: "translateY(0)" },
					],
					{ duration: 500, easing: easingRef.current },
				),
			() =>
				animate(
					els.tagline!,
					[
						{ opacity: 0, transform: "translateY(15px)" },
						{ opacity: 1, transform: "translateY(0)" },
					],
					{ duration: 400, easing: easingRef.current },
				),
			() =>
				parallel(
					() =>
						animate(
							els.install!,
							[
								{
									opacity: 0,
									transform: "translateY(10px)",
								},
								{ opacity: 1, transform: "translateY(0)" },
							],
							{ duration: 350, easing: easingRef.current },
						),
					() =>
						animate(
							els.ctas!,
							[
								{
									opacity: 0,
									transform: "translateY(10px)",
								},
								{ opacity: 1, transform: "translateY(0)" },
							],
							{ duration: 350, easing: easingRef.current },
						),
				),
			() =>
				animate(
					els.visual!,
					[
						{ opacity: 0, transform: "scale(0.9)" },
						{ opacity: 1, transform: "scale(1)" },
					],
					{ duration: 600, easing: easingRef.current },
				),
		);

		ctrlRef.current = ctrl;
		ctrl.play();
	}, []);

	useEffect(() => {
		runEntrance();
	}, [runEntrance]);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText("npm install @reactzero/flow");
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, []);

	return (
		<section className="hero" id="top">
			<div className="container">
				<div className="hero-content">
					<div
						ref={badgeRef}
						className="hero-badge"
						style={{ opacity: 0 }}
					>
						<span className="hero-badge-dot" />
						v0.1.0 &middot; Under 9KB gzipped
					</div>
					<div style={{ width: 40, height: 1, background: "rgba(100, 108, 255, 0.25)", marginBottom: 20 }} />
					<div
						ref={logoRef}
						className="hero-logo"
						style={{ opacity: 0 }}
					>
						<FlowLogo size={48} showLabel showVersion />
					</div>
					<h1
						ref={titleRef}
						style={{
							opacity: 0,
							fontSize: "clamp(2rem, 5vw, 3.2rem)",
							fontWeight: 700,
							color: "#fff",
							lineHeight: 1.1,
							letterSpacing: "-0.03em",
							marginBottom: 16,
						}}
					>
						Animation orchestration
						<br />
						for React
					</h1>
					<p
						ref={taglineRef}
						className="hero-tagline"
						style={{ opacity: 0 }}
					>
						Zero dependencies. Under 10KB. Sequence, compose, and control
						animations with the Web Animations API &mdash; GPU-accelerated
						rendering, adaptive performance, and full playback control
						out of the box.
					</p>
					<div className="hero-value-props">
						<div className="hero-value-prop">
							<span className="hero-value-prop-dot" />
							Zero React re-renders
						</div>
						<div className="hero-value-prop">
							<span className="hero-value-prop-dot" />
							Deterministic sequencing
						</div>
						<div className="hero-value-prop">
							<span className="hero-value-prop-dot" />
							Adaptive performance
						</div>
						<div className="hero-value-prop">
							<span className="hero-value-prop-dot" />
							True cancellation model
						</div>
					</div>
					<div
						ref={installRef}
						className="hero-install"
						style={{ opacity: 0 }}
					>
						<code>
							<span className="dollar">$</span>npm install
							@reactzero/flow
						</code>
						<button type="button" onClick={handleCopy}>
							{copied ? "Copied!" : "Copy"}
						</button>
					</div>
					<div
						ref={ctasRef}
						className="hero-ctas"
						style={{ opacity: 0 }}
					>
						<a href="#sequence" className="btn-primary">
							Explore Examples
						</a>
						<a
							href="https://github.com/motiondesignlv/ReactZero-Flow"
							target="_blank"
							rel="noopener noreferrer"
							className="btn-secondary"
						>
							GitHub
						</a>
						<a
							href="ai-reference.md"
							download="reactzero-flow-ai-reference.md"
							className="btn-ai-ref"
						>
							AI Reference
						</a>
					</div>
				</div>
				<div
					ref={visualRef}
					className="hero-visual"
					style={{ opacity: 0 }}
				>
					{/* Tech decoration: registration marks at corners */}
					<RegistrationMark position="top-left" size={18} style={{ top: -8, left: -8 }} />
					<RegistrationMark position="top-right" size={18} style={{ top: -8, right: -8 }} />
					<RegistrationMark position="bottom-left" size={18} style={{ bottom: -8, left: -8 }} />
					<RegistrationMark position="bottom-right" size={18} style={{ bottom: -8, right: -8 }} />
					{/* Cross marks as grid anchors */}
					<CrossMark size={10} style={{ position: "absolute", top: -16, left: "50%", marginLeft: -5 }} />
					<CrossMark size={10} style={{ position: "absolute", bottom: -16, right: "20%" }} />
					<CrossMark size={10} style={{ position: "absolute", top: "50%", right: -16 }} />
					<HeroAnimation />
				</div>
			</div>
		</section>
	);
}

function HeroAnimation() {
	const { easingRef } = useGlobalEasing();
	const refs = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	useEffect(() => {
		const r = refs.current;
		// 0-6: Scene 1 (card, title, 5 bars)
		// 7-9: Scene 2 (3 words: Build, Beautiful, Animations)
		// 10-14: Scene 3 (5 stars)
		// 15: rating, 16: review card
		if (r.slice(0, 17).some((el) => !el)) return;

		const s1Card = r[0]!;
		const s1Title = r[1]!;
		const s1Bars = [r[2]!, r[3]!, r[4]!, r[5]!, r[6]!];
		const s2Words = [r[7]!, r[8]!, r[9]!];
		const s3Stars = [r[10]!, r[11]!, r[12]!, r[13]!, r[14]!];
		const s3Rating = r[15]!;
		const s3Review = r[16]!;

		const ctrl = repeat(
			() =>
				sequence(
					// ── Scene 1: Bar Chart (SaaS) ──
					() =>
						animate(
							s1Card,
							[
								{ opacity: 0, transform: "scale(0.95)" },
								{ opacity: 1, transform: "scale(1)" },
							],
							{ duration: 300, easing: easingRef.current },
						),
					() =>
						animate(
							s1Title,
							[
								{ opacity: 0, transform: "translateY(-10px)" },
								{ opacity: 1, transform: "translateY(0)" },
							],
							{ duration: 250, easing: easingRef.current },
						),
					() =>
						stagger(
							s1Bars.map(
								(bar) => () =>
									animate(
										bar,
										[
											{
												opacity: 0,
												transform: "scaleY(0)",
											},
											{
												opacity: 1,
												transform: "scaleY(1)",
											},
										],
										{
											duration: 400,
											easing: easingRef.current,
										},
									),
							),
							{ each: 100 },
						),
					() => delay(1500),
					() =>
						parallel(
							() =>
								animate(
									s1Card,
									[
										{
											opacity: 1,
											transform: "scale(1)",
										},
										{
											opacity: 0,
											transform: "scale(0.9)",
										},
									],
									{
										duration: 400,
										easing: easingRef.current,
									},
								),
							() =>
								animate(
									s1Title,
									[{ opacity: 1 }, { opacity: 0 }],
									{
										duration: 300,
										easing: easingRef.current,
									},
								),
							...s1Bars.map(
								(bar) => () =>
									animate(
										bar,
										[{ opacity: 1 }, { opacity: 0 }],
										{
											duration: 300,
											easing: easingRef.current,
										},
									),
							),
						),
					() => delay(400),

					// ── Scene 2: Bold Typography ──
					() =>
						stagger(
							[
								// "Build" slides up from below
								() =>
									animate(
										s2Words[0],
										[
											{
												opacity: 0,
												transform: "translateY(100%)",
											},
											{
												opacity: 1,
												transform: "translateY(0)",
											},
										],
										{
											duration: 500,
											easing: easingRef.current,
										},
									),
								// "Beautiful" slides in from right
								() =>
									animate(
										s2Words[1],
										[
											{
												opacity: 0,
												transform: "translateX(100%)",
											},
											{
												opacity: 1,
												transform: "translateX(0)",
											},
										],
										{
											duration: 500,
											easing: easingRef.current,
										},
									),
								// "Animations" slides up from below
								() =>
									animate(
										s2Words[2],
										[
											{
												opacity: 0,
												transform: "translateY(100%)",
											},
											{
												opacity: 1,
												transform: "translateY(0)",
											},
										],
										{
											duration: 500,
											easing: easingRef.current,
										},
									),
							],
							{ each: 150 },
						),
					() => delay(1800),
					() =>
						parallel(
							// "Build" exits left
							() =>
								animate(
									s2Words[0],
									[
										{
											opacity: 1,
											transform: "translateX(0)",
										},
										{
											opacity: 0,
											transform: "translateX(-100%)",
										},
									],
									{
										duration: 400,
										easing: easingRef.current,
									},
								),
							// "Beautiful" exits down
							() =>
								animate(
									s2Words[1],
									[
										{
											opacity: 1,
											transform: "translateY(0)",
										},
										{
											opacity: 0,
											transform: "translateY(100%)",
										},
									],
									{
										duration: 400,
										easing: easingRef.current,
									},
								),
							// "Animations" exits right
							() =>
								animate(
									s2Words[2],
									[
										{
											opacity: 1,
											transform: "translateX(0)",
										},
										{
											opacity: 0,
											transform: "translateX(100%)",
										},
									],
									{
										duration: 400,
										easing: easingRef.current,
									},
								),
						),
					() => delay(400),

					// ── Scene 3: Stars + Review (E-commerce) ──
					() =>
						stagger(
							s3Stars.map(
								(star) => () =>
									animate(
										star,
										[
											{
												opacity: 0,
												transform: "scale(0)",
											},
											{
												opacity: 1,
												transform: "scale(1.2)",
											},
											{
												opacity: 1,
												transform: "scale(1)",
											},
										],
										{
											duration: 350,
											easing: easingRef.current,
										},
									),
							),
							{ each: 80 },
						),
					() =>
						animate(
							s3Rating,
							[
								{
									opacity: 0,
									transform: "translateX(-10px)",
								},
								{ opacity: 1, transform: "translateX(0)" },
							],
							{ duration: 300, easing: easingRef.current },
						),
					() =>
						animate(
							s3Review,
							[
								{
									opacity: 0,
									transform: "translateY(15px)",
								},
								{ opacity: 1, transform: "translateY(0)" },
							],
							{ duration: 400, easing: easingRef.current },
						),
					() => delay(1500),
					() =>
						animate(
							s3Review,
							[
								{ opacity: 1, transform: "translateY(0)" },
								{
									opacity: 0,
									transform: "translateY(15px)",
								},
							],
							{ duration: 300, easing: easingRef.current },
						),
					() =>
						parallel(
							() =>
								stagger(
									s3Stars.map(
										(star) => () =>
											animate(
												star,
												[
													{
														opacity: 1,
														transform: "scale(1)",
													},
													{
														opacity: 0,
														transform: "scale(0)",
													},
												],
												{
													duration: 300,
													easing: easingRef.current,
												},
											),
									),
									{ each: 60, from: "center" },
								),
							() =>
								animate(
									s3Rating,
									[{ opacity: 1 }, { opacity: 0 }],
									{
										duration: 250,
										easing: easingRef.current,
									},
								),
						),
					() => delay(400),
				),
			Infinity,
		);

		ctrlRef.current = ctrl;
		ctrl.play();

		return () => {
			ctrl.cancel();
		};
	}, []);

	const setRef =
		(i: number) => (node: HTMLDivElement | null) => {
			refs.current[i] = node;
		};

	const barData = [
		{ height: 45, color: "#3b82f6" },
		{ height: 70, color: "#6366f1" },
		{ height: 55, color: "#8b5cf6" },
		{ height: 85, color: "#06b6d4" },
		{ height: 65, color: "#14b8a6" },
	];
	const starClip =
		"polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";

	return (
		<div
			style={{
				position: "relative",
				width: "100%",
				height: "100%",
				minHeight: 400,
			}}
		>
			{/* ── Scene 1: Bar Chart ── */}
			<div
				ref={setRef(0)}
				style={{
					position: "absolute",
					inset: 0,
					background: "#16162a",
					border: "1px solid #2a2a3a",
					borderRadius: 12,
					padding: "24px 28px",
					opacity: 0,
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					ref={setRef(1)}
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "clamp(16px, 4%, 32px)",
						opacity: 0,
					}}
				>
					<span
						style={{
							color: "#fff",
							fontSize: "clamp(0.85rem, 1.5vw, 1.1rem)",
							fontWeight: 600,
						}}
					>
						Revenue
					</span>
					<span
						style={{
							color: "#8b5cf6",
							fontSize: "clamp(0.75rem, 1.2vw, 0.95rem)",
							fontWeight: 500,
						}}
					>
						$12.4k
					</span>
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "flex-end",
						gap: "clamp(8px, 3%, 20px)",
						flex: 1,
						borderBottom: "1px solid #2a2a3a",
						paddingBottom: 8,
					}}
				>
					{barData.map((bar, i) => (
						<div
							key={bar.color}
							ref={setRef(2 + i)}
							style={{
								flex: 1,
								height: `${bar.height}%`,
								background: bar.color,
								borderRadius: "4px 4px 0 0",
								opacity: 0,
								transformOrigin: "bottom",
							}}
						/>
					))}
				</div>
				<div
					style={{
						display: "flex",
						gap: "clamp(8px, 3%, 20px)",
						marginTop: 8,
					}}
				>
					{["Jan", "Feb", "Mar", "Apr", "May"].map(
						(m) => (
							<span
								key={m}
								style={{
									flex: 1,
									textAlign: "center",
									fontSize:
										"clamp(0.55rem, 1vw, 0.75rem)",
									color: "#6b7280",
								}}
							>
								{m}
							</span>
						),
					)}
				</div>
			</div>

			{/* ── Scene 2: Bold Typography ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					overflow: "hidden",
				}}
			>
				<div
					ref={setRef(7)}
					style={{
						fontSize: "clamp(3.5rem, 7vw, 6rem)",
						fontWeight: 800,
						color: "#ec4899",
						lineHeight: 0.85,
						letterSpacing: "-0.03em",
						opacity: 0,
					}}
				>
					Build
				</div>
				<div
					ref={setRef(8)}
					style={{
						fontSize: "clamp(3.5rem, 7vw, 6rem)",
						fontWeight: 800,
						lineHeight: 0.85,
						letterSpacing: "-0.03em",
						opacity: 0,
						background:
							"linear-gradient(135deg, #8b5cf6, #646cff)",
						WebkitBackgroundClip: "text",
						backgroundClip: "text",
						WebkitTextFillColor: "transparent",
					}}
				>
					Beautiful
				</div>
				<div
					ref={setRef(9)}
					style={{
						fontSize: "clamp(3.5rem, 7vw, 6rem)",
						fontWeight: 800,
						color: "#06b6d4",
						lineHeight: 0.85,
						letterSpacing: "-0.03em",
						opacity: 0,
					}}
				>
					Animations
				</div>
			</div>

			{/* ── Scene 3: Stars + Review ── */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: "clamp(12px, 3%, 24px)",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "clamp(6px, 1.5vw, 12px)",
					}}
				>
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={`star-${i}`}
							ref={setRef(10 + i)}
							style={{
								width: "clamp(28px, 5vw, 44px)",
								height: "clamp(28px, 5vw, 44px)",
								background: "#f59e0b",
								clipPath: starClip,
								opacity: 0,
							}}
						/>
					))}
					<div
						ref={setRef(15)}
						style={{
							color: "#fff",
							fontSize: "clamp(1.4rem, 3vw, 2rem)",
							fontWeight: 700,
							marginLeft: "clamp(4px, 1vw, 12px)",
							opacity: 0,
						}}
					>
						4.8
					</div>
				</div>
				<div
					ref={setRef(16)}
					style={{
						background: "#1a1d27",
						border: "1px solid #2a2a3a",
						borderRadius: 8,
						padding: "clamp(12px, 2%, 20px) clamp(14px, 3%, 24px)",
						display: "flex",
						alignItems: "center",
						gap: "clamp(8px, 2%, 16px)",
						opacity: 0,
						width: "clamp(220px, 60%, 340px)",
					}}
				>
					<div
						style={{
							width: "clamp(28px, 4vw, 36px)",
							height: "clamp(28px, 4vw, 36px)",
							borderRadius: "50%",
							background: "#8b5cf6",
							flexShrink: 0,
						}}
					/>
					<div>
						<div
							style={{
								color: "#fff",
								fontSize:
									"clamp(0.8rem, 1.2vw, 1rem)",
								fontWeight: 600,
							}}
						>
							Sarah M.
						</div>
						<div
							style={{
								color: "#9898a6",
								fontSize:
									"clamp(0.75rem, 1vw, 0.9rem)",
							}}
						>
							Amazing experience!
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
