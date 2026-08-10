# Task 5 re-review — world placement, supports, collision, and composition

Verdict: **PASS**

Reviewed repair range: `c85d981..061f9c2`

## Re-reviewed findings

### C1 — clean, self-contained verification: resolved

The exact `061f9c2` tree was exported with `git archive`, given only the
repository's dependency directory, and tested outside the dirty worktree.
`app/level-two-props.mjs` now owns the body, emitter, and effect geometry
exports consumed by the placement suite. The expanded focused matrix passes
**70/70**, the production build passes, and the package suite passes
**206/206**. No unstaged helper is required.

### I1 — central placement and level-specific scenery reach production: resolved

The production `makeEnemy` path looks up the actor's canonical visual contract
and calls `resolveEnemyWorldPatrol` with the complete placement footprint,
named supports or flight bands, collision width, and authored patrol. The
resolver clamps both grounded and flying envelopes and returns `null` when no
legal interval exists. `createLevelRuntime` and direct encounter-route setup
both omit that `null` result rather than constructing an invalid actor.

The render path calls `sceneryForLevel(world.levelId)` and the prior global
six-item scenery array is absent. This makes the level-specific scenery data
used by placement/composition validation the same source rendered at runtime.

### I2 — rolling relationship coverage: resolved

The 960px/120px sweep now operates on expanded scenery, pickup-hover, and
complete encounter-motion footprints. The validator rejects invalid route
bounds, missing boundary landings, missing or out-of-route rewards, unsupported
or off-world pickup hover envelopes, bypass encounters outside their route,
large-enemy motion-envelope overlap, foreground scenery at gameplay depth,
rolling density failures, repeated hero props, and more than two ordinary
encounter introductions.

Negative fixtures exercise route bounds, landing targets, pickup reachability,
large-motion isolation, and draw-order readability. The source-order assertion
ties scenery to the production render order behind pickups and actors. A stale
`spawnX` fixture proves rolling encounter pacing follows the motion-envelope
center instead. Additional clean-tree mutation probes confirmed that three
hero props trigger rolling density errors, an off-world pickup triggers its
support/reachability error, and moving a patrol envelope while leaving
`spawnX` unchanged changes the rolling encounter membership.

## Verification performed

- Inspected the exact committed repair diff and production consumers.
- Clean archive expanded focused matrix: **70/70 PASS**.
- Clean archive `npm run build`: **PASS**.
- Clean archive `npm test`: **206/206 PASS**.
- Direct mutation probes: rolling density, pickup reachability, and
  motion-envelope pacing all rejected/changed as intended.
- `git diff --check c85d981..061f9c2`: **PASS**.

## Remaining Critical/Important findings

None.

Browser traversal remains the explicitly recorded **CANNOT VERIFY** boundary
from the implementation report; this re-review does not convert deterministic
coverage into a visual-runtime claim.
