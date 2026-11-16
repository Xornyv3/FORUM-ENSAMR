# Validation record

Validated 14 November 2026 in the supplied Windows workspace. The repository began empty; no reference PDF was available. The production application runs locally at `http://localhost:3000` using `npm start`; it has not been deployed.

## Technical checks

| Check | Actual result |
| --- | --- |
| `npm run typecheck` | Passed, no errors |
| `npm run lint` | Passed, no errors or warnings |
| `npm test` | 16 tests passed, including the door-motion correction |
| `npm run build` | Passed; static App Router page and icon generated |
| `npm audit --omit=dev` | 0 production dependency vulnerabilities reported |
| Production Chromium story run | No console errors, warnings, uncaught page errors or failed requests |

Timeline tests cover contiguous cue coverage, exact boundaries, readable word dwell, the final 22% winning-word hold, reverse restoration, hidden-section normalization, safe empty/single-scene configurations, and configurable final-word deduplication.

## Door-motion correction

The original animation jumped to each new wheel position immediately and restarted camera easing at every keyframe. A 360px scroll step produced only one unique displayed position over 60 sampled frames, explaining the perceived sequence of still pictures despite a live renderer.

The director now advances a critically damped playhead on every GSAP tick. The doors, lights, camera and HTML all follow that shared progress. Camera sampling uses a shape-preserving cubic curve with continuous velocity across the opening keys, and the mobile camera offset finishes without its previous cutoff. Shadows and pointer parallax also update continuously.

Production-browser retest: the same 360px step produced 55 distinct intermediate positions in both directions, settling exactly on the target. Mean frame interval was 16.66ms (approximately 60fps) for each isolated wheel-step test, with no console errors or warnings. A real wheel-input traversal produced 199 distinct positions in 200 frames, including screenshot overhead. Chapter navigation remained immediate and focused the heading; HUMAN still locked; reduced-motion output remained static. `artifacts/door-smooth-filmstrip.png` records intermediate opening and arrival frames.

Eight additional regression tests verify intermediate motion, equivalent response at 30/60/120fps, reversal without a position/velocity jump, direct navigation/reset, exact camera framing, continuous nonzero doorway velocity, bounded monotonic camera travel and identical reverse sampling.

## Visual review

Actual browser: Chromium 157.0.8103.78, driven with Playwright after the in-app browser connection reported no available browser. Captures were viewed as individual frames and contact sheets. The first review led to darker portal materials, a calmer ground plane, improved camera framing, less intrusive genesis scale, and actual word-reading holds.

| Viewport | Coverage |
| --- | --- |
| Desktop 1440 × 900 | All eight scenes plus intermediate reel and half-open door frames; production keyframes captured |
| Tablet 834 × 1112 | All eight scenes; portrait camera framing refined after review |
| Mobile 390 × 844 | All eight scenes; hero, final word, fingertips, loop and final CTA visually inspected |
| Mobile 390 × 844, device scale factor 2 | Production opening and creation captures; renderer DPR correctly capped at 1.25 |

No horizontal page overflow was detected at any tested viewport. The portal opens around physical outer hinges and the camera proceeds through the gap. The hero's dimensional reveal is clipped during the crossing, then holds inside the architectural room. Later scenes retain the same ground, lighting language and camera direction. The human/robot hand film now scrubs through its source frames with chapter progress and reverses on upward scroll; the poster remains the fallback and reduced-motion presentation.

Local evidence is under the ignored `artifacts/` directory:

- `contact-sheet.png`, `mobile-contact-sheet.png`, `tablet-contact-sheet.png`
- `prod-invitation.png` through `prod-outro.png`, including the intermediate `prod-door.png`
- `prod-mobile-opening.png`, `prod-mobile-creation.png`
- `reduced-genesis.png`, `prod-no-js.png`, `prod-no-webgl.png`, `prod-restored.png`

## Behavior exercised

- Opened the index, navigated directly to the future scene, and closed the modal with Escape.
- Scrolled forward to global progress .50: word `HUMAN`, locked `true`.
- Reversed to .40: word `AUTOMATED`, locked `false`.
- Reversed through the opening to .14: portal geometry returned to its intermediate hinged state.
- Resized from 1440 × 900 to 834 × 1112 at portal progress .14: resulting progress .14001, with the same active scene.
- Keyboard Tab reached **Skip introduction** first. Enter moved focus to `hero-title`. Index navigation moved focus to `reel-title` after the dialog closed.
- Activated reduced motion through both the UI and the operating-system media preference. The genesis canvas remained pixel-identical across an idle 500 ms sample; no ambient drift remained. The reel steps between words without traveling continuously.
- Simulated actual GPU context loss using `WEBGL_lose_context`. The page entered the still edition with readable text and retry controls, then returned to `ready` after restoration. The final production retest produced no stale-resource WebGL warnings.
- Disabled WebGL creation in an isolated context: the still edition remained readable. Re-enabled WebGL and clicked **Retry 3D**: returned to `ready`.
- Loaded in an isolated browser context with JavaScript disabled: seven semantic scene headings were all visible at opacity 1 in a 7,618px static story, with no horizontal overflow.

## Measured rendering

A production 180-frame traversal scrolled through the complete story on the available machine at 1440 × 900 and DPR 1. Results:

| Measurement | Result |
| --- | --- |
| Mean animation-frame interval | 18.33 ms, approximately 54.5 fps overall |
| 95th-percentile interval | 17.0 ms |
| Frames longer than 33.4 ms | 3 of 180 |
| High-density mobile DPR | 2 device DPR reduced to 1.25 renderer DPR |

These are actual local browser measurements, including scene transitions; they are not claims about all hardware. Scene draw calls and triangles are exposed in `main.dataset.renderMetrics` for inspection. Rendering stops in hidden tabs, updates static reduced-motion frames only when needed, and lowers DPR after sustained slow frames. No heavy postprocessing or unbounded particle systems are present.

## Production work and manual verification remaining

1. Produce the final anatomically approved human/robot cinematic video or optimized animation assets. Current deterministic two-plane framing does not articulate fingers. A separately art-directed portrait master is still required.
2. Integrate and test final media on desktop Safari/Firefox, real iOS Safari and representative Android devices, including slow networks, autoplay rejection and decoder failure. Optional video integration exists; the GLB mixer and bounded image-sequence routes are specified production extensions.
3. Approve final brand copy, contact destination, partner marks, metadata and search indexing. `hello@example.com` and `noindex` remain deliberate template settings.
4. Evaluate extended-session performance, touch-scroll behavior and thermal behavior on physical mobile hardware. Responsive browser simulation does not establish real-device performance.
5. Eight moderate advisories remain in the development-only TypeScript ESLint/minimatch chain. No compatible upstream fix was available during implementation; no forced major override or toolchain downgrade was applied. Production dependency audit is clean.

The current application is a complete functioning cinematic template with the honest asset limitations above. Final photorealistic hand animation is not represented as finished.
