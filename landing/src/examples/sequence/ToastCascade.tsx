import { useRef, useCallback, useState } from "react";
import { animate, sequence, delay } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const toasts = [
  {
    title: "Order placed",
    desc: "Your order #4821 has been confirmed.",
    color: "#10b981",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  {
    title: "Payment processed",
    desc: "Visa ending in 4242 was charged $59.00.",
    color: "#3b82f6",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: "Shipping started",
    desc: "Estimated delivery in 3-5 business days.",
    color: "#8b5cf6",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
];

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: "10px",
    minHeight: "200px",
    justifyContent: "center",
    padding: "0 8px",
  },
  toast: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "#1a1d27",
    borderRadius: "10px",
    padding: "14px 18px",
    width: "100%",
    maxWidth: "320px",
    border: "1px solid #1e1e2e",
    transform: "translateX(120%) translateY(8px)",
    opacity: 0,
  },
  iconCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
    minWidth: 0,
  },
  title: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#fff",
  },
  desc: {
    fontSize: "0.78rem",
    color: "#9898a6",
    lineHeight: 1.4,
  },
};

export default function ToastCascade() {
  const { easingRef } = useGlobalEasing();
  const toastRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const ctrlRef = useRef<Controllable | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleReset = useCallback(() => {
    ctrlRef.current?.cancel();
    ctrlRef.current = null;
    setIsPlaying(false);
    for (const ref of toastRefs) {
      if (ref.current) {
        ref.current.style.transform = "translateX(120%) translateY(8px)";
        ref.current.style.opacity = "0";
      }
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (isPlaying) return;
    handleReset();
    setIsPlaying(true);

    const [t0, t1, t2] = toastRefs.map((r) => r.current!);

    const slideIn = (el: Element) =>
      () => animate(el, [
        { transform: "translateX(120%) translateY(8px)", opacity: 0 },
        { transform: "translateX(0) translateY(0)", opacity: 1 },
      ], { duration: 450, easing: easingRef.current });

    const slideOut = (el: Element) =>
      () => animate(el, [
        { transform: "translateX(0) translateY(0)", opacity: 1 },
        { transform: "translateX(120%) translateY(-4px)", opacity: 0 },
      ], { duration: 350, easing: easingRef.current });

    const ctrl = sequence(
      // Cascade in
      slideIn(t0),
      () => delay(150),
      slideIn(t1),
      () => delay(150),
      slideIn(t2),

      // Hold
      () => delay(1200),

      // Cascade out in reverse
      slideOut(t2),
      () => delay(100),
      slideOut(t1),
      () => delay(100),
      slideOut(t0),
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
        {toasts.map((toast, i) => (
          <div key={toast.title} ref={toastRefs[i]} style={styles.toast}>
            <div
              style={{
                ...styles.iconCircle,
                background: `${toast.color}15`,
                border: `1px solid ${toast.color}30`,
              }}
            >
              {toast.icon}
            </div>
            <div style={styles.textWrap}>
              <div style={styles.title}>{toast.title}</div>
              <div style={styles.desc}>{toast.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const code = `import { animate, sequence, delay } from "@reactzero/flow";

const slideIn = (el) =>
  () => animate(el, [
    { transform: "translateX(120%) translateY(8px)", opacity: 0 },
    { transform: "translateX(0) translateY(0)", opacity: 1 },
  ], { duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });

const slideOut = (el) =>
  () => animate(el, [
    { transform: "translateX(0)", opacity: 1 },
    { transform: "translateX(120%)", opacity: 0 },
  ], { duration: 350, easing: "cubic-bezier(0.7, 0, 0.84, 0)" });

// Cascade in, hold, cascade out in reverse
const cascade = sequence(
  slideIn(toast1),
  () => delay(150),
  slideIn(toast2),
  () => delay(150),
  slideIn(toast3),

  () => delay(1200),

  slideOut(toast3),
  () => delay(100),
  slideOut(toast2),
  () => delay(100),
  slideOut(toast1),
);

cascade.play();`;
