import { useRef, useCallback, useState } from "react";
import { animate, sequence, delay } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const checkoutSteps = [
  {
    label: "Cart",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    content: "2 items in your cart - $59.00",
  },
  {
    label: "Shipping",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    content: "Express delivery - arrives in 2 days",
  },
  {
    label: "Payment",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    content: "Visa ending in 4242",
  },
  {
    label: "Done",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    content: "Order confirmed! Check your email.",
  },
];

const STEP_COLOR = "#3b82f6";
const DONE_COLOR = "#10b981";

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "24px",
  },
  stepper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0px",
    padding: "0 12px",
  },
  stepGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0px",
  },
  circle: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1a1d27",
    border: "2px solid #2a2d3a",
    color: "#6b7280",
    fontSize: "0.75rem",
    fontWeight: 600,
    flexShrink: 0,
    transition: "none",
    position: "relative" as const,
    zIndex: 1,
  },
  line: {
    width: "48px",
    height: "2px",
    background: "#2a2d3a",
    position: "relative" as const,
    overflow: "hidden",
  },
  lineFill: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    height: "100%",
    width: "0%",
    background: STEP_COLOR,
  },
  label: {
    fontSize: "0.68rem",
    color: "#6b7280",
    textAlign: "center" as const,
    marginTop: "6px",
    fontWeight: 500,
    position: "absolute" as const,
    bottom: "-22px",
    left: "50%",
    transform: "translateX(-50%)",
    whiteSpace: "nowrap" as const,
  },
  contentArea: {
    background: "#1a1d27",
    borderRadius: "10px",
    border: "1px solid #1e1e2e",
    padding: "20px 24px",
    minHeight: "64px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    opacity: 0,
    transform: "translateY(8px)",
  },
  contentText: {
    fontSize: "0.88rem",
    color: "#e0e0e6",
    lineHeight: 1.5,
  },
  contentIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  progressOuter: {
    width: "100%",
    height: "3px",
    background: "#1e1e2e",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    width: "0%",
    background: `linear-gradient(90deg, ${STEP_COLOR}, ${DONE_COLOR})`,
    borderRadius: "2px",
  },
};

export default function CheckoutSteps() {
  const { easingRef } = useGlobalEasing();
  const circleRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const lineRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<Controllable | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeContent, setActiveContent] = useState(-1);

  const handleReset = useCallback(() => {
    ctrlRef.current?.cancel();
    ctrlRef.current = null;
    setIsPlaying(false);
    setActiveContent(-1);
    for (const ref of circleRefs) {
      if (ref.current) {
        ref.current.style.background = "#1a1d27";
        ref.current.style.borderColor = "#2a2d3a";
        ref.current.style.color = "#6b7280";
        ref.current.style.transform = "scale(1)";
      }
    }
    for (const ref of lineRefs) {
      if (ref.current) {
        ref.current.style.width = "0%";
      }
    }
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
      contentRef.current.style.transform = "translateY(8px)";
    }
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) return;
    handleReset();
    setIsPlaying(true);

    const circles = circleRefs.map((r) => r.current!);
    const lines = lineRefs.map((r) => r.current!);
    const content = contentRef.current!;
    const progress = progressRef.current!;

    const activateCircle = (i: number) => () => {
      setActiveContent(i);
      const isLast = i === checkoutSteps.length - 1;
      const color = isLast ? DONE_COLOR : STEP_COLOR;
      return animate(circles[i], [
        { background: "#1a1d27", borderColor: "#2a2d3a", color: "#6b7280", transform: "scale(1)" },
        { background: color, borderColor: color, color: "#fff", transform: "scale(1.15)" },
        { background: color, borderColor: color, color: "#fff", transform: "scale(1)" },
      ], { duration: 400, easing: easingRef.current });
    };

    const drawLine = (i: number) => () =>
      animate(lines[i], [
        { width: "0%" },
        { width: "100%" },
      ], { duration: 350, easing: easingRef.current });

    const showContent = () =>
      animate(content, [
        { opacity: 0, transform: "translateY(8px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 300, easing: easingRef.current });

    const hideContent = () =>
      animate(content, [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-8px)" },
      ], { duration: 200, easing: easingRef.current });

    const updateProgress = (pct: string) => () =>
      animate(progress, [
        { width: progress.style.width || "0%" },
        { width: pct },
      ], { duration: 300, easing: easingRef.current });

    const ctrl = sequence(
      // Step 1: Cart
      activateCircle(0),
      showContent,
      updateProgress("25%"),
      () => delay(700),
      hideContent,

      // Line 1 draws, then Step 2: Shipping
      drawLine(0),
      activateCircle(1),
      showContent,
      updateProgress("50%"),
      () => delay(700),
      hideContent,

      // Line 2 draws, then Step 3: Payment
      drawLine(1),
      activateCircle(2),
      showContent,
      updateProgress("75%"),
      () => delay(700),
      hideContent,

      // Line 3 draws, then Step 4: Done
      drawLine(2),
      activateCircle(3),
      showContent,
      updateProgress("100%"),
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => setIsPlaying(false));
  }, [isPlaying, handleReset]);

  const currentStep = activeContent >= 0 ? checkoutSteps[activeContent] : null;
  const isLast = activeContent === checkoutSteps.length - 1;
  const accentColor = isLast ? DONE_COLOR : STEP_COLOR;

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button type="button" className="btn btn-play" onClick={handlePlay}>
          Play
        </button>
        <button type="button" className="btn btn-reset" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div style={styles.wrapper}>
        {/* Stepper indicator */}
        <div style={{ position: "relative", paddingBottom: "20px" }}>
          <div style={styles.stepper}>
            {checkoutSteps.map((step, i) => (
              <div key={step.label} style={styles.stepGroup}>
                <div style={{ position: "relative" }}>
                  <div ref={circleRefs[i]} style={styles.circle}>
                    {step.icon}
                  </div>
                  <div style={styles.label}>{step.label}</div>
                </div>
                {i < checkoutSteps.length - 1 && (
                  <div style={styles.line}>
                    <div ref={lineRefs[i]} style={styles.lineFill} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div ref={contentRef} style={styles.contentArea}>
          {currentStep && (
            <>
              <div
                style={{
                  ...styles.contentIcon,
                  background: `${accentColor}15`,
                  border: `1px solid ${accentColor}30`,
                  color: accentColor,
                }}
              >
                {currentStep.icon}
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: accentColor, marginBottom: "2px" }}>
                  {currentStep.label}
                </div>
                <div style={styles.contentText}>{currentStep.content}</div>
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div style={styles.progressOuter}>
          <div ref={progressRef} style={styles.progressInner} />
        </div>
      </div>
    </div>
  );
}

export const code = `import { animate, sequence, delay } from "@reactzero/flow";

const activateCircle = (el, color) =>
  () => animate(el, [
    { background: "#1a1d27", borderColor: "#2a2d3a", transform: "scale(1)" },
    { background: color, borderColor: color, transform: "scale(1.15)" },
    { background: color, borderColor: color, transform: "scale(1)" },
  ], { duration: 400, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });

const drawLine = (el) =>
  () => animate(el, [
    { width: "0%" }, { width: "100%" },
  ], { duration: 350, easing: "ease-out" });

// Cart -> Shipping -> Payment -> Done
const checkout = sequence(
  activateCircle(step1, "#3b82f6"),
  showContent,
  () => delay(700),
  hideContent,

  drawLine(line1),
  activateCircle(step2, "#3b82f6"),
  showContent,
  () => delay(700),
  hideContent,

  drawLine(line2),
  activateCircle(step3, "#3b82f6"),
  showContent,
  () => delay(700),
  hideContent,

  drawLine(line3),
  activateCircle(step4, "#10b981"),
  showContent,
);

checkout.play();`;
