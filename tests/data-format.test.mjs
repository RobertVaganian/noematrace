import test from 'node:test';
import assert from 'node:assert/strict';
import { dataTokens } from '../src/data-format.js';

test('data emphasis preserves punctuation, dates, decimals and user-authored text exactly', () => {
  const value = 'PO-732 updated to v1.7: freight changed from EUR 480.00 to EUR 960.00. Tested 31 Oct 2026 10:42:01. <script> is literal text.';
  const tokens = dataTokens(value);
  assert.equal(tokens.map(part => part.text).join(''), value);
  assert.deepEqual(tokens.filter(part => part.data).map(part => part.text), ['PO-732', 'v1.7', 'EUR 480.00', 'EUR 960.00', '31 Oct 2026', '10:42:01']);
});
test('data emphasis leaves ordinary prose intact and handles empty or numeric values', () => {
  assert.deepEqual(dataTokens('Current source unavailable.'), [{text:'Current source unavailable.',data:false}]);
  assert.deepEqual(dataTokens(null), []);
  assert.equal(dataTokens(0).map(part => part.text).join(''), '0');
  assert.equal(dataTokens('PROP-2048-v2 / TST-002 / INV-2048').filter(part => part.data).length, 3);
});
