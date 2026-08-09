# Task 2 implementation review — shared render contracts

**Verdict: FAIL**

Reviewed `b9a8cba..f21692d` against the approved design, Task 2 plan and
brief. This review did not modify implementation files.

## Critical findings

### C1 — The aspect test compares output-shaped metadata, not the source frame and actual draw destination

`tests/visual-asset-integrity.test.mjs:16-22` takes
`visibleSourceSize` in preference to native/source geometry, and lines 54-76
compare that declaration only with another inventory declaration. The Task 2
change then supplies identical source and destination values for whole
families, for example players at `app/visual-inventory.mjs:111-129`, Level 1
and Level 2 enemies at lines 150-190, bosses at lines 193-207, and props at
lines 252-270. The review diagnostic printed identical pairs for sprinkler
(`132x96`), hydrant (`144x96`), both bosses, both players, and tires.

This hides real renderer geometry in the reviewed commit. Its prop atlas
defines each sprite rectangle as `128x128` at
`app/level-two-props.mjs:10-20`, while the runtime draws the sprinkler water
at `120x96` and the hydrant body at `72x108` in
`app/trash-dash-game.tsx:2492-2502` and `2531-2541`. The inventory instead
declares sprinkler `132x96` and hydrant `144x96` as both visible *source* and
rendered geometry (`app/visual-inventory.mjs:253-259`), neither of which is
the reviewed runtime destination. Directly applying the new validator to the
actual `128x128` source and those destinations returns the required mismatch
diagnostics; the inventory test reports green solely because its substituted
metadata is self-consistent.

This violates the Task 2 requirement to derive source aspect from declared
visible/native frame geometry and destination aspect from rendered geometry,
and the design rule prohibiting independently scaled axes. Split bodies and
effects into truthful records, derive or validate source alpha/crop bounds and
actual shared draw rectangles, then add a regression that fails when either
axis changes independently.

### C2 — The committed inventory references prop states that do not exist in that commit

At `f21692d`, `app/visual-inventory.mjs:261-264` reads
`sprinkler-start`, `sprinkler-stop`, `hydrant-idle`, `hydrant-build`,
`hydrant-spray`, and `hydrant-recover`. The same commit's
`app/level-two-props.mjs:12-21` exports only `sprinkler-idle`,
`sprinkler-spray`, and `hydrant`. Consequently the `undefined` entries reach
`validateImplementedVisualInventory` through
`app/visual-inventory.mjs:350-362`, which reads `animation.row` and
`animation.frames`; `tests/visual-inventory.test.mjs:61-63` invokes that
validator as part of the full suite.

The later dirty worktree supplies those props, which explains the fresh
focused run passing today, but `f21692d` is not self-contained and cannot
support its report's claim that `npm test` passed. Commit the necessary prop
manifest/source changes with their ownership task, or do not reference their
future states in Task 2; then verify from a clean checkout of the commit.

## Important findings

### I1 — The claimed complete inventory omits rendered game bodies, including the victory dumpster

`IMPLEMENTED_VISUAL_INVENTORY` is assembled only from the families at
`app/visual-inventory.mjs:302-305`; it has no dumpster record. Yet the runtime
draws its `192x192` atlas frames at a grounded `220x180` destination in
`app/trash-dash-game.tsx:2411-2452`, with the dimensions defined by
`app/dumpster-render.mjs:6-9,37-43`. The coverage assertion in
`tests/visual-inventory.test.mjs:47-59` checks aggregate categories and actor
rosters only, and `tests/visual-asset-integrity.test.mjs:24-76` iterates only
the already-incomplete inventory.

The dumpster's source rectangle, aspect, anchor, states, and crossfade are
therefore outside the new contract. Add it (and similarly account for every
draw path rather than testing a category sample) before describing this as the
complete canonical inventory.

## Minor findings

### M1 — New source and destination geometry are mutable despite being contract authority

`makeRecord` shallow-freezes the record at
`app/visual-inventory.mjs:55-82`, but leaves the newly added
`visibleSourceSize` and pre-existing `renderedSize` objects mutable. The
review check confirmed a sprinkler record is frozen while both nested geometry
objects are not. A consumer can therefore alter the exact inputs to the
aspect validator after import. Freeze or clone-and-freeze those nested values
in `makeRecord`, and add an immutability assertion alongside the route
immutability coverage.

## Validator and verification assessment

`validateAspectRatio` and `validateVisibleAnchor` are otherwise pure and
return stable strings. Their `0.01` aspect tolerance and two-pixel anchor
tolerance agree with the stated Task 2 constants. The focused current-worktree
matrix was run fresh and passed 39/39, but it is not evidence that the
historical implementation commit passes in isolation because the shared
worktree contains later uncommitted prop changes.

The Task 2 brief conditionally allows skipping a localhost revisit when no
runtime renderer, atlas, builder, asset, or draw call changes. That condition
is procedurally met by the five-file commit, but the omission cannot validate
the corrected source/visible/destination assertions above; the audit claims
are unsupported until those values are measured against the actual frame and
draw path.
