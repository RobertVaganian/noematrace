export const connectionPalette = {
  dark: { line: "#8993a5", focus: "#b8cae8", conflict: "#e49c8d" },
  light: { line: "#748097", focus: "#405e8e", conflict: "#a64b3e" },
};

// Reserve space for canvas controls when the log leaves a shorter graph pane.
export function desktopViewport(width, height) {
  const zoom = Math.min(1, Math.max(0.35, (width - 14) / 902), Math.max(0.35, (height - 90) / 322));
  return {
    x: (width - 870 * zoom) / 2 - 20 * zoom,
    y: (height - 318 * zoom) / 2 - 100 * zoom - 28,
    zoom,
  };
}

export const workflowConnections = [
  { id: "i-e", source: "invoice", target: "extract", targetHandle: "input" },
  {
    id: "e-c",
    source: "extract",
    target: "compare",
    targetHandle: "extracted",
  },
  { id: "o-c", source: "order", target: "compare", targetHandle: "order" },
  {
    id: "c-p",
    source: "compare",
    target: "prepare",
    targetHandle: "input",
    blocked: true,
  },
  {
    id: "p-s",
    source: "prepare",
    target: "submit",
    targetHandle: "input",
    blocked: true,
  },
].map((connection) => ({ ...connection, sourceHandle: "output" }));

export function connectionContext(selected) {
  const incoming = workflowConnections.filter((c) => c.target === selected);
  const outgoing = workflowConnections.filter((c) => c.source === selected);
  const related = [...incoming, ...outgoing];
  return {
    incoming,
    outgoing,
    edgeIds: related.map((c) => c.id),
    nodeIds: [...new Set(related.flatMap((c) => [c.source, c.target]))],
  };
}


// Only recorded workflow steps have a graph counterpart. Review decisions never imply payment execution.
const eventSteps = Object.freeze({
  "Invoice": "invoice", "Extract fields": "extract", "Purchase order": "order",
  "Compare totals": "compare", "Prepare payment": "prepare", "Submit payment": "submit",
});
export function eventNodeId(event) { return Object.hasOwn(eventSteps, event.step) ? eventSteps[event.step] : null; }
export function nodeFocus(node, fittedZoom) {
  const width = node.measured?.width || node.width || 174;
  const height = node.measured?.height || node.height || 76;
  return {
    x: node.position.x + width / 2,
    y: node.position.y + height / 2,
    zoom: Math.max(.35, Math.min(1.15, fittedZoom || 1)),
  };
}
