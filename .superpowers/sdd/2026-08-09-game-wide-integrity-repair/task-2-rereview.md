# Task 2 Fix Round 1 re-review — render contracts

**Verdict: FAIL**

Reviewed only the original C1/C2/I1/M1 findings and regressions introduced by
the fixes in `f455ea1..6a82e72`. The review used an archive of commit `6a82e72`,
not the dirty shared worktree; separately owned Level 2 prop/runtime changes
were neither required nor assessed as part of this task.

## Critical

### C1 — FAIL: most fixed-aspect inventory records are no longer checked against source or runtime geometry

`tests/visual-asset-integrity.test.mjs:28-29` returns no source geometry for a
record without `sourceRects`. The purported complete-inventory assertion at
`tests/visual-asset-integrity.test.mjs:103-123` consequently calls
`validateAspectRatio` only inside the `sourceRects` loop at lines 108-114.
Only five of the 33 non-exempt fixed-aspect records have source rectangles in
this commit; 28 are silently skipped.

This leaves the original output-shaped metadata intact and unvalidated. For
example, player `visibleSourceSize` is derived from `drawWidth`/`drawHeight`
at `app/visual-inventory.mjs:120-148`; Level 1 enemy visible source and
destination values are both the runtime `drawW`/`drawH` at lines 159-175; and
the same pattern remains for Level 2 enemies at lines 192-207. Those are
runtime-output values, not measured source/alpha geometry, and they have no
`sourceRects` for the new test to inspect.

Restore a complete source-to-runtime mapping for every non-exempt fixed-aspect
record (measured source/visible rectangle plus authoritative destination), and
make the complete-inventory test fail when either is absent. Do not treat the
legacy dirty Level 2 prop changes as the remedy for this gap.

## Important

### I1 — FAIL: renderer coverage is still overclaimed and misses a concrete runtime destination mismatch

The test name at `tests/visual-inventory.test.mjs:61` says it covers “every
contract-owned runtime family,” but lines 62-69 merely require five manually
chosen IDs. It does not enumerate or bind runtime draw paths to inventory
records.

One missed draw path is the bin-lid renderer at
`app/trash-dash-game.tsx:2562-2579`. A Brutus can is created as 32×32 at
`app/trash-dash-game.tsx:1595-1605` and is rendered as `max(w, h) + 10`, or
42×42. The inventory instead declares `rolling-can` as 34×34 at
`app/visual-inventory.mjs:342-344`. Likewise, the ordinary 28×10 lid is drawn
at 34×34 through that same renderer, while the `acorn` record declares a
28×28 rendered size at lines 338-341. Neither record has `sourceRects`, so
the new fixed-aspect test also skips both.

The split prop records themselves are correct for the committed renderer:
`app/visual-inventory.mjs:291-298` records the 84×112, 120×96, and 72×108
legacy destinations, and `tests/visual-asset-integrity.test.mjs:125-136`
asserts their three expected distortion diagnostics without importing later
prop states. The remaining failure is the unsupported claim of complete
renderer coverage, not a request to absorb the separately owned prop repair.

## Minor

No new minor findings.

## Resolved original findings

- **C2 — PASS.** The committed inventory no longer imports the optional
  `LEVEL_TWO_ENEMY_RENDER` or lamp-post export
  (`app/visual-inventory.mjs:1-10`; regression at
  `tests/visual-asset-integrity.test.mjs:138-143`). A clean `6a82e72` archive
  passed the focused 27-test matrix and the full `npm test` suite (192 tests),
  so this range does not depend on the dirty future manifests.
- **M1 — PASS.** `cloneAndFreeze` recursively freezes arrays and objects at
  `app/visual-inventory.mjs:24-28`, and `makeRecord` applies it to native,
  visible-source, rendered, and source-rectangle geometry at lines 61-91.
  The immutable-source regression is at
  `tests/visual-asset-integrity.test.mjs:145-170`; direct checks confirmed the
  dumpster record, nested holy-frame array/cell, and contract bounds are
  frozen.

## Dumpster verification

The dumpster-specific repair is supported. The sealed atlas cell measures
163×176 nontransparent pixels, and the remaining cells measure 160–166×176;
all share the source baseline at row 183. Its immutable inventory states and
180×180 destination are at `app/visual-inventory.mjs:312-336`; the runtime
uses the same constants and a bottom-grounded rectangle at
`app/dumpster-render.mjs:37-43` and
`app/trash-dash-game.tsx:2411-2452`. The alpha/source test at
`tests/visual-asset-integrity.test.mjs:79-101` and the state/atlas tests pass.
The committed 1280×720 evidence
`docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/task2-dumpster-victory-1280x720.png`
visibly shows the uniformly proportioned dumpster grounded at the victory
route, matching the audit entry at `docs/visual-audit.md:322-353`.

## Verification

- `git diff --check f455ea1..6a82e72` — PASS.
- Clean archived `6a82e72`: focused visual-contract, asset-integrity,
  inventory, and dumpster-state matrix — PASS (27/27).
- Clean archived `6a82e72`: `npm test` — PASS (192/192; build completed).
