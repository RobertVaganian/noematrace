import test from "node:test";
import assert from "node:assert/strict";
import { initialState, reducer } from "../src/model.js";
import { showcaseScene } from "../src/showcase.js";
import { RUN_ID } from "../src/run-reference.js";
import {
  encodeReview,
  decodeReview,
  readReview,
  writeReview,
  isPersistentReview,
} from "../src/persistence.js";

test("round-trip preserves returned/approved versions, source changes and exact decisions", () => {
  const state = showcaseScene("stale").state;
  const recovered = decodeReview(encodeReview(state));
  assert.equal(recovered.status, "restored");
  assert.deepEqual(recovered.state, state);
  assert.equal(recovered.state.proposals[1].status, "outdated");
  assert.equal(recovered.state.proposals[1].decision.testId, "TST-002");
});
test("legacy run references restore the same review and re-save with the current reference", () => {
  const state = showcaseScene("history").state;
  const saved = JSON.parse(encodeReview(state));
  assert.equal(saved.runId, RUN_ID);
  saved.runId = "RN-2048";
  const restored = decodeReview(JSON.stringify(saved));
  assert.equal(restored.status, "restored");
  assert.deepEqual(restored.state, state);
  assert.equal(JSON.parse(encodeReview(restored.state)).runId, RUN_ID);
  saved.runId = "RUN-261028-999";
  assert.equal(decodeReview(JSON.stringify(saved)).status, "invalid");
});
test("operator draft survives reload while an interrupted test never becomes a passing result", () => {
  let state = reducer(initialState, { type: "CANDIDATE", id: "PO-732" });
  state = reducer(state, {
    type: "REASON",
    value: "Verified every invoice item against the order.",
  });
  state = reducer(state, { type: "BEGIN_TEST" });
  const recovered = decodeReview(encodeReview(state));
  assert.equal(recovered.interrupted, true);
  assert.equal(recovered.state.phase, "idle");
  assert.equal(recovered.state.result, null);
  assert.equal(recovered.state.candidateId, "PO-732");
  assert.equal(recovered.state.reason, state.reason);
  assert.equal(recovered.state.tests.length, 0);
});
test("malformed records, incompatible schemas and broken source references fail closed", () => {
  assert.equal(decodeReview("{broken").status, "invalid");
  const saved = JSON.parse(encodeReview(showcaseScene("history").state));
  saved.schemaVersion = 9;
  assert.equal(decodeReview(JSON.stringify(saved)).status, "invalid");
  saved.schemaVersion = 1;
  saved.state.proposals[0].test.order = null;
  assert.equal(decodeReview(JSON.stringify(saved)).status, "invalid");
  assert.equal(decodeReview(null).status, "empty");
});
test("storage denial is recoverable and preview scenes never participate in persistence", () => {
  const denied = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("quota");
    },
  };
  assert.equal(readReview(denied).status, "unavailable");
  assert.equal(writeReview(denied, initialState), false);
  assert.equal(isPersistentReview("?showcase=history"), false);
  assert.equal(isPersistentReview("?capture=reference"), false);
  assert.equal(isPersistentReview(""), true);
});
test("reset replaces the saved review and does not resurrect old proposal history", () => {
  let raw;
  const store = {
    setItem(_, value) {
      raw = value;
    },
    getItem() {
      return raw;
    },
  };
  writeReview(store, showcaseScene("history").state);
  assert.equal(readReview(store).state.proposals.length, 2);
  writeReview(store, reducer(readReview(store).state, { type: "RESET" }));
  assert.equal(readReview(store).state.proposals.length, 0);
  assert.equal(readReview(store).state.reason, "");
});
test("finance note drafts retain exact text and scope; acknowledgement is never persisted", () => {
  let state = showcaseScene("finance").state;
  const id = state.proposals[0].id;
  state = reducer(state, {
    type: "DECISION_NOTE",
    proposalId: id,
    value: "Checked the original source line items.",
  });
  const restored = decodeReview(encodeReview(state)).state;
  assert.equal(
    restored.decisionDrafts[id],
    "Checked the original source line items.",
  );
  assert.equal("acknowledged" in restored, false);
  const operator = reducer(restored, { type: "SET_ROLE", role: "operator" });
  assert.equal(
    reducer(operator, {
      type: "DECISION_NOTE",
      proposalId: id,
      value: "Cannot edit",
    }),
    operator,
  );
  const decided = reducer(restored, {
    type: "DECIDE_PROPOSAL",
    proposalId: id,
    testId: state.proposals[0].test.id,
    decision: "approve",
    note: restored.decisionDrafts[id],
    acknowledged: true,
  });
  assert.equal(decided.phase, "approved");
  assert.equal(decided.decisionDrafts[id], undefined);
  assert.equal(
    decided.proposals[0].decision.note,
    "Checked the original source line items.",
  );
});
