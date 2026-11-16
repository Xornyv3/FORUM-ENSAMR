/** Camera positions in metres. The installation is staged along negative Z. */
export type CameraCue = {
  at: number;
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export const cameraCues: CameraCue[] = [
  { at: 0, position: [0.25, 0.4, 14.8], target: [-1.25, 0.2, 0], fov: 43 },
  { at: 0.08, position: [0, 0.3, 13.8], target: [0, 0.1, -1], fov: 43 },
  { at: 0.145, position: [0, 0.25, 4.4], target: [0, 0.15, -10], fov: 46 },
  { at: 0.2, position: [0, 0.15, -7], target: [0, 0.1, -23], fov: 48 },
  { at: 0.31, position: [0, 0.4, -14.5], target: [0, 0.1, -31], fov: 48 },
  { at: 0.49, position: [0, 0.45, -26], target: [0, 0.2, -43], fov: 46 },
  { at: 0.55, position: [0.3, 0.75, -32], target: [0, 0.4, -46], fov: 48 },
  { at: 0.61, position: [0, 0.5, -43], target: [0, 0.35, -60], fov: 48 },
  { at: 0.65, position: [0, 0.2, -57], target: [0, 0.2, -75], fov: 46 },
  { at: 0.75, position: [0, 0.2, -73], target: [0, 0.2, -90], fov: 46 },
  { at: 0.79, position: [0, 0.25, -79], target: [0, 0.3, -96], fov: 46 },
  { at: 0.85, position: [2, 1.3, -87], target: [0.8, 0.3, -98], fov: 48 },
  { at: 0.89, position: [0.5, 0.4, -103], target: [0, 0.3, -123], fov: 46 },
  { at: 1, position: [0, 0.2, -113], target: [0, 0.3, -127], fov: 44 },
];

export type CameraPose = Omit<CameraCue, 'at'>;

const times = cameraCues.map((cue) => cue.at);
const intervals = times.slice(1).map((time, index) => time - times[index]);

/** PCHIP tangents preserve each segment's bounds without stopping at every key. */
function tangents(values: number[]): number[] {
  const slopes = intervals.map((duration, index) => (values[index + 1] - values[index]) / duration);
  const result = new Array<number>(values.length).fill(0);
  const endpoint = (duration: number, adjacentDuration: number, slope: number, adjacentSlope: number) => {
    const tangent = ((2 * duration + adjacentDuration) * slope - duration * adjacentSlope) / (duration + adjacentDuration);
    if (Math.sign(tangent) !== Math.sign(slope)) return 0;
    if (Math.sign(slope) !== Math.sign(adjacentSlope) && Math.abs(tangent) > 3 * Math.abs(slope)) return 3 * slope;
    return tangent;
  };
  result[0] = endpoint(intervals[0], intervals[1], slopes[0], slopes[1]);
  const last = slopes.length - 1;
  result[result.length - 1] = endpoint(intervals[last], intervals[last - 1], slopes[last], slopes[last - 1]);
  for (let i = 1; i < values.length - 1; i++) {
    const before = slopes[i - 1];
    const after = slopes[i];
    if (before === 0 || after === 0 || Math.sign(before) !== Math.sign(after)) continue;
    const beforeWeight = 2 * intervals[i] + intervals[i - 1];
    const afterWeight = intervals[i] + 2 * intervals[i - 1];
    result[i] = (beforeWeight + afterWeight) / (beforeWeight / before + afterWeight / after);
  }
  return result;
}

const channels = [
  ...[0, 1, 2].map((axis) => cameraCues.map((cue) => cue.position[axis])),
  ...[0, 1, 2].map((axis) => cameraCues.map((cue) => cue.target[axis])),
  cameraCues.map((cue) => cue.fov),
].map((values) => ({ values, tangents: tangents(values) }));

/**
 * Sample one continuous dolly path. Shared tangents carry velocity across cue
 * boundaries; zero tangents are reserved for actual turns or authored holds.
 * Pass a reusable result from the render loop to avoid per-frame allocations.
 */
export function sampleCamera(progress: number, result: CameraPose = { position: [0, 0, 0], target: [0, 0, 0], fov: 43 }): CameraPose {
  const p = Math.min(times[times.length - 1], Math.max(times[0], progress));
  let segment = 0;
  while (segment < times.length - 2 && p > times[segment + 1]) segment++;
  const duration = intervals[segment];
  const t = (p - times[segment]) / duration;
  const t2 = t * t;
  const t3 = t2 * t;
  const startValue = 2 * t3 - 3 * t2 + 1;
  const startTangent = (t3 - 2 * t2 + t) * duration;
  const endValue = -2 * t3 + 3 * t2;
  const endTangent = (t3 - t2) * duration;

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    const value = startValue * channel.values[segment]
      + startTangent * channel.tangents[segment]
      + endValue * channel.values[segment + 1]
      + endTangent * channel.tangents[segment + 1];
    if (i < 3) result.position[i] = value;
    else if (i < 6) result.target[i - 3] = value;
    else result.fov = value;
  }
  return result;
}

/** Maps editable/reordered scene ranges back onto the spatial installation. */
export const canonicalRanges: Record<string, readonly [number, number]> = {
  invitation: [0, 0.08],
  portal: [0.08, 0.2],
  hero: [0.2, 0.31],
  reel: [0.31, 0.52],
  duality: [0.52, 0.64],
  creation: [0.64, 0.77],
  genesis: [0.77, 0.89],
  outro: [0.89, 1],
};
