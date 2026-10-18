import test from "node:test";
import assert from "node:assert/strict";
import { nextReviewAction } from "../src/review-guide.js";
import { initialState, reducer } from "../src/model.js";
import { showcaseScene } from "../src/showcase.js";

test("guide opens review without mutating the draft", () => {
  const before = structuredClone(initialState);
  assert.equal(nextReviewAction(initialState).kind, "review");
  assert.deepEqual(initialState, before);
  assert.equal(nextReviewAction({ ...initialState, role: "approver" }).kind, "operations");
});
test("passing test guidance is distinct from failed test guidance", () => {
  const passed = showcaseScene("comparison").state;
  assert.match(nextReviewAction(passed).title, /Submit/);
  assert.match(nextReviewAction({ ...passed, result: { ...passed.result, passed: false } }).title, /differences/);
});
test("submitted proposal offers an explicit demo role handoff", () => {
  const state = showcaseScene("finance").state;
  assert.equal(nextReviewAction(state).kind, "proposal");
  assert.equal(nextReviewAction({ ...state, role: "operator" }).kind, "finance");
});
test("approved correction ends in history while stale evidence requires review", () => {
  assert.equal(nextReviewAction(showcaseScene("history").state).kind, "history");
  assert.match(nextReviewAction(showcaseScene("stale").state).title, /changed evidence/);
});
test("access loss takes precedence over a completed or submitted review", () => {
  const state = reducer(showcaseScene("history").state, { type: "DEMO_SOURCE_ACCESS", source: "invoice", available: false });
  assert.equal(nextReviewAction(state).kind, "access");
});
test("returned proposal guidance retains the decision note path", () => {
  const state = showcaseScene("finance").state;
  const p = state.proposals[0];
  const returned = reducer(state, { type: "DECIDE_PROPOSAL", proposalId: p.id, testId: p.test.id, decision: "changes", note: "Explain the source evidence.", acknowledged: false });
  assert.equal(nextReviewAction(returned).kind, "proposal");
  assert.match(nextReviewAction(returned).title, /feedback/);
});
