import { appUrl } from "./paths.js";
import { AuditExplorer } from "./AuditExplorer.jsx";
import { ThemeToggle, useTheme } from "./Theme.jsx";
import { showcaseScene } from "./showcase.js";
import { VersionComparison } from "./VersionComparison.jsx";
import { isPersistentReview, readReview, writeReview } from "./persistence.js";
import { invoiceFieldEvidence } from "./evidence.js";
import {
  workflowConnections,
  eventNodeId,
  nodeFocus,
  connectionContext,
  connectionPalette,
  desktopViewport,
} from "./graph.js";
import {
  ProposalHistory,
  ProposalDialog,
  DemoControls,
} from "./ProposalReview.jsx";
import { IconButton, Modal, DialogCloseButton, DocumentRecord, Money, DataText, moveTabFocus } from "./components.jsx";
import { Review } from "./Review.jsx";
import { ReviewGuide } from "./ReviewGuide.jsx";
import { MotionPresence, TabIndicator, uiDuration, useAnimatedDismiss, useCompactNavigation } from "./Motion.jsx";
import { InterfaceTour } from "./InterfaceTour.jsx";
import { TraceSplit } from "./TraceSplit.jsx";
import { InspectorSplit } from "./InspectorSplit.jsx";
import { readTour, saveTour, initialTourStep, tourPreferencesEnabled, readNavigation, saveNavigation } from "./onboarding.js";
import { useState, useEffect, useMemo, useReducer, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  MarkerType,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  FileIcon,
  PulseIcon,
  ClipboardTextIcon,
  InfoIcon,
  CopyIcon,
  ArrowSquareOutIcon,
  DatabaseIcon,
  ListBulletsIcon,
  CalculatorIcon,
  PaperPlaneTiltIcon,
  PauseCircleIcon,
  WarningCircleIcon,
  XIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsOutSimpleIcon,
  MinusIcon,
  PlusIcon,
  ArrowCounterClockwiseIcon,
  SlidersHorizontalIcon,
  ClockIcon,
  LockSimpleIcon,
  DownloadSimpleIcon,
  HandIcon,
  QuestionIcon,
  CaretDownIcon,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import {
  invoice,
  orders,
  baseEvents,
  reducer,
  people,
  latestProposal,
  proposalLabels,
} from "./model.js";
const nodeIcons = {
  invoice: FileIcon,
  extract: ListBulletsIcon,
  order: DatabaseIcon,
  compare: CalculatorIcon,
  prepare: ClipboardTextIcon,
  submit: PaperPlaneTiltIcon,
};
const specs = [
  {
    id: "invoice",
    position: {
      x: 20,
      y: 100,
    },
    data: {
      title: "Invoice",
      sub: "INV-2048",
      type: "PDF",
    },
  },
  {
    id: "extract",
    position: {
      x: 214,
      y: 100,
    },
    data: {
      title: "Extract fields",
      sub: "6 fields",
    },
  },
  {
    id: "order",
    position: {
      x: 20,
      y: 346,
    },
    data: {
      title: "Purchase order",
      sub: "PO-731",
      type: "ERP",
    },
  },
  {
    id: "compare",
    position: {
      x: 333,
      y: 220,
    },
    data: {
      title: "Compare totals",
      sub: "Check amounts",
      status: "conflict",
      tag: "Conflict",
    },
  },
  {
    id: "prepare",
    position: {
      x: 543,
      y: 220,
    },
    data: {
      title: "Prepare payment",
      sub: "Create payment",
      status: "blocked",
      tag: "Blocked",
    },
  },
  {
    id: "submit",
    position: {
      x: 737,
      y: 220,
    },
    data: {
      title: "Submit payment",
      sub: "To bank",
      status: "blocked",
      tag: "Not started",
    },
  },
];
function WorkflowNode({ id, data, selected }) {
  const I = nodeIcons[id];
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.compact, updateNodeInternals]);
  return (
    <div
      className={`workflow-node ${data.compact ? "compact-node" : ""} ${data.status || "complete"} ${selected ? "is-selected" : ""} ${data.related ? "is-related" : ""} ${data.previewed ? "is-previewed" : ""}`}
      data-tour={id === "compare" ? "conflict" : undefined}
    >
      {id !== "invoice" && id !== "order" && id !== "compare" && (
        <Handle
          type="target"
          position={data.compact ? Position.Top : Position.Left}
          id="input"
        />
      )}
      {id === "compare" && (
        <>
          <Handle
            type="target"
            position={data.compact ? Position.Left : Position.Top}
            id="extracted"
          />
          <Handle
            type="target"
            position={data.compact ? Position.Top : Position.Left}
            id="order"
          />
        </>
      )}
      <div className="node-heading"><I size={16} /><span>{data.title}</span>
        {data.status === "conflict" && <WarningCircleIcon className="node-warning" size={13} weight="fill" />}
      </div>
      <div className="node-metadata"><DataText>{`${data.sub}${data.type ? ` · ${data.type}` : ""}`}</DataText></div>
      {id !== "submit" && (
        <Handle
          type="source"
          id="output"
          position={
            data.compact && id !== "extract" ? Position.Bottom : Position.Right
          }
        />
      )}
      {data.tag && <span className="node-tag">{data.tag}</span>}
    </div>
  );
}
const nodeTypes = {
  workflow: WorkflowNode,
};
function GraphTools({ onReset, onExplore }) {
  const f = useReactFlow();
  return (
    <div className="graph-tools" data-tour="canvas-tools">
      <IconButton
        label="Zoom out"
        onClick={() => { onExplore();
          f.zoomOut({
            duration: uiDuration(180),
          });
        }}
      >
        <MinusIcon size={15} />
      </IconButton>
      <IconButton
        label="Zoom in"
        onClick={() => { onExplore();
          f.zoomIn({
            duration: uiDuration(180),
          });
        }}
      >
        <PlusIcon size={15} />
      </IconButton>
      <button
        className="graph-fit-button"
        aria-label="Fit workflow to view"
        title="Fit all steps in the center of the canvas"
        onClick={onReset}
      >
        <ArrowsOutSimpleIcon size={15} aria-hidden="true" />
        <span>Fit</span>
      </button>
    </div>
  );
}
const compactPositions = {
  invoice: { x: 16, y: 16 },
  order: { x: 224, y: 16 },
  extract: { x: 16, y: 140 },
  compare: { x: 224, y: 140 },
  prepare: { x: 224, y: 264 },
  submit: { x: 224, y: 388 },
};
function Graph({ selected, previewed, onSelect, focusRequest, onFocusApplied, onCancelFocus, explored, onExplore }) {
  const { theme } = useTheme();
  const [compact, setCompact] = useState(false);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState(null);
  const root = useRef(null);
  const initialViewport = useRef(null);
  const flow = useRef(null);
  const [viewport, setViewport] = useState({
    x: 8,
    y: 10,
    zoom: 1,
  });
  const context = useMemo(() => connectionContext(selected), [selected]);
  const palette = connectionPalette[theme];
  const markerSize = Math.round((32 / viewport.zoom) * 10) / 10;
  const edges = useMemo(
    () =>
      workflowConnections.map((connection) => {
        const focused = context.edgeIds.includes(connection.id);
        const conflict = connection.target === "compare";
        const color = conflict ? palette.conflict : focused ? palette.focus : palette.line;
        return {
          ...connection,
          type: "smoothstep",
          selectable: false,
          className: `${focused ? "focused-connection" : "workflow-connection"} ${conflict ? "evidence-conflict" : ""}`,
          ariaLabel: `${specs.find((n) => n.id === connection.source).data.title} to ${specs.find((n) => n.id === connection.target).data.title}${connection.blocked ? ": dependency, execution not started" : ": recorded dependency"}`,
          pathOptions: { borderRadius: 10, offset: 16 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: markerSize,
            height: markerSize,
            markerUnits: "userSpaceOnUse",
            color,
            strokeWidth: 0.7,
          },
          style: { stroke: color, strokeWidth: focused ? 2.4 : 1.9 },
        };
      }),
    [context, palette, markerSize, selected],
  );
  const nodes = useMemo(
    () =>
      specs.map((n) => ({
        ...n,
        position: compact ? compactPositions[n.id] : n.position,
        data: {
          ...n.data,
          compact,
          related: context.nodeIds.includes(n.id) && n.id !== selected,
          previewed: n.id === previewed,
        },
        type: "workflow",
        selected: selected === n.id,
        ariaLabel: `${n.data.title}: ${n.data.tag || "Completed"}. Incoming: ${connectionContext(n.id).incoming.length}. Outgoing: ${connectionContext(n.id).outgoing.length}.`,
        draggable: false,
      })),
    [selected, compact, context, previewed],
  );
  const resetView = () => {
    onExplore();
    onCancelFocus?.();
    const fitted = initialViewport.current;
    if (!fitted) return;
    flow.current?.setViewport(fitted, { duration: uiDuration(220), ease: t => 1 - Math.pow(1 - t, 3), interpolate: "linear" });
  };
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const small = width < 560;
      setCompact(small);
      setSize(old => old?.width === width && old?.height === height ? old : { width, height });
      if (small) {
        const zoom = Math.min(1, (width - 30) / 382, (height - 32) / 472);
        const next = {
          x: (width - 382 * zoom) / 2 - 16 * zoom,
          y: (height - 472 * zoom) / 2 - 16 * zoom,
          zoom,
        };
        initialViewport.current = next;
        flow.current?.setViewport(next, { duration: 0 });
        setViewport(next);
        return;
      }
      const next = desktopViewport(width, height);
      initialViewport.current = next;
      flow.current?.setViewport(next, { duration: 0 });
      setViewport(next);
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!ready || !size || !focusRequest) return;
    let active = true;
    let frame;
    // Let responsive node measurements settle before using their actual bounds.
    const first = requestAnimationFrame(() => {
      frame = requestAnimationFrame(async () => {
        const node = flow.current?.getInternalNode(focusRequest.nodeId);
        if (!active || !node) return;
        const target = nodeFocus(node, initialViewport.current?.zoom);
        await flow.current.setCenter(target.x, target.y, { zoom: target.zoom, duration: uiDuration(180) });
        if (!active) return;
        root.current?.querySelector(`[data-id="${focusRequest.nodeId}"]`)?.focus({ preventScroll: true });
        onFocusApplied(focusRequest);
      });
    });
    return () => { active = false; cancelAnimationFrame(first); cancelAnimationFrame(frame); };
  }, [focusRequest, ready, size, compact]);
  return (
    <div
      ref={root}
      className="trace-viewport"
      style={{ "--graph-edge": palette.line, "--graph-focus": palette.focus }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultViewport={viewport}
        onViewportChange={setViewport}
        onMoveStart={(event) => { if (event?.isTrusted && root.current?.contains(event.target)) onExplore(); }}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          flow.current = instance;
          if (initialViewport.current) instance.setViewport(initialViewport.current, { duration: 0 });
          setReady(true);
        }}
        onNodeClick={(_, n) => onSelect(n.id)}
        onNodesChange={(changes) => {
          const change = changes.find((c) => c.type === "select" && c.selected);
          if (change) onSelect(change.id);
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        minZoom={0.35}
        maxZoom={1.6}
        colorMode={theme}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5 / viewport.zoom}
          color="var(--graph-dot)"
        />
        <GraphTools onReset={resetView} onExplore={onExplore} />
      </ReactFlow>
      <div className={`canvas-guide ${explored ? "is-dismissed" : ""}`} role="group" aria-label="Graph navigation" aria-hidden={explored}>
        <HandIcon size={16} aria-hidden="true" />
        <span className="pan-hint-pointer">Click and hold empty space, then drag.</span>
        <span className="pan-hint-touch">Touch and hold empty space, then drag.</span>
      </div>
      <span
        className="canvas-instruction"
        role="status"
        title="Direct connections of the selected step are highlighted."
      >
        {context.incoming.length}{" "}
        {context.incoming.length === 1 ? "input" : "inputs"} ·{" "}
        {context.outgoing.length}{" "}
        {context.outgoing.length === 1 ? "output" : "outputs"}
      </span>
    </div>
  );
}
function EventStatus({ event }) {
  const Icon = ["Mismatch", "Failed"].includes(event)
    ? WarningCircleIcon
    : ["Completed", "Passed", "Approved"].includes(event)
      ? CheckCircleIcon
      : event === "Pending"
        ? ClockIcon
        : event === "Changed" ? ArrowCounterClockwiseIcon
          : event === "Returned" ? ArrowLeftIcon
            : event === "Blocked" ? LockSimpleIcon : MinusIcon;
  return (
    <span
      className={`event-status ${event.toLowerCase().replaceAll(" ", "-")}`}
    >
      <Icon
        size={15}
        weight={event === "Mismatch" ? "fill" : "regular"}
        aria-hidden="true"
      />
      <span>{event}</span>
    </span>
  );
}
function EventStep({ event, onStep }) {
  const nodeId = eventNodeId(event);
  return nodeId && onStep ? <button className="event-step-link" aria-label={`Show ${event.step} in workflow`} title={`Show ${event.step} in workflow`} onClick={() => onStep(nodeId)}>
    <span>{event.step}</span><ArrowRightIcon size={13} aria-hidden="true" />
  </button> : <span>{event.step}</span>;
}
function EventTable({ events, expanded = false, onStep, onPreview }) {
  useEffect(() => () => onPreview?.(null), [onPreview]);
  const rowProps = event => {
    const nodeId = eventNodeId(event);
    if (!nodeId) return {};
    return {
      className: "event-row-action",
      "data-workflow-step": nodeId,
      onPointerEnter: e => { if (e.pointerType !== "touch") onPreview?.(nodeId); },
      onPointerLeave: () => onPreview?.(null),
      onFocusCapture: () => onPreview?.(nodeId),
      onBlurCapture: e => { if (!e.currentTarget.contains(e.relatedTarget)) onPreview?.(null); },
      onClick: e => {
        if (e.target.closest("button, a, input, select") || window.getSelection()?.toString()) return;
        onStep?.(nodeId);
      },
    };
  };
  return (
    <>
      <div className="table-scroll event-table-scroll">
        <table className="event-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Step</th>
              <th>Event</th>
              <th>Details</th>
              {expanded && <th>Actor</th>}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr key={`${i}-${e.step}`} {...rowProps(e)}>
                <td className="mono">31 Oct 2026 {e.time}</td>
                <td><EventStep event={e} onStep={onStep} /></td>
                <td>
                  <EventStatus event={e.event} />
                </td>
                <td><DataText chips>{e.detail}</DataText></td>
                {expanded && <td>{e.actor}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ol className="event-timeline" aria-label="Execution events">
        {events.map((e, i) => (
          <li key={`${i}-${e.step}`} {...rowProps(e)}>
            <div className="event-line-heading">
              <strong><EventStep event={e} onStep={onStep} /></strong>
              <EventStatus event={e.event} />
            </div>
            <time dateTime={`2026-10-31T${e.time}`}>
              31 Oct 2026 · {e.time}
            </time>
            <p><DataText chips>{e.detail}</DataText></p>
            {expanded && <small>{e.actor}</small>}
          </li>
        ))}
      </ol>
    </>
  );
}
function Sources({ source, onClose, state }) {
  const [tab, setTab] = useState(source);
  const available =
    tab === "invoice" ? state.sourceAccess.invoice : state.sourceAccess.order;
  return (
    <Modal
      title="Source documents"
      eyebrow="RN-2048 / Evidence"
      onClose={onClose}
      className="source-modal"
    >
      <div className="source-tabs" role="tablist" aria-label="Source documents">
        <button
          role="tab"
          id="source-tab-invoice"
          data-value="invoice"
          tabIndex={tab === "invoice" ? 0 : -1}
          aria-controls="source-panel"
          onKeyDown={(event) => moveTabFocus(event, setTab)}
          aria-selected={tab === "invoice"}
          onClick={() => setTab("invoice")}
        >
          <FileIcon size={16} />
          <DataText>Invoice INV-2048</DataText>
        </button>
        <button
          role="tab"
          id="source-tab-PO-731"
          data-value="PO-731"
          tabIndex={tab === "PO-731" ? 0 : -1}
          aria-controls="source-panel"
          onKeyDown={(event) => moveTabFocus(event, setTab)}
          aria-selected={tab === "PO-731"}
          onClick={() => setTab("PO-731")}
        >
          <DatabaseIcon size={16} />
          <DataText>Order PO-731</DataText>
        </button>
        <TabIndicator value={tab} />
      </div>
      <div key={tab} id="source-panel" role="tabpanel" tabIndex={0} aria-labelledby={`source-tab-${tab}`}>
      {available ? (
        <>
          <div className="source-toolbar">
            <span className="mono">
              {tab === "invoice" ? "INV-2048.pdf" : `${tab}.pdf`}
            </span>
            <a
              className="text-link"
              href={appUrl(`/documents/${tab === "invoice" ? "INV-2048" : tab}.pdf`)}
              download
            >
              <DownloadSimpleIcon size={15} />
              Download PDF
            </a>
          </div>
          <DocumentRecord
            order={tab === "invoice" ? null : orders.find((o) => o.id === tab)}
          />
        </>
      ) : (
        <div className="source-unavailable">
          <LockSimpleIcon size={25} />
          <h3>Source unavailable</h3>
          <p>
            You cannot inspect this document with the current access. Testing
            and approval require both source documents.
          </p>
          <p>In this demo, access can be restored from the Demo panel.</p>
        </div>
      )}
      </div>
    </Modal>
  );
}
function Inspector({
  selected,
  state,
  onReview,
  onSource,
  mobileOpen,
  onClose,
  customWidth,
  resetWidth,
}) {
  const proposal = latestProposal(state);
  const submitted =
    proposal &&
    (["requested", "approved", "changes_requested", "outdated"].includes(
      state.phase,
    ) ||
      state.role === "approver");
  const panelRef = useRef(null);
  const dismiss = useAnimatedDismiss(panelRef, { kind: "drawer" });
  useEffect(() => {
    if (!mobileOpen) return;
    const panel = panelRef.current;
    const previousFocus = document.activeElement;
    panel.showModal();
    const media = window.matchMedia("(max-width: 900px)");
    const leaveCompact = () => {
      if (!media.matches) onClose();
    };
    media.addEventListener("change", leaveCompact);
    return () => {
      media.removeEventListener("change", leaveCompact);
      if (panel.open) panel.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [mobileOpen]);
  const Panel = mobileOpen ? "dialog" : "aside";
  const spec = specs.find((n) => n.id === selected);
  const extraction = selected === "extract" ? invoiceFieldEvidence(state) : null;
  const titles = {
    invoice: "Invoice source",
    extract: "Field extraction",
    order: "Purchase order",
    compare: "Total check",
    prepare: "Payment preparation",
    submit: "Payment submission",
  };
  return (
    <Panel
      ref={panelRef}
      onCancel={(e) => {
        e.preventDefault();
        dismiss(onClose);
      }}
      className={`inspector ${mobileOpen ? "mobile-open" : ""}`}
      id="step-inspector"
      aria-label="Step details"
    >
      <div className="inspector-mobile-close">
        <IconButton label="Close details" onClick={() => dismiss(onClose)}>
          <XIcon size={18} />
        </IconButton>
      </div>
      <div className="motion-content" key={selected}>
      <div className="inspector-title"><h2>{titles[selected]}</h2>{customWidth && !mobileOpen && <button type="button" onClick={resetWidth} aria-label="Reset details width" title="Reset details width"><ArrowCounterClockwiseIcon size={15} /></button>}</div>
      <p className="inspector-description">
        {selected === "compare"
          ? "Compare invoice and order amounts"
          : spec.data.sub}
      </p>
      {selected === "compare" ? (
        <>
          <div className="check-status">
            <span>
              <WarningCircleIcon weight="fill" size={20} />
              Mismatch
            </span>
            <small className="mono">STEP-003</small>
          </div>
          <div
            className="amounts financial-summary"
            aria-label="Invoice and order amounts"
            data-tour="evidence"
          >
            <div className="financial-row">
              <div className="financial-label">
                <span>Invoice</span>
                <small>INV-2048</small>
              </div>
              <strong>
                <Money cents={invoice.cents} />
              </strong>
            </div>
            <div className="financial-row">
              <div className="financial-label">
                <span>Order</span>
                <small>PO-731</small>
              </div>
              <strong>
                <Money cents={orders[0].cents} />
              </strong>
            </div>
            <div className="financial-row financial-difference">
              <div className="financial-label">
                <span>Difference</span>
                <small className="ratio-badge" title="The invoice amount is ten times the linked order amount. This does not establish the cause.">10× amount</small>
              </div>
              <strong>
                <Money cents={invoice.cents - orders[0].cents} />
              </strong>
            </div>
          </div>
        </>
      ) : (
        <div className="step-information">
          <span className={`tiny-state ${spec.data.status === "blocked" ? "blocked" : "completed"}`}>
            {spec.data.status === "blocked" ? (
              <LockSimpleIcon size={16} />
            ) : (
              <CheckCircleIcon size={16} />
            )}
            {spec.data.tag || "Completed"}
          </span>
          {extraction?.available && <p className="extraction-source">Invoice PDF · version {extraction.version}</p>}
          <dl className={extraction ? "extracted-fields" : undefined}>
            {selected === "invoice" && (
              <>
                <div>
                  <dt>Document</dt>
                  <dd>INV-2048.pdf</dd>
                </div>
                <div>
                  <dt>Supplier</dt>
                  <dd>Northline Components</dd>
                </div>
                <div>
                  <dt>Order reference</dt>
                  <dd>Not provided</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>
                    <Money cents={invoice.cents} />
                  </dd>
                </div>
              </>
            )}
            {selected === "order" && (
              <>
                <div>
                  <dt>Association</dt>
                  <dd className="mono">PO-731</dd>
                </div>
                <div>
                  <dt>Source</dt>
                  <dd>ERP / <span className="mono">v3.2</span></dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>
                    <Money cents={orders[0].cents} />
                  </dd>
                </div>
              </>
            )}
            {selected === "extract" && (
              extraction.available ? extraction.fields.map(field => <div key={field.name}>
                <dt>{field.name}</dt>
                <dd>{field.cents !== undefined ? <Money cents={field.cents} /> : <DataText>{field.value}</DataText>}</dd>
              </div>) : <div><dt>Source fields</dt><dd>Invoice access is unavailable.</dd></div>
            )}
            {spec.data.status === "blocked" && (
              <div>
                <dt>Gate</dt>
                <dd>A resolved check and finance approval are required.</dd>
              </div>
            )}
          </dl>
          {extraction?.available && <p className="extraction-missing"><WarningCircleIcon size={15} />Order reference was not provided.</p>}
        </div>
      )}
      <section className="inspector-sources">
        <h3>Source documents</h3>
        <button onClick={() => onSource("invoice")}>
          <FileIcon size={21} />
          <span>Invoice (PDF)</span>
          <ArrowSquareOutIcon size={16} />
        </button>
        <button onClick={() => onSource("PO-731")}>
          <DatabaseIcon size={21} />
          <span>Purchase order (ERP)</span>
          <ArrowSquareOutIcon size={16} />
        </button>
      </section>
      <section className="inspector-action" data-tour="review-action">
        <span className="muted">Status</span>
        <p>Payment has not started.</p>
        {submitted && (
          <div className="pending-note">
            <ClockIcon size={16} />
            <span>
              v{proposal.version} · {proposalLabels[proposal.status]}
            </span>
          </div>
        )}
        <button className="primary-button" onClick={onReview} aria-keyshortcuts="R">
          <span><DataText>{submitted
            ? `View proposal v${proposal.version}`
            : state.role === "approver"
              ? "Operations review required"
              : state.phase === "tested"
                ? "View test results"
                : state.draftVersion > 1
                  ? `Continue draft v${state.draftVersion}`
                  : "Review linked order"}</DataText></span>
          <kbd aria-hidden="true">R</kbd><ArrowRightIcon size={16} aria-hidden="true" />
        </button>
      </section>
      </div>
    </Panel>
  );
}
function Queue({ onOpen, phase, onReset, access }) {
  return <section className="list-view review-queue">
    <header><span className="eyebrow">Accounts payable</span><h1>Review queue</h1><p>Runs that need a human decision.</p></header>
    <div className="list-toolbar"><span>1 active review</span><span className="quiet-tag">Assigned to you</span></div>
    <button className="queue-row" onClick={onOpen}>
      <WarningCircleIcon size={20} weight="fill" />
      <div className="queue-company"><strong>Northline Components</strong><span className="mono">INV-2048</span></div>
      <span className="queue-detail"><small>Linked order</small><strong className="mono">PO-731</strong></span>
      <span className="queue-detail queue-variance"><small>Difference</small><strong>{access.invoice && access.order ? <>+<Money cents={invoice.cents-orders[0].cents} /></> : "Unavailable"}</strong></span>
      <span className="queue-detail"><small>Invoice total</small>{access.invoice ? <Money cents={invoice.cents} /> : "Unavailable"}</span>
      <span className="queue-detail queue-stage"><small>Compare totals</small><time dateTime="2026-10-31T10:42">31 Oct, 10:42</time></span>
      <span className="queue-state">{phase === "requested" ? "Awaiting approval" : phase === "approved" ? "Correction approved" : phase === "changes_requested" ? "Changes requested" : phase === "outdated" ? "Evidence outdated" : "Needs review"}</span>
      <ArrowRightIcon size={18} />
    </button>
    <div className="queue-demo-note"><InfoIcon size={18} /><p>One complete review scenario is available in this demo workspace.<small>Reset clears this device’s demo drafts, tests and decisions.</small></p><button className="secondary-button" onClick={onReset}><ArrowCounterClockwiseIcon size={15} />Reset demo state</button></div>
  </section>;
}

export function App() {
  const scene = useMemo(
    () => showcaseScene(new URLSearchParams(location.search).get("showcase")),
    [],
  );
  const persistenceEnabled = isPersistentReview(location.search);
  const [recovery] = useState(() => {
    if (!persistenceEnabled) return { status: "isolated", state: null };
    try {
      return readReview(localStorage);
    } catch {
      return { status: "unavailable", state: null };
    }
  });
  const [state, dispatch] = useReducer(reducer, recovery.state || scene.state);
  const [tourStep, setTourStep] = useState(() => {
    let preference = null;
    try { preference = readTour(localStorage); } catch { /* Storage may be blocked. */ }
    return initialTourStep(location.search, preference, recovery.state || scene.state);
  });
  const [tourLayout, setTourLayout] = useState(0);
  const compactNavigation = useCompactNavigation();
  const [navigationCollapsed, setNavigationCollapsed] = useState(() => {
    try { return readNavigation(localStorage, location.search); } catch { return false; }
  });
  useEffect(() => {
    try { saveNavigation(localStorage, location.search, navigationCollapsed); } catch { /* Session choice remains available. */ }
  }, [navigationCollapsed]);
  const [saved, setSaved] = useState(recovery.status !== "unavailable");
  const [nav, setNav] = useState("runs");
  const [tab, setTab] = useState(scene.tab);
  const [selected, setSelected] = useState("compare");
  const [previewed, setPreviewed] = useState(null);
  const [canvasExplored, setCanvasExplored] = useState(false);
  const [graphFocus, setGraphFocus] = useState(null);
  const focusSequence = useRef(0);
  const [modal, setModal] = useState(
    persistenceEnabled && new URLSearchParams(location.search).get("guide") === "1"
      ? "guide" : scene.modal,
  );
  const [source, setSource] = useState("invoice");
  const [menu, setMenu] = useState(false);
  const avatarRef = useRef(null);
  const [toast, setToast] = useState(
    recovery.status === "restored"
      ? recovery.interrupted
        ? "Review restored. Run the interrupted test again."
        : "Review restored on this device."
      : recovery.status === "invalid"
        ? "The saved review could not be restored. A new demo is open."
        : "",
  );
  const [details, setDetails] = useState(false);
  const [proposalId, setProposalId] = useState(null);
  const proposal = latestProposal(state);
  const viewedProposal =
    state.proposals.find((p) => p.id === proposalId) || proposal;
  const openProposal = (id) => {
    setProposalId(id);
    setModal("proposal");
  };
  const openReview = () => {
    setProposalId(null);
    if (state.role === "approver" && proposal) openProposal(proposal.id);
    else setModal("review");
  };
  useEffect(() => {
    const keydown = event => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.key.toLowerCase() !== "r") return;
      if (nav !== "runs" || modal || menu || tourStep !== null || document.querySelector("dialog[open]") || event.target.closest?.("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      openReview();
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [nav, modal, menu, tourStep, state.role, proposal]);
  const rememberTour = (status, step) => {
    if (!tourPreferencesEnabled(location.search)) return;
    try { saveTour(localStorage, status, step); } catch { /* Keep it available for this visit. */ }
  };
  const startTour = () => {
    cancelGraphFocus();
    setCanvasExplored(false);
    setModal(null);
    setDetails(false);
    setMenu(false);
    setNav("runs");
    setTab("trace");
    setSelected("compare");
    setTourLayout((value) => value + 1);
    setTourStep(0);
  };
  const dismissTour = () => {
    rememberTour("skipped", tourStep);
    setTourStep(null);
  };
  const continueReview = (kind) => {
    setMenu(false);
    setNav("runs");
    setSelected("compare");
    if (kind === "access") setModal("about");
    else if (kind === "history") { setTab("proposals"); setModal(null); }
    else if (kind === "finance") { dispatch({ type: "SET_ROLE", role: "approver" }); openProposal(proposal.id); }
    else if (kind === "operations") { dispatch({ type: "SET_ROLE", role: "operator" }); setModal("review"); }
    else if (kind === "proposal") openProposal(proposal.id);
    else openReview();
  };
  useEffect(() => {
    if (tourStep !== null) rememberTour("in_progress", tourStep);
  }, [tourStep]);
  const revise = () => {
    dispatch({
      type: "REVISE_PROPOSAL",
    });
    setModal("review");
    setProposalId(null);
  };
  const profile = people[state.role];
  useEffect(() => {
    if (!menu) return;
    const dismiss = (event) => {
      if (event.key === "Escape") {
        setMenu(false);
        avatarRef.current?.focus();
      }
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [menu]);
  const events = useMemo(() => [...baseEvents, ...state.audit], [state.audit]);
  useEffect(() => {
    if (!persistenceEnabled) return;
    try {
      setSaved(writeReview(localStorage, state));
    } catch {
      setSaved(false);
    }
  }, [state, persistenceEnabled]);
  useEffect(() => {
    if (state.phase !== "testing") return;
    const revision = state.revision;
    const t = setTimeout(
      () =>
        dispatch({
          type: "COMPLETE_TEST",
          revision,
        }),
      650,
    );
    return () => clearTimeout(t);
  }, [state.phase, state.revision]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);
  const cancelGraphFocus = () => { ++focusSequence.current; setGraphFocus(null); };
  const selectGraphNode = (nodeId) => { cancelGraphFocus(); setSelected(nodeId); };
  useEffect(() => {
    if (nav !== "runs" || tab !== "trace") cancelGraphFocus();
  }, [nav, tab]);
  const showEventStep = (nodeId) => {
    setNav("runs");
    setTab("trace");
    setSelected(nodeId);
    setDetails(false);
    setGraphFocus({ nodeId, id: ++focusSequence.current, openDetails: matchMedia("(max-width: 900px)").matches });
  };
  const focusedEventStep = (request) => {
    if (request.id !== focusSequence.current) return;
    setGraphFocus(current => current?.id === request.id ? null : current);
    if (request.openDetails) setDetails(true);
    setToast(`Showing ${specs.find(node => node.id === request.nodeId).data.title} in the original workflow.`);
  };
  const onSource = (s) => {
    setSource(s);
    setModal("source");
  };
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText("RN-2048");
      setToast("Run ID copied");
    } catch {
      setToast("Run ID: RN-2048");
    }
  };
  return (
    <div
      className={`app-shell ${navigationCollapsed ? "navigation-collapsed" : ""} ${new URLSearchParams(location.search).has("capture") ? "reference-capture" : ""}`}
    >
      <aside className="sidebar" id="main-sidebar" inert={navigationCollapsed && compactNavigation} aria-hidden={navigationCollapsed && compactNavigation || undefined}>
        <a
          className="wordmark"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setNav("runs");
          }}
          aria-label="NoemaTrace home"
        >
          <img
            className="brand-mark"
            src={appUrl("/brand/noematrace-mark.png")}
            alt=""
            width="36"
            height="36"
          />
          <span>NoemaTrace</span>
        </a>
        <nav aria-label="Main navigation">
          <button
            aria-label="Review queue, 1 item"
            title="Review queue"
            className={nav === "queue" ? "active" : ""}
            aria-current={nav === "queue" ? "page" : undefined}
            onClick={() => setNav("queue")}
          >
            <FileIcon size={19} />
            <span>Review queue</span>
            <small>1</small>
          </button>
          <button
            aria-label="Runs"
            title="Runs"
            className={nav === "runs" ? "active" : ""}
            aria-current={nav === "runs" ? "page" : undefined}
            onClick={() => setNav("runs")}
          >
            <PulseIcon size={19} />
            <span>Runs</span>
          </button>
          <button
            aria-label="Audit log"
            title="Audit log"
            className={nav === "audit" ? "active" : ""}
            aria-current={nav === "audit" ? "page" : undefined}
            onClick={() => setNav("audit")}
          >
            <ClipboardTextIcon size={19} />
            <span>Audit log</span>
          </button>
        </nav>
        <a
          className="case-study-link"
          href={appUrl("case-study")}
          aria-label="Read the NoemaTrace case study"
        >
          <ArrowSquareOutIcon size={18} />
          <span>Case study</span>
        </a>
        <button
          aria-label="About this demo"
          title="About this demo"
          className="demo-label"
          onClick={() => setModal("about")}
        >
          <InfoIcon size={18} />
          <span>Demo</span>
        </button>
      </aside>
      <div className="app-content">
        <header className="topbar">
          <div className="topbar-context">
          <IconButton label={navigationCollapsed ? "Expand navigation" : "Collapse navigation"} className="navigation-toggle"
            aria-expanded={!navigationCollapsed} aria-controls="main-sidebar" onClick={() => setNavigationCollapsed(!navigationCollapsed)}>
            <SidebarSimpleIcon size={20} />
          </IconButton>
          <div className="breadcrumb">
            <span>Accounts payable</span>
            <span className="crumb-divider">/</span>
            <span className="mono">
              {nav === "runs"
                ? "RN-2048"
                : nav === "queue"
                  ? "Review queue"
                  : "Audit log"}
            </span>
            {nav === "runs" && (
              <span className="run-status">
                {state.phase === "requested" ? (
                  <ClockIcon size={15} />
                ) : (
                  <PauseCircleIcon size={16} weight="fill" />
                )}
                {state.phase === "requested" ? "Awaiting approval" : "Paused"}
              </span>
            )}
          </div>
          </div>
          <div className="user-area">
            {persistenceEnabled && (
              <span
                className={`save-indicator ${saved ? "" : "save-unavailable"}`}
                role="status"
                title="Review history and drafts are stored in this browser on this device only."
              >
                {saved ? (
                  <CheckCircleIcon size={14} />
                ) : (
                  <WarningCircleIcon size={14} />
                )}
                {saved ? "Saved locally" : "Could not save locally"}
              </span>
            )}
            <IconButton label="Open review guide" data-tour="guide" className="review-guide-trigger" onClick={() => setModal("guide")}><QuestionIcon size={20} /><span className="review-guide-label">Guide</span></IconButton>
            <ThemeToggle />
            <button
              className="avatar"
              aria-label="Open user menu"
              aria-expanded={menu}
              aria-controls="profile-menu"
              ref={avatarRef}
              title={`${profile.name} · ${profile.title}`}
              onClick={() => setMenu(!menu)}
            >
              <span className="avatar-initials" aria-hidden="true">
                <span className="avatar-glyph">{profile.initials}</span>
              </span>
              <span className="avatar-name">{profile.name}</span>
              <CaretDownIcon className="avatar-chevron" size={12} aria-hidden="true" />
            </button>
            {menu && (
              <>
                <button
                  className="menu-scrim"
                  tabIndex={-1}
                  aria-label="Close user menu"
                  onClick={() => setMenu(false)}
                />
                </>
            )}
            <MotionPresence show={menu} kind="menu">
                <div className="user-menu" id="profile-menu">
                  <div className="profile-menu-heading">
                    <span className="avatar-initials" aria-hidden="true">
                      <span className="avatar-glyph">{profile.initials}</span>
                    </span>
                    <div>
                      <strong>{profile.name}</strong>
                      <span>{profile.title}</span>
                    </div>
                  </div>
                  <p>Operations proposes. Finance records the decision.</p>
                  {persistenceEnabled && (
                    <p className="menu-save-status">
                      {saved
                        ? "Review saved on this device. Reload to continue where you left off."
                        : "Browser storage is unavailable. Keep this tab open to preserve your review."}
                    </p>
                  )}
                  <label className="input-label" htmlFor="demo-role">
                    Demo role
                  </label>
                  <select
                    id="demo-role"
                    value={state.role}
                    onChange={(e) => {
                      dispatch({
                        type: "SET_ROLE",
                        role: e.target.value,
                      });
                      setMenu(false);
                    }}
                  >
                    <option value="operator">Operations reviewer</option>
                    <option value="approver">Finance approver</option>
                  </select>
                  <small className="role-demo-note">
                    Role switching is available only in this demo.
                  </small>
                  <button
                    onClick={() => {
                      dispatch({
                        type: "RESET",
                      });
                      setModal(null);
                      setNav("runs");
                      setSelected("compare");
                      setTab("trace");
                      setMenu(false);
                      setToast("Demo reset");
                    }}
                  >
                    <ArrowCounterClockwiseIcon size={16} />
                    Reset demo
                  </button>
                </div>
            </MotionPresence>
          </div>
        </header>
        {nav === "runs" ? (
          <InspectorSplit onResizeStart={cancelGraphFocus} inspector={({ customWidth, resetWidth }) => <Inspector selected={selected} state={state} onReview={openReview} onSource={onSource} mobileOpen={details} onClose={() => setDetails(false)} customWidth={customWidth} resetWidth={resetWidth} />}>
            <section className="run-main">
              <header className="run-heading">
                <div className="run-title-row">
                  <h1>Northline Components</h1>
                  <span className="mono">INV-2048</span>
                  <IconButton label="Copy run ID" onClick={copyId}>
                    <CopyIcon size={17} />
                  </IconButton>
                </div>
                <p>
                  Invoice processing<span className="meta-dot">·</span>
                  <time dateTime="2026-10-31T10:42:00">31 Oct 2026 10:42</time>
                  <span className="run-trigger">
                    <span className="meta-dot">·</span>Triggered automatically
                  </span>
                </p>
                <div className="view-tabs" role="tablist" aria-label="Run view">
                  <button
                    role="tab"
                    id="run-tab-trace"
                    data-value="trace"
                    tabIndex={tab === "trace" ? 0 : -1}
                    aria-controls="run-panel"
                    onKeyDown={(event) => moveTabFocus(event, setTab)}
                    aria-selected={tab === "trace"}
                    onClick={() => setTab("trace")}
                  >
                    Trace
                  </button>
                  <button
                    role="tab"
                    id="run-tab-events"
                    data-value="events"
                    tabIndex={tab === "events" ? 0 : -1}
                    aria-controls="run-panel"
                    onKeyDown={(event) => moveTabFocus(event, setTab)}
                    aria-selected={tab === "events"}
                    onClick={() => setTab("events")}
                  >
                    Events
                  </button>
                  <button
                    role="tab"
                    id="run-tab-proposals"
                    data-value="proposals"
                    data-tour="proposals"
                    tabIndex={tab === "proposals" ? 0 : -1}
                    aria-controls="run-panel"
                    onKeyDown={(event) => moveTabFocus(event, setTab)}
                    aria-selected={tab === "proposals"}
                    onClick={() => setTab("proposals")}
                  >
                    Proposals
                    {state.proposals.length > 0 && (
                      <span className="tab-count">
                        {state.proposals.length}
                      </span>
                    )}
                  </button>
                  <TabIndicator value={tab} />
                  <button
                    className="mobile-details-button"
                    data-tour="details"
                    onClick={() => setDetails(true)}
                  >
                    <SlidersHorizontalIcon size={16} />
                    Details
                  </button>
                </div>
              </header>
              <div key={tab} id="run-panel" className="run-tab-panel" role="tabpanel" aria-labelledby={`run-tab-${tab}`} tabIndex={0}>
              {tab === "trace" ? (
                <TraceSplit eventCount={events.length} onResizeStart={cancelGraphFocus} graph={
                  <Graph key={tourLayout} selected={selected} previewed={previewed} onSelect={selectGraphNode} focusRequest={graphFocus} onFocusApplied={focusedEventStep} onCancelFocus={cancelGraphFocus} explored={canvasExplored} onExplore={() => setCanvasExplored(true)} />
                }>
                  <EventTable events={events} onStep={showEventStep} onPreview={setPreviewed} />
                </TraceSplit>
              ) : tab === "proposals" ? (
                <ProposalHistory
                  state={state}
                  onOpen={openProposal}
                  onCreate={openReview}
                  onCompare={() => setModal("comparison")}
                />
              ) : (
                <section className="full-events">
                  <header>
                    <h2>Execution events</h2>
                    <span>{events.length} recorded events</span>
                  </header>
                  <AuditExplorer events={events} state={state}>
                    {(visible) => <EventTable events={visible} expanded onStep={showEventStep} onPreview={setPreviewed} />}
                  </AuditExplorer>
                </section>
              )}
              </div>
            </section>
          </InspectorSplit>
        ) : nav === "queue" ? (
          <Queue
            phase={state.phase}
            access={state.sourceAccess}
            onReset={() => { dispatch({ type: "RESET" }); setSelected("compare"); setCanvasExplored(false); setToast("Demo reset. Original review restored."); }}
            onOpen={() => {
              setNav("runs");
              setSelected("compare");
            }}
          />
        ) : (
          <main className="list-view audit-view">
            <header>
              <span className="eyebrow">Accounts payable</span>
              <h1>Audit log</h1>
              <p>A record of workflow checks and human decisions.</p>
            </header>
            <AuditExplorer events={events} state={state}>
              {(visible) => <EventTable events={visible} expanded onStep={showEventStep} onPreview={setPreviewed} />}
            </AuditExplorer>
            <button className="secondary-button" onClick={() => setNav("runs")}>
              <ArrowLeftIcon size={15} />
              Back to run RN-2048
            </button>
          </main>
        )}
      </div>
      {modal === "source" && (
        <Sources
          key={source}
          source={source}
          state={state}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "guide" && <ReviewGuide state={state} onClose={() => setModal(null)} onContinue={continueReview} onTour={startTour} />}
      {tourStep !== null && <InterfaceTour
        step={tourStep}
        state={state}
        onStep={setTourStep}
        onDismiss={dismissTour}
        onFinish={(kind) => {
          rememberTour("completed", tourStep);
          setTourStep(null);
          continueReview(kind);
        }}
      />}
      {modal === "review" &&
        (proposal &&
        ["requested", "approved", "changes_requested", "outdated"].includes(
          state.phase,
        ) ? (
          <ProposalDialog
            key={proposal.id}
            state={state}
            proposal={proposal}
            dispatch={dispatch}
            onClose={() => setModal(null)}
            onRevise={revise}
          />
        ) : (
          <Review
            state={state}
            dispatch={dispatch}
            saveStatus={persistenceEnabled ? saved : null}
            onClose={() => setModal(null)}
          />
        ))}
      {modal === "proposal" && viewedProposal && (
        <ProposalDialog
          key={viewedProposal.id}
          state={state}
          proposal={viewedProposal}
          dispatch={dispatch}
          onClose={() => setModal(null)}
          onRevise={revise}
        />
      )}
      {modal === "comparison" && state.proposals.length > 1 && (
        <VersionComparison state={state} onClose={() => setModal(null)} />
      )}
      {modal === "about" && (
        <Modal
          title="A workspace for human decisions"
          eyebrow="NoemaTrace / Demo"
          onClose={() => setModal(null)}
          className="about-modal"
        >
          <p>
            This prototype explores how operations teams can inspect a blocked
            AI workflow, compare evidence and test a corrected context.
          </p>
          <p>
            All documents and events are synthetic. Tests and approval requests
            stay inside this demo. No external systems are connected and no
            payments can be made.
          </p>
          <p>
            Start with <strong>Review linked order</strong>. Check the supplier
            and line items as well as the total.
          </p>
          <DemoControls state={state} dispatch={dispatch} />
          <DialogCloseButton className="primary-button">
            Explore the workspace
            <ArrowRightIcon size={16} />
          </DialogCloseButton>
        </Modal>
      )}
      <MotionPresence show={Boolean(toast)} kind="toast">
        <div className="toast" role="status">
          <CheckCircleIcon size={17} />
          {toast}
        </div>
      </MotionPresence>
    </div>
  );
}
