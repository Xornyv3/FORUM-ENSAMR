# The Threshold

A functioning cinematic website template: eight chapters, one persistent Three.js world, semantic editorial typography, and a deterministic native-scroll timeline. Built with Next.js App Router, TypeScript, Three.js, React, and GSAP ScrollTrigger. No external services, API keys, or audio are required.

## Run

Use Node.js 22. Install and start the development server:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Scroll normally or open **Index** to choose a chapter. The index also contains a reduced-motion switch; the operating-system preference is respected automatically. Escape closes the index. Keyboard focus follows chapter navigation.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

Run the production build after stopping the dev server. No deployment has been published.

## Edit the template

| File | Purpose |
| --- | --- |
| `src/config/experience.ts` | Project name, headlines, descriptions, partners, words, winning word, colors, CTAs, section visibility, asset paths and manifest |
| `src/experience/timeline.ts` | Measured scroll ranges, word dwell/transition timing, final-word hold, section normalization |
| `src/experience/camera.ts` | Camera position, target, field of view, canonical spatial ranges |
| `src/experience/director.ts` | One ScrollTrigger, one GSAP clock, DOM choreography, responsive restoration, preferences and lifecycle |
| `src/experience/ScrollPlayhead.ts` | Continuous scroll response; critically damped motion keeps wheel steps flowing between animation frames |
| `src/experience/ExperienceWorld.ts` | Persistent renderer, lighting, procedural surfaces, hinged doors, duality forms, ribbon and finale |
| `src/components/Experience.tsx` | Semantic chapters, chapter index, controls, loading/fallback states |
| `src/components/CreationMedia.tsx` | Responsive hand poster and scroll-scrubbed film with decoded-frame fallback |
| `src/app/globals.css` | Design tokens, typography, editorial layout, responsive and reduced-motion styles |
| `public/assets/` | Optimized public media; manifest lives in the content configuration |

Replace `hello@example.com` before a brand launch. Partners are empty intentionally; adding a name, approved logo path and optional link makes the editable marks appear. The app is deliberately `noindex` until a final brand and metadata are supplied. Instrument Sans is self-hosted; its OFL license is stored beside the font.

Section switches remove the corresponding cue and renormalize the remaining scroll ranges. Disabled destinations resolve to a surviving section. An all-disabled configuration retains the invitation as a safe default. The winning word is appended once to the configured reel and held for its final 22%; reverse scroll traverses the same states.

## The eight scenes

1. **Invitation:** a dark monumental doorway, ivory seam and restrained camera drift.
2. **Crossing:** two real beveled metal leaves hinge around their outer edges as the camera advances.
3. **Arrival:** masked dimensional typography appears through the opening into an architectural colonnade.
4. **Future:** a vertical word reel with deliberate reading holds resolves to vermilion **HUMAN**.
5. **Duality:** an ivory carved form and fluted titanium surface separate to open a passage.
6. **Connection:** a full-screen human/robot hand film advances frame by frame with scroll and reverses with upward scroll.
7. **Genesis:** a single brushed-metal ribbon emerges, opens into a monumental loop, and guides the camera onward.
8. **Resolution:** the opening architecture returns, now open, with an editorial final invitation.

The viewport is pinned using CSS sticky positioning; its wrapper is never transformed. ScrollTrigger measures the native track and supplies the target for a continuous animation playhead. Door hinges, camera, light and text all use the same displayed progress, with a short damped response between wheel events. The camera follows a shape-preserving continuous curve through its authored poses instead of stopping at each keyframe. Chapter links, initial restoration and reduced motion land immediately. Full motion is the default; the Index menu provides a reduced-motion toggle, and `?motion=full` or `?motion=reduced` can set a shareable choice. The director owns the animation clock, and Three.js is dynamically imported into a separate client chunk. DOM changes happen only when progress or preferences change, rather than triggering React updates on every frame. Resolution is capped and drops after sustained slow frames. Hidden tabs stop rendering. The reduced-motion edition uses static chapter tableaux, a stepping word reel, and no video or pointer drift. Context loss and WebGL failure retain readable content and a still-edition backdrop, with retry and restoration paths.

## Assets and future production

The hand scene uses the supplied two-second 1080p film. Its 24 fps frames are scrubbed from the creation cue's scroll progress; it never autoplay loops. The black film field fills the scene, while the full wide composition stays uncropped on narrow screens. Reduced motion and video failures retain the decoded poster.

An approved portrait-specific film and longer final cinematic treatment remain production options. For exact reversible motion with a different asset, see the bounded image-sequence or animated-GLB guidance.

Read [the exact cinematic asset specification](docs/ASSET-PRODUCTION.md) before replacing media. It includes framing, gesture, anatomical requirements, codec/GOP guidance, mobile budgets, GLB naming/rigging, and fallback behavior. The current smaller mobile poster is a delivery variant of the wide study, not a separately produced portrait master.

## Direction and verification

- [Creative direction, storyboard, architecture and motion plan](docs/CREATIVE-DIRECTION.md)
- [Cinematic assets and replacement guide](docs/ASSET-PRODUCTION.md)
- [Actual verification results and remaining manual checks](docs/VALIDATION.md)

No reference PDF was present in the supplied workspace, so the implementation follows the written brief and does not claim to incorporate an unseen document. Browser captures are generated locally under the ignored `artifacts/` directory.
