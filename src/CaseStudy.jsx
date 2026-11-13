import { RUN_ID } from "./run-reference.js";
import { appUrl } from "./paths.js";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRightIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
  LockSimpleIcon,
  WarningCircleIcon,
  CircleIcon,
  ArrowsOutSimpleIcon,
  PlayIcon,
  PauseIcon,
} from "@phosphor-icons/react";
import { ThemeToggle, useTheme } from "./Theme.jsx";
import { Money, Modal } from "./components.jsx";

const refinements = [
  { id: "canvas", title: "Make navigation explicit.",
    text: "The gesture demonstration could be mistaken for an action on the real canvas. Direct hold-and-drag guidance replaces it, and a labelled Fit button provides a permanent way back. Draggable dividers allocate room to the graph, execution log and step details. Keyboard controls and reset actions restore a usable layout.",
    earlier: "Earlier workspace: gesture demonstration and an icon-only fit control above the event log.",
    current: "Current workspace: direct drag guidance and a permanently labelled Fit control." },
  { id: "review", title: "Keep the next action within reach.",
    text: "The test action previously scrolled with the evidence. A separate footer now keeps it visible, while the explanation states its 8–500 character requirement before submission.",
    earlier: "Earlier review: the test action shares the scrolling area with the explanation.",
    current: "Current review: persistent invoice context above the complete evidence workspace, with the test action in a separate footer." },
];

function Refinement({ item, onEnlarge }) {
  const { theme } = useTheme();
  const [version, setVersion] = useState("current");
  const label = version === "current" ? "Current prototype" : "Earlier iteration";
  const src = appUrl(`/case/${theme}/${item.id}-${version}-context.webp?v=31`);
  return <article>
    <h3>{item.title}</h3><p>{item.text}</p>
    <div className="case-evidence-toolbar">
      <div role="group" aria-label={`${item.title} Version`} className="case-version-switch">
        {[["earlier", "Before"], ["current", "After"]].map(([id, name]) => <button key={id} type="button" aria-pressed={version === id} onClick={() => setVersion(id)}>{name}</button>)}
      </div>
      <span>{label} · {item.id === "canvas" ? "Graph and execution log" : "Complete dialog"}</span>
      <button type="button" className="case-enlarge" onClick={() => onEnlarge({ src, alt: item[version], title: `${item.title} ${label}` })}><ArrowsOutSimpleIcon size={16} /> View full size</button>
    </div>
    <figure className="case-context-image">
      <button type="button" onClick={() => onEnlarge({ src, alt: item[version], title: `${item.title} ${label}` })} aria-label={`Enlarge ${label.toLowerCase()}: ${item.title}`}>
        <span className="case-refinement-frames">{["earlier", "current"].map(id => <img key={id} className={version === id ? "is-active" : ""} src={appUrl(`/case/${theme}/${item.id}-${id}-context.webp?v=31`)} alt={version === id ? item[id] : ""} aria-hidden={version !== id} width={item.id === "canvas" ? 791 : 1012} height={item.id === "canvas" ? 718 : 872} loading="eager" />)}</span>
      </button>
      <figcaption>{version === "current" ? item.current : item.earlier}</figcaption>
    </figure>
  </article>;
}

function Refinements() {
  const [enlarged, setEnlarged] = useState(null);
  return <div className="case-refinements">
    <span className="case-eyebrow">Refined through browser inspection</span>
    {refinements.map(item => <Refinement key={item.id} item={item} onEnlarge={setEnlarged} />)}
    <p className="case-refinement-scope">Actual prototype screens from earlier and current iterations, re-rendered with the current status palette and demo run reference. These changes address observed interface issues; their effect on user comprehension has not been measured.</p>
    {enlarged && <Modal title={enlarged.title} eyebrow="Interface refinement" className="case-image-modal" onClose={() => setEnlarged(null)}>
      <img src={enlarged.src} alt={enlarged.alt} />
    </Modal>}
  </div>;
}

const overviewChapters = [
  { name: "Find the mismatch", short: "Mismatch", time: 0, detail: "EUR 12,480 on the invoice. EUR 1,248 on the linked order. The run pauses before payment." },
  { name: "Test the correction", short: "Test", time: 7, detail: "Supplier, currency, total and line items must agree. The test skips payment actions." },
  { name: "Review the evidence", short: "Finance", time: 14, detail: "Finance reviews one submitted version and its test, then records a decision note." },
  { name: "Keep the history", short: "History", time: 21, detail: "Returned v1 and approved v2 retain separate tests. Correction approval does not execute payment." },
  { name: "Catch source changes", short: "Sources", time: 28, detail: "Changed source data invalidates old evidence. Its snapshot stays; a new test and review are required." },
];

function OverviewFilm({ onExpand }) {
  const { theme } = useTheme();
  const video = useRef(null), intent = useRef(false), progress = useRef(null);
  const elapsedRef = useRef(0), resume = useRef(0);
  const [active, setActive] = useState(0), [visit, setVisit] = useState(0);
  const [playing, setPlaying] = useState(false), [elapsed, setElapsed] = useState(0), [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const poster = appUrl(`/case/${theme}/chapter-${active + 1}.jpg?v=31`);
  const previous = useRef({ poster, theme, active, visit });
  const [outgoing, setOutgoing] = useState(poster);
  const clock = value => `0:${String(Math.floor(value)).padStart(2, "0")}`;
  const play = async media => {
    try { await media.play(); if (video.current === media) setError(false); }
    catch (error) { if (video.current === media && error.name !== "AbortError") { intent.current = false; setPlaying(false); setError(true); } }
  };
  useLayoutEffect(() => {
    const prior = previous.current;
    resume.current = prior.theme !== theme && prior.active === active && prior.visit === visit ? elapsedRef.current : 0;
    setOutgoing(prior.poster); setReady(false); setError(false);
    elapsedRef.current = resume.current; setElapsed(resume.current);
    previous.current = { poster, theme, active, visit };
  }, [theme, active, visit]);
  useEffect(() => {
    const media = video.current;
    if (intent.current) play(media);
  }, [active, visit, theme]);
  useEffect(() => {
    if (!playing) return;
    let frame;
    const update = () => {
      progress.current?.style.setProperty("--chapter-progress", Math.min(1, (video.current?.currentTime || 0) / 7));
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [playing, active, visit, theme]);
  const choose = index => {
    elapsedRef.current = 0; setElapsed(0);
    progress.current?.style.setProperty("--chapter-progress", 0);
    setActive(index); setVisit(value => value + 1);
  };
  const toggle = () => {
    const media = video.current;
    if (!media) return;
    if (intent.current) { intent.current = false; media.pause(); setPlaying(false); }
    else { intent.current = true; if (media.ended) choose(0); else play(media); }
  };
  const currentMedia = event => video.current === event.currentTarget;
  return <div className="case-film">
    <div className="case-film-chapters" role="group" aria-label="Overview chapters">
      {overviewChapters.map((chapter, i) => <button key={chapter.name} type="button" aria-pressed={active === i} onClick={() => choose(i)} aria-label={`Chapter ${i + 1}: ${chapter.name}`}><span>0{i + 1}</span><span className="chapter-label">{chapter.name}</span><span className="chapter-short">{chapter.short}</span></button>)}
    </div>
    <div className="case-film-stage" aria-busy={!ready}>
      <img className="case-film-outgoing" src={outgoing} alt="" aria-hidden="true" width="1600" height="1000" />
      <video key={`${theme}-${active}-${visit}`} ref={video} className={ready ? "is-ready" : ""} muted playsInline preload="auto" poster={poster}
        onLoadedMetadata={event => { if (currentMedia(event) && resume.current) event.currentTarget.currentTime = Math.min(6.99, resume.current); }}
        onLoadedData={event => { if (currentMedia(event)) setReady(true); }}
        onPlay={event => { if (currentMedia(event)) setPlaying(true); }} onPause={event => { if (currentMedia(event)) setPlaying(false); }}
        onTimeUpdate={event => { if (currentMedia(event)) { elapsedRef.current = event.currentTarget.currentTime; setElapsed(event.currentTarget.currentTime); } }}
        onEnded={event => { if (!currentMedia(event)) return; setElapsed(7); progress.current?.style.setProperty("--chapter-progress", 1); if (intent.current && active < 4) choose(active + 1); else { intent.current = false; setPlaying(false); } }}
        onError={event => { if (currentMedia(event)) { setReady(true); setError(true); intent.current = false; setPlaying(false); } }}
        aria-label={`Chapter ${active + 1}: ${overviewChapters[active].name}. Seven-second silent screen walkthrough.`} aria-describedby="case-film-description">
        <source src={appUrl(`/case/${theme}/chapter-${active + 1}.mp4?v=31`)} type="video/mp4" />
        Read the complete walkthrough below.
      </video>
    </div>
    <div ref={progress} className="case-film-progress" role="progressbar" aria-label="Overview progress" aria-valuemin={0} aria-valuemax={35} aria-valuenow={Math.round(active * 7 + elapsed)} style={{ "--chapter-progress": Math.min(1, elapsed / 7) }}>
      {overviewChapters.map(chapter => <span key={chapter.name} className={chapter.time < active * 7 ? "complete" : chapter.time === active * 7 ? "current" : ""}><i /></span>)}
    </div>
    <div className="case-film-controls" role="group" aria-label="Video controls">
      <button type="button" onClick={toggle} aria-label={playing ? "Pause overview" : "Play overview"}>{playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}<span>{playing ? "Pause" : "Play"}</span></button>
      <span className="case-film-time">{clock(active * 7 + elapsed)} / 0:35</span>
      <span className="case-film-instruction">Select a chapter above</span>
      {onExpand && <button type="button" onClick={() => { intent.current = false; video.current?.pause(); setPlaying(false); onExpand(active * 7); }} aria-label="Inspect current frame" title="View this frame at full size"><ArrowsOutSimpleIcon size={18} /></button>}
    </div>
    <p id="case-film-description" className="case-film-description">{overviewChapters[active].detail}</p>
    {error && <p className="case-film-error" role="status">Playback is unavailable. Select another chapter, inspect its frame or read the walkthrough below.</p>}
  </div>;
}

function Overview() {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(null);
  return <section className="case-overview case-wide" aria-labelledby="overview-title">
    <div className="case-overview-copy">
      <span className="case-eyebrow">35 seconds · Five chapters</span>
      <h2 id="overview-title" tabIndex={-1}>From a mismatch to a traceable decision.</h2>
      <p>Follow the review, or jump to a chapter. An edited walkthrough of real prototype screens, with synthetic records and simulated roles.</p>
    </div>
    <OverviewFilm onExpand={setExpanded} />
    <details className="case-overview-transcript"><summary>Read the complete walkthrough</summary>
      <ol>{overviewChapters.map(chapter => <li key={chapter.name}><strong>{chapter.name}.</strong> {chapter.detail}</li>)}</ol>
      <p>Playback is an edited sequence of actual screens, not a live review session. It does not change your review.</p>
    </details>
    {expanded !== null && <Modal title={overviewChapters[Math.min(4, Math.floor(expanded / 7))].name} eyebrow="Actual prototype screen" className="case-image-modal case-frame-modal" onClose={() => setExpanded(null)}>
      <img src={appUrl(`/case/${theme}/state-${Math.min(4, Math.floor(expanded / 7)) + 1}.jpg?v=31`)} alt={overviewChapters[Math.min(4, Math.floor(expanded / 7))].detail} />
      <p>{overviewChapters[Math.min(4, Math.floor(expanded / 7))].detail}</p>
    </Modal>}
  </section>;
}

const views = [
  {
    id: "comparison",
    name: "Test the correction",
    title: "A passing test is evidence for review.",
    text: "The proposed order matches the supplier, currency, total and individual line items. The comparison keeps the original failure visible. Payment steps are skipped.",
    alt: "Original order PO-731 compared with proposed order PO-732, with four matching checks and a read-only test label.",
  },
  {
    id: "finance",
    name: "Review the proposal",
    title: "A person decides on a specific version.",
    text: "Finance reviews the submitted source snapshot, the operator’s explanation and the scope of the correction. A note records the reason for approving or returning it.",
    alt: "Finance review of proposal v1, with tested document versions and the required decision note.",
  },
  {
    id: "history",
    name: "Inspect the history",
    title: "A new version keeps the earlier decision intact.",
    text: "In this demonstration, v1 is returned for clarification. The operator creates and tests v2. Its approval refers to a different test, while the original note remains available.",
    alt: "Proposal history showing returned v1 with test TST-001 and approved v2 with test TST-002.",
  },
  {
    id: "stale",
    name: "Change the evidence",
    title: "An old approval cannot follow new evidence.",
    text: "Updating the ERP record makes the earlier test outdated. Its snapshot is preserved for history, but it no longer supports approval. Restoring matching values still requires a fresh test.",
    alt: "An outdated proposal with a warning that the tested order was version 1.4 and the current source is version 1.5.",
  },
];

function ProductView({ scene = "trace", description, compact = false }) {
  const root = useRef(null);
  const [width, setWidth] = useState(1100);
  const sourceWidth = compact ? 1180 : 1487;
  const sourceHeight = compact ? 900 : 1058;
  useLayoutEffect(() => {
    setWidth(root.current.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  const href = scene === "trace" ? appUrl() : appUrl(`?showcase=${scene}`);
  return (
    <figure className="case-product-view">
      <div className="case-product-bar">
        <span>
          <CircleIcon size={6} weight="fill" />
          NoemaTrace /{" "}
          {scene === "trace"
            ? `Run ${RUN_ID}`
            : scene === "history"
              ? "Proposal history"
              : "Context review"}
        </span>
        <a href={href}>
          Open this view
          <ArrowUpRightIcon size={14} />
        </a>
      </div>
      <div
        ref={root}
        className="case-frame-stage"
        style={{ aspectRatio: `${sourceWidth} / ${sourceHeight}` }}
      >
        <iframe
          key={scene}
          src={appUrl(`?showcase=${scene}&embedded=1`)}
          title={description}
          tabIndex={-1}
          aria-hidden="true"
          inert
          loading="lazy"
          style={{
            width: sourceWidth,
            height: sourceHeight,
            transform: `scale(${width / sourceWidth})`,
          }}
        />
        <a
          className="case-frame-link"
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          aria-label={`Open full-size prototype: ${description}`}
        >
          <span>
            Explore the prototype
            <ArrowUpRightIcon size={16} />
          </span>
        </a>
      </div>
      <figcaption>
        {description}
        <span>Synthetic demonstration data</span>
      </figcaption>
    </figure>
  );
}

function Chapter({ number, id, title, children, className = "" }) {
  return (
    <section id={id} className={`case-chapter ${className}`}>
      <div className="case-chapter-number">{number}</div>
      <div className="case-chapter-content">
        <h2 tabIndex={-1}>{title}</h2>
        {children}
      </div>
    </section>
  );
}

export function CaseStudy() {
  const [active, setActive] = useState("comparison");
  const tabs = useRef([]);
  const tabKey = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % views.length;
    else if (event.key === "ArrowLeft")
      next = (index + views.length - 1) % views.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = views.length - 1;
    else return;
    event.preventDefault();
    setActive(views[next].id);
    tabs.current[next]?.focus();
  };
  const view = views.find((v) => v.id === active);
  useEffect(() => {
    document.title = "NoemaTrace — Robert Vaganian";
  }, []);
  useEffect(() => {
    // A cold fragment arrives before this lazy-loaded page exists. Restore it
    // after fonts settle, but never pull a visitor back after they interact.
    const hash = location.hash;
    if (!hash || hash === "#top") return;
    let cancelled = false;
    let frame;
    const cancel = () => { cancelled = true; cancelAnimationFrame(frame); };
    const cancelOnKey = event => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"].includes(event.key)) cancel();
    };
    const events = ["wheel", "touchstart", "pointerdown"];
    events.forEach(type => window.addEventListener(type, cancel, { passive: true }));
    window.addEventListener("keydown", cancelOnKey);
    Promise.resolve(document.fonts?.ready).then(() => {
      if (cancelled) return;
      frame = requestAnimationFrame(() => {
        if (cancelled || location.hash !== hash) return;
        const target = document.getElementById(hash.slice(1));
        if (!target) return;
        target.scrollIntoView({ block: "start", behavior: "instant" });
        const heading = target.matches("h1, h2") ? target : target.querySelector("h1, h2");
        heading?.focus({ preventScroll: true });
      });
    });
    return () => {
      cancel();
      events.forEach(type => window.removeEventListener(type, cancel));
      window.removeEventListener("keydown", cancelOnKey);
    };
  }, []);
  return (
    <div className="case-study" id="top">
      <a className="case-skip" href="#case-content">
        Skip to case study
      </a>
      <header className="case-header">
        <a href="#top" className="case-author">
          Robert Vaganian<span>Product design</span>
        </a>
        <nav aria-label="Case study navigation">
          <ThemeToggle />
          <a href="#decisions" className="case-header-index">
            Design decisions
          </a>
          <a className="case-open-button" href={appUrl()}>
            Open prototype
            <ArrowUpRightIcon size={15} />
          </a>
        </nav>
      </header>
      <main id="case-content">
        <section className="case-hero">
          <div className="case-kicker">
            <span>Workflow review</span>
            <span>Self-initiated concept</span>
          </div>
          <p className="case-project-name"><img className="case-brand-mark" src={appUrl("/brand/noematrace-mark.png")} width="40" height="40" alt="" />NoemaTrace</p>
          <h1 tabIndex={-1}>
            When a workflow stops,
            <br className="case-desktop-break" /> the next step should be clear.
          </h1>
          <p className="case-intro">
            An evidence-first workspace for inspecting a blocked invoice
            process, testing a correction and recording a human decision.
          </p>
          <dl className="case-meta">
            <div>
              <dt>Design direction</dt>
              <dd>Robert Vaganian</dd>
            </div>
            <div>
              <dt>Platform</dt>
              <dd>Desktop web</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>Evidence, versions, decisions</dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>Interactive prototype</dd>
            </div>
          </dl>
        </section>
        <div className="case-wide">
          <ProductView description="The original run: an amount mismatch pauses the workflow before payment preparation." />
        </div>
        <div className="case-reading">
          <Chapter
            number="01"
            id="problem"
            title="The mismatch is simple. The next decision takes work."
          >
            <p>
              An invoice is linked to the wrong purchase order. The workflow
              stops when their totals disagree. The reviewer needs to establish
              which record belongs to the invoice, explain the correction and
              hand it over for an independent decision.
            </p>
            <div className="case-source-comparison">
              <div>
                <span>Invoice / INV-2048</span>
                <strong>
                  <Money cents={1248000} />
                </strong>
                <small>Northline Components · PDF v1.0</small>
              </div>
              <div>
                <span>Linked order / PO-731</span>
                <strong>
                  <Money cents={124800} />
                </strong>
                <small>Northline Components · ERP v3.2</small>
              </div>
            </div>
            <p className="case-keyline">
              <WarningCircleIcon size={18} />
              <span>
                The invoice has no purchase order reference. Matching the amount
                alone would not establish the correct association.
              </span>
            </p>
          </Chapter>
          <Chapter
            number="02"
            id="workflow"
            title="One correction. Two separate responsibilities."
          >
            <p>
              The operations reviewer prepares and tests a proposal. The finance
              approver inspects that submitted version and records a decision.
              The original run stays available throughout.
            </p>
            <ol className="case-workflow">
              <li>
                <span>01</span>
                <div>
                  <strong>Inspect</strong>
                  <p>Compare the invoice with the linked order.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Test</strong>
                  <p>Check the proposed association without payment actions.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Submit</strong>
                  <p>Preserve the source versions and an explanation.</p>
                </div>
              </li>
              <li>
                <span>04</span>
                <div>
                  <strong>Decide</strong>
                  <p>Approve the correction or return it with a note.</p>
                </div>
              </li>
            </ol>
          </Chapter>
        </div>
        <Overview />
        <section
          className="case-explorer case-wide"
          id="explore"
          aria-labelledby="explorer-title"
        >
          <header>
            <span className="case-eyebrow">Inside the workflow</span>
            <h2 id="explorer-title" tabIndex={-1}>Follow a decision through its states.</h2>
            <p>
              Choose a state to inspect. Each view is rendered by the working
              prototype.
            </p>
          </header>
          <div
            className="case-state-tabs"
            role="tablist"
            aria-label="Workflow states"
          >
            {views.map((v, i) => (
              <button
                key={v.id}
                id={`state-${v.id}`}
                role="tab"
                ref={(el) => (tabs.current[i] = el)}
                tabIndex={active === v.id ? 0 : -1}
                onKeyDown={(e) => tabKey(e, i)}
                aria-selected={active === v.id}
                aria-controls="state-preview"
                onClick={() => setActive(v.id)}
              >
                <span>0{i + 1}</span>
                {v.name}
              </button>
            ))}
          </div>
          <div
            key={active}
            id="state-preview"
            className="motion-content"
            role="tabpanel"
            aria-labelledby={`state-${active}`}
          >
            <div className="case-state-explanation" aria-live="polite">
              <h3>{view.title}</h3>
              <p>{view.text}</p>
            </div>
            <ProductView scene={active} compact description={view.alt} />
          </div>
        </section>
        <div className="case-reading">
          <Chapter
            number="03"
            id="decisions"
            title="Make the evidence boundary visible."
          >
            <div className="case-decision-list">
              <article>
                <span className="case-decision-label">Association</span>
                <h3>Four checks before submission.</h3>
                <p>
                  Supplier, currency, total and line items are checked together.
                  A second order has the same total but a different supplier, so
                  the demonstration exposes the weakness of amount-only
                  matching. A field-by-field invoice and order comparison makes
                  the conflicting values visible before testing and preserves
                  that comparison in the submitted test snapshot.
                </p>
              </article>
              <article>
                <span className="case-decision-label">Version</span>
                <h3>A decision belongs to a proposal and a test.</h3>
                <p>
                  Editing a draft invalidates its result. Returning a proposal
                  creates a path to a new version. Each submitted version keeps
                  its own explanation, test ID and document snapshot.
                </p>
              </article>
              <article>
                <span className="case-decision-label">Freshness</span>
                <h3>Restored data does not restore approval.</h3>
                <p>
                  A changed record or unavailable source makes the earlier
                  evidence insufficient. Even when access or matching values
                  return, the reviewer must test again.
                </p>
              </article>
              <article>
                <span className="case-decision-label">Execution</span>
                <h3>Approve the correction with a clear scope.</h3>
                <p>
                  The decision records approval of the association. Payment
                  creation, submission and authorization are outside this
                  prototype. The interface keeps that boundary beside the
                  decision.
                </p>
              </article>
            </div>
          </Chapter>
          <Chapter
            number="04"
            id="interface"
            title="A quiet interface for a consequential review."
          >
            <p>
              The selected direction combines a dependency graph, a persistent
              detail panel and a chronological events view. A small warning icon
              marks the conflict; document values and the primary action carry
              the hierarchy. Tabular figures align the amounts, while equally
              sized event badges give the log a consistent reading rhythm.
            </p>
            <p className="case-tour-note"><strong>A seven-step introduction.</strong> Optional looping examples explain navigation, panel resizing, read-only testing, version-specific decisions and stale evidence. Each animation focuses on its action, with explanations in the accompanying text. Pause or enlarge any example; the review stays unchanged. <a href={appUrl("?guide=1")}>Open the review guide <ArrowUpRightIcon size={13} /></a></p>
            <div className="case-design-notes">
              <article>
                <h3>Graph or evidence first?</h3>
                <p>
                  The graph preserves the relationship between the source, check
                  and downstream action. An evidence-first split view remains an
                  alternative to test if the graph slows the initial diagnosis.
                </p>
              </article>
              <article>
                <h3>Readable status, not color alone.</h3>
                <p>
                  Labels and icons distinguish a mismatch, a passing test and
                  outdated evidence. Healthy steps remain subdued, so the
                  unresolved decision receives attention.
                </p>
              </article>
            </div>
            <Refinements />
          </Chapter>
          <Chapter
            number="05"
            id="verification"
            title="What the current prototype establishes."
          >
            <ul className="case-verification">
              <li>
                <CheckIcon size={17} />
                <span>
                  <strong>95 automated behavior checks</strong> cover evidence
                  matching, roles, revisions, stale results, version-specific
                  decisions, export, local recovery, field differences and
                  state-aware review guidance, seven-step tour recovery, placement, isolated navigation preferences, cancellation of interrupted UI motion, event-to-step navigation, panel-size limits, keyboard resizing, isolated layout preferences and migration of saved tour progress.
                </span>
              </li>
              <li><CheckIcon size={17} /><span><strong>11 animation and media checks</strong> verify centred Fit, visible workflow bounds, the click target, all seven tour loops in both themes, bounded divider demonstrations, clipped event text during resize, click timing and independent seven-second overview chapters.</span></li>
              <li>
                <CheckIcon size={17} />
                <span>
                  <strong>4 hosting checks</strong> cover asset serving,
                  application fallback and build packaging.
                </span>
              </li>
              <li>
                <CheckIcon size={17} />
                <span>
                  <strong>Browser walkthroughs</strong> include a returned v1,
                  approved v2, changed ERP data, lost source access and
                  compact-screen review. The final layout pass covers seven
                  viewport widths from 360 to 1363 px.
                </span>
              </li>
            </ul>
            <div className="case-scope">
              <LockSimpleIcon size={18} />
              <p>
                This is a self-initiated prototype with synthetic records,
                review state saved in the browser and simulated roles. It has no
                live ERP or payment connection. Participant usability sessions
                have not been conducted.
              </p>
            </div>
          </Chapter>
          <Chapter number="06" id="next" title="What remains to validate.">
            <p>
              Current evaluation consists of structured interface inspection,
              browser walkthroughs and automated checks. It establishes the
              implemented behavior; comprehension by operations reviewers and
              finance approvers remains an open question.
            </p>
            <p>
              If participant access becomes available, the next sessions should
              examine association evidence, outdated snapshots and the
              distinction between correction approval and payment execution.
            </p>
          </Chapter>
        </div>
        <section className="case-end case-wide">
          <div>
            <span className="case-eyebrow">Explore NoemaTrace</span>
            <h2>
              Inspect the evidence.
              <br />
              Make the next decision.
            </h2>
          </div>
          <a className="case-open-button case-end-button" href={appUrl()}>
            Open the working prototype
            <ArrowRightIcon size={17} />
          </a>
        </section>
      </main>
      <footer className="case-footer">
        <span>Robert Vaganian · NoemaTrace</span>
        <a href="#top">
          Back to top
          <ArrowUpIcon size={14} />
        </a>
      </footer>
    </div>
  );
}
