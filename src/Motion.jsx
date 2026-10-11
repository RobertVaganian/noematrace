import { cloneElement, useCallback, useLayoutEffect, useRef, useState } from "react";
import { exitMotion, motionDisabled } from "./motion.js";

export function useCompactNavigation() {
  const [compact, setCompact] = useState(() => matchMedia("(max-width: 1050px)").matches);
  useLayoutEffect(() => {
    const media = matchMedia("(max-width: 1050px)");
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return compact;
}

export function useAnimatedDismiss(ref, { targetRef, kind = "dialog" } = {}) {
  const pending = useRef(null);
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (media.matches) pending.current?.finish(); };
    media.addEventListener("change", change);
    return () => {
      media.removeEventListener("change", change);
      pending.current?.cancel();
      pending.current = null;
    };
  }, []);
  return useCallback((commit) => {
    if (pending.current) return;
    const element = ref.current;
    const target = targetRef?.current || element;
    const disabled = motionDisabled(location.search, matchMedia("(prefers-reduced-motion: reduce)").matches);
    const style = target ? getComputedStyle(target) : {};
    if (element?.tagName === "DIALOG") {
      element.style.setProperty("--motion-backdrop-from", getComputedStyle(element, "::backdrop").opacity);
    }
    // Install a guard before an immediate/reduced-motion completion can re-render.
    pending.current = { finish() {}, cancel() {} };
    const transition = exitMotion(element, () => {
      pending.current = null;
      commit();
    }, { target, kind, disabled, start: { opacity: style.opacity, transform: style.transform } });
    if (pending.current) pending.current = transition;
  }, [ref, targetRef, kind]);
}

// Measure the actual active tab; font loading, count badges and responsive widths are observed.
export function TabIndicator({ value }) {
  const ref = useRef(null);
  const [bounds, setBounds] = useState(null);
  useLayoutEffect(() => {
    const parent = ref.current.parentElement;
    const measure = () => {
      const active = parent.querySelector('[role="tab"][aria-selected="true"]');
      if (!active) return;
      const rect = active.getBoundingClientRect();
      const origin = parent.getBoundingClientRect();
      const next = { left: rect.left - origin.left + parent.scrollLeft, width: rect.width };
      setBounds(old => old?.left === next.left && old?.width === next.width ? old : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    parent.querySelectorAll('[role="tab"]').forEach(tab => observer.observe(tab));
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref} className="tab-indicator" aria-hidden="true" style={{ ...bounds, visibility: bounds ? "visible" : "hidden" }} />;
}


export function uiDuration(duration) {
  return motionDisabled(location.search, matchMedia("(prefers-reduced-motion: reduce)").matches) ? 0 : duration;
}

// Keep only the disappearing visual for its short exit. A reopened surface cancels the old exit.
export function MotionPresence({ show, kind, children }) {
  const element = useRef(null);
  const latest = useRef(children);
  const transition = useRef(null);
  const [retained, setRetained] = useState(show);
  if (show) latest.current = children;
  useLayoutEffect(() => {
    if (show) { setRetained(true); return; }
    if (!retained) return;
    const style = getComputedStyle(element.current);
    transition.current = exitMotion(element.current, () => setRetained(false), {
      kind, disabled: uiDuration(1) === 0,
      start: { opacity: style.opacity, transform: style.transform },
    });
    return () => { transition.current?.cancel(); transition.current = null; };
  }, [show, retained, kind]);
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => { if (media.matches) transition.current?.finish(); };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  if (!show && !retained) return null;
  return cloneElement(show ? children : latest.current, { ref: element });
}
