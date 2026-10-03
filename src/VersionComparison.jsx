import { useMemo, useState } from "react";
import { GitDiffIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { Modal, Money, DataText } from "./components.jsx";
import { compareRecords, compareProposals, groupComparisonRows } from "./comparison.js";

function Value({ value, kind, currency }) {
  if (value === null) return <span className="muted-value" title="This field is absent from the source document">— Missing</span>;
  return kind === "money" ? (
    <Money cents={value} currency={currency} />
  ) : (
    <span className={typeof value === "number" ? "data-inline" : undefined}><DataText>{value}</DataText></span>
  );
}

export function DifferenceRows({ rows, beforeLabel, afterLabel, changedLabel = "Changed", grouped = false, hideChangeLabels = false }) {
  return (
    <div
      className="difference-list"
      role="table"
      aria-label="Field differences"
    >
      <div className="difference-heading" role="row">
        <span role="columnheader">Field</span>
        <span role="columnheader"><DataText>{beforeLabel}</DataText></span>
        <span role="columnheader"><DataText>{afterLabel}</DataText></span>
      </div>
      {(grouped ? groupComparisonRows(rows) : rows).map((r) => r.group ? <div className="difference-line-group" role="row" key={r.key}><span role="cell" aria-colspan={3}><DataText>{r.label}</DataText></span></div> : (
        <div
          className={`difference-row ${r.changed ? "changed" : ""}`}
          role="row"
          key={r.key}
        >
          <span className="difference-field" role="rowheader" aria-label={r.fullLabel}>
            {r.label}
            {r.changed && !hideChangeLabels && <small>{changedLabel}</small>}
          </span>
          <div role="cell">
            <span className="difference-mobile-label">{beforeLabel}</span>
            <Value value={r.before} kind={r.kind} currency={r.beforeCurrency} />
          </div>
          <div role="cell">
            <span className="difference-mobile-label">{afterLabel}</span>
            <Value value={r.after} kind={r.kind} currency={r.afterCurrency} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EvidenceChanges({ before, after, available }) {
  if (!available)
    return (
      <p className="comparison-unavailable">
        <LockSimpleIcon size={16} />
        Order source unavailable. Field values cannot be compared.
      </p>
    );
  const rows = compareRecords(before, after, "current").filter(
    (r) => r.changed,
  );
  return (
    <details className="evidence-changes" open>
      <summary>
        <GitDiffIcon size={17} />
        What changed in the source <span>{rows.length} fields</span>
      </summary>
      <p>
        <DataText>{`Tested ${before.id} v${before.version} → current v${after.version}.`}</DataText> Historical evidence is preserved.
      </p>
      {rows.length ? (
        <DifferenceRows
          rows={rows}
          beforeLabel="Tested snapshot"
          afterLabel="Current source"
        />
      ) : (
        <p className="comparison-empty">
          Field values match, but the source version or access changed. A fresh
          test is still required.
        </p>
      )}
    </details>
  );
}

export function VersionComparison({ state, onClose }) {
  const proposals = state.proposals;
  const [leftId, setLeftId] = useState(proposals.at(-2).id);
  const [rightId, setRightId] = useState(proposals.at(-1).id);
  const [onlyChanged, setOnlyChanged] = useState(true);
  const left = proposals.find((p) => p.id === leftId);
  const right = proposals.find((p) => p.id === rightId);
  const groups = useMemo(
    () => compareProposals(left, right, state.sourceAccess),
    [left, right, state.sourceAccess],
  );
  const count = groups.flatMap((g) => g.rows).filter((r) => r.changed).length;
  return (
    <Modal
      title="Compare proposal versions"
      eyebrow="RN-2048 / Version history"
      onClose={onClose}
      className="version-comparison-modal"
    >
      <p className="comparison-intro">
        Compare the submitted explanation and exact evidence behind each test.
      </p>
      <div className="comparison-selectors">
        <label>
          Earlier version
          <select
            aria-label="Earlier proposal version"
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
          >
            {proposals
              .filter((p) => p.version < right.version)
              .map((p) => (
                <option value={p.id} key={p.id}>
                  v{p.version} · {p.test.id}
                </option>
              ))}
          </select>
        </label>
        <GitDiffIcon size={20} aria-hidden="true" />
        <label>
          Later version
          <select
            aria-label="Later proposal version"
            value={rightId}
            onChange={(e) => {
              setRightId(e.target.value);
              if (
                left.version >=
                proposals.find((p) => p.id === e.target.value).version
              )
                setLeftId(proposals[0].id);
            }}
          >
            {proposals
              .filter((p) => p.version > proposals[0].version)
              .map((p) => (
                <option value={p.id} key={p.id}>
                  v{p.version} · {p.test.id}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="comparison-test-meta">
        <span>
          v{left.version} · Order v{left.test.order.version}
        </span>
        <span>
          v{right.version} · Order v{right.test.order.version}
        </span>
      </div>
      <div className="comparison-filter">
        <span>
          {count} {count === 1 ? "changed field" : "changed fields"}
          {(!state.sourceAccess.invoice || !state.sourceAccess.order) &&
            " in accessible evidence"}
        </span>
        <label>
          <input
            type="checkbox"
            checked={onlyChanged}
            onChange={(e) => setOnlyChanged(e.target.checked)}
          />
          Changes only
        </label>
      </div>
      {groups.map((g) => {
        const rows = g.rows.filter((r) => !onlyChanged || r.changed);
        return (
          <section className="comparison-group" key={g.name}>
            <h3>{g.name}</h3>
            {!g.available ? (
              <p className="comparison-unavailable">
                <LockSimpleIcon size={16} />
                Source unavailable. Document values are hidden.
              </p>
            ) : rows.length ? (
              <DifferenceRows
                rows={rows}
                beforeLabel={`v${left.version}`}
                afterLabel={`v${right.version}`}
              />
            ) : (
              <p className="comparison-empty">No field values changed.</p>
            )}
          </section>
        );
      })}
      <p className="comparison-footer">
        <LockSimpleIcon size={15} />
        Submitted versions are read-only. Comparing them does not change a
        decision.
      </p>
    </Modal>
  );
}
