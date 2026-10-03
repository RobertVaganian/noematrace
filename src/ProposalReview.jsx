import { useState, useEffect, useRef } from "react";
import { AssociationEvidence } from "./AssociationEvidence.jsx";
import { EvidenceChanges } from "./VersionComparison.jsx";
import { EvidenceDocument } from "./EvidenceDocument.jsx";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  LockSimpleIcon,
  InfoIcon,
  ClipboardTextIcon,
  GitDiffIcon,
} from "@phosphor-icons/react";
import { Modal, Checks, Money, DataText } from "./components.jsx";
import {
  people,
  latestProposal,
  currentOrder,
  evidenceState,
  proposalLabels,
  orders,
} from "./model.js";
export function ProposalHistory({ state, onOpen, onCreate, onCompare }) {
  return (
    <section className="proposal-history">
      <header>
        <div>
          <h2>Proposal history</h2>
          <p>
            Submitted versions preserve the evidence and decision made at that
            time.
          </p>
        </div>
        <div className="history-actions">
          <span className="quiet-tag">
            {state.proposals.length}{" "}
            {state.proposals.length === 1 ? "version" : "versions"}
          </span>
          {state.proposals.length > 1 && (
            <button className="secondary-button" onClick={onCompare}>
              <GitDiffIcon size={16} />
              Compare versions
            </button>
          )}
        </div>
      </header>
      {state.proposals.length === 0 ? (
        <div className="history-empty">
          <ClipboardTextIcon size={26} />
          <h3>No proposals submitted</h3>
          <p>
            Inspect the source evidence and test a corrected association before
            requesting approval.
          </p>
          <button className="primary-button" onClick={onCreate}>
            Review linked order
            <ArrowRightIcon size={16} />
          </button>
        </div>
      ) : (
        <>
          <div className="version-table-heading">
            <span>Version / evidence</span>
            <span>Decision</span>
          </div>
          {[...state.proposals].reverse().map((p) => (
            <button
              key={p.id}
              className="version-row"
              aria-label={`Open proposal version ${p.version}`}
              onClick={() => onOpen(p.id)}
            >
              <span>
                <strong>
                  v{p.version}
                  <span className="mono">PO-731 → {p.candidateId}</span>
                </strong>
                <small>
                  <DataText>{`${p.test.id} · ${p.candidateId} v${p.test.order.version} · ${p.submittedAt}`}</DataText>
                </small>
                <small>{p.submittedBy}</small>
              </span>
              <span>
                <span className={`proposal-status ${p.status}`}>
                  {proposalLabels[p.status]}
                </span>
                {p.decision && <small>{p.decision.actor}</small>}
              </span>
              <ArrowRightIcon size={17} />
            </button>
          ))}
          <p className="history-footnote">
            <LockSimpleIcon size={15} />
            The original run and payment actions remain unchanged.
          </p>
        </>
      )}
    </section>
  );
}
export function ProposalDialog({
  state,
  proposal,
  dispatch,
  onClose,
  onRevise,
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const noteRef = useRef(null);
  const ackRef = useRef(null);
  const p = proposal;
  const note = state.decisionDrafts?.[p.id] || "";
  const freshness = evidenceState(state, p.test);
  const current = p.id === latestProposal(state)?.id;
  const canDecide = current && p.status === "pending" && freshness.current;
  const canRevise =
    current &&
    state.role === "operator" &&
    ["changes_requested", "outdated"].includes(p.status) &&
    ["changes_requested", "outdated"].includes(state.phase);
  const latest = currentOrder(state, p.candidateId);
  const noteInvalid = canDecide && !!state.error && note.trim().length < 8;
  const ackInvalid = canDecide && !!state.error && !noteInvalid && !acknowledged;
  useEffect(() => {
    if (!attempt || !state.error || !canDecide) return;
    if (noteInvalid) noteRef.current?.focus();
    else if (ackInvalid) ackRef.current?.focus();
  }, [attempt]);
  const decide = (decision) => {
    setAttempt((n) => n + 1);
    dispatch({
      type: "DECIDE_PROPOSAL",
      proposalId: p.id,
      testId: p.test.id,
      decision,
      note,
      acknowledged,
    });
  };
  return (
    <Modal
      title={
        p.status === "pending"
          ? `Proposal v${p.version}`
          : `${proposalLabels[p.status]} · v${p.version}`
      }
      eyebrow="RN-2048 / Finance review"
      onClose={onClose}
      className="proposal-modal"
    >
      <div className="proposal-overview">
        <div>
          <span className={`proposal-status ${p.status}`}>
            {p.status === "approved" ? (
              <CheckCircleIcon size={16} />
            ) : p.status === "pending" ? (
              <ClockIcon size={16} />
            ) : (
              <WarningCircleIcon size={16} />
            )}
            {proposalLabels[p.status]}
          </span>
          <h3>Correct the purchase order association</h3>
          <p>
            Submitted by {p.submittedBy} · <time dateTime={`2026-10-31T${p.submittedAt}`}>31 Oct 2026 {p.submittedAt}</time>
          </p>
        </div>
        <span className="mono">{p.id}</span>
      </div>

      {!freshness.current && (
        <div className="evidence-alert" role="status">
          <WarningCircleIcon size={20} />
          <div>
            <strong>This test no longer supports approval</strong>
            <p>{freshness.reason}</p>
            <p>
              <DataText>{`Tested ${p.candidateId} v${p.test.order.version} · Current v${latest.version}`}</DataText>
            </p>
          </div>
        </div>
      )}
      {!freshness.current && (
        <EvidenceChanges
          before={p.test.order}
          after={latest}
          available={state.sourceAccess.order}
        />
      )}

      <section className="proposal-diff" aria-label="Proposed change">
        <header>
          <span>Context field</span>
          <span>Original run</span>
          <span>Proposal v{p.version}</span>
        </header>
        <div>
          <span>Purchase order</span>
          <span className="mono">PO-731</span>
          <strong className="mono">{p.candidateId}</strong>
        </div>
        <div>
          <span>Order total</span>
          <span>
            <Money cents={orders[0].cents} />
          </span>
          <strong>
            <Money cents={p.test.order.cents} />
          </strong>
        </div>
        <div>
          <span>Invoice total</span>
          <span>
            <Money cents={p.test.invoice.cents} />
          </span>
          <span>
            <Money cents={p.test.invoice.cents} />
          </span>
        </div>
        <div>
          <span>Difference</span>
          <span className="conflict">
            <Money cents={p.test.invoice.cents - orders[0].cents} />
          </span>
          <strong>
            <Money cents={p.test.invoice.cents - p.test.order.cents} />
          </strong>
        </div>
      </section>

      <section className="proposal-evidence">
        <header>
          <h3>Read-only test evidence</h3>
          <span className="mono">{p.test.id}</span>
        </header>
        <div className="snapshot-meta">
          Invoice v{p.test.invoice.version} · {p.candidateId} v
          {p.test.order.version} · Tested {p.test.testedAt}
        </div>
        <Checks checks={p.test.checks} details={false} />
        <AssociationEvidence invoice={p.test.invoice} order={p.test.order} access={state.sourceAccess} testId={p.test.id} />
        <div className="evidence-disclosures">
          <details>
            <summary><DataText>Invoice INV-2048</DataText> · Document versions</summary>
            <EvidenceDocument state={state} test={p.test} source="invoice" />
          </details>
          <details>
            <summary>
              Purchase order <DataText>{p.candidateId}</DataText> · Document versions
            </summary>
            <EvidenceDocument state={state} test={p.test} source="order" />
          </details>
        </div>
      </section>
      <section className="reason-summary">
        <span className="eyebrow">Operator's explanation</span>
        <p>{p.reason}</p>
      </section>
      <div className="muted-note">
        <LockSimpleIcon size={18} />
        <div>
          <strong>Scope of this decision</strong>
          <p>
            Approve the corrected association for a separate continuation step.
            This decision does not create, submit or authorize a payment. The
            original run is preserved.
          </p>
        </div>
      </div>

      {p.decision && (
        <section className="decision-record">
          <header>
            <h3>
              {p.decision.status === "approved"
                ? "Approval recorded"
                : "Changes requested"}
            </h3>
            <span>
              v{p.decision.version} · {p.decision.testId}
            </span>
          </header>
          <p>{p.decision.note}</p>
          <small>
            {p.decision.actor} · Finance approver · <time dateTime={`2026-10-31T${p.decision.time}`}>31 Oct 2026 {p.decision.time}</time>
          </small>
          {p.status === "outdated" && (
            <p className="conflict">
              This earlier decision cannot be used with the updated evidence.
            </p>
          )}
        </section>
      )}

      {state.role === "approver" && p.status === "pending" && (
        <section className="finance-decision">
          <label className="input-label" htmlFor="decision-note">
            Decision note<span className="field-required" aria-hidden="true">Required</span>
          </label>
          <textarea
            id="decision-note"
            ref={noteRef}
            aria-required="true"
            aria-invalid={noteInvalid || undefined}
            aria-describedby={`decision-note-help${noteInvalid ? " decision-note-error" : ""}`}
            placeholder="Record the evidence behind your decision…"
            maxLength={500}
            value={note}
            onChange={(e) =>
              dispatch({
                type: "DECISION_NOTE",
                proposalId: p.id,
                value: e.target.value,
              })
            }
            disabled={!canDecide}
          />
          <div className="field-meta"><span id="decision-note-help">8–500 characters. Saved with this decision.</span><span>{note.length}/500</span></div>
          {noteInvalid && <p className="field-error" role="alert" id="decision-note-error">{state.error}</p>}
          <label className="approval-ack">
            <input
              type="checkbox"
              ref={ackRef}
              aria-invalid={ackInvalid || undefined}
              aria-describedby={ackInvalid ? "decision-ack-error" : undefined}
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              disabled={!canDecide}
            />
            <span>
              I reviewed the supplier, currency and line items for proposal v
              {p.version}.
            </span>
          </label>
          {ackInvalid && <p className="field-error" role="alert" id="decision-ack-error">{state.error}</p>}
          {state.error && !canDecide && (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="inline-actions">
            <button
              className="secondary-button"
              disabled={!canDecide}
              onClick={() => decide("changes")}
            >
              Request changes
            </button>
            <button
              className="primary-button"
              disabled={!canDecide}
              onClick={() => decide("approve")}
            >
              Approve correction
              <ArrowRightIcon size={16} />
            </button>
          </div>
          <p className="decision-actor">
            Recording as {people.approver.name} · Finance approver
          </p>
        </section>
      )}
      {state.role === "operator" && p.status === "pending" && (
        <p className="permission-note">
          <InfoIcon size={17} />
          Assigned to {people.approver.name}. Your operations role cannot
          approve this proposal.
        </p>
      )}
      {state.role === "approver" && !freshness.current && (
        <p className="permission-note">
          The operations reviewer must submit a newly tested version.
        </p>
      )}
      {!(state.role === "approver" && p.status === "pending") && (
        <div className="inline-actions proposal-close">
          <button className="secondary-button" onClick={onClose}>
            <ArrowLeftIcon size={15} />
            Back to run
          </button>
          {canRevise && (
            <button className="primary-button" onClick={onRevise}>
              Create revised proposal
              <ArrowRightIcon size={16} />
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
export function DemoControls({ state, dispatch }) {
  return (
    <section className="demo-controls">
      <h3>Explore the review states</h3>
      <p>
        These controls change synthetic source records. Use the avatar menu to
        switch demo roles.
      </p>
      <dl>
        <div>
          <dt>PO-732 / ERP record</dt>
          <dd>
            v{currentOrder(state, "PO-732").version} ·{" "}
            <Money cents={currentOrder(state, "PO-732").cents} />
          </dd>
        </div>
        <div>
          <dt>Invoice access</dt>
          <dd>{state.sourceAccess.invoice ? "Available" : "Unavailable"}</dd>
        </div>
      </dl>
      <div className="demo-control-actions">
        <button
          className="secondary-button"
          onClick={() =>
            dispatch({
              type: "DEMO_UPDATE_ORDER",
            })
          }
        >
          Update ERP order
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            dispatch({
              type: "DEMO_RESTORE_ORDER",
            })
          }
        >
          Restore matching values
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            dispatch({
              type: "DEMO_SOURCE_ACCESS",
              source: "invoice",
              available: !state.sourceAccess.invoice,
            })
          }
        >
          {state.sourceAccess.invoice
            ? "Remove invoice access"
            : "Restore invoice access"}
        </button>
      </div>
      <p className="demo-control-hint">
        Updated sources require a fresh test. Restoring access or matching
        values never restores an earlier approval.
      </p>
    </section>
  );
}
