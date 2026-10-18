import test from "node:test";
import assert from "node:assert/strict";
import { showcaseScene } from "../src/showcase.js";
import { reducer, evidenceState, latestProposal } from "../src/model.js";

test("portfolio scene preparation never changes the normal entry state", () => {
  const before = showcaseScene(null);
  for (const name of ["comparison", "finance", "history", "stale"])
    showcaseScene(name);
  assert.deepEqual(showcaseScene("unknown"), before);
  assert.equal(before.state.proposals.length, 0);
  assert.equal(before.modal, null);
});

test("the finance deep link opens a current pending version with real decision guards", () => {
  const { state, modal } = showcaseScene("finance");
  const proposal = latestProposal(state);
  assert.equal(modal, "proposal");
  assert.equal(state.role, "approver");
  assert.equal(proposal.status, "pending");
  assert.equal(evidenceState(state, proposal.test).current, true);
  const incomplete = reducer(state, {
    type: "DECIDE_PROPOSAL",
    proposalId: proposal.id,
    testId: proposal.test.id,
    decision: "approve",
    note: "",
    acknowledged: true,
  });
  assert.equal(latestProposal(incomplete).status, "pending");
});

test("history and outdated deep links preserve the same two submitted snapshots", () => {
  const history = showcaseScene("history").state;
  const stale = showcaseScene("stale").state;
  assert.equal(history.proposals.length, 2);
  assert.equal(history.proposals[0].decision.status, "changes_requested");
  assert.equal(latestProposal(history).status, "approved");
  assert.notEqual(history.proposals[0].test.id, history.proposals[1].test.id);
  assert.equal(latestProposal(stale).status, "outdated");
  assert.equal(evidenceState(stale, latestProposal(stale).test).current, false);
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(stale.proposals[i].test, history.proposals[i].test);
    assert.deepEqual(
      stale.proposals[i].decision,
      history.proposals[i].decision,
    );
  }
});
