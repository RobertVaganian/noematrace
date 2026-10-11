import { appUrl } from "./paths.js";
import { useEffect, useRef, useState } from "react";
import { tourMediaRevision } from "./onboarding.js";
import { useAnimatedDismiss } from "./Motion.jsx";
import { ArrowsOutSimpleIcon, ArrowCounterClockwiseIcon, PauseIcon, PlayIcon, XIcon } from "@phosphor-icons/react";

export function trapTourFocus(event) {
  if (event.key !== "Tab") return;
  const controls = [...event.currentTarget.querySelectorAll("button:not(:disabled)")]
    .filter((element) => element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) {
    event.preventDefault(); last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first?.focus();
  }
}

function Clip({ base, alt, playing, videoRef, initialTime = 0, failed, onFailure, restartKey = 0 }) {
  const asset = extension => `${base}.${extension}?v=${tourMediaRevision}`;
  const [activated, setActivated] = useState(playing || initialTime > 0);
  useEffect(() => { if (playing) setActivated(true); }, [playing]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    let active = true;
    if (playing) video.play().catch((error) => {
      if (active && error.name !== "AbortError") onFailure();
    });
    else video.pause();
    return () => { active = false; video.pause(); };
  }, [base, playing, failed, activated]);
  if (!activated) return <img src={asset("png")} alt={alt} width="720" height="352" />;
  return failed
    ? <img key={restartKey} src={asset(playing ? "gif" : "png")} alt={alt} width="720" height="352" />
    : <video ref={videoRef} key={base} muted loop playsInline preload="auto" poster={asset("png")}
        aria-label={alt} width="720" height="352" onError={onFailure}
        onLoadedMetadata={(event) => { event.currentTarget.currentTime = initialTime; }}>
        <source src={asset("mp4")} type="video/mp4" />
      </video>;
}

function LargePreview({ base, alt, playing, onPlaying, initialTime, failed, onFailure, onClose }) {
  const dialog = useRef(null);
  const video = useRef(null);
  const dismiss = useAnimatedDismiss(dialog);
  const title = useRef(null);
  const [restartKey, setRestartKey] = useState(0);
  const close = () => dismiss(() => {
    const time = video.current?.currentTime ?? initialTime;
    dialog.current.close();
    onClose(time);
  });
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    title.current.focus();
    return () => {
      if (element.open) element.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className="tour-large-preview" aria-labelledby="large-preview-title"
    onKeyDown={(event) => { event.stopPropagation(); trapTourFocus(event); }}
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); close(); }}>
    <header><h2 ref={title} id="large-preview-title" tabIndex={-1}>Preview in detail</h2>
      <button className="icon-button" aria-label="Close enlarged preview" onClick={close}><XIcon size={20} /></button></header>
    <Clip base={base} alt={alt} playing={playing} videoRef={video} initialTime={initialTime} failed={failed} onFailure={onFailure} restartKey={restartKey} />
    <p>{alt}</p>
    <div className="tour-preview-controls">
      <button onClick={() => onPlaying(!playing)}>{playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}{playing ? "Pause" : "Play"}</button>
      <button onClick={() => { if (video.current) video.current.currentTime = 0; setRestartKey(value => value + 1); onPlaying(true); }}><ArrowCounterClockwiseIcon size={16} />Replay</button>
      <span>Illustration · no review changes</span>
    </div>
  </dialog>;
}

export function TourPreview({ media, theme, alt, playing, onPlaying }) {
  const video = useRef(null);
  const expandButton = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const [failed, setFailed] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const base = appUrl(`/tour/${media}-${theme}`);
  return <div className="tour-media">
    <Clip base={base} alt={alt} playing={playing && expanded === null} videoRef={video}
      failed={failed} onFailure={() => setFailed(true)} restartKey={restartKey} />
    <div className="tour-preview-controls">
      <span className="tour-preview-label">Preview</span>
      <button aria-label={playing ? "Pause preview" : "Play preview"} onClick={() => onPlaying(!playing)}>
        {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} />}</button>
      <button aria-label="Replay preview" onClick={() => { if (video.current) video.current.currentTime = 0; setRestartKey(value => value + 1); onPlaying(true); }}><ArrowCounterClockwiseIcon size={15} /></button>
      <button ref={expandButton} aria-label="Expand preview" onClick={() => setExpanded(video.current?.currentTime ?? 0)}><ArrowsOutSimpleIcon size={15} /><span>Expand</span></button>
    </div>
    {expanded !== null && <LargePreview base={base} alt={alt} playing={playing} onPlaying={onPlaying}
      initialTime={expanded} failed={failed} onFailure={() => setFailed(true)} onClose={(time) => {
        if (video.current) video.current.currentTime = time;
        setExpanded(null);
        requestAnimationFrame(() => expandButton.current?.focus());
      }} />}
  </div>;
}
