# Task 4 — Enemy and Boss Presentation Re-review (Fix Round 1)

## Verdict: FAIL

Reviewed the exact committed repair range `e5ff483..4bc8bfa` from a clean
archive of `4bc8bfa`; the shared worktree's unrelated dirty changes were not
used as evidence. The original C1, I1, and I2 findings are repaired, but I3
is only partially repaired and a modified source-scan test weakens a useful
regression. Browser encounter/boss sequences remain `CANNOT VERIFY` because
no input-capable browser backend was available.

## Critical

None.

## Important

### I3 — FAIL: Trash Heap Tyrant placement footprint does not equal the 166x166 runtime destination

`app/visual-inventory.mjs:231` now calls
`grounded(166, 166, 96, 96, 64, 16)`. The visual bounds are correctly
166x166 and every runtime destination is 166x166, but `grounded` expands its
placement footprint by `extraX` and `extraTop` (`:110-120`). The committed
Tyrant record consequently evaluates to:

```
visualBounds:       { x: -83,  y: -166, w: 166, h: 166 }
placementFootprint: { x: -147, y: -182, w: 294, h: 182 }
collisionBounds:    { x: -48,  y: -96,  w: 96,  h: 96 }
runtime destinations: 166x166 only
```

This preserves the collision box and the separate six-pixel minimum
clearance, but the footprint is not the actual 166x166 draw footprint as
required. It also makes the Round 1 report's statement that the Tyrant
"visual bounds and placement footprint are 166x166" false. Store any desired
arena exclusion as explicit clearance/composition padding, or otherwise make
the footprint assertion/documentation accurately reflect its intentional
envelope.

### I4 — FAIL: the rendered-runtime source scan was weakened without need

`tests/rendered-html.test.mjs:83` replaces the prior broad
`assert.doesNotMatch(game, /LEVEL_ONE/)` with
`assert.doesNotMatch(game, /(?:const|let|var) LEVEL_ONE/)`. The new assertion
permits direct `LEVEL_ONE` imports and all direct runtime uses, so it no
longer protects the campaign-runtime migration that the original scan
covered. The committed runtime has only the benign
`LEVEL_ONE_ENEMY_ANIMATIONS` import at `app/trash-dash-game.tsx:28`; that
identifier is not a direct `LEVEL_ONE` reference. Retain the intent with an
exact-token scan such as `/\\bLEVEL_ONE\\b/`, rather than allowing all uses.

## Original findings rechecked

- **C1 — PASS.** `4bc8bfa` includes the Level 2 manifest, state map,
  squirrel lifecycle, runtime projectile attachment, Level 1 selector,
  inventory, and tests in the committed range. A clean archive has no
  dependency on the shared worktree changes and completed the focused matrix
  and full suite.
- **I1 — PASS.** The state map is explicit and throws for unknown kind/state.
  The exact reachable mappings include squirrel anticipation/release/
  follow-through/recover as row 2 frames 0/1/2/3, skunk recover as row 12
  frame 3, and moth climb as the row-15 four-frame looping flight motion.
  No `recover`, `climb`, or unknown-state fallback reaches hit/locomotion
  implicitly.
- **I2 — PASS.** `levelOneEnemyAnimationFrame` is a pure declared-FPS
  selector, and Level 1 rendering calls it with `enemy.stateElapsed` and a
  deterministic offset. `stateElapsed` advances by `dt`; movement-speed
  `phase` is no longer the Level 1 playback source. The Tyrant still resets
  its local `phase` in `setBossState`, so its one-shot state frames restart
  on entry.

## State/lifecycle checks

- Squirrel: `updateSquirrel` transitions idle -> anticipation -> release ->
  follow-through -> recover -> idle. Only the anticipation-to-release
  transition emits `spawnAcorn`; the following release ticks clear it. The
  runtime uses the mirrored paw attachment and shared projectile metrics.
- Skunk recover, moth climb, all declared Level 2 states, and unknown
  `squirrel/throw`, `skunk/unknown`, and `unknown/idle` were source-scanned
  against the committed manifest. The unknown combinations throw `RangeError`.
- Level 2 playback uses `stateElapsed`, resets it when behavior state changes,
  and hit playback clears before the defeated behavior is displayed. Brutus
  continues to use its local state elapsed timer and atlas-derived visible-top
  region before generic collision rejection.

## Scope/regression review

The committed range changes only Task 4-related report/audit, animation
manifest/dispatch, inventory, and regression-test files. No unrelated dirty
runtime, Level 2 prop, placement, or asset changes are staged in the reviewed
range. The source-scan relaxation above is in scope but is a regression in
test strength.

## Verification

- `git diff --check e5ff483..4bc8bfa`: passed.
- Clean archive focused command:

  ```text
  node --test tests/level-two-enemies.test.mjs tests/boss-animation.test.mjs tests/boss-atlas.test.mjs tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs tests/gameplay-animation-state.test.mjs tests/hit-sprite-frames.test.mjs
  ```

  Result: **65 passed, 0 failed**.
- Clean archive `npm test` (production build plus suite): **205 passed, 0
  failed**.

Passing tests do not clear I3 or I4 because the current Tyrant assertion only
checks visual bounds, and the weakened source scan cannot reject a newly
introduced direct `LEVEL_ONE` runtime dependency.
