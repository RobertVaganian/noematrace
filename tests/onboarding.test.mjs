import test from "node:test";
import assert from "node:assert/strict";
import { initialState, reducer } from "../src/model.js";
import { initialTourStep, readTour, saveTour, tourStorageKey, tourPlacement, readNavigation, saveNavigation, navigationStorageKey, tourStepCount } from "../src/onboarding.js";

test("a new tour starts only before work on a review has begun", () => {
  assert.equal(initialTourStep("", null, initialState), 0);
  const draft = reducer(initialState, { type: "CANDIDATE", id: "PO-732" });
  for (const state of [draft, { ...initialState, reason: "Evidence checked" },
    { ...initialState, role: "approver" }, { ...initialState, sourceEpoch: 1 },
    { ...initialState, sourceAccess: { invoice: false, order: true } }]) {
    const before = structuredClone(state);
    assert.equal(initialTourStep("", null, state), null);
    assert.deepEqual(state, before);
  }
});

test("explicit views and case illustrations never trigger an automatic tour", () => {
  for (const query of ["?showcase=trace", "?capture=1", "?embedded=1", "?guide=1", "?showcase=finance&embedded=1"]) {
    assert.equal(initialTourStep(query, null, initialState), null);
    assert.equal(initialTourStep(query, { status: "in_progress", step: 2 }, initialState), null);
  }
});

test("dismissed and completed tours stay closed while an unfinished tour resumes", () => {
  for (const status of ["completed", "skipped"]) {
    assert.equal(initialTourStep("", { status, step: 2 }, initialState), null);
  }
  assert.equal(initialTourStep("", { status: "in_progress", step: 2 }, initialState), 2);
});

test("tour settings preserve the separate review record and accept only valid saved steps", () => {
  const records = new Map([["noematrace.review.v1", "existing review"]]);
  const storage = { getItem: (key) => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  assert.equal(saveTour(storage, "in_progress", 2), true);
  assert.deepEqual(readTour(storage), { version: 2, status: "in_progress", step: 2 });
  assert.equal(records.get("noematrace.review.v1"), "existing review");
  for (const raw of ["broken", '{"version":3,"status":"in_progress","step":2}',
    '{"version":1,"status":"in_progress","step":4}', '{"version":1,"status":"unknown","step":0}']) {
    records.set(tourStorageKey, raw);
    assert.equal(readTour(storage), null);
  }
});

test("unavailable browser storage does not block tour controls", () => {
  const denied = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  assert.equal(readTour(denied), null);
  assert.equal(saveTour(denied, "skipped", 0), false);
});

const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
test("tour cards remain inside phone and desktop viewports, including short screens", () => {
  for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 },
    { width: 844, height: 390 }, { width: 1363, height: 936 }]) {
    for (const target of [rect(20, 50, 80, 40), rect(viewport.width - 100, 40, 70, 40),
      rect(30, viewport.height - 60, 120, 34)]) {
      const card = { width: 328, height: Math.min(420, viewport.height - 32) };
      const placed = tourPlacement(target, viewport, card);
      assert.ok(placed.left >= 16 && placed.top >= 16);
      assert.ok(placed.left + card.width <= viewport.width - 16);
      assert.ok(placed.top + card.height <= viewport.height - 16);
    }
  }
});

test("a coachmark leaves the highlighted subject unobscured when a side fits", () => {
  const target = rect(520, 384, 150, 76);
  const card = { width: 328, height: 400 };
  const placed = tourPlacement(target, { width: 1363, height: 936 }, card);
  assert.ok(placed.left >= target.right + 16 || placed.left + card.width <= target.left - 16 ||
    placed.top >= target.bottom + 16 || placed.top + card.height <= target.top - 16);
});


test("navigation preference is separate from review and tour and recovers safely", () => {
  const records = new Map([[tourStorageKey, "existing tour"], ["noematrace.review.v1", "existing review"]]);
  const storage = { getItem: key => records.get(key), setItem: (key, value) => records.set(key, value) };
  assert.equal(readNavigation(storage, ""), false);
  assert.equal(saveNavigation(storage, "", true), true);
  assert.equal(readNavigation(storage, ""), true);
  assert.equal(records.get(tourStorageKey), "existing tour");
  assert.equal(records.get("noematrace.review.v1"), "existing review");
  for (const query of ["?showcase=trace", "?capture=1", "?embedded=1"]) {
    assert.equal(readNavigation(storage, query), false);
    assert.equal(saveNavigation(storage, query, false), false);
    assert.equal(readNavigation(storage, ""), true);
  }
  for (const raw of ["broken", '{"version":2,"collapsed":true}', '{"version":1,"collapsed":"true"}']) {
    records.set(navigationStorageKey, raw);
    assert.equal(readNavigation(storage, ""), false);
  }
  const denied = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  assert.equal(readNavigation(denied, ""), false);
  assert.equal(saveNavigation(denied, "", true), false);
});

test("larger tour cards fit the viewport and retain separation where room permits", () => {
  for (const viewport of [{width: 360, height: 640}, {width:390,height:844}, {width:1363,height:936}]) {
    const card = { width: Math.min(440, viewport.width-32), height: Math.min(450, viewport.height-32) };
    const target = rect(viewport.width-160, 300, 140, 70);
    const p = tourPlacement(target, viewport, card);
    assert.ok(p.left >= 16 && p.top >= 16);
    assert.ok(p.left+card.width <= viewport.width-16);
    assert.ok(p.top+card.height <= viewport.height-16);
  }
});


test("old tour records migrate without reopening a finished tour or losing a review", () => {
  const records = new Map([["noematrace.review.v1", "saved review"]]);
  const storage = { getItem: key => records.get(key), setItem: (key,value) => records.set(key,value) };
  for (const status of ["in_progress", "completed", "skipped"]) {
    records.set(tourStorageKey, JSON.stringify({version:1,status,step:3}));
    const migrated = readTour(storage);
    assert.deepEqual(migrated,{version:2,status,step:4});
    assert.equal(initialTourStep("",migrated,initialState),status === "in_progress" ? 4 : null);
  }
  assert.equal(records.get("noematrace.review.v1"),"saved review");
});

test("all seven new steps resume and invalid writes preserve the last valid position", () => {
  const records = new Map();
  const storage = { getItem: key => records.get(key), setItem: (key,value) => records.set(key,value) };
  assert.equal(tourStepCount,7);
  for(let step=0;step<tourStepCount;step++) {
    assert.equal(saveTour(storage,"in_progress",step),true);
    assert.equal(initialTourStep("",readTour(storage),initialState),step);
  }
  const before = records.get(tourStorageKey);
  for(const [status,step] of [["unknown",0],["in_progress",7],["in_progress",-1],["in_progress",2.5]]) assert.equal(saveTour(storage,status,step),false);
  assert.equal(records.get(tourStorageKey),before);
});
