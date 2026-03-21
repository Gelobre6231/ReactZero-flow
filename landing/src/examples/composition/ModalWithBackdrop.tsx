import { useRef, useState, useCallback, useEffect } from "react";
import { animate, sequence, parallel, stagger } from "@flow/index";
import type { Controllable } from "@flow/index";
import { useGlobalEasing } from "../../context/EasingContext";

const colors = {
  blue: "#3b82f6",
  emerald: "#10b981",
  purple: "#8b5cf6",
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
    background: "#0f1117",
    borderRadius: 12,
    border: "1px solid #1e1e2e",
    position: "relative" as const,
    height: 360,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column" as const,
  },
  // Background app content (behind modal)
  appContent: {
    flex: 1,
    padding: 16,
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  appBar: {
    height: 28,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    gap: 6,
  },
  appBarDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
  },
  appLine: (width: string) => ({
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.03)",
    width,
  }),
  triggerBtn: {
    alignSelf: "center" as const,
    marginTop: 16,
    padding: "8px 20px",
    background: colors.blue,
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  // Backdrop
  backdrop: {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    opacity: 0,
    pointerEvents: "none" as const,
  },
  // Modal
  modal: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(0.9)",
    width: 280,
    background: "#1a1d27",
    borderRadius: 12,
    border: "1px solid #2a2d3a",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    overflow: "hidden",
    opacity: 0,
    pointerEvents: "none" as const,
  },
  modalHeader: {
    padding: "16px 20px 12px",
    borderBottom: "1px solid #2a2d3a",
  },
  modalTitle: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#fff",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: "0.7rem",
    color: "#6b7280",
  },
  modalBody: {
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  modalItem: (color: string) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    opacity: 0,
    transform: "translateY(8px)",
  }),
  modalItemIcon: (color: string) => ({
    width: 28,
    height: 28,
    borderRadius: 6,
    background: `${color}20`,
    border: `1px solid ${color}40`,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  modalItemDot: (color: string) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
  }),
  modalItemText: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 3,
  },
  modalItemLine: {
    height: 5,
    borderRadius: 3,
    background: "rgba(255,255,255,0.1)",
  },
  modalActions: {
    padding: "12px 20px 16px",
    display: "flex",
    gap: 8,
    justifyContent: "flex-end",
  },
  modalBtn: (bg: string) => ({
    padding: "6px 16px",
    borderRadius: 6,
    border: bg === "transparent" ? "1px solid #2a2d3a" : "none",
    background: bg,
    color: bg === "transparent" ? "#9898a6" : "#fff",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  }),
  statusLabel: {
    fontSize: "0.7rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#6b7280",
    textAlign: "center" as const,
    marginTop: 4,
  },
};

function ModalWithBackdrop() {
  const { easingRef } = useGlobalEasing();
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const item1Ref = useRef<HTMLDivElement>(null);
  const item2Ref = useRef<HTMLDivElement>(null);
  const item3Ref = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<Controllable | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const resetToHidden = useCallback(() => {
    if (backdropRef.current) {
      backdropRef.current.style.opacity = "0";
      backdropRef.current.style.pointerEvents = "none";
    }
    if (modalRef.current) {
      modalRef.current.style.opacity = "0";
      modalRef.current.style.transform = "translate(-50%, -50%) scale(0.9)";
      modalRef.current.style.pointerEvents = "none";
    }
    for (const ref of [item1Ref, item2Ref, item3Ref]) {
      if (ref.current) {
        ref.current.style.opacity = "0";
        ref.current.style.transform = "translateY(8px)";
      }
    }
  }, []);

  const resetToVisible = useCallback(() => {
    if (backdropRef.current) {
      backdropRef.current.style.opacity = "0.5";
      backdropRef.current.style.pointerEvents = "auto";
    }
    if (modalRef.current) {
      modalRef.current.style.opacity = "1";
      modalRef.current.style.transform = "translate(-50%, -50%) scale(1)";
      modalRef.current.style.pointerEvents = "auto";
    }
    for (const ref of [item1Ref, item2Ref, item3Ref]) {
      if (ref.current) {
        ref.current.style.opacity = "1";
        ref.current.style.transform = "translateY(0)";
      }
    }
  }, []);

  const openModal = useCallback(() => {
    ctrlRef.current?.cancel();
    resetToHidden();
    setAnimating(true);
    setIsOpen(true);

    const backdrop = backdropRef.current!;
    const modal = modalRef.current!;
    const items = [item1Ref.current!, item2Ref.current!, item3Ref.current!];

    const ctrl = parallel(
      // Backdrop fades in
      () =>
        animate(
          backdrop,
          [{ opacity: 0 }, { opacity: 0.5 }],
          { duration: 300, easing: easingRef.current },
        ),
      // Modal sequence: scale bounce + content stagger
      () =>
        sequence(
          // Modal scales in with overshoot
          () =>
            animate(
              modal,
              [
                { opacity: 0, transform: "translate(-50%, -50%) scale(0.9)" },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1.03)" },
                { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
              ],
              { duration: 350, easing: easingRef.current },
            ),
          // Content items stagger in
          () =>
            stagger(
              items.map(
                (item) => () =>
                  animate(
                    item,
                    [
                      { opacity: 0, transform: "translateY(8px)" },
                      { opacity: 1, transform: "translateY(0)" },
                    ],
                    { duration: 200, easing: easingRef.current },
                  ),
              ),
              { each: 60 },
            ),
        ),
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => {
      setAnimating(false);
      // Enable pointer events after animation
      if (backdropRef.current) backdropRef.current.style.pointerEvents = "auto";
      if (modalRef.current) modalRef.current.style.pointerEvents = "auto";
    });
  }, [resetToHidden]);

  const closeModal = useCallback(() => {
    ctrlRef.current?.cancel();
    resetToVisible();
    setAnimating(true);

    const backdrop = backdropRef.current!;
    const modal = modalRef.current!;
    const items = [item1Ref.current!, item2Ref.current!, item3Ref.current!];

    const ctrl = parallel(
      // Content items fade out (reverse stagger)
      () =>
        stagger(
          [...items].reverse().map(
            (item) => () =>
              animate(
                item,
                [
                  { opacity: 1, transform: "translateY(0)" },
                  { opacity: 0, transform: "translateY(-6px)" },
                ],
                { duration: 150, easing: easingRef.current },
              ),
          ),
          { each: 40 },
        ),
      // Modal scales out
      () =>
        sequence(
          () =>
            animate(
              modal,
              [
                { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
                { opacity: 0, transform: "translate(-50%, -50%) scale(0.95)" },
              ],
              { duration: 250, easing: easingRef.current },
            ),
        ),
      // Backdrop fades out
      () =>
        animate(
          backdrop,
          [{ opacity: 0.5 }, { opacity: 0 }],
          { duration: 300, easing: easingRef.current },
        ),
    );

    ctrlRef.current = ctrl;
    ctrl.play();
    ctrl.finished.then(() => {
      setAnimating(false);
      setIsOpen(false);
      resetToHidden();
    });
  }, [resetToHidden, resetToVisible]);

  const toggle = useCallback(() => {
    if (animating) return;
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  }, [isOpen, animating, openModal, closeModal]);

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
          onClick={toggle}
          disabled={animating}
        >
          {isOpen ? "Close" : "Open"} Modal
        </button>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.7rem",
            fontFamily: "'JetBrains Mono', monospace",
            color: isOpen ? colors.emerald : "#6b7280",
          }}
        >
          {animating ? "animating..." : isOpen ? "open" : "closed"}
        </span>
      </div>

      <div style={styles.stage}>
        {/* Fake app content behind modal */}
        <div style={styles.appContent}>
          <div style={styles.appBar}>
            <div style={styles.appBarDot} />
            <div style={styles.appBarDot} />
            <div style={styles.appBarDot} />
          </div>
          <div style={styles.appLine("80%")} />
          <div style={styles.appLine("65%")} />
          <div style={styles.appLine("75%")} />
          <div style={styles.appLine("55%")} />
          <div style={styles.appLine("70%")} />
          <div style={styles.appLine("60%")} />
          <div style={styles.appLine("50%")} />
          <div style={styles.appLine("72%")} />
        </div>

        {/* Backdrop overlay */}
        <div ref={backdropRef} style={styles.backdrop} />

        {/* Modal */}
        <div ref={modalRef} style={styles.modal}>
          <div style={styles.modalHeader}>
            <div style={styles.modalTitle}>Confirm Action</div>
            <div style={styles.modalSubtitle}>Review these items before proceeding</div>
          </div>

          <div style={styles.modalBody}>
            <div ref={item1Ref} style={styles.modalItem(colors.blue)}>
              <div style={styles.modalItemIcon(colors.blue)}>
                <div style={styles.modalItemDot(colors.blue)} />
              </div>
              <div style={styles.modalItemText}>
                <div style={{ ...styles.modalItemLine, width: 100 }} />
                <div style={{ ...styles.modalItemLine, width: 70 }} />
              </div>
            </div>

            <div ref={item2Ref} style={styles.modalItem(colors.purple)}>
              <div style={styles.modalItemIcon(colors.purple)}>
                <div style={styles.modalItemDot(colors.purple)} />
              </div>
              <div style={styles.modalItemText}>
                <div style={{ ...styles.modalItemLine, width: 90 }} />
                <div style={{ ...styles.modalItemLine, width: 60 }} />
              </div>
            </div>

            <div ref={item3Ref} style={styles.modalItem(colors.emerald)}>
              <div style={styles.modalItemIcon(colors.emerald)}>
                <div style={styles.modalItemDot(colors.emerald)} />
              </div>
              <div style={styles.modalItemText}>
                <div style={{ ...styles.modalItemLine, width: 110 }} />
                <div style={{ ...styles.modalItemLine, width: 75 }} />
              </div>
            </div>
          </div>

          <div style={styles.modalActions}>
            <button type="button" style={styles.modalBtn("transparent")}>
              Cancel
            </button>
            <button type="button" style={styles.modalBtn(colors.blue)}>
              Confirm
            </button>
          </div>
        </div>
      </div>

      <div style={styles.statusLabel}>
        parallel( backdrop, sequence( modal-bounce, stagger(items) ) )
      </div>
    </div>
  );
}

export default ModalWithBackdrop;

export const code = `import { animate, sequence, parallel, stagger } from "@reactzero/animotion";

// Open: backdrop + modal bounce + content stagger
const open = parallel(
  // Backdrop fades in behind everything
  () => animate(backdrop,
    [{ opacity: 0 }, { opacity: 0.5 }],
    { duration: 300 }),

  // Modal: scale bounce, then stagger content
  () => sequence(
    () => animate(modal, [
      { opacity: 0, transform: "scale(0.9)" },
      { opacity: 1, transform: "scale(1.03)" },
      { opacity: 1, transform: "scale(1)" },
    ], { duration: 350 }),

    () => stagger(
      items.map(item => () =>
        animate(item, [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 200 })),
      { each: 60 },
    ),
  ),
);

open.play();

// Close: reverse the choreography
const close = parallel(
  () => stagger(
    [...items].reverse().map(item => () =>
      animate(item, fadeOut, { duration: 150 })),
    { each: 40 },
  ),
  () => animate(modal, scaleOut, { duration: 250 }),
  () => animate(backdrop,
    [{ opacity: 0.5 }, { opacity: 0 }],
    { duration: 300 }),
);

close.play();`;
