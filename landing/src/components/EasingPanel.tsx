import { useCallback, useEffect, useRef, useState } from "react";
import { easing as presets } from "@flow/index";
import { useGlobalEasing, DEFAULT_EASING } from "../context/EasingContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const KEYWORD_BEZIER: Record<string, [number, number, number, number]> = {
	linear: [0, 0, 1, 1],
	ease: [0.25, 0.1, 0.25, 1],
	"ease-in": [0.42, 0, 1, 1],
	"ease-out": [0, 0, 0.58, 1],
	"ease-in-out": [0.42, 0, 0.58, 1],
};

function parseCubicBezier(css: string): [number, number, number, number] | null {
	if (KEYWORD_BEZIER[css]) return KEYWORD_BEZIER[css];
	const m = css.match(
		/cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/,
	);
	if (!m) return null;
	return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])];
}

/** Build preset label from camelCase key */
function labelFromKey(key: string): string {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Curve SVG
// ---------------------------------------------------------------------------

function CurveSVG({
	x1, y1, x2, y2,
	onHandleDrag,
}: {
	x1: number; y1: number; x2: number; y2: number;
	onHandleDrag?: (handleIndex: 0 | 1, nx: number, ny: number) => void;
}) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [dragging, setDragging] = useState<0 | 1 | null>(null);
	const [hovered, setHovered] = useState<0 | 1 | null>(null);
	const rafRef = useRef(0);

	const w = 180;
	const h = 140;
	const pad = 20;
	const pw = w - pad * 2;
	const ph = h - pad * 2;

	const toX = (v: number) => pad + v * pw;
	const toY = (v: number) => pad + (1 - v) * ph;

	const toNormalized = useCallback((clientX: number, clientY: number): [number, number] => {
		const svg = svgRef.current;
		if (!svg) return [0, 0];
		const rect = svg.getBoundingClientRect();
		const scaleX = w / rect.width;
		const scaleY = h / rect.height;
		const svgX = (clientX - rect.left) * scaleX;
		const svgY = (clientY - rect.top) * scaleY;
		const nx = (svgX - pad) / pw;
		const ny = 1 - (svgY - pad) / ph;
		return [nx, ny];
	}, []);

	// Window pointer listeners for drag
	useEffect(() => {
		if (dragging === null) return;

		const onMove = (e: PointerEvent) => {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const [nx, ny] = toNormalized(e.clientX, e.clientY);
				const rx = Math.round(Math.max(0, Math.min(1, nx)) * 100) / 100;
				const ry = Math.round(Math.max(-2, Math.min(3, ny)) * 100) / 100;
				onHandleDrag?.(dragging, rx, ry);
			});
		};

		const onUp = () => setDragging(null);

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		return () => {
			cancelAnimationFrame(rafRef.current);
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
		};
	}, [dragging, toNormalized, onHandleDrag]);

	const handles: Array<{ idx: 0 | 1; cx: number; cy: number }> = [
		{ idx: 0, cx: toX(x1), cy: toY(y1) },
		{ idx: 1, cx: toX(x2), cy: toY(y2) },
	];

	return (
		<svg
			ref={svgRef}
			viewBox={`0 0 ${w} ${h}`}
			width={w}
			height={h}
			style={{
				display: "block",
				cursor: dragging !== null ? "grabbing" : undefined,
				touchAction: "none",
			}}
		>
			{/* grid */}
			<line x1={pad} y1={toY(0)} x2={toX(1)} y2={toY(0)} stroke="#1e1e2e" strokeWidth="1" />
			<line x1={pad} y1={toY(1)} x2={toX(1)} y2={toY(1)} stroke="#1e1e2e" strokeWidth="1" />
			<line x1={pad} y1={toY(0)} x2={pad} y2={toY(1)} stroke="#1e1e2e" strokeWidth="1" />
			<line x1={toX(1)} y1={toY(0)} x2={toX(1)} y2={toY(1)} stroke="#1e1e2e" strokeWidth="1" />
			{/* linear ref */}
			<line
				x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)}
				stroke="#2a2a3a" strokeWidth="1" strokeDasharray="4 4"
			/>
			{/* control lines */}
			<line x1={toX(0)} y1={toY(0)} x2={toX(x1)} y2={toY(y1)} stroke="#646cff" strokeWidth="1" opacity={dragging === 0 || hovered === 0 ? 0.7 : 0.4} />
			<line x1={toX(1)} y1={toY(1)} x2={toX(x2)} y2={toY(y2)} stroke="#646cff" strokeWidth="1" opacity={dragging === 1 || hovered === 1 ? 0.7 : 0.4} />
			{/* curve */}
			<path
				d={`M ${toX(0)},${toY(0)} C ${toX(x1)},${toY(y1)} ${toX(x2)},${toY(y2)} ${toX(1)},${toY(1)}`}
				fill="none" stroke="#646cff" strokeWidth="2.5"
			/>
			{/* interactive handles */}
			{handles.map(({ idx, cx, cy }) => {
				const isActive = dragging === idx;
				const isHovered = hovered === idx;
				return (
					<g key={idx}>
						{/* invisible hit area */}
						<circle
							cx={cx}
							cy={cy}
							r={16}
							fill="transparent"
							style={{ cursor: isActive ? "grabbing" : "grab" }}
							onPointerDown={(e) => {
								e.preventDefault();
								setDragging(idx);
							}}
							onPointerEnter={() => setHovered(idx)}
							onPointerLeave={() => { if (dragging === null) setHovered(null); }}
						/>
						{/* glow ring on hover/active */}
						{(isActive || isHovered) && (
							<circle
								cx={cx}
								cy={cy}
								r={isActive ? 8 : 7}
								fill="none"
								stroke="#646cff"
								strokeWidth="1"
								opacity={isActive ? 0.5 : 0.3}
							/>
						)}
						{/* visible handle */}
						<circle
							cx={cx}
							cy={cy}
							r={isActive ? 5.5 : isHovered ? 5 : 4}
							fill={isActive ? "#8b8fff" : "#646cff"}
						/>
					</g>
				);
			})}
			{/* endpoints */}
			<circle cx={toX(0)} cy={toY(0)} r="3" fill="#9898a6" />
			<circle cx={toX(1)} cy={toY(1)} r="3" fill="#9898a6" />
		</svg>
	);
}

// ---------------------------------------------------------------------------
// Animation Preview
// ---------------------------------------------------------------------------

function AnimPreview({ easingStr }: { easingStr: string }) {
	const dotRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = dotRef.current;
		if (!el) return;
		let anim: Animation;
		try {
			anim = el.animate(
				[{ transform: "translateX(0px)" }, { transform: "translateX(140px)" }],
				{ duration: 1200, easing: easingStr, iterations: Infinity, direction: "alternate" },
			);
		} catch {
			// fallback for invalid easing
			anim = el.animate(
				[{ transform: "translateX(0px)" }, { transform: "translateX(140px)" }],
				{ duration: 1200, easing: "ease", iterations: Infinity, direction: "alternate" },
			);
		}
		return () => anim.cancel();
	}, [easingStr]);

	return (
		<div style={{ position: "relative", height: 24, margin: "8px 0", background: "#1a1d27", borderRadius: 6, overflow: "hidden" }}>
			<div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
				<div style={{ width: "100%", height: 1, background: "#2a2a3a" }} />
			</div>
			<div
				ref={dotRef}
				style={{
					position: "absolute",
					top: "50%",
					left: 8,
					width: 12,
					height: 12,
					marginTop: -6,
					borderRadius: "50%",
					background: "#646cff",
					boxShadow: "0 0 8px rgba(100, 108, 255, 0.5)",
				}}
			/>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function EasingPanel() {
	const { easing: currentEasing, setEasing } = useGlobalEasing();
	const [open, setOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	// Parse current easing into bezier coords
	const coords = parseCubicBezier(currentEasing) ?? [0.93, 0, 0.08, 1];
	const [x1, y1, x2, y2] = coords;

	// Find matching preset key (or "custom")
	const presetKey = Object.entries(presets).find(([, v]) => v === currentEasing)?.[0] ?? "custom";

	const handlePresetChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			const key = e.target.value;
			if (key === "custom") return;
			const value = (presets as Record<string, string>)[key];
			if (value) setEasing(value);
		},
		[setEasing],
	);

	const handleCoordChange = useCallback(
		(idx: number, raw: string) => {
			const val = parseFloat(raw);
			if (Number.isNaN(val)) return;
			const next: [number, number, number, number] = [x1, y1, x2, y2];
			next[idx] = val;
			setEasing(`cubic-bezier(${next[0]}, ${next[1]}, ${next[2]}, ${next[3]})`);
		},
		[x1, y1, x2, y2, setEasing],
	);

	const handleCurveDrag = useCallback(
		(handleIndex: 0 | 1, nx: number, ny: number) => {
			const next: [number, number, number, number] = [x1, y1, x2, y2];
			next[handleIndex * 2] = nx;
			next[handleIndex * 2 + 1] = ny;
			setEasing(`cubic-bezier(${next[0]}, ${next[1]}, ${next[2]}, ${next[3]})`);
		},
		[x1, y1, x2, y2, setEasing],
	);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(currentEasing);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [currentEasing]);

	const handleReset = useCallback(() => {
		setEasing(DEFAULT_EASING);
	}, [setEasing]);

	// Styles
	const panelStyle: React.CSSProperties = {
		position: "fixed",
		bottom: 24,
		right: 24,
		zIndex: 200,
		fontFamily: "'Inter', -apple-system, sans-serif",
	};

	const toggleStyle: React.CSSProperties = {
		width: 44,
		height: 44,
		borderRadius: 12,
		border: "1px solid #1e1e2e",
		background: open ? "#646cff" : "#12121a",
		color: open ? "#fff" : "#646cff",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: 20,
		transition: "all 0.2s",
		marginLeft: "auto",
		boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
	};

	const bodyStyle: React.CSSProperties = {
		width: 300,
		background: "#12121a",
		border: "1px solid #1e1e2e",
		borderRadius: 12,
		padding: 16,
		marginBottom: 8,
		boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
	};

	const labelStyle: React.CSSProperties = {
		fontSize: 10,
		fontWeight: 600,
		letterSpacing: "0.1em",
		textTransform: "uppercase" as const,
		color: "#6b7280",
		marginBottom: 4,
	};

	const inputStyle: React.CSSProperties = {
		width: "100%",
		padding: "6px 8px",
		background: "#1a1d27",
		border: "1px solid #1e1e2e",
		borderRadius: 6,
		color: "#e0e0e6",
		fontSize: 13,
		fontFamily: "'JetBrains Mono', monospace",
		outline: "none",
	};

	const coordLabels = ["x1", "y1", "x2", "y2"];
	const coordSteps = [0.01, 0.01, 0.01, 0.01];
	const coordMins = [0, -2, 0, -2];
	const coordMaxs = [1, 3, 1, 3];

	return (
		<div style={panelStyle}>
			{open && (
				<div style={bodyStyle}>
					{/* Header */}
					<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
						<span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Easing Control</span>
						<button
							type="button"
							onClick={handleReset}
							style={{
								fontSize: 11,
								color: "#6b7280",
								background: "none",
								border: "1px solid #1e1e2e",
								borderRadius: 4,
								padding: "2px 8px",
								cursor: "pointer",
							}}
						>
							Reset
						</button>
					</div>

					{/* Preset dropdown */}
					<div style={{ marginBottom: 12 }}>
						<div style={labelStyle}>Preset</div>
						<select
							value={presetKey}
							onChange={handlePresetChange}
							style={{
								...inputStyle,
								cursor: "pointer",
								appearance: "auto" as React.CSSProperties["appearance"],
							}}
						>
							<option value="custom">Custom</option>
							{Object.keys(presets).map((key) => (
								<option key={key} value={key}>
									{labelFromKey(key)}
								</option>
							))}
						</select>
					</div>

					{/* Curve visualization */}
					<div style={{ marginBottom: 8, background: "#0a0a0f", borderRadius: 8, overflow: "hidden", display: "flex", justifyContent: "center" }}>
						<CurveSVG x1={x1} y1={y1} x2={x2} y2={y2} onHandleDrag={handleCurveDrag} />
					</div>

					{/* Bezier inputs */}
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
						{coordLabels.map((label, i) => (
							<div key={label}>
								<div style={{ ...labelStyle, fontSize: 9 }}>{label}</div>
								<input
									type="number"
									step={coordSteps[i]}
									min={coordMins[i]}
									max={coordMaxs[i]}
									value={coords[i]}
									onChange={(e) => handleCoordChange(i, e.target.value)}
									style={{ ...inputStyle, padding: "4px 6px", fontSize: 12, textAlign: "center" }}
								/>
							</div>
						))}
					</div>

					{/* Preview */}
					<div style={{ marginBottom: 8 }}>
						<div style={labelStyle}>Preview</div>
						<AnimPreview easingStr={currentEasing} />
					</div>

					{/* CSS string */}
					<div>
						<div style={labelStyle}>CSS Value</div>
						<div style={{ display: "flex", gap: 6 }}>
							<code
								style={{
									flex: 1,
									padding: "6px 8px",
									background: "#1a1d27",
									border: "1px solid #1e1e2e",
									borderRadius: 6,
									color: "#a5b4fc",
									fontSize: 11,
									fontFamily: "'JetBrains Mono', monospace",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{currentEasing}
							</code>
							<button
								type="button"
								onClick={handleCopy}
								style={{
									padding: "4px 10px",
									background: copied ? "#10b981" : "#1a1d27",
									border: "1px solid #1e1e2e",
									borderRadius: 6,
									color: copied ? "#fff" : "#9898a6",
									fontSize: 11,
									cursor: "pointer",
									transition: "all 0.2s",
									whiteSpace: "nowrap",
								}}
							>
								{copied ? "Done" : "Copy"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Toggle button */}
			<div style={{ display: "flex", justifyContent: "flex-end" }}>
				<button type="button" onClick={() => setOpen(!open)} style={toggleStyle}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						{open ? (
							<>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</>
						) : (
							<path d="M2 12C2 12 5 4 12 4C19 4 22 12 22 12C22 12 19 20 12 20C5 20 2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
						)}
					</svg>
				</button>
			</div>
		</div>
	);
}
