# Task 2 Fix Round 3 re-review — frame-complete renderer contracts

**Verdict: PASS**

Reviewed only the remaining Task 2 C1/I1 coverage and regressions in
`aa638a2..b7d40b0`. Evidence was taken from an archived clean checkout of
`b7d40b0`, not the shared dirty worktree.

## Critical

### C1 — PASS: every committed animated bin-lid source and sprinkler spray frame is mapped

- `bin-lid-source` records the four committed `acorn` cells from
  `LEVEL_TWO_PROP_FRAMES.acorn` and four independently frozen 44×44 runtime
  destinations (`app/visual-inventory.mjs:432`; runtime draw at
  `app/trash-dash-game.tsx:2515-2525`).
- `sprinkler-water` records all four committed `sprinkler-spray` cells and
  four 120×96 destinations (`app/visual-inventory.mjs:377`; runtime draw at
  `app/trash-dash-game.tsx:2492-2502`). No expanded or dirty prop manifest is
  imported.
- The alpha audit compares `{ id, state, frame, source, destination }` for
  every measured mismatch against the literal immutable
  `MEASURED_RUNTIME_DISTORTION_FRAMES` list
  (`tests/visual-asset-integrity.test.mjs:121-151`,
  `app/visual-inventory.mjs:474-521`). An added, removed, re-cropped, or
  re-dimensioned distorted frame changes that exact set and fails the test.

### C1 — PASS: the three acorn consumers remain distinct

The source prop, ordinary bin lid, and Brutus rolling can retain their own
records and runtime sizes: four 44×44 source-prop destinations, four 34×34
ordinary-lid destinations, and one 42×42 rolling-can destination
(`app/visual-inventory.mjs:429-436`; projectile draw at
`app/trash-dash-game.tsx:2567-2579`).

## Important

### I1 — PASS: Brutus visual platforms are no longer hidden by the tiled-surface exemption

Both `LEVEL_TWO.surfaces` records carrying `visual` are generated as separate
fixed-aspect inventory records with their own 128×128 source cell and measured
104×96 runtime destination (`app/level-two.mjs:51-52`,
`app/visual-inventory.mjs:291-327`). The runtime uses that exact 104×96
rectangle through `levelTwoPlatformDrawRect`
(`app/level-two-props.mjs:35-43`; `app/trash-dash-game.tsx:2386-2397`). Both
known non-uniform transforms are explicitly routed to `VIS-007`
(`app/visual-inventory.mjs:503-504`).

The renderer-family regression requires the platform family to equal the
current committed `LEVEL_TWO.surfaces.filter(({ visual }) => visual)` set and
requires every asset-backed inventory projectile/effect to be bound by a draw
family (`tests/visual-inventory.test.mjs:80-90`). This uses committed baseline
definitions only; the clean archive also passed the regression that prohibits
optional future prop/render-metric imports.

## Minor

None.

## Deliberately outstanding, not findings

The frame-level records still expose known `VIS-005`, `VIS-006`, and `VIS-007`
distortions. Their Task 3, Task 4, and prop/runtime owners remain correctly
routed; this review does not require their runtime repairs.

## Verification evidence

- `git diff --check aa638a2 b7d40b0` and `git show --check b7d40b0` passed.
- Archived-clean focused matrix passed: 44 tests, 0 failures:

  ```text
  node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs tests/visual-inventory.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/level-two-props.test.mjs tests/boss-atlas.test.mjs tests/brutus-atlas.test.mjs
  ```

- Archived-clean `npm test` passed: 192 tests, 0 failures (including a fresh
  production build).
- A separate static archived-state assertion matched both four-frame runtime
  tables, each platform's source/destination and `VIS-007` route, and every
  asset-backed projectile/effect record to the draw-family manifest.
- Before staging this report, `git diff --cached --name-status` was empty.
  The shared worktree's existing dirty and untracked user files were not used,
  staged, modified, or included in this review commit.
