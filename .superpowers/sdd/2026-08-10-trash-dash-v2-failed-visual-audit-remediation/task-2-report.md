# Task 2 Report: Level 2 Environmental Art

## Status

DONE. The unreadable singleton nut, electrical utility cabinet, lamp/moth alpha
fringe, and bespoke boss utility platforms have been replaced with authored,
deterministically built environmental art. Runtime fixtures, asset contracts,
the complete test suite, lint, and two-build hash proof are green.

## Skills and references used

- Project rendering/asset integrity, sprite art, environment placement,
  overlap prevention, and visual QA skills and their required references.
- Pixel-art skill for source resolution, palette, hard-edge, scale, and native
  inspection constraints.
- Image generation skill for the single missing classic residential trash-can
  source and its required source/output provenance.

These skills drove the hard-alpha source treatment, nearest-neighbor scaling,
canonical decorative-crate reuse, measured attachment/baseline contracts,
contact-sheet inspection, and runtime fixture pass.

## RED-first evidence

Before implementation:

```text
node --test tests/level-two-props.test.mjs tests/visual-asset-integrity.test.mjs
15 passed, 7 failed
```

The seven expected failures covered the absent loose-pile identity, absent
residential-can identity/source, eight lamp alpha components, retained bespoke
boss-platform cells/draw family, and stale visual-inventory ownership.

## Implementation

- Rebuilt the environment's former single projectile-frame decoration as a
  grounded pile of three individually connected and mutually separated authored
  acorns. Projectile animation ownership remains with the squirrel.
- Added a classic side-on galvanized round residential trash can, with a crooked
  circular lid and a small amount of visible paper/warm-colored trash. Its body
  is tapered and ribbed, contains no wheels, and no longer reads as an electrical
  or industrial utility enclosure.
- Added deterministic green-key removal, bounded despill, hard alpha, palette
  reduction, largest-body cleanup, nearest-neighbor resizing, transparent
  margins, and common-baseline placement to the Level 2 atlas builder.
- Removed accidental purple/cyan/magenta lamp source fringe with bounded color
  cleanup and connected-component filtering. The runtime-owned warm radial glow
  remains attached to the measured lamp emitter.
- Removed the two bespoke boss-platform atlas cells and renderer. Both platform
  surfaces now use the canonical Level 1 wooden recycle-crate family at 112x85,
  without stretching, while preserving symmetric, reachable one-way geometry.
- Updated environment identities, runtime branches, render metrics, inventory,
  placement fixtures, and remediation regressions to match the authored assets.

The legacy supplied `level2-props-reference.png` and
`level2-lamp-post-source.png` source masters were deliberately left byte-stable.
The deterministic builder composes/cleans from those masters into generated
outputs, following the project skill's source-preservation rule. The dedicated
new can source is stored separately in the workspace.

## Generated asset provenance

One image-generation call was needed because repository inspection found no
reusable authored classic round residential can. Existing alternatives were a
wheeled recycling bin, utility cabinets, a dumpster, and an open rolling boss
can, none of which met the requested identity.

- Tool: built-in `image_gen` (`image_gen.imagegen`), one generation; no CLI.
- Final project source:
  `concepts/level-two/source/level2-residential-trash-can-source.png`
- Raw source SHA-256:
  `171308e6bfd4a838302467716d152722bd3803a4e7ee31edfa2b6b2ca20f2231`
- Reference inputs:
  `concepts/level-two/source/level2-props-reference.png` and
  `concepts/decorative/source/decorative-props-key.png`

Final prompt:

```text
Use case: stylized-concept
Asset type: single game prop source sprite for Trash Dash
Input images: Image 1 is the approved Level 2 metal-prop style and palette reference; Image 2 is the approved game decorative-prop pixel density and side-on viewpoint reference.
Primary request: Create exactly one classic old-fashioned galvanized round residential trash can, viewed strictly side-on for a 2D side-scrolling game. The can has a tapered cylindrical/ribbed metal body, two small side handles, and a classic circular lid sitting slightly crooked/ajar on top. Show just a little readable household trash peeking from under the lid: one crumpled off-white paper and one small warm orange/brown scrap. It must unmistakably read as a residential garbage can.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for removal, uniform edge to edge.
Style/medium: polished late-16-bit pixel art, crisp hard-edged pixel clusters, dark navy-blue-gray contour, limited 3-to-4-value shading, no antialiasing, no blur, no smooth gradients.
Composition/framing: one isolated complete prop centered with generous padding, complete silhouette, grounded bottom edge, orthographic-feeling side view, no cast shadow.
Lighting/mood: subdued moonlit Level 2 palette with restrained warm highlight from upper left.
Color palette: galvanized blue-gray/silver metal, dark navy contour, off-white and warm brown/orange trash accents; do not use #00ff00 in the subject.
Constraints: background is one uniform #00ff00 color with no shadows, gradients, texture, reflections, floor plane, or lighting variation; lid, round tapered body, and visible trash must all remain readable after nearest-neighbor downscaling to about 80x104 pixels.
Avoid: wheels, wheeled bin, recycling bin, dumpster, utility cabinet, transformer box, electrical panel, industrial enclosure, square rectangular body, front-on perspective, three-quarter perspective, scenery, grass, text, label, recycling logo, watermark, soft edges, fringe pixels, glow, reflection.
```

The generated chroma-key image is a source input only. The deterministic builder
performs the final alpha, palette, component, resize, and baseline treatment.

## Native and gameplay-scale inspection

- Loose-acorn atlas bounds: x19, y78, 89x35; three separate readable bodies;
  common bottom baseline y112.
- Residential-can atlas bounds: x26, y9, 77x104; round lid overhang and tapered
  body remain readable at the 112x112 gameplay destination.
- Lamp output bounds: x43, y7, 106x248 in a 192x256 texture; exactly one
  meaningful alpha component and hard 0/255 alpha.
- Canonical crate source bounds: x16, y63, 224x169 in its 256px source cell;
  runtime destinations are uniformly 112x85.
- Squirrel fixture: three distinct grounded loose acorns, no blob.
- Terrier fixture: classic round can is grounded and unobscured.
- Moth fixture: no colored fringe; restrained warm halo remains.
- Brutus fixture: matching canonical wooden crates align with both collision
  tops and leave the center lane open.
- All four fresh browser fixtures had empty warning/error logs.

## Deterministic build proof

Two consecutive `npm run build:level2-props` runs produced identical hashes:

```text
aa0c68035e4f354c21e674e299d91eaae5af3564091e6b50b552f04e86fda86b  public/assets/generated/level2-props.png
632d3734edc2b83ee77fcb4eea7dfa237bdb7f999c7475c7ce4e9eafdd638cd3  public/assets/generated/level2-lamp-post.png
1ce0e1619bbd73342c7539abc7a4cb7377316b8299f94961751a61edeec280af  concepts/level-two/level2-props-contact-sheet.png
7c47a7482025cafa76a50e4cefa3ee73ac8bf13dedcfdc73c11b630c37b7a6b8  concepts/level-two/level2-lamp-post-contact-sheet.png
```

## Final verification

```text
node --test tests/level-two-props.test.mjs tests/visual-asset-integrity.test.mjs tests/level-two-enemies.test.mjs tests/level-two-fixture.test.mjs tests/world-placement.test.mjs tests/visual-inventory.test.mjs tests/v2-visual-remediation.test.mjs
79 passed, 0 failed

npm test (exact staged snapshot reconstructed from HEAD + cached binary patch)
292 passed, 0 failed; production build passed

npm run lint
0 errors, 1 pre-existing warning at app/trash-dash-game.tsx:2805 in the exact
staged snapshot (Next no-img-element)
```

## Concerns

None blocking. Unrelated dirty and untracked work was preserved. Existing
unrelated hunks in `app/trash-dash-game.tsx` and the unrelated modified
`tests/rendered-html.test.mjs` were excluded from Task 2 staging.
A 293rd passing test visible in the shared working tree belongs to that preserved
unrelated test edit and is intentionally not claimed by this commit.

## Fix Round 1 — arena-entry clearance and executable build proof

Review correctly found that the widened canonical left crate occupied
`5724..5836`, while the normal arena trigger at `5750` and direct-fixture player
at `5770` both intersected it. Review also correctly found that the documented
`npm run build:level2-props` alias did not exist.

RED-first reproduction:

```text
node --test tests/boss-arena.test.mjs tests/level-two-props.test.mjs
20 passed, 2 failed

normal trigger 5750..5788 overlaps brutus-platform-left
build:level2-props expected node concepts/level-two/build-prop-atlas.mjs,
but package.json returned undefined
```

The accepted crate artwork and coordinates remain unchanged. The Level 2 arena
lock was expanded equally to `5650..6600`, retaining its exact `6125` center and
therefore retaining crate symmetry. The normal trigger and direct Brutus fixture
now start at `5680`; a maximum-width 38px player occupies `5680..5718`, leaving
six transparent world pixels before the left crate. The normal runway remains
380px, the crate-to-crate center lane is unchanged, both platforms retain their
112x85 reachable geometry, and Brutus retains his explicit spawn/recovery and
hydrant charge positions. The lock samples are now `5674`, `5680`, and `6538`.

The entry test checks both the normal trigger and direct fixture, and proves
mutation sensitivity by introducing a one-pixel crate overlap for each sample.
The arena validator now independently rejects trigger/platform overlap.

`package.json` now wires the documented command exactly:

```text
npm run build:level2-props
> node concepts/level-two/build-prop-atlas.mjs
```

Two fresh executions reproduced the same four Task 2 hashes already recorded
above. The Brutus arena audit also now consumes the authored `boss.spawnX`
instead of deriving a different start from the arena boundary; its regenerated
trace reaches completion in 14.2s with three 340px charges and the expanded lock
camera boundary at x6610.

Runtime visual inspection is **CANNOT VERIFY** for this fix round. The local dev
server started successfully at `http://localhost:3001/`, but browser discovery
returned an empty browser list (`[]`) after the previously bound browser reported
itself unavailable. The server was stopped, and no screenshot or visual PASS is
claimed. The preceding Task 2 runtime inspection remains historical evidence,
not evidence for these changed entry coordinates.

Fix-round verification:

```text
node --test tests/boss-arena.test.mjs tests/brutus-boss.test.mjs tests/level-two-props.test.mjs tests/visual-asset-integrity.test.mjs tests/level-two-enemies.test.mjs tests/level-two-fixture.test.mjs tests/level-two-routes.test.mjs tests/world-placement.test.mjs tests/visual-inventory.test.mjs tests/v2-visual-remediation.test.mjs
105 passed, 0 failed

node concepts/level-two/audit-brutus-arena.mjs
Brutus reaches complete at 14.2s; runway ordinary count 0.

npm test (exact staged snapshot reconstructed from HEAD + cached binary patch)
294 passed, 0 failed; production build passed

npm run lint (exact staged snapshot)
0 errors, 1 pre-existing no-img-element warning at app/trash-dash-game.tsx:2805

git diff --cached --check
clean
```

The shared working tree also passed 295/295, but its extra passing rendered-HTML
test remains unrelated and unstaged, so this fix round claims only the exact
294-test staged result.

## Fix Round 2 — worst-step normal-entry clearance

Re-review correctly found that Round 1 tested only the nominal trigger point.
Ordinary gameplay integrates horizontal movement before checking arena
activation, so the runtime's maximum 330px/s run speed and 0.033s time step can
advance the player 10.89px beyond that nominal point.

RED-first reproduction:

```text
node --test tests/boss-arena.test.mjs
8 passed, 1 failed

worst-step normal entry 5690.89..5728.89 overlaps brutus-platform-left
```

The speed, time-step, maximum player width, and desired entry gap now live in
one frozen `BOSS_ENTRY_MOTION_LIMITS` contract: 330px/s, 0.033s, 38px, and 6px.
The runtime consumes the same speed and step bounds, while
`latestSafeBossArenaTriggerX` authors the Level 2 trigger from the unchanged left
crate coordinate. The resulting trigger is x5669. At the worst allowed movement
step, the player advances to x5679.89 and ends at x5717.89, leaving 6.11px before
the crate at x5724.

The final regression follows the ordinary movement-to-activation sequence with
the shared helper, asserts the authored minimum gap, and proves that moving the
trigger one pixel right fails. The arena validator uses the same worst-step
contract, and a separate source-wiring assertion prevents runtime speed or dt
from silently drifting back to literals.

The direct fixture remains x5680, the crate pair and lock stay unchanged, the
open center lane is unchanged, and the normal runway remains a valid 369px
approach against the 360px minimum. The deterministic prop command and hashes
are unchanged. The regenerated arena trace records the 6.11px worst-step gap
and still completes all three Brutus phases in 14.2s.

Fix-round verification:

```text
node --test tests/boss-arena.test.mjs tests/brutus-boss.test.mjs tests/level-two-props.test.mjs tests/visual-asset-integrity.test.mjs tests/level-two-enemies.test.mjs tests/level-two-fixture.test.mjs tests/level-two-routes.test.mjs tests/world-placement.test.mjs tests/visual-inventory.test.mjs tests/v2-visual-remediation.test.mjs
106 passed, 0 failed

npm test (exact staged snapshot reconstructed from HEAD + cached binary patch)
295 passed, 0 failed; production build passed

npm run lint (exact staged snapshot)
0 errors, 1 pre-existing no-img-element warning at app/trash-dash-game.tsx:2806

node concepts/level-two/audit-brutus-arena.mjs
Brutus reaches complete at 14.2s; runway ordinary count 0.

git diff --cached --check
clean
```

The shared working tree also passed 296/296, but its extra unrelated
rendered-HTML test remains unstaged. Runtime browser inspection remains CANNOT
VERIFY from Round 1; this round makes no new screenshot claim.
