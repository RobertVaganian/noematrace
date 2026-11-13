# NoemaTrace — product decisions

NoemaTrace is a self-initiated product design concept. These notes explain the current prototype's workflow, interface choices and open questions. The package version is recorded in [package.json](../package.json).

## The review scenario

Invoice INV-2048 for EUR 12,480 is linked to PO-731 for EUR 1,248. The invoice has no purchase order reference. PO-732 matches its supplier, currency, total and line items; PO-733 has the right total but a different supplier and items.

Operations investigates the mismatch, tests a proposed association and submits it to Finance. Finance reviews that version and approves it or returns it with a note. Approval records a correction; the original run stays paused before payment.

The product hypothesis is that keeping the failed check, source documents and proposal together will make this review easier to follow. Demand for the workflow and its fit with existing tools still need validation.

## Workflow decisions

| Decision | Reason | Tradeoff |
| --- | --- | --- |
| Keep the original run beside the proposal | Preserve the failure context while reviewing a correction | An approved proposal must remain distinct from completed execution |
| Check supplier, currency, total and line items | A matching amount can connect unrelated documents | Line items are compared in order; real reconciliation would need broader rules |
| Save the submitted source snapshot | Make the evidence behind each decision inspectable | Historical snapshots must be distinguished from current records |
| Attach decisions to a proposal version and test | Keep an earlier approval from applying to a revision | More versions make history harder to scan |
| Separate Operations and Finance actions | Make the handoff and decision responsibility visible | Role switching is simulated; production authorization needs a server |
| Require a fresh test after source changes or access loss | Prevent approval based on outdated or unavailable evidence | The prototype invalidates evidence conservatively; a production system should track affected records |
| Require a decision note | Keep the reason for an approval or return | The writing effort and minimum useful detail need testing |
| Stop before payment execution | Give correction approval a clear scope | Payment execution and reconciliation are outside the prototype |

## Interface decisions

The dependency graph shows where the run stopped. A persistent inspector holds the selected step's details, and the execution log offers a chronological view. An evidence-first layout remains an alternative to test if the graph slows diagnosis.

Invoice and order comparisons put supplier, currency, amounts and line items side by side. Proposal history uses the same comparison structure for revisions and source changes. Unavailable source bodies stay hidden in the interface and exports.

Light and dark themes share status labels and icons. Muted plum identifies mismatched evidence, blue marks selection and amber indicates waiting. Tabular figures align money values. Compact layouts stack comparisons and use event cards to keep details readable.

The seven-step tour introduces navigation, evidence, resizing, testing, decisions and source changes. It can be skipped or replayed. Its illustrations explain an action without entering evidence or making a review decision. Motion can be paused, with static examples for reduced motion.

Panels can be resized, and Fit restores the graph viewport. Keyboard controls, focus restoration and inline validation support recovery from an error. Layout, theme and tour preferences are stored separately from the review.

## Storage and implementation limits

Review drafts, submitted snapshots and decisions are saved in the current browser. Interrupted tests require another run; incompatible or corrupt saved data is rejected. This provides local recovery, without cross-device synchronization.

Records are synthetic. The app has no live ERP, banking integration or server-enforced roles. CSV exports the visible audit events; JSON includes review versions and evidence snapshots. Unavailable document bodies are omitted from exports.

## Verification

The repository's [behavior tests](../tests) cover evidence matching, role restrictions, revisions, source changes, access loss, exports and local recovery. Tour and media checks cover animation geometry, clipping and loaded captures.

Recorded browser walkthroughs cover a returned v1 followed by an approved v2, a later ERP update, unavailable source documents, keyboard interaction and compact layouts. These checks support the implemented behavior. Participant usability sessions and measured business outcomes are still outstanding.

See the [usability plan](validation-plan.md) for proposed tasks and observations. Media sources and reproduction commands are documented in the [case media notes](../public/case/README.md) and [tour media notes](../public/tour/README.md).

## Questions for usability sessions

1. Can reviewers find the next action without interpreting the graph first?
2. Is it clear that correction approval leaves the original run paused?
3. Do approvers distinguish a saved snapshot from current source data?
4. Does a required note help routine approvals enough to justify the effort?
5. What evidence is sufficient when several purchase orders look plausible?

## Related workflows

Camunda Operate, n8n and UiPath Action Center provide relevant context for incident recovery and human review:

- [Camunda: resolve incidents and update variables](https://docs.camunda.io/docs/components/operate/userguide/resolve-incidents-update-variables/)
- [n8n: workflow executions](https://docs.n8n.io/workflows/executions/all-executions/)
- [UiPath: Action Center introduction](https://docs.uipath.com/action-center/automation-cloud/latest/user-guide/introduction)

These references describe comparable mechanisms. The questions above concern this prototype's specific review flow.
