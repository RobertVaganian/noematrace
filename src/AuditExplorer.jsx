import { useId, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  DownloadSimpleIcon,
  XIcon,
  FileTextIcon,
  BracketsCurlyIcon,
} from "@phosphor-icons/react";
import { Modal, DialogCloseButton } from "./components.jsx";
import { filterEvents, eventsCSV, reviewRecord } from "./audit.js";

export function AuditExplorer({ events, state, children }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [newestFirst, setNewestFirst] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [format, setFormat] = useState("json");
  const [notice, setNotice] = useState("");
  const uid = useId();
  const visible = useMemo(
    () => filterEvents(events, { query, category, newestFirst }),
    [events, query, category, newestFirst],
  );
  const reset = () => {
    setQuery("");
    setCategory("all");
    setNewestFirst(false);
  };
  const download = () => {
    const content =
      format === "json"
        ? JSON.stringify(reviewRecord(state, events), null, 2)
        : eventsCSV(visible);
    const url = URL.createObjectURL(
      new Blob([content], {
        type:
          format === "json"
            ? "application/json;charset=utf-8"
            : "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `NoemaTrace-RN-2048-${format === "json" ? "review.json" : "events.csv"}`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportOpen(false);
    setNotice(`${format.toUpperCase()} record prepared.`);
  };
  return (
    <div className="audit-explorer">
      <div className="audit-tools">
        <label className="audit-search" htmlFor={`${uid}-query`}>
          <MagnifyingGlassIcon size={17} aria-hidden="true" />
          <input
            id={`${uid}-query`}
            type="search"
            aria-label="Search events"
            placeholder="Search step, person or details"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear event search"
              onClick={() => setQuery("")}
            >
              <XIcon size={14} />
            </button>
          )}
        </label>
      <div className="audit-quick-filters" role="group" aria-label="Quick event filters">
        {[["all", `All (${events.length})`], ["mismatches", "Mismatches"], ["sync", "Document sync"], ["decisions", "Human decisions"]].map(([value, label]) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}
      </div>
        <select
          aria-label="Event type"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All events</option>
          <option value="attention">Needs attention</option>
          <option value="mismatches">Mismatches</option>
          <option value="sync">Document sync</option>
          <option value="tests">Tests</option>
          <option value="decisions">Decisions</option>
        </select>
        <select
          aria-label="Event order"
          value={newestFirst ? "newest" : "oldest"}
          onChange={(e) => setNewestFirst(e.target.value === "newest")}
        >
          <option value="oldest">Oldest first</option>
          <option value="newest">Newest first</option>
        </select>
        <button
          className="secondary-button audit-export"
          onClick={() => {
            setNotice("");
            setExportOpen(true);
          }}
        >
          <DownloadSimpleIcon size={16} />
          Export
        </button>
      </div>
      <div className="audit-result-count" role="status">
        <span>
          {visible.length} of {events.length} events
        </span>
        {visible.length > 0 && (query || category !== "all") && (
          <button className="text-button" onClick={reset}>
            Reset filters
          </button>
        )}
        {notice && <span>{notice}</span>}
      </div>
      {visible.length ? (
        children(visible)
      ) : (
        <div className="audit-empty">
          <MagnifyingGlassIcon size={24} />
          <h3>No matching events</h3>
          <p>Try another step, person or event type.</p>
          <button className="secondary-button" onClick={reset}>
            Reset filters
          </button>
        </div>
      )}
      {exportOpen && (
        <Modal
          title="Export review record"
          eyebrow="RN-2048 / Records"
          onClose={() => setExportOpen(false)}
          className="export-modal"
        >
          <p className="export-intro">
            Choose what to take out of this review. All records are synthetic
            demonstration data.
          </p>
          <fieldset className="export-formats">
            <legend>File format</legend>
            <label className={format === "json" ? "selected" : ""}>
              <input
                type="radio"
                name={`${uid}-format`}
                value="json"
                checked={format === "json"}
                onChange={() => setFormat("json")}
              />
              <BracketsCurlyIcon size={21} />
              <span>
                <strong>Complete review · JSON</strong>
                <small>
                  All {events.length} events, {state.proposals.length} submitted{" "}
                  {state.proposals.length === 1 ? "version" : "versions"} and
                  tested evidence snapshots. Unavailable documents include
                  metadata only.
                </small>
              </span>
            </label>
            <label className={format === "csv" ? "selected" : ""}>
              <input
                type="radio"
                name={`${uid}-format`}
                value="csv"
                checked={format === "csv"}
                onChange={() => setFormat("csv")}
              />
              <FileTextIcon size={21} />
              <span>
                <strong>Visible events · CSV</strong>
                <small>
                  The {visible.length}{" "}
                  {visible.length === 1 ? "event" : "events"} matching your
                  current search, type and order.
                </small>
              </span>
            </label>
          </fieldset>
          <p className="export-boundary">
            This export records the review. It does not start or authorize a
            payment.
          </p>
          <div className="inline-actions">
            <DialogCloseButton className="secondary-button">Cancel</DialogCloseButton>
            <button className="primary-button" onClick={download}>
              <DownloadSimpleIcon size={16} />
              Download {format.toUpperCase()}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
