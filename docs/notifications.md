# Review notifications

The bell opens activity for the current demo role. Its count includes unread events for that role only.

| Recorded event | Operations | Finance | Destination |
| --- | --- | --- | --- |
| Original run mismatch | Yes | — | Compare totals step |
| Completed test | Yes | — | Immutable saved test |
| Submitted proposal | — | Yes | Exact submitted version |
| Finance decision | Yes | — | Version with the recorded decision |
| Source change or access change | Yes | Yes | Proposal or test that existed at that event |

Notifications are derived from the original run and append-only review events. No pending test, unsubmitted draft or unrecorded decision creates an alert. Later revisions do not redirect an old event to the newest version. A historical approval describes the recorded decision; the version may now have outdated evidence.

## Reading and storage

All and Unread filters, individual read/unread controls and Mark all read operate on the current role. Mark all read affects existing events; future events remain unread. Opening a destination marks the event read and leaves the review rules unchanged. Read receipts are local view state, not audit events or acknowledgements.

The latest 50 events per role are retained in the inbox. Read IDs persist with the review in this browser. Invalid IDs are ignored. Resetting the demo clears review history and read receipts. Showcase and capture views are isolated from saved work.

## Boundaries

Saved tests are read-only. Proposal links preserve the existing Finance guards, source-access checks and exact-version decision rules. Reading never tests, submits, approves or executes a payment. This prototype has no email, operating-system push or background delivery. Roles are simulated; they are not server-enforced access controls.
