# Task 4 — Enemy and Boss Presentation Independent Review

## Verdict: FAIL

Reviewed the exact implementation range `b90ada3..a3045bf` and the committed
revision `a3045bf` in an isolated archive, rather than accepting the shared
dirty worktree as Task 4 evidence. The Task 4 focused matrix is not green at
that revision, and its new contract test depends on a later uncommitted Level
2 manifest change. The representative screenshots/contact sheets and the
independent Brutus atlas/top-surface tests are useful positive evidence, but
they do not repair the failed self-contained commit or the remaining dispatch
fallbacks.

## Critical

### C1 — `a3045bf` cannot run its own new state-contract test

`tests/boss-animation.test.mjs:91` added
`LEVEL_TWO_ENEMY_ANIMATIONS.squirrel.release.startFrame`, but Task 4 did not
change `app/level-two-enemies.mjs`. At the reviewed commit its squirrel
manifest contains only `locomotion`, `telegraph`, `attack`, `hit`, and
`defeat`; `release` is undefined. The clean focused run fails with:

```
TypeError: Cannot read properties of undefined (reading 'startFrame')
    at tests/boss-animation.test.mjs:91:60
```

The shared worktree now carries uncommitted changes to
`app/level-two-enemies.mjs` that add `anticipation`, `release`,
`followThrough`, and `recover`, which hides this failure. Those changes are
outside `b90ada3..a3045bf`, so Task 4 is not self-contained and the report's
claimed focused/full-suite success cannot be attributed to its commit.

## Important

### I1 — reachable Level 2 recovery/return states still use incompatible fallback rows

In the reviewed `app/level-two-enemies.mjs:327-338`,
`levelTwoEnemyAnimation` maps every generic `recover` state, and moth
`climb`, to `animations.hit`; unknown states silently fall through to
`animations.locomotion`. Thus reachable skunk `recover` and moth `climb`
presentation are relabeled hit poses rather than explicit semantic rows. The
new table test lists those labels but only verifies the selected object has
valid numbers; its `source` is deliberately `null` for every Level 2, Trash
Heap Tyrant, and Brutus row, so it neither rejects this aliasing nor proves
the dispatched source rectangle. This violates the required no-incompatible-
fallback state-to-frame contract.

### I2 — Level 1 dispatch does not use the claimed local state FPS contract

The Level 1 inventory declares `move` at `fps: 7`
(`app/visual-inventory.mjs:191`), but the real renderer chooses
`Math.floor(enemy.phase) % 4` (`app/trash-dash-game.tsx:2594` before the
Task 4 hunk). `enemy.phase` advances from movement speed
(`app/trash-dash-game.tsx:1902`), not that manifest FPS, and is never routed
through a state-local frame selector. The contract test instead calls
`bossAnimationFrame` on inventory data, so it does not exercise the actual
Level 1 dispatch. All shipped Level 1 actors currently only have looping
`move`, which limits the immediate symptom, but it does not meet the requested
actual-runtime table-driven/local-playback guarantee.

### I3 — Trash Heap Tyrant's visual contract is stale after the 166-square change

Task 4 changes the Tyrant's runtime destinations and `renderedSize` to
166×166, but retains `grounded(184, 170, 96, 96, 64, 16)` in
`app/visual-inventory.mjs:247`. Its inventory `visualBounds` therefore remain
184×170 while the actual renderer and every destination record are 166×166.
The static visual-contract suite accepts this because it does not require a
record's visual bounds to match its destination rectangle. This is a stale
world-scale/footprint declaration and must be synchronized before claiming
the uniform destination preserves visual/collision correspondence.

## Minor

None.

## Confirmed positive evidence

- `app/boss-animation.mjs` now uses a uniform 166×166 destination for all
  Trash Heap Tyrant rows. The committed boss atlas and contact sheet show
  complete, inset source cells without rebuild-worthy clipping.
- The committed Level 2 uniform destinations preserve the renderer's
  bottom-anchor calculation for ground actors and center calculation for the
  moth. The static Level 2 atlas test found bounded, alpha-clean cells and
  stable feet/flight centers.
- Brutus remains a uniform 256×192 → 220×165 transform. The clean run passed
  the atlas-derived visible-top test for every active frame and the runtime
  ordering test that resolves the top contact before generic collider
  rejection. The screenshot shows a proportional grounded Brutus, though it
  does not itself visualize the weak-point band.
- I inspected the committed representative screenshots and contact sheets.
  Interaction, Tyrant, and Brutus idle views show no source clipping; they
  cover only representative idle/grounding. Both facings and all action,
  recovery, hit, defeat, and exit sequences remain `CANNOT VERIFY` without
  input-capable browser automation.

## Verification

- `git diff --check b90ada3..a3045bf`: passed.
- Clean archive at `a3045bf` (with the repository's installed dependencies)
  ran the Task 4 focused matrix plus gameplay/hit/visual-contract suites:
  **86 passed, 1 failed**. The sole failure is C1 above; all Brutus atlas,
  top-hit, and state-machine checks passed.
- A run in the shared dirty worktree produced 88/88 passing, but that is not
  accepted as Task 4 validation because its dirty Level 2 manifest supplies
  the missing `squirrel.release` key.

## Required follow-up

1. Make the Level 2 manifest/behavior changes required by the new contract
   part of the Task 4 implementation (or remove/rewrite the assertion to
   match the committed behavior), then rerun the clean focused matrix.
2. Replace semantic fallback aliases with explicit state mappings and assert
   each reachable runtime state against its exact selected source rectangle.
3. Route Level 1 frame selection through its declared animation contract, or
   make the contract accurately own its only loop timing.
4. Update the Tyrant visual bounds/footprint to the actual 166×166 draw size,
   then revalidate placement and collision consumers.
