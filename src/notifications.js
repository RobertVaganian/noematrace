import { baseEvents, invoice, orders, reducer as reviewReducer } from './model.js';
const sourceValuesAvailable = state => state.sourceAccess.invoice && state.sourceAccess.order;
const roles = ['operator', 'approver'];
const lastAt = (records, time, field) => records.filter(record => record[field] <= time).at(-1);

// Notifications point to recorded evidence. Reading is independent of review state.
export function notificationsFor(state, role = state.role) {
  if (!roles.includes(role)) return [];
  const reads = Array.isArray(state.notificationReads?.[role]) ? state.notificationReads[role] : [];
  const mismatch = baseEvents.find(e => e.event === 'Mismatch');
  const items = role === 'operator' && mismatch ? [{
    id: 'run-total-mismatch', kind: 'exception', time: mismatch.time,
    title: 'Invoice and linked order totals differ',
    detail: sourceValuesAvailable(state) ? `${invoice.id} is EUR 12,480.00; ${orders[0].id} is EUR 1,248.00. The original run paused before payment.` : "The original run paused at Compare totals. Source values are hidden while document access is unavailable.",
    target: { type: 'step', nodeId: 'compare' },
  }] : [];
  state.audit.forEach((entry, index) => {
    let item;
    if (entry.step === 'Test branch' && ['Passed', 'Failed'].includes(entry.event) && role === 'operator') {
      const test = state.tests.find(t => t.id === entry.detail.match(/TST-\d+/)?.[0]);
      if (test) item = { kind: 'test', title: `${test.id} ${test.passed ? 'passed all four checks' : 'found a mismatch'}`,
        detail: `Draft v${test.version} · ${test.candidateId} · Read-only test. Payment actions were skipped.`, target: { type: 'test', testId: test.id } };
    } else if (entry.step === 'Approval request' && entry.event === 'Pending' && role === 'approver') {
      const version = Number(entry.detail.match(/Proposal v(\d+)/)?.[1]);
      const p = state.proposals.find(p => p.version === version);
      if (p) item = { kind: 'request', title: `Proposal v${p.version} was submitted to Finance`,
        detail: `${p.submittedBy} submitted ${p.candidateId} with ${p.test.id}. Open that version to review its evidence.`, target: { type: 'proposal', proposalId: p.id } };
    } else if (entry.step === 'Finance decision' && ['Approved', 'Returned'].includes(entry.event) && role === 'operator') {
      const version = Number(entry.detail.match(/Proposal v(\d+)/)?.[1]);
      const p = state.proposals.find(p => p.version === version);
      if (p?.decision) item = { kind: 'decision', title: entry.event === 'Approved' ? `Finance approved the v${version} association correction` : `Finance requested changes to v${version}`,
        detail: `${p.decision.actor}: ${p.decision.note}`, target: { type: 'proposal', proposalId: p.id } };
    } else if (entry.step === 'Source evidence' && entry.event === 'Changed') {
      const p = lastAt(state.proposals, entry.time, 'submittedAt'), test = lastAt(state.tests, entry.time, 'testedAt');
      item = { kind: 'source', title: /access lost/i.test(entry.detail) ? 'Source access was lost' : /access restored/i.test(entry.detail) ? 'Source access was restored' : 'Source evidence changed',
        detail: sourceValuesAvailable(state) ? entry.detail : "Source availability or values changed. Open the saved evidence to inspect its current access state.", target: p ? { type: 'proposal', proposalId: p.id } : test ? { type: 'test', testId: test.id } : { type: 'step', nodeId: 'compare' } };
    }
    if (item) items.push({ ...item, id: `audit-${index}-${item.kind}`, time: entry.time });
  });
  return items.slice(-50).reverse().map(item => ({ ...item, read: reads.includes(item.id) }));
}
export function normaliseNotificationReads(state, value = state.notificationReads) {
  return Object.fromEntries(roles.map(role => {
    const valid = new Set(notificationsFor(state, role).map(n => n.id));
    const supplied = Array.isArray(value?.[role]) ? value[role] : [];
    return [role, [...new Set(supplied.filter(id => typeof id === 'string' && valid.has(id)))].slice(-50)];
  }));
}
export function notificationTarget(state, id, role = state.role) {
  const target = notificationsFor(state, role).find(n => n.id === id)?.target;
  if (!target) return null;
  if (target.type === 'proposal' && !state.proposals.some(p => p.id === target.proposalId)) return null;
  if (target.type === 'test' && !state.tests.some(t => t.id === target.testId)) return null;
  return { ...target };
}
export function notificationReducer(state, action) {
  if (!['NOTIFICATION_READ', 'NOTIFICATIONS_READ_ALL'].includes(action.type)) return reviewReducer(state, action);
  if (!roles.includes(state.role)) return state;
  const notices = notificationsFor(state), reads = normaliseNotificationReads(state);
  if (!notices.length) return state;
  if (action.type === 'NOTIFICATIONS_READ_ALL') reads[state.role] = notices.map(n => n.id);
  else {
    if (typeof action.read !== 'boolean' || !notices.some(n => n.id === action.id)) return state;
    const current = new Set(reads[state.role]);
    action.read ? current.add(action.id) : current.delete(action.id);
    reads[state.role] = [...current];
  }
  return { ...state, notificationReads: reads };
}
