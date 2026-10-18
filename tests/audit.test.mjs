import test from "node:test";
import assert from "node:assert/strict";
import { filterEvents, eventsCSV, reviewRecord } from "../src/audit.js";
import { baseEvents, reducer } from "../src/model.js";
import { showcaseScene } from "../src/showcase.js";

test("search finds formatted financial amounts and actor names without changing event order", () => {
  const before = structuredClone(baseEvents);
  assert.equal(filterEvents(baseEvents, { query: "12480" }).length, 1);
  assert.equal(
    filterEvents(baseEvents, { query: "EXTRACTION AGENT" })[0].step,
    "Extract fields",
  );
  assert.equal(
    filterEvents(baseEvents, { newestFirst: true })[0].step,
    "Prepare payment",
  );
  assert.deepEqual(baseEvents, before);
});
test("attention, test and decision filters compose with search", () => {
  const state = showcaseScene("history").state;
  const events = [...baseEvents, ...state.audit];
  assert.ok(
    filterEvents(events, { category: "attention" }).every((e) =>
      ["Mismatch", "Failed", "Changed", "Returned"].includes(e.event),
    ),
  );
  assert.equal(filterEvents(events, { category: "tests" }).length, 2);
  assert.equal(
    filterEvents(events, { category: "decisions", query: "approve" }).length,
    1,
  );
  assert.equal(filterEvents(events, { query: "no-such-document" }).length, 0);
});
test("CSV preserves commas, quotes, multiline notes and neutralizes formula cells", () => {
  const csv = eventsCSV([
    {
      time: "10:42:03",
      step: "=2+2",
      event: "Returned",
      detail: 'Line one, "quoted"\nLine two',
      actor: "Marcus Hale",
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=2+2"'));
  assert.ok(csv.includes('"Line one, ""quoted""\nLine two"'));
  assert.ok(csv.includes("\r\n"));
});
test("JSON review export retains exact decisions, versions and test IDs without a payment action", () => {
  const state = showcaseScene("stale").state;
  const before = structuredClone(state);
  const record = reviewRecord(
    state,
    [...baseEvents, ...state.audit],
    "2026-11-01T00:00:00.000Z",
  );
  assert.equal(record.synthetic, true);
  assert.equal(record.phase, "outdated");
  assert.equal(record.proposals.length, 2);
  assert.deepEqual(
    record.proposals.map((p) => p.test.id),
    ["TST-001", "TST-002"],
  );
  assert.equal(record.proposals[1].decision.testId, "TST-002");
  assert.equal(record.originalRun.linkedOrder.id, "PO-731");
  assert.equal("payment" in record, false);
  record.proposals[0].reason = "changed export copy";
  assert.deepEqual(state, before);
});
test("unavailable source bodies are excluded from every exported snapshot", () => {
  let state = showcaseScene("history").state;
  state = reducer(state, {
    type: "DEMO_SOURCE_ACCESS",
    source: "invoice",
    available: false,
  });
  const record = reviewRecord(state, state.audit);
  const snapshots = [
    record.originalRun.invoice,
    ...record.tests.map((t) => t.invoice),
    ...record.proposals.map((p) => p.test.invoice),
  ];
  for (const snapshot of snapshots) {
    assert.equal(snapshot.available, false);
    assert.equal("lines" in snapshot, false);
    assert.equal(snapshot.id, "INV-2048");
  }
  assert.ok(record.proposals[0].test.order.lines.length > 0);
});

test('quick filters classify real source changes and mismatches without including decisions', () => {
  const state = reducer(showcaseScene('history').state, { type: 'DEMO_UPDATE_ORDER' });
  const events = [...baseEvents, ...state.audit];
  const before = structuredClone(events);
  const synced = filterEvents(events, { category: 'sync' });
  assert.equal(synced.length, 1);
  assert.equal(synced[0].step, 'Source evidence');
  assert.equal(filterEvents(events, { category: 'sync', query: 'v1.5' }).length, 1);
  assert.ok(filterEvents(events, { category: 'mismatches' }).every(event => ['Mismatch','Failed'].includes(event.event)));
  assert.ok(filterEvents(events, { category: 'decisions' }).every(event => ['Pending','Approved','Returned'].includes(event.event)));
  assert.deepEqual(events, before);
});
