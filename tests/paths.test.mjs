import test from "node:test";
import assert from "node:assert/strict";
import { appUrl, appRoute } from "../src/paths.js";

test("assets and links remain inside the GitHub Pages project path", () => {
  assert.equal(appUrl("/brand/noematrace-mark.png", "/noematrace/"), "/noematrace/brand/noematrace-mark.png");
  assert.equal(appUrl("?guide=1", "/noematrace/"), "/noematrace/?guide=1");
  assert.equal(appUrl("case-study", "/noematrace/"), "/noematrace/case-study");
  assert.equal(appUrl("tour/test-light.mp4", "/"), "/tour/test-light.mp4");
});

test("case study routes resolve on root and project-path deployments", () => {
  assert.equal(appRoute("/noematrace/case-study/", "/noematrace/"), "/case-study");
  assert.equal(appRoute("/case-study", "/"), "/case-study");
  assert.equal(appRoute("/noematrace/", "/noematrace/"), "/");
  assert.equal(appRoute("/noematrace", "/noematrace/"), "/");
  assert.equal(appRoute("/noematrace-other/", "/noematrace/"), "/noematrace-other");
});
