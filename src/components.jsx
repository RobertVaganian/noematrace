import { createContext, useContext, useRef, useEffect, useState } from "react";
import { XIcon, CheckIcon } from "@phosphor-icons/react";
import { useAnimatedDismiss } from "./Motion.jsx";
import { dataTokens } from "./data-format.js";
import { invoice, money } from "./model.js";
export function DataText({ children, chips = false }) {
  return dataTokens(children).map((part, i) => part.data ? <span className={chips ? "data-token" : "data-inline"} key={i}>{part.text}</span> : part.text);
}
export function CurrencyLabel({ currency = "EUR" }) {
  const symbol = { EUR: "€", USD: "$", GBP: "£", AMD: "֏", RUB: "₽" }[currency];
  return <span className="money-currency">{symbol && <span className="currency-symbol" aria-hidden="true">{symbol}</span>}{currency}</span>;
}
export function Money({ cents, currency = "EUR" }) {
  return (
    <span className="money">
      <CurrencyLabel currency={currency} />{" "}
      <span className="money-number">{money(cents).slice(4)}</span>
    </span>
  );
}
export function IconButton({
  label,
  children,
  onClick,
  className = "",
  ...rest
}) {
  return (
    <button
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
export function moveTabFocus(event, select) {
  const tabs = [...event.currentTarget.parentElement.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(event.currentTarget);
  let next;
  if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
  else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = tabs.length - 1;
  else return;
  event.preventDefault();
  select(tabs[next].dataset.value);
  tabs[next].focus();
}
const DialogDismissContext = createContext(null);
export function DialogCloseButton({ children, ...props }) {
  const dismiss = useContext(DialogDismissContext);
  return <button type="button" {...props} onClick={dismiss}>{children}</button>;
}

export function Modal({ title, eyebrow, onClose, children, footer, context, onKeyDown, className = "" }) {
  const illustrative = new URLSearchParams(location.search).has("embedded");
  const ref = useRef(null);
  const dismiss = useAnimatedDismiss(ref);
  const [scrollbar, setScrollbar] = useState(0);
  const hasFooter = Boolean(footer);
  useEffect(() => {
    if (!illustrative) ref.current.querySelector("h2")?.focus();
    const body = ref.current.querySelector(".modal-body");
    if (body) body.scrollTop = 0;
  }, [title]);
  useEffect(() => {
    const d = ref.current;
    const previousFocus = document.activeElement;
    d.showModal();
    if (!illustrative) d.querySelector("h2")?.focus();
    return () => {
      if (d.open) d.close();
      if (!illustrative && previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  useEffect(() => {
    if (!hasFooter) return;
    const body = ref.current.querySelector(".modal-body");
    // Match the scrolling content's right edge on classic and overlay scrollbars.
    const measure = () => setScrollbar(body.offsetWidth - body.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
  }, [hasFooter]);
  return (
    <DialogDismissContext.Provider value={() => dismiss(onClose)}>
    <dialog
      ref={ref}
      className={`modal ${footer ? "modal-with-footer" : ""} ${className}`}
      inert={illustrative}
      style={hasFooter ? { "--modal-scrollbar": `${scrollbar}px` } : undefined}
      aria-labelledby="dialog-title"
      onKeyDown={onKeyDown}
      onCancel={(e) => {
        e.preventDefault();
        dismiss(onClose);
      }}
    >
      <header className="modal-header">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2 id="dialog-title" tabIndex={-1}>
            <DataText>{title}</DataText>
          </h2>
        </div>
        <IconButton label="Close dialog" onClick={() => dismiss(onClose)}>
          <XIcon size={19} /><kbd aria-hidden="true">Esc</kbd>
        </IconButton>
      </header>
      {context && <div className="modal-context">{context}</div>}
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </dialog>
    </DialogDismissContext.Provider>
  );
}
export function DocumentRecord({ order, record }) {
  const r = record || order || invoice;
  return (
    <article className={`document-record ${order ? "" : "invoice-document"}`} >
      <header>
        <div>
          <strong>{r.vendor}</strong>
          <p>{order ? "Purchase order" : "Invoice"}</p>
        </div>
        <div className="document-id">
          <strong className="mono">{r.id}</strong>
          <p><DataText>{r.date}</DataText></p>
        </div>
      </header>
      <dl>
        <div>
          <dt>Supplier ID</dt>
          <dd className="mono">{r.vendorId}</dd>
        </div>
        <div>
          <dt>Currency</dt>
          <dd><CurrencyLabel currency={r.currency} /></dd>
        </div>
        <div>
          <dt>{order ? "Order status" : "Order reference"}</dt>
          <dd>{order ? "Open" : "Not provided on invoice"}</dd>
        </div>
      </dl>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {r.lines.map((l) => (
            <tr key={l.name}>
              <td>{l.name}</td>
              <td>{l.qty}</td>
              <td>
                <Money cents={l.unit} />
              </td>
              <td>
                <Money cents={l.qty * l.unit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="document-total">
        <span>Total</span>
        <strong>
          <Money cents={r.cents} />
        </strong>
      </div>
      <footer>
        Synthetic document · NoemaTrace demo dataset
        <br />
        <DataText>{`Version v${r.version} · Retrieved 31 Oct 2026, ${r.retrievedAt || "10:42"}`}</DataText>
      </footer>
    </article>
  );
}
export function Checks({ checks, details = true }) {
  return (
    <div className="check-list">
      {checks.map((x) => (
        <div key={x.name}>
          <span>{x.name}</span>
          <span className={x.pass ? "pass" : "conflict"}>
            {x.pass ? <CheckIcon size={15} /> : <XIcon size={15} />}
            {details ? <DataText>{x.detail}</DataText> : x.pass ? "Match" : "Mismatch"}
          </span>
        </div>
      ))}
    </div>
  );
}
