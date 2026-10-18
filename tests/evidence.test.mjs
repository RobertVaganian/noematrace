import test from "node:test";
import assert from "node:assert/strict";
import { evidenceDocument, invoiceFieldEvidence } from "../src/evidence.js";
import { showcaseScene } from "../src/showcase.js";
import { reducer, invoice } from "../src/model.js";

test("extraction exposes the six recorded invoice fields without inventing an order reference", () => {
  const state = showcaseScene("trace").state;
  const before = structuredClone(state);
  const evidence = invoiceFieldEvidence(state);
  assert.equal(evidence.version, invoice.version);
  assert.deepEqual(evidence.fields.map(f => f.name), ["Invoice number", "Supplier", "Supplier ID", "Invoice date", "Currency", "Total"]);
  assert.equal(evidence.fields.at(-1).cents, 1248000);
  assert.equal(evidence.fields.at(-1).value, "EUR 12,480.00");
  assert.deepEqual(state, before);
});
test("invoice extraction fields disappear when invoice access is lost and recover from the source", () => {
  let state = showcaseScene("trace").state;
  const original = invoiceFieldEvidence(state);
  state = reducer(state, {type:"DEMO_SOURCE_ACCESS", source:"invoice", available:false});
  assert.deepEqual(invoiceFieldEvidence(state), {available:false});
  state = reducer(state, {type:"DEMO_SOURCE_ACCESS", source:"invoice", available:true});
  assert.deepEqual(invoiceFieldEvidence(state), original);
  assert.equal(state.proposals.length, 0);
});

test("switching to current evidence shows the updated record without replacing the tested snapshot", () => {
  const state = showcaseScene("stale").state;
  const test = state.proposals[1].test;
  const before = structuredClone(test);
  const current = evidenceDocument(state, test, "order", "current");
  assert.equal(current.record.version, "1.5");
  assert.equal(current.record.cents, 1296000);
  assert.equal(
    evidenceDocument(state, test, "order", "tested").record.cents,
    1248000,
  );
  assert.deepEqual(test, before);
});
test("lost access hides both current and tested document bodies", () => {
  let state = showcaseScene("stale").state;
  state = reducer(state, {
    type: "DEMO_SOURCE_ACCESS",
    source: "order",
    available: false,
  });
  const test = state.proposals[1].test;
  for (const mode of ["tested", "current"])
    assert.deepEqual(evidenceDocument(state, test, "order", mode), {
      available: false,
    });
  assert.equal(
    evidenceDocument(state, test, "invoice", "current").available,
    true,
  );
});
test("historical versions retain their exact tested document independently of the latest proposal", () => {
  const state = showcaseScene("history").state;
  const first = state.proposals[0].test;
  const record = evidenceDocument(state, first, "invoice", "tested");
  assert.equal(record.record, first.invoice);
  assert.equal(first.id, "TST-001");
  assert.equal(
    evidenceDocument(state, first, "unknown", "current").available,
    false,
  );
});
