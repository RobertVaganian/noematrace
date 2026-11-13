import { RUN_ID } from "./run-reference.js";
import { useState, useEffect, useRef } from "react";
import {
  FileIcon,
  LockSimpleIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import {
  invoice,
  orders,
  assessOrder,
  currentOrder,
  latestProposal,
  testIssue,
} from "./model.js";
import { Modal, DialogCloseButton, Checks, Money, DataText } from "./components.jsx";
import { AssociationEvidence } from "./AssociationEvidence.jsx";
export function Review({ state, dispatch, onClose, saveStatus = null }) {
  const [view, setView] = useState(
    state.phase === "tested" ? "result" : "edit",
  );
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const searchRef = useRef(null);
  const reasonRef = useRef(null);
  const accessRef = useRef(null);
  const issue = testIssue(state);
  const canTest = !issue && state.candidateId !== "PO-731" && state.phase !== "testing";
  const shortcut = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘↵" : "Ctrl ↵";
  const readiness = state.phase === "testing" ? "Checking the current evidence…" : !state.sourceAccess.invoice || !state.sourceAccess.order ? "Both sources must be available." : !state.candidateId || state.candidateId === "PO-731" ? "Select a different purchase order to test." : state.reason.trim().length < 8 ? "Add an explanation of at least 8 characters." : "Ready for a read-only test.";
  const showIssue = attempt > 0 && state.error && issue;
  useEffect(() => {
    if (!attempt || !state.error) return;
    const target = issue?.field === "order"
      ? searchRef.current
      : issue?.field === "reason"
        ? reasonRef.current
        : issue?.field === "access" ? accessRef.current : null;
    target?.focus();
  }, [attempt]);
  const beginTest = () => {
    setAttempt((n) => n + 1);
    dispatch({ type: "BEGIN_TEST" });
  };
  const list = orders
    .map((o) => currentOrder(state, o.id))
    .filter((o) =>
      `${o.id} ${o.vendor} ${o.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const candidate = currentOrder(state, state.candidateId);
  useEffect(() => {
    if (state.phase === "tested") setView("result");
  }, [state.phase]);
  if (state.role !== "operator")
    return (
      <Modal
        title="Operations review required"
        eyebrow={`${RUN_ID} / Permissions`}
        onClose={onClose}
        className="about-modal"
      >
        <p>
          Finance approvers review submitted proposals. An operations reviewer
          must prepare and test the correction first.
        </p>
        <DialogCloseButton className="primary-button">
          Back to run
        </DialogCloseButton>
      </Modal>
    );
  return (
    <Modal
      title={
        view === "result"
          ? "Compare test results"
          : "Review the linked purchase order"
      }
      eyebrow={`${RUN_ID} / Draft v${state.draftVersion}`}
      onClose={onClose}
      className="review-modal"
      onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && view === "edit") { event.preventDefault(); if (canTest) beginTest(); } }}
      context={view === "edit" && <div className="review-context">
        <FileIcon size={19} />
        {state.sourceAccess.invoice ? <><div><strong><DataText>INV-2048</DataText> · Northline Components</strong><small>Invoice context · Current source</small></div><Money cents={invoice.cents} /></> : <p>Invoice source unavailable</p>}
      </div>}
      footer={
        view === "result" && state.result ? (
          <div className="inline-actions review-result-actions">
            <button className="secondary-button" onClick={() => setView("edit")}>
              <ArrowLeftIcon size={15} />
              Edit proposal
            </button>
            <button
              className="primary-button"
              disabled={!state.result.passed}
              onClick={() => dispatch({ type: "REQUEST_APPROVAL" })}
            >
              Request approval
              <ArrowRightIcon size={16} />
            </button>
          </div>
        ) : (
          <div className="review-footer">
            <div className="review-footer-copy"><span><LockSimpleIcon size={16} />Read-only test. No payment actions.</span><small id="test-readiness" role="status">{readiness}</small></div>
            <button
              className="primary-button"
              disabled={!canTest}
              aria-describedby="test-readiness"
              aria-keyshortcuts="Control+Enter Meta+Enter"
              onClick={beginTest}
            >
              {state.phase === "testing" ? (
                <><SpinnerGapIcon className="spin" size={16} />Testing branch…</>
              ) : (
                <>Test corrected context<kbd aria-hidden="true">{shortcut}</kbd><ArrowRightIcon size={16} /></>
              )}
            </button>
          </div>
        )
      }
    >
      {saveStatus !== null && (
        <p
          className={`draft-save-note ${saveStatus ? "" : "save-unavailable"}`}
        >
          {saveStatus ? (
            <CheckCircleIcon size={14} />
          ) : (
            <WarningCircleIcon size={14} />
          )}
          {saveStatus
            ? "Draft and review history saved on this device."
            : "Could not save in this browser. Keep this tab open."}
        </p>
      )}
      {state.draftVersion > 1 && (
        <div className="revision-context">
          <strong>Draft v{state.draftVersion}</strong>
          <p>
            {latestProposal(state)?.decision?.note ||
              latestProposal(state)?.invalidatedReason ||
              "Recheck the current source evidence before resubmitting."}
          </p>
        </div>
      )}
      {(!state.sourceAccess.invoice || !state.sourceAccess.order) && (
        <div className="evidence-alert" role="status" ref={accessRef} tabIndex={-1}>
          <WarningCircleIcon size={18} />
          <div>
            <strong>Source unavailable</strong>
            <p>
              Both source documents must be accessible to test or request
              approval.
            </p>
          </div>
        </div>
      )}
      {view === "result" && state.result ? (
        <div className="test-result">
          <div
            className={`result-heading ${state.result.passed ? "pass" : "conflict"}`}
          >
            {state.result.passed ? (
              <CheckCircleIcon size={24} />
            ) : (
              <WarningCircleIcon size={24} />
            )}
            <div>
              <h3>
                {state.result.passed
                  ? "The corrected context passes all checks"
                  : "This order still has conflicting data"}
              </h3>
              <p>
                <DataText>{`${state.result.id} · Draft v${state.draftVersion}`}</DataText> · Read-only branch B
              </p>
            </div>
          </div>
          <div className="branch-comparison">
            <section>
              <span className="eyebrow">Original / Branch A</span>
              <h4>PO-731</h4>
              <p>
                <Money cents={orders[0].cents} />
              </p>
              <span className="tiny-state conflict">
                <WarningCircleIcon size={14} />
                Amount mismatch
              </span>
            </section>
            <section>
              <span className="eyebrow">Proposed / Branch B</span>
              <h4>{state.result.candidateId}</h4>
              <p>
                <Money cents={state.result.order.cents} />
              </p>
              <span
                className={`tiny-state ${state.result.passed ? "pass" : "conflict"}`}
              >
                {state.result.passed ? (
                  <CheckCircleIcon size={14} />
                ) : (
                  <WarningCircleIcon size={14} />
                )}
                {state.result.passed ? "4 checks passed" : "Conflicts remain"}
              </span>
            </section>
          </div>
          <div className="snapshot-meta">
            Invoice v{state.result.invoice.version} · {state.result.order.id} v
            {state.result.order.version} · Tested 31 Oct 2026{" "}
            {state.result.testedAt}
          </div>
          <Checks checks={state.result.checks} details={false} />
          <AssociationEvidence invoice={state.result.invoice} order={state.result.order} access={state.sourceAccess} testId={state.result.id} />
          <div className="tested-branch-flow" aria-label="Read-only test branch. Payment actions skipped.">
            <span className={state.result.passed ? "matched" : "mismatched"}><strong>Compare totals</strong><small>{state.result.passed ? "Matched" : "Mismatch"} · Branch B</small></span><ArrowRightIcon size={15} aria-hidden="true" />
            <span><strong>Prepare payment</strong><small><LockSimpleIcon size={12} />Skipped</small></span><ArrowRightIcon size={15} aria-hidden="true" /><span><strong>Submit payment</strong><small><LockSimpleIcon size={12} />Skipped</small></span>
          </div>
          <div className="muted-note">
            <LockSimpleIcon size={17} />
            <div>
              <strong>External actions skipped</strong>
              <p>
                No payment was created or submitted. A finance reviewer must
                review this proposal.
              </p>
            </div>
          </div>
          {state.error && (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          )}
          <section className="reason-summary">
            <span className="eyebrow">Your explanation</span>
            <p>{state.reason}</p>
          </section>
        </div>
      ) : (
        <>
          <p className="review-instruction">The invoice has no order reference. Compare supplier, currency and line items before proposing an association.</p>
          <div className="review-columns">
            <section className="order-picker">
              <label className="input-label" htmlFor="order-search">
                Find a purchase order<span className="field-required" aria-hidden="true">Required</span>
              </label>
              <div className="search-input">
                <MagnifyingGlassIcon size={17} />
                <input
                  id="order-search"
                  ref={searchRef}
                  aria-invalid={showIssue?.field === "order" || undefined}
                  aria-describedby={showIssue?.field === "order" ? "review-order-error" : undefined}
                  placeholder="Search order or supplier"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {showIssue?.field === "order" && <p className="field-error" role="alert" id="review-order-error">{issue.message}</p>}
              <div
                className="order-options"
                role="radiogroup"
                aria-label="Purchase order"
                aria-required="true"
              >
                {list.length === 0 && (
                  <div className="empty-state">
                    <MagnifyingGlassIcon size={23} />
                    <h3>No orders found</h3>
                    <p>Try a supplier name or an order number.</p>
                    <button
                      className="text-button"
                      onClick={() => setQuery("")}
                    >
                      Clear search
                    </button>
                  </div>
                )}
                {list.map((o) => (
                  <label
                    className={`order-option ${state.candidateId === o.id ? "selected" : ""}`}
                    key={o.id}
                  >
                    <input
                      type="radio"
                      name="purchase-order"
                      value={o.id}
                      checked={state.candidateId === o.id}
                      onChange={() =>
                        dispatch({
                          type: "CANDIDATE",
                          id: o.id,
                        })
                      }
                    />
                    <div>
                      <span className="order-option-title">
                        <strong>{o.id}</strong>
                        {o.id === "PO-731" && <small>Current</small>}
                        {state.sourceAccess.invoice && state.sourceAccess.order && assessOrder(o).every(check => check.pass) && <small className="exact-match" title="All four source checks match. A test and Finance review are still required."><CheckCircleIcon size={11} />Exact match</small>}
                      </span>
                      <span>{state.sourceAccess.order ? o.vendor : "Order source unavailable"}</span>
                      {state.sourceAccess.order && <small>{o.description}</small>}
                    </div>
                    <span className="order-option-amount">
                      {state.sourceAccess.order ? <Money cents={o.cents} /> : <small>Unavailable</small>}
                    </span>
                  </label>
                ))}
              </div>
            </section>
            <section className="candidate-detail">
              <h3>
                <DataText>{candidate ? `${candidate.id} / Evidence check` : "Select an order to inspect"}</DataText>
              </h3>
              {candidate &&
              state.sourceAccess.invoice &&
              state.sourceAccess.order ? (
                <>
                  <Checks checks={assessOrder(candidate)} />
                  <table className="line-item-table">
                    <thead>
                      <tr>
                        <th>Order line items</th>
                        <th>Qty</th>
                        <th>Unit price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidate.lines.map((l) => (
                        <tr key={l.name}>
                          <td>{l.name}</td>
                          <td>{l.qty}</td>
                          <td>
                            <Money cents={l.unit} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>
                  Compare the actual order record with the invoice. Matching
                  totals alone do not establish a correct association.
                </p>
              )}
            </section>
          </div>
          {candidate && <AssociationEvidence key={candidate.id} invoice={invoice} order={candidate} access={state.sourceAccess} initiallyOpen />}
          <div className="explanation-field">
            <label className="input-label" htmlFor="review-reason">
              Why are you proposing this order?<span className="field-required" aria-hidden="true">Required</span>
            </label>
            <div className="reason-suggestions" role="group" aria-label="Suggested explanation">
              <button type="button" disabled={!candidate || !state.sourceAccess.invoice || !state.sourceAccess.order || !assessOrder(candidate).every(check => check.pass)} onClick={() => dispatch({ type: "REASON", value: "Current source values match the invoice across supplier, currency, total and line items. Please review the proposed association." })}>Exact amount & items match</button>
              <button type="button" disabled={!candidate || candidate.id === "PO-731" || !state.sourceAccess.invoice || !state.sourceAccess.order} onClick={() => dispatch({ type: "REASON", value: "The initially linked order PO-731 has a different total. Please review this alternative association against the invoice." })}>Wrong PO linked initially</button>
            </div>
            <textarea
              id="review-reason"
              ref={reasonRef}
              aria-required="true"
              aria-invalid={showIssue?.field === "reason" || undefined}
              aria-describedby={`review-reason-help${showIssue?.field === "reason" ? " review-reason-error" : ""}`}
              placeholder="Describe the evidence you checked…"
              value={state.reason}
              maxLength={500}
              onChange={(e) =>
                dispatch({
                  type: "REASON",
                  value: e.target.value,
                })
              }
            />
            <div className="field-meta">
              <span id="review-reason-help">8–500 characters. Saved with this proposal.</span>
              <span>{state.reason.length}/500</span>
            </div>
            {showIssue?.field === "reason" && <p className="field-error" role="alert" id="review-reason-error">{issue.message}</p>}
          </div>
          {state.error && !["order", "reason"].includes(issue?.field) && (
            <p className="field-error" role="alert">
              {state.error}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
