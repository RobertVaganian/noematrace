import { invoice, orders, currentOrder, assessOrder } from './model.js';

export const MATCH_MODEL = Object.freeze({
  id: 'Xenova/all-MiniLM-L6-v2',
  revision: '751bff37182d3f1213fa05d7196b954e230abad9',
  runtime: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js',
});
export const INVOICE_WORDING = invoice.lines.map(line => line.name).join('\n');
export const SUPPLIER_WORDING = 'Temperature probes NX-100\nSensor installation brackets MK-7\nDelivery and handling';

export function matchInput(state, wording = INVOICE_WORDING) {
  const phrases = String(wording).split('\n').map(s => s.trim()).filter(Boolean);
  const available = Boolean(state.sourceAccess.invoice && state.sourceAccess.order);
  const valid = phrases.length > 0 && phrases.length <= 5 && phrases.every(s => s.length <= 120);
  const candidates = available ? orders.map(o => currentOrder(state, o.id)) : [];
  const fingerprint = JSON.stringify({ epoch: state.sourceEpoch, access: state.sourceAccess, invoice, candidates, phrases });
  return { available, valid, phrases, candidates, fingerprint,
    documents: candidates.map(o => ({ id: o.id, text: [o.description, ...o.lines.map(l => l.name)].join('. '), lines: o.lines.map(l => l.name) })) };
}

export function canInspectMatch(state) {
  return state.role === 'operator' && !['testing', 'requested', 'approved', 'changes_requested', 'outdated'].includes(state.phase);
}

// Similarity orders the shortlist; source checks establish whether it is consistent.
// A score is neither a probability nor permission to approve an association.
export function rankOrders(input, scores) {
  const byId = new Map();
  for (const row of scores || []) {
    if (!input.candidates.some(c => c.id === row.id) || !Number.isFinite(row.score)) continue;
    const pairs = input.phrases.map((phrase, queryIndex) => {
      const pair = row.pairs?.find(p => p.queryIndex === queryIndex);
      const order = input.candidates.find(c => c.id === row.id);
      return pair && Number.isInteger(pair.lineIndex) && pair.lineIndex >= 0 && pair.lineIndex < order.lines.length && Number.isFinite(pair.score)
        ? { queryIndex, lineIndex: pair.lineIndex, score: Math.max(-1, Math.min(1, pair.score)) } : null;
    });
    if (pairs.some(p => !p)) continue;
    byId.set(row.id, { id: row.id, score: Math.max(-1, Math.min(1, row.score)), pairs });
  }
  return input.candidates.flatMap(order => {
    const row = byId.get(order.id);
    if (!row) return [];
    const checks = assessOrder(order);
    return [{ ...row, order, checks, consistent: checks.every(c => c.pass), related: row.score >= .38 && row.pairs.every(p => p.score >= .3) }];
  }).sort((a, b) => Number(b.consistent && b.related) - Number(a.consistent && a.related) || b.score - a.score || a.id.localeCompare(b.id));
}

export function matchingCurrent(input, result) {
  return Boolean(input.available && input.valid && result?.fingerprint === input.fingerprint);
}

export function sourcePreview(input) {
  return input.candidates.map(order => ({ order, checks: assessOrder(order) }));
}
