import test from 'node:test';
import assert from 'node:assert/strict';
import { clampLogHeight, defaultLogHeight, logHeightBounds, logHeightFromKey, readTraceHeight, saveTraceHeight, traceLayoutKey } from '../src/trace-layout.js';
import { desktopViewport } from '../src/graph.js';

test('log limits reserve the graph and clamp both drag extremes', () => {
  const bounds = logHeightBounds(748);
  assert.deepEqual(bounds, {min:140,max:439});
  assert.equal(clampLogHeight(10000,bounds),439);
  assert.equal(clampLogHeight(-500,bounds),140);
  assert.equal(clampLogHeight(NaN,bounds),277);
  assert.deepEqual(logHeightBounds(412), {min:140,max:140});
});
test('keyboard direction follows the divider and provides bounded reset and limits', () => {
  const bounds=logHeightBounds(748);
  assert.equal(logHeightFromKey('ArrowUp',277,bounds),301);
  assert.equal(logHeightFromKey('ArrowDown',277,bounds),253);
  assert.equal(logHeightFromKey('ArrowUp',277,bounds,true),341);
  assert.equal(logHeightFromKey('Home',277,bounds),140);
  assert.equal(logHeightFromKey('End',277,bounds),439);
  assert.equal(logHeightFromKey('Enter',439,bounds),277);
  assert.equal(logHeightFromKey('ArrowDown',140,bounds),140);
  assert.equal(logHeightFromKey('Enter',140,logHeightBounds(500)),191);
  for(const key of ['Tab','r','constructor','toString']) assert.equal(logHeightFromKey(key,277,bounds),null);
});
test('panel preference survives reload without altering review or other view records', () => {
  const data=new Map([['noematrace.review.v1','saved review'],['noematrace.navigation.v1','saved navigation']]);
  const storage={getItem:key=>data.get(key),setItem:(key,val)=>data.set(key,val)};
  assert.equal(saveTraceHeight(storage,'',401),true);
  assert.equal(readTraceHeight(storage,''),401);
  assert.equal(data.get('noematrace.review.v1'),'saved review');
  assert.equal(data.get('noematrace.navigation.v1'),'saved navigation');
  saveTraceHeight(storage,'',defaultLogHeight);
  assert.equal(readTraceHeight(storage,''),defaultLogHeight);
});
test('isolated case and capture views never touch saved panel preferences', () => {
  let reads=0,writes=0;
  const storage={getItem(){reads++;return '{"version":1,"height":430}';},setItem(){writes++;}};
  for(const search of ['?showcase=trace','?capture=1','?embedded=1','?showcase=finance&embedded=1']) {
    assert.equal(readTraceHeight(storage,search),277);
    assert.equal(saveTraceHeight(storage,search,439),false);
  }
  assert.equal(reads,0);assert.equal(writes,0);
});
test('malformed or unavailable panel storage recovers to the usable default', () => {
  for(const raw of ['broken','null','{"version":2,"height":301}','{"version":1,"height":"301"}','{"version":1,"height":-10}']) {
    assert.equal(readTraceHeight({getItem:key=>{assert.equal(key,traceLayoutKey);return raw;}},''),277);
  }
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  assert.equal(readTraceHeight(denied,''),277);
  assert.equal(saveTraceHeight(denied,'',301),false);
  assert.equal(saveTraceHeight(denied,'',NaN),false);
});
test('height-aware fit retains the established viewport when there is enough room', () => {
  const width=791,height=427,zoom=(width-14)/902;
  assert.deepEqual(desktopViewport(width,height),{x:(width-870*zoom)/2-20*zoom,y:(height-318*zoom)/2-100*zoom-28,zoom});
});
test('expanded logs keep desktop source and payment nodes inside the shortened canvas', () => {
  for(const height of [219,256,300]) {
    const view=desktopViewport(791,height);
    assert.ok(view.zoom>=.35&&view.zoom<=1);
    assert.ok(100*view.zoom+view.y>=16);
    assert.ok(422*view.zoom+view.y<=height-58);
  }
});
