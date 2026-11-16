import test from 'node:test';
import assert from 'node:assert/strict';
import { createZoomObserver } from '../src/graph-viewport.js';

function harness() {
  let callback, cancelled = 0, requested = 0;
  const values = [];
  const observer = createZoomObserver(value => values.push(value), fn => { callback = fn; return ++requested; }, () => { cancelled++; callback = null; });
  return { observer, values, flush() { const fn = callback; callback = null; fn?.(); }, get requested() { return requested; }, get cancelled() { return cancelled; } };
}
test('panning does not schedule React updates', () => {
  const h = harness();
  for (let x = 0; x < 300; x++) h.observer.observe({ x, y: x / 2, zoom: 1 });
  assert.equal(h.requested, 0);
  assert.deepEqual(h.values, []);
});
test('a zoom gesture commits only the newest scale once per frame', () => {
  const h = harness();
  for (const zoom of [.8, .7, .6]) h.observer.observe({ x: 4, y: 8, zoom });
  assert.equal(h.requested, 1);
  h.flush();
  assert.deepEqual(h.values, [.6]);
  h.observer.observe({ zoom: .6, x: 999 });
  assert.equal(h.requested, 1);
});
test('returning to the committed scale before the frame needs no update', () => {
  const h = harness();
  h.observer.observe({ zoom: .5 });
  h.observer.observe({ zoom: 1 });
  h.flush();
  assert.deepEqual(h.values, []);
});
test('invalid viewport scales are ignored', () => {
  const h = harness();
  for (const zoom of [NaN, Infinity, 0, -1]) h.observer.observe({ zoom });
  assert.equal(h.requested, 0);
});
test('unmount cancels a pending viewport update', () => {
  const h = harness();
  h.observer.observe({ zoom: .5 });
  h.observer.cancel();
  h.flush();
  assert.equal(h.cancelled, 1);
  assert.deepEqual(h.values, []);
});

import { readNavigation, navigationStorageKey } from '../src/onboarding.js';
test('a fresh phone starts with the full canvas width', () => {
  const storage = { getItem: () => null };
  assert.equal(readNavigation(storage, '', true), true);
  assert.equal(readNavigation(storage, '', false), false);
});
test('an explicit navigation choice takes precedence over the phone default', () => {
  for (const collapsed of [true, false]) {
    const storage = { getItem: key => key === navigationStorageKey ? JSON.stringify({ version: 1, collapsed }) : null };
    assert.equal(readNavigation(storage, '', !collapsed), collapsed);
  }
});
test('phone showcases retain their width without reading saved preferences', () => {
  const storage = { getItem() { throw Error('must stay isolated'); } };
  assert.equal(readNavigation(storage, '?showcase=trace', true), true);
});
