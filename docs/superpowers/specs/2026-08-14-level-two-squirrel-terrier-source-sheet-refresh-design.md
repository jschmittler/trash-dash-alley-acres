# Level Two Squirrel and Terrier Source-Sheet Refresh Design

## Goal

Replace the generated Level 2 squirrel and terrier animation artwork with the supplied updated source sheets while retaining the existing gameplay state machines, timing, collision, encounter layouts, and runtime presentation sizes.

## Inputs

- Squirrel source: `/Users/jamesschmittler/Documents/Portfolio/trash-dash-v2/docs/design/trash-dash/library/characters/enemies/level-02/sprites/animation-source/squirrel-transparent.png` (1536×1024 RGBA).
- Terrier source: `/Users/jamesschmittler/Documents/Portfolio/trash-dash-v2/docs/design/trash-dash/library/characters/enemies/level-02/sprites/animation-source/dog-transparent.png` (1536×1024 RGBA).
- Both sheets use a bright-green backdrop that must be chroma-keyed to transparent. Preserve intentionally authored character pixels, outlines, dust, acorn, projectile, spit, debris, and impact effects.

## Approved Approach

Extract the updated sheets into intentionally selected source poses, normalize those poses into the existing 192×192 Level 2 enemy atlas cells, and rebuild `public/assets/generated/level2-enemy-motion.png`. The extraction/build pipeline—not renderer-side scaling or gameplay-state substitutions—owns background removal, alpha cleanup, uniform scale, and feet registration.

## State Mapping

Keep existing state contracts and map each one to a compatible authored pose from the new sheet.

| Enemy | Runtime state family | Required updated-sheet presentation |
| --- | --- | --- |
| Squirrel | locomotion | Four coherent grounded idle/walk poses with stable feet and body scale. |
| Squirrel | telegraph | Four readable pre-throw poses that clearly prepare the acorn action. |
| Squirrel | throw anticipation / release / follow-through / recover | Ordered four-frame throw: ready acorn, release, follow-through, recovery. The projectile release frame retains a detached acorn component. |
| Squirrel | hit / defeat | Two distinct hit reactions followed by two defeated/stunned poses; no locomotion reuse. |
| Terrier | locomotion / charge | Four coherent quadruped movement frames, with the charge row visibly more committed than locomotion. |
| Terrier | sleep / sit / wake | Resting pose, separate settle/sit pose, then two ordered wake/tell frames. |
| Terrier | impact / hit / recover | Collision impact, damage reaction, and recovery each use dedicated updated-sheet poses; recovery may repeat only its own compatible recovery or locomotion return poses, never impact cells. |
| Terrier | defeat | Two distinct defeated/stunned poses. |

## Rendering and Animation Constraints

- Keep all emitted atlas cells on transparent 192×192 canvases with safe margins and the current shared ground baseline.
- Use nearest-neighbor resizing and one uniform scale per character family. Do not stretch width and height independently or add state-specific draw-size multipliers.
- Preserve the current runtime draw geometry: squirrel 114×114 and terrier 123×123, both ground anchored.
- Preserve source/destination frame ownership, state frame counts, FPS, loops, state selection, attack-event timing, squirrel acorn attachment, enemy physics size, collision, hit logic, and encounter placement.
- Do not modify skunk, moth, Brutus, player, terrain, camera, or source sheets not named above.

## Verification

- Add deterministic source/atlas checks for green-key removal, transparent margins, complete visible silhouettes, safe 192 px cells, fixed aspect ratio, baseline registration, and no neighboring-cell bleed.
- Retain and update the squirrel throw test so the release frame contains a detached acorn and its body envelope matches locomotion without a size pop.
- Retain and update terrier state-ownership coverage so sleep/wake/charge/impact/hit/recover/defeat do not share incompatible source cells.
- Run the updated non-UI asset and behavior tests plus a production build before requesting manual verification.
- Per the user’s Trash Dash preference, request manual testing before any automated browser/UI check. After the user reports manual results, inspect Level 2 squirrel and terrier encounter routes in the running game and record the visual evidence in `docs/visual-audit.md`.

## Out of Scope

No gameplay redesign, new enemy abilities, collision-size changes, timing changes, runtime scale changes, renderer changes, or changes to the other Level 2 enemy art.
