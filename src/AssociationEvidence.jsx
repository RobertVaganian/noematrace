import { useState } from "react";
import { GitDiffIcon, LockSimpleIcon, CheckCircleIcon, CaretDownIcon } from "@phosphor-icons/react";
import { compareInvoiceOrder } from "./comparison.js";
import { DataText } from "./components.jsx";
import { DifferenceRows } from "./VersionComparison.jsx";

export function AssociationEvidence({ invoice, order, access, testId = null, initiallyOpen = false }) {
  const [differencesOnly, setDifferencesOnly] = useState(true);
  const comparison = compareInvoiceOrder(invoice, order, access);
  if (!comparison.available)
    return <p className="comparison-unavailable"><LockSimpleIcon size={16} />Source unavailable. Invoice and order values cannot be compared.</p>;
  const rows = comparison.rows.filter((r) => !differencesOnly || r.changed);
  return (
    <details className="association-evidence" open={initiallyOpen || undefined}>
      <summary>
        <GitDiffIcon size={18} aria-hidden="true" />
        <span>Compare invoice and order<small>{testId ? `Tested snapshot · ${testId}` : "Current source evidence"}</small></span>
        <span className="evidence-count">{comparison.mismatches === 0 ? "Values match" : `${comparison.mismatches} field differences`}</span>
        <CaretDownIcon className="evidence-chevron" size={15} aria-hidden="true" />
      </summary>
      <div className="association-evidence-body">
        <p className="association-provenance"><DataText>{`${invoice.id} v${invoice.version} / ${order.id} v${order.version}.`}</DataText> {testId ? "Exact records captured by this test." : "Inspect these values before testing the proposal."} Line items are compared in document order.</p>
        <div className="comparison-filter">
          <span>{comparison.mismatches} of {comparison.rows.length} evidence fields differ</span>
          <label><input type="checkbox" checked={differencesOnly} onChange={(e) => setDifferencesOnly(e.target.checked)} />Differences only</label>
        </div>
        {rows.length ? <DifferenceRows rows={rows} beforeLabel={`Invoice · ${invoice.id}`} afterLabel={`Order · ${order.id}`} changedLabel="Mismatch" grouped hideChangeLabels /> : <div className="association-match"><CheckCircleIcon size={19} /><p><strong>All compared values match.</strong><span>Turn off Differences only to inspect every field. A read-only test and finance decision are still required.</span></p></div>}
      </div>
    </details>
  );
}
