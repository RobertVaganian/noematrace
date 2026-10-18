import test from "node:test";
import assert from "node:assert/strict";
import { compareRecords, compareProposals, compareInvoiceOrder, groupComparisonRows } from "../src/comparison.js";
import { currentOrder, reducer, orders, invoice } from "../src/model.js";
import { showcaseScene } from "../src/showcase.js";

test("source comparison identifies changed freight unit price and resulting total without changing snapshots", () => {
  const state = showcaseScene("stale").state;
  const snapshot = state.proposals[1].test.order;
  const before = structuredClone(snapshot);
  const rows = compareRecords(snapshot, currentOrder(state, "PO-732")).filter(
    (r) => r.changed,
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => [r.before, r.after]),
    [
      [1248000, 1296000],
      [48000, 96000],
    ],
  );
  assert.deepEqual(snapshot, before);
});

test("association evidence excludes deliberately distinct document IDs and matches the correct order", () => {
  const comparison = compareInvoiceOrder(invoice, orders[1], { invoice: true, order: true });
  assert.equal(comparison.mismatches, 0);
  assert.equal(comparison.rows.length, 13);
  assert.ok(comparison.rows.every((row) => row.key !== "association.id"));
});
test("same-total wrong order exposes supplier and item conflicts", () => {
  const comparison = compareInvoiceOrder(invoice, orders[2], { invoice: true, order: true });
  assert.equal(comparison.rows.find((row) => row.key === "association.total").changed, false);
  assert.ok(comparison.rows.find((row) => row.key === "association.vendorId").changed);
  assert.equal(comparison.rows.find((row) => row.key === "association.line.2.name").after, null);
  assert.ok(comparison.mismatches > 0);
});
test("association comparison returns no restricted values or counts when either source is unavailable", () => {
  for (const access of [{ invoice: false, order: true }, { invoice: true, order: false }]) {
    assert.deepEqual(compareInvoiceOrder(invoice, orders[2], access), { available: false, rows: [], mismatches: 0 });
  }
});
test("revision comparison finds the explanation change while retaining matching evidence", () => {
  const state = showcaseScene("history").state;
  const [a, b] = state.proposals;
  const rows = compareProposals(a, b, state.sourceAccess).flatMap(
    (g) => g.rows,
  );
  assert.deepEqual(
    rows.filter((r) => r.changed).map((r) => r.key),
    ["reason"],
  );
  assert.ok(rows.some((r) => r.key === "order.total" && !r.changed));
});
test("unavailable evidence never produces document values in version differences", () => {
  let state = showcaseScene("history").state;
  state = reducer(state, {
    type: "DEMO_SOURCE_ACCESS",
    source: "order",
    available: false,
  });
  const group = compareProposals(...state.proposals, state.sourceAccess).find(
    (g) => g.name === "Order evidence",
  );
  assert.equal(group.available, false);
  assert.deepEqual(group.rows, []);
});
test("added and removed line items have explicit absent values", () => {
  const rows = compareRecords(orders[0], orders[1]);
  assert.ok(
    rows.some(
      (r) =>
        r.key === "record.line.2.name" &&
        r.before === null &&
        r.after === "Freight",
    ),
  );
  const reversed = compareRecords(orders[1], orders[0]);
  assert.ok(
    reversed.some(
      (r) =>
        r.key === "record.line.2.name" &&
        r.before === "Freight" &&
        r.after === null,
    ),
  );
});

test("grouped evidence retains every ordered field, absent value and full accessible label", () => {
  const source = compareInvoiceOrder(invoice, orders[0], { invoice: true, order: true }).rows;
  const before = structuredClone(source);
  const groups = groupComparisonRows(source);
  const fields = groups.filter(row => !row.group);
  assert.deepEqual(fields.map(row => [row.key, row.before, row.after]), source.map(row => [row.key, row.before, row.after]));
  assert.equal(groups.filter(row => row.group).length, 3);
  const quantity = fields.find(row => row.key.endsWith(".line.1.qty"));
  assert.equal(quantity.after, null);
  assert.equal(quantity.label, "Quantity");
  assert.match(quantity.fullLabel, /Line 2/);
  assert.deepEqual(source, before);
});
