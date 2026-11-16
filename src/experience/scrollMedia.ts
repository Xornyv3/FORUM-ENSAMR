export const CREATION_VIDEO_FRAME_RATE = 24;

/** Map cue progress to the nearest available frame in a scroll-controlled clip. */
export function getScrollVideoTime(
  progress: number,
  duration: number,
  frameRate = CREATION_VIDEO_FRAME_RATE,
): number {
  if (!Number.isFinite(progress) || !Number.isFinite(duration) || duration <= 0
    || !Number.isFinite(frameRate) || frameRate <= 0) return 0;

  const frameCount = Math.max(1, Math.round(duration * frameRate));
  const frame = Math.round(Math.min(1, Math.max(0, progress)) * (frameCount - 1));
  return frame / frameRate;
}

/** Keep seeks frame-accurate while coalescing intermediate scroll updates. */
export function syncScrollVideo(video: HTMLVideoElement): void {
  const progressValue = video.dataset.scrollProgress
    ?? video.closest<HTMLElement>("[data-creation-progress]")?.dataset.creationProgress;
  const progress = Number(progressValue);
  if (!Number.isFinite(progress) || video.readyState < HTMLMediaElement.HAVE_METADATA
    || !Number.isFinite(video.duration) || video.duration <= 0 || video.seeking) return;

  const target = getScrollVideoTime(progress, video.duration);
  const frameTolerance = 0.5 / CREATION_VIDEO_FRAME_RATE;
  if (Math.abs(video.currentTime - target) > frameTolerance) {
    video.currentTime = target;
    return;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    video.dataset.scrubReady = "true";
  }
}
