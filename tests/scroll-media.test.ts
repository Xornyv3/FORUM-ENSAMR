import assert from "node:assert/strict";
import test from "node:test";
import { CREATION_VIDEO_FRAME_RATE, getScrollVideoTime } from "../src/experience/scrollMedia";

test("scroll progress selects frames across the full two-second creation film", () => {
  const duration = 2;
  const lastFrame = 47 / CREATION_VIDEO_FRAME_RATE;
  assert.equal(getScrollVideoTime(0, duration), 0);
  assert.equal(getScrollVideoTime(0.5, duration), 1);
  assert.equal(getScrollVideoTime(1, duration), lastFrame);
  assert.ok(lastFrame < duration, "the final target stays on the last decodable frame");
});

test("scrolling backward retraces the same video frames in reverse", () => {
  const progress = [0, 0.1, 0.36, 0.5, 0.78, 1];
  const forward = progress.map((value) => getScrollVideoTime(value, 2));
  const backward = [...progress].reverse().map((value) => getScrollVideoTime(value, 2));
  assert.deepEqual(backward.reverse(), forward);
  assert.ok(forward.every((time, index) => index === 0 || time >= forward[index - 1]));
});

test("video scrubbing clamps progress and handles invalid media metadata", () => {
  assert.equal(getScrollVideoTime(-1, 2), 0);
  assert.equal(getScrollVideoTime(2, 2), 47 / 24);
  assert.equal(getScrollVideoTime(0.5, 0), 0);
  assert.equal(getScrollVideoTime(Number.NaN, 2), 0);
});
