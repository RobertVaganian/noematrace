import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { clampInspectorWidth, defaultInspectorWidth, inspectorBounds, inspectorWidthFromKey, readInspectorWidth, saveInspectorWidth } from "./inspector-layout.js";

export function InspectorSplit({ children, inspector, onResizeStart }) {
  const root = useRef(null), divider = useRef(null), drag = useRef(null), frame = useRef(null);
  const [viewport, setViewport] = useState(window.innerWidth);
  const [available, setAvailable] = useState(0);
  const [preferred, setPreferred] = useState(() => {
    try { return readInspectorWidth(localStorage, location.search); } catch { return null; }
  });
  const [resizing, setResizing] = useState(false);
  const wide = viewport > 900;
  const bounds = inspectorBounds(available);
  const initial = defaultInspectorWidth(viewport);
  const width = clampInspectorWidth(preferred ?? initial, bounds);
  const adjustable = wide && bounds.max > bounds.min;
  const clearFrame = () => { if (frame.current !== null) cancelAnimationFrame(frame.current); frame.current = null; };
  const remember = value => { try { saveInspectorWidth(localStorage, location.search, value); } catch { /* Session layout still works. */ } };
  const finish = (event, cancelled = false) => {
    const start = drag.current;
    if (!start || event.pointerId !== start.id) return;
    drag.current = null;
    clearFrame();
    const next = cancelled ? start.preference : clampInspectorWidth(start.width + start.x - event.clientX, inspectorBounds(root.current.clientWidth));
    setPreferred(next); setResizing(false);
    if (!cancelled) remember(next);
    if (divider.current?.hasPointerCapture(start.id)) divider.current.releasePointerCapture(start.id);
  };
  const reset = () => { onResizeStart?.(); setPreferred(null); remember(null); };
  const cancelDrag = useRef(null);
  cancelDrag.current = () => { if (drag.current) finish({ pointerId: drag.current.id }, true); };
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    setAvailable(root.current.clientWidth); observer.observe(root.current);
    const resize = () => { cancelDrag.current?.(); setViewport(window.innerWidth); };
    const blur = () => cancelDrag.current?.();
    window.addEventListener("resize", resize); window.addEventListener("blur", blur);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); window.removeEventListener("blur", blur); };
  }, []);
  useEffect(() => () => { clearFrame(); drag.current = null; }, []);

  return <main ref={root} className={`run-workspace ${wide ? "is-inspector-adjustable" : ""} ${resizing ? "is-inspector-resizing" : ""}`} style={wide ? { "--inspector-width": `${width}px` } : undefined}>
    {children}
    {wide && <div ref={divider} className="inspector-divider" role="separator" tabIndex={adjustable ? 0 : -1}
      aria-label="Resize step details" aria-orientation="vertical" aria-controls="step-inspector"
      aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={width} aria-valuetext={`Step details ${width} pixels wide`}
      aria-disabled={!adjustable} aria-describedby="inspector-resize-help" title="Drag to resize · ← → adjust · double-click to reset"
      onPointerDown={event => {
        if (!adjustable || event.button !== 0 || drag.current) return;
        event.preventDefault(); onResizeStart?.(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, width, preference: preferred }; setResizing(true);
      }}
      onPointerMove={event => {
        const start = drag.current;
        if (!start || event.pointerId !== start.id) return;
        const next = clampInspectorWidth(start.width + start.x - event.clientX, inspectorBounds(root.current.clientWidth));
        clearFrame(); frame.current = requestAnimationFrame(() => { frame.current = null; setPreferred(next); });
      }}
      onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)} onDoubleClick={reset}
      onKeyDown={event => {
        if (event.key === "Escape" && drag.current) { event.preventDefault(); event.stopPropagation(); cancelDrag.current(); return; }
        if (!adjustable || drag.current) return;
        const next = inspectorWidthFromKey(event.key, width, bounds, initial, event.shiftKey);
        if (next === null) return;
        event.preventDefault(); onResizeStart?.();
        if (event.key === "Enter") reset(); else { setPreferred(next); remember(next); }
      }} />}
    {inspector({ customWidth: preferred !== null, resetWidth: reset, wide })}
    {wide && <span id="inspector-resize-help" className="trace-resize-help">Drag left or right to resize step details. Arrow keys adjust by 24 pixels; hold Shift for 64. Home and End select the limits. Enter or double-click resets the width. Escape cancels a drag.</span>}
  </main>;
}
