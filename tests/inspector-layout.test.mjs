import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectorBounds, defaultInspectorWidth, clampInspectorWidth, inspectorWidthFromKey, readInspectorWidth, saveInspectorWidth, inspectorLayoutKey } from '../src/inspector-layout.js';

test('inspector limits preserve a usable graph and adapt to the real workspace width', () => {
  assert.deepEqual(inspectorBounds(1134), {min:296,max:480});
  assert.deepEqual(inspectorBounds(745), {min:296,max:296});
  assert.deepEqual(inspectorBounds(850), {min:296,max:401});
  assert.equal(clampInspectorWidth(999, inspectorBounds(850)),401);
  assert.equal(clampInspectorWidth(12, inspectorBounds(850)),296);
});
test('default inspector widths retain the existing responsive rhythm', () => {
  assert.equal(defaultInspectorWidth(1363),342);
  assert.equal(defaultInspectorWidth(1180),304);
  assert.equal(defaultInspectorWidth(950),296);
});
test('inspector keyboard controls follow the handle, respect limits and reset', () => {
  const bounds=inspectorBounds(1134);
  assert.equal(inspectorWidthFromKey('ArrowLeft',342,bounds,342),366);
  assert.equal(inspectorWidthFromKey('ArrowRight',342,bounds,342,true),296);
  assert.equal(inspectorWidthFromKey('Home',342,bounds,342),296);
  assert.equal(inspectorWidthFromKey('End',342,bounds,342),480);
  assert.equal(inspectorWidthFromKey('Enter',480,bounds,342),342);
  for(const key of ['Tab','constructor','toString']) assert.equal(inspectorWidthFromKey(key,342,bounds,342),null);
});
test('width preference and responsive reset do not alter the review or log layout', () => {
  const data=new Map([['noematrace.review.v1','review'],['noematrace.trace-layout.v1','log']]);
  const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
  assert.equal(saveInspectorWidth(storage,'',420),true);assert.equal(readInspectorWidth(storage,''),420);
  assert.equal(data.get('noematrace.review.v1'),'review');assert.equal(data.get('noematrace.trace-layout.v1'),'log');
  assert.equal(saveInspectorWidth(storage,'',null),true);assert.equal(readInspectorWidth(storage,''),null);
});
test('capture and embedded case scenes neither read nor write inspector preferences', () => {
  const storage={getItem(){assert.fail('read isolated preference');},setItem(){assert.fail('write isolated preference');}};
  for(const search of ['?showcase=trace','?capture=1','?embedded=1']) {assert.equal(readInspectorWidth(storage,search),null);assert.equal(saveInspectorWidth(storage,search,420),false);}
});
test('broken and unavailable width storage recovers without layout or review loss', () => {
  for(const raw of ['broken','null','{"version":2,"width":420}','{"version":1,"width":"420"}','{"version":1,"width":600}']) assert.equal(readInspectorWidth({getItem:key=>{assert.equal(key,inspectorLayoutKey);return raw;}},''),null);
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.equal(readInspectorWidth(denied,''),null);assert.equal(saveInspectorWidth(denied,'',420),false);
  assert.equal(saveInspectorWidth(denied,'',NaN),false);
});
