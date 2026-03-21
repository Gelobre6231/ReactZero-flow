import { useRef, useState, useCallback, useEffect } from "react";
import { animate, sequence, parallel, stagger, delay } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const colors = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
  amber: "#f59e0b",
  pink: "#ec4899",
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  stage: {
    background: "#0a0a0f",
    borderRadius: 12,
    border: "1px solid #1e1e2e",
    position: "relative" as const,
    height: 340,
    overflow: "hidden",
  },
  // Old page
  oldPage: {
    position: "absolute" as const,
    inset: 0,
    background: "#12121a",
    padding: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  oldHeader: {
    height: 28,
    borderRadius: 6,
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },
  oldContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
    padding: 12,
  },
  oldLine: (width: string) => ({
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.05)",
    width,
  }),
  oldLabel: {
    position: "absolute" as const,
    top: 8,
    right: 12,
    fontSize: "0.6rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#6b7280",
  },
  // New page elements
  wipe: {
    position: "absolute" as const,
    inset: 0,
    background: `linear-gradient(135deg, ${colors.purple}22, ${colors.blue}22)`,
    transformOrigin: "left",
    transform: "scaleX(0)",
    opacity: 0,
  },
  newPage: {
    position: "absolute" as const,
    inset: 0,
    padding: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    pointerEvents: "none" as const,
  },
  newHeader: {
    height: 32,
    borderRadius: 6,
    background: colors.blue,
    opacity: 0,
    transform: "translateY(-20px)",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: 8,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)",
  },
  headerBar: {
    width: 60,
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.25)",
  },
  bodyArea: {
    display: "flex",
    gap: 12,
    flex: 1,
  },
  newSidebar: {
    width: 72,
    background: colors.purple,
    borderRadius: 6,
    opacity: 0,
    transform: "translateX(-20px)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    padding: 8,
  },
  sidebarItem: {
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.25)",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  card: (color: string) => ({
    flex: 1,
    background: color,
    borderRadius: 6,
    opacity: 0,
    transform: "scale(0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  }),
  cardInner: {
    width: "50%",
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.3)",
  },
  cta: {
    height: 36,
    background: colors.emerald,
    borderRadius: 6,
    opacity: 0,
    transform: "translateY(12px) scale(0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaInner: {
    width: 80,
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.4)",
  },
  // Labels
  labelRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 4,
  },
  label: (color: string) => ({
    fontSize: "0.6rem",
    fontFamily: "'JetBrains Mono', monospace",
    color,
    background: `${color}15`,
    padding: "2px 8px",
    borderRadius: 4,
    border: `1px solid ${color}30`,
  }),
  primitiveLabel: {
    position: "absolute" as const,
    fontSize: "0.55rem",
    fontFamily: "'JetBrains Mono', monospace",
    padding: "1px 6px",
    borderRadius: 3,
    zIndex: 10,
    pointerEvents: "none" as const,
  },
};

function PageTransition() {
  const { easingRef } = useGlobalEasing();
  const oldPageRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const newHeaderRef = useRef<HTMLDivElement>(null);
  const newSidebarRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<Controllable | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhase, setActivePhase] = useState<string>("");

  const resetElements = useCallback(() => {
    if (oldPageRef.current) {
      oldPageRef.current.style.opacity = "1";
    }
    if (wipeRef.current) {
      wipeRef.current.style.transform = "scaleX(0)";
      wipeRef.current.style.opacity = "0";
    }
    if (newHeaderRef.current) {
      newHeaderRef.current.style.opacity = "0";
      newHeaderRef.current.style.transform = "translateY(-20px)";
    }
    if (newSidebarRef.current) {
      newSidebarRef.current.style.opacity = "0";
      newSidebarRef.current.style.transform = "translateX(-20px)";
    }
    for (const ref of [card1Ref, card2Ref, card3Ref]) {
      if (ref.current) {
        ref.current.style.opacity = "0";
        ref.current.style.transform = "scale(0.8)";
      }
    }
    if (ctaRef.current) {
      ctaRef.current.style.opacity = "0";
      ctaRef.current.style.transform = "translateY(12px) scale(0.95)";
    }
    setActivePhase("");
  }, []);

  const play = useCallback(() => {
    ctrlRef.current?.cancel();
    resetElements();
    setIsPlaying(true);

    const oldPage = oldPageRef.current!;
    const wipe = wipeRef.current!;
    const header = newHeaderRef.current!;
    const sidebar = newSidebarRef.current!;
    const cards = [card1Ref.current!, card2Ref.current!, card3Ref.current!];
    const cta = ctaRef.current!;

    const ctrl = sequence(
      // Phase 1: Old page fades out
      () => {
        setActivePhase("animate: fade out");
        return animate(
          oldPage,
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 400, easing: easingRef.current },
        );
      },
      // Brief pause
      () => {
        setActivePhase("delay(100)");
        return delay(100);
      },
      // Phase 2: New page enters
      () => {
        setActivePhase("sequence: new page");
        return sequence(
          // Background wipe
          () => {
            setActivePhase("animate: color wipe");
            return animate(
              wipe,
              [
                { transform: "scaleX(0)", opacity: 1 },
                { transform: "scaleX(1)", opacity: 1 },
              ],
              { duration: 350, easing: easingRef.current },
            );
          },
          // Header + sidebar in parallel
          () => {
            setActivePhase("parallel: header + sidebar");
            return parallel(
              () =>
                animate(
                  header,
                  [
                    { opacity: 0, transform: "translateY(-20px)" },
                    { opacity: 1, transform: "translateY(0)" },
                  ],
                  { duration: 300, easing: easingRef.current },
                ),
              () =>
                animate(
                  sidebar,
                  [
                    { opacity: 0, transform: "translateX(-20px)" },
                    { opacity: 1, transform: "translateX(0)" },
                  ],
                  { duration: 300, easing: easingRef.current },
                ),
            );
          },
          // Cards stagger in
          () => {
            setActivePhase("stagger: content cards");
            return stagger(
              cards.map(
                (card) => () =>
                  animate(
                    card,
                    [
                      { opacity: 0, transform: "scale(0.8)" },
                      { opacity: 1, transform: "scale(1)" },
                    ],
                    { duration: 250, easing: easingRef.current },
                  ),
              ),
              { each: 80 },
            );
          },
          // CTA bounces in
          () => {
            setActivePhase("animate: CTA bounce");
            return animate(
              cta,
              [
                { opacity: 0, transform: "translateY(12px) scale(0.95)" },
                { opacity: 1, transform: "translateY(-4px) scale(1.02)" },
                { opacity: 1, transform: "translateY(0) scale(1)" },
              ],
              { duration: 400, easing: easingRef.current },
            );
          },
        );
      },
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => {
      setIsPlaying(false);
      setActivePhase("done");
    });
  }, [resetElements]);

  const reset = useCallback(() => {
    ctrlRef.current?.cancel();
    setIsPlaying(false);
    resetElements();
  }, [resetElements]);

  useEffect(() => {
    return () => {
      ctrlRef.current?.cancel();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <button
          type="button"
          className="btn btn-play"
          onClick={play}
          disabled={isPlaying}
        >
          Play
        </button>
        <button type="button" className="btn btn-reset" onClick={reset}>
          Reset
        </button>
        {activePhase && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              fontFamily: "'JetBrains Mono', monospace",
              color: colors.amber,
            }}
          >
            {activePhase}
          </span>
        )}
      </div>

      <div style={styles.stage}>
        {/* Old page */}
        <div ref={oldPageRef} style={styles.oldPage}>
          <span style={styles.oldLabel}>old page</span>
          <div style={styles.oldHeader}>
            <div style={{ ...styles.headerBar, width: 80 }} />
          </div>
          <div style={styles.oldContent}>
            <div style={styles.oldLine("90%")} />
            <div style={styles.oldLine("75%")} />
            <div style={styles.oldLine("85%")} />
            <div style={styles.oldLine("60%")} />
            <div style={styles.oldLine("70%")} />
          </div>
        </div>

        {/* Background wipe */}
        <div ref={wipeRef} style={styles.wipe} />

        {/* New page */}
        <div style={styles.newPage}>
          <div ref={newHeaderRef} style={styles.newHeader}>
            <div style={styles.headerDot} />
            <div style={styles.headerDot} />
            <div style={styles.headerDot} />
            <div style={styles.headerBar} />
          </div>

          <div style={styles.bodyArea}>
            <div ref={newSidebarRef} style={styles.newSidebar}>
              <div style={styles.sidebarItem} />
              <div style={styles.sidebarItem} />
              <div style={styles.sidebarItem} />
              <div style={styles.sidebarItem} />
            </div>
            <div style={styles.mainArea}>
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <div ref={card1Ref} style={styles.card(colors.pink)}>
                  <div style={styles.cardInner} />
                </div>
                <div ref={card2Ref} style={styles.card(colors.amber)}>
                  <div style={styles.cardInner} />
                </div>
                <div ref={card3Ref} style={styles.card(colors.blue)}>
                  <div style={styles.cardInner} />
                </div>
              </div>
              <div ref={ctaRef} style={styles.cta}>
                <div style={styles.ctaInner} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primitive labels */}
      <div style={styles.labelRow}>
        <span style={styles.label(colors.blue)}>animate</span>
        <span style={styles.label(colors.amber)}>delay</span>
        <span style={styles.label(colors.purple)}>sequence</span>
        <span style={styles.label(colors.emerald)}>parallel</span>
        <span style={styles.label(colors.pink)}>stagger</span>
      </div>
    </div>
  );
}

export default PageTransition;

export const code = `import { animate, sequence, parallel, stagger, delay } from "@reactzero/animotion";

// Full page transition combining every primitive
const transition = sequence(
  // Old page fades out
  () => animate(oldPage,
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 400, easing: "ease-in" }),

  () => delay(100),

  // New page enters as a composed sequence
  () => sequence(
    // Background wipe
    () => animate(wipe, [
      { transform: "scaleX(0)" },
      { transform: "scaleX(1)" },
    ], { duration: 350 }),

    // Header + sidebar enter together
    () => parallel(
      () => animate(header, slideDown, { duration: 300 }),
      () => animate(sidebar, slideFromLeft, { duration: 300 }),
    ),

    // Content cards stagger in
    () => stagger(
      cards.map(card => () =>
        animate(card, popIn, { duration: 250 })),
      { each: 80 },
    ),

    // CTA button bounces in
    () => animate(cta, bounceIn, { duration: 400 }),
  ),
);

transition.play();`;
