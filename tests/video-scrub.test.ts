import assert from "node:assert/strict";
import test from "node:test";
import { createVideoScrubber } from "../src/experience/videoScrub";

class FakeVideo extends EventTarget {
  readyState = 2;
  duration = 2.041625;
  paused = true;
  seeking = false;
  error: { message: string } | null = null;
  ownerDocument = { hidden: false };
  seeks: number[] = [];
  callbacks = new Map<number, VideoFrameRequestCallback>();
  private time = 0;
  private handle = 0;
  get currentTime() { return this.time; }
  set currentTime(value: number) {
    assert.equal(this.seeking, false, "a pending native seek must never be replaced");
    this.seeks.push(value);
    this.time = value;
    this.seeking = true;
  }
  pause() { this.paused = true; }
  requestVideoFrameCallback(callback: VideoFrameRequestCallback) {
    this.callbacks.set(++this.handle, callback);
    return this.handle;
  }
  cancelVideoFrameCallback(handle: number) { this.callbacks.delete(handle); }
  seekComplete() { this.seeking = false; this.dispatchEvent(new Event("seeked")); }
  present() {
    for (const [handle, callback] of this.callbacks) {
      this.callbacks.delete(handle);
      callback(performance.now(), {} as VideoFrameCallbackMetadata);
    }
  }
  element() { return this as unknown as HTMLVideoElement; }
}

test("rapid scroll input coalesces while decoding and reversal seeks the newest requested frame", () => {
  const video = new FakeVideo();
  const scrubber = createVideoScrubber(video.element());
  scrubber.update(0.3, true, false);
  const firstSeek = video.currentTime;
  scrubber.update(0.6, true, false);
  scrubber.update(0.1, true, false);
  assert.equal(video.seeks.length, 1);
  video.seekComplete();
  video.present();
  scrubber.update(0.1, true, false);
  assert.equal(video.seeks.length, 2);
  assert.ok(video.currentTime < firstSeek);
  video.seekComplete();
  video.present();
  for (let frame = 0; frame < 120; frame++) scrubber.update(0.1, true, false);
  assert.equal(video.seeks.length, 2, "stationary scroll must not keep seeking or playing");
  assert.equal(video.paused, true);
  scrubber.dispose();
});

test("late metadata and a decoded cached first frame both recover without autoplay", () => {
  const video = new FakeVideo();
  video.readyState = 0;
  let ready = 0;
  const scrubber = createVideoScrubber(video.element(), { onReady: () => ready++ });
  scrubber.update(0.5, true, false);
  assert.equal(video.seeks.length, 0);
  video.readyState = 2;
  video.dispatchEvent(new Event("loadeddata"));
  scrubber.update(0.5, true, false);
  assert.equal(video.seeks.length, 1);
  assert.equal(ready, 1);
  assert.equal(video.paused, true);
  scrubber.dispose();
  let cachedReady = 0;
  const cached = new FakeVideo();
  const cachedScrubber = createVideoScrubber(cached.element(), { onReady: () => cachedReady++ });
  assert.equal(cachedReady, 1);
  cachedScrubber.dispose();
});

test("seeked is sufficient on browsers without video-frame callbacks", () => {
  const video = new FakeVideo();
  Object.defineProperty(video, "requestVideoFrameCallback", { value: undefined });
  const scrubber = createVideoScrubber(video.element());
  scrubber.update(0.2, true, false);
  video.seekComplete();
  scrubber.update(0.4, true, false);
  assert.equal(video.seeks.length, 2);
  scrubber.dispose();
});

test("missing paused-video presentation callbacks cannot deadlock a completed seek", async () => {
  const video = new FakeVideo();
  const scrubber = createVideoScrubber(video.element(), { framesPerSecond: 60 });
  scrubber.update(0.2, true, false);
  video.seekComplete();
  await new Promise((resolve) => setTimeout(resolve, 45));
  scrubber.update(0.4, true, false);
  assert.equal(video.seeks.length, 2);
  assert.equal(video.callbacks.size, 1, "the stale presentation callback must be canceled");
  scrubber.dispose();
});

test("inactive and hidden scenes hold their frame, and reduced motion selects one final tableau", () => {
  const video = new FakeVideo();
  const scrubber = createVideoScrubber(video.element());
  scrubber.update(0.6, false, false);
  assert.equal(video.seeks.length, 0);
  video.ownerDocument.hidden = true;
  scrubber.update(0.6, true, false);
  assert.equal(video.seeks.length, 0);
  video.ownerDocument.hidden = false;
  scrubber.update(0.1, true, true);
  assert.ok(video.currentTime > 2 && video.currentTime < video.duration);
  video.seekComplete();
  video.present();
  scrubber.update(0.7, true, true);
  assert.equal(video.seeks.length, 1);
  scrubber.dispose();
});

test("cleanup cancels callbacks and error recovery remains owned by the component", () => {
  const video = new FakeVideo();
  let errors = 0;
  const scrubber = createVideoScrubber(video.element(), { onError: () => errors++ });
  scrubber.update(0.5, true, false);
  assert.equal(video.callbacks.size, 1);
  video.error = { message: "Decoder unavailable" };
  video.dispatchEvent(new Event("error"));
  assert.equal(errors, 1);
  assert.equal(video.callbacks.size, 0);
  scrubber.update(0.7, true, false);
  assert.equal(video.seeks.length, 1);
  scrubber.dispose();
  video.dispatchEvent(new Event("error"));
  assert.equal(errors, 1);
  scrubber.update(0.8, true, false);
  assert.equal(video.seeks.length, 1);
  const cachedFailure = new FakeVideo();
  cachedFailure.error = { message: "Cached network failure" };
  const failedScrubber = createVideoScrubber(cachedFailure.element(), { onError: () => errors++ });
  assert.equal(errors, 2, "an error that arrived before mounting still reaches the fallback");
  failedScrubber.dispose();
});
