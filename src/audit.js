import { invoice, orders } from "./model.js";

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replaceAll(",", "")
    .trim();
export function filterEvents(
  events,
  { query = "", category = "all", newestFirst = false } = {},
) {
  const needle = normalize(query);
  const result = events.filter((event) => {
    const text = normalize(
      [event.time, event.step, event.event, event.detail, event.actor].join(
        " ",
      ),
    );
    const matchesCategory =
      category === "all" ||
      (category === "attention" &&
        ["Mismatch", "Failed", "Changed", "Returned"].includes(event.event)) ||
      (category === "mismatches" && ["Mismatch", "Failed"].includes(event.event)) ||
      (category === "sync" && event.step === "Source evidence") ||
      (category === "tests" && ["Passed", "Failed"].includes(event.event)) ||
      (category === "decisions" &&
        ["Pending", "Approved", "Returned"].includes(event.event));
    return text.includes(needle) && matchesCategory;
  });
  return newestFirst ? result.reverse() : result;
}

const csvCell = (value) => {
  let text = String(value ?? "");
  // Treat formula-looking user-entered text as literal when opened in a spreadsheet.
  if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
};
export function eventsCSV(events) {
  return (
    "\uFEFF" +
    [
      ["Date", "Time", "Step", "Event", "Details", "Actor"],
      ...events.map((e) => [
        "2026-10-31",
        e.time,
        e.step,
        e.event,
        e.detail,
        e.actor,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
  );
}

export function reviewRecord(
  state,
  events,
  exportedAt = new Date().toISOString(),
) {
  const record = (source, available) =>
    available
      ? source
      : { id: source.id, version: source.version, available: false };
  const test = (t) => ({
    ...t,
    invoice: record(t.invoice, state.sourceAccess.invoice),
    order: record(t.order, state.sourceAccess.order),
  });
  return structuredClone({
    schemaVersion: 1,
    product: "NoemaTrace",
    synthetic: true,
    exportedAt,
    scenarioDate: "2026-10-31",
    runId: "RN-2048",
    phase: state.phase,
    scope:
      "Association review only. No payment was created, submitted or authorized.",
    originalRun: {
      invoice: record(invoice, state.sourceAccess.invoice),
      linkedOrder: record(orders[0], state.sourceAccess.order),
    },
    currentEvidence: {
      epoch: state.sourceEpoch,
      orderGeneration: state.orderGeneration,
      access: state.sourceAccess,
    },
    events,
    tests: state.tests.map(test),
    proposals: state.proposals.map((p) => ({ ...p, test: test(p.test) })),
  });
}
