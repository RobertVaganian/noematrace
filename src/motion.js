// UI-only timing. Business actions and evidence checks never wait for motion.
export const motionTiming = Object.freeze({ feedback: 110, enter: 180, exit: 120, layout: 200 });
export const motionEase = "cubic-bezier(.2,.8,.2,1)";

export function motionDisabled(search, reduced) {
  const params = new URLSearchParams(search);
  return reduced || ["capture", "embedded", "showcase"].some(key => params.has(key));
}

// A cancellable, one-shot exit: unmounting must never invoke a stale close action.
export function exitMotion(element, commit, { target = element, kind = "dialog", disabled = false, start = {} } = {}) {
  let settled = false;
  let animation;
  const clear = () => {
    if (element) {
      delete element.dataset.motionExiting;
      element.inert = false;
      element.style?.removeProperty("--motion-backdrop-from");
    }
    animation?.cancel();
  };
  const finish = () => {
    if (settled) return;
    settled = true;
    clear();
    commit();
  };
  const cancel = () => {
    if (settled) return;
    settled = true;
    clear();
  };
  if (disabled || !target?.animate) finish();
  else {
    element.dataset.motionExiting = "";
    element.inert = true;
    const transform = kind === "drawer" ? "translateX(12px)" : kind === "tour" ? "translateY(4px)" : kind === "menu" ? "translateY(-3px)" : kind === "toast" ? "translate(-50%, 6px)" : "translateY(4px) scale(.99)";
    try {
      animation = target.animate([
        { opacity: start.opacity ?? 1, transform: start.transform ?? "none" },
        { opacity: 0, transform },
      ], { duration: motionTiming.exit, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
      animation.finished.then(finish, finish);
    } catch { finish(); }
  }
  return { finish, cancel };
}
