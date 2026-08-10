# Final fix-wave rereview

**Verdict: FAIL**

Scope was limited to the two Important findings in `final-review.md`, using
fix commits `746364d` and `66e0e43`. No broad branch review or package-wide
gate was repeated.

## Finding dispositions

### I1 — Terrier stable sit, nonfatal hit return, and distinct impact lifecycle

**PARTIALLY ADDRESSED — one production integration defect remains.**

Addressed portions:

- `app/level-two-enemies.mjs:12-14,145-159` now owns an explicit stable `sit`
  behavior. It holds with zero velocity outside aggro range, wakes through a
  local one-shot, and the charge path returns to sit when the player leaves
  range.
- `app/trash-dash-game.tsx:621,1568-1586` gives the terrier two HP and routes
  the survivable first hit through `beginLevelTwoEnemyDamageReaction`.
  `app/level-two-enemies.mjs:182-190,423-439` then owns the nonfatal
  `hit → recover → same-facing charge` path, while fatal damage retains the
  complete hit/defeat presentation.
- `app/level-two-enemies.mjs:345-350,389-392` gives sit, wake, impact, and hit
  explicit, distinct cell ownership. The impact cells are 0–1 and damage-hit
  cells are 2–3 in the same normalized row; they are not the same runtime
  state.
- The canonical draw helper remains one state- and facing-invariant 82×82
  bottom-center destination (`app/level-two-enemies.mjs:32-60`). The focused
  geometry/state suite passed 35/35.

Open production defect:

- `updateTerrier` records the required reverse direction after wall contact as
  `next.resumeFacing` (`app/level-two-enemies.mjs:156-174`) and recovery later
  consumes `terrier.resumeFacing` (`app/level-two-enemies.mjs:187-190`). The
  production integration at `app/trash-dash-game.tsx:2001-2027` applies the
  behavior transition and copies `x`, `y`, `vx`, spray state, phase, and facing,
  but never copies `next.resumeFacing`. Consequently the wall-impact path loses
  the reversal before recovery and charges back in the original direction.

  A narrow runtime-equivalent probe produced:

  ```text
  impact: nextResumeFacing=-1, productionResumeFacing=null, facing=1
  recover: productionResumeFacing=null, facing=1
  charge: facing=1, vx=420
  ```

  The pure helper assertion at
  `tests/terrier-animation-integrity.test.mjs:195-209` passes because it feeds
  the complete returned object directly into the next helper call; it does not
  exercise the production field-copy boundary. Route `resumeFacing` through
  that actual boundary (preferably by applying the complete behavior result or
  explicitly owning the field) and add a production-integration regression.

### I2 — Obsolete sprinkler PASS in the living visual audit

**ADDRESSED.**

`docs/visual-audit.md:61-99` now calls VIS-001 “Sprinkler feature removal,”
states that the feature is removed in V2, enumerates the deleted sprite,
effect, emitter, placement, collision, hazard, audio/configuration, and boss
paths, and labels the old 2026-08-09 screenshots as superseded history. It also
truthfully keeps player traversal through the former location as
`CANNOT VERIFY` (`docs/visual-audit.md:84-93`). The old body/water/emitter
implementation is no longer presented as current PASS behavior.

## Focused verification

- `node --test tests/terrier-animation-integrity.test.mjs tests/level-two-enemies.test.mjs`
  — 35 passed, 0 failed.
- Read-only runtime-equivalent impact integration probe — reproduced loss of
  `resumeFacing` at the production field-copy boundary.
- No source atlas or destination-geometry regression found in the scoped diff.
- No new runtime/browser PASS is claimed; the deferred normal-play evidence
  remains `CANNOT VERIFY` exactly as documented.

## Assessment

The sprinkler audit finding is closed. The terrier finding is not yet closed:
stable sit and nonfatal damage are now real, but the distinct wall-impact
lifecycle is not correctly wired through production. One scoped code/test fix
is still required before this fix wave can pass rereview.
