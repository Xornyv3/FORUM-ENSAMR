export interface VideoScrubberOptions {
  framesPerSecond?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface VideoScrubber {
  update: (progress: number, active: boolean, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Scrub the original video without creating a second animation clock or changing
 * its encoding. Only one native seek is allowed at a time. New scroll targets
 * replace the queued target rather than interrupting a frame being decoded.
 */
export function createVideoScrubber(video: HTMLVideoElement, options: VideoScrubberOptions = {}): VideoScrubber {
  const fps = Math.max(1, options.framesPerSecond ?? 24);
  const tolerance = 0.5 / fps;
  const presentationGraceMs = 2000 / fps;
  const hasFrameCallbacks = typeof video.requestVideoFrameCallback === "function";
  let progress = 0;
  let active = false;
  let reducedMotion = false;
  let disposed = false;
  let failed = false;
  let ready = false;
  let frameCallback: number | undefined;
  let pending: { started: number; seeked: number | null; presented: boolean } | undefined;

  const cancelFrameCallback = () => {
    if (frameCallback !== undefined && typeof video.cancelVideoFrameCallback === "function") {
      video.cancelVideoFrameCallback(frameCallback);
    }
    frameCallback = undefined;
  };

  const markReady = () => {
    if (disposed || failed || ready || video.readyState < 2) return;
    ready = true;
    options.onReady?.();
  };

  const finishSeek = () => {
    pending = undefined;
    cancelFrameCallback();
    markReady();
    // The next director tick starts any coalesced seek, giving this frame a
    // compositor opportunity before another decode starts.
  };

  const onSeeked = () => {
    if (disposed || failed || video.seeking) return;
    if (pending) {
      pending.seeked = performance.now();
      if (!hasFrameCallbacks || pending.presented) finishSeek();
    } else {
      markReady();
    }
  };

  const onLoadedData = () => {
    // Some browsers retain the last decoded frame when a cached video element
    // is reused. Reset it before the first visible presentation.
    if (!pending && video.readyState >= 1 && video.currentTime > tolerance) {
      try {
        video.currentTime = 0;
      } catch (error) {
        options.onError?.(error instanceof Error ? error : new Error("Unable to reset the original hand film."));
      }
    }
    if (!pending && !video.seeking) markReady();
  };

  const onError = () => {
    if (disposed || failed) return;
    failed = true;
    pending = undefined;
    cancelFrameCallback();
    video.pause();
    options.onError?.(new Error(video.error?.message || "Unable to load or decode the original hand film."));
  };

  video.pause();
  video.addEventListener("seeked", onSeeked);
  video.addEventListener("loadeddata", onLoadedData);
  video.addEventListener("error", onError);
  // A cached resource may already have delivered loadeddata before this effect.
  if (video.error) onError();
  else onLoadedData();

  return {
    update(nextProgress, nextActive, nextReducedMotion) {
      if (disposed || failed) return;
      progress = Math.max(0, Math.min(1, Number.isFinite(nextProgress) ? nextProgress : 0));
      active = nextActive;
      reducedMotion = nextReducedMotion;
      if (!video.paused) video.pause();

      if (pending) {
        // Some browsers omit frame callbacks for paused video. A completed seek
        // with current decoded data is a reliable fallback; never cancel an
        // in-flight seek merely because its newer scroll target has changed.
        const now = performance.now();
        const completed = !video.seeking && video.readyState >= 2;
        const sinceCompletion = now - (pending.seeked ?? pending.started);
        if (completed && (pending.presented || sinceCompletion >= presentationGraceMs)) finishSeek();
        else return;
      }

      if (!active || video.ownerDocument?.hidden || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const lastFrameTime = Math.max(0, video.duration - tolerance);
      const target = (reducedMotion ? 1 : progress) * lastFrameTime;
      if (Math.abs(video.currentTime - target) <= tolerance) {
        markReady();
        return;
      }

      pending = { started: performance.now(), seeked: null, presented: false };
      if (hasFrameCallbacks) {
        frameCallback = video.requestVideoFrameCallback(() => {
          frameCallback = undefined;
          if (disposed || failed || !pending) return;
          pending.presented = true;
          if (pending.seeked !== null && !video.seeking && video.readyState >= 2) finishSeek();
        });
      }
      try {
        video.currentTime = target;
      } catch (error) {
        pending = undefined;
        cancelFrameCallback();
        // A resource can briefly lose metadata during source/load transitions.
        // The next central tick retries once metadata is available again.
        if (video.readyState >= 1) {
          failed = true;
          options.onError?.(error instanceof Error ? error : new Error("Unable to seek the original hand film."));
        }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pending = undefined;
      cancelFrameCallback();
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("error", onError);
      video.pause();
    },
  };
}
