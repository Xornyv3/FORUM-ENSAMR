import type { SceneId } from "@/config/experience";

export interface ScrollCue {
  id: SceneId;
  label: string;
  start: number;
  end: number;
}

/** Fractions of the native scroll distance, shared by HTML and WebGL. */
export const SCROLL_CUES: ScrollCue[] = [
  { id: "invitation", label: "L'ouverture", start: 0, end: 0.08 },
  { id: "portal", label: "Le campus", start: 0.08, end: 0.2 },
  { id: "hero", label: "La problématique", start: 0.2, end: 0.31 },
  { id: "reel", label: "L'ingénieur augmenté", start: 0.31, end: 0.52 },
  { id: "duality", label: "Académie / industrie", start: 0.52, end: 0.64 },
  { id: "measure", label: "Le forum en chiffres", start: 0.64, end: 0.72 },
  { id: "creation", label: "L'ère de l'IA", start: 0.72, end: 0.83 },
  { id: "genesis", label: "Partenariats", start: 0.83, end: 0.92 },
  { id: "outro", label: "Rendez-vous", start: 0.92, end: 1 },
];

export const SCROLL_HEIGHT_VH = 1800;
/** Canonical progress: open the door, reveal the room, then introduce its copy. */
export const HERO_FRAMES_REVEAL = [0.13, 0.157] as const;
export const HERO_CONTENT_REVEAL = [0.184, 0.208] as const;
export const CREATION_VIDEO_END = 0.6;
export const SECTION_LIFT_START = 0.7;
export const DUALITY_MASK_START = 0.64;
export const MEASURE_EXIT_START = 0.86;
export const MEASURE_PARTS = [
  { label: "Visiteurs", target: 2000 },
  { label: "Entreprises", target: 52 },
  { label: "Recruteurs", target: 200 },
  { label: "CV collectés", target: 500 },
] as const;

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

/** Finish the scroll-scrubbed film before holding its final frame for the handoff. */
export function getCreationVideoProgress(local: number): number {
  return range(local, 0, CREATION_VIDEO_END);
}

/** Quintic easing keeps the section lifts gentle at both ends. */
export function smootherstep(value: number): number {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Lift a completed scene over the final portion of its scroll cue. */
export function getSectionLiftProgress(local: number): number {
  return smootherstep(range(local, SECTION_LIFT_START, 1));
}

/** Settle the prior scene's backdrop before the video starts to appear beneath it. */
export function getDualityMaskOpacity(local: number): number {
  return smootherstep(range(local, DUALITY_MASK_START, SECTION_LIFT_START));
}

/** Move the readings field diagonally aside before exposing the film below. */
export function getMeasureExitProgress(local: number): number {
  if (local <= MEASURE_EXIT_START) return 0;
  if (local >= 1) return 1;
  return smootherstep(range(local, MEASURE_EXIT_START, 1));
}

/** Select one of four scroll-authored readings for the measure chapter. */
export function getMeasurePart(local: number): number {
  return Math.min(MEASURE_PARTS.length - 1, Math.floor(clamp(local) * MEASURE_PARTS.length));
}

/** Roll through exactly three deterministic intermediate values between readings. */
export function getMeasureNumber(local: number, reducedMotion = false): number {
  const part = getMeasurePart(local);
  if (reducedMotion) return MEASURE_PARTS[part].target;
  const partLocal = clamp(local) * MEASURE_PARTS.length - part;
  const previous = part === 0 ? MEASURE_PARTS[0].target : MEASURE_PARTS[part - 1].target;
  const target = MEASURE_PARTS[part].target;
  const step = Math.min(4, Math.floor(range(partLocal, 0.04, 0.2) * 5));
  if (step >= 4) return target;
  return Math.round(previous + (target - previous) * step / 4);
}

/** Map a value from a cue subrange to a clamped 0–1 interval. */
export function range(value: number, start: number, end: number): number {
  return clamp((value - start) / Math.max(0.000001, end - start));
}

export type ScrollWeights = Partial<Record<SceneId, number>>;

function weightedCues(visibility: Partial<Record<SceneId, boolean>>, weights: ScrollWeights) {
  const enabled = SCROLL_CUES.filter((cue) => visibility[cue.id] !== false);
  // A valid visual and keyboard destination survives even an all-disabled config.
  const visible = enabled.length ? enabled : [SCROLL_CUES[0]];
  return visible.map((cue) => {
    const requestedWeight = weights[cue.id] ?? 1;
    // Invalid configuration cannot introduce NaN ranges or zero-length chapters.
    const weight = Number.isFinite(requestedWeight) && requestedWeight > 0
      ? clamp(requestedWeight, 0.1, 10)
      : 1;
    return { cue, duration: (cue.end - cue.start) * weight };
  });
}

/** Removing a section closes its range; weights give individual scenes more scroll room. */
export function buildCues(visibility: Partial<Record<SceneId, boolean>>, weights: ScrollWeights = {}): ScrollCue[] {
  const visible = weightedCues(visibility, weights);
  const duration = visible.reduce((sum, item) => sum + item.duration, 0);
  let cursor = 0;
  return visible.map(({ cue, duration: cueDuration }, index) => {
    const start = cursor;
    cursor += cueDuration / duration;
    return { ...cue, start, end: index === visible.length - 1 ? 1 : cursor };
  });
}

/** Include the sticky viewport while preserving other chapters' physical scroll distances. */
export function getScrollHeightVh(visibility: Partial<Record<SceneId, boolean>>, weights: ScrollWeights = {}): number {
  const duration = weightedCues(visibility, weights).reduce((sum, item) => sum + item.duration, 0);
  return 100 + (SCROLL_HEIGHT_VH - 100) * duration;
}

export function getSceneAt(progress: number, cues: ScrollCue[] = SCROLL_CUES) {
  const p = clamp(progress);
  const index = Math.max(0, cues.findIndex((cue, i) => p < cue.end || i === cues.length - 1));
  const cue = cues[index] ?? SCROLL_CUES[0];
  return { cue, local: range(p, cue.start, cue.end), index };
}

/** Each word reads at rest before an eased move; the final 22% locks the chosen word. */
export function getWordPosition(local: number, count: number): number {
  const travel = range(local, 0.08, 0.78) * Math.max(0, count - 1);
  const word = Math.floor(travel);
  // Give 60% of each beat to reading; spend the remaining 40% moving one row.
  return word + smoothstep(range(travel - word, 0.6, 1));
}

/** Keep the chosen final word editable even when it is omitted from the sequence. */
export function resolveWords(words: string[], finalWord: string): string[] {
  return [...words.filter((word) => word !== finalWord), finalWord];
}
