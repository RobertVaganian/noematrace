import test from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reducer,
  latestProposal,
  currentOrder,
  evidenceState,
  invoice,
  orders,
} from "../src/model.js";

const act = (s, type, data = {}) => reducer(s, { type, ...data });
const draft = () =>
  act(
    act(act(initialState, "RESET"), "CANDIDATE", { id: "PO-732" }),
    "REASON",
    { value: "Supplier and all invoice line items match PO-732." },
  );
const run = (s) => {
  s = act(s, "BEGIN_TEST");
  return act(s, "COMPLETE_TEST", { revision: s.revision });
};
const submitted = () => act(run(draft()), "REQUEST_APPROVAL");
const decision = (s, extra = {}) => {
  const p = latestProposal(s);
  return act(s, "DECIDE_PROPOSAL", {
    proposalId: p.id,
    testId: p.test.id,
    decision: "approve",
    note: "Supplier, currency and line items verified.",
    acknowledged: true,
    ...extra,
  });
};
const finance = (s) => act(s, "SET_ROLE", { role: "approver" });

test("operator cannot approve and approver cannot edit the operator draft", () => {
  const s = submitted();
  assert.equal(decision(s).phase, "requested");
  const f = finance(draft());
  assert.equal(act(f, "CANDIDATE", { id: "PO-733" }).candidateId, "PO-732");
  assert.notEqual(act(f, "BEGIN_TEST").phase, "testing");
});
test("finance decision requires a current exact proposal, explanation and acknowledgement", () => {
  const s = finance(submitted());
  for (const extra of [
    { note: "" },
    { acknowledged: false },
    { proposalId: "PROP-2048-v99" },
    { testId: "TST-wrong" },
  ])
    assert.equal(decision(s, extra).phase, "requested");
  const approved = decision(s);
  assert.equal(approved.phase, "approved");
  assert.equal(latestProposal(approved).decision.version, 1);
  assert.equal(latestProposal(approved).decision.testId, "TST-001");
});
test("returning a proposal retains the decision while version two is tested and approved", () => {
  let s = decision(finance(submitted()), {
    decision: "changes",
    note: "Please document how the missing order reference was resolved.",
  });
  const first = structuredClone(latestProposal(s));
  s = act(s, "SET_ROLE", { role: "operator" });
  s = act(s, "REVISE_PROPOSAL");
  assert.equal(s.draftVersion, 2);
  assert.equal(s.result, null);
  assert.notEqual(act(s, "REQUEST_APPROVAL").phase, "requested");
  s = act(s, "REASON", {
    value: "Cross-checked supplier ID and all three invoice lines with PO-732.",
  });
  s = act(run(s), "REQUEST_APPROVAL");
  assert.equal(latestProposal(s).version, 2);
  assert.equal(latestProposal(s).test.id, "TST-002");
  s = decision(finance(s));
  assert.equal(s.phase, "approved");
  assert.deepEqual(s.proposals[0], first);
});
test("source update invalidates pending evidence and keeps the submitted snapshot intact", () => {
  const s = submitted();
  const snapshot = structuredClone(latestProposal(s).test);
  const changed = act(s, "DEMO_UPDATE_ORDER");
  assert.equal(latestProposal(changed).status, "outdated");
  assert.equal(currentOrder(changed, "PO-732").cents, 1296000);
  assert.deepEqual(latestProposal(changed).test, snapshot);
  assert.equal(snapshot.order.version, "1.4");
  assert.equal(decision(finance(changed)).phase, "outdated");
});
test("restoring matching values never restores an earlier approval", () => {
  let s = decision(finance(submitted()));
  const approval = structuredClone(latestProposal(s).decision);
  s = act(s, "DEMO_UPDATE_ORDER");
  s = act(s, "DEMO_RESTORE_ORDER");
  assert.equal(currentOrder(s, "PO-732").cents, invoice.cents);
  assert.equal(currentOrder(s, "PO-732").version, "1.6");
  assert.equal(latestProposal(s).status, "outdated");
  assert.deepEqual(latestProposal(s).decision, approval);
  assert.equal(evidenceState(s, latestProposal(s).test).current, false);
  s = act(s, "SET_ROLE", { role: "operator" });
  s = act(s, "REVISE_PROPOSAL");
  s = act(run(s), "REQUEST_APPROVAL");
  assert.equal(latestProposal(s).version, 2);
  assert.equal(latestProposal(s).test.order.version, "1.6");
  assert.equal(decision(finance(s)).phase, "approved");
});
test("unavailable evidence prevents a test and restored access requires fresh evidence", () => {
  let s = act(draft(), "DEMO_SOURCE_ACCESS", {
    source: "invoice",
    available: false,
  });
  assert.equal(act(s, "BEGIN_TEST").phase, "idle");
  s = act(submitted(), "DEMO_SOURCE_ACCESS", {
    source: "invoice",
    available: false,
  });
  s = act(s, "DEMO_SOURCE_ACCESS", { source: "invoice", available: true });
  assert.equal(latestProposal(s).status, "outdated");
  assert.equal(decision(finance(s)).phase, "outdated");
});
test("source changes during a test discard its asynchronous completion", () => {
  let s = act(draft(), "BEGIN_TEST");
  const revision = s.revision;
  s = act(s, "DEMO_UPDATE_ORDER");
  s = act(s, "COMPLETE_TEST", { revision });
  assert.equal(s.result, null);
  assert.equal(s.tests.length, 0);
});
test("an older decision cannot target a new submitted version", () => {
  let s = submitted();
  const old = latestProposal(s);
  s = decision(finance(s), { decision: "changes" });
  s = act(s, "SET_ROLE", { role: "operator" });
  s = act(s, "REVISE_PROPOSAL");
  s = act(run(s), "REQUEST_APPROVAL");
  s = decision(finance(s), { proposalId: old.id, testId: old.test.id });
  assert.equal(s.phase, "requested");
  assert.equal(latestProposal(s).decision, null);
});
test("repeated decision does not create another approval or a payment", () => {
  const s = decision(finance(submitted()));
  const again = decision(s);
  assert.equal(again.audit.length, s.audit.length);
  assert.equal("payment" in again, false);
  assert.equal(orders[0].id, "PO-731");
  assert.equal(orders[0].cents, 124800);
});
test("changed freight fails fresh matching checks rather than inheriting a pass", () => {
  let s = act(draft(), "DEMO_UPDATE_ORDER");
  s = run(s);
  assert.equal(s.result.passed, false);
  assert.equal(s.result.checks.find((c) => c.name === "Total").pass, false);
  assert.notEqual(act(s, "REQUEST_APPROVAL").phase, "requested");
});
