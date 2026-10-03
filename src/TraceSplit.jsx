import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { clampLogHeight, defaultLogHeight, logHeightBounds, logHeightFromKey, readTraceHeight, saveTraceHeight } from "./trace-layout.js";

export function TraceSplit({ graph, eventCount, onResizeStart, children }) {
  const root = useRef(null);
  const divider = useRef(null);
  const drag = useRef(null);
  const frame = useRef(null);
  const pending = useRef(null);
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 901px)").matches);
  const [available, setAvailable] = useState(0);
  const [preferred, setPreferred] = useState(() => {
    try { return readTraceHeight(localStorage, location.search); } catch { return defaultLogHeight; }
  });
  const [resizing, setResizing] = useState(false);
  const bounds = logHeightBounds(available);
  const height = clampLogHeight(preferred, bounds);
  const adjustable = wide && bounds.max > bounds.min;

  const cancelFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    pending.current = null;
  };
  const remember = value => {
    try { saveTraceHeight(localStorage, location.search, value); } catch { /* View changes still work without storage. */ }
  };
  const finish = (event, cancelled = false) => {
    const start = drag.current;
    if (!start || event.pointerId !== start.id) return;
    drag.current = null;
    cancelFrame();
    const next = cancelled ? start.preference : clampLogHeight(start.height + start.y - event.clientY, bounds);
    setPreferred(next);
    setResizing(false);
    if (!cancelled) remember(next);
    if (divider.current?.hasPointerCapture(start.id)) divider.current.releasePointerCapture(start.id);
  };
  const reset = () => {
    onResizeStart?.();
    setPreferred(defaultLogHeight);
    remember(defaultLogHeight);
  };

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.height));
    setAvailable(root.current.clientHeight);
    observer.observe(root.current);
    const query = window.matchMedia("(min-width: 901px)");
    const changed = () => {
      if (drag.current) finish({ pointerId: drag.current.id }, true);
      setWide(query.matches);
    };
    const blur = () => { if (drag.current) finish({ pointerId: drag.current.id }, true); };
    query.addEventListener("change", changed);
    window.addEventListener("blur", blur);
    return () => { observer.disconnect(); query.removeEventListener("change", changed); window.removeEventListener("blur", blur); };
  }, []);
  useEffect(() => () => { cancelFrame(); drag.current = null; }, []);

  return <div ref={root} className={`trace-split ${wide ? "is-adjustable" : ""} ${resizing ? "is-resizing" : ""}`} style={wide ? { "--trace-log-height": `${height}px` } : undefined}>
    <div className="graph-canvas">{graph}</div>
    {wide && <>
      <div ref={divider} className="trace-divider" role="separator" tabIndex={adjustable ? 0 : -1}
        aria-label="Resize execution log" aria-orientation="horizontal" aria-controls="trace-execution-log"
        aria-valuemin={bounds.min} aria-valuemax={bounds.max} aria-valuenow={height}
        aria-valuetext={`Execution log ${height} pixels tall`} aria-disabled={!adjustable}
        aria-describedby="trace-resize-help" title="Drag to resize · ↑ ↓ adjust · double-click to reset"
        onPointerDown={event => {
          if (!adjustable || event.button !== 0 || drag.current) return;
          event.preventDefault();
          onResizeStart?.();
          event.currentTarget.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, y: event.clientY, height, preference: preferred };
          setResizing(true);
        }}
        onPointerMove={event => {
          const start = drag.current;
          if (!start || event.pointerId !== start.id) return;
          pending.current = clampLogHeight(start.height + start.y - event.clientY, bounds);
          if (frame.current === null) frame.current = requestAnimationFrame(() => {
            frame.current = null;
            if (pending.current !== null) setPreferred(pending.current);
          });
        }}
        onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
        onLostPointerCapture={event => finish(event, true)} onDoubleClick={reset}
        onKeyDown={event => {
          if (event.key === "Escape" && drag.current) {
            event.preventDefault();
            event.stopPropagation();
            finish({ pointerId: drag.current.id }, true);
            return;
          }
          if (!adjustable || drag.current || event.altKey || event.ctrlKey || event.metaKey) return;
          const next = logHeightFromKey(event.key, height, bounds, event.shiftKey);
          if (next === null) return;
          event.preventDefault();
          onResizeStart?.();
          setPreferred(event.key === "Enter" ? defaultLogHeight : next);
          remember(event.key === "Enter" ? defaultLogHeight : next);
        }} />
      <span id="trace-resize-help" className="trace-resize-help">Drag up to expand the log. Use Up and Down arrows to adjust, Shift for larger steps, Home or End for the limits, and Enter to reset. Escape cancels a drag.</span>
    </>}
    <section id="trace-execution-log" className="execution-log">
      <header>
        <h2>Execution log</h2><span>{eventCount} events</span>
        {wide && <button className="log-layout-reset" type="button" aria-label="Reset panel sizes" title="Reset panel sizes" disabled={preferred === defaultLogHeight} onClick={reset}><ArrowCounterClockwiseIcon size={14} aria-hidden="true" /><span>Reset size</span></button>}
      </header>
      {children}
    </section>
  </div>;
}
