import { evidenceState, latestProposal } from "./model.js";

// Guidance follows actual review state and never performs a domain action.
export function nextReviewAction(state) {
  const proposal = latestProposal(state);
  if (!state.sourceAccess.invoice || !state.sourceAccess.order)
    return { kind: "access", title: "Restore access to the evidence", text: "Both documents must be available. Use the demo controls to restore access, then run a fresh test.", label: "Open demo controls" };
  if (proposal && state.phase === "outdated")
    return { kind: "proposal", title: "Inspect the changed evidence", text: "The earlier test no longer supports this proposal. Review the differences, then prepare a new version as Operations.", label: "Review outdated proposal" };
  if (proposal && state.phase === "changes_requested")
    return { kind: "proposal", title: "Read the finance feedback", text: "The submitted version and decision stay in history. Operations can create a revised proposal and test it again.", label: "Read decision note" };
  if (proposal && state.phase === "approved")
    return { kind: "history", title: "The correction review is complete", text: "The decision is attached to this proposal and test. The original run remains paused; payment execution is a separate step outside this prototype.", label: "Inspect proposal history" };
  if (proposal && state.phase === "requested")
    return state.role === "operator"
      ? { kind: "finance", title: "Hand the proposal to Finance", text: "In this demo you can switch to the finance role. Review the tested evidence, add a decision note and approve or request changes.", label: "Switch to finance review" }
      : { kind: "proposal", title: "Review the submitted version", text: "Check the exact tested records and the operator’s explanation. Record a decision with a note.", label: "Open finance review" };
  if (state.role !== "operator")
    return { kind: "operations", title: "Prepare the correction as Operations", text: "There is no proposal ready for a finance decision. Switch to the operations role to inspect and test the association.", label: "Switch to operations review" };
  if (state.phase === "tested")
    return state.result?.passed && evidenceState(state, state.result).current
      ? { kind: "review", title: "Submit the tested correction", text: "All four checks passed. Review the result and request approval of this exact version.", label: "Review test and submit" }
      : { kind: "review", title: "Resolve the remaining differences", text: "A matching total alone is insufficient. Inspect the supplier and individual line items, then edit and retest the proposal.", label: "Review failed test" };
  if (state.phase === "testing")
    return { kind: "review", title: "A read-only test is running", text: "The test compares supplier, currency, total and line items. It does not run payment steps.", label: "Open current test" };
  return { kind: "review", title: "Inspect the linked purchase order", text: "INV-2048 is EUR 12,480.00; PO-731 is EUR 1,248.00. Compare the source values, choose an order and explain the evidence you checked.", label: "Start the review" };
}
