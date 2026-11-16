import assert from 'node:assert/strict';
import test from 'node:test';
import { cameraCues, sampleCamera, type CameraPose } from '../src/experience/camera';

const values = (pose: CameraPose) => [...pose.position, ...pose.target, pose.fov];

test('the continuous camera path retains every authored composition and clamps its endpoints', () => {
  for (const cue of cameraCues) {
    const actual = values(sampleCamera(cue.at));
    values(cue).forEach((value, index) => assert.ok(Math.abs(actual[index] - value) < 1e-10));
  }
  assert.deepEqual(sampleCamera(-0.2), sampleCamera(0));
  assert.deepEqual(sampleCamera(1.2), sampleCamera(1));
});

test('camera travel carries a nonzero continuous forward velocity through the doorway keys', () => {
  const epsilon = 1e-7;
  for (const key of [0.08, 0.145, 0.2]) {
    const before = sampleCamera(key - epsilon);
    const at = sampleCamera(key);
    const after = sampleCamera(key + epsilon);
    const approachSpeed = (at.position[2] - before.position[2]) / epsilon;
    const departureSpeed = (after.position[2] - at.position[2]) / epsilon;
    assert.ok(approachSpeed < -1, `camera must still be advancing into ${key}`);
    assert.ok(departureSpeed < -1, `camera must keep advancing after ${key}`);
    values(at).forEach((value, axis) => {
      const incoming = (value - values(before)[axis]) / epsilon;
      const outgoing = (values(after)[axis] - value) / epsilon;
      assert.ok(Math.abs(incoming - outgoing) < 0.01, `camera channel ${axis} cannot change velocity abruptly at ${key}`);
    });
  }
});

test('forward camera travel never reverses or overshoots the authored spatial corridor', () => {
  let previousZ = sampleCamera(0).position[2];
  for (let i = 0; i < cameraCues.length - 1; i++) {
    const from = cameraCues[i];
    const to = cameraCues[i + 1];
    for (let step = 0; step <= 100; step++) {
      const pose = sampleCamera(from.at + (to.at - from.at) * step / 100);
      assert.ok(pose.position[2] <= previousZ + 1e-10, 'forward scroll cannot make the camera dolly backward');
      previousZ = pose.position[2];
      values(pose).forEach((value, axis) => {
        const start = values(from)[axis];
        const end = values(to)[axis];
        assert.ok(value >= Math.min(start, end) - 1e-10 && value <= Math.max(start, end) + 1e-10,
          `camera channel ${axis} must remain inside its authored bounds`);
      });
    }
  }
});

test('reverse scroll samples the same camera path and supports a reusable render target', () => {
  const progress = [0, 0.06, 0.08, 0.11, 0.145, 0.17, 0.2, 0.25, 0.6, 0.87, 1];
  const forward = progress.map((p) => sampleCamera(p));
  const backward = [...progress].reverse().map((p) => sampleCamera(p)).reverse();
  assert.deepEqual(backward, forward);
  const reusable: CameraPose = { position: [0, 0, 0], target: [0, 0, 0], fov: 0 };
  assert.equal(sampleCamera(0.17, reusable), reusable);
  assert.deepEqual(reusable, sampleCamera(0.17));
});
