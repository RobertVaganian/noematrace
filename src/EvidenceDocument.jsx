import { useState } from "react";
import { LockSimpleIcon } from "@phosphor-icons/react";
import { DocumentRecord } from "./components.jsx";
import { evidenceDocument } from "./evidence.js";

export function EvidenceDocument({ state, test, source }) {
  const [view, setView] = useState("tested");
  const evidence = evidenceDocument(state, test, source, view);
  if (!evidence.available)
    return (
      <p className="source-denied">
        <LockSimpleIcon size={16} />
        Source unavailable. The document cannot be inspected.
      </p>
    );
  return (
    <section
      className="evidence-document"
      aria-label={`${source === "order" ? "Order" : "Invoice"} document viewer`}
    >
      <div
        className="evidence-view-switch"
        role="group"
        aria-label={`${source === "order" ? "Order" : "Invoice"} evidence version`}
      >
        <button
          aria-pressed={view === "tested"}
          onClick={() => setView("tested")}
        >
          Tested snapshot
        </button>
        <button
          aria-pressed={view === "current"}
          onClick={() => setView("current")}
        >
          Current source
        </button>
      </div>
      <div className="evidence-view-meta" role="status">
        <strong>
          {evidence.record.id} · v{evidence.record.version}
        </strong>
        <span>
          {view === "tested"
            ? `Captured with ${test.id} · Read-only`
            : "Current source · Read-only"}
        </span>
      </div>
      <p className="evidence-view-note">
        {view === "tested"
          ? "This is the document used by the submitted test."
          : `Shown for comparison. ${test.id} still uses its saved snapshot (v${test[source].version}).`}
      </p>
      {source === "order" ? (
        <DocumentRecord order={evidence.record} />
      ) : (
        <DocumentRecord record={evidence.record} />
      )}
    </section>
  );
}
