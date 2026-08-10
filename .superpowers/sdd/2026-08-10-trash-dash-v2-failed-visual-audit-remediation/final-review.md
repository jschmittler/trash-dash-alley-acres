# Final whole-branch review — V2 failed visual audit remediation

**Verdict: FAIL**

Reviewed `b81f4a5..e32288e` against the authoritative failed-acceptance
request, implementation plan, Task 1–6 briefs/reports/reviews, canonical
project visual skills and references, generated assets/contact sheets,
runtime evidence, final report, visual audit, and the integrated source/test
contracts.

## Spec compliance

- **Issues found:** the terrier lifecycle does not implement the requested
  stable `SIT` state or the required locomotion-to-sit and nonfatal
  hit-to-locomotion transitions; the canonical visual audit also preserves a
  contradictory current-state account of the deleted sprinkler feature.
- **Correct release disposition:** `INCOMPLETE` is the only truthful current
  disposition. The required uninterrupted Level 1 → Level 2 campaign, strict
  terrier and Brutus lifecycle observations, former-sprinkler traversal, and
  twelve campaign screenshots were not completed. Static fixtures and tests
  cannot upgrade those observations to PASS under the authoritative request or
  `.skills/visual-qa/SKILL.md`.

## Strengths

- The branch makes substantial systemic repairs rather than screenshot-only
  patches: fixed-aspect destinations, shared player and enemy draw helpers,
  deterministic atlas builders, alpha-edge checks, stable bottom-center
  anchors, explicit boss-prop identity, and occupied-footprint validation are
  all integrated into production owners.
- The loose acorn pile, residential galvanized can, cleaned lamp, canonical
  wooden crates, single hydrant owner, uniformly scaled dumpster, and
  normalized Jimothy victory source are supported by coherent source,
  runtime, inventory, builder, and mutation-sensitive test contracts.
- Task 6 did not counterfeit the missing campaign evidence with fixture URLs.
  The final report clearly records the input limitation, one ordinary-gameplay
  screenshot, empty same-tab warning/error logs, the exact deferred probes,
  and a do-not-publish decision.
- Native inspection of the committed prop and lamp contact sheets found the
  intended hard-alpha assets and no reintroduced sprinkler body/water cells.
  The Jimothy before/during captures use the same camera, destination,
  collision, and ground anchor.

## Issues

### Critical (must fix)

None.

### Important (should fix)

#### I1 — The terrier still has no stable sit state or required hit-return lifecycle

`app/level-two-enemies.mjs:12,129-175,328-332,369-372` declares and executes
only `sleep → wake → charge → impact → recover → charge`. There is no `sit`
behavior state, no stable seated hold, and no transition from locomotion back
to sitting. Player damage follows `beginLevelTwoEnemyHit`, whose production
owner marks the enemy `defeated`; it therefore cannot exercise the required
`run → hit → run` return. The focused regression at
`tests/terrier-animation-integrity.test.mjs:214-244` explicitly locks in three
`sleep/wake/charge/impact/recover/charge` cycles and finishes in `charge`, so it
does not test the authoritative `run → sit`, `sit → run`, or `run → hit → run`
requirements.

A focused production-state probe confirmed the only reachable ordinary states
over repeated obstacle cycles are `sleep`, `wake`, `charge`, `impact`, and
`recover`, ending in `charge`. Calling impact/recovery “sit/hit” in reports does
not create a stable seated state or a damage-return transition. Add explicit
state ownership and intentional art/timing for the required sit and hit-return
paths (or obtain an explicit design change), then test the actual production
transitions and verify them repeatedly in normal gameplay.

#### I2 — The living visual audit contradicts the integrated sprinkler removal

`docs/visual-audit.md:25-59` correctly records the V2 gate as `INCOMPLETE` and
the former sprinkler collision area as unverified, but
`docs/visual-audit.md:61-108` immediately marks “Sprinkler rendering” PASS and
describes the current fix as a shipped body plus water-only start/spray/stop
cells, emitter metadata, and successful runtime water verification. The
integrated branch deliberately deletes those cells, emitters, placements,
hazards, audio/config paths, and runtime branches. This is not merely historical
wording: it is presented under current “Known issues” with a PASS status and
can direct future project work to preserve or recreate the removed feature.

Supersede that entry with the V2 removal disposition, explicitly mark the old
body/effect solution as historical, and keep only the current removal evidence
and remaining normal-traversal limitation. The canonical audit must have one
truthful current contract.

### Minor (nice to have)

None.

## Documented CANNOT VERIFY limitations (not additional findings)

- Continuous Jimothy campaign traversal from Level 1 through Level 2.
- Player traversal through every former sprinkler location, including the
  absence of invisible collision, hazard, push, effect, or audio.
- Three complete final-code terrier cycles in both facings, including
  consecutive transition frames and the damage path.
- Normal Brutus entry, death/retry, checkpoint recovery, phase changes,
  defeat, exit, and re-entry with one hydrant throughout.
- Live collision/jump behavior on both canonical Brutus crates.
- Campaign-derived post-boss composition and Jimothy pre-victory/victory
  comparison.
- The twelve exact numbered screenshots and quick additional-resolution
  regression.

These are acceptance blockers by explicit specification. The final report's
`INCOMPLETE — do not publish` decision is therefore correct even after the two
Important findings above are repaired; it must remain until the normal runtime
verification succeeds.

## Focused checks performed

- Read the complete whole-branch review package and inspected the integrated
  production owners for environment lifecycle, enemy playback, player drawing,
  boss entry, hydrant identity, crate/dumpster placement, and asset ownership.
- Inspected the committed Level 2 prop, lamp, and enemy contact sheets at native
  resolution, plus the Task 5 before/during victory captures and Task 6 normal
  campaign blocker capture.
- Ran a read-only production-state probe through repeated terrier obstacle
  cycles; reachable states were exactly
  `sleep,wake,charge,impact,recover`, with final state `charge`.
- Confirmed the final report contains only the blocker screenshot in the
  required campaign screenshot directory and does not claim the twelve missing
  captures.
- Did not repeat the package-wide suites already run in the clean Task 6
  snapshot; no reported test failure or new warning was ignored.

## Assessment

**Branch quality: Needs fixes.** The integrated asset, rendering, and arena
work is materially stronger, and the release status is honestly `INCOMPLETE`,
but the terrier state machine misses explicit acceptance behavior and the
canonical audit describes mutually exclusive sprinkler implementations as
current truth. Both should be corrected before the remaining normal-gameplay
acceptance pass.
