# Cinematic assets and replacement guide

## Shipped state

The human × machine scene uses the supplied human/robot hand film as a full-screen scroll-scrubbed sequence. It is a stylized 3D study, not a claim of anatomical or brand approval. The architectural portal, opposing forms, and genesis loop are rendered live in the shared Three.js world.

The current asset manifest is exported from `src/config/experience.ts`. Paths under `/assets/` map to `public/assets/` on disk. Keep final filenames versioned or hashed if replacing a cached deployment.

| Asset | Current path / configuration | State |
| --- | --- | --- |
| Landscape creation poster | `/assets/creation-study.7c7e1bd6b192.webp` | Original generated concept still, 1942 × 809, about 78 KB; content-hashed URL enables immutable caching |
| Small-screen creation poster | `/assets/creation-study-mobile.f22eff57dc9b.webp` | 1200 × 500 delivery variant, about 30 KB; CSS provides portrait framing; content-hashed URL enables immutable caching |
| Scroll-scrubbed cinematic video | `/assets/humanxmachine.b1258adc36a0.mp4` | Original background-preserving H.264, 1280 × 720, 24 fps, 2.04 seconds, 49 frames, about 1.16 MB; content-hashed URL enables immutable caching; scroll maps to source frames in either direction |
| Mobile cinematic video | `assets.handsVideoMobile` | `null`; production required |
| Rigged hands model | `assets.handsGlb` | `null`; model and integration required |

The film is fetched when the preceding chapter enables creation media. It stays paused; the creation cue maps its normalized scroll progress to the nearest 24 fps frame. Pending seeks coalesce to the latest scroll position, so reversing scroll reverses the image sequence without autoplay. The poster remains visible until the first selected frame is decoded. Reduced motion uses the poster. The final contact address `hello@example.com` is a content placeholder and must be replaced before a public brand launch. Empty partner placeholders imply no endorsement.

The archival generated source is `docs/source-assets/creation-study-source.png` (1942 × 809, about 1.68 MB). It is kept outside public delivery. Both current delivery variants have the same wide composition, with the fingertip gap around image x=50%, y=44%. A separately art-directed portrait master remains part of final production.

## Future production upgrade: expanded cinematic film

A professional prerecorded shot provides the strongest skin and mechanical fidelity at predictable mobile cost. Commission or render one original shot with the following brief.

### Composition and performance

- Human hand enters from camera-left, sophisticated robot hand from camera-right. Both extend an index finger toward the same near-contact point, approximately 52% across and 48% down a landscape frame.
- The human wrist, palm, knuckles, nail, tendons, and finger proportions must survive close inspection. Avoid waxy skin, duplicated joints, distorted nails, fused fingers, and implausible hyperextension.
- The robot has intentional tendons or actuators, articulated joints, machined titanium segments, brushed surfaces, and distinct roughness zones. It is a designed hand, not a chrome glove.
- Maintain a 4–8 mm world-space fingertip gap at the final pose. No collision or electrical spectacle. A small warm-white pulse may appear in the gap, with vermilion used only as an extremely restrained secondary reflection.
- Use a near-black studio background matching `#090909`, a broad soft key, quiet fill, and restrained reflected edges. Preserve readable silhouettes and shallow ambient depth without theatrical smoke.
- Leave negative space above the hands. Keep the gap inside the safe center 35% of the image so portrait framing remains viable.
- Original interpretation of the recognizable near-touch gesture; do not reproduce the painting or its background.

### Motion and delivery

| Property | Desktop master | Portrait master |
| --- | --- | --- |
| Framing | 16:9, 3840 × 2160 archival master | 4:5 or 9:16, separately composed |
| Web delivery | 2560 × 1440 and 1920 × 1080 | 1080 × 1350 or 1080 × 1920; 720px variant |
| Duration | 8–10 seconds | Same choreography and duration |
| Frame rate | Constant 30 fps | Constant 30 fps |
| Motion beats | 0–2s establish; 2–5s approach; 5–8s near-contact hold; 8–10s quiet pulse / hold | Same timing |
| Formats | H.264 MP4, `yuv420p`, fast-start; optional VP9/AV1 WebM | H.264 MP4 baseline-compatible delivery |
| Audio | No audio track | No audio track |
| Budget | Aim ≤8 MB for default 1080p shot, ≤14 MB for 1440p | Aim ≤4 MB for 720px shot |
| Poster | AVIF/WebP, 1920px wide, ≤350 KB | WebP, 900px tall, ≤180 KB |

Use a short GOP (approximately 0.5 seconds) if any nonessential seek enhancement is added later. Preserve the poster's exposure and composition in the video's first visible frame. Deliver a separate near-contact hold plate and a clean background plate for compositing or responsive layouts.

### Scroll-scrub playback contract

1. Mount and preload the muted, inline video near the creation cue, not on the opening screen.
2. Keep the element paused. Map the creation cue's eased local progress to the nearest source frame; coalesce updates while a seek is pending, then catch up to the latest target on `seeked`.
3. Keep the decoded poster visible until the selected video frame is available. Network, decoder, or unsupported-codec failure leaves the composed still visible.
4. The black frame and scene background share the same color. Preserve the full wide hand composition on narrow screens instead of cropping either hand.
5. Reduced motion uses the static poster without video seeks or simulated camera motion.

The current 48-frame film has a single initial keyframe. Its short duration and small transfer size keep seek/decode work bounded; retain the poster during initial decoding. Test Safari iOS, Chrome Android, desktop Safari/Chrome/Firefox, slow networking, and data-saving modes on real devices.

## Optional deterministic image sequence

For exact reversible finger motion, deliver 180–240 frames at 1920 × 1080 desktop and 720 × 900 portrait. Use WebP/AVIF variants, index in a JSON manifest, and map the approach/hold/pulse beats to creation-cue progress. Decode a bounded sliding window, retain the previous decoded frame when a target is unavailable, limit memory, and preload only near the scene. Do not ship the full unbounded sequence on initial page load. This loader is a production extension, not an existing shipped asset.

## Alternative route: animated GLB

This route offers deterministic scroll reversal and real camera travel but requires an expert model and material pipeline.

- Deliver separate named roots `HumanHand` and `RobotHand`, with the near-contact gap centered at world origin. Set meters, +Y up, camera looking toward −Z. Include documented bind pose and total scene bounds.
- One deterministic animation clip `Approach`, 8 seconds long; neutral start, near-contact by 5 seconds, final hold through 8 seconds. Name bones, avoid skeletal scale animation, and do not bake background/camera animation into the hand clip.
- Target combined ≤120k triangles desktop and ≤45k mobile. Limit skeleton joints to what the gesture requires. Supply mesh LODs and clean silhouettes, including nails and wrist endings.
- Skin uses carefully authored base color, normal, roughness, occlusion, and transmission/subsurface approximation suited to glTF. No unsupported proprietary shader dependency. Confirm skin fidelity under the website's neutral softbox environment.
- Metal uses PBR metal/roughness with authored brushed normals and bevel detail. Limit 2K maps desktop and 1K mobile where possible. KTX2/Basis texture variants and Meshopt or Draco compression are welcome with decoder assets and licensing.
- Target transfer ≤10 MB desktop / ≤5 MB mobile, decoded texture memory ≤96 MB / ≤48 MB. Include an uncompressed review version and optimized delivery version.
- All assets need clear commercial rights, attribution requirements, and consent documentation where a real person's scan was used.

The `handsGlb` configuration records the replaceable path but does not by itself implement a production animation mixer. Integration must load lazily, evaluate `AnimationMixer.setTime()` from the creation cue, verify the shared lighting and camera, dispose model resources, and preserve the poster for loading/failure/reduced-motion cases. Treat this as a planned production integration until implemented and verified.

## Launch acceptance

- Art director and anatomical reviewer approve both master and portrait compositions.
- The human fingertip and robot fingertip remain distinct on representative mobile screens.
- Near-contact hold is long enough to read emotionally before the pulse begins.
- Exposure and black level match the surrounding WebGL world, including reverse scroll.
- Slow connections, autoplay rejection, and decoding failure retain a polished poster.
- Production metadata, file budgets, commercial rights, source versions, and actual browser results are recorded.
- Remove “concept study” disclosure only after a final asset has been approved and integrated. Keep a truthful production record in this document.
