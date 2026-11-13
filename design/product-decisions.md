# NoemaTrace — product decisions

Status: self-initiated product design concept, interactive prototype 0.13. This document records design reasoning and implementation evidence. It does not report user-research findings or business outcomes.

## Product hypothesis

An operations reviewer needs to turn a blocked automated invoice run into an evidence-backed correction that a finance approver can inspect. Showing execution events is only one part of that task. The proposed value is the controlled transition from diagnosis to a tested correction and a version-specific human decision.

Demand, frequency of this workflow and fit with existing operations tools remain hypotheses.

## Main scenario

Invoice INV-2048 is associated with PO-731. Their totals differ by EUR 11,232.00. The invoice has no PO reference, so the reviewer must compare other evidence. PO-732 matches supplier, currency, total and all line items. PO-733 has the same total but another supplier and different items.

The reviewer tests a proposed association, submits it and receives an independent finance decision. If finance requests changes, the reviewer creates another version. If ERP evidence changes later, the earlier test and approval cannot be reused.

## Decisions and tradeoffs

| Decision | Reason | Tradeoff / limit |
| --- | --- | --- |
| Keep the original run separate from the proposal | Preserve the evidence behind the failure and allow comparison | The interface must explicitly distinguish an approved correction from completed execution |
| Require four checks, not amount matching alone | Equal totals can still connect unrelated documents | The prototype uses strict, ordered line matching; a production reconciliation model needs broader rules |
| Capture a submitted source snapshot | Reviewers need to know what evidence supported a decision at that moment | A historical snapshot must be labelled when current evidence differs |
| Link decisions to version and test IDs | Prevent a decision for one proposal from silently applying to another | More versions require a readable history |
| Separate proposer and approver actions | Make responsibility and decision authority visible | Demo role switching is not real authorization; enforcement would be server-side in a deployed product |
| Invalidate evidence after source changes or access loss | The approver cannot rely on unavailable or changed evidence | The demo invalidates conservatively with one evidence epoch; production should track affected records |
| Require a note for approval or return | Preserve the reason for the human decision | Adds writing effort; usefulness and required length need testing |
| Stop before payment execution | Keep the demonstrated decision boundary explicit | Execution continuation, idempotency and payment reconciliation remain outside this prototype |
| Use a graph with a persistent inspector and an events alternative | Support both dependency inspection and chronological reading | Graph comprehension is an unvalidated design hypothesis |
| Use neutral surfaces and restrained semantic color | Keep document amounts, provenance and actions visually legible | The palette is a design choice; its usability has not been established through research |

## What was actually checked

- Model tests exercise misleading equal totals, required evidence, stale asynchronous results, version-specific decisions, role restrictions, source updates, access loss and revision history.
- Browser walkthrough: v1 returned with a note; v2 tested, resubmitted and approved; both decisions and snapshots remain inspectable.
- Browser walkthrough: later ERP update invalidates approval; an inaccessible invoice shows an unavailable state instead of a document.
- Keyboard and compact-screen checks include focus restoration and decision-state announcements.

These checks establish implemented behavior. They do not establish that operators will understand the workflow or prefer it to their current process.

## Remaining product questions

1. Can operators identify the next safe action without interpreting graph topology first?
2. Does the original mismatch beside an approved proposal clearly communicate that execution is still paused?
3. Do approvers notice source freshness and distinguish snapshots from current records?
4. Is a decision note useful for routine approvals, or should requirements vary by risk?
5. What evidence is sufficient when a supplier has several equally plausible matching orders?


## Review polish / v0.4

The phone screenshot exposed clipped table columns and inconsistent status label alignment. Narrow screens now use a semantic event list, while desktop retains the dense table with a reserved icon column. All six graph nodes fit a compact dependency layout at initial load. Theme selection changes presentation only and persists locally; it never resets a draft or creates a decision. Light surfaces, text and status colors have explicit counterparts; document records retain their paper presentation. The graph border is muted slate-blue, with exception meaning still stated by text and a muted-plum icon.

## Financial review and audit / v0.5

A review of the latest screenshot identified weak money typography and an awkward compact N. The interface now uses locally hosted Inter, tabular lining figures and separate aligned currency/number columns. Uniform financial rows give Invoice, Order and Difference the same comparison structure. A compact interlocking-path mark replaces the letter; it represents a trace and a linked record without adding a decorative app tile.

Search, event-type filters and chronological sorting help inspect a growing review history. CSV exports only the currently visible events, while JSON retains the complete review, submitted versions, test identities and evidence snapshots. Unavailable document bodies are omitted from all exported snapshots; their IDs and versions remain. Content and redaction behavior have automated checks. The browser's download-event helper timed out, so successful file arrival is not claimed as browser-verified.

Participant recruitment is still pending. Expert inspection, browser walkthroughs and automated checks are documented separately from the still-open questions about operator comprehension and usefulness.

## Continued review and exact differences / v0.6

The light phone screenshot exposed a discoverability gap: a movable graph looked static. A dedicated navigation strip keeps a drag instruction visible; a user-triggered short pan returns to its original position. Zoom and reset controls stay visible. Reduced-motion users receive static guidance. The strip occupies layout space and must never overlap nodes or the execution log.

The synthetic review now persists on the same browser/device. This includes operator drafts, immutable submitted snapshots, decisions and pending finance notes. The approval acknowledgement remains transient; an interrupted test returns to an editable state and must be run again. Corrupt/incompatible records fail closed, unavailable storage is disclosed, and showcase/capture views stay isolated. Local saving is not cross-device sync, production authorization or ERP persistence.

Proposal comparison shows changed explanations and document fields rather than forcing reviewers to inspect snapshots from memory. A separate current-source comparison explains why evidence became outdated. Unavailable source bodies remain hidden. Softer radii are consistent across controls, nodes and dialogs; the chosen neutral layout, typography and semantic color remain.


## Clear gesture feedback and document navigation / v0.7

The effect of Show me was unclear during interface review. The interaction is now labelled Show gesture, moves the real viewport over 1.6 seconds and gives explicit completion guidance with Replay. It remains optional and interruptible. Keyboard focus stays on the control during playback; reduced-motion users retain static guidance.

Measurement found aligned account-control centers but mismatched 30/36 px sizes. Both controls now have 40 px hit areas and the role avatar uses a centered 32 px initials circle. The avatar and menu preserve the synthetic role identity. Escape dismisses the profile menu and restores focus.

Inside a submitted proposal, Document versions switches between the exact tested snapshot and the current read-only source. Metadata identifies the active version and its relationship to the test. Current viewing never replaces submitted evidence, and source availability gates both modes. Three additional behavior tests cover these boundaries.


## Readable dependency directions / v0.8

Screenshot inspection exposed weak direction cues: small open arrowheads, thin strokes and reduced opacity on downstream links. The graph now uses filled library arrowheads, non-scaling 1.9/2.4 px strokes and separate neutral/focused palettes. Marker dimensions compensate for viewport zoom, retaining an approximately 8 px arrow length. A quieter dot grid stays subordinate to the connections.

Uniform 76 px node bodies align row centers and remove tiny unnecessary elbows. The desktop order input enters the comparison from the left instead of behind its Conflict label. Compact columns use the full existing fit width with a 34 px gap, without reducing text scale. Direct connections of the selected node are highlighted and input/output counts are shown; all other dependencies stay visible. These cues describe dependency structure, not resumed execution or payment authorization.

Three additional checks cover adjacency, retained direction/ports and connection contrast in both themes. The portfolio case reports 41 behavior checks; hosting checks remain separate.

## Iteration 9 / finish the review path

Direct invoice/order comparison removes the need to remember quantities and unit prices while switching documents. It reuses the field-difference anatomy from version history. Differences-only is the initial filter; matching records expose a concise match state with a route to all fields. Document IDs are excluded because an invoice and order deliberately have different identifiers. Line comparison remains positional and is labelled accordingly. Draft comparisons use current records; test and proposal comparisons use exact captured records. Source access gates values and mismatch counts before rendering.

An optional guide introduces Inspect, Test, Submit and Decide. A pure state selector chooses the next action from the current review; it never performs a test or decision. An explicit demo action hands a submitted proposal to Finance. Access loss and stale evidence take precedence over any previous success. Completion leads to decision history and states that the original workflow remains paused. The case entry opens the guide, while ordinary workspace entry remains direct.

Compact browser inspection exposed clipped values in the old two-column branch result. Below 560 px the branches stack, retaining tabular numbers and full currency/amount values. This is an observed layout correction; no participant validation is implied.


## Iteration 10 / brand balance, canvas and controls

Three screenshots identify a left-biased desktop brand lockup, a low-visibility light canvas, border-only selection and perceived toolbar/avatar imbalance. The adjustment stays within the selected layout: center the existing mark/name together, use Geist for the wordmark while keeping Inter for application copy, give selection a restrained slate fill, and maintain a 1.5 CSS px dot diameter while zooming. Dot spacing increases to 20 source units and the label names empty space explicitly. Existing filled arrowheads stay dominant.

All three account controls share 40 px boxes; compass and theme icons share 20 px slots. Avatar text uses a separate glyph span with a 0.5 px optical adjustment, rather than treating the centered line box as sufficient evidence of visual centering. Verification includes rendered pixel bounds, both themes and compact rails.

Competitive context: this is a focused concept within an existing product category. Camunda Operate documents diagnosis, variable correction and retry; n8n documents failed-execution retry; UiPath Action Center documents invoice workflows requiring human validation. These establish comparable mechanisms, not a claim that NoemaTrace is an original category or that any vendor lacks an equivalent feature. Its portfolio value is the implemented evidence/version/decision scenario; independent demand remains unvalidated.

Primary references checked 1 Nov 2026:
- https://docs.camunda.io/docs/components/operate/userguide/resolve-incidents-update-variables/
- https://docs.n8n.io/workflows/executions/all-executions/
- https://docs.uipath.com/action-center/automation-cloud/latest/user-guide/introduction


## Iteration 11 / direct manipulation and a clear recovery action

Repeated interface review showed that the gesture demonstration did not communicate its effect. The current design removes the animation, Replay and their state completely. A static instruction now says to click and hold empty space before dragging; a coarse-pointer CSS variant names touch. The existing graph reset is exposed as a labelled Fit action beside zoom controls. It restores the responsive fitted viewport, cancels ongoing library viewport motion with an immediate setViewport call, and preserves the selected step and all review state. This is an explicit recovery action, not another onboarding feature.

A broader screen inspection found insufficient separation between event status and details. The table now gives the status a minimum column width and right padding. Events uses full event cards below a working-panel width of 680 px, even on a desktop with an inspector. The inspector and overall layout remain. The mobile reviewer context now uses an icon/text grid after inspection exposed an orphaned icon row. Document, comparison and finance values remain intact; no unrelated feature was added.

The export footer inspection also exposed a broad Audit log secondary-button margin leaking into a nested dialog. The margin now targets only the direct Back to run button; export actions share a 40 px row.

## Final form and keyboard polish / 0.12

A browser walkthrough exposed that the test action could be clipped at the bottom of a long form and an error left keyboard focus on the action. Review actions now sit outside the scrolling evidence. Errors appear with the affected order picker or required explanation, describe their limits in advance and move focus after an explicit attempt. Finance note and acknowledgement errors follow the same pattern. This improves recovery without selecting evidence, generating explanations or making decisions for the reviewer.

Run and source tabs now use roving focus and linked panels, following the existing case tab convention. The app and case are separate JavaScript chunks. Shared CSS and fonts remain eagerly loaded in their established order: an initial split exposed a moved sidebar case link, which was corrected during the layout pass. Browser inspection and build output support these changes; no measured real-user load-time or participant-comprehension claim is made.

## Interface onboarding / 0.13

The tour uses compact coachmarks with looping previews and a Next action. Four coachmarks connect a concise explanation to the real comparison, canvas controls, evidence panel (Details on phones) and compass. The GIFs are generated UI illustrations using the existing Inter and Phosphor system, labelled Preview. This separates a readable gesture example from the confusing earlier animation of the actual canvas.

The tour starts for a new pristine review and resumes an unfinished step. Completed or skipped tours stay closed. Existing work and explicit showcase/guide entry are respected; replay is available through the guide. Onboarding preferences use their own key, so a replay cannot overwrite the working review. The final action is taken from the existing state-aware guide, with no automatic evidence entry, test or human decision.

Native dialog behavior provides focus containment and Escape. Cards are placed beside the actual visible anchor and clamped to the viewport. Motion can be paused, and reduced motion starts with matching static artwork. These are implemented behaviors checked through browser walkthroughs and automated preference/layout tests; visitor comprehension has not been validated with participants.


## Tour legibility and navigation / 0.14

Inspection measured the original desktop artwork at 288 × 119 px; its 8–14 px source text became too small. The new card is at most 440 px with artwork about 400 × 196 px on desktop and 328 × 160 px at a 390 px viewport. Larger 11–18 px source type and shorter prose improve the example itself, rather than simply stretching the old small labels. Motion uses a six-second cycle with reading holds, eased movement and matched endpoints. The tour retains the GIF-like visual format. Lightweight 60 fps MP4 loops support actual pause/resume; 50 fps GIFs and PNGs remain fallbacks. Controls sit below the illustration to avoid obscuring evidence. Expand supports closer inspection without advancing the tour or review.

Navigation can collapse to a desktop icon rail or be hidden on compact layouts. A persistent 40 px header control restores it. The separate preference respects isolated illustrations. These changes free working space while preserving the chosen sidebar/graph/inspector/log layout and actual review state. Real authentication, ERP integration and server history remain outside the concept; a useful next production milestone is one real source integration with server-enforced roles, not more decorative dashboard features.


## Motion as feedback / 0.15

Motion follows a shared interaction rhythm across the interface. Small changes use 110 ms color/stroke transitions; windows enter over 180 ms with at most 8 px movement and a 0.985 initial scale. The mobile inspector uses a 12 px horizontal entry. Profile and toast exits are retained only for 120 ms and become inert; reopening or unmounting cancels the old completion callback. Navigation width changes over 200 ms while preserving the graph's existing resize/Fit logic. The full brand lockup remains centered as its wordmark collapses.

Tab underlines are measured from the actual active button, including font changes and count badges, so motion does not introduce alignment drift. New content enters together. Numeric values, graph geometry, source-permission gating and real reducer transitions remain direct. The read-only test and human decisions never wait on motion; Fit stays immediate. Native close buttons, Cancel and Escape share the animated dismissal path. Reduced motion and isolated illustrations disable both CSS and JavaScript motion. No dependency or motion-library bundle was added.
