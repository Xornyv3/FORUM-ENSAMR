import assert from "node:assert/strict";
import test from "node:test";
import type { SceneId } from "../src/config/experience";
import {
  SCROLL_CUES,
  CREATION_VIDEO_END,
  DUALITY_MASK_START,
  MEASURE_EXIT_START,
  SECTION_LIFT_START,
  buildCues,
  getDualityMaskOpacity,
  getCreationVideoProgress,
  getMeasureNumber,
  getMeasurePart,
  getMeasureExitProgress,
  MEASURE_PARTS,
  getSectionLiftProgress,
  getSceneAt,
  getWordPosition,
  resolveWords,
} from "../src/experience/timeline";

const closeTo = (actual: number, expected: number) => {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);
};

test("the complete story covers the full scroll distance without gaps or overlapping cues", () => {
  assert.deepEqual(SCROLL_CUES.map((cue) => cue.id), [
    "invitation", "portal", "hero", "reel", "duality", "measure", "creation", "genesis", "outro",
  ]);
  assert.equal(SCROLL_CUES[0].start, 0);
  assert.equal(SCROLL_CUES.at(-1)?.end, 1);
  for (const [index, cue] of SCROLL_CUES.entries()) {
    assert.ok(cue.end > cue.start, `${cue.id} needs positive reading time`);
    if (index > 0) assert.equal(cue.start, SCROLL_CUES[index - 1].end);
  }
  closeTo(SCROLL_CUES.reduce((sum, cue) => sum + cue.end - cue.start, 0), 1);
});

test("exact chapter boundaries select the incoming scene and reset local progress", () => {
  for (const [index, cue] of SCROLL_CUES.entries()) {
    const atStart = getSceneAt(cue.start);
    assert.equal(atStart.cue.id, cue.id);
    assert.equal(atStart.index, index);
    assert.equal(atStart.local, 0);
    if (index > 0) {
      const beforeStart = getSceneAt(cue.start - 0.000001);
      assert.equal(beforeStart.cue.id, SCROLL_CUES[index - 1].id);
      assert.ok(beforeStart.local > 0.99);
    }
  }
  assert.equal(getSceneAt(1).cue.id, "outro");
  assert.equal(getSceneAt(1).local, 1);
  assert.equal(getSceneAt(-0.5).local, 0);
  assert.equal(getSceneAt(1.5).local, 1);
});

test("the creation film finishes before a hold and then smoothly lifts over the fixed next scene", () => {
  assert.equal(getCreationVideoProgress(0), 0);
  assert.equal(getCreationVideoProgress(CREATION_VIDEO_END), 1);
  assert.equal(getCreationVideoProgress(0.65), 1, "the final video frame is held before the lift");
  assert.equal(getSectionLiftProgress(SECTION_LIFT_START), 0, "the scene holds before it starts to lift");
  closeTo(getSectionLiftProgress((SECTION_LIFT_START + 1) / 2), 0.5);
  assert.equal(getSectionLiftProgress(1), 1, "the completed section moves fully out of view");
  assert.equal(getDualityMaskOpacity(DUALITY_MASK_START), 0);
  closeTo(getDualityMaskOpacity((DUALITY_MASK_START + SECTION_LIFT_START) / 2), 0.5);
  assert.equal(getDualityMaskOpacity(SECTION_LIFT_START), 1, "the video is masked until the lift begins");
  assert.equal(getMeasureExitProgress(MEASURE_EXIT_START - 0.01), 0);
  assert.ok(getMeasureExitProgress((MEASURE_EXIT_START + 1) / 2) > 0);
  assert.ok(getMeasureExitProgress((MEASURE_EXIT_START + 1) / 2) < 1);
  assert.equal(getMeasureExitProgress(1), 1);
});

test("the measure chapter advances through four stable readings with rolling numbers", () => {
  assert.equal(MEASURE_PARTS.length, 4);
  assert.deepEqual(
    [0, 0.249999, 0.25, 0.5, 0.75, 0.999999].map(getMeasurePart),
    [0, 0, 1, 2, 3, 3],
  );
  assert.equal(getMeasureNumber(0, true), MEASURE_PARTS[0].target);
  assert.equal(getMeasureNumber(0), MEASURE_PARTS[0].target, "the first reading is immediately visible");
  assert.equal(getMeasureNumber(0.1), MEASURE_PARTS[0].target, "the first reading remains static");
  assert.equal(getMeasureNumber(0.25, true), MEASURE_PARTS[1].target);
  assert.equal(getMeasureNumber(0.5, true), MEASURE_PARTS[2].target);
  assert.equal(getMeasureNumber(0.75, true), MEASURE_PARTS[3].target);
  assert.equal(getMeasureNumber(1, true), MEASURE_PARTS[3].target);
  assert.equal(getMeasureNumber(0.25, false), MEASURE_PARTS[0].target);
  assert.equal(getMeasureNumber(1, false), MEASURE_PARTS[3].target);
  assert.ok(getMeasureNumber(0.2) >= MEASURE_PARTS[0].target);
  assert.deepEqual(
    [0, 0.03, 0.08, 0.13, 0.18, 0.24].map((local) => getMeasureNumber(local)),
    [2000, 2000, 2000, 2000, 2000, 2000],
  );
});

test("the reel reaches every configured word, then locks the winning word for the final hold", () => {
  const count = 6;
  assert.equal(getWordPosition(0, count), 0);
  assert.equal(getWordPosition(0.08, count), 0);
  for (let word = 0; word < count; word += 1) {
    closeTo(getWordPosition(0.08 + word * (0.7 / (count - 1)), count), word);
  }
  for (const progress of [0.78, 0.8, 0.9, 0.99, 1]) {
    assert.equal(getWordPosition(progress, count), 5);
  }
  assert.equal(getWordPosition(0.5, 1), 0);
  assert.equal(getWordPosition(0.5, 0), 0);
});

test("each preceding word has a readable stationary hold before moving to the next row", () => {
  const readingWindows = [
    { start: 0.09, end: 0.15, word: 0 },
    { start: 0.23, end: 0.29, word: 1 },
    { start: 0.37, end: 0.43, word: 2 },
    { start: 0.51, end: 0.57, word: 3 },
    { start: 0.65, end: 0.71, word: 4 },
  ];
  for (const { start, end, word } of readingWindows) {
    assert.equal(getWordPosition(start, 6), word);
    assert.equal(getWordPosition((start + end) / 2, 6), word);
    assert.equal(getWordPosition(end, 6), word);
    const moving = getWordPosition(end + 0.04, 6);
    assert.ok(moving > word && moving < word + 1, "the next row must arrive through motion, not a snap");
  }
  // Long and short configured sequences still move forward continuously.
  for (const count of [2, 6, 10]) {
    let previous = getWordPosition(0, count);
    for (let tick = 1; tick <= 1000; tick += 1) {
      const next = getWordPosition(tick / 1000, count);
      assert.ok(next >= previous, "forward scroll cannot move a row backward");
      assert.ok(next - previous < 0.05, "a small scroll increment cannot skip a row");
      previous = next;
    }
  }
});

test("reverse scroll restores the same reel positions rather than retaining the final word", () => {
  const samples = [0, 0.08, 0.15, 0.19, 0.29, 0.33, 0.43, 0.47, 0.57, 0.61, 0.71, 0.75, 0.78, 0.9, 1];
  const forward = samples.map((local) => getWordPosition(local, 6));
  const backward = [...samples].reverse().map((local) => getWordPosition(local, 6));
  assert.deepEqual(backward.reverse(), forward);
  assert.ok(getWordPosition(0.64, 6) < getWordPosition(0.78, 6));
  assert.equal(getWordPosition(0.08, 6), 0);
});

test("disabling a scene closes its range and preserves relative reading durations", () => {
  const cues = buildCues({ reel: false, creation: false });
  assert.ok(cues.every((cue) => cue.id !== "reel" && cue.id !== "creation"));
  assert.equal(cues.length, 7);
  assert.equal(cues[0].start, 0);
  assert.equal(cues.at(-1)?.end, 1);
  for (const [index, cue] of cues.entries()) {
    if (index > 0) assert.equal(cue.start, cues[index - 1].end);
    assert.equal(getSceneAt(cue.start, cues).cue.id, cue.id);
    const midpoint = getSceneAt((cue.start + cue.end) / 2, cues);
    assert.equal(midpoint.cue.id, cue.id);
    closeTo(midpoint.local, 0.5);
  }
  // 21% reel + 11% creation removed; remaining 68% is redistributed.
  closeTo(cues[0].end, 0.08 / 0.68);
  const hero = cues.find((cue) => cue.id === "hero")!;
  closeTo(hero.end - hero.start, 0.11 / 0.68);
  assert.deepEqual(buildCues({}), SCROLL_CUES);
});

test("a one-scene configuration uses the whole story range and an empty configuration remains usable", () => {
  const none = Object.fromEntries(SCROLL_CUES.map((cue) => [cue.id, false])) as Record<SceneId, boolean>;
  const heroOnly = buildCues({ ...none, hero: true });
  assert.deepEqual(heroOnly, [{ ...SCROLL_CUES[2], start: 0, end: 1 }]);
  assert.equal(getSceneAt(0.75, heroOnly).cue.id, "hero");
  assert.equal(getSceneAt(0.75, heroOnly).local, 0.75);
  const fallback = buildCues(none);
  assert.deepEqual(fallback, [{ ...SCROLL_CUES[0], start: 0, end: 1 }]);
  assert.equal(getSceneAt(1, fallback).cue.id, "invitation");
});

test("the chosen word is appended once and changing it preserves the editable preceding sequence", () => {
  const source = ["UNKNOWN", "HUMAN", "DISTANT", "HUMAN"];
  assert.deepEqual(resolveWords(source, "HUMAN"), ["UNKNOWN", "DISTANT", "HUMAN"]);
  assert.deepEqual(source, ["UNKNOWN", "HUMAN", "DISTANT", "HUMAN"], "configuration must not be mutated");
  assert.deepEqual(resolveWords(["UNKNOWN", "CLOSER"], "HUMAN"), ["UNKNOWN", "CLOSER", "HUMAN"]);
  assert.deepEqual(resolveWords([], "HUMAN"), ["HUMAN"]);
  assert.deepEqual(resolveWords(["UNKNOWN", "HUMAN"], "POSSIBLE"), ["UNKNOWN", "HUMAN", "POSSIBLE"]);
});
