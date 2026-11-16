# The Threshold — direction and implementation plan

## The film

The visitor moves through one immense architectural chamber: a closed seam, a crossing, a thought, two materials, a connection, four readings in motion, a new form, an open ending. Native scroll is the camera operator. Each composition has one dominant subject, with cuts replaced by camera travel and the movement of physical surfaces.

The repository was empty at inspection. No attached 3D website PDF was available. The plan therefore follows the supplied brief's explicit principles: shared scroll cues, controlled studio lighting, physically based materials, a persistent renderer, capped resolution, and reduced-motion alternatives. It does not claim to incorporate an unseen reference.

## Design system

| Token | Value | Role |
| --- | --- | --- |
| Obsidian | `#090909` | Continuous stage and architectural shadow |
| Ivory | `#F0EDE5` | Editorial text, stone, luminous space |
| Titanium | `#858581` | Mechanical material and subtle interface |
| Deep metal | `#252523` | Monumental portal surfaces |
| Vermilion | `#E84D2A` | Chosen final word and the connection pulse |

Instrument Sans is the local editorial grotesk. Oversized tightly spaced headlines behave as composition, while small interface text remains quietly readable. Left-aligned type and open space establish an editorial rhythm; the word reel alone occupies a central reading axis. No cards, invented endorsements, particle field, stock illustration grid, or conventional feature stack.

The opening silhouette is the identity: an upright monolith split by light. Its edges recur in the duality passage and the final frame. The accent is withheld until a human decision arrives. A small amount of grain joins rendered surfaces and generated media without obscuring fine typography.

## Storyboard and motion timeline

The base story spans 1,800vh including the sticky viewport. The creation scene now has weight `2.4`, extending its physical scroll distance to 530.4vh and the complete page to 2,109.4vh. All other chapter distances, including the doorway, stay unchanged. Ranges below are canonical spatial cue coordinates; `buildCues()` normalizes the weighted ranges used by native scroll. Section visibility recalculates both the cue map and total track height. Every important state is calculated from progress and reverses on the same path.

| Scene | Canonical cue range | Hero still and choreography | Text |
| --- | --- | --- | --- |
| 00 Invitation | 0–8% | Nearly closed dark metal portal, distant ivory seam, textured ground, restrained pointer drift. Camera approaches but has not crossed. | BEYOND / THE VISIBLE. Scroll to enter. |
| 01 Crossing | 8–20% | Two thick leaves rotate around their outer hinges. The widening physical gap exposes the room behind; perspective and reflected light change as the camera passes through. | Quiet transition; no competing major headline. |
| 02 Arrival | 20–31% | Room opens around enormous editorial title. Architectural perspective and dimensional type movement establish arrival. | THE / THRESHOLD. One short statement and continuation link. |
| 03 Future | 31–52% | A constrained vertical reel moves through UNKNOWN, DISTANT, AUTOMATED, UNWRITTEN, CLOSER, HUMAN. The reading line stays sharp; adjacent words are cropped. Final 22% of this cue holds HUMAN in vermilion. | THE FUTURE IS [WORD]. |
| 04 Duality | 52–64% | Ivory organic form and cold engineered metal open a passage. Camera proceeds between their opposing silhouettes. | DIFFERENT BY NATURE. Then CONNECTED BY CREATION. |
| 05 Measure | 52–60% | Directly beneath Future, a restrained field of ivory rules holds a vermilion counter. Four readings—PULSE, DRIFT, VECTOR, ORBIT—fade and retype as scroll advances; each number changes through a small set of deliberate intermediate values before settling. | A quiet signal becomes a field. 01 / 04 through 04 / 04. |
| 06 Duality | 60–70% | Ivory organic form and cold engineered metal open a passage. Camera proceeds between their opposing silhouettes. | DIFFERENT BY NATURE. Then CONNECTED BY CREATION. |
| 07 Connection | 70–81% | The supplied 2.04-second human/robot film fills one pinned chapter with its original background. The gesture advances over about 5.3 screens of scroll, reverses when scrolling upward, and holds when scrolling stops. The source file is preserved byte for byte. | A moment before everything. |
| 08 Genesis | 81–91% | The light resolves into one rotating architectural ribbon. Camera follows its curvature as it becomes a monumental loop. | CREATION HAS / NO FINAL / FORM. |
| 09 Resolution | 91–100% | Movement settles. Opening architecture returns in an open state, completing the visual rhyme. | THE NEXT / WORLD / IS YOURS. Minimal final action. |

Within a cue, use clamped, eased subranges for motion and deliberate holds. There is no timer-driven word selection or irreversible door event. Ambient movement is subordinate to the deterministic camera path and is disabled in reduced-motion mode.

## Technical architecture

- Next.js App Router and TypeScript provide the page, metadata, and typed content model.
- Semantic React HTML sits above one full-viewport Three.js canvas. The WebGL bundle is loaded only on the client; readable stage content exists before it initializes.
- A native-scroll track and sticky stage provide the cinematic viewport. One ScrollTrigger supplies measured progress; one GSAP ticker coordinates HTML, the camera, and the renderer. No competing smooth-scroll controller.
- `src/config/experience.ts` owns words, titles, descriptions, colors, CTAs, partners, section switches, scene weights and asset paths. The partner list is empty by default.
- `src/experience/timeline.ts` owns cue ranges, weighted track height, range conversion, visibility normalization, and word position. The world receives the active scene and local progress, so disabled scenes do not create dead ranges.
- `ExperienceWorld` owns scene groups, camera, lights, geometry, environment, renderer, resizing, quality, context recovery, and disposal. Rendering stays outside React's update cycle.
- The duality passage and creation film share a staged parallax handoff: the duality scene lifts to reveal the paused opening frame of the creation video, which then scroll-scrubs to its final frame, holds briefly, and lifts to reveal the fixed genesis scene. Both lifts use the same long, eased scroll interval.
- The measure chapter sits between the connection film and genesis. Its four deterministic readings are derived from normalized local scroll progress, so rolling numbers, label changes, and 01 / 04 through 04 / 04 remain reversible and do not depend on timers.
- Creation media uses the original background-preserving `/assets/humanxmachine.b1258adc36a0.mp4`, displayed full-screen with `object-fit: cover`. Its original dark backdrop stays in the video; no cutout or upscaled derivative is used. The content-hashed URL is immutable-cacheable.
- `scrollMedia.ts` defines the reversible progress mapping; `videoScrub.ts` serializes precise seeks and coalesces pending targets rather than interrupting the decoder on every animation frame. The central director supplies updates. Decoded-frame callbacks are used where available, with a seek-event fallback. Reduced motion and media errors retain a lossless still of the original final frame. The GLB route remains an optional future integration.
- DOM overlays update imperatively with progress; React state changes are limited to meaningful interaction and preference state.

## Lighting and rendering

Use a neutral softbox environment with PMREM reflections, broad key light, narrow edge reflections, and controlled warm light behind the seam. Materials carry the contrast: rough dark titanium, quieter brushed metal, and ivory stone. ACES/filmic tone mapping protects the luminous opening. Grounding, roughness, silhouette, and perspective take priority over postprocessing. There is no heavy bloom chain or particle system.

Desktop framing has room for a large portal silhouette and asymmetrical type. Narrow viewports use a taller composition and independent framing for the WebGL camera. The supplied film intentionally uses the same original landscape source at every size: full-screen cover framing crops the sides on portrait screens, preserving the file and its background. Pixel ratio is capped and may fall with sustained frame cost; heavy media loads only near its cue. Background tabs should not consume a normal render budget.

## Implementation checklist

- [x] Phase A: App Router shell, local font, configuration, native scroll track, persistent canvas.
- [x] Phase B: Invitation, mechanically hinged portal, camera crossing, room-backed hero composition.
- [x] Phase C: Progress-driven vertical reel, locked final word, duality passage.
- [x] Phase D: Supplied original hand film, full-screen chapter, reversible scroll-controlled decoding, source-matched poster and reduced-motion fallback. Cross-browser film verification is recorded separately as it is completed.
- [x] Phase E: Genesis loop and composed final invitation with visual continuity.
- [x] Phase F: Responsive framing, loading and failure states, reduced motion, keyboard controls, disposal, quality adaptation.

## Visual and technical verification checklist

- [x] Type checking, lint, and production build complete without errors.
- [x] Run the actual page and inspect all eight cue keyframes, not only the opening.
- [x] Inspect door at closed, half-open, and crossed states; hero appears through its real gap.
- [x] Scroll in both directions through portal, reel words, locked HUMAN hold, and later transitions; unit tests cover every configured word.
- [x] Direct chapter navigation and browser anchor loading land on a readable composition.
- [x] Resize desktop → tablet → portrait and confirm no horizontal overflow, cropped action, or inaccessible text at tested sizes.
- [x] Reduced-motion preference removes drift and large movement while preserving the full narrative.
- [x] Keyboard tab order reaches visible controls only; chapter actions are operable without pointer.
- [x] WebGL unavailable/context loss preserves a readable experience and a recovery path.
- [x] Read console errors and network failures. Measure actual local animation-frame intervals.
- [x] Record browser/device limitations and asset work remaining in the final verification report.

This direction was established before implementation. The checklist above records implementation status; actual checks, measurements and remaining manual work are recorded in [VALIDATION.md](VALIDATION.md).
