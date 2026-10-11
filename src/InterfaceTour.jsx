import { appUrl } from "./paths.js";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useTheme } from "./Theme.jsx";
import { nextReviewAction } from "./review-guide.js";
import { tourPlacement, tourStepCount, tourMediaRevision, tourSteps as steps, tourTargetSelectors } from "./onboarding.js";
import "./onboarding.css";
import { useAnimatedDismiss } from "./Motion.jsx";
import { TourPreview, trapTourFocus } from "./TourPreview.jsx";


export function InterfaceTour({ step, state, onStep, onDismiss, onFinish }) {
  const dialogRef = useRef(null);
  const cardRef = useRef(null);
  const titleRef = useRef(null);
  const dismiss = useAnimatedDismiss(dialogRef, { targetRef: cardRef, kind: "tour" });
  const [layout, setLayout] = useState(null);
  const [compact, setCompact] = useState(() => matchMedia("(max-width: 900px)").matches);
  const [playing, setPlaying] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { theme } = useTheme();
  const item = steps[step];
  const next = nextReviewAction(state);
  const last = step === tourStepCount - 1;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    titleRef.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      else document.querySelector('[data-tour="guide"]')?.focus();
    };
  }, []);
  useEffect(() => {
    const upcoming = steps[step + 1];
    if (!upcoming) return;
    const preview = new Image();
    preview.src = appUrl(`/tour/${upcoming.media}-${theme}.png?v=${tourMediaRevision}`);
  }, [step, theme]);

  const positioned = Boolean(layout);
  useEffect(() => { if (positioned) titleRef.current?.focus(); }, [step, positioned]);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => { if (motion.matches) setPlaying(false); };
    motion.addEventListener("change", changed);
    return () => motion.removeEventListener("change", changed);
  }, []);

  useLayoutEffect(() => {
    let frame;
    let scrolled = false;
    const measure = () => {
      const small = matchMedia("(max-width: 900px)").matches;
      setCompact(small);
      const target = tourTargetSelectors(item, small).map(selector => document.querySelector(selector)).find(element => {
        const rect = element?.getBoundingClientRect();
        return rect && rect.width > 0 && rect.height > 0;
      });
      if (!target || !cardRef.current || !target.getClientRects().length) return;
      const viewport = { width: document.documentElement.clientWidth, height: innerHeight };
      let rect = target.getBoundingClientRect();
      if (!scrolled && (rect.top < 8 || rect.bottom > viewport.height - 8)) {
        scrolled = true;
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
        rect = target.getBoundingClientRect();
      }
      const card = cardRef.current.getBoundingClientRect();
      const position = tourPlacement(rect, viewport, card);
      const spotlight = {
        left: Math.max(4, rect.left - 6),
        top: Math.max(4, rect.top - 6),
        width: Math.min(viewport.width - 4, rect.right + 6) - Math.max(4, rect.left - 6),
        height: Math.min(viewport.height - 4, rect.bottom + 6) - Math.max(4, rect.top - 6),
      };
      const value = { position, spotlight };
      setLayout((old) => JSON.stringify(old) === JSON.stringify(value) ? old : value);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    if (dialogRef.current?.open) measure();
    schedule();
    const resize = new ResizeObserver(schedule);
    resize.observe(cardRef.current);
    resize.observe(document.documentElement);
    const mutation = new MutationObserver(schedule);
    mutation.observe(document.querySelector(".app-shell"), { attributes: true, childList: true, subtree: true });
    const app = document.querySelector(".app-shell");
    app.addEventListener("animationend", schedule);
    app.addEventListener("transitionend", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      app.removeEventListener("animationend", schedule);
      app.removeEventListener("transitionend", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [step, item]);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="interface-tour"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
      onKeyDown={trapTourFocus}
      onCancel={(event) => { event.preventDefault(); dismiss(onDismiss); }}
    >
      {layout ? <div className="tour-spotlight" style={layout.spotlight} aria-hidden="true" /> : <div className="tour-loading-shade" aria-hidden="true" />}
      <section key={step} ref={cardRef} className="tour-card" style={{ ...layout?.position, visibility: layout ? "visible" : "hidden" }}>
        <header className="tour-header">
          <span className="tour-eyebrow">Quick tour <span>{step + 1} / {tourStepCount}</span></span>
          <button className="tour-skip" onClick={() => dismiss(onDismiss)}>Skip tour</button>
        </header>
        <div className="tour-progress" role="progressbar" aria-label="Tour progress" aria-valuemin={1} aria-valuemax={tourStepCount} aria-valuenow={step + 1}>
          {steps.map((entry, index) => <span key={entry.id} className={index <= step ? "is-read" : ""} />)}
        </div>
        <div className="tour-step-content" key={step}>
        <TourPreview key={`${item.media}-${theme}`} media={item.media} theme={theme} alt={item.alt} playing={playing} onPlaying={setPlaying} />
        <h2 id="tour-title" tabIndex={-1} ref={titleRef}>{item.title}</h2>
        <p id="tour-description">{compact && item.compactText ? item.compactText : item.text}</p>
        {last && <p className="tour-next-hint">Your next step: <strong>{next.title}</strong></p>}
        <footer className="tour-footer">
          <button className="tour-back" disabled={step === 0} onClick={() => onStep(step - 1)}><ArrowLeftIcon size={16} />Back</button>
          <button className="primary-button tour-next" onClick={() => last ? dismiss(() => onFinish(next.kind)) : onStep(step + 1)}>
            {last ? next.label : "Next"}<ArrowRightIcon size={16} />
          </button>
        </footer>
        </div>
      </section>
    </dialog>, document.body,
  );
}
