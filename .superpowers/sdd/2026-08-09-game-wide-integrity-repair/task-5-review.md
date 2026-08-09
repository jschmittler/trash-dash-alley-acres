# Task 5 review — world placement, supports, collision, and composition

Verdict: **FAIL**

Reviewed commit range: `e1730f7..11cde46`

## Findings

### Critical — the scoped commit is not self-contained and its focused matrix fails from a clean checkout

`tests/world-placement.test.mjs:19-29` imports `hydrantDrawRect`,
`hydrantNozzleOrigin`, `hydrantWaterDrawRect`, `lampPostDrawRect`,
`sprinklerBodyDrawRect`, `sprinklerEmitterOrigin`, and
`sprinklerWaterDrawRect` from `app/level-two-props.mjs`. None of those exports
exist in commit `11cde46`; they are present only in unrelated, unstaged
worktree changes. A clean archive of `11cde46` fails before the placement test
can run:

```text
SyntaxError: The requested module '../app/level-two-props.mjs' does not provide an export named 'hydrantDrawRect'
tests 29; pass 28; fail 1
```

This contradicts the report's clean 45/45 and 270/270 claims and makes Task 5
unverifiable or non-reproducible outside the current dirty worktree. The Task 5
test/evidence must either use contracts that are actually included in the
scoped commit or include the required owned prerequisite through the approved
task boundary.

### Important — the new central placement contract does not drive the committed runtime

In the clean `11cde46` runtime, `app/trash-dash-game.tsx` imports neither
`app/world-placement.mjs` nor `app/world-scenery.mjs`. Enemy creation still
calls `createEnemyPatrol` with collision width only (`trash-dash-game.tsx` at
the committed lines 541-586), and scenery still draws the old global six-item
array in every level (committed lines 532-539 and 2381-2385). Consequently:

- `supportedPatrolInterval`, `supportedFlightInterval`, candidate rejection,
  full-envelope clamping, and safe omission are test-only helpers;
- patrol legality is achieved by manually narrowing authored endpoints rather
  than by the required central runtime resolver;
- the level-specific scenery supports validated by `SCENERY_BY_LEVEL` are not
  the scenery placements rendered by the scoped commit.

This leaves the systemic requirement unimplemented and allows runtime data to
diverge from the metadata the new tests bless. The central resolver and the
validated level-specific scenery source must be wired into the actual runtime
path (or the existing runtime resolver must be extended to consume the same
full-envelope contracts).

### Important — the rolling sweep does not enforce several required composition relationships

`validateRollingWorldComposition` (`app/world-scenery.mjs:198-225`) checks zone
continuity, whether route reward IDs exist, encounter-introduction count,
repeated hero props, and multiple large introductions. Although it places
expanded pickup and encounter footprints into each window, it never validates
those items against required routes, landing targets, pickup supports/reach,
foreground occlusion, or each other. It also counts groups by `spawnX` rather
than occupied/motion-envelope presence.

Two direct mutations demonstrate the missing assertions:

```text
move starter-trash-trail to x=999999 -> validateRollingWorldComposition(...) == []
move a route start/end to x=999999   -> validateRollingWorldComposition(...) == []
```

Thus the claimed rolling 960px/120px sweep does not satisfy the Task 5 gate for
pickup reachability, route clearance, landing targets, foreground occlusion,
or full-envelope density/isolation. Add relationship-aware rolling assertions
and negative fixtures for each required category; do not treat merely carrying
an item in `window.items` as validation.

## Verification performed

- Inspected exact diff `e1730f7..11cde46` and relevant runtime consumers.
- Read the Task 5 brief, approved design/plan, audit entry, and canonical
  Rendering / Asset Integrity, Environment Placement, Overlap Prevention, and
  Visual QA instructions and references.
- Clean archive focused command:
  `node --test tests/world-placement.test.mjs tests/world-composition.test.mjs tests/visual-spawn-envelope.test.mjs tests/enemy-surface.test.mjs tests/boss-arena.test.mjs tests/level-one-routes.test.mjs`
  — **FAIL**, module-instantiation error described above.
- Mutation probes for pickup reachability and route clearance — both incorrectly
  returned no composition errors.
- Browser behavior remains **CANNOT VERIFY** in this review; no runtime visual
  PASS is inferred.

## Scope preservation

The commit's changed paths are otherwise within the declared Task 5 file set,
and this review does not modify implementation or unrelated dirty work.
