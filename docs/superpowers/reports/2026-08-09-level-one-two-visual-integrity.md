# Level 1 + Level 2 visual integrity report

Date: 2026-08-09

## 1. Root causes found

- Placement checks used origins or collision rectangles in places where the
  complete visible frame and animated envelope were required.
- Scenery had no category-aware composition padding or rolling-viewport density
  budget, so individually legal props could still form poor clusters.
- The Level 2 sprinkler combined weak source material with a rigid water crop;
  the effect did not own a complete start/spray/stop sequence or a stable named
  emitter contract.
- The moth encounter referenced a floating porch fixture rather than a complete
  grounded structure.
- Several Level 2 prop branches still relied on primitive fallback rendering.
- Level 2 rendered the post-victory dumpster during the active Brutus fight,
  producing a large semi-transparent duplicate composition over the boss arena.
- Moving the hydrant for arena breathing room shortened Brutus charge recovery
  timings until an explicit authored boss spawn/recovery position was added.

## 2. Assets redrawn or rebuilt

- Rebuilt `public/assets/generated/level2-props.png` as a deterministic 4×7,
  128-pixel-cell atlas.
- Rebuilt the sprinkler as one grounded body plus separate water-only start,
  six-frame active spray, and stop cells.
- Created `public/assets/generated/level2-lamp-post.png`, a complete grounded
  192×256 lamp post with a supported housing, base, and explicit glow origin.
- Regenerated Level 2 prop and lamp contact sheets for static inspection.

## 3. Animation systems changed

- Sprinkler state selection now exposes idle, start, spray, and stop states.
- Water effect geometry is derived from the nozzle emitter and flips around the
  same attachment contract without duplicating the body.
- Moth orbit/dive return targets the actual lamp fixture emitter.
- Terrier impact/recovery uses explicit local playback and a stable grounded
  settle; the browser sequence remained baseline-stable without frame splitting.
- Brutus keeps explicit authored state rows, visible-top stomp geometry, local
  state timing, and a metadata-authored spawn/recovery position.

## 4. Placement and composition systems changed

- Added complete visual contracts with physical bounds, collision bounds,
  largest-frame placement footprints, ground anchors, layers, allowed/forbidden
  zones, scale policies, effect origins, and viewport behavior.
- Added small/medium/large/hero/interactive/boss composition gaps.
- Added rolling-viewport density limits and repeated hero-prop rejection.
- Added deterministic platform exclusion using full visible bounds and ranked
  legal candidates.
- Reduced Level 1 campsite and boss-runway clutter by removing redundant hero
  scenery while preserving gameplay platforms and landmarks.
- Repositioned Level 2 scenery, the grounded lamp encounter, boss platforms,
  hydrant, and sprinklers around named surfaces and clear gameplay lanes.

## 5. Level 1 issues fixed

- Re-audited start, highway, park/runway, and boss compositions.
- Preserved grounded crates, enemies, signs, platforms, pickups, backgrounds,
  and boss sprites with no visible platform-face intersections.
- Separated the two campsite crate platforms and constrained the right pigeon
  to the updated support's complete visible motion envelope.
- Removed redundant campsite tree and runway bin clusters to restore negative
  space around the crate route and checkpoint.
- Confirmed Level 1 boss arena remains clear and readable.

## 6. Level 2 issues fixed

- Replaced the floating lamp with a grounded post; moth motion now belongs to
  the lamp fixture rather than an arbitrary world coordinate.
- Replaced placeholder/fallback prop rendering with atlas-backed assets.
- Rebuilt the sprinkler so emitted water remains attached to one grounded body
  and no rigid blue wedge or duplicate sprinkler appears.
- Revalidated all grounded enemies, patrol supports, flight bands, pickups,
  scenery, and boss props.
- Re-audited backyard, obstacle course, main street/victory, lamp, interaction,
  terrier, and boss routes.

## 7. Boss arena changes

- Added/retained symmetric normal-jump utility platforms at the arena sides.
- Kept hydrants and sprinklers on the cul-de-sac floor with clear dodge lanes.
- Prevented the victory dumpster from rendering until Brutus is defeated.
- Added explicit Brutus spawn/recovery metadata so the cleaner prop spacing does
  not shorten phase charge timing.
- Confirmed one coherent Brutus silhouette, aligned stomp surface, readable
  attack space, and no overlapping dumpster/crate layers in the active arena.

## 8. Skills and rules updated

Updated `skills/game-asset-library/game-art-contract.md`, Level Creator, Boss
Creator, VFX Creator, Game Asset Director, `.summer/pixel-anchor.md`, and the
packaged `skills/game-asset-library.zip` with durable rules for:

- explicit ground anchors and effect origins;
- physical footprints plus composition padding;
- category-aware density and negative space;
- native/preferred/min/max scale policy;
- source-frame versus runtime-frame validation;
- one emitting body plus effect-only frames;
- automated checks plus rendered screenshot evidence;
- the principle that spatial validity alone is insufficient.

## 9. Regression tests added or expanded

- Full visual inventory and asset-path/dimension audit.
- Atlas frame bounds, hard alpha, source-runtime contract, and duplicate-render
  protection.
- Ground anchors, effect attachment, animation completeness, and reachability.
- Platform exclusion, full visible bounds, pickup hover envelopes, and grounded
  enemy support.
- Composition padding, rolling viewport density, repeated hero spacing, and
  current Level 1/2 authored placement validation.
- Boss platform alignment, arena spacing, Brutus stomp alignment, charge timing,
  and victory-dumpster gating.
- Project skill-content regression tests.

## 10. Visual QA results

PASS for the rendered desktop browser walkthrough at the current in-app browser
size. The game was actually run on localhost and inspected at representative
Level 1 and Level 2 checkpoints, both boss arenas, sprinkler frames, lamp/moth,
enemy interaction, terrier recovery, pause, and resume.

- Sprinkler: grounded body, attached animated stream, no wedge, no duplicate.
- Lamp: full post visibly contacts the terrain; glow and moth align to fixture.
- Level 1: start/middle/end/boss inspected; no malformed or floating large prop.
- Level 2: start/middle/end/boss inspected; no placeholder primitives or active
  arena dumpster overlay.
- Pause/resume: controls functioned and state returned to gameplay.

Responsive/mobile behavior is covered by automated viewport, safe-area, touch,
orientation, and fullscreen tests. The in-app browser API did not expose a
viewport-resize control in this session, so a second rendered mobile-device-size
capture remains a recommended device pass rather than a claimed visual pass.

## 11. Verification

- `npm test`: 235/235 passing.
- `npm run lint`: 0 errors, 1 existing Next.js `<img>` performance warning.
- `npm run build:pages`: passing.
- `npm run test:pages`: 1/1 passing.
- `git diff --check`: passing.

## 12. Remaining issues

- Run one real phone/mobile-browser visual pass before the next public release;
  automated mobile coverage is green, but this session could not resize the
  in-app browser viewport.
- The existing `<img>` lint warning is non-blocking and unrelated to visual
  correctness.

## Screenshot evidence

- Before: `docs/superpowers/reports/2026-08-09-level1-level2-integrity/before/`
- After: `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/`

Key after images are `01-sprinkler-frame-1.png` through
`01-sprinkler-frame-7.png`, `02-lamp-moth.png`,
`03-brutus-arena-final.png`, `l1-start-clean.png`, `l1-middle.png`,
`l1-end-clean.png`, `l1-boss.png`, `l2-start.png`, `l2-middle.png`, and
`l2-end.png`.
