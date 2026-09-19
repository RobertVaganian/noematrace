import { initialState, reducer } from "./model.js";

const act = (state, type, fields = {}) => reducer(state, { type, ...fields });
const explanation =
  "Invoice has no order reference. Supplier SUP-4587, quantities, unit prices and all three items exactly match PO-732.";
function test(state) {
  state = act(state, "BEGIN_TEST");
  return act(state, "COMPLETE_TEST", { revision: state.revision });
}
function submit(state) {
  return act(test(state), "REQUEST_APPROVAL");
}
function decide(state, decision, note) {
  const p = state.proposals.at(-1);
  return act(act(state, "SET_ROLE", { role: "approver" }), "DECIDE_PROPOSAL", {
    proposalId: p.id,
    testId: p.test.id,
    decision,
    note,
    acknowledged: true,
  });
}

// Reproducible demo views are produced through the same transitions as the app.
// They contain synthetic records and never call an external service.
export function showcaseScene(name) {
  let state = act(initialState, "RESET");
  if (!["comparison", "finance", "history", "stale"].includes(name))
    return { state, tab: "trace", modal: null };
  state = act(act(state, "CANDIDATE", { id: "PO-732" }), "REASON", {
    value: explanation,
  });
  if (name === "comparison")
    return { state: test(state), tab: "trace", modal: "review" };
  state = submit(state);
  if (name === "finance")
    return {
      state: act(state, "SET_ROLE", { role: "approver" }),
      tab: "trace",
      modal: "proposal",
    };
  state = decide(
    state,
    "changes",
    "Please explain how you resolved the missing order reference.",
  );
  state = act(act(state, "SET_ROLE", { role: "operator" }), "REVISE_PROPOSAL");
  state = act(state, "REASON", {
    value:
      explanation +
      " Cross-checked against the order's individual line records.",
  });
  state = submit(state);
  state = decide(
    state,
    "approve",
    "Reviewed supplier, currency and all three line items. Approve the association correction only.",
  );
  if (name === "stale")
    return {
      state: act(state, "DEMO_UPDATE_ORDER"),
      tab: "proposals",
      modal: "proposal",
    };
  return { state, tab: "proposals", modal: null };
}
