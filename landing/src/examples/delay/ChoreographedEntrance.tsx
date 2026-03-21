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
    marginBottom: 16,
  },
  timer: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.85rem",
    color: "#9898a6",
    marginLeft: "auto",
  },
  wireframe: {
    background: "#12121a",
    borderRadius: 12,
    border: "1px solid #1e1e2e",
    padding: 16,
    minHeight: 320,
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
    overflow: "hidden",
  },
  header: {
    height: 36,
    background: colors.blue,
    borderRadius: 6,
    opacity: 0,
    transform: "translateY(-20px)",
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    gap: 8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.4)",
  },
  headerBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.2)",
  },
  bodyRow: {
    display: "flex",
    gap: 12,
    flex: 1,
    marginTop: 12,
  },
  sidebar: {
    width: 80,
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
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.25)",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  mainContent: {
    flex: 1,
    background: "#1a1d27",
    borderRadius: 6,
    opacity: 0,
    padding: 12,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  textLine: {
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.1)",
  },
  cardsRow: {
    display: "flex",
    gap: 8,
  },
  card: (color: string) => ({
    flex: 1,
    height: 56,
    background: color,
    borderRadius: 6,
    opacity: 0,
    transform: "translateY(20px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  cardInner: {
    width: "60%",
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.3)",
  },
  footer: {
    height: 28,
    background: colors.emerald,
    borderRadius: 6,
    opacity: 0,
    transform: "translateY(20px)",
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBar: {
    width: "40%",
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.3)",
  },
  label: {
    fontSize: "0.65rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#6b7280",
    textAlign: "right" as const,
    marginTop: 4,
  },
  delayMarker: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 0",
  },
  delayLine: {
    flex: 1,
    height: 1,
    background: "rgba(245, 158, 11, 0.3)",
    borderStyle: "dashed" as const,
  },
  delayLabel: {
    fontSize: "0.6rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: colors.amber,
    whiteSpace: "nowrap" as const,
  },
};

function ChoreographedEntrance() {
  const { easingRef } = useGlobalEasing();
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<Controllable | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startTimeRef.current = performance.now();
    setElapsed(0);

    const tick = () => {
      setElapsed(Math.round(performance.now() - startTimeRef.current));
      timerRef.current = requestAnimationFrame(tick);
    };
    timerRef.current = requestAnimationFrame(tick);
  }, [stopTimer]);

  const resetElements = useCallback(() => {
    const elements = [
      { ref: headerRef, transform: "translateY(-20px)" },
      { ref: sidebarRef, transform: "translateX(-20px)" },
      { ref: mainRef, transform: "none" },
      { ref: card1Ref, transform: "translateY(20px)" },
      { ref: card2Ref, transform: "translateY(20px)" },
      { ref: card3Ref, transform: "translateY(20px)" },
      { ref: footerRef, transform: "translateY(20px)" },
    ];

    for (const { ref, transform } of elements) {
      if (ref.current) {
        ref.current.style.opacity = "0";
        ref.current.style.transform = transform;
      }
    }
  }, []);

  const play = useCallback(() => {
    ctrlRef.current?.cancel();
    resetElements();
    setIsPlaying(true);
    startTimer();

    const header = headerRef.current!;
    const sidebar = sidebarRef.current!;
    const main = mainRef.current!;
    const cards = [card1Ref.current!, card2Ref.current!, card3Ref.current!];
    const footer = footerRef.current!;

    const ctrl = sequence(
      // Group 1: Header slides down
      () =>
        animate(
          header,
          [
            { opacity: 0, transform: "translateY(-20px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 200, easing: easingRef.current },
        ),
      // delay(300)
      () => delay(300),
      // Group 2: Sidebar + main content in parallel
      () =>
        parallel(
          () =>
            animate(
              sidebar,
              [
                { opacity: 0, transform: "translateX(-20px)" },
                { opacity: 1, transform: "translateX(0)" },
              ],
              { duration: 400, easing: easingRef.current },
            ),
          () =>
            animate(
              main,
              [{ opacity: 0 }, { opacity: 1 }],
              { duration: 400, easing: easingRef.current },
            ),
        ),
      // delay(200)
      () => delay(200),
      // Group 3: Cards stagger in
      () =>
        stagger(
          cards.map(
            (card) => () =>
              animate(
                card,
                [
                  { opacity: 0, transform: "translateY(20px)" },
                  { opacity: 1, transform: "translateY(0)" },
                ],
                { duration: 300, easing: easingRef.current },
              ),
          ),
          { each: 100 },
        ),
      // delay(400)
      () => delay(400),
      // Group 4: Footer slides up
      () =>
        animate(
          footer,
          [
            { opacity: 0, transform: "translateY(20px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 300, easing: easingRef.current },
        ),
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => {
      stopTimer();
      setIsPlaying(false);
    });
  }, [resetElements, startTimer, stopTimer]);

  const reset = useCallback(() => {
    ctrlRef.current?.cancel();
    stopTimer();
    setIsPlaying(false);
    setElapsed(0);
    resetElements();
  }, [resetElements, stopTimer]);

  useEffect(() => {
    return () => {
      ctrlRef.current?.cancel();
      stopTimer();
    };
  }, [stopTimer]);

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
        <span style={styles.timer}>{elapsed}ms</span>
      </div>

      <div style={styles.wireframe}>
        {/* Header */}
        <div ref={headerRef} style={styles.header}>
          <div style={styles.headerDot} />
          <div style={styles.headerDot} />
          <div style={styles.headerDot} />
          <div style={styles.headerBar} />
        </div>

        {/* delay(300) marker */}
        <div style={styles.delayMarker}>
          <span style={styles.delayLabel}>delay(300)</span>
          <div style={styles.delayLine} />
        </div>

        {/* Body: sidebar + main */}
        <div style={styles.bodyRow}>
          <div ref={sidebarRef} style={styles.sidebar}>
            <div style={styles.sidebarItem} />
            <div style={styles.sidebarItem} />
            <div style={styles.sidebarItem} />
            <div style={styles.sidebarItem} />
          </div>
          <div style={styles.main}>
            <div ref={mainRef} style={styles.mainContent}>
              <div style={{ ...styles.textLine, width: "80%" }} />
              <div style={{ ...styles.textLine, width: "60%" }} />
              <div style={{ ...styles.textLine, width: "70%" }} />
            </div>

            {/* delay(200) marker */}
            <div style={styles.delayMarker}>
              <span style={styles.delayLabel}>delay(200)</span>
              <div style={styles.delayLine} />
            </div>

            {/* Cards */}
            <div style={styles.cardsRow}>
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
          </div>
        </div>

        {/* delay(400) marker */}
        <div style={styles.delayMarker}>
          <span style={styles.delayLabel}>delay(400)</span>
          <div style={styles.delayLine} />
        </div>

        {/* Footer */}
        <div ref={footerRef} style={styles.footer}>
          <div style={styles.footerBar} />
        </div>
      </div>

      <div style={styles.label}>
        sequence( header, delay(300), parallel(sidebar, main), delay(200),
        stagger(cards), delay(400), footer )
      </div>
    </div>
  );
}

export default ChoreographedEntrance;

export const code = `import { animate, sequence, parallel, stagger, delay } from "@reactzero/animotion";

// Page elements appear with carefully timed delays
const entrance = sequence(
  // Group 1: Header slides down
  () => animate(header, [
    { opacity: 0, transform: "translateY(-20px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 200, easing: "ease-out" }),

  // Pause before next group
  () => delay(300),

  // Group 2: Sidebar + main content together
  () => parallel(
    () => animate(sidebar, [
      { opacity: 0, transform: "translateX(-20px)" },
      { opacity: 1, transform: "translateX(0)" },
    ], { duration: 400 }),
    () => animate(main,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 400 }),
  ),

  // Pause before cards
  () => delay(200),

  // Group 3: Cards stagger in from bottom
  () => stagger(
    cards.map(card => () => animate(card, [
      { opacity: 0, transform: "translateY(20px)" },
      { opacity: 1, transform: "translateY(0)" },
    ], { duration: 300, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" })),
    { each: 100 },
  ),

  // Pause before footer
  () => delay(400),

  // Group 4: Footer slides up
  () => animate(footer, [
    { opacity: 0, transform: "translateY(20px)" },
    { opacity: 1, transform: "translateY(0)" },
  ], { duration: 300 }),
);

entrance.play();`;
