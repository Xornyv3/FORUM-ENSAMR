import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experienceConfig, type SceneId } from "@/config/experience";
import { clamp, getDualityMaskOpacity, getCreationVideoProgress, getMeasureExitProgress, getMeasurePart, getSceneAt, getSectionLiftProgress, getWordPosition, HERO_CONTENT_REVEAL, MEASURE_EXIT_START, MEASURE_PARTS, range, resolveWords, SCROLL_CUES, smoothstep, type ScrollCue } from "./timeline";
import type { ExperienceWorld, WorldFrame } from "./ExperienceWorld";
import { ScrollPlayhead } from "./ScrollPlayhead";
import { createVideoScrubber, type VideoScrubber } from "./videoScrub";

const experienceWorldModule = typeof window === "undefined"
  ? undefined
  : import("./ExperienceWorld").then(
    (module) => ({ module }),
    (error: unknown) => ({ error }),
  );

interface DirectorOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  cues: ScrollCue[];
  onReady: () => void;
  onError: () => void;
  onScene: (id: SceneId) => void;
  onMotion: (reduced: boolean) => void;
}

export interface DirectorHandle {
  navigate: (id: SceneId) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

/** One measured scroll source and one clock for both DOM and WebGL. */
export function startDirector(options: DirectorOptions): DirectorHandle {
  const { root, canvas, cues } = options;
  gsap.registerPlugin(ScrollTrigger);
  let world: ExperienceWorld | undefined;
  let disposed = false;
  let progress = 0;
  const playhead = new ScrollPlayhead();
  let previousScene = "";
  let dirty = true;
  let lastTime = 0;
  let hasRendered = false;
  let lastMetricsTime = -1;
  let cachedFrame: WorldFrame | undefined;
  let resizeTimer: ReturnType<typeof setTimeout>;
  let resizing = false;
  let resizeTarget = 0;
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  const url = new URL(window.location.href);
  const urlMotion = url.searchParams.get("motion");
  let reducedMotion = urlMotion === "reduced";
  options.onMotion(reducedMotion);

  const layers = new Map<SceneId, HTMLElement>();
  root.querySelectorAll<HTMLElement>("[data-scene]").forEach((element) => layers.set(element.dataset.scene as SceneId, element));
  const cuesById = new Map(cues.map((cue) => [cue.id, cue]));
  const canonicalCuesById = new Map(SCROLL_CUES.map((cue) => [cue.id, cue]));
  const wordStrip = root.querySelector<HTMLElement>(".word-strip");
  const wordCounter = root.querySelector<HTMLElement>(".word-counter");
  const words = resolveWords(experienceConfig.wordReel.words, experienceConfig.wordReel.finalWord);
  const wordElements = [...root.querySelectorAll<HTMLElement>(".reel-word")];
  wordElements.forEach((element, index) => {
    element.style.color = index === words.length - 1
      ? experienceConfig.wordReel.finalColor
      : experienceConfig.wordReel.neutralColor;
  });
  const chapterLabel = root.querySelector<HTMLElement>(".chapter-label");
  const progressRail = root.querySelector<HTMLElement>(".progress-rail > span");
  const progressCount = root.querySelector<HTMLElement>(".progress-count");
  const dualityFirst = root.querySelector<HTMLElement>(".duality-first");
  const dualitySecond = root.querySelector<HTMLElement>(".duality-second");
  const measureContent = root.querySelector<HTMLElement>(".measure-content");
  const measureCopy = root.querySelector<HTMLElement>(".measure-copy");
  const measureIndexElement = root.querySelector<HTMLElement>(".measure-index");
  const measureIndexCurrent = root.querySelector<HTMLElement>(".measure-index-current");
  const measureLabel = root.querySelector<HTMLElement>(".measure-label");
  const measureNumber = root.querySelector<HTMLElement>(".measure-number");
  const measureIndex = root.querySelector<HTMLElement>(".measure-index-current");
  const invitationTower = root.querySelector<HTMLElement>(".invitation-tower");
  let measureTypewriterTimer: ReturnType<typeof setTimeout> | undefined;
  let measureTypewriterPart = -1;
  let measureNumberTimer: ReturnType<typeof setTimeout> | undefined;
  let measureAutoNumber: number = MEASURE_PARTS[0].target;
  let creationVideo: HTMLVideoElement | null = null;
  let videoScrubber: VideoScrubber | undefined;

  function startMeasureNumberSequence(part: number) {
    clearTimeout(measureNumberTimer);
    if (part === 0) {
      measureAutoNumber = MEASURE_PARTS[0].target;
      return;
    }
    const previous = MEASURE_PARTS[part - 1].target;
    const target = MEASURE_PARTS[part].target;
    let value: number = previous;
    measureAutoNumber = value;
    const increment = Math.max(1, Math.ceil(Math.abs(target - previous) / 24));
    const direction = target >= previous ? 1 : -1;
    measureNumberTimer = setTimeout(function rollNext() {
      if (disposed) return;
      value += increment * direction;
      if ((direction > 0 && value >= target) || (direction < 0 && value <= target)) value = target;
      measureAutoNumber = value;
      dirty = true;
      if (value !== target) measureNumberTimer = setTimeout(rollNext, 28);
    }, 28);
  }

  function startMeasureTypewriter(part: number) {
    clearTimeout(measureTypewriterTimer);
    measureTypewriterPart = part;
    if (!measureLabel) return;
    const text = MEASURE_PARTS[part].label;
    if (part === 0 || reducedMotion) {
      measureLabel.textContent = text;
      return;
    }
    let position = 0;
    measureTypewriterTimer = setTimeout(function typeNext() {
      if (disposed || measureTypewriterPart !== part) return;
      measureLabel.textContent = text.slice(0, position);
      if (position < text.length) {
        position += 1;
        measureTypewriterTimer = setTimeout(typeNext, 115);
      }
    }, 0);
  }

  function localFor(id: SceneId) {
    const cue = cuesById.get(id);
    return cue ? range(progress, cue.start, cue.end) : 0;
  }

  function paint() {
    const current = getSceneAt(progress, cues);
    const { cue, local } = current;
    if (root.dataset.activeScene !== cue.id) root.dataset.activeScene = cue.id;
    const progressText = progress.toFixed(5);
    if (root.dataset.progress !== progressText) root.dataset.progress = progressText;
    const targetText = playhead.target.toFixed(5);
    if (root.dataset.scrollTarget !== targetText) root.dataset.scrollTarget = targetText;
    const localText = local.toFixed(4);
    if (root.dataset.local !== localText) root.dataset.local = localText;
    const canonicalCue = canonicalCuesById.get(cue.id)!;
    const canonicalProgress = canonicalCue.start + local * (canonicalCue.end - canonicalCue.start);
    const heroArrival = range(canonicalProgress, HERO_CONTENT_REVEAL[0], HERO_CONTENT_REVEAL[1]);
    const dualityLocal = localFor("duality");
    const portalLocal = localFor("portal");
    const towerOpacity = cue.id === "invitation"
      ? 1
      : cue.id === "portal"
        ? 1 - smoothstep(range(portalLocal, 0.18, 0.72))
        : 0;
    const captionArrival = smoothstep(range(portalLocal, 0.005, 0.065));
    if (invitationTower) {
      invitationTower.style.opacity = String(towerOpacity);
      invitationTower.style.visibility = towerOpacity > 0.001 ? "visible" : "hidden";
    }
    const dualityLift = reducedMotion ? (cue.id === "duality" ? 0 : 1) : getSectionLiftProgress(dualityLocal);
    const dualityMask = cue.id === "duality" && !reducedMotion ? getDualityMaskOpacity(dualityLocal) : 0;

    for (const [id, element] of layers) {
      const own = cuesById.get(id);
      if (!own) continue;
      const width = own.end - own.start;
      const ownLocal = (progress - own.start) / width;
      let opacity = smoothstep(range(ownLocal, -0.08, 0.12)) * (1 - smoothstep(range(ownLocal, 0.88, 1.09)));
      if (id === "invitation") opacity = 1 - smoothstep(range(ownLocal, 0.42, 0.96));
      if (id === "portal") {
        // Take over from the opening title, then disappear with the tower.
        opacity = captionArrival * towerOpacity;
      }
      // Keep the next chapter's copy out of the doorway until the room has arrived.
      if (id === "hero" && (cue.id === "invitation" || cue.id === "portal" || cue.id === "hero")) opacity = smoothstep(heroArrival);
      if (id === "outro") opacity = smoothstep(range(ownLocal, -0.06, 0.18));
      // Any surviving last chapter becomes a final hold when later scenes are disabled.
      if (id !== "outro" && id === cues[cues.length - 1]?.id) opacity = id === "invitation" ? 1 : smoothstep(range(ownLocal, -0.08, 0.12));
      if (id === "duality") opacity = ownLocal < 0 ? 0 : 1;
      if (id === "measure") opacity = cue.id === "measure" || (cue.id === "duality" && dualityLift > 0) ? 1 : 0;
      if (id === "creation") opacity = cue.id === "creation" || (cue.id === "measure" && getMeasureExitProgress(localFor("measure")) > 0) ? 1 : 0;
      if (id === "genesis" && (cue.id === "creation" || cue.id === "genesis")) opacity = 1;
      const opacityText = String(opacity);
      if (element.style.opacity !== opacityText) element.style.opacity = opacityText;
      const visibility = opacity > 0.001 ? "visible" : "hidden";
      if (element.style.visibility !== visibility) element.style.visibility = visibility;
      const isActive = id === cue.id && opacity > 0.15;
      if (element.inert !== !isActive) element.inert = !isActive;
      const ariaHidden = String(!isActive);
      if (element.getAttribute("aria-hidden") !== ariaHidden) element.setAttribute("aria-hidden", ariaHidden);
      const pointerEvents = isActive ? "auto" : "none";
      if (element.style.pointerEvents !== pointerEvents) element.style.pointerEvents = pointerEvents;
      const willChange = opacity > 0.001 ? "opacity, transform" : "auto";
      if (element.style.willChange !== willChange) element.style.willChange = willChange;

      if (!reducedMotion) {
        if (id === "invitation") {
          const transform = `translate3d(0,${-localFor(id) * 4}vh,0)`;
          if (element.style.transform !== transform) element.style.transform = transform;
        }
        else if (id === "hero") {
          const arrival = heroArrival;
          const transform = `perspective(1200px) translate3d(0,${(1 - arrival) * 6}vh,${(arrival - 1) * 280}px)`;
          if (element.style.transform !== transform) element.style.transform = transform;
          const clipPath = `inset(0 ${(1 - smoothstep(arrival)) * 37}% 0 ${(1 - smoothstep(arrival)) * 37}%)`;
          if (element.style.clipPath !== clipPath) element.style.clipPath = clipPath;
        } else if (id === "duality") {
          const transform = `translate3d(0,${-dualityLift * 100}%,0)`;
          if (element.style.transform !== transform) element.style.transform = transform;
          const backgroundColor = dualityMask > 0 ? `rgba(9, 9, 9, ${dualityMask})` : "transparent";
          if (element.style.backgroundColor !== backgroundColor) element.style.backgroundColor = backgroundColor;
        } else if (id === "measure") {
          const exit = cue.id === "measure" ? getMeasureExitProgress(ownLocal) : 0;
          const transform = `translate3d(${-exit * 100}%,${-exit * 100}%,0)`;
          if (element.style.transform !== transform) element.style.transform = transform;
        } else if (id === "creation") {
          const transform = `translate3d(0,${-getSectionLiftProgress(ownLocal) * 100}%,0)`;
          if (element.style.transform !== transform) element.style.transform = transform;
        } else if (element.style.transform !== "none") element.style.transform = "none";
      } else {
        const liftWithoutMotion = (id === "creation" || id === "duality") && cue.id !== id;
        const transform = id === "measure" && cue.id !== id
          ? "translate3d(-100%,-100%,0)"
          : liftWithoutMotion ? "translate3d(0,-100%,0)" : "none";
        if (element.style.transform !== transform) element.style.transform = transform;
        if (id === "duality" && element.style.backgroundColor !== "transparent") element.style.backgroundColor = "transparent";
        if (element.style.clipPath !== "none") element.style.clipPath = "none";
      }
    }

    const reelLocal = localFor("reel");
    const rawWordPosition = getWordPosition(reelLocal, words.length);
    const wordPosition = reducedMotion ? Math.round(rawWordPosition) : rawWordPosition;
    const activeWord = Math.round(wordPosition);
    if (wordStrip) {
      const transform = `translate3d(0,${-wordPosition * 100 / Math.max(words.length, 1)}%,0)`;
      if (wordStrip.style.transform !== transform) wordStrip.style.transform = transform;
    }
    wordElements.forEach((element, index) => {
      const distance = Math.abs(index - wordPosition);
      const opacity = String(clamp(1 - distance * 0.78, 0.12, 1));
      if (element.style.opacity !== opacity) element.style.opacity = opacity;
      const filter = distance > 0.15 && !reducedMotion ? `blur(${Math.min(5, distance * 3)}px)` : "none";
      if (element.style.filter !== filter) element.style.filter = filter;
    });
    const counterText = `${String(activeWord + 1).padStart(2, "0")} / ${String(words.length).padStart(2, "0")}`;
    if (wordCounter && wordCounter.textContent !== counterText) wordCounter.textContent = counterText;
    if (root.dataset.word !== words[activeWord]) root.dataset.word = words[activeWord];
    const wordLocked = String(reelLocal >= 0.78);
    if (root.dataset.wordLocked !== wordLocked) root.dataset.wordLocked = wordLocked;

    if (dualityFirst) {
      const opacity = String(1 - smoothstep(range(dualityLocal, 0.35, 0.55)));
      if (dualityFirst.style.opacity !== opacity) dualityFirst.style.opacity = opacity;
    }
    if (dualitySecond) {
      const opacity = String(smoothstep(range(dualityLocal, 0.42, 0.62)));
      if (dualitySecond.style.opacity !== opacity) dualitySecond.style.opacity = opacity;
    }

    const creationLocal = localFor("creation");
    const creationProgress = creationLocal.toFixed(5);
    if (root.dataset.creationProgress !== creationProgress) root.dataset.creationProgress = creationProgress;
    if (!creationVideo?.isConnected) {
      videoScrubber?.dispose();
      creationVideo = root.querySelector<HTMLVideoElement>("[data-scroll-video]");
      videoScrubber = creationVideo ? createVideoScrubber(creationVideo, {
        onReady: () => { if (creationVideo) creationVideo.dataset.scrubReady = "true"; },
      }) : undefined;
    }
    if (creationVideo) {
      const scrollProgress = getCreationVideoProgress(creationLocal).toFixed(5);
      if (creationVideo.dataset.scrollProgress !== scrollProgress) creationVideo.dataset.scrollProgress = scrollProgress;
    }
    if (measureContent && measureCopy && measureIndexElement && measureIndexCurrent && measureLabel && measureNumber && measureIndex) {
      const measureLocal = localFor("measure");
      const part = getMeasurePart(measureLocal);
      if (cue.id === "measure" && measureTypewriterPart !== part) {
        startMeasureNumberSequence(part);
        startMeasureTypewriter(part);
      }
      const number = String(reducedMotion ? MEASURE_PARTS[part].target : measureAutoNumber);
      if (measureNumber.textContent !== number) measureNumber.textContent = number;
      const index = String(part + 1).padStart(2, "0");
      if (measureIndex.textContent !== index) measureIndex.textContent = index;
      if (measureContent.dataset.part !== String(part)) measureContent.dataset.part = String(part);
      if (measureCopy.style.opacity !== "1") measureCopy.style.opacity = "1";
      if (measureIndexCurrent.style.opacity !== "1") measureIndexCurrent.style.opacity = "1";
    }
    if (cue.id !== previousScene) {
      previousScene = cue.id;
      if (cue.id !== "measure") {
        clearTimeout(measureTypewriterTimer);
        clearTimeout(measureNumberTimer);
        measureTypewriterPart = -1;
      }
      const sceneNumber = SCROLL_CUES.findIndex((item) => item.id === cue.id);
      if (chapterLabel) chapterLabel.textContent = `${String(sceneNumber).padStart(2, "0")} ${cue.label}`;
      if (progressCount) progressCount.textContent = String(sceneNumber).padStart(2, "0");
      options.onScene(cue.id);
    }
    if (progressRail) {
      const transform = `scaleX(${progress})`;
      if (progressRail.style.transform !== transform) progressRail.style.transform = transform;
    }
    return { progress: canonicalProgress, scene: cue.id, local, reducedMotion, pointer, time: lastTime };
  }

  const trigger = ScrollTrigger.create({ trigger: root, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
    onUpdate: (self) => { if (!resizing) playhead.seek(self.progress); dirty = true; },
    onRefresh: (self) => { if (!resizing) playhead.seek(self.progress); dirty = true; },
  });
  // Honor restored scroll without flying through the whole story on page load.
  progress = playhead.snap(trigger.progress);

  const tick = (time: number, deltaTime: number) => {
    if (disposed || document.hidden) return;
    lastTime = time;
    const crossingDoorway = Math.max(progress, playhead.target) > 0.02
      && Math.min(progress, playhead.target) < 0.2;
    const measureCue = cuesById.get("measure");
    // Blend damping around the handoff instead of switching speed at its boundary.
    const measureLocal = measureCue ? (progress - measureCue.start) / (measureCue.end - measureCue.start) : -1;
    const handoffBlend = smoothstep(range(measureLocal, MEASURE_EXIT_START - 0.06, MEASURE_EXIT_START))
      * (1 - smoothstep(range(measureLocal, 1, 1.12)));
    playhead.setResponse(crossingDoorway ? 4.5 : 10 - 7.6 * handoffBlend);
    const nextProgress = resizing ? progress : reducedMotion ? playhead.snap() : playhead.advance(deltaTime / 1000);
    if (nextProgress !== progress) { progress = nextProgress; dirty = true; }
    const pointerBlend = 1 - Math.exp(-8 * Math.min(deltaTime / 1000, 0.05));
    pointer.x += (pointerTarget.x - pointer.x) * pointerBlend;
    pointer.y += (pointerTarget.y - pointer.y) * pointerBlend;
    if (reducedMotion && !dirty && hasRendered) return;
    if (dirty || !cachedFrame) cachedFrame = paint();
    // Service pending decodes even after scrolling stops so the last seek settles.
    videoScrubber?.update(getCreationVideoProgress(localFor("creation")),
      previousScene === "creation" || previousScene === "measure", reducedMotion);
    cachedFrame.time = lastTime;
    const rendered = world?.render(cachedFrame) ?? false;
    if (rendered && !hasRendered) { hasRendered = true; options.onReady(); }
    if (world && time - lastMetricsTime > 1) {
      const metrics = world.getMetrics();
      root.dataset.renderMetrics = JSON.stringify(metrics);
      lastMetricsTime = time;
    }
    dirty = false;
  };
  gsap.ticker.add(tick);

  const onPointer = (event: PointerEvent) => { pointerTarget.x = (event.clientX / window.innerWidth - 0.5) * 2; pointerTarget.y = (event.clientY / window.innerHeight - 0.5) * 2; };
  const onResize = () => {
    if (!resizing) resizeTarget = playhead.target;
    resizing = true;
    world?.resize(); dirty = true; clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
      window.scrollTo({ top: trigger.start + resizeTarget * (trigger.end - trigger.start), behavior: "instant" });
      ScrollTrigger.update();
      playhead.seek(resizeTarget);
      resizing = false;
      dirty = true;
    }, 160);
  };
  const onVisibility = () => {
    if (!document.hidden) {
      ScrollTrigger.refresh();
      progress = playhead.snap(trigger.progress);
      dirty = true;
    }
  };
  const onRestored = () => { hasRendered = false; dirty = true; };
  const setMotion = (value: boolean, remember = true) => {
    reducedMotion = value;
    if (remember) {
      const url = new URL(window.location.href);
      url.searchParams.set("motion", value ? "reduced" : "full");
      history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
    if (value) progress = playhead.snap();
    pointer.x = 0; pointer.y = 0;
    pointerTarget.x = 0; pointerTarget.y = 0;
    dirty = true;
    root.classList.toggle("reduced-motion", value);
    options.onMotion(value);
    if (remember) { try { localStorage.setItem("threshold:motion:v1", value ? "reduced" : "full"); } catch { /* Optional storage. */ } }
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("threshold:context-restored", onRestored);

  const worldModulePromise = experienceWorldModule ?? import("./ExperienceWorld").then(
    (module) => ({ module }),
    (error: unknown) => ({ error }),
  );
  let initializingWorld: ExperienceWorld | undefined;
  void worldModulePromise.then(async (result) => {
    if ("error" in result) throw result.error;
    if (disposed) return;
    initializingWorld = new result.module.ExperienceWorld(canvas, options.onError);
    await initializingWorld.prepare(cachedFrame ?? paint());
    if (disposed) {
      initializingWorld.dispose();
      return;
    }
    world = initializingWorld;
    dirty = true;
  }).catch((error: unknown) => {
    initializingWorld?.dispose();
    if (!disposed) {
      console.error("Unable to initialize the 3D experience.", error);
      options.onError();
    }
  });

  const navigate = (id: SceneId) => {
    if (disposed) return;
    const target = cues.find((cue) => cue.id === id) ?? cues[0];
    if (!target) return;
    // Land inside the readable hold, rather than an invisible cue boundary.
    const point = target.start + (target.end - target.start) * (
      id === "reel" ? 0.13 : id === "portal" ? 0.42 : id === "invitation" ? 0 : 0.24
    );
    window.scrollTo({ top: trigger.start + point * (trigger.end - trigger.start), behavior: "instant" });
    history.replaceState(null, "", `#${target.id}`);
    ScrollTrigger.update();
    progress = id === "portal" && !reducedMotion && progress < point
      ? playhead.transition(0, point)
      : playhead.snap(point);
    cachedFrame = paint();
    const destination = layers.get(target.id)?.querySelector<HTMLElement>("h1,h2") ?? layers.get(target.id);
    if (destination) { destination.tabIndex = -1; destination.focus({ preventScroll: true }); }
    dirty = true;
  };
  const onHash = () => { const id = window.location.hash.slice(1) as SceneId; if (cues.some((cue) => cue.id === id)) navigate(id); };
  window.addEventListener("hashchange", onHash);
  const hashFrame = window.location.hash ? requestAnimationFrame(onHash) : 0;
  paint();

  return {
    navigate,
    setReducedMotion: (value) => setMotion(value),
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(hashFrame);
      clearTimeout(resizeTimer);
      clearTimeout(measureTypewriterTimer);
      clearTimeout(measureNumberTimer);
      trigger.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("threshold:context-restored", onRestored);
      videoScrubber?.dispose();
      world?.dispose();
    },
  };
}
