import { useRef, useEffect } from "react";
import { SectionHeader } from "../components/SectionHeader";

declare const Prism: { highlightElement(el: Element): void };

// ─── Colors ──────────────────────────────────────────────────
const colors = {
	blue: "#3b82f6",
	emerald: "#10b981",
	purple: "#8b5cf6",
	amber: "#f59e0b",
};

// ─── API Data ────────────────────────────────────────────────
interface ApiItem {
	name: string;
	desc: string;
}

const coreFunctions: ApiItem[] = [
	{ name: "animate(el, kf, opts)", desc: "WAAPI wrapper with commitStyles" },
	{ name: "sequence(...steps)", desc: "Run steps one after another" },
	{ name: "parallel(...steps)", desc: "Run steps simultaneously" },
	{ name: "stagger(steps, config)", desc: "Staggered start delays" },
	{ name: "delay(ms)", desc: "Time-based pause step" },
	{ name: "timeline(options)", desc: "Seekable position-based choreography" },
];

const reactHooks: ApiItem[] = [
	{ name: "useSequence(steps)", desc: "Sequence with play/pause/cancel/state" },
	{ name: "useTimeline(builder)", desc: "Seekable timeline with seek/progress" },
	{ name: "useStagger(steps, cfg)", desc: "Staggered animation across refs" },
	{ name: "useScroll(options)", desc: "Scroll-linked progress (0-1)" },
	{ name: "useViewTransition()", desc: "Same-document view transitions" },
	{ name: "useReducedMotion()", desc: "Detect prefers-reduced-motion" },
];

const operators: ApiItem[] = [
	{ name: "race(...steps)", desc: "First to finish wins, rest cancel" },
	{ name: "repeat(step, count)", desc: "Loop N times or infinitely" },
	{ name: "timeout(step, ms)", desc: "Cancel if exceeding deadline" },
	{ name: "waitForEvent(el, name)", desc: "Wait for a DOM event" },
	{ name: "waitForIntersection(el)", desc: "Wait for viewport entry" },
	{ name: "waitFor(promise)", desc: "Wrap a Promise as a step" },
];

const performance: ApiItem[] = [
	{ name: "enableAdaptivePerformance()", desc: "Detect tier + start FPS monitoring" },
	{ name: "detectDeviceTier()", desc: 'Returns "high" / "medium" / "low"' },
	{ name: 'priority: "critical"', desc: "Always runs at full quality" },
	{ name: 'priority: "decorative"', desc: "Skipped under frame pressure" },
	{ name: "decompose: true", desc: "Layout props to GPU transforms" },
	{ name: "linearEasing(fn)", desc: "Elastic/bounce on compositor" },
];

// ─── Options Table Data ──────────────────────────────────────
interface OptionItem {
	name: string;
	type: string;
	desc: string;
}

const animateOptions: OptionItem[] = [
	{ name: "duration", type: "number", desc: "Animation duration in ms" },
	{ name: "easing", type: "string", desc: "CSS easing or linear() string" },
	{ name: "delay", type: "number", desc: "Start delay in ms" },
	{ name: "iterations", type: "number", desc: "Repeat count (Infinity for loop)" },
	{ name: "direction", type: "string", desc: '"normal" | "reverse" | "alternate"' },
	{ name: "composite", type: "string", desc: '"replace" | "add" | "accumulate"' },
	{ name: "willChange", type: "boolean", desc: "Auto will-change management (default: true)" },
	{ name: "priority", type: "string", desc: '"critical" | "normal" | "decorative"' },
	{ name: "decompose", type: "boolean", desc: "Convert layout props to transforms" },
	{ name: "__perf", type: "boolean", desc: "DevTools performance annotations" },
];

// ─── Code Snippets ───────────────────────────────────────────
const adaptiveCode = `import { enableAdaptivePerformance, animate } from "@reactzero/flow";

// One-line setup: detect device, monitor FPS, enable priority
enableAdaptivePerformance();

// Or configure thresholds
enableAdaptivePerformance({
  tier: "medium",                    // override detection
  moderateSpeedUp: 3,                // 3x speed for "reduce"
  frameMonitor: {
    degradeBelow: 50,                // degrade decorative < 50fps
    criticalBelow: 30,               // speed up normal < 30fps
    windowSize: 10,                  // rolling average window
  },
});

// Tag animations with priority
animate(el, fadeIn, { duration: 300, priority: "critical" });
animate(el, shimmer, { duration: 500, priority: "decorative" });

// GPU-accelerated layout animation
animate(el, [{ left: "0px" }, { left: "100px" }], {
  duration: 300,
  decompose: true, // auto-converts to translateX
});`;

const reducedMotionCode = `import {
  ReducedMotionProvider,
  setReducedMotionPolicy,
  useReducedMotion,
} from "@reactzero/flow";

// Global policy
setReducedMotionPolicy("reduce");

// Or scoped via React context
function App() {
  return (
    <ReducedMotionProvider mode="reduce">
      {/* All animations respect the policy */}
    </ReducedMotionProvider>
  );
}

// Policies:
// "skip"      \u2192 finish() instantly
// "reduce"    \u2192 slower playback rate
// "crossfade" \u2192 opacity-only transitions
// "respect"   \u2192 honor OS setting (default)

// Reactive detection
const prefersReduced = useReducedMotion();`;

const controllableCode = `interface Controllable {
  play(): void;
  pause(): void;
  cancel(): void;
  finish(): void;
  readonly finished: Promise<void>;
  readonly playState: "idle" | "running" | "paused" | "finished";
  playbackRate: number;
}`;

// ─── Styles ──────────────────────────────────────────────────
const s = {
	// Controllable interface panel
	interfacePanel: {
		background: "#12121a",
		border: "1px solid #1e1e2e",
		borderRadius: 12,
		overflow: "hidden",
		marginBottom: 40,
	},
	interfaceHeader: {
		padding: "14px 20px",
		borderBottom: "1px solid #1e1e2e",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	interfaceLabel: {
		fontSize: "0.8rem",
		fontWeight: 700,
		fontFamily: "'JetBrains Mono', monospace",
		color: "#646cff",
		textTransform: "uppercase" as const,
		letterSpacing: "0.08em",
	},
	interfaceBadge: {
		fontSize: "0.65rem",
		fontFamily: "'JetBrains Mono', monospace",
		color: "rgba(100, 108, 255, 0.6)",
		background: "rgba(100, 108, 255, 0.08)",
		padding: "3px 10px",
		borderRadius: 4,
	},
	interfaceCode: {
		padding: "16px 20px",
		margin: 0,
		fontSize: "0.8rem",
		lineHeight: 1.7,
		background: "transparent",
		overflow: "auto",
	},
	// API category card
	card: (color: string) => ({
		background: "#12121a",
		border: "1px solid #1e1e2e",
		borderRadius: 12,
		overflow: "hidden",
		borderTop: `2px solid ${color}`,
	}),
	cardHeader: (color: string) => ({
		padding: "14px 18px",
		borderBottom: "1px solid #1e1e2e",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	}),
	cardTitle: (color: string) => ({
		fontSize: "0.75rem",
		fontWeight: 700,
		fontFamily: "'JetBrains Mono', monospace",
		color,
		textTransform: "uppercase" as const,
		letterSpacing: "0.06em",
	}),
	cardCount: (color: string) => ({
		fontSize: "0.6rem",
		fontFamily: "'JetBrains Mono', monospace",
		color: `${color}88`,
		background: `${color}12`,
		padding: "2px 8px",
		borderRadius: 3,
	}),
	cardBody: {
		padding: "4px 0",
	},
	apiItem: {
		display: "flex",
		alignItems: "baseline",
		padding: "6px 18px",
		gap: 10,
	},
	apiItemName: (color: string) => ({
		fontSize: "0.75rem",
		fontFamily: "'JetBrains Mono', monospace",
		color,
		flexShrink: 0,
		whiteSpace: "nowrap" as const,
	}),
	apiItemDesc: {
		fontSize: "0.7rem",
		color: "#6b7280",
		lineHeight: 1.4,
	},
	apiItemDot: {
		fontSize: "0.5rem",
		color: "#2a2a3a",
		flexShrink: 0,
	},
	// Config panels
	configPanel: {
		background: "#12121a",
		border: "1px solid #1e1e2e",
		borderRadius: 12,
		overflow: "hidden",
	},
	configHeader: (color: string) => ({
		padding: "12px 18px",
		borderBottom: "1px solid #1e1e2e",
		display: "flex",
		alignItems: "center",
		gap: 10,
	}),
	configDot: (color: string) => ({
		width: 8,
		height: 8,
		borderRadius: "50%",
		background: color,
		flexShrink: 0,
	}),
	configTitle: {
		fontSize: "0.75rem",
		fontWeight: 600,
		fontFamily: "'JetBrains Mono', monospace",
		color: "#e0e0e6",
		letterSpacing: "0.03em",
	},
	configCode: {
		padding: "14px 18px",
		margin: 0,
		fontSize: "0.72rem",
		lineHeight: 1.65,
		background: "transparent",
		overflow: "auto",
		maxHeight: 420,
	},
	// Options table
	optionsPanel: {
		background: "#12121a",
		border: "1px solid #1e1e2e",
		borderRadius: 12,
		overflow: "hidden",
	},
	optionsHeader: {
		padding: "14px 20px",
		borderBottom: "1px solid #1e1e2e",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	},
	optionsTitle: {
		fontSize: "0.8rem",
		fontWeight: 700,
		fontFamily: "'JetBrains Mono', monospace",
		color: "#e0e0e6",
	},
	optionsBadge: {
		fontSize: "0.6rem",
		fontFamily: "'JetBrains Mono', monospace",
		color: "#6b7280",
		background: "rgba(255,255,255,0.04)",
		padding: "3px 8px",
		borderRadius: 3,
	},
	optionsRow: (isLast: boolean) => ({
		display: "grid",
		gridTemplateColumns: "130px 90px 1fr",
		padding: "10px 20px",
		borderBottom: isLast ? "none" : "1px solid rgba(30,30,46,0.6)",
		alignItems: "baseline",
		gap: 12,
	}),
	optName: {
		fontSize: "0.75rem",
		fontFamily: "'JetBrains Mono', monospace",
		color: "#646cff",
	},
	optType: {
		fontSize: "0.65rem",
		fontFamily: "'JetBrains Mono', monospace",
		color: "#6b7280",
	},
	optDesc: {
		fontSize: "0.7rem",
		color: "#9898a6",
		lineHeight: 1.4,
	},
};

// ─── Sub-components ──────────────────────────────────────────
function ApiCard({ color, title, items }: { color: string; title: string; items: ApiItem[] }) {
	return (
		<div style={s.card(color)}>
			<div style={s.cardHeader(color)}>
				<span style={s.cardTitle(color)}>{title}</span>
				<span style={s.cardCount(color)}>{items.length}</span>
			</div>
			<div style={s.cardBody}>
				{items.map((item) => (
					<div key={item.name} style={s.apiItem}>
						<span style={s.apiItemName(color)}>{item.name}</span>
						<span style={s.apiItemDot}>&mdash;</span>
						<span style={s.apiItemDesc}>{item.desc}</span>
					</div>
				))}
			</div>
		</div>
	);
}

function HighlightedPre({ code, language = "tsx" }: { code: string; language?: string }) {
	const codeRef = useRef<HTMLElement>(null);

	useEffect(() => {
		if (codeRef.current && typeof Prism !== "undefined") {
			Prism.highlightElement(codeRef.current);
		}
	}, [code]);

	return (
		<code ref={codeRef} className={`language-${language}`}>
			{code.trim()}
		</code>
	);
}

// ─── Main Component ──────────────────────────────────────────
export function ApiSection() {
	return (
		<section className="section" id="api">
			<div className="container">
				<SectionHeader
					label="API & Configuration"
					title="The complete toolkit"
					description="Every primitive returns a Controllable. Every hook gives you reactive state. Configure adaptive performance and motion policies globally or per-animation."
					index={12}
				/>

				{/* Controllable Interface */}
				<div style={s.interfacePanel}>
					<div style={s.interfaceHeader}>
						<span style={s.interfaceLabel}>Core Interface</span>
						<span style={s.interfaceBadge}>returned by all primitives</span>
					</div>
					<pre style={s.interfaceCode}>
						<HighlightedPre code={controllableCode} language="ts" />
					</pre>
				</div>

				{/* API Categories Grid */}
				<div className="api-grid">
					<ApiCard color={colors.blue} title="Core Functions" items={coreFunctions} />
					<ApiCard color={colors.emerald} title="React Hooks" items={reactHooks} />
					<ApiCard color={colors.purple} title="Operators" items={operators} />
					<ApiCard color={colors.amber} title="Performance" items={performance} />
				</div>

				{/* Configuration Panels */}
				<div className="api-config-grid">
					<div style={s.configPanel}>
						<div style={s.configHeader(colors.amber)}>
							<div style={s.configDot(colors.amber)} />
							<span style={s.configTitle}>Adaptive Performance</span>
						</div>
						<pre style={s.configCode}>
							<HighlightedPre code={adaptiveCode} language="ts" />
						</pre>
					</div>
					<div style={s.configPanel}>
						<div style={s.configHeader(colors.emerald)}>
							<div style={s.configDot(colors.emerald)} />
							<span style={s.configTitle}>Reduced Motion</span>
						</div>
						<pre style={s.configCode}>
							<HighlightedPre code={reducedMotionCode} />
						</pre>
					</div>
				</div>

				{/* animate() Options Table */}
				<div style={s.optionsPanel}>
					<div style={s.optionsHeader}>
						<span style={s.optionsTitle}>animate(element, keyframes, options?)</span>
						<span style={s.optionsBadge}>all options</span>
					</div>
					{animateOptions.map((opt, i) => (
						<div key={opt.name} style={s.optionsRow(i === animateOptions.length - 1)}>
							<span style={s.optName}>{opt.name}</span>
							<span style={s.optType}>{opt.type}</span>
							<span style={s.optDesc}>{opt.desc}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
