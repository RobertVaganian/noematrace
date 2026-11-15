import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, CheckCircleIcon, WarningCircleIcon, SpinnerGapIcon, CpuIcon } from '@phosphor-icons/react';
import { Modal, Money, DataText } from './components.jsx';
import { invoice } from './model.js';
import { INVOICE_WORDING, SUPPLIER_WORDING, matchInput, matchingCurrent, canInspectMatch, sourcePreview } from './order-match.js';
import { createMatchRuntime } from './order-match-runtime.js';

function SourceChecks({ checks }) {
  return <ul className="match-checks" aria-label="Checks against invoice source">{checks.map(c => <li key={c.name} className={c.pass ? 'match-pass' : 'match-conflict'}>{c.pass ? <CheckCircleIcon size={15} /> : <WarningCircleIcon size={15} />}<span>{c.name}</span><strong>{c.pass ? 'Matches' : 'Differs'}</strong></li>)}</ul>;
}

export function OrderMatcher({ state, onClose, onInspect }) {
  const [wording, setWording] = useState(INVOICE_WORDING);
  const [runtime, setRuntime] = useState({ phase: 'idle', loaded: false, progress: null, message: '', result: null });
  const [preview, setPreview] = useState(false);
  const engine = useRef(null), resultHeading = useRef(null);
  const input = useMemo(() => matchInput(state, wording), [state, wording]);
  const busy = ['loading', 'matching', 'removing'].includes(runtime.phase);
  const current = matchingCurrent(input, runtime.result);
  const best = runtime.result?.rows[0];
  useEffect(() => {
    let alive = true;
    engine.current = createMatchRuntime(value => { if (alive) setRuntime(value); });
    return () => { alive = false; engine.current.stop(); };
  }, []);
  useEffect(() => {
    if (['loading', 'matching'].includes(engine.current?.value.phase)) engine.current.stop('The source or matching phrases changed. Run the comparison again.');
  }, [input.fingerprint]);
  useEffect(() => { if (runtime.phase === 'complete') resultHeading.current?.focus({ preventScroll: true }); }, [runtime.result]);
  const start = () => { setPreview(false); engine.current.match(input); };
  const useWording = value => { setWording(value); setPreview(false); };
  return <Modal title="Find a matching order" eyebrow="ON-DEVICE AI / ORDER MATCHING" className="order-match-modal" onClose={onClose}
    footer={<div className="match-footer"><span><CpuIcon size={16} />Local comparison · No paid API</span><span>Selection → test → Finance review</span></div>}>
    <div className="match-intro"><h3>Different wording. The same evidence.</h3><p>Compare item descriptions by meaning, then inspect the original records. Supplier, currency, amount and line-item checks stay separate.</p></div>
    {!input.available && <div className="evidence-alert" role="status"><WarningCircleIcon size={20} /><div><strong>Both sources are needed</strong><p>Restore invoice and purchase-order access before comparing. Cached matches cannot be used.</p></div></div>}
    <div className="match-layout">
      <section className="match-input" aria-labelledby="match-input-title">
        <div className="match-source-head"><span>INVOICE SOURCE</span><span><DataText>{`${invoice.id} · v${invoice.version}`}</DataText></span></div>
        {input.available ? <><strong className="match-invoice-name">{invoice.vendor}</strong><Money cents={invoice.cents} /><ul className="match-invoice-lines">{invoice.lines.map(l => <li key={l.name}><span>{l.name}</span><small>Qty {l.qty}</small></li>)}</ul></> : <p className="match-muted">Source unavailable</p>}
        <label htmlFor="match-phrases" id="match-input-title">Matching phrases</label>
        <p id="match-input-help" className="match-input-help">One item per line. These terms never change the invoice.</p>
        <textarea id="match-phrases" rows={3} value={wording} maxLength={600} disabled={busy || !input.available} aria-describedby="match-input-help match-input-error" onChange={e => setWording(e.target.value)} />
        <p id="match-input-error" className="match-input-error">{!input.valid ? 'Enter 1–5 lines, up to 120 characters each.' : ''}</p>
        <div className="match-wording" aria-label="Example wording"><button disabled={busy || !input.available} onClick={() => useWording(INVOICE_WORDING)} aria-pressed={wording === INVOICE_WORDING}>Invoice wording</button><button disabled={busy || !input.available} onClick={() => useWording(SUPPLIER_WORDING)} aria-pressed={wording === SUPPLIER_WORDING}>Try supplier wording</button></div>
        <button className="primary-button match-start" disabled={busy || !input.valid || !input.available} onClick={start}>{busy ? <><SpinnerGapIcon className="spin" size={17} />{runtime.phase === 'loading' ? 'Loading model…' : runtime.phase === 'removing' ? 'Removing files…' : 'Comparing items…'}</> : <>{runtime.loaded ? 'Compare item meanings' : 'Load model & match items'}<ArrowRightIcon size={16} /></>}</button>
        <p className="match-download">{runtime.loaded ? 'Model ready on this device.' : 'About 50 MB on first use, including a 23 MB model.'}</p>
        {busy && <button className="text-button" onClick={() => engine.current.stop('Comparison stopped. You can retry when ready.')}>Stop comparison</button>}
        <p className={`match-status ${runtime.phase === 'error' ? 'match-error' : ''}`} role="status">{runtime.message}</p>
        {runtime.progress !== null && busy && <label className="match-progress">Current file<progress value={runtime.progress} max="100">{runtime.progress}%</progress></label>}
        <details className="match-privacy"><summary>Model & privacy</summary><p>MiniLM compares the meaning of these phrases and source descriptions in a Web Worker. It does not generate financial advice, explanations or approvals.</p><p>First use downloads files from Hugging Face and jsDelivr. Phrases and records are processed on this device. Later offline use depends on retained browser files. Similarity is not a confidence percentage.</p>{runtime.loaded && !busy && <div><button className="text-button" onClick={() => engine.current.stop()}>Unload model</button><button className="text-button" onClick={() => engine.current.removeModel()}>Remove model files</button></div>}</details>
      </section>
      <section className="match-output" aria-label="Order matching result">
        {input.available && best ? <div className="match-result" key={runtime.result.fingerprint}>
          {!current && <div className="evidence-alert" role="status"><WarningCircleIcon size={18} /><p>Descriptions or source versions changed. Compare again before using this result.</p></div>}
          <div className="match-output-heading"><div><span className="match-eyebrow">{current ? 'LOCAL MODEL RESULT' : 'EARLIER RESULT'}</span><h3 tabIndex={-1} ref={resultHeading}>{!best.related ? 'No close wording match.' : best.consistent ? 'A consistent source match.' : 'The closest wording has conflicting fields.'}</h3></div><span className="match-count">{best.checks.filter(c => c.pass).length} / 4 checks</span></div>
          <article className="match-best"><div className="match-order-title"><div><strong><DataText>{best.id}</DataText></strong><p>{best.order.vendor} · v{best.order.version}</p></div><Money cents={best.order.cents} /></div>
            <SourceChecks checks={best.checks} />
            <div className="match-pair-head"><span>Your matching phrase</span><span>Closest order description</span></div>
            <ol className="match-pairs">{best.pairs.map(pair => <li key={pair.queryIndex}><span>{runtime.result.phrases[pair.queryIndex]}</span><ArrowRightIcon size={14} /><span>{pair.score >= .3 ? best.order.lines[pair.lineIndex].name : 'No close wording match'}</span></li>)}</ol>
            <p className="match-pair-note">Wording links come from the model. Quantities, prices and check results come from the source records.</p>
            <button className="primary-button" disabled={!current || !best.related || !canInspectMatch(state)} onClick={() => onInspect(best.id)}>Inspect in review<ArrowRightIcon size={16} /></button>
            {!canInspectMatch(state) && <p className="match-muted">An editable Operations draft is required to select an order. Submitted versions stay unchanged.</p>}
          </article>
          <details className="match-alternatives"><summary>Why the other {runtime.result.rows.length - 1} orders need attention</summary>{runtime.result.rows.slice(1).map(row => <article key={row.id}><div><strong><DataText>{row.id}</DataText></strong><Money cents={row.order.cents} /></div><p>{row.order.vendor} · v{row.order.version}</p><SourceChecks checks={row.checks} /></article>)}</details>
          <p className="match-sorting">Related orders passing all source checks come first; the remaining orders follow semantic similarity. The app has not run a test or made a decision.</p>
        </div> : input.available && preview ? <div className="match-preview"><span className="match-eyebrow">SOURCE CHECK PREVIEW · NO MODEL RUNNING</span><h3>What the records can establish.</h3><p>This preview compares exact fields. Use local AI to try different item wording.</p>{sourcePreview(input).map(row => <article key={row.order.id}><div><strong><DataText>{row.order.id}</DataText></strong><Money cents={row.order.cents} /></div><p>{row.order.vendor}</p><SourceChecks checks={row.checks} /></article>)}</div> : <div className="match-empty"><span className="match-empty-icon"><CpuIcon size={27} /></span><span className="match-eyebrow">ITEM MEANING → SOURCE EVIDENCE</span><h3>Find the order, then check the fit.</h3><p>Try “temperature probes” in place of “industrial sensors”. The model connects descriptions; exact source checks expose the mismatches.</p><ol><li>Compare the wording of each item.</li><li>Inspect the source fields and alternatives.</li><li>Choose an order for your normal review.</li></ol><button className="secondary-button" disabled={!input.available || busy} onClick={() => setPreview(true)}>Preview source checks</button><small>No download · no AI result</small></div>}
      </section>
    </div>
  </Modal>;
}
