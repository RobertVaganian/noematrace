import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer, invoice } from '../src/model.js';
import { matchInput, rankOrders, matchingCurrent, canInspectMatch, INVOICE_WORDING, SUPPLIER_WORDING } from '../src/order-match.js';
import { createMatchRuntime } from '../src/order-match-runtime.js';
const state = () => structuredClone(initialState);
const payload = input => input.candidates.map((order, i) => ({ id: order.id, score: i === 2 ? .99 : .6, pairs: input.phrases.map((_, queryIndex) => ({ queryIndex, lineIndex: Math.min(queryIndex, order.lines.length - 1), score: .7 })) }));
function harness(deadline = 1000) {
  const messages = [], workers = [];
  const runtime = createMatchRuntime(v => messages.push(v), { deadline, workerFactory: () => {
    const worker = { sent: [], stopped: false, postMessage(data) { this.sent.push(data); }, terminate() { this.stopped = true; }, reply(data) { this.onmessage({ data: { requestId: this.sent.at(-1).requestId, ...data } }); } };
    workers.push(worker); return worker;
  } });
  return { runtime, messages, workers };
}

test('different matching words leave source records and review decisions untouched', () => {
  const s = state(), before = structuredClone(s), source = structuredClone(invoice);
  const input = matchInput(s, SUPPLIER_WORDING);
  rankOrders(input, payload(input));
  assert.deepEqual(s, before); assert.deepEqual(invoice, source);
  assert.notEqual(input.phrases.join('\n'), INVOICE_WORDING);
});
test('a high semantic score cannot hide the wrong supplier or an amount mismatch', () => {
  const input = matchInput(state()); const rows = rankOrders(input, payload(input));
  assert.equal(rows[0].id, 'PO-732'); assert.equal(rows[0].consistent, true);
  assert.equal(rows.find(r => r.id === 'PO-733').checks.find(c => c.name === 'Supplier').pass, false);
  assert.equal(rows.find(r => r.id === 'PO-731').checks.find(c => c.name === 'Total').pass, false);
});
test('a later ERP version cannot inherit an earlier consistent AI result', () => {
  const s = state(), input = matchInput(s), result = { fingerprint: input.fingerprint };
  const changed = reducer(s, { type: 'DEMO_UPDATE_ORDER' });
  assert.equal(matchingCurrent(matchInput(changed), result), false);
  assert.equal(rankOrders(matchInput(changed), payload(matchInput(changed))).some(r => r.consistent), false);
});
test('changed matching phrases invalidate a result even if the source is unchanged', () => {
  const input = matchInput(state());
  assert.equal(matchingCurrent(input, { fingerprint: input.fingerprint }), true);
  assert.equal(matchingCurrent(matchInput(state(), SUPPLIER_WORDING), { fingerprint: input.fingerprint }), false);
});
test('unavailable sources are never sent to the model', () => {
  const s = state(); s.sourceAccess.order = false;
  const input = matchInput(s), h = harness();
  assert.deepEqual(input.documents, []); assert.equal(h.runtime.match(input), false); assert.equal(h.workers.length, 0);
});
test('empty, oversized and excessive phrase inputs cannot start inference', () => {
  for (const query of ['', 'a'.repeat(121), 'a\nb\nc\nd\ne\nf']) {
    const h = harness(); assert.equal(h.runtime.match(matchInput(state(), query)), false); assert.equal(h.workers.length, 0);
  }
});
test('unknown IDs, non-finite scores and invented source-line references are rejected', () => {
  const input = matchInput(state()), scores = payload(input);
  scores[0].pairs[0].lineIndex = 999; scores[1].score = NaN; scores[2].id = 'PO-INVENTED';
  assert.deepEqual(rankOrders(input, scores), []);
});
test('matching cannot select an order in a submitted draft or for Finance', () => {
  assert.equal(canInspectMatch(state()), true);
  for (const phase of ['testing', 'requested', 'approved', 'changes_requested', 'outdated']) assert.equal(canInspectMatch({ ...state(), phase }), false);
  assert.equal(canInspectMatch({ ...state(), role: 'approver' }), false);
});
test('a worker is created only by an explicit match and a stopped run cannot return a result', () => {
  const h = harness(), input = matchInput(state()); assert.equal(h.workers.length, 0);
  h.runtime.match(input); const old = h.workers[0]; h.runtime.stop();
  old.reply({ type: 'complete', fingerprint: input.fingerprint, scores: payload(input) });
  assert.equal(old.stopped, true); assert.equal(h.runtime.value.result, null);
});
test('a genuine response retains its source and phrase snapshot', () => {
  const h = harness(), input = matchInput(state(), SUPPLIER_WORDING); h.runtime.match(input);
  h.workers[0].reply({ type: 'ready' }); h.workers[0].reply({ type: 'complete', fingerprint: input.fingerprint, scores: payload(input) });
  assert.equal(h.runtime.value.phase, 'complete'); assert.equal(h.runtime.value.result.rows[0].id, 'PO-732');
  assert.deepEqual(h.runtime.value.result.phrases, input.phrases); h.runtime.stop();
});
test('malformed or stale worker output becomes an error rather than a usable suggestion', () => {
  const h = harness(), input = matchInput(state()); h.runtime.match(input);
  h.workers[0].reply({ type: 'complete', fingerprint: 'older snapshot', scores: payload(input) });
  assert.equal(h.runtime.value.phase, 'error'); assert.equal(h.runtime.value.result, null);
});
test('an interrupted or timed-out local run releases its worker and permits retry', async () => {
  const h = harness(10), input = matchInput(state()); h.runtime.match(input);
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(h.workers[0].stopped, true); assert.equal(h.runtime.value.phase, 'error');
  assert.equal(h.runtime.match(input), true); h.runtime.stop();
});

test('unrelated wording cannot become a usable match just because amounts agree', () => {
  const input = matchInput(state(), 'Coffee beans');
  const scores = payload(input).map(row => ({...row, score: .1, pairs: row.pairs.map(p => ({...p, score: .1}))}));
  assert.equal(rankOrders(input, scores).some(row => row.related), false);
});
