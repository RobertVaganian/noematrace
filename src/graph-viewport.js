// Pan stays inside React Flow. Only zoom changes affect arrow and dot sizes.
export function createZoomObserver(commit, request = requestAnimationFrame, cancel = cancelAnimationFrame) {
  let zoom = 1;
  let pending = 1;
  let frame = null;
  return {
    observe(viewport) {
      if (!Number.isFinite(viewport.zoom) || viewport.zoom <= 0) return;
      pending = Math.round(viewport.zoom * 1000) / 1000;
      if (pending === zoom || frame !== null) return;
      frame = request(() => {
        frame = null;
        if (pending === zoom) return;
        zoom = pending;
        commit(zoom);
      });
    },
    cancel() {
      if (frame !== null) cancel(frame);
      frame = null;
    },
  };
}
