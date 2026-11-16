import assert from "node:assert/strict";
import test from "node:test";
import { ScrollPlayhead } from "../src/experience/ScrollPlayhead";

test("a wheel step produces continuous intermediate positions and settles at the requested frame", () => {
  const playhead = new ScrollPlayhead();
  playhead.snap(0.12);
  playhead.seek(0.145);
  const positions = Array.from({ length: 120 }, () => playhead.advance(1 / 60));
  assert.ok(positions[0] > 0.12 && positions[0] < 0.121, "first frame must not jump to the target");
  assert.ok(new Set(positions.slice(0, 30)).size > 25, "motion continues between wheel events");
  assert.ok(positions.every((p, i) => p <= 0.145 && (i === 0 || p >= positions[i - 1])));
  assert.equal(positions.at(-1), 0.145);
});

test("the same elapsed time gives the same motion at 30, 60 and 120 fps", () => {
  const positions = [30, 60, 120].map((fps) => {
    const playhead = new ScrollPlayhead();
    playhead.snap(0.08);
    playhead.seek(0.2);
    for (let frame = 0; frame < fps / 2; frame++) playhead.advance(1 / fps);
    return playhead.position;
  });
  assert.ok(Math.max(...positions) - Math.min(...positions) < 1e-12);
});

test("new wheel input preserves position and velocity, including a reversal", () => {
  const playhead = new ScrollPlayhead();
  playhead.snap(0.1);
  playhead.seek(0.18);
  for (let frame = 0; frame < 12; frame++) playhead.advance(1 / 60);
  const position = playhead.position;
  const velocity = playhead.velocity;
  playhead.seek(0.08);
  assert.equal(playhead.position, position);
  assert.equal(playhead.velocity, velocity);
  for (let frame = 0; frame < 180; frame++) playhead.advance(1 / 60);
  assert.equal(playhead.position, 0.08);
  assert.equal(playhead.velocity, 0);
});

test("direct navigation clears momentum and background stalls cannot skip the crossing", () => {
  const playhead = new ScrollPlayhead();
  playhead.seek(1);
  const first = playhead.advance(10);
  assert.ok(first < 0.1, "a resumed background tab must not consume seconds of motion in one frame");
  assert.equal(playhead.snap(0.5), 0.5);
  assert.equal(playhead.velocity, 0);
  assert.equal(playhead.advance(1 / 60), 0.5);
  assert.equal(playhead.snap(2), 1);
  assert.equal(playhead.snap(-1), 0);
});

test("the doorway transition eases continuously from its closed composition to the destination", () => {
  const playhead = new ScrollPlayhead();
  playhead.transition(0, 0.1304);
  playhead.setResponse(4.5);
  const frames = Array.from({ length: 240 }, () => playhead.advance(1 / 60));
  assert.equal(frames[0] > 0, true);
  assert.ok(frames[0] < 0.001, "the first frame must leave the closed-door composition gradually");
  assert.ok(frames[20] > frames[0] && frames[20] < frames.at(-1)!,
    "the camera and hinges must have intermediate frames");
  assert.ok(new Set(frames.slice(0, 120)).size > 100, "the crossing must render a continuous run of distinct frames");
  assert.ok(frames.every((frame, index) => frame <= 0.1304 && (index === 0 || frame >= frames[index - 1])));
  assert.ok(Math.abs(frames.at(-1)! - 0.1304) < 0.000001);
});
