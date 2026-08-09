# Task 2 Fix Round 2 re-review — source-to-runtime geometry coverage

**Verdict: FAIL**

Reviewed only the outstanding Task 2 C1/I1 contract coverage and regressions
in `af8bd76..c144d9e`, against an archived clean checkout of `c144d9e`.
The shared worktree has unrelated dirty follow-on work; none of it was used as
evidence for this verdict.

## Critical

### C1 — FAIL: the contract still silently drops runtime animation frames

`bin-lid-source` is rendered with the four-frame looping `acorn` animation:
`app/trash-dash-game.tsx:2515-2525` calls
`levelTwoPropFrame("acorn", world.elapsed + item.x * 0.001)`, and
`app/level-two-props.mjs:13` declares four `acorn` frames. Its inventory
record instead declares one `idle` crop and one destination at
`app/visual-inventory.mjs:390-392`. Therefore frames 1–3 have neither an
authoritative source crop nor destination geometry, although the focused
matrix passes.

The same omission exists for the four-frame `sprinkler-spray` runtime path:
`app/trash-dash-game.tsx:2492-2502` selects that animation, whose four frames
are declared at `app/level-two-props.mjs:19`, while
`app/visual-inventory.mjs:335` lists only the first source cell under one
`sprinkler-water:idle` mapping. This is a contract-coverage defect, not a
request to repair the separately owned prop distortion itself. Task 2 must
record and validate all actual source/destination frames, including their
owner/issue routing.

Moreover, the measured-distortion set in
`tests/visual-asset-integrity.test.mjs:121-140` collapses each detected frame
to `${record.id}:${state}`. A new distortion in a second frame of an already
allowlisted state leaves the set unchanged and passes. The allowlist must use
an exact frame identity (or an equivalent per-frame diagnostic), so both a
missing frame and a newly distorted frame fail deterministically.

### C1 — FAIL: `bin-lid-source` is not yet truthful, while the two projectile
records are

The requested projectile split is partially correct: the clean commit maps
`ordinary-bin-lid` to four `acorn` crops and four 34×34 destinations
(`app/visual-inventory.mjs:387-389`), and maps `brutus-rolling-can` to its
separate `rolling-can` crop and a 42×42 destination (`:393-395`). The runtime
uses those sizes at `app/trash-dash-game.tsx:2567-2579`.

However, the static `bin-lid-source` visual is a third consumer of the same
animated `acorn` family and only maps frame zero (above). Calling it a source
does not make its remaining three rendered frames exempt. This fails the
required frame-count/source-truthfulness contract.

## Important

### I1 — FAIL: draw-family coverage is still incomplete and masks the two
rendered Brutus platforms

`LEVEL_TWO.surfaces` has two visual platform sprites,
`brutus-platform-left` and `brutus-platform-right`
(`app/level-two.mjs:51-52`). The renderer feeds each through
`levelTwoPropFrame(platform.visual, world.elapsed)` and a fixed 104×96
destination (`app/trash-dash-game.tsx:2386-2397`;
`app/level-two-props.mjs:35-43`). Neither platform is named in
`RUNTIME_DRAW_FAMILY_MANIFEST` (`app/visual-inventory.mjs:416-429`), and
their surface records carry no source rectangles or runtime destinations
because the generic surface constructor marks them `NINE_SLICE_OR_TILE`
(`app/visual-inventory.mjs:276-287`). These are single atlas-cell sprite
draws, not tiled/nine-slice rendering; that generic exemption masks their
128×128 → 104×96 axis distortion.

The manifest test only asserts a hand-selected subset of family IDs
(`tests/visual-inventory.test.mjs:62-72`), so it cannot discover either
platform path. It needs an exhaustive binding from actual renderer source
families/visual surface IDs to records, and the two single-cell sprites need
their true fixed-aspect policy and source/destination mappings (or an
explicit, narrowly owned VIS issue if a distortion is intentionally pending).

## Minor

None.

## Confirmed / not findings

- The known player, enemy, and boss state distortions are explicitly routed to
  `VIS-005` (Task 3) and `VIS-006` (Task 4) in `docs/visual-audit.md`; this
  review does not require Task 2 to repair those actor renderers.
- `ordinary-bin-lid` and `brutus-rolling-can` are separate records with the
  committed 34×34 and 42×42 destinations, respectively. The problem is the
  remaining animated `bin-lid-source` consumer, not a conflation of those two
  projectile records.
- The prop/pickup residual issue is linked to `VIS-007`; the finding above is
  limited to Task 2 failing to enumerate and detect its actual frames.

## Verification evidence

- `git diff --check af8bd76 c144d9e` — PASS.
- Archived clean `c144d9e` focused matrix:

  ```text
  node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs tests/visual-inventory.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/level-two-props.test.mjs tests/boss-atlas.test.mjs tests/brutus-atlas.test.mjs
  41 tests passed; 0 failed
  ```

- Direct archived-state inventory/runtime comparison reproduced:

  ```text
  bin-lid-source source={idle:1} destination={idle:1}; runtime acorn frames=4
  sprinkler-water source={idle:1} destination={idle:1}; runtime sprinkler-spray frames=4
  ordinary-bin-lid source={active:4} destination={active:4}
  brutus-rolling-can source={active:1} destination={active:1}
  brutus-platform-left/right policy=NINE_SLICE_OR_TILE sourceRects=null runtimeDestinations=null
  ```

The test suite validates the implementation's declared maps, but the static
renderer comparison above proves that those maps are not complete.
