interface SectionHeaderProps {
	label: string;
	title: string;
	description: string;
	index?: number;
	total?: number;
}

export function SectionHeader({
	label,
	title,
	description,
	index,
	total = 12,
}: SectionHeaderProps) {
	return (
		<div style={{ position: "relative", overflow: "hidden" }}>
			{/* Oversized background number — Swiss extreme scale contrast */}
			{index != null && (
				<div
					aria-hidden="true"
					style={{
						position: "absolute",
						top: -20,
						right: -10,
						fontFamily: "'Space Grotesk', sans-serif",
						fontSize: "clamp(8rem, 18vw, 14rem)",
						fontWeight: 700,
						lineHeight: 0.85,
						color: "transparent",
						WebkitTextStroke: "1px rgba(100, 108, 255, 0.12)",
						letterSpacing: "-0.04em",
						userSelect: "none",
						pointerEvents: "none",
					}}
				>
					{String(index).padStart(2, "0")}
				</div>
			)}

			<div style={{ position: "relative" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
					<div className="section-label" style={{ marginBottom: 0 }}>{label}</div>
					<div style={{
						flex: 1,
						maxWidth: 60,
						height: 1,
						background: "rgba(100, 108, 255, 0.2)",
					}} />
					{index != null && (
						<span
							style={{
								fontFamily: "'JetBrains Mono', monospace",
								fontSize: "0.65rem",
								color: "rgba(100, 108, 255, 0.35)",
								letterSpacing: "0.08em",
							}}
						>
							{String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
						</span>
					)}
				</div>
				<h2 className="section-title">{title}</h2>
				<p className="section-desc">{description}</p>
			</div>
		</div>
	);
}
