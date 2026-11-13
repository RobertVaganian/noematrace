import { RUN_ID } from "./run-reference.js";
import { initialState, orders, people } from "./model.js";

export const reviewStorageKey = "noematrace.review.v1";
const phases = [
  "idle",
  "testing",
  "tested",
  "requested",
  "approved",
  "changes_requested",
  "outdated",
];
const statuses = ["pending", "approved", "changes_requested", "outdated"];
const object = (v) => v && typeof v === "object" && !Array.isArray(v);
const text = (v) => typeof v === "string";
const integer = (v) => Number.isSafeInteger(v) && v >= 0;
const candidate = (id) => orders.some((o) => o.id === id);
const documentRecord = (r) =>
  object(r) &&
  ["id", "version", "vendor", "vendorId", "currency", "date"].every((k) =>
    text(r[k]),
  ) &&
  integer(r.cents) &&
  Array.isArray(r.lines) &&
  r.lines.length <= 100 &&
  r.lines.every(
    (l) => object(l) && text(l.name) && integer(l.qty) && integer(l.unit),
  );
const testRecord = (t) =>
  object(t) &&
  text(t.id) &&
  integer(t.revision) &&
  integer(t.version) &&
  integer(t.sourceEpoch) &&
  candidate(t.candidateId) &&
  text(t.testedAt) &&
  typeof t.passed === "boolean" &&
  documentRecord(t.invoice) &&
  documentRecord(t.order) &&
  t.order.id === t.candidateId &&
  t.invoice.id === "INV-2048" &&
  Array.isArray(t.checks) &&
  t.checks.length === 4 &&
  t.checks.every(
    (c) =>
      object(c) &&
      text(c.name) &&
      text(c.detail) &&
      typeof c.pass === "boolean",
  );
const decisionRecord = (d) =>
  d === null ||
  (object(d) &&
    ["status", "actor", "note", "time", "proposalId", "testId"].every((k) =>
      text(d[k]),
    ) &&
    integer(d.version) &&
    integer(d.sourceEpoch));

export function validReview(s) {
  return (
    object(s) &&
    ["operator", "approver"].includes(s.role) &&
    ["", ...orders.map((o) => o.id)].includes(s.candidateId) &&
    text(s.reason) &&
    s.reason.length <= 500 &&
    phases.includes(s.phase) &&
    ["revision", "draftVersion", "sourceEpoch", "orderGeneration"].every((k) =>
      integer(s[k]),
    ) &&
    text(s.sourceUpdatedAt) &&
    object(s.sourceAccess) &&
    (s.decisionDrafts === undefined ||
      (object(s.decisionDrafts) &&
        Object.values(s.decisionDrafts).every(
          (v) => text(v) && v.length <= 500,
        ))) &&
    ["invoice", "order"].every((k) => typeof s.sourceAccess[k] === "boolean") &&
    (s.result === null || testRecord(s.result)) &&
    (s.phase !== "tested" || testRecord(s.result)) &&
    Array.isArray(s.audit) &&
    s.audit.length <= 2000 &&
    s.audit.every(
      (e) =>
        object(e) &&
        ["time", "step", "event", "detail", "actor"].every((k) => text(e[k])),
    ) &&
    Array.isArray(s.tests) &&
    s.tests.length <= 1000 &&
    s.tests.every(testRecord) &&
    Array.isArray(s.proposals) &&
    s.proposals.length <= 500 &&
    s.proposals.every(
      (p) =>
        object(p) &&
        ["id", "candidateId", "reason", "submittedAt", "submittedBy"].every(
          (k) => text(p[k]),
        ) &&
        integer(p.version) &&
        candidate(p.candidateId) &&
        p.candidateId === p.test?.candidateId &&
        statuses.includes(p.status) &&
        testRecord(p.test) &&
        decisionRecord(p.decision),
    )
  );
}

export function encodeReview(state, savedAt = new Date().toISOString()) {
  return JSON.stringify({
    schemaVersion: 1,
    runId: RUN_ID,
    savedAt,
    state: { ...state, error: "" },
  });
}

export function decodeReview(raw) {
  if (!raw) return { status: "empty", state: null };
  try {
    if (raw.length > 1000000) throw new Error("Oversized record");
    const saved = JSON.parse(raw);
    if (
      saved.schemaVersion !== 1 ||
      ![RUN_ID, "RN-2048"].includes(saved.runId) ||
      !text(saved.savedAt) ||
      !Number.isFinite(Date.parse(saved.savedAt)) ||
      !validReview(saved.state)
    )
      throw new Error("Unsupported review record");
    // Update the synthetic persona only in author fields; preserve written evidence.
    const actor = name => name === "Elena Stone" ? people.operator.name : name;
    const state = {
      ...initialState,
      ...saved.state,
      error: "",
      audit: saved.state.audit.map(entry => ({ ...entry, actor: actor(entry.actor) })),
      proposals: saved.state.proposals.map(proposal => ({
        ...proposal,
        submittedBy: actor(proposal.submittedBy),
        decision: proposal.decision && { ...proposal.decision, actor: actor(proposal.decision.actor) },
      })),
    };
    const interrupted = state.phase === "testing";
    if (interrupted) {
      state.phase = "idle";
      state.result = null;
    }
    return { status: "restored", state, savedAt: saved.savedAt, interrupted };
  } catch {
    return { status: "invalid", state: null };
  }
}

export function readReview(storage) {
  try {
    return decodeReview(storage.getItem(reviewStorageKey));
  } catch {
    return { status: "unavailable", state: null };
  }
}

export function writeReview(storage, state) {
  try {
    storage.setItem(reviewStorageKey, encodeReview(state));
    return true;
  } catch {
    return false;
  }
}

export function isPersistentReview(search) {
  const params = new URLSearchParams(search);
  return !params.has("showcase") && !params.has("capture");
}
