import test from "node:test";
import assert from "node:assert/strict";
import {
  workflowConnections,
  eventNodeId,
  nodeFocus,
  connectionContext,
  connectionPalette,
} from "../src/graph.js";

test("selected comparison exposes its two source inputs and one downstream dependency", () => {
  const context = connectionContext("compare");
  assert.deepEqual(
    context.incoming.map((c) => c.source),
    ["extract", "order"],
  );
  assert.deepEqual(
    context.outgoing.map((c) => c.target),
    ["prepare"],
  );
  assert.deepEqual(context.edgeIds, ["e-c", "o-c", "c-p"]);
});
test("selection highlights only direct neighbors while preserving all workflow links", () => {
  const before = structuredClone(workflowConnections);
  assert.deepEqual(connectionContext("order").nodeIds, ["order", "compare"]);
  assert.deepEqual(connectionContext("submit").edgeIds, ["p-s"]);
  assert.deepEqual(connectionContext("absent").edgeIds, []);
  assert.deepEqual(workflowConnections, before);
  assert.equal(
    workflowConnections.find((c) => c.id === "o-c").targetHandle,
    "order",
  );
  assert.ok(workflowConnections.every((c) => c.sourceHandle === "output"));
});
test("both connection palettes maintain visible contrast against their canvas", () => {
  const luminance = (hex) => {
    const values = hex
      .match(/[0-9a-f]{2}/gi)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const [theme, bg] of [
    ["dark", "#161618"],
    ["light", "#f7f7f9"],
  ]) {
    for (const color of Object.values(connectionPalette[theme])) {
      const values = [luminance(color), luminance(bg)].sort((a, b) => b - a);
      assert.ok(
        (values[0] + 0.05) / (values[1] + 0.05) >= 3,
        `${theme} connection contrast`,
      );
    }
  }
});


test("workflow log links resolve actual steps without inventing a payment link for review decisions", () => {
  const events = [{step:"Extract fields"}, {step:"Compare totals"}, {step:"Prepare payment"}];
  const before = structuredClone(events);
  assert.deepEqual(events.map(eventNodeId), ["extract", "compare", "prepare"]);
  for (const step of ["Finance decision", "Test branch", "Approval request", "Source evidence", "constructor", "unknown"]) {
    assert.equal(eventNodeId({step}), null);
  }
  assert.deepEqual(events, before);
});

test("event focus uses measured node bounds and keeps readable zoom within the allowed range", () => {
  const node = {position:{x:224,y:140},measured:{width:174,height:76}};
  const before = structuredClone(node);
  assert.deepEqual(nodeFocus(node,.8), {x:311,y:178,zoom:.8});
  assert.equal(nodeFocus(node,2).zoom,1.15);
  assert.equal(nodeFocus(node,.1).zoom,.35);
  assert.deepEqual(node, before);
});
