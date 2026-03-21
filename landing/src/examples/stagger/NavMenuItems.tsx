import { useRef, useCallback } from "react";
import { animate, stagger } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const menuItems = [
	{
		label: "Dashboard",
		icon: "grid",
		badge: null,
		active: true,
	},
	{
		label: "Projects",
		icon: "folder",
		badge: "3",
		active: false,
	},
	{
		label: "Analytics",
		icon: "chart",
		badge: null,
		active: false,
	},
	{
		label: "Team",
		icon: "users",
		badge: "New",
		active: false,
	},
	{
		label: "Settings",
		icon: "gear",
		badge: null,
		active: false,
	},
	{
		label: "Help",
		icon: "question",
		badge: null,
		active: false,
	},
];

function MenuIcon({ type }: { type: string }) {
	const size = 16;
	const color = "currentColor";

	switch (type) {
		case "grid":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
					<rect x="1" y="1" width="6" height="6" rx="1" />
					<rect x="9" y="1" width="6" height="6" rx="1" />
					<rect x="1" y="9" width="6" height="6" rx="1" />
					<rect x="9" y="9" width="6" height="6" rx="1" />
				</svg>
			);
		case "folder":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
					<path d="M2 4h4l2 2h6v7H2V4z" />
				</svg>
			);
		case "chart":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
					<polyline points="2,12 5,7 8,9 11,4 14,6" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			);
		case "users":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
					<circle cx="6" cy="5" r="2.5" />
					<path d="M1.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" />
					<circle cx="11" cy="5.5" r="2" opacity="0.6" />
					<path d="M10 9.5c1.8 0 3.5 1.3 3.5 3.5" opacity="0.6" />
				</svg>
			);
		case "gear":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
					<circle cx="8" cy="8" r="2.5" />
					<path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" strokeLinecap="round" />
				</svg>
			);
		case "question":
			return (
				<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5">
					<circle cx="8" cy="8" r="6" />
					<path d="M6 6a2 2 0 012.5-1.9A2 2 0 018 8v1" strokeLinecap="round" />
					<circle cx="8" cy="12" r="0.5" fill={color} stroke="none" />
				</svg>
			);
		default:
			return null;
	}
}

export default function NavMenuItems() {
	const { easingRef } = useGlobalEasing();
	const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ctrlRef = useRef<Controllable | null>(null);

	const handlePlay = useCallback(() => {
		const els = itemRefs.current.filter(Boolean) as HTMLDivElement[];
		if (els.length === 0) return;

		ctrlRef.current?.cancel();

		for (const el of els) {
			el.style.opacity = "0";
			el.style.transform = "";
		}

		const ctrl = stagger(
			els.map(
				(el) => () =>
					animate(
						el,
						[
							{ opacity: 0, transform: "translateX(-30px)" },
							{ opacity: 1, transform: "translateX(0)" },
						],
						{ duration: 350, easing: easingRef.current },
					),
			),
			{ each: 60 },
		);

		ctrlRef.current = ctrl;
		ctrl.play();
	}, []);

	const handleReset = useCallback(() => {
		ctrlRef.current?.cancel();
		const els = itemRefs.current.filter(Boolean) as HTMLDivElement[];
		for (const el of els) {
			el.style.opacity = "0";
			el.style.transform = "";
		}
	}, []);

	return (
		<div>
			<div
				style={{
					background: "#12121a",
					borderRadius: 12,
					padding: 12,
					maxWidth: 260,
					marginBottom: 20,
					border: "1px solid #1e1e2e",
				}}
			>
				{menuItems.map((item, i) => (
					<div
						key={item.label}
						ref={(el) => {
							itemRefs.current[i] = el;
						}}
						style={{
							opacity: 0,
							display: "flex",
							alignItems: "center",
							gap: 10,
							padding: "10px 14px",
							borderRadius: 8,
							color: item.active ? "#646cff" : "#9898a6",
							background: item.active ? "rgba(100, 108, 255, 0.1)" : "transparent",
							cursor: "default",
							fontSize: "0.85rem",
							fontWeight: item.active ? 600 : 400,
							transition: "background 0.15s",
						}}
					>
						<MenuIcon type={item.icon} />
						<span style={{ flex: 1 }}>{item.label}</span>
						{item.badge && (
							<span
								style={{
									fontSize: "0.65rem",
									fontWeight: 600,
									padding: "2px 7px",
									borderRadius: 10,
									background:
										item.badge === "New"
											? "rgba(16, 185, 129, 0.15)"
											: "rgba(100, 108, 255, 0.15)",
									color:
										item.badge === "New"
											? "#10b981"
											: "#646cff",
								}}
							>
								{item.badge}
							</span>
						)}
					</div>
				))}
			</div>
			<div style={{ display: "flex", gap: 8 }}>
				<button type="button" className="btn btn-play" onClick={handlePlay}>
					Play
				</button>
				<button type="button" className="btn btn-reset" onClick={handleReset}>
					Reset
				</button>
			</div>
		</div>
	);
}

export const code = `import { animate, stagger } from "@reactzero/animotion";

// 6 menu items slide in from the left with stagger
const ctrl = stagger(
  menuItems.map(item => () =>
    animate(item.el, [
      { opacity: 0, transform: "translateX(-30px)" },
      { opacity: 1, transform: "translateX(0)" },
    ], {
      duration: 350,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    })
  ),
  { each: 60 }
);

ctrl.play();`;
