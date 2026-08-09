# Task 3 report — Trashy and Jimothy state geometry

## Status

`DONE_WITH_CONCERNS` — deterministic/player-contract evidence is green,
including the Round-1 source-state and pit-defeat repairs; controller-attributed
normal-spawn idle verification passed, while keyboard-driven action and
both-facing runtime sequences remain `CANNOT VERIFY`.

## RED evidence

- Added the shared reachable-state contract before implementation. The focused
  player matrix failed because no shared atlas/envelope/facing contract existed.
- The source-alpha pass found complete, inset 192×192 cells, so no original art
  redraw was justified. It did find runtime registration defects: Trashy
  airborne/victory cells and Jimothy's copied concept cells did not share a
  baseline (Jimothy bottoms measured 106–179 against the required 184).
- The task's atlas assertions failed before the repair: Jimothy
  `small_idle:0` ended at source row 170 instead of 183, and the legacy player
  manifests used unequal destination axes such as 142×112 tail swipe.
- Round-1 RED: focused source identity regressions could not import a Jimothy
  semantic-source manifest, and pit-presentation regressions could not import
  a terminal `small_defeat` sequence. Review also proved the old builder routed
  named land/defeat/victory and `large_glide` through incompatible legacy rows.

## GREEN implementation and measurements

- Added `PLAYER_ATLAS` plus a shared 184 baseline, derived `offsetY`, complete
  envelope metadata, and a right-authored / destination-center-flip contract.
- Normalized both deterministic builders by translating complete alpha poses to
  source baseline 184 without independent width/height scaling. The regenerated
  Trashy and Jimothy runtime/contact sheets preserve all populated cells and
  keep their visible bottoms at row 183.
- Converted every player state destination to a uniform square transform
  (82×82–140×140), removed the grounded-only renderer compensation, and removed
  resolved player entries from `MEASURED_RUNTIME_DISTORTION_FRAMES`.
- Two consecutive rebuilds produced identical SHA-256 values for all five
  player motion/contact/selection artifacts.
- Round-1 authored four coherent Jimothy-specific pixel-art rows — land,
  defeat, victory, and large glide — against a flat chroma key, then removed
  that key with the deterministic chroma helper. The source-state manifest is
  consumed directly by the builder and regression-tested; small/large land and
  victory share only their semantically matching row, while `large_glide`
  uniquely owns the canopy-glider row.
- Round-1 terminal pit falls now retain the immediate one-paw loss semantics
  but commit the selected character's `small_defeat` (four frames at its local
  FPS) before gameover. Hurt, shrink, and respawn remain cleared on that path.
- Round-1 repeat-build SHA-256 values matched for Trashy motion/contact and
  Jimothy motion/contact/private atlas: `cd5712057…`, `4589a51e…`, and
  `64d707831…` respectively (Jimothy's three identical atlas copies share the
  final hash).

## Verification

- RED matrix: `node --test tests/player-animation.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/character-gameplay.test.mjs` — 3 failures (missing shared atlas export and two baseline violations).
- GREEN focused player, pit-state, and Task 2 visual-contract matrix — 51 passed, 0 failed.
- `npm run validate:skills` — passed.
- `npm run lint` — 0 errors; one pre-existing Next `<img>` performance warning.
- `npm test` — 253 passed, 0 failed; production build completed.
- Static contact-sheet QA: inspected both regenerated sheets at native size;
  complete silhouettes stay inset and share the baseline. Both-facing behavior
  is covered by the destination-center flip contract and regression.
- Controller-attributed browser QA: at 1280×720 DPR 2, entered
  `/?backgroundTest=woodland&visualQa=task3-trashy-spawn&debugVisuals=1` and
  `/?backgroundTest=woodland&visualQa=task3-jimothy-spawn&debugVisuals=1`
  through title/character confirmation. Both `small_idle` characters were
  visibly grounded inside debug bounds; browser warning/error logs were empty.
  Evidence: `after/task3-trashy-idle-1280x720.png` and
  `after/task3-jimothy-idle-1280x720.png` in the Task 3 report evidence folder.
- Controller note: Jimothy is briefly hidden during the intended taco/recovery
  hurt/invulnerability flash, then renders normally; this is not an atlas
  failure.

## Visual QA ledger

| Item | Result |
| --- | --- |
| Source alpha/contact-sheet inspection | PASS — complete inset frames; no source redraw needed |
| Atlas bounds, one-shot completion, envelopes, baselines, facings | PASS — automated |
| VIS-005 measured source/destination/anchor checks | PASS — zero remaining player mismatch entries |
| Controller normal-spawn idle route, Trashy and Jimothy | PASS — 1280×720 DPR 2 debug-bound screenshots; no browser warning/error logs |
| Keyboard-driven actions and repeated both-facing runtime sequences | CANNOT VERIFY — keyboard action automation unavailable |
| Jimothy source-state contact-sheet repair | PASS — authored land/defeat/victory/glide rows are distinct, alpha-clean, baseline-normalized, and visually inspected |
| Terminal pit-defeat state/timer | PASS — pure transition tests prove a four-frame `small_defeat` before gameover while preserving one-paw instant death |

`docs/visual-audit.md` narrows VIS-005 accordingly and retains the complete
runtime route/state matrix for a browser-equipped follow-up.

## Scope and self-review

The commits contain only Task 3 player manifests/profiles, the exact renderer
compensation and pit-sequence hunks, deterministic player builders and
generated outputs, focused tests, visual-inventory/audit evidence, and this
report. Existing dirty Level 1/Level 2 and shared renderer work was not staged
or altered. No unrelated untracked Jimothy sources/documentation were included.

## Commit

`fix: normalize playable character states` (this report is included in that
scoped commit; final hash is supplied in the task handoff).
