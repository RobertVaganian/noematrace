import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRightIcon, BellIcon, CheckCircleIcon, WarningCircleIcon, LockSimpleIcon } from '@phosphor-icons/react';
import { Modal, DialogCloseButton, DataText, Checks } from './components.jsx';
import { AssociationEvidence } from './AssociationEvidence.jsx';
import { EvidenceDocument } from './EvidenceDocument.jsx';
import { people, evidenceState } from './model.js';
import { notificationsFor } from './notifications.js';
const labels = { exception: 'Run exception', test: 'Test result', request: 'Finance request', decision: 'Finance decision', source: 'Source change' };

export function Notifications({ state, dispatch, onOpen, onClose }) {
  const [filter, setFilter] = useState('all');
  const allRef = useRef(null), unreadRef = useRef(null), recoverFocus = useRef(null);
  const notices = notificationsFor(state), unread = notices.filter(n => !n.read).length;
  const visible = filter === 'unread' ? notices.filter(n => !n.read) : notices;
  useLayoutEffect(() => { if (recoverFocus.current) { const target = recoverFocus.current; recoverFocus.current = null; (target === "all" ? allRef : unreadRef).current?.focus(); } });
  const markAll = () => { recoverFocus.current = filter; dispatch({ type: 'NOTIFICATIONS_READ_ALL' }); };
  const toggle = item => { if (filter === 'unread' && !item.read) recoverFocus.current = 'unread'; dispatch({ type: 'NOTIFICATION_READ', id: item.id, read: !item.read }); };
  return <Modal title="Notifications" eyebrow="NoemaTrace / Review activity" onClose={onClose} className="notifications-modal"
    context={<div className="notification-context"><div><strong>{people[state.role].name}</strong><span>{people[state.role].title}</span></div><span>Demo run clock</span></div>}
    footer={<><p className="notification-footer-note"><LockSimpleIcon size={15} />Reading never approves a proposal.</p><DialogCloseButton className="secondary-button">Done</DialogCloseButton></>}>
    <div className="notification-tools"><div role="group" aria-label="Notification filter"><button type="button" ref={allRef} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All <span>{notices.length}</span></button><button type="button" ref={unreadRef} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread <span>{unread}</span></button></div><button type="button" className="notification-mark-all" disabled={!unread} onClick={markAll}>Mark all read</button></div>
    <p className="notification-status" role="status">{unread} unread {unread === 1 ? 'notification' : 'notifications'} for this demo role.</p>
    <div className="notification-list">{visible.length ? visible.map(item => <article className={`notification-item ${item.read ? 'is-read' : 'is-unread'}`} key={item.id}>
      <span className="notification-dot" aria-hidden="true" />
      <div className="notification-copy"><div className="notification-meta"><span>{!item.read && <span className="notification-sr-only">Unread. </span>}{labels[item.kind]}</span><time dateTime={`2026-10-31T${item.time}`}>{item.time}</time></div><h3><DataText>{item.title}</DataText></h3><p><DataText>{item.detail}</DataText></p>
        <div className="notification-actions"><button type="button" className="notification-open" onClick={() => onOpen(item.id)}>{item.target.type === 'test' ? 'View saved test' : item.target.type === 'proposal' ? 'Open this version' : 'Inspect the exception'}<ArrowRightIcon size={14} /></button><button type="button" className="notification-read" onClick={() => toggle(item)}>{item.read ? 'Mark unread' : 'Mark read'}</button></div>
      </div>
    </article>) : <div className="notification-empty">{notices.length ? <CheckCircleIcon size={30} /> : <BellIcon size={30} />}<h3>{notices.length ? 'You’re caught up.' : 'No Finance updates yet.'}</h3><p>{notices.length ? 'Earlier events remain in All.' : 'Requests appear here after Operations submits a passing test for review.'}</p></div>}</div>
    <p className="notification-scope">Events and read state stay in this browser. No email or push delivery.</p>
  </Modal>;
}
export function NotificationTest({ state, test, onClose }) {
  const freshness = evidenceState(state, test);
  return <Modal title={`${test.passed ? 'Passed' : 'Failed'} · ${test.id}`} eyebrow={`Saved test / Draft v${test.version}`} onClose={onClose} className="notification-evidence-modal"
    context={<div className="notification-test-context"><strong><DataText>{`${test.candidateId} · Tested ${test.testedAt}`}</DataText></strong><span>Immutable test snapshot</span></div>}
    footer={<><p className="notification-footer-note"><LockSimpleIcon size={15} />Read-only evidence. No workflow action.</p><DialogCloseButton className="secondary-button">Back to notifications</DialogCloseButton></>}>
    {!freshness.current && <div className="evidence-alert" role="status"><WarningCircleIcon size={20} /><div><strong>This evidence no longer supports approval</strong><p>{freshness.reason}</p></div></div>}
    <section className="notification-test-evidence"><h3>Recorded checks</h3><Checks checks={test.checks} details={false} /><AssociationEvidence invoice={test.invoice} order={test.order} access={state.sourceAccess} testId={test.id} /><div className="evidence-disclosures"><details><summary>Invoice document versions</summary><EvidenceDocument state={state} test={test} source="invoice" /></details><details><summary>Order document versions</summary><EvidenceDocument state={state} test={test} source="order" /></details></div></section>
  </Modal>;
}
