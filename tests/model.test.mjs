import test from "node:test";
import assert from "node:assert/strict";
import {
  invoice,
  orders,
  assessOrder,
  reducer,
  initialState,
} from "../src/model.js";
const proposal = (id) =>
  reducer(
    reducer(initialState, {
      type: "CANDIDATE",
      id,
    }),
    {
      type: "REASON",
      value: "Supplier, currency and invoice line items reviewed.",
    },
  );
const complete = (s) => {
  s = reducer(s, {
    type: "BEGIN_TEST",
  });
  return reducer(s, {
    type: "COMPLETE_TEST",
    revision: s.revision,
  });
};
test("all displayed document totals equal their line items", () => {
  for (const d of [invoice, ...orders])
    assert.equal(
      d.cents,
      d.lines.reduce((sum, l) => sum + l.qty * l.unit, 0),
    );
});
test("same total with another supplier cannot pass review", () => {
  const checks = assessOrder(orders[2]);
  assert.equal(checks.find((x) => x.name === "Total").pass, true);
  assert.equal(checks.find((x) => x.name === "Supplier").pass, false);
  const s = complete(proposal("PO-733"));
  assert.equal(s.result.passed, false);
  assert.notEqual(
    reducer(s, {
      type: "REQUEST_APPROVAL",
    }).phase,
    "requested",
  );
});
test("current wrong order remains a failed branch", () => {
  const s = complete(proposal("PO-731"));
  assert.equal(s.result.passed, false);
  assert.equal(invoice.cents, 1248000);
  assert.equal(orders[0].cents, 124800);
});
test("matching evidence can reach pending approval without changing original", () => {
  const s = reducer(complete(proposal("PO-732")), {
    type: "REQUEST_APPROVAL",
  });
  assert.equal(s.phase, "requested");
  assert.equal(s.result.checks.length, 4);
  assert.equal(orders[0].id, "PO-731");
  assert.equal(s.audit.length, 2);
  assert.equal("payment" in s, false);
});
test("editing context invalidates a previously passing test", () => {
  const s = reducer(complete(proposal("PO-732")), {
    type: "CANDIDATE",
    id: "PO-733",
  });
  assert.equal(s.result, null);
  assert.notEqual(
    reducer(s, {
      type: "REQUEST_APPROVAL",
    }).phase,
    "requested",
  );
});
test("an outdated asynchronous result cannot approve a newer context", () => {
  let s = reducer(proposal("PO-732"), {
    type: "BEGIN_TEST",
  });
  const stale = s.revision;
  s = reducer(s, {
    type: "CANDIDATE",
    id: "PO-733",
  });
  s = reducer(s, {
    type: "COMPLETE_TEST",
    revision: stale,
  });
  assert.equal(s.result, null);
});
test("test requires an order and a useful review explanation", () => {
  assert.equal(
    reducer(initialState, {
      type: "BEGIN_TEST",
    }).phase,
    "idle",
  );
  const s = reducer(initialState, {
    type: "CANDIDATE",
    id: "PO-732",
  });
  assert.equal(
    reducer(s, {
      type: "BEGIN_TEST",
    }).phase,
    "idle",
  );
});
