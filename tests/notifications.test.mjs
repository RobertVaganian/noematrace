import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reducer } from '../src/model.js';
import { showcaseScene } from '../src/showcase.js';
import { notificationsFor, notificationReducer as act, notificationTarget, normaliseNotificationReads } from '../src/notifications.js';
import { encodeReview, decodeReview } from '../src/persistence.js';
const send = (state, type, fields = {}) => act(state, { type, ...fields });

test('Operations sees the recorded exception; Finance starts without an invented request', () => {
  assert.equal(notificationsFor(initialState).length, 1);
  assert.deepEqual(notificationTarget(initialState, 'run-total-mismatch'), { type: 'step', nodeId: 'compare' });
  assert.deepEqual(notificationsFor(initialState, 'approver'), []);
});
test('a test notification appears only after completion and opens its exact snapshot', () => {
  let state = send(initialState, 'CANDIDATE', { id: 'PO-733' });
  state = send(state, 'REASON', { value: 'Check this order against the original invoice.' });
  state = send(state, 'BEGIN_TEST');
  assert.equal(notificationsFor(state).filter(n => n.kind === 'test').length, 0);
  state = send(state, 'COMPLETE_TEST', { revision: state.revision });
  const notice = notificationsFor(state).find(n => n.kind === 'test');
  assert.ok(notice);
  assert.equal(notice.title, 'TST-001 found a mismatch');
  assert.deepEqual(notificationTarget(state, notice.id), { type: 'test', testId: state.tests[0].id });
  assert.equal(notificationsFor(state, 'approver').length, 0);
});
test('requests and decisions link to their own version after later revisions', () => {
  const state = showcaseScene('history').state;
  const requests = notificationsFor(state, 'approver').filter(n => n.kind === 'request');
  const decisions = notificationsFor(state, 'operator').filter(n => n.kind === 'decision');
  assert.deepEqual(requests.map(n => n.target.proposalId), state.proposals.map(p => p.id).reverse());
  assert.deepEqual(decisions.map(n => n.target.proposalId), state.proposals.map(p => p.id).reverse());
  assert.ok(decisions[1].title.includes('changes'));
  assert.ok(decisions[0].title.includes('approved'));
  assert.equal(notificationTarget(state, requests[0].id, 'operator'), null);
});
test('source changes notify both roles without reviving an old approval', () => {
  const state = showcaseScene('notifications').state;
  for (const role of ['operator', 'approver']) {
    const notice = notificationsFor(state, role)[0];
    assert.equal(notice.kind, 'source');
    assert.deepEqual(notice.target, { type: 'proposal', proposalId: state.proposals[1].id });
  }
  const read = send(state, 'NOTIFICATIONS_READ_ALL');
  assert.equal(read.proposals[1].status, 'outdated');
  assert.strictEqual(read.proposals, state.proposals);
  assert.strictEqual(read.tests, state.tests);
  assert.strictEqual(read.audit, state.audit);
});
test('read receipts are role-specific and never change review evidence or eligibility', () => {
  const state = { ...showcaseScene('history').state, role: 'operator' };
  const id = notificationsFor(state)[0].id;
  const read = send(state, 'NOTIFICATION_READ', { id, read: true });
  const { notificationReads, ...rest } = read;
  assert.deepEqual(rest, state);
  assert.equal(notificationsFor(read)[0].read, true);
  assert.ok(notificationsFor(read, 'approver').every(n => !n.read));
  assert.equal(notificationsFor(send(read, 'NOTIFICATION_READ', { id, read: false }))[0].read, false);
  assert.strictEqual(send(state, 'NOTIFICATION_READ', { id: 'unknown', read: true }), state);
});
test('mark all read leaves future events unread; reset clears receipts and history', () => {
  let state = { ...showcaseScene('history').state, role: 'operator' };
  state = send(state, 'NOTIFICATIONS_READ_ALL');
  state = send(state, 'DEMO_UPDATE_ORDER');
  assert.equal(notificationsFor(state).filter(n => !n.read).length, 1);
  assert.equal(notificationsFor(state)[0].kind, 'source');
  const reset = send(state, 'RESET');
  assert.equal(reset.notificationReads, undefined);
  assert.equal(notificationsFor(reset)[0].read, false);
});
test('receipts round-trip locally while malformed and unknown ids are discarded', () => {
  const state = send({ ...showcaseScene('history').state, role: 'operator' }, 'NOTIFICATIONS_READ_ALL');
  assert.deepEqual(decodeReview(encodeReview(state)).state, state);
  const raw = JSON.parse(encodeReview(state));
  raw.state.notificationReads = { operator: ['run-total-mismatch', 'invented', null, 'run-total-mismatch'], approver: 'all' };
  const recovered = decodeReview(JSON.stringify(raw));
  assert.equal(recovered.status, 'restored');
  assert.deepEqual(recovered.state.notificationReads, { operator: ['run-total-mismatch'], approver: [] });
  assert.deepEqual(normaliseNotificationReads(state, null), { operator: [], approver: [] });
});
test('retention bounds each role to fifty actual events with stable ids', () => {
  let state = initialState;
  for (let i = 0; i < 60; i++) state = reducer(state, { type: 'DEMO_UPDATE_ORDER' });
  const notices = notificationsFor(state);
  assert.equal(notices.length, 50);
  assert.equal(new Set(notices.map(n => n.id)).size, 50);
  const marked = send(state, 'NOTIFICATIONS_READ_ALL');
  assert.equal(marked.notificationReads.operator.length, 50);
  assert.equal(notificationsFor(marked).filter(n => !n.read).length, 0);
});

test('unavailable source values are withheld in notification summaries and links stay read-only', () => {
  let state = showcaseScene('notifications').state;
  state = send(state, 'DEMO_SOURCE_ACCESS', { source: 'order', available: false });
  const notices = notificationsFor(state, 'operator');
  assert.ok(notices.filter(n => ['source', 'exception'].includes(n.kind)).every(n => !/12,480|1,248|480.00|960.00/.test(n.detail)));
  assert.ok(notices.find(n => n.kind === 'exception').detail.includes('hidden'));
});
