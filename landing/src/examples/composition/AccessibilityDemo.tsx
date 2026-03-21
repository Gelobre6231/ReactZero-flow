import { useRef, useState, useCallback, useEffect } from "react";
import { animate } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const colors = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  pink: "#ec4899",
};

type Policy = "skip" | "reduce" | "crossfade" | "respect";

const policyColors: Record<Policy, string> = {
  skip: colors.pink,
  reduce: colors.amber,
  crossfade: colors.purple,
  respect: colors.emerald,
};

const policyDescriptions: Record<Policy, string> = {
  skip: "Instantly jumps to end state",
  reduce: "Plays at reduced speed (5x slower)",
  crossfade: "Only opacity transitions, no motion",
  respect: "Honors OS setting (plays or skips)",
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  osToggle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginLeft: "auto" as const,
    fontSize: "0.75rem",
    color: "#9898a6",
  },
  toggleTrack: (active: boolean) => ({
    width: 36,
    height: 20,
    borderRadius: 10,
    background: active ? colors.emerald : "#374151",
    cursor: "pointer",
    position: "relative" as const,
    transition: "background 0.2s",
    border: "none",
    padding: 0,
    flexShrink: 0,
  }),
  toggleThumb: (active: boolean) => ({
    position: "absolute" as const,
    top: 2,
    left: active ? 18 : 2,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transition: "left 0.2s",
    pointerEvents: "none" as const,
  }),
  osLabel: (active: boolean) => ({
    fontSize: "0.7rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: active ? colors.emerald : "#6b7280",
  }),
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  panel: (color: string) => ({
    background: "#12121a",
    borderRadius: 10,
    border: `1px solid ${color}30`,
    overflow: "hidden",
  }),
  panelHeader: (color: string) => ({
    padding: "10px 14px",
    borderBottom: `1px solid ${color}20`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }),
  panelTitle: (color: string) => ({
    fontSize: "0.75rem",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', monospace",
    color,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  }),
  panelBadge: (color: string) => ({
    fontSize: "0.55rem",
    fontFamily: "'JetBrains Mono', monospace",
    color,
    background: `${color}15`,
    padding: "2px 6px",
    borderRadius: 3,
  }),
  panelBody: {
    padding: 14,
    height: 100,
    position: "relative" as const,
    overflow: "hidden",
  },
  track: {
    position: "absolute" as const,
    top: "50%",
    left: 14,
    right: 14,
    height: 2,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 1,
    transform: "translateY(-1px)",
  },
  trackFill: (color: string) => ({
    position: "absolute" as const,
    top: 0,
    left: 0,
    height: "100%",
    width: 0,
    background: `${color}40`,
    borderRadius: 1,
  }),
  box: (color: string) => ({
    position: "absolute" as const,
    top: "50%",
    left: 14,
    width: 28,
    height: 28,
    borderRadius: 6,
    background: color,
    transform: "translateY(-50%) rotate(0deg)",
    boxShadow: `0 0 12px ${color}44`,
    opacity: 1,
  }),
  panelDesc: (color: string) => ({
    padding: "8px 14px 10px",
    fontSize: "0.65rem",
    color: "#6b7280",
    borderTop: `1px solid ${color}10`,
    lineHeight: 1.4,
  }),
  legend: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 16,
    justifyContent: "center",
    padding: "8px 0 0",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: "0.65rem",
    color: "#6b7280",
  },
  legendDot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: 2,
    background: color,
  }),
};

const POLICIES: Policy[] = ["skip", "reduce", "crossfade", "respect"];

function AccessibilityDemo() {
  const { easingRef } = useGlobalEasing();
  const [simulateReduced, setSimulateReduced] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Individual refs for each panel's box and fill elements
  const skipBoxRef = useRef<HTMLDivElement>(null);
  const skipFillRef = useRef<HTMLDivElement>(null);
  const reduceBoxRef = useRef<HTMLDivElement>(null);
  const reduceFillRef = useRef<HTMLDivElement>(null);
  const crossfadeBoxRef = useRef<HTMLDivElement>(null);
  const crossfadeFillRef = useRef<HTMLDivElement>(null);
  const respectBoxRef = useRef<HTMLDivElement>(null);
  const respectFillRef = useRef<HTMLDivElement>(null);

  // Track active controllables for cleanup
  const ctrlsRef = useRef<(Controllable | null)[]>([]);

  const refMap: Record<Policy, { box: React.RefObject<HTMLDivElement | null>; fill: React.RefObject<HTMLDivElement | null> }> = {
    skip: { box: skipBoxRef, fill: skipFillRef },
    reduce: { box: reduceBoxRef, fill: reduceFillRef },
    crossfade: { box: crossfadeBoxRef, fill: crossfadeFillRef },
    respect: { box: respectBoxRef, fill: respectFillRef },
  };

  const resetAll = useCallback(() => {
    for (const ctrl of ctrlsRef.current) {
      ctrl?.cancel();
    }
    ctrlsRef.current = [];

    for (const policy of POLICIES) {
      const { box, fill } = refMap[policy];
      if (box.current) {
        box.current.style.left = "14px";
        box.current.style.transform = "translateY(-50%) rotate(0deg)";
        box.current.style.opacity = "1";
      }
      if (fill.current) {
        fill.current.style.width = "0";
      }
    }
  }, []);

  const animatePanel = useCallback(
    (policy: Policy, reduced: boolean): Controllable | null => {
      const { box, fill } = refMap[policy];
      const boxEl = box.current;
      const fillEl = fill.current;
      if (!boxEl || !fillEl) return null;

      if (policy === "skip" && reduced) {
        // Skip: instantly jump to end state
        boxEl.style.left = "calc(100% - 42px)";
        boxEl.style.transform = "translateY(-50%) rotate(360deg)";
        fillEl.style.width = "100%";
        return null;
      }

      if (policy === "crossfade" && reduced) {
        // Crossfade: only opacity, no movement
        const ctrl = animate(
          boxEl,
          [
            { opacity: 1 },
            { opacity: 0.3 },
            { opacity: 1 },
          ],
          { duration: 2000, easing: easingRef.current },
        );
        ctrlsRef.current.push(ctrl);
        // Animate the fill bar for visual feedback
        const fillCtrl = animate(
          fillEl,
          [{ width: "0%" }, { width: "100%" }],
          { duration: 2000, easing: easingRef.current },
        );
        ctrlsRef.current.push(fillCtrl);
        return ctrl;
      }

      // Normal or reduce: full movement + rotation
      const duration = policy === "reduce" && reduced ? 5000 : 1000;

      const ctrl = animate(
        boxEl,
        [
          {
            left: "14px",
            transform: "translateY(-50%) rotate(0deg)",
          },
          {
            left: "calc(100% - 42px)",
            transform: "translateY(-50%) rotate(360deg)",
          },
        ],
        { duration, easing: easingRef.current },
      );
      ctrlsRef.current.push(ctrl);

      // Fill bar tracks progress
      const fillCtrl = animate(
        fillEl,
        [{ width: "0%" }, { width: "100%" }],
        { duration, easing: easingRef.current },
      );
      ctrlsRef.current.push(fillCtrl);

      return ctrl;
    },
    [],
  );

  const playAll = useCallback(() => {
    resetAll();
    setIsPlaying(true);

    const mainCtrls: Controllable[] = [];

    for (const policy of POLICIES) {
      const ctrl = animatePanel(policy, simulateReduced);
      if (ctrl) {
        ctrl.play();
        mainCtrls.push(ctrl);
      }
    }

    // Wait for the longest animation to finish
    if (mainCtrls.length > 0) {
      Promise.all(mainCtrls.map((c) => c.finished)).then(() => {
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(false);
    }
  }, [simulateReduced, resetAll, animatePanel]);

  const reset = useCallback(() => {
    resetAll();
    setIsPlaying(false);
  }, [resetAll]);

  useEffect(() => {
    return () => {
      for (const ctrl of ctrlsRef.current) {
        ctrl?.cancel();
      }
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <button
          type="button"
          className="btn btn-play"
          onClick={playAll}
          disabled={isPlaying}
        >
          Play All
        </button>
        <button type="button" className="btn btn-reset" onClick={reset}>
          Reset
        </button>

        <div style={styles.osToggle}>
          <span style={styles.osLabel(simulateReduced)}>
            prefers-reduced-motion
          </span>
          <button
            type="button"
            style={styles.toggleTrack(simulateReduced)}
            onClick={() => setSimulateReduced(!simulateReduced)}
            aria-label="Toggle reduced motion simulation"
          >
            <div style={styles.toggleThumb(simulateReduced)} />
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {POLICIES.map((policy) => {
          const color = policyColors[policy];
          const refs = refMap[policy];

          return (
            <div key={policy} style={styles.panel(color)}>
              <div style={styles.panelHeader(color)}>
                <span style={styles.panelTitle(color)}>{policy}</span>
                <span style={styles.panelBadge(color)}>
                  {simulateReduced
                    ? policy === "respect"
                      ? "skips"
                      : "active"
                    : "normal"}
                </span>
              </div>

              <div style={styles.panelBody}>
                {/* Track line */}
                <div style={styles.track}>
                  <div ref={refs.fill} style={styles.trackFill(color)} />
                </div>
                {/* Moving box */}
                <div ref={refs.box} style={styles.box(color)} />
              </div>

              <div style={styles.panelDesc(color)}>
                {policyDescriptions[policy]}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={styles.legendDot(colors.pink)} />
          <span>skip -- finish() instantly</span>
        </div>
        <div style={styles.legendItem}>
          <div style={styles.legendDot(colors.amber)} />
          <span>reduce -- playbackRate = 0.2</span>
        </div>
        <div style={styles.legendItem}>
          <div style={styles.legendDot(colors.purple)} />
          <span>crossfade -- opacity only</span>
        </div>
        <div style={styles.legendItem}>
          <div style={styles.legendDot(colors.emerald)} />
          <span>respect -- OS decides</span>
        </div>
      </div>
    </div>
  );
}

export default AccessibilityDemo;

export const code = `import { animate, setReducedMotionPolicy, useReducedMotion } from "@reactzero/animotion";

function App() {
  const prefersReduced = useReducedMotion();

  // Set policy globally -- affects all new animations
  setReducedMotionPolicy("reduce");

  // Policies control what happens when OS prefers reduced motion:
  //
  // "skip"      -- animation.finish() called instantly
  // "reduce"    -- playbackRate set to 0.2 (5x slower)
  // "crossfade" -- keyframes stripped to opacity-only
  // "respect"   -- honors OS setting (default)

  return (
    <div>
      <p>Reduced motion: {prefersReduced ? "on" : "off"}</p>
      <button onClick={() => {
        // This animation respects the active policy
        animate(box, [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(200px) rotate(360deg)" },
        ], { duration: 1000 }).play();
      }}>
        Animate
      </button>
    </div>
  );
}`;
