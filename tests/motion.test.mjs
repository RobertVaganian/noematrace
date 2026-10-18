import test from "node:test";
import assert from "node:assert/strict";
import { exitMotion, motionDisabled } from "../src/motion.js";

function surface() {
  let resolve, reject;
  const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
  const animation = { finished, cancel() { reject(new Error("cancelled")); } };
  const element = { dataset: {}, inert: false, animate() { return animation; } };
  return { element, resolve, reject };
}
const flush = () => Promise.resolve();

test("dismiss commits once only after visual completion and clears the inert surface", async () => {
  const { element, resolve } = surface();
  let commits = 0;
  const exit = exitMotion(element, () => commits++);
  assert.equal(commits, 0);
  assert.equal(element.inert, true);
  resolve(); await flush();
  exit.finish();
  assert.equal(commits, 1);
  assert.equal(element.inert, false);
  assert.equal("motionExiting" in element.dataset, false);
});

test("unmount or reopen cancels an old exit without running its stale action", async () => {
  const { element, resolve } = surface();
  let commits = 0;
  const exit = exitMotion(element, () => commits++);
  exit.cancel(); resolve(); await flush(); exit.finish();
  assert.equal(commits, 0);
  assert.equal(element.inert, false);
});

test("switching to reduced motion finishes a pending dismissal exactly once", async () => {
  const { element, resolve } = surface();
  let commits = 0;
  const exit = exitMotion(element, () => commits++);
  exit.finish(); resolve(); await flush();
  assert.equal(commits, 1);
  assert.equal(element.inert, false);
});

test("disabled and unsupported motion close immediately without making a surface inert", () => {
  for (const options of [{disabled:true}, {}]) {
    const element = { dataset: {}, inert: false };
    let commits = 0;
    exitMotion(element, () => commits++, options);
    assert.equal(commits, 1);
    assert.equal(element.inert, false);
  }
});

test("a rejected animation cannot leave a native dialog locked open", async () => {
  const { element, reject } = surface();
  let commits = 0;
  exitMotion(element, () => commits++);
  reject(new Error("animation unavailable")); await flush();
  assert.equal(commits, 1);
  assert.equal(element.inert, false);
});

test("a synchronous animation failure still completes dismissal", () => {
  const element = { dataset: {}, inert: false, animate() { throw new Error("unsupported"); } };
  let commits = 0;
  exitMotion(element, () => commits++);
  assert.equal(commits, 1);
  assert.equal(element.inert, false);
});

test("reduced motion and isolated illustrations disable both JS and CSS motion policy", () => {
  assert.equal(motionDisabled("", false), false);
  assert.equal(motionDisabled("?guide=1", false), false);
  assert.equal(motionDisabled("", true), true);
  for (const search of ["?capture=1", "?embedded=1", "?showcase=finance"]) {
    assert.equal(motionDisabled(search, false), true);
  }
});
