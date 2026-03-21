import { useRef, useCallback, useState } from "react";
import { animate, sequence, delay } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const steps = [
  {
    title: "Welcome",
    desc: "Let's get you set up in under a minute.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    color: "#3b82f6",
  },
  {
    title: "Set Preferences",
    desc: "Choose your theme, language, and notifications.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    color: "#8b5cf6",
  },
  {
    title: "You're Ready!",
    desc: "Your workspace is configured. Let's go!",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    color: "#10b981",
  },
];

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "24px",
    padding: "8px 0",
  },
  stage: {
    position: "relative" as const,
    width: "100%",
    maxWidth: "340px",
    height: "160px",
    overflow: "hidden",
  },
  card: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    background: "#1a1d27",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #1e1e2e",
    transform: "translateX(120%)",
    opacity: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconWrap: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#fff",
  },
  cardDesc: {
    fontSize: "0.85rem",
    color: "#9898a6",
    lineHeight: 1.5,
  },
  progressBar: {
    width: "100%",
    maxWidth: "340px",
    height: "4px",
    background: "#1e1e2e",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    width: "0%",
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)",
    borderRadius: "2px",
    transition: "none",
  },
  dots: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#1e1e2e",
    transition: "background 0.3s, transform 0.3s",
  },
  dotActive: {
    transform: "scale(1.3)",
  },
};

export default function OnboardingWizard() {
  const { easingRef } = useGlobalEasing();
  const cardRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const progressRef = useRef<HTMLDivElement>(null);
  const dotRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const ctrlRef = useRef<Controllable | null>(null);
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReset = useCallback(() => {
    ctrlRef.current?.cancel();
    ctrlRef.current = null;
    setActiveStep(-1);
    setIsPlaying(false);
    for (const ref of cardRefs) {
      if (ref.current) {
        ref.current.style.transform = "translateX(120%)";
        ref.current.style.opacity = "0";
      }
    }
    if (progressRef.current) {
      progressRef.current.style.width = "0%";
    }
    for (const ref of dotRefs) {
      if (ref.current) {
        ref.current.style.background = "#1e1e2e";
        ref.current.style.transform = "scale(1)";
      }
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) return;
    handleReset();
    setIsPlaying(true);

    const card0 = cardRefs[0].current!;
    const card1 = cardRefs[1].current!;
    const card2 = cardRefs[2].current!;
    const progress = progressRef.current!;
    const dot0 = dotRefs[0].current!;
    const dot1 = dotRefs[1].current!;
    const dot2 = dotRefs[2].current!;

    const ctrl = sequence(
      // Step 1: slide in + activate dot
      () => {
        setActiveStep(0);
        return animate(dot0, [
          { background: "#1e1e2e", transform: "scale(1)" },
          { background: steps[0].color, transform: "scale(1.3)" },
        ], { duration: 200 });
      },
      () => animate(card0, [
        { transform: "translateX(120%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ], { duration: 500, easing: easingRef.current }),
      () => animate(progress, [
        { width: "0%" },
        { width: "33%" },
      ], { duration: 400, easing: easingRef.current }),
      () => delay(800),

      // Transition 1->2: slide out step 1, slide in step 2
      () => animate(card0, [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(-120%)", opacity: 0 },
      ], { duration: 400, easing: easingRef.current }),
      () => {
        setActiveStep(1);
        return animate(dot1, [
          { background: "#1e1e2e", transform: "scale(1)" },
          { background: steps[1].color, transform: "scale(1.3)" },
        ], { duration: 200 });
      },
      () => animate(card1, [
        { transform: "translateX(120%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ], { duration: 500, easing: easingRef.current }),
      () => animate(progress, [
        { width: "33%" },
        { width: "66%" },
      ], { duration: 400, easing: easingRef.current }),
      () => delay(800),

      // Transition 2->3: slide out step 2, slide in step 3
      () => animate(card1, [
        { transform: "translateX(0)", opacity: 1 },
        { transform: "translateX(-120%)", opacity: 0 },
      ], { duration: 400, easing: easingRef.current }),
      () => {
        setActiveStep(2);
        return animate(dot2, [
          { background: "#1e1e2e", transform: "scale(1)" },
          { background: steps[2].color, transform: "scale(1.3)" },
        ], { duration: 200 });
      },
      () => animate(card2, [
        { transform: "translateX(120%)", opacity: 0 },
        { transform: "translateX(0)", opacity: 1 },
      ], { duration: 500, easing: easingRef.current }),
      () => animate(progress, [
        { width: "66%" },
        { width: "100%" },
      ], { duration: 400, easing: easingRef.current }),
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => setIsPlaying(false));
  }, [isPlaying, handleReset]);

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

      <div style={styles.container}>
        <div style={styles.stage}>
          {steps.map((step, i) => (
            <div key={step.title} ref={cardRefs[i]} style={styles.card}>
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.iconWrap,
                    background: `${step.color}15`,
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  {step.icon}
                </div>
                <div style={styles.cardTitle}>{step.title}</div>
              </div>
              <div style={styles.cardDesc}>{step.desc}</div>
            </div>
          ))}
        </div>

        <div style={styles.progressBar}>
          <div ref={progressRef} style={styles.progressFill} />
        </div>

        <div style={styles.dots}>
          {steps.map((step, i) => (
            <div
              key={step.title}
              ref={dotRefs[i]}
              style={{
                ...styles.dot,
                ...(activeStep >= i ? styles.dotActive : {}),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const code = `import { animate, sequence, delay } from "@reactzero/flow";

// 3-step onboarding wizard
const wizard = sequence(
  // Step 1: Welcome
  () => animate(dot1, [
    { background: "#1e1e2e" },
    { background: "#3b82f6" },
  ], { duration: 200 }),
  () => animate(card1, [
    { transform: "translateX(120%)", opacity: 0 },
    { transform: "translateX(0)", opacity: 1 },
  ], { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
  () => animate(progress, [
    { width: "0%" }, { width: "33%" },
  ], { duration: 400 }),
  () => delay(800),

  // Transition: slide out step 1, slide in step 2
  () => animate(card1, [
    { transform: "translateX(0)" },
    { transform: "translateX(-120%)" },
  ], { duration: 400 }),
  () => animate(card2, [
    { transform: "translateX(120%)", opacity: 0 },
    { transform: "translateX(0)", opacity: 1 },
  ], { duration: 500, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }),
  () => animate(progress, [
    { width: "33%" }, { width: "66%" },
  ], { duration: 400 }),
  () => delay(800),

  // ... step 3
);

wizard.play();
await wizard.finished;`;
